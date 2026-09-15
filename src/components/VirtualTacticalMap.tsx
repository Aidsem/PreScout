import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';
import Svg, {
  Rect,
  Path,
  Polygon,
  Text as SvgText,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
  Pattern,
  G,
} from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  MAP_W,
  MAP_H,
  MAP_THEMES,
  MAP_BG,
  MAP_MARKERS,
  MapLayer,
  MarkerType,
  MapPoint,
  pointsToPath,
} from '../map/mapModel';

interface VirtualTacticalMapProps {
  activeLayer: MapLayer;
  selectedMarker: MarkerType;
  onMarkerSelect: (marker: MarkerType) => void;
  scale?: number;
  dronePath?: MapPoint[];
  robotPath?: MapPoint[];
  dronePosition?: MapPoint;
  roverPosition?: MapPoint;
}

export const VirtualTacticalMap: React.FC<VirtualTacticalMapProps> = ({
  activeLayer,
  selectedMarker,
  onMarkerSelect,
  scale = 1,
  dronePath,
  robotPath,
  dronePosition,
  roverPosition,
}) => {
  const theme = MAP_THEMES[activeLayer];
  const bg = MAP_BG[activeLayer];
  const translateX = useRef(new Animated.Value(0));
  const translateY = useRef(new Animated.Value(0));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 14 || Math.abs(gs.dy) > 14,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        translateX.current.extractOffset();
        translateY.current.extractOffset();
      },
      onPanResponderMove: (_, gs) => {
        translateX.current.setValue(gs.dx);
        translateY.current.setValue(gs.dy);
      },
      onPanResponderRelease: () => {
        translateX.current.flattenOffset();
        translateY.current.flattenOffset();
      },
      onPanResponderTerminate: () => {
        translateX.current.flattenOffset();
        translateY.current.flattenOffset();
      },
    })
  );

  const dronePathD = dronePath && dronePath.length > 1 ? pointsToPath(dronePath) : '';
  const robotPathD = robotPath && robotPath.length > 1 ? pointsToPath(robotPath) : '';

  return (
    <View style={[styles.mapRoot, { backgroundColor: bg }]} {...panResponder.current.panHandlers}>
      <Animated.View
        style={{
          transform: [{ translateX: translateX.current }, { translateY: translateY.current }, { scale }],
          width: '100%',
          height: '100%',
        }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice">
          <Defs>
            <Pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <Path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.4" />
            </Pattern>
            <LinearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0a2035" />
              <Stop offset="100%" stopColor="#071525" />
            </LinearGradient>
          </Defs>

          <Rect width={MAP_W} height={MAP_H} fill={theme.land} />

          <Ellipse cx={55} cy={100} rx={40} ry={28} fill={theme.park} opacity={0.85} />
          <Ellipse cx={340} cy={75} rx={32} ry={22} fill={theme.park} opacity={0.85} />
          <Rect x={160} y={380} width={55} height={40} rx={5} fill={theme.park} opacity={0.7} />
          <Ellipse cx={290} cy={450} rx={36} ry={20} fill={theme.park} opacity={0.7} />

          <Path
            d={`M 0 ${205} C 30 ${200} 60 ${210} 90 ${207} C 130 ${203} 165 ${215} 200 ${210}
                C 235 ${205} 265 ${218} 300 ${213} C 330 ${209} 360 ${220} 400 ${216}
                L 400 ${230} L 360 ${232} C 330 ${235} 300 ${225} 265 ${229}
                C 230 ${233} 200 ${222} 165 ${226} C 130 ${230} 90 ${220} 50 ${224}
                C 25 ${227} 10 ${218} 0 ${220} Z`}
            fill="url(#waterGrad)"
            opacity={0.95}
          />
          <Path
            d={`M 10 ${210} C 80 ${207} 160 ${214} 240 ${211} C 310 ${208} 370 ${218} 395 ${220}`}
            stroke="rgba(30,100,180,0.3)"
            strokeWidth={1.2}
            fill="none"
          />
          <Path
            d="M 310 0 C 312 60 310 110 315 165"
            stroke={theme.water}
            strokeWidth={10}
            fill="none"
            opacity={0.7}
          />

          <G opacity={0.85}>
            <Rect x={108} y={58} width={10} height={8} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={122} y={57} width={8} height={10} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={134} y={59} width={11} height={7} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={149} y={56} width={9} height={11} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={108} y={72} width={13} height={9} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={125} y={70} width={10} height={10} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={140} y={68} width={9} height={11} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={153} y={72} width={11} height={8} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={108} y={86} width={9} height={7} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={122} y={84} width={12} height={9} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={138} y={82} width={10} height={10} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={152} y={85} width={9} height={8} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
          </G>
          <G opacity={0.8}>
            <Rect x={195} y={82} width={14} height={10} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={213} y={80} width={11} height={13} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={228} y={83} width={9} height={10} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={241} y={80} width={13} height={12} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={197} y={97} width={12} height={9} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={214} y={95} width={10} height={10} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={229} y={93} width={13} height={11} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
          </G>
          <G opacity={0.7}>
            <Rect x={20} y={60} width={8} height={6} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={32} y={59} width={10} height={8} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={46} y={61} width={7} height={7} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={21} y={71} width={9} height={6} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={34} y={70} width={8} height={8} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={46} y={72} width={10} height={6} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
          </G>
          <G opacity={0.75}>
            <Rect x={355} y={110} width={22} height={16} rx={2} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.5} />
            <Rect x={355} y={130} width={20} height={14} rx={2} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.5} />
            <Rect x={355} y={148} width={22} height={13} rx={2} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.5} />
          </G>
          <G opacity={0.6}>
            <Rect x={128} y={258} width={7} height={6} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={139} y={257} width={9} height={7} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={152} y={258} width={6} height={6} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={129} y={268} width={8} height={6} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={141} y={267} width={7} height={7} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
            <Rect x={152} y={268} width={9} height={6} rx={1} fill={theme.building} stroke={theme.buildingStroke} strokeWidth={0.4} />
          </G>

          <Path d={`M 0 ${155} L ${MAP_W} ${155}`} stroke={theme.roadMajor} strokeWidth={4} fill="none" />
          <Path d={`M 0 ${265} L ${MAP_W} ${265}`} stroke={theme.roadMajor} strokeWidth={4} fill="none" />
          <Path d={`M 190 0 L 190 ${MAP_H}`} stroke={theme.roadMajor} strokeWidth={4} fill="none" />
          <Path d={`M 300 0 L 300 ${MAP_H}`} stroke={theme.roadMajor} strokeWidth={4} fill="none" />
          <Path d={`M 0 ${55} L ${MAP_W} ${57}`} stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d={`M 0 ${238} L ${MAP_W} ${236}`} stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d={`M 0 ${355} L ${MAP_W} ${353}`} stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d={`M 90 0 L 88 ${MAP_H}`} stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d={`M 240 0 L 242 ${MAP_H}`} stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d="M 0 40 C 70 70 130 110 190 155" stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d="M 190 155 C 240 175 275 168 300 155" stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d="M 90 540 C 130 470 160 400 190 265" stroke={theme.roadMinor} strokeWidth={2} fill="none" />
          <Path d={`M 0 ${112} L 190 ${113}`} stroke={theme.roadMinor} strokeWidth={1} fill="none" opacity={0.6} />
          <Path d={`M 50 0 L 50 ${MAP_H}`} stroke={theme.roadMinor} strokeWidth={1} fill="none" opacity={0.5} />
          <Path d="M 0 174 C 110 172 220 175 320 172 C 370 170 390 173 400 172" stroke="#4A5A50" strokeWidth={1.5} fill="none" strokeDasharray="6,3" />

          <Polygon
            points="148,237 282,240 290,350 144,347"
            fill="rgba(184,216,106,0.08)"
            stroke="#B8D86A"
            strokeWidth={1.5}
            strokeDasharray="7,4"
          />
          <SvgText x={170} y={295} fill="#B8D86A" fontSize={7} fontWeight="bold" opacity={0.7}>
            SECTOR ALPHA-7
          </SvgText>

          <Path
            d="M 135,285 C 148,282 165,288 180,284 C 196,281 210,289 212,296
               C 214,303 196,308 175,311 C 154,314 135,308 133,301 Z"
            fill="#0e2a44"
            opacity={0.85}
          />
          <SvgText x={148} y={300} fill="rgba(60,140,220,0.65)" fontSize={6} fontWeight="600">
            FLOOD AREA
          </SvgText>

          <SvgText x={18} y={150} fill="rgba(198,198,204,0.45)" fontSize={6}>
            PUNE-NASHIK HWY
          </SvgText>
          <SvgText x={18} y={261} fill="rgba(198,198,204,0.45)" fontSize={6}>
            SOLAPUR ROAD
          </SvgText>
          <SvgText x={16} y={50} fill="rgba(198,198,204,0.4)" fontSize={6.5}>
            PIMPRI
          </SvgText>
          <SvgText x={108} y={50} fill="rgba(198,198,204,0.4)" fontSize={6.5}>
            SHIVAJINAGAR
          </SvgText>
          <SvgText x={200} y={70} fill="rgba(198,198,204,0.4)" fontSize={6.5}>
            KOREGAON PARK
          </SvgText>
          <SvgText x={308} y={65} fill="rgba(198,198,204,0.4)" fontSize={6.5}>
            VIMAN NAGAR
          </SvgText>
          <SvgText x={115} y={252} fill="rgba(198,198,204,0.38)" fontSize={6.5}>
            SWARGATE
          </SvgText>
          <SvgText x={220} y={440} fill="rgba(198,198,204,0.35)" fontSize={6.5}>
            KATRAJ
          </SvgText>
          <SvgText x={40} y={217} fill="rgba(56,130,200,0.55)" fontSize={6}>
            MULA-MUTHA RIVER
          </SvgText>

          <Rect width={MAP_W} height={MAP_H} fill="url(#grid)" />

          {dronePathD ? (
            <Path d={dronePathD} fill="none" stroke="#B8D86A" strokeWidth={2.2} strokeDasharray="6,4" opacity={0.95} />
          ) : null}
          {robotPathD ? (
            <Path d={robotPathD} fill="none" stroke="#ffcc33" strokeWidth={2.2} strokeDasharray="5,5" opacity={0.95} />
          ) : null}
        </Svg>

        {(Object.keys(MAP_MARKERS) as MarkerType[]).map((id) => {
          const m = MAP_MARKERS[id];
          const live =
            id === 'drone' && dronePosition
              ? dronePosition
              : id === 'rover' && roverPosition
                ? roverPosition
                : { x: m.x, y: m.y };
          const isSelected = selectedMarker === id;
          return (
            <Pressable
              key={id}
              hitSlop={8}
              style={[
                styles.markerWrapper,
                {
                  left: `${(live.x / MAP_W) * 100}%`,
                  top: `${(live.y / MAP_H) * 100}%`,
                },
              ]}
              onPress={() => onMarkerSelect(id)}
            >
              {id === 'drone' && <View style={[styles.headingArrow, { borderBottomColor: m.color }]} />}
              <View
                style={[
                  styles.markerRing,
                  {
                    borderColor: m.color,
                    backgroundColor: `${m.color}22`,
                    ...(isSelected
                      ? { shadowColor: m.color, shadowOpacity: 0.85, shadowRadius: 10, elevation: 8 }
                      : {}),
                  },
                ]}
              >
                <View style={[styles.markerCore, { backgroundColor: m.color }]}>
                  <MaterialCommunityIcons
                    name={m.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={14}
                    color={id === 'person' ? '#1a1200' : id === 'drone' ? '#003911' : '#fff'}
                  />
                </View>
              </View>
              <View style={[styles.markerLabel, { borderColor: `${m.color}50` }]}>
                <Text style={[styles.markerLabelText, { color: m.color }]}>{m.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </Animated.View>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.northIndicator}>
          <Text style={styles.northText}>N</Text>
          <View style={styles.northLineUp} />
          <View style={styles.northLineDown} />
        </View>
        <View style={styles.scaleBar}>
          <View style={styles.scaleBarLine} />
          <Text style={styles.scaleBarText}>500 m</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapRoot: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  markerWrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -18 }, { translateY: -44 }],
    zIndex: 30,
  },
  headingArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 2,
  },
  markerRing: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCore: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLabel: {
    marginTop: 3,
    backgroundColor: 'rgba(16,19,26,0.88)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  markerLabelText: {
    fontSize: 8,
    fontFamily: 'Courier',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  northIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 10,
    alignItems: 'center',
  },
  northText: {
    fontSize: 9,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: 'rgba(198,198,204,0.55)',
  },
  northLineUp: {
    width: 1.5,
    height: 14,
    backgroundColor: '#B8D86A',
    opacity: 0.7,
  },
  northLineDown: {
    width: 1.5,
    height: 14,
    backgroundColor: 'rgba(198,198,204,0.3)',
  },
  scaleBar: {
    position: 'absolute',
    bottom: 4,
    left: '45%',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  scaleBarLine: {
    width: 48,
    height: 3,
    backgroundColor: 'rgba(198,198,204,0.5)',
    borderRadius: 2,
  },
  scaleBarText: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: 'rgba(198,198,204,0.5)',
  },
});
