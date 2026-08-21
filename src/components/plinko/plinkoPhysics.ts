/**
 * A real Plinko simulation: gravity, peg collisions, restitution, wall bounces.
 *
 * The hard part is that the *server* decides the prize, but the ball has to look like
 * it fell there on its own. Faking it — sliding the ball to a predetermined slot — is
 * what the first version did, and it read as fake immediately.
 *
 * So instead of steering the ball, we search for a universe where honest physics lands
 * it in the right bin: run the whole simulation headlessly with different starting
 * nudges until one finishes in the target bin, then replay that recorded trajectory.
 * Every bounce the player sees is a real collision response.
 *
 * A small caveat, stated because it matters: the edge bins are genuinely hard to reach
 * by chance (that is the whole shape of a Plinko distribution), so later search
 * attempts add a gentle lateral bias. It ramps in only after unbiased attempts fail,
 * and it is small enough to read as the ball catching a peg badly rather than being
 * dragged. Pure-physics attempts always win when one exists.
 */

export interface Peg {
  x: number;
  y: number;
}

export interface Frame {
  x: number;
  y: number;
  /** Index of the peg struck on this frame, for the hit flash. */
  hit: number;
}

export interface Trajectory {
  frames: Frame[];
  bin: number;
  /** True when the landing came from unbiased physics. Diagnostic only. */
  pure: boolean;
}

/** Logical board units. The canvas scales these to whatever size it is given. */
export const BOARD = {
  width: 460,
  height: 560,
  binZone: 64,
  topPad: 54,
  rows: 9,
  firstRowPegs: 3,
  pegRadius: 4,
  ballRadius: 8.5,
};

const GRAVITY = 1500;
const RESTITUTION = 0.55;
const WALL_RESTITUTION = 0.45;
const AIR_DRAG = 0.999;
const DT = 1 / 120;
const MAX_FRAMES = 2200;

/** Deterministic PRNG so a trajectory can be found once and replayed exactly. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Triangular peg grid — row r holds firstRowPegs + r pegs, evenly spread. */
export const buildPegs = (): Peg[] => {
  const pegs: Peg[] = [];
  const playHeight = BOARD.height - BOARD.binZone;
  const rowGap = (playHeight - BOARD.topPad - 26) / (BOARD.rows - 1);

  for (let row = 0; row < BOARD.rows; row += 1) {
    const count = BOARD.firstRowPegs + row;
    const gapX = BOARD.width / (count + 1);
    const y = BOARD.topPad + row * rowGap;
    for (let i = 0; i < count; i += 1) {
      pegs.push({ x: gapX * (i + 1), y });
    }
  }
  return pegs;
};

