import React, { useState, useEffect, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ICarouselItem {
  id: number;
  image_url: string;
  shareable_link?: string | null;
  display_order: number;
}

const CAROUSEL_HEIGHT = 172; // px

const Bottom1Carousel: React.FC = () => {
  const [items, setItems] = useState<ICarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/homepage/carousels?type=bottom_left&orientation=horizontal`
        );
        if (!response.ok) throw new Error("Failed to fetch bottom-left banners");
        const data = await response.json();
        const sorted = (Array.isArray(data) ? data : [])
          .sort((a: ICarouselItem, b: ICarouselItem) => a.display_order - b.display_order);
        setItems(sorted);
      } catch (error) {
        console.error("Error fetching bottom1 carousel items:", error);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 1200);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, items.length]);

  if (!items.length) return null;

  return (
    <div
      style={{
        width: "100%",
        height: CAROUSEL_HEIGHT,
        overflow: "hidden",
        position: "relative",
        borderRadius: 8,
        border: "1px solid #eee",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          transform: `translateY(-${current * CAROUSEL_HEIGHT}px)`,
          transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {items.map((item, idx) => {
          const image = (
            <img
              src={item.image_url}
              alt={`Banner ${idx + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          );
          return (
            <div
              key={item.id ?? idx}
              style={{
                height: CAROUSEL_HEIGHT,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.shareable_link ? (
                <a
                  href={item.shareable_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ width: "100%", height: "100%", display: "block" }}
                >
                  {image}
                </a>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Bottom1Carousel;
