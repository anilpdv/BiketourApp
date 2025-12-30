import { XMLParser } from 'fast-xml-parser';
import {
  GPXData,
  GPXTrack,
  GPXTrackPoint,
  ParsedRoute,
  RoutePoint,
} from '../types';

// Calculate distance between two points using Haversine formula
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Parse GPX XML string to structured data
export function parseGPX(gpxString: string): GPXData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  });

  const parsed = parser.parse(gpxString);
  const gpx = parsed.gpx;

  if (!gpx) {
    throw new Error('Invalid GPX file: missing gpx root element');
  }

  const metadata = gpx.metadata
    ? {
        name: gpx.metadata.name,
        desc: gpx.metadata.desc,
        time: gpx.metadata.time,
      }
    : undefined;

  const tracks: GPXTrack[] = [];

  // Handle tracks (trk elements)
  if (gpx.trk) {
    const trkArray = Array.isArray(gpx.trk) ? gpx.trk : [gpx.trk];

    for (const trk of trkArray) {
      const track: GPXTrack = {
        name: trk.name,
        segments: [],
      };

      if (trk.trkseg) {
        const segArray = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];

        for (const seg of segArray) {
          const points: GPXTrackPoint[] = [];

          if (seg.trkpt) {
            const ptArray = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];

            for (const pt of ptArray) {
              points.push({
                lat: pt['@_lat'],
                lon: pt['@_lon'],
                ele: pt.ele,
                time: pt.time,
              });
            }
          }

          track.segments.push({ points });
        }
      }

      tracks.push(track);
    }
  }

  return { metadata, tracks };
}

// Base route data without the extended fields (used internally)
interface BaseRouteData {
  id: string;
  name: string;
  points: RoutePoint[];
  segments: RoutePoint[][];  // Separate segments for proper rendering
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

// Convert GPX data to base route data
export function gpxToRoute(gpxData: GPXData, routeId: string): BaseRouteData {
  const allPoints: RoutePoint[] = [];
  const segments: RoutePoint[][] = [];  // Keep segments separate for proper rendering
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const track of gpxData.tracks) {
    for (const segment of track.segments) {
      const segmentPoints: RoutePoint[] = [];  // Track points for this segment

      for (let i = 0; i < segment.points.length; i++) {
        const pt = segment.points[i];

        // Update bounds
        minLat = Math.min(minLat, pt.lat);
        maxLat = Math.max(maxLat, pt.lat);
        minLon = Math.min(minLon, pt.lon);
        maxLon = Math.max(maxLon, pt.lon);

        // Calculate distance from previous point (within same segment only)
        if (segmentPoints.length > 0) {
          const prevPt = segmentPoints[segmentPoints.length - 1];
          const dist = haversineDistance(
            prevPt.latitude,
            prevPt.longitude,
            pt.lat,
            pt.lon
          );
          totalDistance += dist;

          // Calculate elevation changes
          if (pt.ele !== undefined && prevPt.elevation !== undefined) {
            const eleDiff = pt.ele - prevPt.elevation;
            if (eleDiff > 0) {
              elevationGain += eleDiff;
            } else {
              elevationLoss += Math.abs(eleDiff);
            }
          }
        }

        const routePoint: RoutePoint = {
          latitude: pt.lat,
          longitude: pt.lon,
          elevation: pt.ele,
          distanceFromStart: totalDistance,
        };

        allPoints.push(routePoint);
        segmentPoints.push(routePoint);
      }

      // Only add non-empty segments
      if (segmentPoints.length > 0) {
        segments.push(segmentPoints);
      }
    }
  }

  return {
    id: routeId,
    name: gpxData.metadata?.name || routeId,
    points: allPoints,
    segments,
    totalDistance,
    elevationGain,
    elevationLoss,
    bounds: {
      minLat,
      maxLat,
      minLon,
      maxLon,
    },
  };
}

// Simplify route for display (Douglas-Peucker algorithm simplified)
export function simplifyRoute(
  points: RoutePoint[],
  tolerance: number = 0.001 // ~100m at equator
): RoutePoint[] {
  if (points.length <= 2) return points;

  // Find point with maximum distance from line between first and last
  let maxDist = 0;
  let maxIndex = 0;

  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyRoute(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyRoute(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(
  point: RoutePoint,
  lineStart: RoutePoint,
  lineEnd: RoutePoint
): number {
  const dx = lineEnd.longitude - lineStart.longitude;
  const dy = lineEnd.latitude - lineStart.latitude;

  const norm = Math.sqrt(dx * dx + dy * dy);
  if (norm === 0) return 0;

  return (
    Math.abs(
      dy * point.longitude -
        dx * point.latitude +
        lineEnd.longitude * lineStart.latitude -
        lineEnd.latitude * lineStart.longitude
    ) / norm
  );
}

// Get route center for map focus
export function getRouteCenter(
  route: ParsedRoute
): { latitude: number; longitude: number } {
  return {
    latitude: (route.bounds.minLat + route.bounds.maxLat) / 2,
    longitude: (route.bounds.minLon + route.bounds.maxLon) / 2,
  };
}

// Get delta for map region to show entire route
export function getRouteDelta(route: ParsedRoute): {
  latitudeDelta: number;
  longitudeDelta: number;
} {
  const latDelta = (route.bounds.maxLat - route.bounds.minLat) * 1.2;
  const lonDelta = (route.bounds.maxLon - route.bounds.minLon) * 1.2;
  return {
    latitudeDelta: Math.max(latDelta, 0.5),
    longitudeDelta: Math.max(lonDelta, 0.5),
  };
}
