import { Copy, ExternalLink, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/useToast";
import { copyPublicUrl, openPublicUrl, sharePublicUrl, type ShareOutcome } from "@/modules/careers/share";

interface PublicShareMenuProps {
  careersUrl: string;
  vacancyUrl?: string;
  vacancyTitle?: string;
  companyName: string;
  align?: "start" | "center" | "end";
  size?: "sm" | "md";
}

export function PublicShareMenu({
  careersUrl,
  vacancyUrl,
  vacancyTitle,
  companyName,
  align = "end",
  size = "sm",
}: PublicShareMenuProps) {
  const toast = useToast();
  const shareUrl = vacancyUrl ?? careersUrl;
  const shareTitle = vacancyTitle ? `${vacancyTitle} at ${companyName}` : `${companyName} Careers`;

  async function handleCopy(url: string, successTitle: string) {
    const outcome = await copyPublicUrl(url);
    showCopyToast(outcome, successTitle, toast);
  }

  async function handleShare() {
    const outcome = await sharePublicUrl({
      title: shareTitle,
      text: companyName,
      url: shareUrl,
    });
    if (outcome === "copied") {
      showCopyToast(outcome, vacancyUrl ? "Vacancy link copied" : "Careers page copied", toast);
    } else if (outcome === "prompt") {
      showCopyToast(outcome, "Public link ready to copy", toast);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size={size}
          aria-label={vacancyUrl ? "Share vacancy" : "Share careers page"}
          title={vacancyUrl ? "Share Vacancy" : "Share Careers"}
        >
          <Share2 size={16} />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-56">
        {vacancyUrl ? (
          <>
            <DropdownMenuItem onSelect={() => void handleCopy(vacancyUrl, "Vacancy link copied")}>
              <Copy size={15} />
              Copy Vacancy Link
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openPublicUrl(vacancyUrl)}>
              <ExternalLink size={15} />
              Open Public Page
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={() => void handleCopy(careersUrl, "Careers page copied")}>
          <Link2 size={15} />
          Copy Careers Page
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleShare()}>
          <Share2 size={15} />
          Share...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function showCopyToast(
  outcome: ShareOutcome,
  successTitle: string,
  toast: ReturnType<typeof useToast>
) {
  if (outcome === "copied") {
    toast.success({ title: successTitle });
    return;
  }
  if (outcome === "prompt") {
    toast.info({ title: "Copy the public link", description: "Use the selectable URL dialog to copy the link." });
  }
}
