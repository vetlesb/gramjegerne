'use client';
import {useEffect, useState} from 'react';

// Extend DeviceOrientationEvent to include Safari-specific properties
interface ExtendedDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface CompassWidgetProps {
  className?: string;
}

export default function CompassWidget({className = ''}: CompassWidgetProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  console.log('Compass render:', {heading, isSupported, permissionGranted, isDemoMode});

  useEffect(() => {
    // Check if we're on a mobile device with actual orientation sensors
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && isMobile) {
      setIsSupported(true);

      // Request permission for iOS 13+
      const requestPermission = async () => {
        if (
          typeof (DeviceOrientationEvent as unknown as {requestPermission?: () => Promise<string>})
            .requestPermission === 'function'
        ) {
          try {
            const permission = await (
              DeviceOrientationEvent as unknown as {requestPermission: () => Promise<string>}
            ).requestPermission();
            if (permission === 'granted') {
              setPermissionGranted(true);
              startListening();
            }
          } catch {
            console.log('Permission denied for device orientation');
            // Fall back to demo mode if permission denied
            setIsDemoMode(true);
            setHeading(45);
          }
        } else {
          // Android or older iOS - no permission needed
          setPermissionGranted(true);
          startListening();
        }
      };

      const startListening = () => {
        const handleOrientation = (event: ExtendedDeviceOrientationEvent) => {
          if (event.alpha !== null) {
            // Convert to 0-360 degrees, with 0 being North
            let compassHeading = event.alpha;
            if (event.webkitCompassHeading) {
              // iOS Safari provides webkitCompassHeading which is more accurate
              compassHeading = event.webkitCompassHeading;
            }
            setHeading(Math.round(compassHeading));
          }
        };

        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
          window.removeEventListener('deviceorientation', handleOrientation);
        };
      };

      // Auto-request permission on component mount
      requestPermission();

      return () => {
        // Cleanup is handled in startListening
      };
    } else {
      // Demo mode for desktop/unsupported devices - show compass with rotating needle
      console.log('Compass: Activating demo mode for desktop');
      setIsDemoMode(true);
      setHeading(45); // Show northeast direction for styling purposes
    }
  }, []);

  const requestPermissionManually = async () => {
    if (
      typeof (DeviceOrientationEvent as unknown as {requestPermission?: () => Promise<string>})
        .requestPermission === 'function'
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as unknown as {requestPermission: () => Promise<string>}
        ).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          window.location.reload(); // Reload to start listening
        }
      } catch {
        console.log('Permission denied for device orientation');
      }
    }
  };

  const getCardinalDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  if (!isSupported && !isDemoMode) {
    return null; // Don't show anything if not supported and not in demo mode
  }

  if (!permissionGranted && !isDemoMode) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border ${className}`}>
        <button
          onClick={requestPermissionManually}
          className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          Enable Compass
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-primary backdrop-blur-sm rounded-lg p-3 shadow-lg border ${className}`}>
      <div className="flex flex-col items-center gap-1">
        {/* Compass Circle */}
        <div className="relative w-12 h-12">
          {/* Compass background circle */}
          <div className="absolute inset-0 rounded-full">
            {/* Cardinal direction markers */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 text-xs text-accent">
              N
            </div>
            <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 text-xs text-primary">
              E
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 text-xs text-primary">
              S
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 text-xs text-primary">
              W
            </div>
          </div>

          {/* Compass needle */}
          {heading !== null && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{transform: `rotate(${heading}deg)`}}
            >
              {/* North-pointing needle (red) */}
              <div className="absolute w-0.5 h-4 bg-red-500 rounded-full transform -translate-y-1"></div>
              {/* South-pointing needle (white/gray) */}
              <div className="absolute w-0.5 h-4 bg-white rounded-full transform translate-y-1 rotate-180"></div>
              {/* Center dot */}
              <div className="absolute w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </div>

        {/* Heading display */}
        <div className="text-center pt-2 flex flex-row">
          {heading !== null ? (
            <>
              <div className="text-xs flex text-white">
                {heading}° {getCardinalDirection(heading)}
              </div>
            </>
          ) : (
            <div className="text-xs flex text-white">--°</div>
          )}
        </div>
      </div>
    </div>
  );
}
