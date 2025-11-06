'use client';
import {toast} from 'sonner';

export function ShareButton({slug}: {slug: string}) {
  const shareUrl = `${window.location.origin}/lists/${slug}?shared=true`;

  async function handleShare() {
    // Only copy to clipboard, no native share dialog
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!', {
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (err) {
      toast.error('Could not copy link', {
        duration: 3000,
        position: 'bottom-center',
      });
      console.error('Copy failed:', err);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="button-create flex items-center gap-2 text-lg px-4 py-2"
    >
      Share
    </button>
  );
}
