"use client";

import { useState } from "react";
import Image from "next/image";

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export default function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return <div className="product-gallery-empty">Chưa có ảnh</div>;
  }

  const current = images[active] || images[0];
  const hasMultiple = images.length > 1;
  const previous = () => setActive((index) => (index - 1 + images.length) % images.length);
  const next = () => setActive((index) => (index + 1) % images.length);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <Image
          src={current.src}
          alt={current.alt || name}
          width={1400}
          height={1400}
          sizes="(max-width: 800px) 100vw, 55vw"
          priority
          className="product-gallery-image"
        />
        {hasMultiple && (
          <>
            <button type="button" className="product-gallery-arrow prev" onClick={previous} aria-label="Ảnh trước">‹</button>
            <button type="button" className="product-gallery-arrow next" onClick={next} aria-label="Ảnh tiếp theo">›</button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="product-gallery-thumbs">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`product-gallery-thumb${index === active ? " is-active" : ""}`}
              onClick={() => setActive(index)}
              aria-label={`Xem ảnh ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
            >
              <Image
                src={image.src}
                alt={image.alt || `${name} – ảnh ${index + 1}`}
                fill
                sizes="100px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
