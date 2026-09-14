import Image from "next/image";

export function getProductImageUrl(src: string) {
  if (!src) return "";

  // New uploads may already be stored as a complete public URL.
  if (/^https?:\/\//i.test(src)) return src;

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const path = src.replace(/^\/+/, "");

  // product_images.storage_path stores paths relative to the bucket.
  return `${base}/storage/v1/object/public/product-images/${path}`;
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain";
};

export default function RemoteImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1199px) 33vw, 25vw",
  priority = false,
  objectFit = "cover",
}: Props) {
  const imageUrl = getProductImageUrl(src);

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      style={{ objectFit }}
    />
  );
}
