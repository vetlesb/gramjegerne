"use client";
import { toast } from "sonner";
import Icon from "@/components/Icon";

export function ShareButton({ slug }: { slug: string }) {
  const shareUrl = `${window.location.origin}/share/${slug}`;

  const handleShare = async () => {
    // Only copy to clipboard, no native share dialog
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lenke kopiert til utklippstavle!", {
        duration: 3000,
        position: "bottom-center",
      });
    } catch (err) {
      toast.error("Kunne ikke kopiere lenke", {
        duration: 3000,
        position: "bottom-center",
      });
      console.error("Copy failed:", err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="button-create flex items-center gap-2 px-4 py-2"
    >
      <Icon name="link" width={24} height={24} />
      Del liste
    </button>
  );
}
