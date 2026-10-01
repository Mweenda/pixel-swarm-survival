export interface CampaignPlanet {
  id: string;
  name: string;
  epithet: string;
  story: string;
  bossName: string;
  bossColor: string;
}

export const PLANETS: CampaignPlanet[] = [
  {
    id: 'mars',
    name: 'Mars',
    epithet: 'The Red Frontier',
    story: 'A buried distress beacon wakes beneath the red dust. Its signal points beyond Mars, and the swarm is already moving.',
    bossName: 'The Rustbound Colossus',
    bossColor: '#f97316',
  },
  {
    id: 'venus',
    name: 'Venus',
    epithet: 'The Furnace Veil',
    story: 'The beacon leads through Venusian cloud and fire. Something has learned to thrive in the heat—and it has found your trail.',
    bossName: 'The Cinder Matriarch',
    bossColor: '#fb7185',
  },
  {
    id: 'earth',
    name: 'Earth',
    epithet: 'The Last Blue Haven',
    story: 'Earth is the swarm’s next target. The signal was a warning from the first world it consumed; now the final defense begins at home.',
    bossName: 'The World-Eater Engine',
    bossColor: '#38bdf8',
  },
  {
    id: 'mercury',
    name: 'Mercury',
    epithet: 'The Scorched Relay',
    story: 'A relay on Mercury reveals the swarm’s command frequency. Solar storms tear across the surface as its guardian closes in.',
    bossName: 'The Sunforge Behemoth',
    bossColor: '#facc15',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    epithet: 'The Storm Giant',
    story: 'The command signal is amplified inside Jupiter’s endless storms. Silence the giant relay before the swarm reaches every moon.',
    bossName: 'The Tempest Sovereign',
    bossColor: '#c084fc',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    epithet: 'The Shattered Rings',
    story: 'Saturn’s rings are packed with dormant machines. The swarm has turned them into a moving fortress around its strongest sentinel yet.',
    bossName: 'The Ringbreaker',
    bossColor: '#fbbf24',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    epithet: 'The Tilted Frontier',
    story: 'Beyond Saturn, the signal twists with Uranus’s magnetic field. Its guardian bends the battlefield around the swarm’s core.',
    bossName: 'The Axis Devourer',
    bossColor: '#67e8f9',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    epithet: 'The Dark Blue',
    story: 'Neptune hides the swarm’s origin in a world of crushing storms. Break through its last defense and the signal will have nowhere left to run.',
    bossName: 'The Abyssal Regent',
    bossColor: '#818cf8',
  },
  {
    id: 'pluto',
    name: 'Pluto',
    epithet: 'The Edge of the Known',
    story: 'At the edge of the system, the swarm gathers for one final stand. End its signal here, and the planets can begin to heal.',
    bossName: 'The Null Crown',
    bossColor: '#e879f9',
  },
];

export const SWARMS_PER_PLANET = 6;
export const SWARM_DURATION_SECONDS = 30;

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

export function getSwarmForTime(timeSeconds: number): number {
  const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0;
  return Math.min(SWARMS_PER_PLANET, Math.floor(safeTime / SWARM_DURATION_SECONDS) + 1);
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
