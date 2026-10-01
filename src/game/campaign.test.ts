import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceCampaignPlanet,
  getSwarmForTime,
  INITIAL_CAMPAIGN_PROGRESS,
  normalizeCampaignProgress,
  parseCampaignProgress,
  PLANETS,
  SWARM_DURATION_SECONDS,
  SWARMS_PER_PLANET,
} from './campaign';

test('campaign follows the requested Mars through Pluto planet order', () => {
  assert.deepEqual(PLANETS.map(({ name }) => name), [
    'Mars', 'Venus', 'Earth', 'Mercury', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  ]);
});

test('each planet has six time-based swarms and swarm six is capped', () => {
  assert.equal(getSwarmForTime(0), 1);
  assert.equal(getSwarmForTime(SWARM_DURATION_SECONDS - 0.01), 1);
  assert.equal(getSwarmForTime(SWARM_DURATION_SECONDS), 2);
  assert.equal(getSwarmForTime(SWARM_DURATION_SECONDS * (SWARMS_PER_PLANET - 1)), 6);
  assert.equal(getSwarmForTime(SWARM_DURATION_SECONDS * 30), 6);
  assert.equal(getSwarmForTime(Number.NaN), 1);
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
