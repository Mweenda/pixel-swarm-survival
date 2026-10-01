export interface CampaignPlanet {
  id: string;
  name: string;
  epithet: string;
  story: string;
  bossName: string;
  bossColor: string;
  bosses: CampaignBoss[];
  canvasTheme: PlanetCanvasTheme;
}

export interface CampaignBoss {
  name: string;
  color: string;
  epic: boolean;
}

export interface PlanetCanvasTheme {
  background: string;
  pixelColors: string[];
  accent: string;
  pattern: 'dunes' | 'magma' | 'canopy' | 'craters' | 'storms' | 'rings' | 'ice' | 'abyss' | 'frost';
}

export const PLANETS: CampaignPlanet[] = [
  {
    id: 'mars',
    name: 'Mars',
    epithet: 'The Red Frontier',
    story: 'A buried distress beacon wakes beneath the red dust. Its signal points beyond Mars, and the swarm is already moving.',
    bossName: 'The Rustbound Colossus',
    bossColor: '#f97316',
    bosses: [
      { name: 'Dustline Stalker', color: '#fb923c', epic: false },
      { name: 'Ironmaw Ravager', color: '#ef4444', epic: false },
      { name: 'The Buried Harvester', color: '#f59e0b', epic: false },
      { name: 'Redstorm Behemoth', color: '#dc2626', epic: false },
      { name: 'The Crater Warden', color: '#c2410c', epic: false },
      { name: 'The Rustbound Colossus', color: '#f97316', epic: true },
    ],
    canvasTheme: { background: '#160c0b', pixelColors: ['#3f1713', '#74271b', '#a33a20', '#e45b2c'], accent: '#fb6a32', pattern: 'dunes' },
  },
  {
    id: 'venus',
    name: 'Venus',
    epithet: 'The Furnace Veil',
    story: 'The beacon leads through Venusian cloud and fire. Something has learned to thrive in the heat—and it has found your trail.',
    bossName: 'The Cinder Matriarch',
    bossColor: '#fb7185',
    bosses: [
      { name: 'Sulfur Wisp', color: '#fda4af', epic: false },
      { name: 'The Ashen Broodguard', color: '#fb7185', epic: false },
      { name: 'Magma-Tusk Brute', color: '#f43f5e', epic: false },
      { name: 'The Furnace Devourer', color: '#e11d48', epic: false },
      { name: 'Pyroclast Sentinel', color: '#be123c', epic: false },
      { name: 'The Cinder Matriarch', color: '#fb7185', epic: true },
    ],
    canvasTheme: { background: '#170b15', pixelColors: ['#45132f', '#761b38', '#ad2c39', '#e34b45'], accent: '#fb7185', pattern: 'magma' },
  },
  {
    id: 'earth',
    name: 'Earth',
    epithet: 'The Last Blue Haven',
    story: 'Earth is the swarm’s next target. The signal was a warning from the first world it consumed; now the final defense begins at home.',
    bossName: 'The World-Eater Engine',
    bossColor: '#38bdf8',
    bosses: [
      { name: 'Canopy Skitterlord', color: '#4ade80', epic: false },
      { name: 'The Rootbound Keeper', color: '#22c55e', epic: false },
      { name: 'Tidepool Crusher', color: '#2dd4bf', epic: false },
      { name: 'The Blooming Blight', color: '#a3e635', epic: false },
      { name: 'Continental Devourer', color: '#0ea5e9', epic: false },
      { name: 'The World-Eater Engine', color: '#38bdf8', epic: true },
    ],
    canvasTheme: { background: '#071718', pixelColors: ['#103b34', '#17654a', '#248c55', '#36b76b'], accent: '#4ade80', pattern: 'canopy' },
  },
  {
    id: 'mercury',
    name: 'Mercury',
    epithet: 'The Scorched Relay',
    story: 'A relay on Mercury reveals the swarm’s command frequency. Solar storms tear across the surface as its guardian closes in.',
    bossName: 'The Sunforge Behemoth',
    bossColor: '#facc15',
    bosses: [
      { name: 'Solar Flare Mite', color: '#fde047', epic: false },
      { name: 'The Glasswing Striker', color: '#fbbf24', epic: false },
      { name: 'Scorchplate Reaver', color: '#f97316', epic: false },
      { name: 'The Daybreak Crusher', color: '#eab308', epic: false },
      { name: 'Corona Siege Core', color: '#fb923c', epic: false },
      { name: 'The Sunforge Behemoth', color: '#facc15', epic: true },
    ],
    canvasTheme: { background: '#171308', pixelColors: ['#44320d', '#795014', '#b17b19', '#e5ae2b'], accent: '#facc15', pattern: 'craters' },
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    epithet: 'The Storm Giant',
    story: 'The command signal is amplified inside Jupiter’s endless storms. Silence the giant relay before the swarm reaches every moon.',
    bossName: 'The Tempest Sovereign',
    bossColor: '#c084fc',
    bosses: [
      { name: 'Cloudbank Prowler', color: '#d8b4fe', epic: false },
      { name: 'The Lightning Maw', color: '#a78bfa', epic: false },
      { name: 'Great Red Devastator', color: '#fb7185', epic: false },
      { name: 'The Cyclone Tyrant', color: '#c084fc', epic: false },
      { name: 'Magnetosphere Breaker', color: '#818cf8', epic: false },
      { name: 'The Tempest Sovereign', color: '#c084fc', epic: true },
    ],
    canvasTheme: { background: '#17100d', pixelColors: ['#4d2418', '#814029', '#b86636', '#df9a58'], accent: '#d8b4fe', pattern: 'storms' },
  },
  {
    id: 'saturn',
    name: 'Saturn',
    epithet: 'The Shattered Rings',
    story: 'Saturn’s rings are packed with dormant machines. The swarm has turned them into a moving fortress around its strongest sentinel yet.',
    bossName: 'The Ringbreaker',
    bossColor: '#fbbf24',
    bosses: [
      { name: 'Shardwing Sentry', color: '#fde68a', epic: false },
      { name: 'The Ice-Ring Lancer', color: '#fbbf24', epic: false },
      { name: 'Cassini Wrecker', color: '#fb923c', epic: false },
      { name: 'The Belt Devourer', color: '#f59e0b', epic: false },
      { name: 'Titan Gatekeeper', color: '#d97706', epic: false },
      { name: 'The Ringbreaker', color: '#fbbf24', epic: true },
    ],
    canvasTheme: { background: '#15120b', pixelColors: ['#3d3013', '#71602a', '#a88c43', '#d6bb76'], accent: '#fde68a', pattern: 'rings' },
  },
  {
    id: 'uranus',
    name: 'Uranus',
    epithet: 'The Tilted Frontier',
    story: 'Beyond Saturn, the signal twists with Uranus’s magnetic field. Its guardian bends the battlefield around the swarm’s core.',
    bossName: 'The Axis Devourer',
    bossColor: '#67e8f9',
    bosses: [
      { name: 'Frostbitten Drone', color: '#a5f3fc', epic: false },
      { name: 'The Tilted Stalker', color: '#67e8f9', epic: false },
      { name: 'Magnetic Pinwheel', color: '#22d3ee', epic: false },
      { name: 'The Cryo-Maw', color: '#38bdf8', epic: false },
      { name: 'Pole-Shift Colossus', color: '#0ea5e9', epic: false },
      { name: 'The Axis Devourer', color: '#67e8f9', epic: true },
    ],
    canvasTheme: { background: '#08151a', pixelColors: ['#103441', '#15566a', '#23819a', '#4ab3c8'], accent: '#67e8f9', pattern: 'ice' },
  },
  {
    id: 'neptune',
    name: 'Neptune',
    epithet: 'The Dark Blue',
    story: 'Neptune hides the swarm’s origin in a world of crushing storms. Break through its last defense and the signal will have nowhere left to run.',
    bossName: 'The Abyssal Regent',
    bossColor: '#818cf8',
    bosses: [
      { name: 'Trench Lurker', color: '#a5b4fc', epic: false },
      { name: 'The Deepcurrent Hunter', color: '#818cf8', epic: false },
      { name: 'Pressure-Shell Brute', color: '#6366f1', epic: false },
      { name: 'The Midnight Eel', color: '#4f46e5', epic: false },
      { name: 'Darkwater Harbinger', color: '#4338ca', epic: false },
      { name: 'The Abyssal Regent', color: '#818cf8', epic: true },
    ],
    canvasTheme: { background: '#080d20', pixelColors: ['#111b44', '#1b2d70', '#2948a0', '#466bd0'], accent: '#818cf8', pattern: 'abyss' },
  },
  {
    id: 'pluto',
    name: 'Pluto',
    epithet: 'The Edge of the Known',
    story: 'At the edge of the system, the swarm gathers for one final stand. End its signal here, and the planets can begin to heal.',
    bossName: 'The Null Crown',
    bossColor: '#e879f9',
    bosses: [
      { name: 'Permafrost Warden', color: '#f0abfc', epic: false },
      { name: 'The Pale Comet', color: '#e879f9', epic: false },
      { name: 'Kuiper Ravager', color: '#d946ef', epic: false },
      { name: 'The Frozen Oracle', color: '#c026d3', epic: false },
      { name: 'Terminus Devourer', color: '#a21caf', epic: false },
      { name: 'The Null Crown', color: '#e879f9', epic: true },
    ],
    canvasTheme: { background: '#120a1c', pixelColors: ['#311343', '#54216e', '#8138a5', '#b967d0'], accent: '#e879f9', pattern: 'frost' },
  },
];

