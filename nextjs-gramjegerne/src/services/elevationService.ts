// Elevation service using Kartverket's elevation API
export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  distance: number; // cumulative distance from start in meters
}

export interface RouteElevationProfile {
  points: ElevationPoint[];
  totalAscent: number;
  totalDescent: number;
  minElevation: number;
  maxElevation: number;
  elevationGain: number; // total positive elevation change
  distance: number; // total route distance in meters
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export class ElevationService {
  private static readonly KARTVERKET_ELEVATION_URL = 'https://ws.geonorge.no/hoydedata/v1/punkt';
  private static readonly SAMPLE_INTERVAL = 100; // meters between elevation samples

  /**
   * Calculate elevation profile for a route using Kartverket's elevation API
   */
  static async getRouteElevation(waypoints: Coordinates[]): Promise<RouteElevationProfile> {
    if (waypoints.length < 2) {
      throw new Error('Route must have at least 2 waypoints');
    }

    try {
      // Sample points along the route at regular intervals
      const sampledPoints = this.sampleRoutePoints(waypoints, this.SAMPLE_INTERVAL);

      // Get elevation data for all sampled points
      const elevationData = await this.fetchElevationData(sampledPoints);

      // Calculate elevation profile metrics
      return this.calculateElevationProfile(elevationData);
    } catch (error) {
      console.error('Error calculating route elevation:', error);
      throw new Error('Failed to calculate route elevation');
    }
  }

  /**
   * Sample points along a route at regular intervals
   */
  private static sampleRoutePoints(
    waypoints: Coordinates[],
    intervalMeters: number,
  ): Coordinates[] {
    const sampledPoints: Coordinates[] = [waypoints[0]]; // Always include start point

    for (let i = 1; i < waypoints.length; i++) {
      const start = waypoints[i - 1];
      const end = waypoints[i];

      // Calculate distance between waypoints
      const segmentDistance = this.calculateDistance(start, end);

      // If segment is longer than interval, add intermediate points
      if (segmentDistance > intervalMeters) {
        const numSamples = Math.floor(segmentDistance / intervalMeters);

        for (let j = 1; j <= numSamples; j++) {
          const ratio = (j * intervalMeters) / segmentDistance;
          const interpolatedPoint = this.interpolatePoint(start, end, ratio);
          sampledPoints.push(interpolatedPoint);
        }
      }

      // Always include the end waypoint
      sampledPoints.push(end);
    }

    return sampledPoints;
  }

  /**
   * Fetch elevation data from Kartverket's elevation API
   */
  private static async fetchElevationData(points: Coordinates[]): Promise<ElevationPoint[]> {
    const elevationPoints: ElevationPoint[] = [];
    let cumulativeDistance = 0;

    // Process points in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (point, batchIndex) => {
          const globalIndex = i + batchIndex;

          // Calculate cumulative distance
          if (globalIndex > 0) {
            cumulativeDistance += this.calculateDistance(points[globalIndex - 1], point);
          }

          try {
            const elevation = await this.fetchSingleElevation(point);
            return {
              lat: point.lat,
              lng: point.lng,
              elevation,
              distance: cumulativeDistance,
            };
          } catch (error) {
            console.warn(`Failed to get elevation for point ${point.lat}, ${point.lng}:`, error);
            // Use interpolated elevation or default
            const fallbackElevation =
              globalIndex > 0 ? elevationPoints[globalIndex - 1]?.elevation || 0 : 0;
            return {
              lat: point.lat,
              lng: point.lng,
              elevation: fallbackElevation,
              distance: cumulativeDistance,
            };
          }
        }),
      );

      elevationPoints.push(...batchResults);

      // Add small delay between batches to be respectful to the API
      if (i + batchSize < points.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return elevationPoints;
  }

  /**
   * Fetch elevation for a single point from Kartverket
   */
  private static async fetchSingleElevation(point: Coordinates): Promise<number> {
    const url = `${this.KARTVERKET_ELEVATION_URL}?koordsys=4258&nord=${point.lat}&ost=${point.lng}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kartverket API error: ${response.status}`);
    }

    const data = await response.json();

    // Kartverket returns elevation in the 'punkter' array with 'z' field
    if (data && data.punkter && Array.isArray(data.punkter) && data.punkter.length > 0) {
      const punkt = data.punkter[0];
      if (typeof punkt.z === 'number') {
        return Math.round(punkt.z); // Round to nearest meter
      }
    }

    throw new Error('Invalid elevation data received');
  }

  /**
   * Calculate elevation profile metrics from elevation points
   */
  private static calculateElevationProfile(points: ElevationPoint[]): RouteElevationProfile {
    if (points.length === 0) {
      throw new Error('No elevation points provided');
    }

    let totalAscent = 0;
    let totalDescent = 0;
    let minElevation = points[0].elevation;
    let maxElevation = points[0].elevation;

    // Calculate ascent, descent, min, and max
    for (let i = 1; i < points.length; i++) {
      const elevationChange = points[i].elevation - points[i - 1].elevation;

      if (elevationChange > 0) {
        totalAscent += elevationChange;
      } else {
        totalDescent += Math.abs(elevationChange);
      }

      minElevation = Math.min(minElevation, points[i].elevation);
      maxElevation = Math.max(maxElevation, points[i].elevation);
    }

    return {
      points,
      totalAscent,
      totalDescent,
      minElevation,
      maxElevation,
      elevationGain: totalAscent, // Total positive elevation change
      distance: points[points.length - 1].distance,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Interpolate a point between two coordinates
   */
  private static interpolatePoint(
    start: Coordinates,
    end: Coordinates,
    ratio: number,
  ): Coordinates {
    return {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    };
  }

  /**
   * Format elevation gain for display
   */
  static formatElevationGain(elevationGain: number): string {
    if (elevationGain < 1000) {
      return `${Math.round(elevationGain)}m`;
    }
    return `${(elevationGain / 1000).toFixed(1)}km`;
  }
}
