import React from 'react';
import { AuthProvider } from './firebase/AuthContext';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-svh bg-slate-950 text-slate-100 flex flex-col antialiased">
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4">
          <header className="flex items-center justify-between gap-3">
            <h1 className="text-sm sm:text-base font-semibold text-white">Pixel Swarm Survival</h1>
          </header>
          <section className="flex-1 min-h-0">
            <GameCanvas />
          </section>
        </main>
      </div>
    </AuthProvider>
  );
}
