import React from 'react';
import { AuthProvider } from './firebase/AuthContext';
import { GameCanvas } from './components/GameCanvas';
import coverImage from './assets/images/pixel_swarm_cover_1790503792896.jpg';

export default function App() {
  return (
    <AuthProvider>
      <div className="game-shell min-h-svh text-slate-100 flex flex-col antialiased">
        <header
          className="wallpaper-header relative isolate w-full"
        >
          <div className="wallpaper-scene" aria-hidden="true">
            <div className="wallpaper-art" style={{ backgroundImage: `url(${coverImage})` }} />
            <div className="wallpaper-haze" />
            <div className="wallpaper-grid" />
            <div className="wallpaper-shade" />
          </div>
          <div className="relative mx-auto flex min-h-[100px] w-full max-w-[1600px] items-center justify-between gap-4 px-3 sm:min-h-[116px] sm:px-5 lg:px-8">
            <div className="min-w-0">
              <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-200/85 sm:text-[10px]">
                Neon sector // survival protocol
              </span>
              <h1 className="font-pixel text-sm leading-relaxed text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)] sm:text-base md:text-lg">
                Pixel Swarm Survival
              </h1>
            </div>
            <div className="hidden shrink-0 items-center gap-2 border-l border-cyan-200/25 pl-4 font-mono text-[9px] uppercase tracking-widest text-cyan-100/80 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.9)]" />
              Arena online
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
