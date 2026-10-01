import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceCampaignPlanet,
  BOSS_ARRIVAL_INTERVAL_SECONDS,
  BOSS_INTERMISSION_SECONDS,
  getNextBossArrivalTime,
  getPlanetBoss,
  INITIAL_CAMPAIGN_PROGRESS,
  normalizeCampaignProgress,
  parseCampaignProgress,
  PLANETS,
  SWARMS_PER_PLANET,
} from './campaign';

test('campaign follows the requested Mars through Pluto planet order', () => {
  assert.deepEqual(PLANETS.map(({ name }) => name), [
    'Mars', 'Venus', 'Earth', 'Mercury', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  ]);
});

test('every planet has six unique bosses and reserves swarm six for its epic boss', () => {
  assert.equal(new Set(PLANETS.map(({ canvasTheme }) => canvasTheme.pattern)).size, PLANETS.length);
  for (let planetIndex = 0; planetIndex < PLANETS.length; planetIndex += 1) {
    const planet = PLANETS[planetIndex];
    assert.equal(planet.bosses.length, SWARMS_PER_PLANET);
    assert.equal(new Set(planet.bosses.map(({ name }) => name)).size, SWARMS_PER_PLANET);
    assert.equal(planet.bosses.filter(({ epic }) => epic).length, 1);
    assert.equal(getPlanetBoss(planetIndex, 6).epic, true);
    assert.equal(getPlanetBoss(planetIndex, 1).epic, false);
  }
});

test('boss arrivals keep a 30-second cadence, with an intermission after longer fights', () => {
  let arrival = 0;
  for (let defeatedBoss = 1; defeatedBoss < SWARMS_PER_PLANET; defeatedBoss += 1) {
    arrival = getNextBossArrivalTime(arrival, arrival + 2);
  }
  assert.equal(arrival, BOSS_ARRIVAL_INTERVAL_SECONDS * (SWARMS_PER_PLANET - 1));
  assert.equal(getNextBossArrivalTime(30, 55), 55 + BOSS_INTERMISSION_SECONDS);
  assert.equal(getNextBossArrivalTime(Number.NaN, Number.NaN), BOSS_ARRIVAL_INTERVAL_SECONDS);
});

test('planet advancement resets the swarm checkpoint and finishes after Pluto', () => {
  assert.deepEqual(advanceCampaignPlanet({ planetIndex: 0, swarm: 6, complete: false }), {
    planetIndex: 1,
    swarm: 1,
    complete: false,
  });
  const pluto = { planetIndex: PLANETS.length - 1, swarm: 6, complete: false };
  const completed = advanceCampaignPlanet(pluto);
  assert.deepEqual(completed, { ...pluto, complete: true });
  assert.deepEqual(advanceCampaignPlanet(completed), completed);
});

test('campaign progression visits every planet exactly once in order', () => {
  let progress = { planetIndex: 0, swarm: SWARMS_PER_PLANET, complete: false };
  for (let expectedPlanet = 1; expectedPlanet < PLANETS.length; expectedPlanet += 1) {
    progress = advanceCampaignPlanet(progress);
    assert.equal(progress.planetIndex, expectedPlanet);
    assert.equal(progress.swarm, 1);
    assert.equal(progress.complete, false);
    progress = { ...progress, swarm: SWARMS_PER_PLANET };
  }
  progress = advanceCampaignPlanet(progress);
  assert.equal(progress.complete, true);
  assert.equal(progress.planetIndex, PLANETS.length - 1);
});

test('campaign checkpoints are normalized and malformed saved data is safe', () => {
  assert.deepEqual(normalizeCampaignProgress({ planetIndex: 99, swarm: 99 }), {
    planetIndex: PLANETS.length - 1,
    swarm: SWARMS_PER_PLANET,
    complete: false,
  });
  assert.deepEqual(parseCampaignProgress('{broken'), INITIAL_CAMPAIGN_PROGRESS);
  assert.deepEqual(parseCampaignProgress(null), INITIAL_CAMPAIGN_PROGRESS);
  assert.deepEqual(normalizeCampaignProgress({ planetIndex: PLANETS.length - 1, swarm: 1, complete: true }), {
    planetIndex: PLANETS.length - 1,
    swarm: SWARMS_PER_PLANET,
    complete: true,
  });
});
