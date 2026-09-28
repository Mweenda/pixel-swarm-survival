export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'LEVEL_UP' | 'GAME_OVER' | 'VICTORY';

export type WeaponType = 'orbit' | 'laser' | 'shotgun' | 'thunder' | 'aura' | 'grenade';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  level: number;
  maxLevel: number;
  damage: number;
  cooldown: number; // in milliseconds
  lastFired: number;
  count: number;
  speed: number;
  range: number;
  pierce: number;
  description: string;
  icon: string;
}

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'passive';
  weaponId?: string;
  stat?: 'speed' | 'damage' | 'cooldown' | 'magnet' | 'maxHp' | 'area' | 'crit';
  value?: number;
  level: number;
  maxLevel: number;
  icon: string;
}

export type EnemyType = 'swarmer' | 'charger' | 'spitter' | 'splitter' | 'boss_goliath';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  color: string;
  score: number;
  xpValue: number;
  // Specific enemy state
  chargeTimer?: number;
  isCharging?: boolean;
  shootCooldown?: number;
  splitCount?: number;
  hitFlash?: number; // timestamp until flash ends
}

export interface Projectile {
  id: number;
  type: 'bullet' | 'blade' | 'thunder_bolt' | 'grenade' | 'enemy_orb' | 'aura_pulse';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierce: number;
  remainingPierce: number;
  life: number;
  maxLife: number;
  color: string;
  hitEnemies: Set<number>; // to avoid multi-hitting same enemy in single frame
  angle?: number; // for rotating blades
  distance?: number; // distance from player for orbiting blades
  isEnemy?: boolean;
}

export interface XPGem {
  id: number;
  x: number;
  y: number;
  value: number;
  radius: number;
  color: string;
  collected: boolean;
}

export interface PickupItem {
  id: number;
  type: 'health' | 'bomb' | 'magnet' | 'chest';
  x: number;
  y: number;
  radius: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  shape: 'square' | 'spark';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  isCrit?: boolean;
}

export interface PlayerStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  level: number;
  xp: number;
  xpToNext: number;
  magnetRadius: number;
  damageMultiplier: number;
  cooldownReduction: number;
  areaMultiplier: number;
  critChance: number;
  kills: number;
  score: number;
  gold: number;
  dashCooldown: number;
  dashTimer: number; // current cooldown timer
  isDashing: boolean;
  dashDuration: number;
  dashDirection: { x: number; y: number };
  invulnerableTime: number;
}

export interface GameMetrics {
  fps: number;
  activeEnemies: number;
  activeProjectiles: number;
  activeGems: number;
  timeSurvived: number;
  totalDamageDealt: number;
  collisionsChecked: number;
  spatialGridBuckets: number;
}
