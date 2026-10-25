import type { ComponentType } from 'preact';
import { Pirates, Tigers } from './induction';
import { Weighing, GlassBalls } from './search';
import { TrailingZeros, PowerTower } from './numbers';
import { LastBall, Chameleons } from './invariants';
import { RaceTrack } from './racetrack';
import { HatParity, RainbowHats } from './hats';
import { RiverCrossing } from './river';
import { BalancedTernary } from './ternary';
import { LnXOverX, Steinmetz, SnowPlow, EulerSeries, Bernoulli, RootFind } from './calculus';
import { Correlation, Eigen, Cholesky } from './linalg';
import { MonteCarlo } from './montecarlo';
import { Birthday, RandomWalk } from './probability';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, ComponentType<any>> = {
  pirates: Pirates,
  tigers: Tigers,
  weighing: Weighing,
  glassballs: GlassBalls,
  trailingzeros: TrailingZeros,
  powertower: PowerTower,
  lastball: LastBall,
  chameleons: Chameleons,
  racetrack: RaceTrack,
  hatparity: HatParity,
  rainbowhats: RainbowHats,
  river: RiverCrossing,
  ternary: BalancedTernary,
  lnxoverx: LnXOverX,
  steinmetz: Steinmetz,
  snowplow: SnowPlow,
  euler: EulerSeries,
  bernoulli: Bernoulli,
  rootfind: RootFind,
  correlation: Correlation,
  eigen: Eigen,
  cholesky: Cholesky,
  montecarlo: MonteCarlo,
  birthday: Birthday,
  randomwalk: RandomWalk,
};

export function Widget({ spec }: { spec: { type: string; props?: Record<string, unknown> } }) {
  const C = REGISTRY[spec.type];
  if (!C) return null;
  return <C {...(spec.props || {})} />;
}
