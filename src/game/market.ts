import { INITIAL_WEAPONS, PASSIVE_UPGRADES } from './constants';
import { UpgradeItem } from './types';

export interface MarketWallet {
  balance: number;
  queuedUpgrades: Record<string, number>;
}

export interface MarketOffer {
  upgrade: UpgradeItem;
  nextLevel: number;
  cost: number;
  queuedCount: number;
}

export const EMPTY_MARKET_WALLET: MarketWallet = {
  balance: 0,
  queuedUpgrades: {},
};

export type MarketWalletIdentity =
  | { kind: 'user'; userId: string }
  | { kind: 'guest'; sessionId: string };

export const getMarketWalletKey = (identity: MarketWalletIdentity): string =>
  identity.kind === 'user'
    ? `pixel-swarm-market-v1:${identity.userId}`
    : `pixel-swarm-market-v1:guest:${identity.sessionId}`;

export function parseMarketWallet(serialized: string | null): MarketWallet {
  if (!serialized) return EMPTY_MARKET_WALLET;

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!parsed || typeof parsed !== 'object') return EMPTY_MARKET_WALLET;

    const value = parsed as Partial<MarketWallet>;
    const balance = Number.isFinite(value.balance) ? Math.max(0, Math.floor(value.balance as number)) : 0;
    const queuedUpgrades: Record<string, number> = {};

    if (value.queuedUpgrades && typeof value.queuedUpgrades === 'object') {
      for (const [id, count] of Object.entries(value.queuedUpgrades)) {
        if (/^(weapon_[a-z0-9_]+|upgrade_[a-z0-9_]+)$/.test(id) && Number.isFinite(count)) {
          const safeCount = Math.min(5, Math.max(0, Math.floor(count as number)));
          if (safeCount > 0) queuedUpgrades[id] = safeCount;
        }
      }
    }

    return { balance, queuedUpgrades };
  } catch {
    return EMPTY_MARKET_WALLET;
  }
}

export function bankRunScore(wallet: MarketWallet, score: number): MarketWallet {
  const reward = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  return { ...wallet, balance: wallet.balance + reward };
}

export function getMarketOffers(queuedUpgrades: Record<string, number>): MarketOffer[] {
  const weaponOffers: MarketOffer[] = INITIAL_WEAPONS.flatMap((weapon) => {
    const id = `weapon_${weapon.id}`;
    const level = weapon.level + (queuedUpgrades[id] || 0);
    if (level >= weapon.maxLevel) return [];

    const upgrade: UpgradeItem = {
      id,
      name: level === 0 ? `Acquire ${weapon.name}` : `Upgrade ${weapon.name} Lv.${level + 1}`,
      description: level === 0 ? weapon.description : `+25% DMG, +1 Projectile, -10% Cooldown for ${weapon.name}`,
      type: 'weapon',
      weaponId: weapon.id,
      level,
      maxLevel: weapon.maxLevel,
      icon: weapon.icon,
    };

    return [{
      upgrade,
      nextLevel: level + 1,
      cost: level === 0 ? 300 : 220 + (level - 1) * 120,
      queuedCount: queuedUpgrades[id] || 0,
    }];
  });

  const passiveOffers: MarketOffer[] = PASSIVE_UPGRADES.flatMap((passive) => {
    const level = passive.level + (queuedUpgrades[passive.id] || 0);
    if (level >= passive.maxLevel) return [];

    return [{
      upgrade: { ...passive, level },
      nextLevel: level + 1,
      cost: 180 + level * 120,
      queuedCount: queuedUpgrades[passive.id] || 0,
    }];
  });

  return [...weaponOffers, ...passiveOffers];
}

export function purchaseMarketOffer(wallet: MarketWallet, offer: MarketOffer): MarketWallet | null {
  if (wallet.balance < offer.cost) return null;

  const id = offer.upgrade.id;
  const queuedCount = wallet.queuedUpgrades[id] || 0;
  const currentLevel = offer.upgrade.level - offer.queuedCount + queuedCount;
  if (currentLevel !== offer.upgrade.level || currentLevel >= offer.upgrade.maxLevel) return null;

  return {
    balance: wallet.balance - offer.cost,
    queuedUpgrades: {
      ...wallet.queuedUpgrades,
      [id]: queuedCount + 1,
    },
  };
}
