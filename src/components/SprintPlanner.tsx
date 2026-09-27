import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Zap,
  Palette,
  Trophy,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SprintTask {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
}

interface SprintPhase {
  id: string;
  name: string;
  hours: string;
  description: string;
  icon: 'mechanics' | 'visuals' | 'polish';
  tasks: SprintTask[];
}

const INITIAL_PHASES: SprintPhase[] = [
  {
    id: 'phase_1',
    name: 'Core Mechanics & Swarm Physics',
    hours: 'Hours 0–8',
    description: 'Focus strictly on movement, collision, and bullet systems using placeholder colored blocks. Do NOT touch art yet.',
    icon: 'mechanics',
    tasks: [
      {
        id: 'p1_t1',
        title: 'Player CharacterBody2D setup',
        detail: 'Configure 8-way normalized vector, velocity move_and_slide(), acceleration, and friction damping in GDScript.',
        completed: true,
      },
      {
        id: 'p1_t2',
        title: 'Collision Layer Matrix',
        detail: 'Set 2D physics layers (Player Hurtbox on Layer 3, Enemy Hitbox on Layer 5) to prevent accidental friendly fire calculations.',
        completed: true,
      },
      {
        id: 'p1_t3',
        title: 'Screen-Edge Enemy Spawner',
        detail: 'Create a perimeter spawn ring around the player camera using TAU angle randomization.',
        completed: true,
      },
      {
        id: 'p1_t4',
        title: 'Pre-Warmed Object Pool (1,000 Nodes)',
        detail: 'Instantiate enemies once into an Array[Node2D] pool and toggle visible/process instead of queue_free().',
        completed: true,
      },
      {
        id: 'p1_t5',
        title: 'Auto-Aim Nearest Target Routine',
        detail: 'Write a spatial query loop or distance_squared_to check to automatically fire at the closest swarm member.',
        completed: false,
      },
    ],
  },
  {
    id: 'phase_2',
    name: 'Visuals, Audio & Juice',
    hours: 'Hours 8–16',
    description: 'Swap blocks for pixel art sprites, craft snappy Web Audio sound effects, and add essential screen shake.',
    icon: 'visuals',
    tasks: [
      {
        id: 'p2_t1',
        title: 'Pixel Art Tileset & AnimatedSprite2D',
        detail: 'Import 16x16 or 32x32 tileset, configure TextureFilter to Nearest (pixel crisp) in Project Settings.',
        completed: true,
      },
      {
        id: 'p2_t2',
        title: 'Camera2D Screen Shake Rig',
        detail: 'Implement trauma-based exponential decay shake (trauma^2) for juicy punch on hits and explosions.',
        completed: true,
      },
      {
        id: 'p2_t3',
        title: 'Retro Sound Synthesizer (SFX)',
        detail: 'Synthesize chiptune sound effects: laser zap, shotgun boom, crystal gem pickup, and level-up chord.',
        completed: true,
      },
      {
        id: 'p2_t4',
        title: 'CPUParticles2D Burst System',
        detail: 'Emit pixel sparks on enemy impacts and blood splatter stains on the floor.',
        completed: true,
      },
      {
        id: 'p2_t5',
        title: 'Optional CRT Scanline Shader',
        detail: 'Create a CanvasItem shader overlay with subtle horizontal raster lines and vignette curvature.',
        completed: true,
      },
    ],
  },
  {
    id: 'phase_3',
    name: 'Game Loop, Roguelite Upgrades & Polish',
    hours: 'Hours 16–24',
    description: 'Tie together the roguelite upgrade loop, balance weapon cooldowns, and implement title/death screens.',
    icon: 'polish',
    tasks: [
      {
        id: 'p3_t1',
        title: 'XP Gem Vacuum & Level-Up Progression',
        detail: 'XP magnet pull formula with exponential speed ramp as gems near the player radius.',
        completed: true,
      },
      {
        id: 'p3_t2',
        title: 'Card Selection Upgrade Modal',
        detail: 'Pause tree (get_tree().paused = true), roll 3 random upgrades, and resume upon player selection.',
        completed: true,
      },
      {
        id: 'p3_t3',
        title: 'Boss Wave Encounter (Minute 2 & 5)',
        detail: 'Spawn high-HP Mecha Goliath with dedicated boss health bar and chest loot drop.',
        completed: true,
      },
      {
        id: 'p3_t4',
        title: 'Game Over Screen & High Score Storage',
        detail: 'Record kills and survival time to ConfigFile or LocalStorage for replayability.',
        completed: true,
      },
      {
        id: 'p3_t5',
        title: 'HTML5 Web Export & Ad Monetization Hook',
        detail: 'Export Godot 4 Web build with WebAssembly and JavaScriptBridge rewarded ad integration.',
        completed: false,
      },
    ],
  },
];

export const SprintPlanner: React.FC = () => {
  const [phases, setPhases] = useState<SprintPhase[]>(INITIAL_PHASES);
  const [expandedPhase, setExpandedPhase] = useState<string>('phase_1');

  const toggleTask = (phaseId: string, taskId: string) => {
    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          tasks: phase.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      })
    );
  };

  const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = phases.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.completed).length,
    0
  );
  const percentComplete = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <span>24-HOUR GAME JAM BLUEPRINT</span>
            <span>·</span>
            <span>GODOT 4 SPRINT ROADMAP</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            How to Build Pixel Swarm in 24 Hours
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            A disciplined, phased breakdown to prototype, animate, and launch a complete 2D swarm survival roguelite within a single weekend sprint.
          </p>
        </div>

        {/* Sprint Progress Gauge */}
        <div className="flex flex-col gap-1.5 min-w-[200px] p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">SPRINT PROGRESS:</span>
            <span className="text-amber-400 font-bold">{percentComplete}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono text-right">
            {completedTasks} of {totalTasks} milestones completed
          </span>
        </div>
      </div>

      {/* Phases Accordion */}
      <div className="mt-6 flex flex-col gap-4">
        {phases.map((phase) => {
          const isExpanded = expandedPhase === phase.id;
          const phaseCompleted = phase.tasks.filter((t) => t.completed).length;

          return (
            <div
              key={phase.id}
              className="border border-slate-800 bg-slate-950/70 rounded-xl overflow-hidden transition-colors"
            >
              {/* Phase Bar */}
              <button
                onClick={() => setExpandedPhase(isExpanded ? '' : phase.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      phase.id === 'phase_1'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                        : phase.id === 'phase_2'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800/60'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                    }`}
                  >
                    {phase.id === 'phase_1' ? <Zap className="w-4 h-4" /> : phase.id === 'phase_2' ? <Palette className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {phase.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                        {phase.hours}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {phase.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">
                    {phaseCompleted}/{phase.tasks.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Tasks List */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-slate-900 flex flex-col gap-2 mt-2">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(phase.id, task.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        task.completed
                          ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                          : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <button className="mt-0.5 shrink-0">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-semibold ${
                            task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {task.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pro Jam Tips Card */}
      <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200 block mb-0.5">Golden Rule of 24-Hour Game Jams:</span>
          Do not build custom physics from scratch—use Godot 4’s built-in <code className="font-mono text-cyan-300">move_and_slide()</code> and <code className="font-mono text-cyan-300">Input.get_vector()</code>. Spend at least 4 hours tweaking weapon cooldowns and visual juices like screen shake and hit flashes; a tight 30-second loop beats an unfinished 20-minute RPG every time.
        </div>
      </div>
    </div>
  );
};