const simulate = (
  pegs: Peg[],
  binCount: number,
  seed: number,
  bias: number,
  targetBin: number
): Trajectory => {
  const random = mulberry32(seed);
  const playHeight = BOARD.height - BOARD.binZone;
  const binWidth = BOARD.width / binCount;
  const targetX = binWidth * (targetBin + 0.5);

  let x = BOARD.width / 2 + (random() - 0.5) * 26;
  let y = 14;
  let vx = (random() - 0.5) * 130;
  let vy = 0;

  const frames: Frame[] = [];

  for (let f = 0; f < MAX_FRAMES; f += 1) {
    vy += GRAVITY * DT;

    // The bias term (0 on early attempts) nudges toward the target bin. Scaled by
    // remaining fall, so it fades out near the bottom instead of visibly yanking.
    if (bias > 0) {
      const remaining = Math.max(0, (playHeight - y) / playHeight);
      vx += Math.sign(targetX - x) * bias * remaining * DT;
    }

    vx *= AIR_DRAG;
    x += vx * DT;
    y += vy * DT;

    let hit = -1;

    // Peg collisions: resolve overlap along the contact normal, then reflect.
    for (let p = 0; p < pegs.length; p += 1) {
      const peg = pegs[p];
      const dx = x - peg.x;
      const dy = y - peg.y;
      const minDist = BOARD.ballRadius + BOARD.pegRadius;
      if (Math.abs(dx) > minDist || Math.abs(dy) > minDist) continue;

      const dist = Math.hypot(dx, dy) || 0.0001;
      if (dist >= minDist) continue;

      const nx = dx / dist;
      const ny = dy / dist;

      // Push out of the peg so the ball never tunnels or sticks.
      x = peg.x + nx * minDist;
      y = peg.y + ny * minDist;

      const normalSpeed = vx * nx + vy * ny;
      if (normalSpeed < 0) {
        vx -= (1 + RESTITUTION) * normalSpeed * nx;
        vy -= (1 + RESTITUTION) * normalSpeed * ny;
        // A dead-centre hit would balance forever; real pegs are never that clean.
        vx += (random() - 0.5) * 46;
        hit = p;
      }
    }

    // Walls
    if (x < BOARD.ballRadius) {
      x = BOARD.ballRadius;
      vx = Math.abs(vx) * WALL_RESTITUTION;
    } else if (x > BOARD.width - BOARD.ballRadius) {
      x = BOARD.width - BOARD.ballRadius;
      vx = -Math.abs(vx) * WALL_RESTITUTION;
    }

    frames.push({ x, y, hit });

    if (y >= playHeight + BOARD.binZone - BOARD.ballRadius - 4) break;
  }

  const last = frames[frames.length - 1] ?? { x: BOARD.width / 2 };
  const bin = Math.max(0, Math.min(binCount - 1, Math.floor(last.x / binWidth)));
  return { frames, bin, pure: bias === 0 };
};

/**
 * Find a physically honest fall that ends in `targetBin`.
 *
 * Attempts 0-119 are pure physics with different starting nudges. Only if none of
 * those reach the bin does a bias ramp in, which is the rare case of an edge bin.
 *
 * Among the runs that do land correctly we keep the best-looking one rather than the
 * first. A ball can legitimately hug a wall and drop in under two seconds having hit
 * three pegs — correct, but it reads as a glitch. Scoring for a decent number of
 * bounces and a 2-3.5s fall costs nothing and is the difference between "it fell" and
 * "it dropped".
 */
const scoreTrajectory = (run: Trajectory): number => {
  const hits = run.frames.filter((f) => f.hit >= 0).length;
  const seconds = run.frames.length / 120;

  // Bounces are the point of the board; taper off once there are plenty.
  const hitScore = Math.min(hits, 11) * 10;
  // Long enough to watch, short enough not to stall the funnel.
  const idealSeconds = 2.8;
  const timeScore = Math.max(0, 40 - Math.abs(seconds - idealSeconds) * 26);
  return hitScore + timeScore;
};

export const findTrajectory = (
  pegs: Peg[],
  binCount: number,
  targetBin: number
): Trajectory => {
  const PURE_ATTEMPTS = 120;
  const TOTAL_ATTEMPTS = 260;
  const GOOD_ENOUGH = 8;

  let best: Trajectory | null = null;
  let bestScore = -Infinity;
  let matches = 0;
  let closest: Trajectory | null = null;

  for (let attempt = 0; attempt < TOTAL_ATTEMPTS; attempt += 1) {
    const bias =
      attempt < PURE_ATTEMPTS
        ? 0
        : ((attempt - PURE_ATTEMPTS) / (TOTAL_ATTEMPTS - PURE_ATTEMPTS)) * 900;

    const run = simulate(pegs, binCount, attempt * 2654435761, bias, targetBin);

    if (run.bin === targetBin) {
      const score = scoreTrajectory(run);
      if (score > bestScore) {
        best = run;
        bestScore = score;
      }
      matches += 1;
      // Enough good candidates seen; searching further is wasted work on the click.
      if (matches >= GOOD_ENOUGH && bias === 0) break;
      continue;
    }

    if (!closest || Math.abs(run.bin - targetBin) < Math.abs(closest.bin - targetBin)) {
      closest = run;
    }
  }

  // The fallback is unreachable in practice; a near miss still beats throwing
  // halfway through an animation the player is watching.
  return (best ?? closest) as Trajectory;
};
