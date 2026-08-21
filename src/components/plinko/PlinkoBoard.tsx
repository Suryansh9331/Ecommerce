import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * The peg board and the falling puck.
 *
 * The server decides the prize; this only animates towards it — the same contract
 * SpinWheel.tsx already uses (call the API, then spin to the segment it returned).
 * Letting the client pick the landing slot would let anyone replay until they got the
 * best one.
 *
 * `targetSlot` is an index into the rendered slots. We derive a sequence of left/right
 * hops that provably ends there, then shuffle *which* rows go right so the path looks
 * different every drop while still terminating on the same slot.
 */
interface PlinkoBoardProps {
  slotLabels: string[];
  targetSlot: number | null;
  rows?: number;
  onLanded?: () => void;
}

const PEG_ROWS_DEFAULT = 7;

/** Hop directions that land on `target`: pick `target` rights out of `rows`, in random order. */
const buildPath = (rows: number, target: number): number[] => {
  const rights = Math.max(0, Math.min(target, rows));
  const hops = [
    ...Array(rights).fill(1),
    ...Array(rows - rights).fill(0),
  ];
  for (let i = hops.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [hops[i], hops[j]] = [hops[j], hops[i]];
  }
  return hops;
};

const PlinkoBoard: React.FC<PlinkoBoardProps> = ({
  slotLabels,
  targetSlot,
  rows = PEG_ROWS_DEFAULT,
  onLanded,
}) => {
  const [step, setStep] = useState(0);

  // The board is a triangle: row i has i+1 pegs, mirroring the reference layout.
  const pegRows = useMemo(
    () => Array.from({ length: rows }, (_, row) => Array.from({ length: row + 2 }, (_, i) => i)),
    [rows]
  );

  const path = useMemo(
    () => (targetSlot === null ? [] : buildPath(rows, targetSlot)),
    [targetSlot, rows]
  );

  useEffect(() => {
    if (targetSlot === null) {
      setStep(0);
      return;
    }
    setStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= rows; i += 1) {
      timers.push(setTimeout(() => setStep(i), i * 260));
    }
    timers.push(setTimeout(() => onLanded?.(), rows * 260 + 400));
    return () => timers.forEach(clearTimeout);
    // onLanded is intentionally excluded: a new identity each render would restart
    // the drop mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSlot, rows]);

  // Horizontal offset in "half-slot" units, accumulated over the hops taken so far.
  const offset = path.slice(0, step).reduce((acc, hop) => acc + (hop === 1 ? 1 : -1), 0);
  const slotWidthPct = 100 / Math.max(slotLabels.length, 1);
  const puckLeft = 50 + (offset * slotWidthPct) / 2;

  return (
    <div className="w-full select-none">
      <div className="relative mx-auto" style={{ maxWidth: 420 }}>
        {/* Puck */}
        {targetSlot !== null && (
          <motion.div
            aria-hidden
            className="absolute z-10 h-4 w-4 rounded-full bg-primary-600 shadow-lg"
            initial={{ top: 0, left: '50%' }}
            animate={{
              top: `${(step / rows) * 100}%`,
              left: `${puckLeft}%`,
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        )}

        {/* Pegs */}
        <div className="flex flex-col items-center gap-3 py-2">
          {pegRows.map((pegs, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-center gap-5">
              {pegs.map((peg) => (
                <span
                  key={peg}
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                    step > rowIndex ? 'bg-primary-500' : 'bg-gray-800/70'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Prize slots */}
      <div className="mt-4 flex overflow-hidden rounded-md border border-gray-200 text-[11px]">
        {slotLabels.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className={`flex-1 border-r border-gray-200 px-1 py-2 text-center last:border-r-0 transition-colors ${
              targetSlot === index && step >= rows
                ? 'bg-primary-600 font-semibold text-white'
                : 'text-gray-600'
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlinkoBoard;
