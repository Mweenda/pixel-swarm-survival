import React from 'react';
import { Sparkles } from 'lucide-react';
import { AuthProvider } from './firebase/AuthContext';
import { GameCanvas } from './components/GameCanvas';
import coverImage from './assets/images/pixel_swarm_cover_1790503792896.jpg';

export default function App() {
  return (
    <AuthProvider>
      <div className="game-shell min-h-svh text-slate-100 flex flex-col antialiased">
        <header className="wallpaper-header relative isolate w-full">
          <div className="wallpaper-scene" aria-hidden="true">
            <div className="wallpaper-art" style={{ backgroundImage: `url(${coverImage})` }} />
            <div className="wallpaper-haze" />
            <div className="wallpaper-grid" />
            <div className="wallpaper-shade" />
            <div className="wallpaper-light" />
          </div>
          <div className="wallpaper-content relative mx-auto flex min-h-[142px] w-full max-w-[1600px] items-center justify-between gap-4 px-3 py-5 sm:min-h-[158px] sm:px-5 lg:px-8">
            <div className="wallpaper-title-plaque flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
              <div className="wallpaper-emblem" aria-hidden="true">
                <div className="wallpaper-emblem-face">
                  <Sparkles className="h-6 w-6 text-cyan-100 sm:h-7 sm:w-7" strokeWidth={1.6} />
                </div>
              </div>
              <div className="min-w-0">
                <span className="mb-2 flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-100/85 sm:text-[10px]">
                  <span className="h-px w-4 bg-cyan-300/70 sm:w-6" /> Sector 01 <span className="text-amber-200/80">/</span> Survival protocol
                </span>
                <h1 className="wallpaper-title font-pixel text-[11px] leading-[1.8] text-white sm:text-sm md:text-lg">
                  Pixel Swarm Survival
                </h1>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-slate-200/65 sm:text-[9px]">
                  Hold the line. Outlast the swarm.
                </p>
              </div>
            </div>

            <div className="wallpaper-status hidden shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-50 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.9)]" />
              <span>
                <span className="block text-[8px] text-cyan-100/55">System status</span>
                <span className="mt-1 block font-bold">Arena online</span>
              </span>
            </div>
          </div>
        </header>
        <main className="game-main flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4">
          <section className="flex-1 min-h-0">
            <GameCanvas />
          </section>
        </main>
      </div>
    </AuthProvider>
  );
}
