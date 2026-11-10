"use client";

import { useState } from "react";
import Image, { getImageProps } from "next/image";

const gradientColors = ["blue", "red", "yellow", "green", "blue"];

function EventCard({ event, index, preload = false }) {
  const [imageAvailable, setImageAvailable] = useState(true);
  const sizes = "(max-width: 767px) 94vw, (max-width: 1200px) 86vw, 936px";
  const mobile = event.mobileImage ? getImageProps({
    src: event.mobileImage,
    alt: event.imageAlt,
    fill: true,
    sizes,
    quality: 80,
  }).props : null;

  return (
    <article
      className={`event-card event-card--${gradientColors[index]}`}
      aria-label={event.title}
      data-event-index={index}
    >
      <div className="event-card-image">
        <div className="events-image-fallback" aria-hidden="true" />
        {imageAvailable && (
          <picture>
            {event.mobileImage && (
              <source
                media="(max-width: 767px)"
                srcSet={mobile?.srcSet || event.mobileImage}
                sizes={sizes}
              />
            )}
            <Image
              src={event.image}
              alt={event.imageAlt}
              fill
              sizes={sizes}
              quality={80}
              loading={preload ? "eager" : "lazy"}
              fetchPriority={preload && index === 0 ? "high" : "auto"}
              decoding="async"
              onError={() => setImageAvailable(false)}
            />
          </picture>
        )}
        <div className="event-card-content">
          <h3>{event.title}</h3>
          <p className="event-card-description">{event.description}</p>
        </div>
      </div>
    </article>
  );
}

export default EventCard;
