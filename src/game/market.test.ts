import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bankRunScore,
  EMPTY_MARKET_WALLET,
  getMarketOffers,
  getMarketWalletKey,
  parseMarketWallet,
  purchaseMarketOffer,
} from './market';

test('guest market wallets use isolated page-session identities', () => {
  const firstGuestKey = getMarketWalletKey({ kind: 'guest', sessionId: 'session-one' });
  const secondGuestKey = getMarketWalletKey({ kind: 'guest', sessionId: 'session-two' });

  assert.equal(firstGuestKey, getMarketWalletKey({ kind: 'guest', sessionId: 'session-one' }));
  assert.notEqual(firstGuestKey, secondGuestKey);
  assert.equal(getMarketWalletKey({ kind: 'user', userId: 'player-one' }), 'pixel-swarm-market-v1:player-one');
});

test('banking a run adds its score to persistent market credits', () => {
  assert.deepEqual(bankRunScore({ balance: 125, queuedUpgrades: {} }, 375), {
    balance: 500,
    queuedUpgrades: {},
  });
});

test('wallet parsing safely handles malformed and negative saved values', () => {
  assert.deepEqual(parseMarketWallet('{broken'), EMPTY_MARKET_WALLET);
  assert.deepEqual(parseMarketWallet(JSON.stringify({ balance: -10, queuedUpgrades: { weapon_plasma_laser: 99, unknown: 4 } })), {
    balance: 0,
    queuedUpgrades: { weapon_plasma_laser: 5 },
  });
});

test('purchases reserve credits and queue only the next-run upgrade', () => {
  const wallet = { balance: 500, queuedUpgrades: {} };
  const offer = getMarketOffers(wallet.queuedUpgrades).find(({ upgrade }) => upgrade.id === 'weapon_orbital_blades');
  assert.ok(offer);

  assert.deepEqual(purchaseMarketOffer(wallet, offer), {
    balance: 200,
    queuedUpgrades: { weapon_orbital_blades: 1 },
  });
  assert.equal(purchaseMarketOffer({ balance: 200, queuedUpgrades: { weapon_orbital_blades: 1 } }, offer), null);
  assert.deepEqual(wallet, { balance: 500, queuedUpgrades: {} });
});

test('market blocks unaffordable purchases and removes fully queued upgrades', () => {
  const offers = getMarketOffers({});
  const first = offers.find(({ upgrade }) => upgrade.id === 'upgrade_damage');
  assert.ok(first);
  assert.equal(purchaseMarketOffer({ balance: first.cost - 1, queuedUpgrades: {} }, first), null);

  const maxQueued = getMarketOffers({ weapon_orbital_blades: 5 });
  assert.equal(maxQueued.some(({ upgrade }) => upgrade.id === 'weapon_orbital_blades'), false);
});
