import React, { useState, useEffect, useRef } from "react";

const images = [
  // "https://res.cloudinary.com/do3vxz4gw/image/upload/v1751544854/svg_assets/bottom1crousel_Image1.svg",
  // "https://res.cloudinary.com/do3vxz4gw/image/upload/v1751544854/svg_assets/bottom1crousel_Image2.svg",
  // "https://res.cloudinary.com/do3vxz4gw/image/upload/v1751544854/svg_assets/bottom1crousel_Image3.svg"
  "https://res.cloudinary.com/djimsqy66/image/upload/v1770105245/banner2_xzrfp0.jpg",
  "https://res.cloudinary.com/djimsqy66/image/upload/v1770105246/banner5_y4j38t.jpg",
  "https://res.cloudinary.com/djimsqy66/image/upload/v1770105246/banner4_me34jb.jpg",
];

const CAROUSEL_HEIGHT = 172; // px, updated as requested

const Bottom1Carousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 1200);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current]);

  return (
    <div
      style={{
        width: '100%',
        height: 172,
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
        {images.map((src, idx) => (
          <div
            key={idx}
            style={{
              height: CAROUSEL_HEIGHT,
              width: '100%',
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={src} alt={`SVG ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bottom1Carousel;


