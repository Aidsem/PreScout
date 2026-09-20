import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing } from "../theme/colors";
import {
  TacticalHeader,
  TacticalBadge,
} from "../components/TacticalComponents";
import { useTactical } from "../context/TacticalContext";
import { OpenRouteMap } from "../components/OpenRouteMap";
import { findPath } from "../utils/pathfinding";
import { ensurePath } from "../utils/pathMotion";
import { useRouteTravel } from "../hooks/useRouteTravel";
import { openScreen } from "../navigation/openScreen";
import {
  MapPoint,
  MarkerType,
  buildAirGrid,
  buildGroundGrid,
  gridToSvg,
  svgToGrid,
} from "../map/mapModel";
import { getOpenRoute, RouteCoordinate } from "../services/openRouteService";
import {
  DEFAULT_BOUNDS,
  MapProjection,
  createProjection,
  projectionFromBounds,
} from "../map/projection";
import { resolveDestination } from "../map/resolveDestination";
import { placeScanPeople, resolvePeopleCount, revealedCount } from "../map/scanPlan";

const issueCoordinates: Record<MarkerType, RouteCoordinate> = {
  drone: { latitude: 18.5324, longitude: 73.8464 },
  hazard: { latitude: 18.5188, longitude: 73.8624 },
  person: { latitude: 18.5108, longitude: 73.8752 },
  rover: { latitude: 18.4974, longitude: 73.8427 },
};

function buildRoadFallbackRoute(
  from: RouteCoordinate,
  to: RouteCoordinate,
  gridRoute: MapPoint[],
  projection: MapProjection,
): RouteCoordinate[] {
  const gridCoordinates = gridRoute.map(projection.toCoordinate);
  const midpoint = {
    latitude: (from.latitude + to.latitude) / 2,
    longitude: (from.longitude + to.longitude) / 2,
  };
  const latitudeOffset = Math.max(
    0.0015,
    Math.abs(to.latitude - from.latitude) * 0.18,
  );
  const longitudeOffset = Math.max(
    0.0015,
    Math.abs(to.longitude - from.longitude) * 0.12,
  );
  const roadWaypoints = [
    from,
    { latitude: midpoint.latitude + latitudeOffset, longitude: from.longitude },
    {
      latitude: midpoint.latitude + latitudeOffset,
      longitude: midpoint.longitude - longitudeOffset,
    },
    {
      latitude: midpoint.latitude - latitudeOffset,
      longitude: midpoint.longitude + longitudeOffset,
    },
    { latitude: to.latitude, longitude: midpoint.longitude + longitudeOffset },
    to,
  ];

  return gridCoordinates.length > 2
    ? [from, ...gridCoordinates, to]
    : roadWaypoints;
}

