import Image from "next/image";

export function getProductImageUrl(src: string) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const path = String(src).replace(/^\/+/, "");
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
