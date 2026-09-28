import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  PlayerStats,
  Weapon,
  UpgradeItem,
  Enemy,
  EnemyType,
  Projectile,
  XPGem,
  PickupItem,
  Particle,
  FloatingText,
  GameMetrics,
} from '../game/types';
import {
  INITIAL_WEAPONS,
  PASSIVE_UPGRADES,
  ENEMY_CONFIGS,
  XP_PER_LEVEL,
} from '../game/constants';
import { SpatialGrid } from '../game/spatialGrid';
import { GameRenderer } from '../game/renderer';
import { sounds } from '../game/audio';
import { useAuth } from '../firebase/AuthContext';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Trophy,
  Swords,
  Crosshair,
  Radio,
  Disc,
  Bomb,
  Target,
  Wind,
  Magnet,
  Tv,
  Flame,
  User as UserIcon,
  LogOut,
  AlertCircle,
  ShieldCheck,
  Award,
} from 'lucide-react';

const ARENA_SIZE = 2400;
const ONBOARDING_STORAGE_KEY = 'pixel-swarm-onboarding-seen';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Firebase Auth & User Isolation
  const {
    user,
    userStats,
    isGuest,
    loading: authLoading,
    authError,
    clearError,
    signInWithGoogle,
    signInWithFacebook,
    playAsGuest,
    signOutUser,
    saveRunResult,
    leaderboard,
    fetchLeaderboard,
    runHistory,
  } = useAuth();

  // UI state
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [activeMenuTab, setActiveMenuTab] = useState<'welcome' | 'leaderboard'>('welcome');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    try {
      return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);
  const [musicActive, setMusicActive] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeItem[]>([]);
  const [bossAlert, setBossAlert] = useState<string | null>(null);
  const [lastRunStats, setLastRunStats] = useState<{
    kills: number;
    score: number;
    time: number;
    level: number;
    damage: number;
    isNewBest: boolean;
  }>({ kills: 0, score: 0, time: 0, level: 1, damage: 0, isNewBest: false });

  // HUD and Telemetry state
  const [hudStats, setHudStats] = useState({
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNext: 10,
    kills: 0,
    score: 0,
    time: 0,
    dashReady: true,
    dashPct: 1,
  });

  const [metrics, setMetrics] = useState<GameMetrics>({
    fps: 60,
    activeEnemies: 0,
    activeProjectiles: 0,
    activeGems: 0,
    timeSurvived: 0,
    totalDamageDealt: 0,
    collisionsChecked: 0,
    spatialGridBuckets: 0,
  });

  const [activeWeapons, setActiveWeapons] = useState<Weapon[]>([]);

  // Simulation references (avoid re-render loops in 60fps requestAnimationFrame)
  const playerRef = useRef<PlayerStats>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 14,
    hp: 100,
    maxHp: 100,
    speed: 210,
    level: 1,
    xp: 0,
    xpToNext: 15,
    magnetRadius: 100,
    damageMultiplier: 1.0,
    cooldownReduction: 0,
    areaMultiplier: 1.0,
    critChance: 0.05,
    kills: 0,
    score: 0,
    gold: 0,
    dashCooldown: 2.2, // seconds
    dashTimer: 0,
    isDashing: false,
    dashDuration: 0.18,
    dashDirection: { x: 0, y: 0 },
    invulnerableTime: 0,
  });

  const weaponsRef = useRef<Weapon[]>(JSON.parse(JSON.stringify(INITIAL_WEAPONS)));
  const passivesRef = useRef<UpgradeItem[]>(JSON.parse(JSON.stringify(PASSIVE_UPGRADES)));
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const gemsRef = useRef<XPGem[]>([]);
  const pickupsRef = useRef<PickupItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const screenShakeRef = useRef({ x: 0, y: 0, trauma: 0 });

  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const aimAngleRef = useRef(0);

  const nextIdRef = useRef(1);
  const gameTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const totalDamageRef = useRef(0);
  const lastFpsCheckRef = useRef({ time: performance.now(), frames: 0 });
  const animFrameIdRef = useRef<number | null>(null);
  const spatialGridRef = useRef<SpatialGrid<Enemy>>(new SpatialGrid<Enemy>(64));

  // Initialize Game State
  const beginGame = useCallback(() => {
    // Reset player
    playerRef.current = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 14,
      hp: 100,
      maxHp: 100,
      speed: 210,
      level: 1,
      xp: 0,
      xpToNext: 15,
      magnetRadius: 100,
      damageMultiplier: 1.0,
      cooldownReduction: 0,
      areaMultiplier: 1.0,
      critChance: 0.05,
      kills: 0,
      score: 0,
      gold: 0,
      dashCooldown: 2.2,
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0.18,
      dashDirection: { x: 0, y: 0 },
      invulnerableTime: 0,
    };

    weaponsRef.current = JSON.parse(JSON.stringify(INITIAL_WEAPONS));
    passivesRef.current = JSON.parse(JSON.stringify(PASSIVE_UPGRADES));
    enemiesRef.current = [];
    projectilesRef.current = [];
    gemsRef.current = [];
    pickupsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    screenShakeRef.current = { x: 0, y: 0, trauma: 0 };
    gameTimeRef.current = 0;
    lastSpawnRef.current = 0;
    totalDamageRef.current = 0;

    setActiveWeapons(weaponsRef.current.filter((w) => w.level > 0));
    setBossAlert(null);
    setGameState('PLAYING');
    sounds.playLevelUp();
  }, []);

  const startGame = useCallback(() => {
    if (!hasSeenOnboarding) {
      setOnboardingOpen(true);
      return;
    }
    beginGame();
  }, [beginGame, hasSeenOnboarding]);

  const completeOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
    setHasSeenOnboarding(true);
    setOnboardingOpen(false);
    beginGame();
  }, [beginGame]);

  // Trigger GameOver with User Isolated Data Storage
  const triggerGameOver = useCallback(() => {
    const finalKills = playerRef.current.kills;
    const finalScore = playerRef.current.score;
    const finalTime = Math.floor(gameTimeRef.current);
    const finalLevel = playerRef.current.level;
    const prevBest = userStats?.highScore || 0;
    const isNew = finalScore > prevBest;

    setLastRunStats({
      kills: finalKills,
      score: finalScore,
      time: finalTime,
      level: finalLevel,
      damage: Math.round(totalDamageRef.current),
      isNewBest: isNew,
    });

    setGameState('GAME_OVER');
    sounds.playBomb();

    // Persist to Firebase with user isolation
    saveRunResult(finalKills, finalScore, finalTime, finalLevel).catch((err) => {
      console.warn('Score persistence notice:', err);
    });
  }, [userStats, saveRunResult]);

  // Trigger dash
  const performDash = useCallback(() => {
    const player = playerRef.current;
    if (player.dashTimer > 0 || player.isDashing) return;

    let dx = 0;
    let dy = 0;
    if (keysPressedRef.current['KeyW'] || keysPressedRef.current['ArrowUp']) dy -= 1;
    if (keysPressedRef.current['KeyS'] || keysPressedRef.current['ArrowDown']) dy += 1;
    if (keysPressedRef.current['KeyA'] || keysPressedRef.current['ArrowLeft']) dx -= 1;
    if (keysPressedRef.current['KeyD'] || keysPressedRef.current['ArrowRight']) dx += 1;

    if (dx === 0 && dy === 0) {
      dx = Math.cos(aimAngleRef.current);
      dy = Math.sin(aimAngleRef.current);
    } else {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
    }

    player.isDashing = true;
    player.dashDirection = { x: dx, y: dy };
    player.dashTimer = player.dashCooldown;
    player.invulnerableTime = player.dashDuration + 0.05;

    // Dash burst particles
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x: player.x,
        y: player.y,
        vx: -dx * (100 + Math.random() * 120) + (Math.random() - 0.5) * 60,
        vy: -dy * (100 + Math.random() * 120) + (Math.random() - 0.5) * 60,
        size: 3 + Math.random() * 3,
        color: '#38bdf8',
        life: 0.25,
        maxLife: 0.25,
        shape: 'spark',
      });
    }

    sounds.playDash();
  }, []);

  // Handle Level Up choice selection
  const rollLevelUpChoices = useCallback(() => {
    const choices: UpgradeItem[] = [];

    // Weapon upgrades
    const availableWeapons = weaponsRef.current.filter((w) => w.level < w.maxLevel);
    for (const w of availableWeapons) {
      choices.push({
        id: `weapon_${w.id}`,
        name: w.level === 0 ? `Acquire ${w.name}` : `Upgrade ${w.name} Lv.${w.level + 1}`,
        description:
          w.level === 0
            ? w.description
            : `+25% DMG, +1 Projectile, -10% Cooldown for ${w.name}`,
        type: 'weapon',
        weaponId: w.id,
        level: w.level,
        maxLevel: w.maxLevel,
        icon: w.icon,
      });
    }

    // Passive upgrades
    const availablePassives = passivesRef.current.filter((p) => p.level < p.maxLevel);
    for (const p of availablePassives) {
      choices.push(p);
    }

    // Shuffle and pick 3
    const shuffled = [...choices].sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
    setGameState('LEVEL_UP');
    sounds.playLevelUp();
  }, []);

  const selectUpgrade = useCallback(
    (item: UpgradeItem) => {
      const player = playerRef.current;

      if (item.type === 'weapon' && item.weaponId) {
        const weapon = weaponsRef.current.find((w) => w.id === item.weaponId);
        if (weapon) {
          weapon.level += 1;
          weapon.damage = Math.round(weapon.damage * 1.25);
          if (weapon.level > 1 && weapon.level % 2 === 0) {
            weapon.count += 1;
          }
          weapon.cooldown = Math.max(120, Math.round(weapon.cooldown * 0.9));
        }
      } else if (item.type === 'passive' && item.stat) {
        const passive = passivesRef.current.find((p) => p.id === item.id);
        if (passive) {
          passive.level += 1;
        }

        switch (item.stat) {
          case 'damage':
            player.damageMultiplier += item.value || 0.2;
            break;
          case 'speed':
            player.speed += Math.round(player.speed * (item.value || 0.15));
            break;
          case 'cooldown':
            player.cooldownReduction = Math.min(0.5, player.cooldownReduction + (item.value || 0.12));
            break;
          case 'magnet':
            player.magnetRadius += 40;
            break;
          case 'maxHp':
            player.maxHp += item.value || 30;
            player.hp = Math.min(player.maxHp, player.hp + (item.value || 30));
            break;
          case 'crit':
            player.critChance = Math.min(0.6, player.critChance + (item.value || 0.1));
            break;
        }
      }

      setActiveWeapons(weaponsRef.current.filter((w) => w.level > 0));
      setGameState('PLAYING');
      sounds.playGem();
    },
    []
  );

  // Spawn enemy helper
  const spawnEnemy = useCallback((type: EnemyType, customX?: number, customY?: number) => {
    const player = playerRef.current;
    const cfg = ENEMY_CONFIGS[type];

    let x = customX;
    let y = customY;

    if (x === undefined || y === undefined) {
      // Spawn at ring distance around player
      const angle = Math.random() * Math.PI * 2;
      const dist = 550 + Math.random() * 200;
      x = player.x + Math.cos(angle) * dist;
      y = player.y + Math.sin(angle) * dist;
    }

    // Clamp inside arena bounds
    const s2 = ARENA_SIZE / 2 - 40;
    x = Math.max(-s2, Math.min(s2, x));
    y = Math.max(-s2, Math.min(s2, y));

    const enemy: Enemy = {
      id: nextIdRef.current++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: cfg.hp,
      maxHp: cfg.hp,
      speed: cfg.speed + (Math.random() - 0.5) * 20,
      radius: cfg.radius,
      damage: cfg.damage,
      color: cfg.color,
      score: cfg.score,
      xpValue: cfg.xpValue,
      chargeTimer: type === 'charger' ? 2 + Math.random() * 2 : undefined,
      isCharging: false,
      shootCooldown: type === 'spitter' ? 2.5 + Math.random() * 1.5 : undefined,
    };

    enemiesRef.current.push(enemy);
  }, []);

  // Screen shake trigger
  const addScreenShake = useCallback((amount: number) => {
    screenShakeRef.current.trauma = Math.min(1.0, screenShakeRef.current.trauma + amount);
  }, []);

  // Add floating damage number
  const addDamageNumber = useCallback((x: number, y: number, amount: number, isCrit: boolean = false) => {
    floatingTextsRef.current.push({
      id: nextIdRef.current++,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 8,
      text: `${Math.round(amount)}`,
      color: isCrit ? '#facc15' : '#ffffff',
      life: 0.65,
      maxLife: 0.65,
      vy: -55 - Math.random() * 20,
      isCrit,
    });
  }, []);

  // Main Simulation Step (60 FPS tick)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        renderer.resize(canvas.width, canvas.height);
      }
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // Track FPS
      lastFpsCheckRef.current.frames++;
      if (currentTime - lastFpsCheckRef.current.time >= 500) {
        const measuredFps = Math.round(
          (lastFpsCheckRef.current.frames * 1000) / (currentTime - lastFpsCheckRef.current.time)
        );
        lastFpsCheckRef.current.time = currentTime;
        lastFpsCheckRef.current.frames = 0;

        setMetrics({
          fps: measuredFps,
          activeEnemies: enemiesRef.current.length,
          activeProjectiles: projectilesRef.current.length,
          activeGems: gemsRef.current.length,
          timeSurvived: Math.floor(gameTimeRef.current),
          totalDamageDealt: Math.round(totalDamageRef.current),
          collisionsChecked: spatialGridRef.current.checkedPairsThisFrame,
          spatialGridBuckets: spatialGridRef.current.getBucketCount(),
        });
      }

      const player = playerRef.current;

      if (gameState === 'PLAYING') {
        gameTimeRef.current += dt;
        const now = currentTime;

        // 1. Player Dash & Movement
        if (player.dashTimer > 0) {
          player.dashTimer -= dt;
        }

        if (player.invulnerableTime > 0) {
          player.invulnerableTime -= dt;
        }

        if (player.isDashing) {
          const dashSpeed = player.speed * 2.8;
          player.x += player.dashDirection.x * dashSpeed * dt;
          player.y += player.dashDirection.y * dashSpeed * dt;
          player.dashDuration -= dt;
          if (player.dashDuration <= 0) {
            player.isDashing = false;
            player.dashDuration = 0.18;
          }
        } else {
          // Standard WASD / Arrows movement
          let mx = 0;
          let my = 0;
          if (keysPressedRef.current['KeyW'] || keysPressedRef.current['ArrowUp']) my -= 1;
          if (keysPressedRef.current['KeyS'] || keysPressedRef.current['ArrowDown']) my += 1;
          if (keysPressedRef.current['KeyA'] || keysPressedRef.current['ArrowLeft']) mx -= 1;
          if (keysPressedRef.current['KeyD'] || keysPressedRef.current['ArrowRight']) mx += 1;

          if (mx !== 0 || my !== 0) {
            const len = Math.hypot(mx, my);
            mx /= len;
            my /= len;
            const response = 1 - Math.exp(-14 * dt);
            player.vx += (mx * player.speed - player.vx) * response;
            player.vy += (my * player.speed - player.vy) * response;
          } else {
            const damping = Math.exp(-9 * dt);
            player.vx *= damping;
            player.vy *= damping;
          }

          player.x += player.vx * dt;
          player.y += player.vy * dt;
        }

        // Clamp inside arena
        const bound = ARENA_SIZE / 2 - player.radius;
        player.x = Math.max(-bound, Math.min(bound, player.x));
        player.y = Math.max(-bound, Math.min(bound, player.y));

        // 2. Enemy Spawning Wave Progression
        const wave = Math.floor(gameTimeRef.current / 30) + 1;
        const spawnInterval = Math.max(0.12, 1.2 - wave * 0.12);

        if (now - lastSpawnRef.current >= spawnInterval * 1000) {
          lastSpawnRef.current = now;
          const enemiesToSpawn = Math.min(6, 1 + Math.floor(wave * 0.6));

          for (let s = 0; s < enemiesToSpawn; s++) {
            const rand = Math.random();
            if (wave >= 3 && rand < 0.2) {
              spawnEnemy('charger');
            } else if (wave >= 2 && rand < 0.35) {
              spawnEnemy('spitter');
            } else if (wave >= 4 && rand < 0.5) {
              spawnEnemy('splitter');
            } else {
              spawnEnemy('swarmer');
            }
          }
        }

        // Periodic Boss Spawn (Every 90 seconds)
        const bossCheck = Math.floor(gameTimeRef.current);
        if (bossCheck > 0 && bossCheck % 90 === 0 && !enemiesRef.current.some((e) => e.type === 'boss_goliath')) {
          spawnEnemy('boss_goliath');
          setBossAlert('WARNING: MECHA-TITAN GOLIATH APPROACHING!');
          sounds.playBossAlarm();
          addScreenShake(0.6);
          setTimeout(() => setBossAlert(null), 4000);
        }

        // 3. Build Spatial Grid for Enemies (Optimization Architecture)
        const grid = spatialGridRef.current;
        grid.clear();
        for (let i = 0; i < enemiesRef.current.length; i++) {
          grid.insert(enemiesRef.current[i]);
        }

        // 4. Weapons Firing
        const weapons = weaponsRef.current;
        const cdMultiplier = 1.0 - player.cooldownReduction;

        for (let wIdx = 0; wIdx < weapons.length; wIdx++) {
          const w = weapons[wIdx];
          if (w.level === 0) continue;

          // Orbiting blades update
          if (w.type === 'orbit') {
            const targetCount = w.count;
            const existingBlades = projectilesRef.current.filter((p) => p.type === 'blade');
            if (existingBlades.length < targetCount) {
              for (let b = existingBlades.length; b < targetCount; b++) {
                projectilesRef.current.push({
                  id: nextIdRef.current++,
                  type: 'blade',
                  x: player.x,
                  y: player.y,
                  vx: 0,
                  vy: 0,
                  radius: 10,
                  damage: w.damage * player.damageMultiplier,
                  pierce: 9999,
                  remainingPierce: 9999,
                  life: 9999,
                  maxLife: 9999,
                  color: '#38bdf8',
                  hitEnemies: new Set(),
                  angle: (b * (Math.PI * 2)) / targetCount,
                  distance: w.range * player.areaMultiplier,
                });
              }
            }
            continue;
          }

          // Aura weapon tick
          if (w.type === 'aura') {
            if (now - w.lastFired >= w.cooldown * cdMultiplier) {
              w.lastFired = now;
              const auraRadius = w.range * player.areaMultiplier;
              const nearby = grid.queryRange(player.x, player.y, auraRadius);
              for (const e of nearby) {
                const dmg = w.damage * player.damageMultiplier;
                e.hp -= dmg;
                e.hitFlash = now + 80;
                totalDamageRef.current += dmg;
                addDamageNumber(e.x, e.y, dmg, false);
              }
              if (nearby.length > 0) {
                sounds.playBlade();
              }
            }
            continue;
          }

          // Fired weapons
          if (now - w.lastFired >= w.cooldown * cdMultiplier) {
            w.lastFired = now;

            if (w.type === 'laser') {
              const target = grid.findClosest(player.x, player.y, w.range);
              if (target) {
                const angle = Math.atan2(target.y - player.y, target.x - player.x);
                for (let c = 0; c < w.count; c++) {
                  const spread = (c - (w.count - 1) / 2) * 0.12;
                  const finalAngle = angle + spread;
                  projectilesRef.current.push({
                    id: nextIdRef.current++,
                    type: 'bullet',
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(finalAngle) * w.speed,
                    vy: Math.sin(finalAngle) * w.speed,
                    radius: 5,
                    damage: w.damage * player.damageMultiplier,
                    pierce: w.pierce,
                    remainingPierce: w.pierce,
                    life: w.range / w.speed,
                    maxLife: w.range / w.speed,
                    color: '#38bdf8',
                    hitEnemies: new Set(),
                  });
                }
                sounds.playLaser();
              }
            } else if (w.type === 'shotgun') {
              const target = grid.findClosest(player.x, player.y, w.range);
              const targetAngle = target
                ? Math.atan2(target.y - player.y, target.x - player.x)
                : aimAngleRef.current;

              for (let p = 0; p < w.count; p++) {
                const spread = (Math.random() - 0.5) * 0.65;
                const angle = targetAngle + spread;
                const spd = w.speed * (0.85 + Math.random() * 0.3);
                projectilesRef.current.push({
                  id: nextIdRef.current++,
                  type: 'bullet',
                  x: player.x,
                  y: player.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  radius: 4,
                  damage: w.damage * player.damageMultiplier,
                  pierce: w.pierce,
                  remainingPierce: w.pierce,
                  life: w.range / spd,
                  maxLife: w.range / spd,
                  color: '#f97316',
                  hitEnemies: new Set(),
                });
              }
              sounds.playShotgun();
              addScreenShake(0.15);
            } else if (w.type === 'thunder') {
              for (let t = 0; t < w.count; t++) {
                const targets = grid.queryRange(player.x, player.y, w.range);
                if (targets.length > 0) {
                  const target = targets[Math.floor(Math.random() * targets.length)];
                  const radius = 55 * player.areaMultiplier;
                  const blastGroup = grid.queryRange(target.x, target.y, radius);

                  for (const e of blastGroup) {
                    const isCrit = Math.random() < player.critChance;
                    const dmg = w.damage * player.damageMultiplier * (isCrit ? 2 : 1);
                    e.hp -= dmg;
                    e.hitFlash = now + 100;
                    totalDamageRef.current += dmg;
                    addDamageNumber(e.x, e.y, dmg, isCrit);
                  }

                  projectilesRef.current.push({
                    id: nextIdRef.current++,
                    type: 'thunder_bolt',
                    x: target.x,
                    y: target.y,
                    vx: 0,
                    vy: 0,
                    radius,
                    damage: 0,
                    pierce: 999,
                    remainingPierce: 999,
                    life: 0.25,
                    maxLife: 0.25,
                    color: '#38bdf8',
                    hitEnemies: new Set(),
                  });

                  sounds.playThunder();
                  addScreenShake(0.2);
                }
              }
            } else if (w.type === 'grenade') {
              const target = grid.findClosest(player.x, player.y, w.range);
              const tx = target ? target.x : player.x + (Math.random() - 0.5) * 200;
              const ty = target ? target.y : player.y + (Math.random() - 0.5) * 200;
              const dist = Math.hypot(tx - player.x, ty - player.y);
              const speed = w.speed;
              const angle = Math.atan2(ty - player.y, tx - player.x);

              projectilesRef.current.push({
                id: nextIdRef.current++,
                type: 'grenade',
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 8,
                damage: w.damage * player.damageMultiplier,
                pierce: 1,
                remainingPierce: 1,
                life: dist / speed,
                maxLife: dist / speed,
                color: '#f97316',
                hitEnemies: new Set(),
              });
              sounds.playLaser();
            }
          }
        }

        // 5. Update Orbiting Blades
        const bladeWeapon = weapons.find((w) => w.id === 'orbital_blades' && w.level > 0);
        for (let i = 0; i < projectilesRef.current.length; i++) {
          const p = projectilesRef.current[i];
          if (p.type === 'blade') {
            if (bladeWeapon && p.angle !== undefined && p.distance !== undefined) {
              p.angle += bladeWeapon.speed * dt;
              p.x = player.x + Math.cos(p.angle) * p.distance;
              p.y = player.y + Math.sin(p.angle) * p.distance;

              const hitEnemies = grid.queryRange(p.x, p.y, p.radius);
              for (const e of hitEnemies) {
                if (!p.hitEnemies.has(e.id)) {
                  p.hitEnemies.add(e.id);
                  const isCrit = Math.random() < player.critChance;
                  const dmg = p.damage * (isCrit ? 2 : 1);
                  e.hp -= dmg;
                  e.hitFlash = now + 60;
                  totalDamageRef.current += dmg;
                  addDamageNumber(e.x, e.y, dmg, isCrit);
                  sounds.playBlade();

                  setTimeout(() => {
                    p.hitEnemies.delete(e.id);
                  }, 250);
                }
              }
            }
          }
        }

        // 6. Update Projectiles
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
          const p = projectilesRef.current[i];
          if (p.type === 'blade') continue;

          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;

          // Enemy orb projectile hitting player
          if (p.isEnemy) {
            const distToPlayer = Math.hypot(p.x - player.x, p.y - player.y);
            if (distToPlayer <= p.radius + player.radius) {
              if (player.invulnerableTime <= 0) {
                player.hp -= p.damage;
                player.invulnerableTime = 0.4;
                sounds.playHit();
                addScreenShake(0.3);
                if (player.hp <= 0) {
                  triggerGameOver();
                }
              }
              p.life = -1;
            }
          } else {
            const nearby = grid.queryRange(p.x, p.y, p.radius);
            for (const e of nearby) {
              if (!p.hitEnemies.has(e.id)) {
                p.hitEnemies.add(e.id);
                p.remainingPierce--;

                const isCrit = Math.random() < player.critChance;
                const dmg = p.damage * (isCrit ? 2 : 1);
                e.hp -= dmg;
                e.hitFlash = now + 70;
                totalDamageRef.current += dmg;
                addDamageNumber(e.x, e.y, dmg, isCrit);

                const kx = p.vx !== 0 ? Math.sign(p.vx) : (Math.random() - 0.5);
                const ky = p.vy !== 0 ? Math.sign(p.vy) : (Math.random() - 0.5);
                e.x += kx * 8;
                e.y += ky * 8;

                sounds.playHit();

                particlesRef.current.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 120,
                  vy: (Math.random() - 0.5) * 120,
                  size: 3,
                  color: p.color,
                  life: 0.18,
                  maxLife: 0.18,
                  shape: 'spark',
                });

                if (p.remainingPierce <= 0) {
                  p.life = -1;
                  break;
                }
              }
            }
          }

          // Grenade detonation
          if (p.type === 'grenade' && p.life <= 0) {
            const blastRadius = 70 * player.areaMultiplier;
            const victims = grid.queryRange(p.x, p.y, blastRadius);
            for (const e of victims) {
              const dmg = p.damage;
              e.hp -= dmg;
              e.hitFlash = now + 100;
              totalDamageRef.current += dmg;
              addDamageNumber(e.x, e.y, dmg, true);
            }
            sounds.playBomb();
            addScreenShake(0.35);

            for (let k = 0; k < 18; k++) {
              particlesRef.current.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 260,
                vy: (Math.random() - 0.5) * 260,
                size: 4 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
                life: 0.35,
                maxLife: 0.35,
                shape: 'square',
              });
            }
          }

          if (p.life <= 0) {
            projectilesRef.current.splice(i, 1);
          }
        }

        // 7. Update Enemies & AI
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const e = enemiesRef.current[i];

          // Check Enemy Death
          if (e.hp <= 0) {
            player.kills++;
            player.score += e.score;

            let gemColor = '#38bdf8';
            let gemVal = e.xpValue;
            if (gemVal >= 5) {
              gemColor = '#ef4444';
            } else if (gemVal >= 2) {
              gemColor = '#22c55e';
            }

            gemsRef.current.push({
              id: nextIdRef.current++,
              x: e.x,
              y: e.y,
              value: gemVal,
              radius: 5,
              color: gemColor,
              collected: false,
            });

            const dropRoll = Math.random();
            if (e.type === 'boss_goliath') {
              pickupsRef.current.push({
                id: nextIdRef.current++,
                type: 'chest',
                x: e.x,
                y: e.y,
                radius: 12,
                life: 60,
              });
            } else if (dropRoll < 0.02) {
              pickupsRef.current.push({
                id: nextIdRef.current++,
                type: 'health',
                x: e.x,
                y: e.y,
                radius: 10,
                life: 30,
              });
            } else if (dropRoll < 0.035) {
              pickupsRef.current.push({
                id: nextIdRef.current++,
                type: 'bomb',
                x: e.x,
                y: e.y,
                radius: 10,
                life: 30,
              });
            } else if (dropRoll < 0.045) {
              pickupsRef.current.push({
                id: nextIdRef.current++,
                type: 'magnet',
                x: e.x,
                y: e.y,
                radius: 10,
                life: 30,
              });
            }

            if (e.type === 'splitter' && (!e.splitCount || e.splitCount < 1)) {
              for (let sc = 0; sc < 2; sc++) {
                spawnEnemy('swarmer', e.x + (sc === 0 ? -12 : 12), e.y);
              }
            }

            for (let k = 0; k < (e.type === 'boss_goliath' ? 30 : 6); k++) {
              particlesRef.current.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                size: 3 + Math.random() * 3,
                color: e.color,
                life: 0.3,
                maxLife: 0.3,
                shape: 'square',
              });
            }

            enemiesRef.current.splice(i, 1);
            continue;
          }

          // Enemy Movement toward player
          const dx = player.x - e.x;
          const dy = player.y - e.y;
          const distToPlayer = Math.hypot(dx, dy) || 1;

          if (e.type === 'charger') {
            if (e.chargeTimer !== undefined) {
              e.chargeTimer -= dt;
              if (e.chargeTimer <= 0) {
                e.isCharging = true;
                e.vx = (dx / distToPlayer) * (e.speed * 2.5);
                e.vy = (dy / distToPlayer) * (e.speed * 2.5);
                e.chargeTimer = 3.5;
                setTimeout(() => {
                  e.isCharging = false;
                }, 1000);
              }
            }
            if (!e.isCharging) {
              e.vx = (dx / distToPlayer) * e.speed;
              e.vy = (dy / distToPlayer) * e.speed;
            }
          } else if (e.type === 'spitter') {
            if (distToPlayer < 220) {
              e.vx = -(dx / distToPlayer) * e.speed;
              e.vy = -(dy / distToPlayer) * e.speed;
            } else {
              e.vx = (dx / distToPlayer) * e.speed;
              e.vy = (dy / distToPlayer) * e.speed;
            }

            if (e.shootCooldown !== undefined) {
              e.shootCooldown -= dt;
              if (e.shootCooldown <= 0) {
                e.shootCooldown = 2.8;
                projectilesRef.current.push({
                  id: nextIdRef.current++,
                  type: 'enemy_orb',
                  x: e.x,
                  y: e.y,
                  vx: (dx / distToPlayer) * 170,
                  vy: (dy / distToPlayer) * 170,
                  radius: 6,
                  damage: e.damage,
                  pierce: 1,
                  remainingPierce: 1,
                  life: 4,
                  maxLife: 4,
                  color: '#c084fc',
                  hitEnemies: new Set(),
                  isEnemy: true,
                });
              }
            }
          } else {
            e.vx = (dx / distToPlayer) * e.speed;
            e.vy = (dy / distToPlayer) * e.speed;
          }

          e.x += e.vx * dt;
          e.y += e.vy * dt;

          // Enemy touching player damage
          if (distToPlayer <= e.radius + player.radius) {
            if (player.invulnerableTime <= 0) {
              player.hp -= e.damage;
              player.invulnerableTime = 0.45;
              sounds.playHit();
              addScreenShake(0.3);

              if (player.hp <= 0) {
                triggerGameOver();
              }
            }
          }
        }

        // 8. Update XP Gems & Magnet Pull
        for (let i = gemsRef.current.length - 1; i >= 0; i--) {
          const g = gemsRef.current[i];
          const dx = player.x - g.x;
          const dy = player.y - g.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= player.magnetRadius) {
            const pullSpeed = Math.max(350, (player.magnetRadius / (dist + 1)) * 300);
            g.x += (dx / dist) * pullSpeed * dt;
            g.y += (dy / dist) * pullSpeed * dt;
          }

          if (dist <= player.radius + g.radius) {
            player.xp += g.value;
            sounds.playGem();
            gemsRef.current.splice(i, 1);

            if (player.xp >= player.xpToNext) {
              player.level++;
              player.xp -= player.xpToNext;
              player.xpToNext = XP_PER_LEVEL(player.level);
              rollLevelUpChoices();
            }
          }
        }

        // 9. Update Pickups
        for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
          const p = pickupsRef.current[i];
          p.life -= dt;
          const dist = Math.hypot(player.x - p.x, player.y - p.y);

          if (dist <= player.radius + p.radius) {
            if (p.type === 'health') {
              player.hp = Math.min(player.maxHp, player.hp + 40);
              addDamageNumber(player.x, player.y, 40, true);
              sounds.playGem();
            } else if (p.type === 'bomb') {
              sounds.playBomb();
              addScreenShake(0.8);
              for (const e of enemiesRef.current) {
                e.hp -= 250;
                e.hitFlash = now + 150;
                totalDamageRef.current += 250;
                addDamageNumber(e.x, e.y, 250, true);
              }
            } else if (p.type === 'magnet') {
              for (const g of gemsRef.current) {
                g.x = player.x;
                g.y = player.y;
              }
              sounds.playLevelUp();
            } else if (p.type === 'chest') {
              rollLevelUpChoices();
              player.hp = player.maxHp;
            }

            pickupsRef.current.splice(i, 1);
          } else if (p.life <= 0) {
            pickupsRef.current.splice(i, 1);
          }
        }

        // 10. Update Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const part = particlesRef.current[i];
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          part.life -= dt;
          if (part.life <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }

        // 11. Update Floating Damage Texts
        for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
          const txt = floatingTextsRef.current[i];
          txt.y += txt.vy * dt;
          txt.life -= dt;
          if (txt.life <= 0) {
            floatingTextsRef.current.splice(i, 1);
          }
        }

        // 12. Update Screen Shake decay
        const shake = screenShakeRef.current;
        if (shake.trauma > 0) {
          shake.trauma = Math.max(0, shake.trauma - dt * 1.5);
          const maxOffset = 18 * (shake.trauma * shake.trauma);
          shake.x = (Math.random() * 2 - 1) * maxOffset;
          shake.y = (Math.random() * 2 - 1) * maxOffset;
        } else {
          shake.x = 0;
          shake.y = 0;
        }

        // Update HUD display values
        setHudStats({
          hp: Math.max(0, Math.round(player.hp)),
          maxHp: player.maxHp,
          level: player.level,
          xp: player.xp,
          xpToNext: player.xpToNext,
          kills: player.kills,
          score: player.score,
          time: Math.max(0, Math.floor(gameTimeRef.current)),
          dashReady: player.dashTimer <= 0,
          dashPct: player.dashTimer <= 0 ? 1 : 1 - player.dashTimer / player.dashCooldown,
        });
      }

      const nearestTarget = spatialGridRef.current.findClosest(player.x, player.y, 1200);
      if (nearestTarget) {
        aimAngleRef.current = Math.atan2(nearestTarget.y - player.y, nearestTarget.x - player.x);
      }

      // Render Frame
      renderer.clear(player.x, player.y, screenShakeRef.current);
      renderer.drawArenaBounds(ARENA_SIZE);
      renderer.drawGems(gemsRef.current);
      renderer.drawPickups(pickupsRef.current, currentTime);
      renderer.drawEnemies(enemiesRef.current, currentTime);
      renderer.drawActiveAura(
        player,
        weaponsRef.current.find((w) => w.id === 'radiance_aura'),
        currentTime
      );
      renderer.drawPlayer(player, currentTime, aimAngleRef.current);
      renderer.drawProjectiles(projectilesRef.current, currentTime);
      renderer.drawParticles(particlesRef.current);
      renderer.drawFloatingTexts(floatingTextsRef.current);
      renderer.endFrame();

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        performDash();
      }
      if (e.code === 'KeyP') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      resizeObserver.disconnect();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameState, performDash, rollLevelUpChoices, spawnEnemy, addDamageNumber, addScreenShake, triggerGameOver]);

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, secs);
    const mins = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getWeaponIcon = (icon: string) => {
    switch (icon) {
      case 'Zap':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'Disc':
        return <Disc className="w-4 h-4 text-sky-400" />;
      case 'Crosshair':
        return <Crosshair className="w-4 h-4 text-amber-400" />;
      case 'CloudLightning':
        return <Flame className="w-4 h-4 text-blue-400" />;
      case 'Radio':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'Bomb':
        return <Bomb className="w-4 h-4 text-red-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  const personalBestScore = userStats?.highScore ?? 0;

  return (
    <div className={`relative w-full h-[78svh] min-h-[360px] max-h-[860px] bg-slate-950 overflow-hidden border border-white/10 rounded-xl select-none shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_70px_rgba(0,0,0,0.48)] animate-game-enter ${crtEnabled ? 'crt-overlay crt-vignette' : ''}`}>
      {/* HTML5 Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block pixel-crisp cursor-crosshair" />

      {/* TOP HUD BAR */}
      <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 pointer-events-none flex flex-col gap-2 z-20">
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-2">
          {/* Health & XP Cluster */}
          <div className="flex flex-col gap-1.5 w-36 sm:w-64 md:w-80">
            {/* Health Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-pixel text-rose-400 shrink-0">HP</span>
              <div className="relative w-full h-3.5 bg-slate-900 border border-slate-700 overflow-hidden rounded">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, (hudStats.hp / hudStats.maxHp) * 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white tracking-wide">
                  {hudStats.hp} / {hudStats.maxHp}
                </span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-pixel text-cyan-400 shrink-0">LVL {hudStats.level}</span>
              <div className="relative w-full h-2.5 bg-slate-900 border border-slate-700 overflow-hidden rounded">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-sky-400 transition-all duration-150"
                  style={{ width: `${Math.min(100, (hudStats.xp / hudStats.xpToNext) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Time, score, and kills in center */}
          <div className="flex basis-full order-3 sm:basis-auto sm:order-none justify-center items-center gap-2 sm:gap-4 bg-slate-950/60 border border-white/10 px-2 sm:px-4 py-1.5 rounded-lg backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.28)]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-100 tabular-nums">
                {formatTime(hudStats.time)}
              </span>
            </div>
            <div className="w-[1px] h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-200 tabular-nums">
                {hudStats.score.toLocaleString()} PTS
              </span>
            </div>
            <div className="w-[1px] h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-rose-400" />
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-100 tabular-nums">
                {hudStats.kills} KILLS
              </span>
            </div>
          </div>

          {/* Controls: Audio, CRT, Pause */}
          <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
            <button
              onClick={() => {
                const next = !soundMuted;
                setSoundMuted(next);
                sounds.setMute(next);
              }}
              title={soundMuted ? 'Unmute SFX' : 'Mute SFX'}
              className="p-1.5 sm:p-2 bg-slate-900/60 border border-white/10 hover:border-white/30 rounded text-slate-300 backdrop-blur-xl transition-colors"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                const next = !musicActive;
                setMusicActive(next);
                sounds.toggleMusic(next);
              }}
              title={musicActive ? 'Stop Battle Music' : 'Start 8-bit Music'}
              className={`p-1.5 sm:p-2 border rounded backdrop-blur-xl transition-colors ${
                musicActive ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCrtEnabled(!crtEnabled)}
              title="Toggle Retro CRT Scanlines"
              className={`p-1.5 sm:p-2 border rounded backdrop-blur-xl transition-colors ${
                crtEnabled ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
            >
              <Tv className="w-4 h-4" />
            </button>

            {gameState === 'PLAYING' && (
              <button
                onClick={() => setGameState('PAUSED')}
                title="Pause Game"
                className="p-1.5 sm:p-2 bg-slate-900/60 border border-white/10 hover:border-white/30 rounded text-slate-300 backdrop-blur-xl transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Weapons Arsenal Dock */}
        <div className="flex items-center gap-1.5 pt-1">
          {activeWeapons.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-1 px-2 py-1 bg-slate-950/80 border border-slate-800 rounded text-xs font-mono text-slate-300"
              title={`${w.name} Level ${w.level}`}
            >
              {getWeaponIcon(w.icon)}
              <span className="text-[10px] text-amber-400 font-bold">Lv.{w.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DASH ABILITY INDICATOR (Bottom Right) */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 pointer-events-auto flex items-center gap-3 z-20">
        <button
          onClick={performDash}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg font-mono text-xs transition-all ${
            hudStats.dashReady
              ? 'bg-sky-600/90 hover:bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-950'
              : 'bg-slate-900/80 border-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>DASH [SPACE]</span>
          {!hudStats.dashReady && (
            <div className="w-12 h-1.5 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-75"
                style={{ width: `${hudStats.dashPct * 100}%` }}
              />
            </div>
          )}
        </button>
      </div>

      {/* BOSS WARNING BANNER */}
      {bossAlert && (
        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none z-30 animate-pulse">
          <div className="bg-rose-950/90 border-y-2 border-rose-500 px-8 py-3 text-center shadow-2xl backdrop-blur-md">
            <h2 className="text-rose-300 font-pixel text-sm md:text-base tracking-wider">
              {bossAlert}
            </h2>
          </div>
        </div>
      )}

      {/* LEVEL UP MODAL */}
      {gameState === 'LEVEL_UP' && (
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xl flex items-center justify-center z-50 p-3 sm:p-4 animate-backdrop-in">
          <div className="glass-dialog w-full max-w-md max-h-full overflow-y-auto rounded-2xl p-5 sm:p-6 flex flex-col gap-4 animate-dialog-in">
            <div className="text-center">
              <span className="text-xs font-mono text-cyan-400 font-bold">LEVEL UP REACHED!</span>
              <h3 className="text-lg font-bold text-white mt-1">Select Combat Augment</h3>
            </div>

            <div className="flex flex-col gap-3">
              {upgradeOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectUpgrade(item)}
                  className="flex items-center gap-4 p-3 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500 rounded-lg text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-cyan-400">
                    {getWeaponIcon(item.icon)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {item.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WELCOME / SIGN IN / LANDING MODAL */}
      {gameState === 'MENU' && !onboardingOpen && (
        <div className="absolute inset-0 bg-slate-950/38 backdrop-blur-xl flex items-center justify-center z-50 p-3 sm:p-5 animate-backdrop-in" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <div className="glass-dialog max-w-xl w-full max-h-full overflow-y-auto rounded-2xl p-5 sm:p-8 flex flex-col items-center text-center relative animate-dialog-in">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Emblem */}
            <div className="w-12 h-12 bg-cyan-950 border border-cyan-500/50 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-cyan-950/50">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>

            <h1 id="welcome-title" className="text-lg sm:text-xl md:text-2xl font-pixel text-white mb-1.5 leading-relaxed tracking-wide">
              PIXEL SWARM SURVIVAL
            </h1>
            {/* Error Banner */}
            {authError && (
              <div className="w-full mb-4 p-3 bg-rose-950/80 border border-rose-800/80 rounded-lg flex items-center justify-between text-left text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
                <button
                  onClick={clearError}
                  className="text-xs font-mono text-rose-400 hover:text-white px-1.5"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Navigation Tabs on Welcome Card: Auth/Launch vs Hall of Survivors */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg mb-5 w-full max-w-xs">
              <button
                onClick={() => setActiveMenuTab('welcome')}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  activeMenuTab === 'welcome'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setActiveMenuTab('leaderboard');
                  fetchLeaderboard().catch(() => {});
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  activeMenuTab === 'leaderboard'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Leaderboard
              </button>
            </div>

            {/* TAB CONTENT 1: SIGN IN & LAUNCH */}
            {activeMenuTab === 'welcome' && (
              <div className="w-full flex flex-col gap-4">
                {/* STATE A: User is already signed in (Google / Facebook / Guest) */}
                {user || userStats ? (
                  <div className="w-full flex flex-col gap-4">
                    {/* Survivor Identification Card */}
                    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 font-bold text-sm">
                            {user?.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt="Avatar"
                                className="w-full h-full rounded-lg object-cover"
                              />
                            ) : (
                              <UserIcon className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {userStats?.displayName || user?.displayName || 'Active Survivor'}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                                {isGuest ? 'GUEST PROTOCOL' : 'CLOUD SYNCED'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              User ID: {(user?.uid || userStats?.userId || '').slice(0, 12)}...
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={signOutUser}
                          title="Sign Out / Change Account"
                          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-rose-400 p-1.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Switch</span>
                        </button>
                      </div>

                      {/* Isolated Player Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                        <div className="p-2 bg-slate-900/60 rounded border border-slate-800/60 text-center">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">Personal Best</span>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {(userStats?.highScore ?? 0).toLocaleString()} Pts
                          </span>
                        </div>
                        <div className="p-2 bg-slate-900/60 rounded border border-slate-800/60 text-center">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">Total Kills</span>
                          <span className="text-xs font-mono font-bold text-rose-400">
                            {userStats?.totalKills ?? 0}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-900/60 rounded border border-slate-800/60 text-center">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">Runs Initiated</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {userStats?.gamesPlayed ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800/80 pt-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase text-slate-400">Recent Runs</span>
                          <span className="text-[9px] font-mono text-slate-500">LAST 10</span>
                        </div>
                        {runHistory.length === 0 ? (
                          <div className="py-2 text-center text-[10px] font-mono text-slate-500">
                            No saved runs yet
                          </div>
                        ) : (
                          <div className="max-h-28 overflow-y-auto">
                            {runHistory.map((run) => (
                              <div key={run.id} className="flex items-center justify-between border-t border-slate-800/50 py-1.5 text-[10px] font-mono">
                                <span className="text-slate-400">
                                  {new Date(run.createdAt).toLocaleDateString()} · {formatTime(run.timeSurvived)}
                                </span>
                                <span className="font-bold text-amber-400">{run.score.toLocaleString()} Pts</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Launch Game Button */}
                    <div className="flex items-center gap-3 w-full">
                      <button
                        onClick={startGame}
                        className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 text-sm active:scale-[0.99]"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>START SURVIVAL</span>
                      </button>

                    </div>
                  </div>
                ) : (
                  /* STATE B: User is not yet signed in -> Present Welcome Card with Google, Facebook & Guest options */
                  <div className="w-full flex flex-col gap-3">
                    {/* 1. Google Sign In Option */}
                    <button
                      onClick={signInWithGoogle}
                      disabled={authLoading}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/80 rounded-xl transition-all group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {/* Google Clean Inline Vector */}
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-cyan-400">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 block">
                            Google
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* 2. Facebook Sign In Option */}
                    <button
                      onClick={signInWithFacebook}
                      disabled={authLoading}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-blue-500/80 rounded-xl transition-all group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {/* Facebook Clean Inline Vector */}
                        <div className="w-8 h-8 rounded-lg bg-blue-950/50 border border-blue-800 flex items-center justify-center shrink-0 group-hover:border-blue-400">
                          <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white group-hover:text-blue-300 block">
                            Facebook
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* 3. Play as Guest Option */}
                    <button
                      onClick={playAsGuest}
                      disabled={authLoading}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-600 rounded-xl transition-all group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-slate-500">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 block">
                            Guest
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: GLOBAL LEADERBOARD */}
            {activeMenuTab === 'leaderboard' && (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    TOP SURVIVOR RECORDS
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {leaderboard.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-mono">
                      No global survivor records registered yet. Be the first to conquer the swarm!
                    </div>
                  ) : (
                    leaderboard.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
                          user && item.userId === user.uid
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                              idx === 0
                                ? 'bg-amber-500 text-slate-950'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold truncate max-w-[130px]">
                            {item.displayName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{formatTime(item.timeSurvived)}</span>
                          <span className="font-bold text-amber-400">{item.score.toLocaleString()} Pts</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setActiveMenuTab('welcome')}
                  className="w-full py-2.5 mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  Back to Mission Brief
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'MENU' && onboardingOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-xl animate-backdrop-in" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <div className="glass-dialog flex max-h-full w-full max-w-2xl flex-col gap-5 overflow-y-auto rounded-xl p-5 sm:p-7 animate-dialog-in">
            <div className="border-b border-white/10 pb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-300">First-run briefing</span>
              <h2 id="onboarding-title" className="mt-2 font-pixel text-base leading-relaxed text-white sm:text-lg">Outlast the swarm</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">Your record is the number of enemies you defeat. The swarm grows denser as the run goes on, so movement and smart upgrades are the key to lasting longer.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                <Wind className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <div>
                  <h3 className="text-sm font-bold text-white">Keep moving</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400"><kbd className="rounded border border-slate-600 px-1 text-slate-200">WASD</kbd> or arrow keys to move. Press <kbd className="rounded border border-slate-600 px-1 text-slate-200">Space</kbd> to dash away from danger.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <div>
                  <h3 className="text-sm font-bold text-white">Let weapons work</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">Your weapons fire automatically at nearby enemies. Focus on dodging and guiding the swarm into range.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div>
                  <h3 className="text-sm font-bold text-white">Collect XP and adapt</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">Move over the gems enemies leave behind. Each level-up pauses combat so you can strengthen weapons or improve your stats.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold text-white">Build a higher kill count</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">Every enemy adds a kill, but tougher enemies award more points. Build damage to take down high-value threats, and press <kbd className="rounded border border-slate-600 px-1 text-slate-200">P</kbd> to pause.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button
                onClick={completeOnboarding}
                className="rounded-lg border border-slate-600 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
              >
                Skip briefing
              </button>
              <button
                onClick={completeOnboarding}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                <Play className="h-4 w-4 fill-current" />
                Start first run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL (WITH USER ISOLATED DATA STORAGE) */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xl flex items-center justify-center z-50 p-3 sm:p-6 animate-backdrop-in">
          <div className="glass-dialog max-w-md w-full max-h-full overflow-y-auto rounded-2xl p-5 sm:p-8 flex flex-col items-center text-center animate-dialog-in">
            <span className="text-xs font-mono text-rose-400 font-bold mb-1">SYSTEM CRITICAL</span>
            <h2 className="text-2xl font-pixel text-white mb-2">SURVIVOR DOWN</h2>

            {/* User Isolation Badge */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-4 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Synced to {userStats?.displayName || user?.displayName || 'Survivor Profile'}</span>
            </div>

            {lastRunStats.isNewBest && (
              <div className="mb-4 p-2 bg-amber-950/80 border border-amber-600 rounded-lg flex items-center justify-center gap-2 text-xs font-mono text-amber-300 animate-pulse">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>NEW ALL-TIME PERSONAL RECORD!</span>
              </div>
            )}

            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-[10px] text-slate-500 block">TIME SURVIVED</span>
                <span className="text-base font-mono font-bold text-white">
                  {formatTime(lastRunStats.time)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">SCORE</span>
                <span className="text-base font-mono font-bold text-amber-400">
                  {lastRunStats.score.toLocaleString()} PTS
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">TOTAL KILLS</span>
                <span className="text-base font-mono font-bold text-rose-400">
                  {lastRunStats.kills}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">DAMAGE DEALT</span>
                <span className="text-base font-mono font-bold text-cyan-400">
                  {lastRunStats.damage}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">FINAL LEVEL</span>
                <span className="text-base font-mono font-bold text-amber-400">
                  Lv. {lastRunStats.level}
                </span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-backdrop-in">
          <div className="glass-dialog max-w-xs w-full rounded-2xl p-6 text-center flex flex-col gap-4 animate-dialog-in">
            <h3 className="text-lg font-pixel text-white">SIMULATION PAUSED</h3>
            <p className="text-xs text-slate-400">Take a breath. Ready to re-engage the swarm?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setGameState('PLAYING')}
                className="py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                RESUME PLAY
              </button>
              <button
                onClick={() => setGameState('MENU')}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700"
              >
                QUIT TO TITLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