export const LiveMapScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const {
    telemetry,
    flightSimToken,
    incidents,
    assets,
    missionParams,
    dispatchIncident,
    latestDispatch,
    appendLog,
  } = useTactical();
  const [selectedMarker, setSelectedMarker] = useState<MarkerType>("drone");
  const [routing, setRouting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [dronePath, setDronePath] = useState<MapPoint[] | undefined>();
  const [robotPath, setRobotPath] = useState<MapPoint[] | undefined>();
  const [droneRoute, setDroneRoute] = useState<RouteCoordinate[]>();
  const [robotRoute, setRobotRoute] = useState<RouteCoordinate[]>();
  const [scanRoute, setScanRoute] = useState<RouteCoordinate[]>();
  const [detectedPeople, setDetectedPeople] = useState<
    Array<{ id: string; latitude: number; longitude: number }>
  >([]);
  const [pendingScanPeople, setPendingScanPeople] = useState<
    Array<{ id: string; latitude: number; longitude: number }>
  >([]);
  const [scanStarted, setScanStarted] = useState(false);
  const [incidentCoordinate, setIncidentCoordinate] =
    useState<RouteCoordinate>();
  const incidentCoordinateRef = useRef<RouteCoordinate | undefined>(undefined);
  incidentCoordinateRef.current = incidentCoordinate;
  const [activeIncidentId, setActiveIncidentId] = useState<string>();
  const activeIncident = useMemo(
    () => incidents.find((incident) => incident.id === activeIncidentId),
    [incidents, activeIncidentId],
  );
  const [focusCoordinate, setFocusCoordinate] = useState<RouteCoordinate>();
  const [projection, setProjection] = useState<MapProjection>(() =>
    projectionFromBounds(DEFAULT_BOUNDS),
  );

  const airGrid = useMemo(() => buildAirGrid(), []);
  const groundGrid = useMemo(() => buildGroundGrid(), []);
  const droneHomeCoordinate = issueCoordinates.drone;
  const roverHomeCoordinate = issueCoordinates.rover;
  const droneTravel = useRouteTravel(
    simulating ? droneRoute : undefined,
    droneRoute?.[0] ?? droneHomeCoordinate,
    70,
  );
  const scanTravel = useRouteTravel(
    simulating && scanRoute ? scanRoute : undefined,
    droneRoute?.[droneRoute.length - 1] ?? droneHomeCoordinate,
    55,
  );
  const roverTravel = useRouteTravel(
    simulating ? robotRoute : undefined,
    robotRoute?.[0] ?? roverHomeCoordinate,
    28,
  );
  const droneCoordinate = scanRoute
    ? scanTravel.position
    : droneTravel.position;
  const bothArrived =
    simulating &&
    (scanRoute ? scanTravel.arrived : droneTravel.arrived) &&
    roverTravel.arrived;

  useEffect(() => {
    if (
      !simulating ||
      !droneTravel.arrived ||
      scanStarted ||
      !droneRoute?.length
    )
      return;

    const center = droneRoute[droneRoute.length - 1];
    const side = 0.003;
    const route = [
      center,
      { latitude: center.latitude + side, longitude: center.longitude - side },
      { latitude: center.latitude + side, longitude: center.longitude + side },
      { latitude: center.latitude - side, longitude: center.longitude + side },
      { latitude: center.latitude - side, longitude: center.longitude - side },
      { latitude: center.latitude + side, longitude: center.longitude - side },
    ];
    const headcount = resolvePeopleCount(
      activeIncident?.type ?? "sar",
      activeIncident?.estimatedPeople,
    );
    const people = placeScanPeople(
      center,
      side,
      headcount,
      activeIncident?.id ?? `${center.latitude},${center.longitude}`,
    );
    setScanStarted(true);
    setScanRoute(route);
    setPendingScanPeople(people);
    setDetectedPeople([]);
    appendLog(
      "AI",
      `Drone scan started over a ${(side * 222).toFixed(0)}m square. ${
        activeIncident?.estimatedPeople
          ? `Reporter estimated ${activeIncident.estimatedPeople} affected.`
          : "Headcount unknown; sweeping for thermal signatures."
      }`,
      "info",
    );
  }, [
    activeIncident,
    appendLog,
    droneRoute,
    droneTravel.arrived,
    scanStarted,
    simulating,
  ]);

  useEffect(() => {
    if (!scanRoute || pendingScanPeople.length === 0 || !simulating) return;

    const revealCount = revealedCount(pendingScanPeople.length, scanTravel.progress);

    if (revealCount <= detectedPeople.length) return;
    const newlyDetected = pendingScanPeople.slice(
      detectedPeople.length,
      revealCount,
    );
    setDetectedPeople((current) => [...current, ...newlyDetected]);
    newlyDetected.forEach((person) => {
      appendLog(
        "AI",
        `${person.id} thermal signature detected at ${person.latitude.toFixed(6)}° N, ${person.longitude.toFixed(6)}° E.`,
        "alert",
      );
    });
  }, [
    appendLog,
    detectedPeople.length,
    pendingScanPeople,
    scanRoute,
    scanTravel.progress,
    simulating,
  ]);

  const computeRoutes = async (
    targetMarker: MarkerType,
    origins?: { drone?: RouteCoordinate; rover?: RouteCoordinate },
    destinationOverride?: RouteCoordinate,
    shouldSimulate = false,
  ) => {
    const destination = resolveDestination(
      targetMarker,
      destinationOverride,
      incidentCoordinateRef.current,
      issueCoordinates,
    );
    const nearestAvailableDrone = assets
      .filter((asset) => asset.type === "drone" && asset.status === "AVAILABLE")
      .sort((a, b) => {
        const aDistance = Math.hypot(
          a.homeCoordinates.lat - destination.latitude,
          a.homeCoordinates.lng - destination.longitude,
        );
        const bDistance = Math.hypot(
          b.homeCoordinates.lat - destination.latitude,
          b.homeCoordinates.lng - destination.longitude,
        );
        return aDistance - bDistance;
      })[0];
    const nearestAvailableRover = assets
      .filter((asset) => asset.type === "rover" && asset.status === "AVAILABLE")
      .sort((a, b) => {
        const aDistance = Math.hypot(
          a.homeCoordinates.lat - destination.latitude,
          a.homeCoordinates.lng - destination.longitude,
        );
        const bDistance = Math.hypot(
          b.homeCoordinates.lat - destination.latitude,
          b.homeCoordinates.lng - destination.longitude,
        );
        return aDistance - bDistance;
      })[0];
    const selectedDrone = assets.find(
      (asset) =>
        asset.id === missionParams.droneUnitId && asset.type === "drone",
    );
    const selectedRover = assets.find(
      (asset) =>
        asset.id === missionParams.roverUnitId && asset.type === "rover",
    );
    const droneOrigin =
      origins?.drone ??
      (selectedDrone
        ? {
            latitude: selectedDrone.homeCoordinates.lat,
            longitude: selectedDrone.homeCoordinates.lng,
          }
        : nearestAvailableDrone
          ? {
              latitude: nearestAvailableDrone.homeCoordinates.lat,
              longitude: nearestAvailableDrone.homeCoordinates.lng,
            }
          : issueCoordinates.drone);
    const roverOrigin =
      origins?.rover ??
      (selectedRover
        ? {
            latitude: selectedRover.homeCoordinates.lat,
            longitude: selectedRover.homeCoordinates.lng,
          }
        : nearestAvailableRover
          ? {
              latitude: nearestAvailableRover.homeCoordinates.lat,
              longitude: nearestAvailableRover.homeCoordinates.lng,
            }
          : issueCoordinates.rover);
    const nextProjection = createProjection([droneOrigin, roverOrigin, destination]);
    setProjection(nextProjection);
    const targetPoint = nextProjection.toPoint(destination);
    const dest = svgToGrid(targetPoint.x, targetPoint.y);
    const droneStart = nextProjection.toPoint(droneOrigin);
    const roverStart = nextProjection.toPoint(roverOrigin);
    const air = findPath(airGrid, svgToGrid(droneStart.x, droneStart.y), dest, {
      diagonal: true,
    });
    const ground = findPath(
      groundGrid,
      svgToGrid(roverStart.x, roverStart.y),
      dest,
      { diagonal: false },
    );

    setDronePath(
      ensurePath(
        air.map(([row, col]) => gridToSvg(row, col)),
        { x: droneStart.x, y: droneStart.y },
        targetPoint,
      ),
    );
    setRobotPath(
      ensurePath(
        ground.map(([row, col]) => gridToSvg(row, col)),
        { x: roverStart.x, y: roverStart.y },
        targetPoint,
      ),
    );
    setRouting(true);
    setSimulating(false);
    setScanStarted(false);
    setScanRoute(undefined);
    setDetectedPeople([]);
    setPendingScanPeople([]);
    setFocusCoordinate(undefined);

    setDroneRoute(undefined);
    setRobotRoute(undefined);
    try {
      // Aircraft travel direct; only the ground unit needs road-constrained routing.
      const groundRoute = await getOpenRoute(
        roverOrigin,
        destination,
        "driving-car",
      );
      setDroneRoute([droneOrigin, destination]);
      const fallbackRobotRoute = buildRoadFallbackRoute(
        roverOrigin,
        destination,
        ground.map(([row, col]) => gridToSvg(row, col)),
        nextProjection,
      );
      setRobotRoute(
        groundRoute && groundRoute.length >= 3
          ? groundRoute
          : fallbackRobotRoute,
      );
    } catch (error) {
      console.warn(
        "OpenRouteService road route unavailable; using local fallback.",
        error,
      );
      setDroneRoute([droneOrigin, destination]);
      setRobotRoute(
        buildRoadFallbackRoute(
          roverOrigin,
          destination,
          ground.map(([row, col]) => gridToSvg(row, col)),
          nextProjection,
        ),
      );
    }
    if (shouldSimulate) setSimulating(true);
  };

  useEffect(() => {
    const missionAssignment = route?.params?.missionAssignment;
    if (!missionAssignment) return;

    const assignedDrone = assets.find(
      (asset) =>
        asset.id === missionAssignment.droneUnitId && asset.type === "drone",
    );
    const assignedRover = assets.find(
      (asset) =>
        asset.id === missionAssignment.roverUnitId && asset.type === "rover",
    );
    setSelectedMarker("person");
    void computeRoutes(
      "person",
      {
        drone: assignedDrone
          ? {
              latitude: assignedDrone.homeCoordinates.lat,
              longitude: assignedDrone.homeCoordinates.lng,
            }
          : undefined,
        rover: assignedRover
          ? {
              latitude: assignedRover.homeCoordinates.lat,
              longitude: assignedRover.homeCoordinates.lng,
            }
          : undefined,
      },
      undefined,
      false,
    );
    appendLog(
      "NAV",
      `Mission preview loaded for ${missionAssignment.droneUnitId} and ${missionAssignment.roverUnitId}.`,
      "info",
    );
    navigation.setParams?.({ missionAssignment: undefined });
  }, [appendLog, assets, navigation, route?.params?.missionAssignment]);

  useEffect(() => {
    if (!flightSimToken) return;
    setSelectedMarker("person");
    void computeRoutes("person", undefined, undefined, true);
  }, [flightSimToken]);

  useEffect(() => {
    const focusDetection = route?.params?.focusDetection;
    if (
      !focusDetection ||
      !Number.isFinite(focusDetection.latitude) ||
      !Number.isFinite(focusDetection.longitude)
    ) {
      return;
    }

    const coordinate = {
      latitude: focusDetection.latitude,
      longitude: focusDetection.longitude,
    };
    setFocusCoordinate(coordinate);
    setSelectedMarker("person");
    setRouting(false);
    setSimulating(false);
    setScanStarted(false);
    setScanRoute(undefined);
    setPendingScanPeople([]);
    setDetectedPeople([
      {
        id: focusDetection.id || "FOCUSED-PERSON",
        ...coordinate,
      },
    ]);
    setIncidentCoordinate(undefined);
    setDronePath(undefined);
    setRobotPath(undefined);
    setDroneRoute(undefined);
    setRobotRoute(undefined);
    appendLog(
      "NAV",
      `Map focused on ${focusDetection.id || "detected person"}; response units held in place.`,
      "info",
    );
    navigation.setParams?.({ focusDetection: undefined });
  }, [appendLog, navigation, route?.params?.focusDetection]);

  useEffect(() => {
    if (
      !latestDispatch ||
      route?.params?.focusDetection ||
      route?.params?.missionAssignment
    )
      return;
    setSelectedMarker("person");
    const dispatchedCoordinate = {
      latitude: latestDispatch.incident.coordinates.lat,
      longitude: latestDispatch.incident.coordinates.lng,
    };
    setIncidentCoordinate(dispatchedCoordinate);
    incidentCoordinateRef.current = dispatchedCoordinate;
    setActiveIncidentId(latestDispatch.incident.id);
    void computeRoutes(
      "person",
      {
        drone: latestDispatch.drone
          ? {
              latitude: latestDispatch.drone.homeCoordinates.lat,
              longitude: latestDispatch.drone.homeCoordinates.lng,
            }
          : undefined,
        rover: latestDispatch.rover
          ? {
              latitude: latestDispatch.rover.homeCoordinates.lat,
              longitude: latestDispatch.rover.homeCoordinates.lng,
            }
          : undefined,
      },
      {
        latitude: latestDispatch.incident.coordinates.lat,
        longitude: latestDispatch.incident.coordinates.lng,
      },
      true,
    );
  }, [
    latestDispatch?.incident.id,
    route?.params?.focusDetection,
    route?.params?.missionAssignment,
  ]);

  const handleReportIncident = () => {
    const targetId: MarkerType =
      selectedMarker === "drone" || selectedMarker === "rover"
        ? "person"
        : selectedMarker;
    const target = incidentCoordinate ?? issueCoordinates[targetId];
    const incidentTitle =
      targetId === "hazard"
        ? "Flood hazard response"
        : targetId === "person"
          ? "Detected person response"
          : "Tactical response";
    const alreadyActive = incidents.some(
      (incident) =>
        incident.title === incidentTitle && incident.status !== "RESOLVED",
    );
    let dispatchOrigins: { drone?: RouteCoordinate; rover?: RouteCoordinate } =
      {};
    let dispatchedIncidentId: string | undefined;

    if (!alreadyActive) {
      const dispatch = dispatchIncident({
        title: incidentTitle,
        type:
          targetId === "hazard"
            ? "flood"
            : targetId === "person"
              ? "missing"
              : "sar",
        priority: targetId === "hazard" ? "critical" : "high",
        location: `Sector response point (${target.latitude.toFixed(4)}, ${target.longitude.toFixed(4)})`,
        coordinates: { lat: target.latitude, lng: target.longitude },
        assignedAsset: "Awaiting station dispatch",
        status: "ACTIVE",
        description: "Response units dispatched from the live operations map.",
      });
      dispatchedIncidentId = dispatch.incident.id;
      appendLog(
        "SYS",
        `${incidentTitle} created. ${dispatch.drone?.name ?? "No drone"} and ${dispatch.rover?.name ?? "no robot"} are moving from their assigned stations.`,
        "alert",
      );
      dispatchOrigins = {
        drone: dispatch.drone
          ? {
              latitude: dispatch.drone.homeCoordinates.lat,
              longitude: dispatch.drone.homeCoordinates.lng,
            }
          : undefined,
        rover: dispatch.rover
          ? {
              latitude: dispatch.rover.homeCoordinates.lat,
              longitude: dispatch.rover.homeCoordinates.lng,
            }
          : undefined,
      };
    }

    setSelectedMarker(targetId);
    setIncidentCoordinate(target);
    incidentCoordinateRef.current = target;
    if (dispatchedIncidentId) setActiveIncidentId(dispatchedIncidentId);
    void computeRoutes(
      targetId,
      dispatchOrigins,
      target,
      Boolean(dispatchOrigins.drone || dispatchOrigins.rover),
    );
  };

  const handleRoute = () => {
    const targetId: MarkerType =
      selectedMarker === "drone" || selectedMarker === "rover"
        ? "person"
        : selectedMarker;
    const destination = incidentCoordinate ?? issueCoordinates[targetId];
    setSelectedMarker(targetId);
    void computeRoutes(targetId, undefined, destination, false);
  };

  const handleReset = () => {
    setRouting(false);
    setSimulating(false);
    setScanStarted(false);
    setScanRoute(undefined);
    setDetectedPeople([]);
    setPendingScanPeople([]);
    setFocusCoordinate(undefined);
    setIncidentCoordinate(undefined);
    incidentCoordinateRef.current = undefined;
    setActiveIncidentId(undefined);
    setDronePath(undefined);
    setRobotPath(undefined);
    setDroneRoute(undefined);
    setRobotRoute(undefined);
  };

  const handleMarkerTap = (marker: MarkerType) => {
    setSelectedMarker(marker);
  };

  const getDrawerDetails = () => {
    switch (selectedMarker) {
      case "hazard":
        return {
          icon: "alert-decagram" as const,
          iconColor: Colors.error,
          title: "Flood Surge Hazard",
          subtitle: "CRITICAL ENVIRONMENTAL ZONE",
          badgeText: "CRITICAL",
          badgeVariant: "critical" as const,
          metric1: {
            icon: "water-alert" as const,
            val: "+2.4m",
            lbl: "SURGE HT",
          },
          metric2: {
            icon: "weather-windy" as const,
            val: "180 m³/s",
            lbl: "FLOW RATE",
          },
          metric3: {
            icon: "alert-outline" as const,
            val: "HIGH",
            lbl: "SEVERITY",
          },
        };
      case "person":
        return {
          icon: "account-alert" as const,
          iconColor: Colors.warning,
          title: "Detected Person",
          subtitle: "AI THERMAL FLIR SIGNATURE",
          badgeText: "94% MATCH",
          badgeVariant: "high" as const,
          metric1: {
            icon: "thermometer" as const,
            val: "37.1°C",
            lbl: "BODY TEMP",
          },
          metric2: { icon: "radar" as const, val: "Sector 7", lbl: "ZONE" },
          metric3: { icon: "target" as const, val: "94%", lbl: "CONFIDENCE" },
        };
      case "rover":
        return {
          icon: "robot-industrial" as const,
          iconColor: Colors.white,
          title: "Rover 01",
          subtitle: "ALL-TERRAIN GROUND LIFTER",
          badgeText: simulating
            ? roverTravel.arrived
              ? "ON SCENE"
              : "EN ROUTE"
            : routing
              ? "ROUTE LOCKED"
              : "STANDBY",
          badgeVariant: (routing || simulating ? "mission" : "available") as
            | "mission"
            | "available",
          metric1: {
            icon: "battery-high" as const,
            val: "81%",
            lbl: "BATTERY",
          },
          metric2: {
            icon: "signal-cellular-outline" as const,
            val: "Strong",
            lbl: "RF LINK",
          },
          metric3: {
            icon: "speedometer" as const,
            val: simulating && !roverTravel.arrived ? "1.4 m/s" : "0 m/s",
            lbl: "SPEED",
          },
        };
      case "drone":
      default:
        return {
          icon: "drone" as const,
          iconColor: Colors.primary,
          title: "Unit 01",
          subtitle: "HEXA-ROTOR RECON",
          badgeText: simulating
            ? droneTravel.arrived
              ? "ON SCENE"
              : "EN ROUTE"
            : routing
              ? "ROUTE LOCKED"
              : "AIRBORNE",
          badgeVariant: "live" as const,
          metric1: {
            icon: "battery-high" as const,
            val: `${telemetry.battery}%`,
            lbl: "BATTERY",
          },
          metric2: {
            icon: "signal-cellular-outline" as const,
            val: telemetry.signal,
            lbl: "MESH LINK",
          },
          metric3: {
            icon: "speedometer" as const,
            val: `${telemetry.speed} m/s`,
            lbl: "SPEED",
          },
        };
    }
  };

  const drawerData = getDrawerDetails();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.surfaceContainer}
      />
      <TacticalHeader
        title="RESQMESH"
        subtitle="GEOSPATIAL SITUATIONAL AWARENESS"
        onProfilePress={() => openScreen(navigation, "Profile")}
      />

      <View style={styles.mapCanvas} pointerEvents="box-none">
        <OpenRouteMap
          selectedMarker={selectedMarker}
          onMarkerSelect={handleMarkerTap}
          fleetAssets={assets}
          showCenters={!simulating}
          dronePath={dronePath}
          robotPath={robotPath}
          droneRoute={droneRoute}
          robotRoute={robotRoute}
          droneCoordinate={simulating ? droneCoordinate : undefined}
          roverCoordinate={simulating ? roverTravel.position : undefined}
          scanRoute={scanRoute}
          detectedPeople={detectedPeople}
          focusCoordinate={focusCoordinate}
          incidentCoordinate={incidentCoordinate}
          projection={projection}
        />

        <View style={styles.topMissionHud} pointerEvents="auto">
          <View style={styles.hudHeaderRow}>
            <View style={styles.hudLiveDot} />
            <Text style={styles.hudBadgeText}>
              {bothArrived
                ? "UNITS ON SCENE"
                : simulating
                  ? "FLIGHT SIMULATION"
                  : routing
                    ? "ROUTE PREVIEW"
                    : "LIVE MISSION MAP"}
            </Text>
          </View>
          <Text style={styles.hudTitleText}>
            {scanRoute
              ? "Aerial scan active"
              : routing || simulating
                ? "Person Extract #024"
                : "Flood Rescue #024"}
          </Text>
          <View style={styles.hudStatsRow}>
            <View>
              <Text style={styles.hudStatLabel}>STATUS</Text>
              <View style={styles.hudStatValRow}>
                <MaterialCommunityIcons
                  name={
                    bothArrived
                      ? "check-decagram"
                      : simulating
                        ? "navigation-variant"
                        : routing
                          ? "map-marker-path"
                          : "shield-check"
                  }
                  size={14}
                  color={
                    simulating && !bothArrived
                      ? Colors.warning
                      : Colors.tertiary
                  }
                />
                <Text
                  style={[
                    styles.hudStatValGreen,
                    simulating && !bothArrived && { color: Colors.warning },
                  ]}
                >
                  {bothArrived
                    ? "ON SCENE"
                    : simulating
                      ? "MOVING"
                      : routing
                        ? "PATH DRAWN"
                        : "AIRBORNE"}
                </Text>
              </View>
            </View>
            <View style={styles.hudStatDivider} />
            <View>
              <Text style={styles.hudStatLabel}>ESTIMATED ETA</Text>
              <Text style={styles.hudStatValMono}>
                {simulating && !bothArrived
                  ? "SIM"
                  : routing
                    ? "04:32"
                    : telemetry.eta}
              </Text>
            </View>
            <View style={styles.hudStatDivider} />
            <View>
              <Text style={styles.hudStatLabel}>ALTITUDE</Text>
              <Text style={styles.hudStatValMono}>{telemetry.altitude}m</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomHudDrawer} pointerEvents="auto">
          <View style={styles.drawerHeader}>
            <View style={styles.drawerUnitTitleGroup}>
              <View style={styles.unitFlightIcon}>
                <MaterialCommunityIcons
                  name={drawerData.icon}
                  size={20}
                  color={drawerData.iconColor}
                />
              </View>
              <View>
                <Text style={styles.drawerUnitName}>{drawerData.title}</Text>
                <Text style={styles.drawerUnitSub}>{drawerData.subtitle}</Text>
              </View>
            </View>
            <TacticalBadge
              label={drawerData.badgeText}
              variant={drawerData.badgeVariant}
              size="sm"
              icon="check-circle"
            />
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryPod}>
              <MaterialCommunityIcons
                name={drawerData.metric1.icon}
                size={18}
                color={Colors.tertiary}
              />
              <Text style={styles.telemetryPodValue}>
                {drawerData.metric1.val}
              </Text>
              <Text style={styles.telemetryPodLabel}>
                {drawerData.metric1.lbl}
              </Text>
            </View>
            <View style={styles.telemetryPod}>
              <MaterialCommunityIcons
                name={drawerData.metric2.icon}
                size={18}
                color={Colors.tertiary}
              />
              <Text style={styles.telemetryPodValue}>
                {drawerData.metric2.val}
              </Text>
              <Text style={styles.telemetryPodLabel}>
                {drawerData.metric2.lbl}
              </Text>
            </View>
            <View style={styles.telemetryPod}>
              <MaterialCommunityIcons
                name={drawerData.metric3.icon}
                size={18}
                color={Colors.white}
              />
              <Text style={styles.telemetryPodValue}>
                {drawerData.metric3.val}
              </Text>
              <Text style={styles.telemetryPodLabel}>
                {drawerData.metric3.lbl}
              </Text>
            </View>
          </View>

          <View style={styles.drawerActionRow}>
            <Pressable
              style={styles.primaryVideoAction}
              onPress={() =>
                openScreen(
                  navigation,
                  selectedMarker === "person"
                    ? "DetectionDetails"
                    : "LiveMonitoring",
                )
              }
            >
              <MaterialCommunityIcons
                name={
                  selectedMarker === "person"
                    ? "account-search"
                    : "video-outline"
                }
                size={18}
                color={Colors.white}
              />
              <Text style={styles.primaryVideoText}>
                {selectedMarker === "person"
                  ? "VIEW DETECTION"
                  : "VIEW LIVE VIDEO"}
              </Text>
            </Pressable>

            {routing ? (
              <Pressable
                style={styles.secondaryRouteAction}
                onPress={handleReset}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={Colors.onSurface}
                />
                <Text style={styles.secondaryRouteText}>CLEAR</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.secondaryRouteAction}
                onPress={handleRoute}
              >
                <MaterialCommunityIcons
                  name="map-marker-path"
                  size={18}
                  color={Colors.onSurface}
                />
                <Text style={styles.secondaryRouteText}>VIEW DIRECTIONS</Text>
              </Pressable>
            )}
          </View>

          {!routing ? (
            <Pressable style={styles.reportChip} onPress={handleReportIncident}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={Colors.error}
              />
              <Text style={styles.reportChipText}>
                REPORT INCIDENT — DISPATCH AIR + GROUND
              </Text>
            </Pressable>
          ) : (
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendLine,
                    { backgroundColor: Colors.tertiary },
                  ]}
                />
                <Text style={styles.legendText}>DRONE</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendLine, { backgroundColor: "#FBBF24" }]}
                />
                <Text style={styles.legendText}>ROVER</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#F87171" }]}
                />
                <Text style={styles.legendText}>INCIDENT</Text>
              </View>
            </View>
          )}
          {detectedPeople.length > 0 && (
            <View style={styles.detectionPanel}>
              <View style={styles.detectionPanelHeader}>
                <MaterialCommunityIcons
                  name="radar"
                  size={15}
                  color={Colors.warning}
                />
                <Text style={styles.detectionPanelTitle}>
                  DUMMY PERSON COORDINATES
                </Text>
              </View>
              {detectedPeople.map((person) => (
                <Text key={person.id} style={styles.detectionCoordinate}>
                  {person.id} · {person.latitude.toFixed(6)}° N,{" "}
                  {person.longitude.toFixed(6)}° E
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    position: "relative",
    overflow: "hidden",
  },
  topMissionHud: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(10, 15, 26, 0.88)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.sm + 4,
    zIndex: 20,
    elevation: 16,
  },
  hudHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  hudLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  hudBadgeText: {
    fontSize: 10,
    fontFamily: "Courier",
    fontWeight: "700",
    color: Colors.error,
    letterSpacing: 1.5,
  },
  hudTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  hudStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(203, 213, 225, 0.5)",
  },
  hudStatLabel: {
    fontSize: 9,
    fontFamily: "Courier",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  hudStatValRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  hudStatValGreen: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.tertiary,
    fontFamily: "Courier",
  },
  hudStatValMono: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Courier",
  },
  hudStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(203, 213, 225, 0.5)",
  },
  floatingControls: {
    position: "absolute",
    top: 168,
    right: Spacing.sm,
    backgroundColor: "rgba(10, 15, 26, 0.9)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 4,
    gap: 6,
    zIndex: 30,
    elevation: 20,
  },
  controlButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonActive: {
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  controlDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginVertical: 2,
  },
  bottomHudDrawer: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(10, 15, 26, 0.94)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    zIndex: 30,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  drawerUnitTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  unitFlightIcon: {
    backgroundColor: "rgba(198, 198, 204, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(198, 198, 204, 0.3)",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerUnitName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: -0.2,
  },
  drawerUnitSub: {
    fontSize: 10,
    fontFamily: "Courier",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  telemetryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
  },
  telemetryPod: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  telemetryPodValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Courier",
    marginVertical: 2,
  },
  telemetryPodLabel: {
    fontSize: 9,
    fontFamily: "Courier",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  drawerActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryVideoAction: {
    flex: 2,
    backgroundColor: Colors.tertiary,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryVideoText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  secondaryRouteAction: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  secondaryRouteText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  reportChip: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.45)",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reportChipText: {
    color: Colors.error,
    fontFamily: "Courier",
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  legendRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.tertiary,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    fontFamily: "Courier",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  detectionPanel: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.warning}66`,
    backgroundColor: `${Colors.warning}12`,
    gap: 4,
  },
  detectionPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  detectionPanelTitle: {
    color: Colors.warning,
    fontFamily: "Courier",
    fontWeight: "700",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  detectionCoordinate: {
    color: Colors.onSurface,
    fontFamily: "Courier",
    fontSize: 10,
  },
});
