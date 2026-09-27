import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Sliders,
  Flame,
  Activity,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

type CurveType = 'exponential' | 'wave_surge' | 'sigmoid';

interface DataPoint {
  minute: number;
  timeLabel: string;
  enemiesPerSec: number;
  spawnInterval: number;
  hpMultiplier: number;
  threat: string;
}

export const GodotBlueprint: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scaling' | 'architecture' | 'collision'>('scaling');

  // Dynamic Difficulty Scaling Simulator state
  const [gameTimeMinutes, setGameTimeMinutes] = useState<number>(6.5); // 0 to 20 minutes
  const [curveType, setCurveType] = useState<CurveType>('exponential');

  // Normalized time [0, 1] over a 20-minute run
  const normalizedTime = Math.min(1, Math.max(0, gameTimeMinutes / 20));

  // Compute spawn interval (seconds) & health multiplier based on curve model
  const calculateScaling = (t: number, type: CurveType) => {
    let spawnMultiplier = 1;
    let hpMultiplier = 1;

    if (type === 'exponential') {
      // Exponential ramp: spawn interval drops rapidly, HP scales smoothly
      spawnMultiplier = Math.pow(t, 1.6);
      hpMultiplier = 1 + Math.pow(t * 1.8, 1.8) * 4.5;
    } else if (type === 'wave_surge') {
      // Periodic surge with breathing windows
      const baseRamp = Math.pow(t, 1.4);
      const wave = Math.sin(t * Math.PI * 8) * 0.25;
      spawnMultiplier = Math.max(0.05, baseRamp + wave);
      hpMultiplier = 1 + Math.pow(t, 1.5) * 4.2;
    } else if (type === 'sigmoid') {
      // S-Curve: slow initial rise, explosive mid-game, plateaus at max density
      const k = 10;
      const x0 = 0.45;
      const sigmoid = 1 / (1 + Math.exp(-k * (t - x0)));
      spawnMultiplier = sigmoid;
      hpMultiplier = 1 + sigmoid * 5.0;
    }

    // Map to actual game values: spawn interval from 1.5s down to 0.12s
    const spawnInterval = Math.max(0.12, 1.5 - spawnMultiplier * 1.38);
    const enemiesPerSec = parseFloat((1 / spawnInterval).toFixed(1));
    const healthPercent = Math.round(hpMultiplier * 100);

    return {
      spawnInterval: parseFloat(spawnInterval.toFixed(2)),
      enemiesPerSec,
      healthPercent,
      hpMultiplier: parseFloat(hpMultiplier.toFixed(2)),
    };
  };

  // Determine threat tier
  const getThreatTier = (mins: number) => {
    if (mins < 3) return { name: 'Tier 1: Scout Probing', color: 'text-emerald-400', desc: 'Slow, isolated swarmers allowing initial upgrade drafting.' };
    if (mins < 7) return { name: 'Tier 2: Swarm Infiltration', color: 'text-cyan-400', desc: 'Dense cluster spawns, introduction of armored Chitin Chargers.' };
    if (mins < 12) return { name: 'Tier 3: Relentless Incursion', color: 'text-amber-400', desc: 'Multi-directional spawn pressure, ranged Spitters and Necro Slimes.' };
    if (mins < 16) return { name: 'Tier 4: Apex Cataclysm', color: 'text-rose-400', desc: 'Maximum spawn density, continuous boss and elite waves.' };
    return { name: 'Tier 5: Annihilation Overdrive', color: 'text-purple-400', desc: 'Extreme survival threshold pushing spatial hash collision limits.' };
  };

  const currentStats = calculateScaling(normalizedTime, curveType);
  const threatTier = getThreatTier(gameTimeMinutes);

  // Generate chart data array for recharts
  const chartData = useMemo<DataPoint[]>(() => {
    const data: DataPoint[] = [];
    const totalMinutes = 20;
    for (let m = 0; m <= totalMinutes; m++) {
      const t = m / totalMinutes;
      const stats = calculateScaling(t, curveType);
      data.push({
        minute: m,
        timeLabel: `${m}m`,
        enemiesPerSec: stats.enemiesPerSec,
        spawnInterval: stats.spawnInterval,
        hpMultiplier: stats.hpMultiplier,
        threat: getThreatTier(m).name,
      });
    }
    return data;
  }, [curveType]);

  const formatMinutes = (m: number) => {
    const mins = Math.floor(m);
    const secs = Math.floor((m % 1) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Nearest minute label for the recharts ReferenceLine
  const currentRefLabel = `${Math.round(gameTimeMinutes)}m`;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Blueprint Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>GODOT ENGINE 4.X</span>
            <span aria-hidden="true">·</span>
            <span>SYSTEMS BLUEPRINT</span>
            <span aria-hidden="true">·</span>
            <span>DECOUPLED ARCHITECTURE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Game Systems & Scaling Blueprint
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Architectural models for dynamic difficulty curves, high-throughput spatial broadphase clustering, and decoupled node hierarchies.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setActiveTab('scaling')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'scaling' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dynamic Scaling
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'architecture' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Node Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('collision')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'collision' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Collision Layers
          </button>
        </div>
      </div>

      {/* TAB 1: DYNAMIC DIFFICULTY SCALING */}
      {activeTab === 'scaling' && (
        <div className="p-6 bg-slate-950 flex flex-col gap-6">
          {/* Top Simulation Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Recharts Visual Graph */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Godot 4 Curve Scaling Graph
                  </span>
                </div>

                {/* Curve Pacing Model Selector */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  <button
                    onClick={() => setCurveType('exponential')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                      curveType === 'exponential' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Exponential
                  </button>
                  <button
                    onClick={() => setCurveType('wave_surge')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                      curveType === 'wave_surge' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Surge Waves
                  </button>
                  <button
                    onClick={() => setCurveType('sigmoid')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                      curveType === 'sigmoid' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sigmoid S-Curve
                  </button>
                </div>
              </div>

              {/* Recharts Chart Viewport */}
              <div className="w-full h-56 bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpawn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorHp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                    <XAxis
                      dataKey="timeLabel"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />

                    {/* Left Axis: Spawn Rate (Units/sec) */}
                    <YAxis
                      yAxisId="left"
                      stroke="#38bdf8"
                      domain={[0, 9]}
                      tick={{ fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />

                    {/* Right Axis: HP Multiplier (x Base) */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#f43f5e"
                      domain={[1, 6]}
                      tick={{ fill: '#f43f5e', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as DataPoint;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl font-mono text-[11px] text-slate-200">
                              <span className="text-amber-400 font-bold block mb-1">
                                {d.timeLabel} Elapsed · {d.threat}
                              </span>
                              <div className="flex items-center gap-1.5 text-sky-400">
                                <span>Spawn Cadence:</span>
                                <span className="font-bold">{d.enemiesPerSec} units/sec ({d.spawnInterval}s)</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-rose-400 mt-0.5">
                                <span>Enemy Health:</span>
                                <span className="font-bold">{d.hpMultiplier}x Base HP</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Active Run Time Reference Cursor */}
                    <ReferenceLine
                      x={currentRefLabel}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      yAxisId="left"
                    />

                    {/* Spawn Rate Area */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="enemiesPerSec"
                      name="Spawn Cadence (units/sec)"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSpawn)"
                    />

                    {/* HP Multiplier Curve */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="hpMultiplier"
                      name="HP Multiplier"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray={curveType === 'wave_surge' ? '4 3' : undefined}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Time Slider */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-4 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      <span>Spawn Cadence (units/s)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>HP Multiplier (x Base)</span>
                    </div>
                  </div>

                  <span className="text-amber-400 font-bold text-xs tabular-nums">
                    TIME: {formatMinutes(gameTimeMinutes)} / 20:00
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.25"
                  value={gameTimeMinutes}
                  onChange={(e) => setGameTimeMinutes(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Values & Threat Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 block mb-1">
                  TELEMETRY READOUT
                </span>
                <h3 className="text-base font-bold text-white">Dynamic Difficulty State</h3>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">SPAWN CADENCE</span>
                      <span className="text-sm font-mono font-bold text-sky-400">
                        {currentStats.spawnInterval}s interval
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-900 px-2 py-1 rounded">
                      {currentStats.enemiesPerSec} units/sec
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">ENEMY HEALTH MULTIPLIER</span>
                      <span className="text-sm font-mono font-bold text-rose-400">
                        {currentStats.hpMultiplier}x Base HP
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-900 px-2 py-1 rounded">
                      +{currentStats.healthPercent}%
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">CURRENT THREAT TIER</span>
                    <span className={`text-xs font-mono font-bold ${threatTier.color} block`}>
                      {threatTier.name}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {threatTier.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                Normalized Progress: {(normalizedTime * 100).toFixed(0)}% · Curve sample: sample_baked({normalizedTime.toFixed(2)})
              </div>
            </div>
          </div>

          {/* Architecture & Math Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                <Activity className="w-4 h-4" />
                <span>1. Godot Curve Resource</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Visual Inspector Authoring</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rather than hardcoding rigid formulas, Godot 4 lets designers export native <code className="text-cyan-300 font-mono">Curve</code> resources. Spawners call <code className="text-cyan-300 font-mono">curve.sample_baked(progress)</code> to smoothly modulate timer intervals and spawn density directly from custom-drawn Bezier curves.
              </p>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
                <Flame className="w-4 h-4" />
                <span>2. Exponential Scaling Math</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Preventing Bullet Sponges</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Health scaling follows a non-linear power curve <code className="text-rose-300 font-mono">HP(t) = Base · (1 + α · t^γ)</code>. This keeps pace with player DPS upgrades from weapons while keeping swarm densities high, ensuring individual enemies never feel like tedious damage sponges.
              </p>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>3. Wave Breathing & Pacing</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Periodic Surge Windows</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuous ramp creates sensory fatigue. Combining the base curve with a low-frequency sinusoidal wave creates intense 40-second horde surges followed by 10-second relief valleys where survivors can safely vacuum XP gems and reposition.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NODE TREE SCHEMA */}
      {activeTab === 'architecture' && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950">
          {/* Player Scene Node Tree */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-3">
              <Cpu className="w-4 h-4" />
              <span>Player.tscn (CharacterBody2D)</span>
            </div>
            <div className="font-mono text-xs text-slate-300 space-y-2 border-l border-slate-800 pl-3">
              <div>└─ CharacterBody2D [PlayerController]</div>
              <div className="pl-4 text-slate-400">├─ CollisionShape2D (Physics Boundary)</div>
              <div className="pl-4 text-slate-400">├─ Sprite2D (Cyber Survivor Graphic)</div>
              <div className="pl-4 text-cyan-300">├─ HurtboxArea2D (Layer 3: PlayerHurtbox)</div>
              <div className="pl-4 text-amber-300">├─ WeaponController (Mount Point)</div>
              <div className="pl-4 text-slate-400">├─ DashTimer (0.18s Duration)</div>
              <div className="pl-4 text-slate-400">└─ Camera2D (Trauma-Decay Shake)</div>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Decouples physics movement from combat hurtbox detection. During dashes, Layer 3 is toggled off for zero-damage i-frames.
            </p>
          </div>

          {/* Enemy Pool Scene */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold mb-3">
              <Flame className="w-4 h-4" />
              <span>EnemySpawner.tscn (Node2D)</span>
            </div>
            <div className="font-mono text-xs text-slate-300 space-y-2 border-l border-slate-800 pl-3">
              <div>└─ Node2D [DifficultyDirector]</div>
              <div className="pl-4 text-amber-300">├─ SpawnRateCurve (Godot Curve Resource)</div>
              <div className="pl-4 text-rose-300">├─ HealthScalingCurve (Godot Curve Resource)</div>
              <div className="pl-4 text-slate-400">├─ SpawnTimer (Dynamic Cadence)</div>
              <div className="pl-4 text-emerald-400">├─ SwarmPool (Pre-Warmed 1,500 Nodes)</div>
              <div className="pl-4 text-purple-400">└─ SpatialHashGrid (Broadphase Partition)</div>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Avoids runtime garbage collection pauses by reusing pre-instantiated nodes in memory rather than calling instantiate()/queue_free().
            </p>
          </div>

          {/* Combat / Pickups */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold mb-3">
              <Layers className="w-4 h-4" />
              <span>Projectiles & Pickups</span>
            </div>
            <div className="font-mono text-xs text-slate-300 space-y-2 border-l border-slate-800 pl-3">
              <div>└─ World2D</div>
              <div className="pl-4 text-cyan-300">├─ ProjectilePool (Lasers, Discs, Bombs)</div>
              <div className="pl-4 text-amber-300">├─ GemPool (XP Blue/Green/Red)</div>
              <div className="pl-4 text-rose-300">├─ FloatingTextPool (Damage popups)</div>
              <div className="pl-4 text-slate-400">└─ AudioEngine (SFX bus + Chip-tune)</div>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Floating damage numbers and particle sparks use lightweight custom draw batches to maintain a steady 60 FPS on mobile and low-end hardware.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: COLLISION MATRIX */}
      {activeTab === 'collision' && (
        <div className="p-6 bg-slate-950">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white mb-1">Godot 4 2D Physics Layer Matrix</h3>
            <p className="text-xs text-slate-400">
              Proper bitmask separation ensures player projectiles only check enemy hurtboxes, cutting collision comparisons by 75%.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border border-slate-800">
              <thead>
                <tr className="bg-slate-900 text-slate-300 text-left border-b border-slate-800">
                  <th className="p-3">Layer Index</th>
                  <th className="p-3">Layer Name</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Collision Mask (Interacts With)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-cyan-400 font-bold">Layer 1</td>
                  <td className="p-3 font-semibold text-white">Player_World</td>
                  <td className="p-3 text-slate-400">CharacterBody2D physical boundary</td>
                  <td className="p-3 text-emerald-400">Layer 8 (Arena Obstacles)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-cyan-400 font-bold">Layer 2</td>
                  <td className="p-3 font-semibold text-white">Player_Hitbox</td>
                  <td className="p-3 text-slate-400">Weapons & Projectiles that inflict damage</td>
                  <td className="p-3 text-rose-400">Layer 6 (Enemy_Hurtbox)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-cyan-400 font-bold">Layer 3</td>
                  <td className="p-3 font-semibold text-white">Player_Hurtbox</td>
                  <td className="p-3 text-slate-400">Receives enemy contact & enemy bullet damage</td>
                  <td className="p-3 text-amber-400">Layer 5 (Enemy_Hitbox)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-rose-400 font-bold">Layer 4</td>
                  <td className="p-3 font-semibold text-white">Enemy_World</td>
                  <td className="p-3 text-slate-400">Swarmer soft-body separation</td>
                  <td className="p-3 text-rose-400">Layer 4 (Enemy_World), Layer 8</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-rose-400 font-bold">Layer 5</td>
                  <td className="p-3 font-semibold text-white">Enemy_Hitbox</td>
                  <td className="p-3 text-slate-400">Contact damage & acid spit balls</td>
                  <td className="p-3 text-cyan-400">Layer 3 (Player_Hurtbox)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-rose-400 font-bold">Layer 6</td>
                  <td className="p-3 font-semibold text-white">Enemy_Hurtbox</td>
                  <td className="p-3 text-slate-400">Damage receiver on each swarmer</td>
                  <td className="p-3 text-cyan-400">Layer 2 (Player_Hitbox)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-emerald-400 font-bold">Layer 7</td>
                  <td className="p-3 font-semibold text-white">Collectibles</td>
                  <td className="p-3 text-slate-400">XP gems, magnet orbs, medkits, chests</td>
                  <td className="p-3 text-cyan-400">Layer 1 (Player Magnet & Pickup)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-slate-400 font-bold">Layer 8</td>
                  <td className="p-3 font-semibold text-white">Arena_Walls</td>
                  <td className="p-3 text-slate-400">StaticBody2D boundaries</td>
                  <td className="p-3 text-white">Layers 1, 2, 4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
