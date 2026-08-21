import React, { useEffect, useMemo, useRef } from 'react';
import { BOARD, buildPegs, findTrajectory, Trajectory } from './plinkoPhysics';

/**
 * Canvas renderer for the drop.
 *
 * Canvas rather than DOM nodes because this pushes ~60 peg sprites, a motion trail and
 * a confetti burst every frame; doing that through React state would drop frames on a
 * mid-range phone, which is most of the traffic this popup will see.
 *
 * The trajectory is solved once, up front (see plinkoPhysics), then replayed. That
 * keeps the physics honest while guaranteeing the ball lands on the prize the server
 * already chose — the client never gets a vote.
 */
interface PlinkoBoardProps {
  slotLabels: string[];
  targetSlot: number | null;
  onLanded?: () => void;
}

interface Confetto {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
  size: number;
}

const TRAIL_LENGTH = 14;
const FLASH_FRAMES = 14;
const CONFETTI_COLORS = ['#A497F7', '#7561EF', '#3B1EEB', '#F2F0FF', '#67E3F9'];

/**
 * roundRect only landed in Safari 16, and this runs on whatever phone a shopper has.
 * Falling back to arcTo keeps an old browser from throwing mid-animation.
 */
const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const PlinkoBoard: React.FC<PlinkoBoardProps> = ({ slotLabels, targetSlot, onLanded }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const landedRef = useRef(false);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  const pegs = useMemo(() => buildPegs(), []);
  const binCount = Math.max(slotLabels.length, 1);

  const trajectory: Trajectory | null = useMemo(() => {
    if (targetSlot === null) return null;
    return findTrajectory(pegs, binCount, targetSlot);
  }, [targetSlot, pegs, binCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fit the logical board into the element, accounting for retina displays.
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const scale = Math.min(rect.width / BOARD.width, rect.height / BOARD.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate((rect.width - BOARD.width * scale) / 2, 0);
      ctx.scale(scale, scale);
    };
    resize();
    const onResize = () => {
      resize();
      // Nothing is animating when idle, so a resize has to trigger its own repaint.
      if (rafRef.current === undefined) draw();
    };
    window.addEventListener('resize', onResize);

    landedRef.current = false;
    let frame = 0;
    let lastDrawnFrame = -1;
    const trail: { x: number; y: number }[] = [];
    const hitFlashes = new Map<number, number>();
    let confetti: Confetto[] = [];

    const binWidth = BOARD.width / binCount;
    const playHeight = BOARD.height - BOARD.binZone;
    const frames = trajectory?.frames ?? [];

    const spawnConfetti = (x: number, y: number) => {
      confetti = Array.from({ length: 46 }, () => ({
        x,
        y,
        vx: (Math.random() - 0.5) * 320,
        vy: -Math.random() * 320 - 60,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 12,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 3 + Math.random() * 4,
      }));
    };

    const draw = () => {
      ctx.clearRect(-BOARD.width, 0, BOARD.width * 3, BOARD.height);

      // --- bin zone ------------------------------------------------------
      for (let i = 0; i < binCount; i += 1) {
        const isWinner = trajectory !== null && i === trajectory.bin && landedRef.current;
        ctx.fillStyle = isWinner ? 'rgba(59,30,235,0.14)' : 'rgba(17,17,27,0.035)';
        ctx.beginPath();
        roundedRect(ctx, i * binWidth + 2, playHeight, binWidth - 4, BOARD.binZone - 6, 8);
        ctx.fill();
        if (isWinner) {
          ctx.strokeStyle = 'rgba(59,30,235,0.55)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // --- pegs ----------------------------------------------------------
      pegs.forEach((peg, index) => {
        const flash = hitFlashes.get(index) ?? 0;
        const intensity = flash / FLASH_FRAMES;
        if (intensity > 0) {
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, BOARD.pegRadius + 7 * intensity, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(117,97,239,${0.30 * intensity})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, BOARD.pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = intensity > 0 ? '#3B1EEB' : 'rgba(17,17,27,0.22)';
        ctx.fill();
      });

      // --- trail ---------------------------------------------------------
      trail.forEach((point, i) => {
        const t = i / trail.length;
        ctx.beginPath();
        ctx.arc(point.x, point.y, BOARD.ballRadius * (0.25 + t * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(117,97,239,${t * 0.22})`;
        ctx.fill();
      });

      // --- ball ----------------------------------------------------------
      const current = frames[Math.min(frame, frames.length - 1)];
      if (current) {
        ctx.beginPath();
        ctx.arc(current.x, current.y, BOARD.ballRadius * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(117,97,239,0.16)';
        ctx.fill();

        const gradient = ctx.createRadialGradient(
          current.x - 3, current.y - 3, 1,
          current.x, current.y, BOARD.ballRadius
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.35, '#7561EF');
        gradient.addColorStop(1, '#1800AC');
        ctx.beginPath();
        ctx.arc(current.x, current.y, BOARD.ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // --- confetti ------------------------------------------------------
      confetti.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        ctx.restore();
      });
    };

    const SIM_HZ = 120;
    let lastTime = 0;
    let simTime = 0;

    const step = (now: number) => {
      // Advance by elapsed time, not a fixed number of frames per callback.
      //
      // The solver runs at a fixed 120Hz for stable collisions, but requestAnimationFrame
      // does not: it fires at 120Hz on a high-refresh phone (so a fixed step would play
      // the drop at double speed) and throttles to roughly 1Hz in a background tab (so it
      // would crawl). Clamping the delta also stops the ball teleporting through the board
      // when the tab returns to the foreground after being hidden.
      if (!lastTime) lastTime = now;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (frames.length) {
        simTime += delta;
        frame = Math.min(Math.floor(simTime * SIM_HZ), frames.length - 1);
        const point = frames[frame];

        trail.push({ x: point.x, y: point.y });
        if (trail.length > TRAIL_LENGTH) trail.shift();

        // Every simulated frame crossed since the last paint, so a bounce is never
        // missed when a slow tick skips over it.
        for (let f = lastDrawnFrame + 1; f <= frame; f += 1) {
          const hit = frames[f]?.hit ?? -1;
          if (hit >= 0) hitFlashes.set(hit, FLASH_FRAMES);
        }
        lastDrawnFrame = frame;
        hitFlashes.forEach((value, key) => {
          if (value <= 1) hitFlashes.delete(key);
          else hitFlashes.set(key, value - 1);
        });

        if (frame >= frames.length - 1 && !landedRef.current) {
          landedRef.current = true;
          spawnConfetti(point.x, point.y);
          onLandedRef.current?.();
        }
      }

      if (confetti.length) {
        confetti = confetti
          .map((c) => ({
            ...c,
            x: c.x + c.vx * delta,
            y: c.y + c.vy * delta,
            vy: c.vy + 900 * delta,
            rot: c.rot + c.vr * delta,
          }))
          .filter((c) => c.y < BOARD.height + 40);
      }

      draw();

      // Stop once there is nothing left moving. The loop used to run forever, which
      // meant an idle popup repainted 60 times a second on every homepage visit —
      // wasted battery on exactly the mobile devices this is aimed at.
      const stillFalling = frames.length > 0 && frame < frames.length - 1;
      if (stillFalling || confetti.length > 0) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = undefined;
      }
    };

    if (!frames.length) {
      // Idle board, before the player has dropped anything: paint it once and idle.
      draw();
    } else if (reduceMotion) {
      // Respect the setting: show the outcome, skip the fall.
      frame = frames.length - 1;
      landedRef.current = true;
      draw();
      onLandedRef.current?.();
    } else {
      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [trajectory, pegs, binCount]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="block w-full"
        style={{ height: 'min(52vh, 420px)' }}
        aria-hidden
      />
      <div
        className="mt-2 flex gap-1"
        role="status"
        aria-label={
          trajectory ? `You won ${slotLabels[trajectory.bin]}` : 'Prize slots'
        }
      >
        {slotLabels.map((label, index) => {
          const won = trajectory !== null && landedRef.current && index === trajectory.bin;
          return (
            <div
              key={`${label}-${index}`}
              className={`flex-1 rounded-lg px-1 py-2.5 text-center text-[11px] font-medium transition-all duration-300 sm:text-xs ${
                won
                  ? 'scale-105 bg-primary-600 text-white shadow-lg shadow-primary-600/35'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlinkoBoard;