export const SWARMS_PER_PLANET = 6;
export const BOSS_ARRIVAL_INTERVAL_SECONDS = 30;
export const BOSS_INTERMISSION_SECONDS = 8;

export interface CampaignProgress {
  planetIndex: number;
  swarm: number;
  complete: boolean;
}

export const INITIAL_CAMPAIGN_PROGRESS: CampaignProgress = {
  planetIndex: 0,
  swarm: 1,
  complete: false,
};

export function getPlanetBoss(planetIndex: number, swarm: number): CampaignBoss {
  const safePlanetIndex = Number.isInteger(planetIndex)
    ? Math.max(0, Math.min(PLANETS.length - 1, planetIndex))
    : 0;
  const safeSwarm = Number.isInteger(swarm) ? Math.max(1, Math.min(SWARMS_PER_PLANET, swarm)) : 1;
  return PLANETS[safePlanetIndex].bosses[safeSwarm - 1];
}

export function getNextBossArrivalTime(lastBossAt: number, bossDefeatedAt: number): number {
  const safeLastBossAt = Number.isFinite(lastBossAt) ? Math.max(0, lastBossAt) : 0;
  const safeBossDefeatedAt = Number.isFinite(bossDefeatedAt) ? Math.max(0, bossDefeatedAt) : safeLastBossAt;
  return Math.max(
    safeLastBossAt + BOSS_ARRIVAL_INTERVAL_SECONDS,
    safeBossDefeatedAt + BOSS_INTERMISSION_SECONDS
  );
}

