import React from 'react';
import { AuthProvider } from './firebase/AuthContext';
import { GameCanvas } from './components/GameCanvas';
import coverImage from './assets/images/pixel_swarm_cover_1790503792896.jpg';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-svh bg-slate-950 text-slate-100 flex flex-col antialiased">
        <header
          className="relative isolate w-full border-b border-cyan-300/20 bg-slate-950 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})`, backgroundPosition: 'center 28%' }}
        >
          <div className="absolute inset-0 -z-10 bg-slate-950/45" />
          <div className="relative mx-auto flex min-h-[76px] w-full max-w-[1600px] items-center px-3 sm:px-5 lg:px-8">
            <h1 className="font-pixel text-sm leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-base">
              Pixel Swarm Survival
            </h1>
          </div>
        </header>
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4">
          <section className="flex-1 min-h-0">
            <GameCanvas />
          </section>
        </main>
      </div>
    </AuthProvider>
  );
}
