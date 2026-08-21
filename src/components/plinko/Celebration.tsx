import React, { useEffect, useRef } from 'react';

/**
 * A one-shot confetti burst for the moment the prize is won.
 *
 * Separate from PlinkoBoard because the board unmounts the instant the player wins —
 * the celebration has to outlive it and cover the whole panel, not just the canvas the
 * ball fell through.
 *
 * Fires once and stops: the loop ends when the last piece leaves the frame, so a
 * lingering popup is not repainting for no reason.
 */
const COLORS = ['#3B1EEB', '#7561EF', '#A497F7', '#F2B705', '#22CCEE', '#FF6B9D'];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
  w: number;
  h: number;
}

interface CelebrationProps {
  /** 'big' for the win itself; 'small' for the quieter beat after the code unlocks. */
  intensity?: 'big' | 'small';
}

const Celebration: React.FC<CelebrationProps> = ({ intensity = 'big' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Two side cannons plus a centre burst, which reads as a celebration rather than
    // as rain falling from the top of the panel.
    const pieces: Piece[] = [];
    const spawn = (originX: number, originY: number, spread: number, count: number) => {
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        const speed = 320 + Math.random() * 420;
        pieces.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 14,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          w: 6 + Math.random() * 6,
          h: 3 + Math.random() * 5,
        });
      }
    };
    const scale = intensity === 'small' ? 0.4 : 1;
    spawn(rect.width * 0.5, rect.height * 0.45, Math.PI * 1.6, Math.round(70 * scale));
    spawn(0, rect.height * 0.8, Math.PI * 0.5, Math.round(40 * scale));
    spawn(rect.width, rect.height * 0.8, Math.PI * 0.5, Math.round(40 * scale));
    // The side cannons fire inward; without this the left one throws off-screen.
    pieces.forEach((p) => {
      if (p.x === 0 && p.vx < 0) p.vx = -p.vx;
      if (p.x === rect.width && p.vx > 0) p.vx = -p.vx;
    });

    let raf: number;
    let last = 0;

    const frame = (now: number) => {
      if (!last) last = now;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, rect.width, rect.height);

      let alive = 0;
      pieces.forEach((p) => {
        p.vy += 1250 * delta;
        p.vx *= 0.99;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.rot += p.vr * delta;

        if (p.y > rect.height + 30) return;
        alive += 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (alive > 0) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
};

export default Celebration;