export function normalizeCampaignProgress(value: unknown): CampaignProgress {
  if (!value || typeof value !== 'object') return INITIAL_CAMPAIGN_PROGRESS;
  const raw = value as Partial<CampaignProgress>;
  const planetIndex = Number.isInteger(raw.planetIndex)
    ? Math.max(0, Math.min(PLANETS.length - 1, raw.planetIndex as number))
    : 0;
  const swarm = Number.isInteger(raw.swarm)
    ? Math.max(1, Math.min(SWARMS_PER_PLANET, raw.swarm as number))
    : 1;
  const complete = raw.complete === true && planetIndex === PLANETS.length - 1;
  return { planetIndex, swarm: complete ? SWARMS_PER_PLANET : swarm, complete };
}

export function parseCampaignProgress(serialized: string | null): CampaignProgress {
  if (!serialized) return INITIAL_CAMPAIGN_PROGRESS;
  try {
    return normalizeCampaignProgress(JSON.parse(serialized));
  } catch {
    return INITIAL_CAMPAIGN_PROGRESS;
  }
}

export function advanceCampaignPlanet(progress: CampaignProgress): CampaignProgress {
  if (progress.complete) return progress;
  if (progress.planetIndex >= PLANETS.length - 1) {
    return { planetIndex: PLANETS.length - 1, swarm: SWARMS_PER_PLANET, complete: true };
  }
  return { planetIndex: progress.planetIndex + 1, swarm: 1, complete: false };
}
