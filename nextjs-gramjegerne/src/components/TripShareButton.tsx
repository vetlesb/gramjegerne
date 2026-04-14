'use client';
import {useState} from 'react';
import {toast} from 'sonner';
import {Icon} from './Icon';

interface TripShareButtonProps {
  tripId: string;
  shareId?: string;
  tripName: string;
}

export function TripShareButton({tripId, shareId: initialShareId, tripName}: TripShareButtonProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [currentShareId, setCurrentShareId] = useState(initialShareId);

  const generateShareId = async (): Promise<string> => {
    const response = await fetch('/api/updateTrip', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        tripId,
        updates: {
          shareId: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isShared: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate share link');
    }

    const data = await response.json();
    return data.trip.shareId;
  };

  const handleShare = async () => {
    try {
      setIsGeneratingLink(true);

      let shareIdToUse = currentShareId;
      if (!shareIdToUse) {
        shareIdToUse = await generateShareId();
        setCurrentShareId(shareIdToUse);
      }

      const shareUrl = `${window.location.origin}/share/trip/${shareIdToUse}`;

      await navigator.clipboard.writeText(shareUrl);

      toast.success(`${tripName} link copied to clipboard!`, {
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Could not generate share link', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isGeneratingLink}
      className="button-ghost p-2 text-white rounded-md transition-colors"
      title="Share trip"
    >
      {isGeneratingLink ? (
        <div className="animate-spin w-5 h-5 border border-accent border-t-transparent rounded-full" />
      ) : (
        <Icon name="link" width={20} height={20} />
      )}
    </button>
  );
}
