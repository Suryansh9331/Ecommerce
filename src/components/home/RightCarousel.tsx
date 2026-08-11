import React, { useState, useEffect, useRef } from "react";

const images = [
  "https://res.cloudinary.com/dggzjpqdi/image/upload/v1786433938/ChatGPT_Image_Aug_11_2026_01_07_26_PM_1_m21tnf.png",
  "https://res.cloudinary.com/dggzjpqdi/image/upload/v1786434065/ChatGPT_Image_Aug_11_2026_01_09_37_PM_dk7u2y.png",
"https://res.cloudinary.com/dggzjpqdi/image/upload/v1786434265/ChatGPT_Image_Aug_11_2026_01_13_26_PM_angc5a.png"
];

const CAROUSEL_HEIGHT = 564; // px, adjust as needed for your SVG size + margin

const RightCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 1400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current]);

  return (
    <div
      style={{
        width: 368,
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
        {images.map((src, idx) => (
          <div
            key={idx}
            style={{
              height: CAROUSEL_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={src} alt={`SVG ${idx + 1}`} style={{ height: "100%", width: "auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightCarousel;
