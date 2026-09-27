import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  Play,
  Pause,
  Grid,
  Palette,
  Eye,
} from 'lucide-react';

interface AssetPack {
  id: string;
  name: string;
  creator: string;
  license: string;
  category: 'characters' | 'tilesets' | 'sfx' | 'ui';
  description: string;
  tileSize: string;
  format: string;
  link: string;
  color: string;
}

const FREE_ASSET_PACKS: AssetPack[] = [
  {
    id: 'kenney_roguelike',
    name: '1-Bit / Micro Roguelike Pack',
    creator: 'Kenney.nl',
    license: 'CC0 (Public Domain)',
    category: 'characters',
    description: 'Over 400 clean pixel tiles including heroes, bugs, skeletons, swords, chests, and retro sci-fi subterranean ruins.',
    tileSize: '16x16 px',
    format: 'PNG + Spritesheet',
    link: 'https://kenney.nl/assets/micro-roguelike',
    color: '#38bdf8',
  },
  {
    id: '0x72_dungeon',
    name: '0x72 Dungeon II Tileset',
    creator: '0x72',
    license: 'CC0 (Public Domain)',
    category: 'tilesets',
    description: 'Renowned dark fantasy retro tileset with animated character walk cycles, weapons, chests, slime splits, and wall autotiles.',
    tileSize: '16x16 px',
    format: 'PNG + Godot TileSet',
    link: 'https://0x72.itch.io/dungeontileset-ii',
    color: '#a855f7',
  },
  {
    id: 'craftpix_scifi',
    name: 'Free 2D Top-Down Shooter Set',
    creator: 'CraftPix.net',
    license: 'Free Commercial',
    category: 'characters',
    description: 'Cyberpunk survivors, turrets, alien arachnid swarmers, laser bolts, and neon industrial metal grating tiles.',
    tileSize: '32x32 px',
    format: 'PNG + PSD',
    link: 'https://craftpix.net/freebies/free-top-down-sci-fi-shooter-game-kit/',
    color: '#f97316',
  },
  {
    id: 'chiptone_sfx',
    name: 'ChipTone / Bfxr 8-Bit Audio Generator',
    creator: 'Tom Vian',
    license: 'Free Web Tool',
    category: 'sfx',
    description: 'Instant retro sound generator for lasers, jump whooshes, explosion blasts, coins, and level-ups with WAV export.',
    tileSize: 'WAV 44.1kHz',
    format: 'WAV',
    link: 'https://sfbgames.itch.io/chiptone',
    color: '#22c55e',
  },
  {
    id: 'penusbmic_monsters',
    name: 'The Dark Series: Swarm Insects',
    creator: 'Penusbmic',
    license: 'CC-BY 4.0',
    category: 'characters',
    description: 'High-detail fluid animated swarm bugs, charging scarabs, and venom spitters with 8-frame walk and death animations.',
    tileSize: '32x32 px',
    format: 'PNG Spritesheets',
    link: 'https://penusbmic.itch.io/',
    color: '#ec4899',
  },
];

export const AssetPackExplorer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [animSpeed, setAnimSpeed] = useState<number>(8); // FPS
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const filteredPacks =
    selectedCategory === 'all'
      ? FREE_ASSET_PACKS
      : FREE_ASSET_PACKS.filter((p) => p.category === selectedCategory);

  // Live Canvas Sprite Animation Generator
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    const interval = 1000 / animSpeed;

    const renderLoop = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        if (isPlaying) {
          setCurrentFrame((prev) => (prev + 1) % 4);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw dark pixel grid
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Center coordinate
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const bob = Math.sin(currentFrame * (Math.PI / 2)) * 3;

          // Render procedural pixel character walk cycle
          ctx.save();
          ctx.translate(cx, cy + bob);

          // Scale 4x for retro view
          ctx.scale(4, 4);

          // Body (Cyber Survivor)
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-4, -6, 8, 8);

          // Visor
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-2, -5, 4, 3);

          // Gun arm
          ctx.fillStyle = '#64748b';
          ctx.fillRect(3, -3, 5, 2);

          // Legs walk animation
          ctx.fillStyle = '#0f172a';
          if (currentFrame === 0) {
            ctx.fillRect(-3, 2, 2, 4);
            ctx.fillRect(1, 2, 2, 4);
          } else if (currentFrame === 1) {
            ctx.fillRect(-4, 2, 2, 3);
            ctx.fillRect(2, 2, 2, 5);
          } else if (currentFrame === 2) {
            ctx.fillRect(-3, 2, 2, 4);
            ctx.fillRect(1, 2, 2, 4);
          } else {
            ctx.fillRect(-2, 2, 2, 5);
            ctx.fillRect(3, 2, 2, 3);
          }

          ctx.restore();
        }
      }

      frameId = requestAnimationFrame(renderLoop);
    };

    frameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(frameId);
  }, [animSpeed, isPlaying, currentFrame]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>GAME DEV RESOURCES</span>
            <span>·</span>
            <span>FREE & CC0 PIXEL ASSETS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Curated Free Pixel Art & Audio Packs
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Plug-and-play sprite sheets, tilesets, and sound effect generators verified for commercial use in 2D Godot 4 projects.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start md:self-auto">
          {['all', 'characters', 'tilesets', 'sfx'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Sprite Previewer + Packs Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Sprite Previewer */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Sprite Sheet Animator
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              FRAME {currentFrame + 1}/4
            </span>
          </div>

          {/* Canvas Window */}
          <div className="relative w-full h-44 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} width={240} height={176} className="pixel-crisp" />
          </div>

          {/* Animation Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>PLAYBACK SPEED:</span>
              <span className="text-white font-bold">{animSpeed} FPS</span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={animSpeed}
              onChange={(e) => setAnimSpeed(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs flex items-center justify-center gap-1.5 font-medium"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause Cycle' : 'Play Cycle'}</span>
              </button>
            </div>
          </div>

          {/* Godot 4 AnimatedSprite2D snippet */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-400">
            <span className="text-cyan-400 block font-bold mb-1">Godot 4 Import Tip:</span>
            In Godot Project Settings &gt; General &gt; Rendering &gt; Textures: set <code className="text-amber-300">Default Texture Filter</code> to <code className="text-amber-300">Nearest</code> for razor-sharp pixel rendering.
          </div>
        </div>

        {/* Asset Packs Cards List */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className="p-5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: `${pack.color}20`, color: pack.color }}
                  >
                    {pack.license}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{pack.tileSize}</span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {pack.name}
                </h3>
                <span className="text-[11px] text-slate-400 block mt-0.5">By {pack.creator}</span>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {pack.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">FORMAT: {pack.format}</span>
                <a
                  href={pack.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Get Asset Pack</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
