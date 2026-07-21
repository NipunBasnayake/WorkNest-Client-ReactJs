import { ManagedImageUploadField } from "@/components/common/ManagedImageUploadField";
import { UserAvatar } from "@/components/common/UserAvatar";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";

export function AvatarUploadField({
  name,
  email,
  src,
  onUpload,
  onRemove,
  disabled = false,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  onUpload: (file: File, options: ImageUploadRequestOptions) => Promise<void>;
  onRemove: () => Promise<void>;
  disabled?: boolean;
}) {
  return (
    <ManagedImageUploadField
      title="Profile picture"
      description="PNG, JPEG, or WebP up to 2 MB. A centered square and responsive thumbnails are generated automatically."
      preview={<UserAvatar name={name} email={email} src={src} size="xl" eager />}
      previewAlt={`${name || email || "User"} profile picture preview`}
      hasImage={Boolean(src)}
      uploadLabel="Upload picture"
      replaceLabel="Replace picture"
      disabled={disabled}
      onUpload={onUpload}
      onRemove={onRemove}
    />
  );
}
