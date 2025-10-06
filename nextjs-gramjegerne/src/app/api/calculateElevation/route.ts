import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {ElevationService} from '@/services/elevationService';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {waypoints} = await request.json();

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json(
        {success: false, error: 'Invalid waypoints provided'},
        {status: 400},
      );
    }

    // Validate waypoint structure
    for (const waypoint of waypoints) {
      if (typeof waypoint.lat !== 'number' || typeof waypoint.lng !== 'number') {
        return NextResponse.json(
          {success: false, error: 'Invalid waypoint coordinates'},
          {status: 400},
        );
      }
    }

    // Calculate elevation profile
    const elevationProfile = await ElevationService.getRouteElevation(waypoints);

    return NextResponse.json({
      success: true,
      elevationProfile: {
        elevationGain: elevationProfile.elevationGain,
        totalAscent: elevationProfile.totalAscent,
        totalDescent: elevationProfile.totalDescent,
        minElevation: elevationProfile.minElevation,
        maxElevation: elevationProfile.maxElevation,
        distance: elevationProfile.distance,
      },
    });
  } catch (error) {
    console.error('Error calculating elevation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate elevation',
      },
      {status: 500},
    );
  }
}
