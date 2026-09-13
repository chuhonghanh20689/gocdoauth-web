import Image from "next/image";

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
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      style={{ objectFit }}
    />
  );
}
