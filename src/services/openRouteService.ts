export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface OpenRouteResponse {
  features?: Array<{
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
}

interface OsrmResponse {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
}

declare const process: {
  env: Record<string, string | undefined>;
};

const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY;

export async function getOpenRoute(
  from: RouteCoordinate,
  to: RouteCoordinate,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteCoordinate[] | null> {
  if (ORS_API_KEY) {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
      {
        method: 'POST',
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [from.longitude, from.latitude],
            [to.longitude, to.latitude],
          ],
          instructions: false,
        }),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as OpenRouteResponse;
      const coordinates = data.features?.[0]?.geometry?.coordinates;
      if (coordinates?.length) {
        return coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
      }
    }
  }

  if (profile !== 'driving-car') return null;

  const fallbackResponse = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=false`
  );
  if (!fallbackResponse.ok) {
    throw new Error(`Road routing failed with status ${fallbackResponse.status}`);
  }

  const fallbackData = (await fallbackResponse.json()) as OsrmResponse;
  const fallbackCoordinates = fallbackData.routes?.[0]?.geometry?.coordinates;
  if (!fallbackCoordinates?.length) throw new Error('Road router returned no route geometry');

  return fallbackCoordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}
