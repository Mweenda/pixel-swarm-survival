import { Enemy, FloatingText, Particle, PickupItem, PlayerStats, Projectile, Weapon, XPGem } from './types';
import type { PlanetCanvasTheme } from './campaign';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 600;
  private planetPatterns = new Map<PlanetCanvasTheme, CanvasPattern | null>();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private getPlanetPattern(theme: PlanetCanvasTheme): CanvasPattern | null {
    const cachedPattern = this.planetPatterns.get(theme);
    if (cachedPattern !== undefined) return cachedPattern;

    const tile = document.createElement('canvas');
    tile.width = 128;
    tile.height = 128;
    const tileContext = tile.getContext('2d');
    if (!tileContext) return null;

    const palette = theme.pixelColors;
    const cell = 16;
    for (let row = 0; row < tile.height / cell; row += 1) {
      for (let column = 0; column < tile.width / cell; column += 1) {
        const hash = (row * 37 + column * 61 + theme.pattern.length * 29) % 17;
        let shouldDraw = hash < 5;
        let x = column * cell;
        let y = row * cell;
        let width = cell;
        let height = cell;

        switch (theme.pattern) {
          case 'dunes':
            shouldDraw = row % 3 === 1 && hash < 11;
            y += hash % 5;
            height = 3 + (hash % 3);
            break;
          case 'magma':
            shouldDraw = hash < 6 || (column + row) % 7 === 0;
            width = 5 + (hash % 7);
            break;
          case 'canopy':
            shouldDraw = hash < 8;
            x += hash % 5;
            y += hash % 4;
            width = 7 + (hash % 8);
            height = 6 + (hash % 9);
            break;
          case 'craters': {
            const craterX = column % 4;
            const craterY = row % 4;
            shouldDraw = craterX === 0 || craterY === 0 || hash === 3;
            width = height = 4 + (hash % 5);
            break;
          }
          case 'storms':
            shouldDraw = row % 2 === 0 && hash < 13;
            x -= hash % 8;
            width = 10 + (hash % 12);
            height = 4 + (hash % 4);
            break;
          case 'rings':
            shouldDraw = (row + column) % 3 === 0 && hash < 13;
            width = 12 + (hash % 8);
            height = 3 + (hash % 3);
            break;
          case 'ice':
            shouldDraw = hash < 8;
            y += hash % 6;
            width = 3 + (hash % 5);
            height = 8 + (hash % 8);
            break;
          case 'abyss':
            shouldDraw = row % 3 !== 1 && hash < 9;
            width = 8 + (hash % 8);
            height = 4 + (hash % 5);
            break;
          case 'frost':
            shouldDraw = (row + column) % 4 === 0 && hash < 14;
            width = height = 5 + (hash % 8);
            break;
        }

        if (shouldDraw) {
          tileContext.globalAlpha = 0.34 + (hash % 4) * 0.1;
          tileContext.fillStyle = palette[hash % palette.length];
          tileContext.fillRect(x, y, width, height);
        }
      }
    }
    tileContext.globalAlpha = 1;
    const pattern = this.ctx.createPattern(tile, 'repeat');
    this.planetPatterns.set(theme, pattern);
    return pattern;
  }

  public clear(cameraX: number, cameraY: number, screenShake: { x: number; y: number }, theme: PlanetCanvasTheme) {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Apply screen shake
    this.ctx.translate(screenShake.x, screenShake.y);

    this.ctx.fillStyle = theme.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    const planetPattern = this.getPlanetPattern(theme);
    if (planetPattern) {
      this.ctx.globalAlpha = 0.48;
      this.ctx.fillStyle = planetPattern;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    this.ctx.globalAlpha = 1;

    // World camera transform
    this.ctx.translate(-cameraX + this.width / 2, -cameraY + this.height / 2);
  }

  public endFrame() {
    this.ctx.restore();
  }

  // Draw Arena Boundary
  public drawArenaBounds(size: number, accent = '#ef4444') {
    this.ctx.strokeStyle = accent;
    this.ctx.globalAlpha = 0.42;
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([16, 12]);
    this.ctx.strokeRect(-size / 2, -size / 2, size, size);
    this.ctx.setLineDash([]);

    // Corner warning markers
    const s2 = size / 2;
    this.ctx.fillStyle = accent;
    this.ctx.fillRect(-s2 - 4, -s2 - 4, 12, 12);
    this.ctx.fillRect(s2 - 8, -s2 - 4, 12, 12);
    this.ctx.fillRect(-s2 - 4, s2 - 8, 12, 12);
    this.ctx.fillRect(s2 - 8, s2 - 8, 12, 12);
    this.ctx.globalAlpha = 1;
  }

  // Draw XP Gems
  public drawGems(gems: XPGem[]) {
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      this.ctx.save();
      this.ctx.translate(g.x, g.y);

      // Faceted diamond shape
      this.ctx.fillStyle = g.color;
      this.ctx.shadowColor = g.color;
      this.ctx.shadowBlur = 6;

      this.ctx.beginPath();
      this.ctx.moveTo(0, -g.radius);
      this.ctx.lineTo(g.radius * 0.8, 0);
      this.ctx.lineTo(0, g.radius);
      this.ctx.lineTo(-g.radius * 0.8, 0);
      this.ctx.closePath();
      this.ctx.fill();

      // Gem core highlight
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-1, -2, 2, 2);

      this.ctx.restore();
    }
  }

  // Draw Pickups (Medkit, Bomb, Magnet, Chest)
  public drawPickups(pickups: PickupItem[], tick: number) {
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      const bob = Math.sin(tick * 0.005 + p.id) * 3;

      this.ctx.save();
      this.ctx.translate(p.x, p.y + bob);

      // Outer glow pulse
      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.radius + 2, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.fill();

      if (p.type === 'health') {
        // Red Medkit with white cross
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(-9, -9, 18, 18);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-3, -7, 6, 14);
        this.ctx.fillRect(-7, -3, 14, 6);
      } else if (p.type === 'bomb') {
        // High explosive warhead
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(0, 2, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(-2, -8, 4, 4);
        this.ctx.fillStyle = '#f97316';
        this.ctx.fillRect(-1, -11, 2, 3);
      } else if (p.type === 'magnet') {
        // Horseshoe magnet
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, Math.PI, 0, false);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.stroke();
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(-10, 0, 4, 6);
        this.ctx.fillRect(6, 0, 4, 6);
      } else if (p.type === 'chest') {
        // Golden treasure chest
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(-10, -7, 20, 14);
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillRect(-8, -5, 16, 10);
        this.ctx.fillStyle = '#78350f';
        this.ctx.fillRect(-10, -1, 20, 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-2, -3, 4, 5);
      }

      this.ctx.restore();
    }
  }

  // Draw Enemies
  public drawEnemies(enemies: Enemy[], now: number) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const isHit = e.hitFlash && e.hitFlash > now;

      this.ctx.save();
      this.ctx.translate(e.x, e.y);

      if (isHit) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        continue;
      }

      // Draw depending on enemy type
      if (e.type === 'swarmer') {
        // Skittering drone bug
        const legWiggle = Math.sin(now * 0.02 + e.id) * 3;
        this.ctx.fillStyle = e.color;
        this.ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);

        // Eyes
        this.ctx.fillStyle = '#fef08a';
        this.ctx.fillRect(-4, -4, 2, 2);
        this.ctx.fillRect(2, -4, 2, 2);

        // Skitter legs
        this.ctx.strokeStyle = '#991b1b';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-e.radius, 0);
        this.ctx.lineTo(-e.radius - 4, legWiggle);
        this.ctx.moveTo(e.radius, 0);
        this.ctx.lineTo(e.radius + 4, -legWiggle);
        this.ctx.stroke();

      } else if (e.type === 'charger') {
        // Armored heavy charging beetle
        this.ctx.fillStyle = e.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Horns / Mandibles
        this.ctx.fillStyle = '#7c2d12';
        this.ctx.beginPath();
        this.ctx.moveTo(-6, -e.radius);
        this.ctx.lineTo(-2, -e.radius - 6);
        this.ctx.lineTo(2, -e.radius);
        this.ctx.lineTo(6, -e.radius - 6);
        this.ctx.lineTo(8, -e.radius);
        this.ctx.fill();

        // Glowing red core
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(-2, -2, 4, 4);

      } else if (e.type === 'spitter') {
        // Acid Spitter: pulsing purple floating spore
        const pulse = Math.sin(now * 0.008 + e.id) * 2;
        this.ctx.fillStyle = e.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius + pulse, 0, Math.PI * 2);
        this.ctx.fill();

        // Toxic orbs
        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillRect(-3, -3, 6, 6);

      } else if (e.type === 'splitter') {
        // Necro Slime: green gelatinous body
        const wobble = Math.sin(now * 0.01 + e.id) * 2;
        this.ctx.fillStyle = e.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, e.radius + wobble, e.radius - wobble, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Nucleus
        this.ctx.fillStyle = '#064e3b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (e.type === 'boss_goliath') {
        // Pixel guardian silhouette, with an expanded crown for the epic swarm-six boss.
        const swarm = e.bossSwarm ?? 1;
        const isEpic = swarm === 6;
        const orbitSpin = now * (isEpic ? 0.0018 : 0.0012);
        this.ctx.fillStyle = e.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Armor plating and pixel crown
        this.ctx.strokeStyle = e.color;
        this.ctx.lineWidth = isEpic ? 6 : 4;
        this.ctx.stroke();
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(-e.radius * 0.68, -e.radius * 0.18, e.radius * 1.36, e.radius * 0.72);
        this.ctx.fillStyle = e.color;
        this.ctx.fillRect(-e.radius * 0.48, -e.radius * 0.52, e.radius * 0.96, e.radius * 0.28);
        this.ctx.fillRect(-e.radius * 0.7, -e.radius * 0.34, e.radius * 0.2, e.radius * 0.35);
        this.ctx.fillRect(e.radius * 0.5, -e.radius * 0.34, e.radius * 0.2, e.radius * 0.35);

        // Later guardians gain rotating armor; the epic boss has a second orbit.
        this.ctx.save();
        this.ctx.rotate(orbitSpin);
        this.ctx.strokeStyle = e.color;
        this.ctx.globalAlpha = 0.8;
        this.ctx.lineWidth = isEpic ? 3 : 2;
        this.ctx.strokeRect(-e.radius * 0.78, -e.radius * 0.78, e.radius * 1.56, e.radius * 1.56);
        this.ctx.fillStyle = e.color;
        const gearSize = Math.max(12, e.radius * 0.5);
        this.ctx.fillRect(-gearSize / 2, -gearSize / 2, gearSize, gearSize);
        this.ctx.fillStyle = '#ffe4e6';
        this.ctx.fillRect(-gearSize * 0.2, -gearSize * 0.2, gearSize * 0.4, gearSize * 0.4);
        this.ctx.restore();

        if (isEpic) {
          this.ctx.save();
          this.ctx.rotate(-orbitSpin * 0.7);
          this.ctx.strokeStyle = '#fff7ed';
          this.ctx.globalAlpha = 0.58;
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(-e.radius * 0.96, -e.radius * 0.96, e.radius * 1.92, e.radius * 1.92);
          this.ctx.fillStyle = '#fff7ed';
          for (let spoke = 0; spoke < 4; spoke += 1) {
            this.ctx.fillRect(-2, -e.radius * 1.08, 4, e.radius * 0.22);
            this.ctx.rotate(Math.PI / 2);
          }
          this.ctx.restore();
        }

        // Boss Health Bar directly above
        const barWidth = 64;
        const barHeight = 6;
        const hpPercent = Math.max(0, e.hp / e.maxHp);
        this.ctx.font = '8px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = '#ffe4e6';
        this.ctx.fillText(`${e.bossName || 'GOLIATH'} · LV ${e.difficultyLevel}`, 0, -e.radius - 18, 140);
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(-barWidth / 2, -e.radius - 16, barWidth, barHeight);
        this.ctx.fillStyle = e.color;
        this.ctx.fillRect(-barWidth / 2, -e.radius - 16, barWidth * hpPercent, barHeight);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-barWidth / 2, -e.radius - 16, barWidth, barHeight);
      }

      // Small health indicator if wounded
      if (e.hp < e.maxHp && e.type !== 'boss_goliath') {
        const hpPct = Math.max(0, e.hp / e.maxHp);
        const w = e.radius * 2;
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(-e.radius, -e.radius - 6, w, 3);
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(-e.radius, -e.radius - 6, w * hpPct, 3);
      }

      this.ctx.restore();
    }
  }

  // Draw Player Character
  public drawPlayer(player: PlayerStats, now: number, aimAngle: number) {
    this.ctx.save();
    this.ctx.translate(player.x, player.y);

    // Invulnerability flashing
    if (player.invulnerableTime > 0 && Math.floor(now / 80) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    // Magnet aura faint circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, player.magnetRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Dash trail / after-image
    if (player.isDashing) {
      this.ctx.save();
      this.ctx.translate(-player.vx * 0.08, -player.vy * 0.08);
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, player.radius + 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Player body (Cyber Survivor)
    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, player.radius, player.radius * 0.9, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer cyber suit (slate-800)
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Neon cyan rim
    this.ctx.strokeStyle = player.isDashing ? '#ffffff' : '#38bdf8';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Visor glowing eye
    this.ctx.fillStyle = player.isDashing ? '#ffffff' : '#00f0ff';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(Math.cos(aimAngle) * 5, Math.sin(aimAngle) * 5, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Weapon barrel
    this.ctx.save();
    this.ctx.rotate(aimAngle);
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillRect(8, -3, 10, 6);
    this.ctx.fillStyle = '#0284c7';
    this.ctx.fillRect(14, -2, 4, 4);
    this.ctx.restore();

    this.ctx.restore();
  }

  // Draw Projectiles
  public drawProjectiles(projectiles: Projectile[], now: number) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      this.ctx.save();
      this.ctx.translate(p.x, p.y);

      if (p.type === 'bullet') {
        // Laser energy bolt
        const angle = Math.atan2(p.vy, p.vx);
        this.ctx.rotate(angle);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(-p.radius * 2, -p.radius * 0.75, p.radius * 4, p.radius * 1.5);
      } else if (p.type === 'blade') {
        // Orbiting Disc sawblade
        this.ctx.rotate(now * 0.015);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        // Saw teeth
        this.ctx.fillStyle = '#ffffff';
        for (let tooth = 0; tooth < 4; tooth++) {
          this.ctx.rotate(Math.PI / 2);
          this.ctx.fillRect(p.radius - 2, -2, 4, 4);
        }
      } else if (p.type === 'thunder_bolt') {
        // Lightning bolt impact
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -60);
        this.ctx.lineTo(-8, -30);
        this.ctx.lineTo(8, -10);
        this.ctx.lineTo(0, 0);
        this.ctx.stroke();

        // Ground flash circle
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'grenade') {
        // Tumbling grenade canister
        this.ctx.rotate(now * 0.01);
        this.ctx.fillStyle = '#f97316';
        this.ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(-2, -2, 4, 4);
      } else if (p.type === 'enemy_orb') {
        // Spitter acid ball
        this.ctx.fillStyle = '#a855f7';
        this.ctx.shadowColor = '#c084fc';
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'aura_pulse') {
        // Bio-Static Aura ripple
        this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }

  // Draw Aura when active
  public drawActiveAura(player: PlayerStats, auraWeapon: Weapon | undefined, now: number) {
    if (!auraWeapon || auraWeapon.level === 0) return;
    const pulse = Math.sin(now * 0.006) * 6;
    const radius = auraWeapon.range * player.areaMultiplier + pulse;

    this.ctx.save();
    this.ctx.translate(player.x, player.y);

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([8, 8]);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // Draw Particles
  public drawParticles(particles: Particle[]) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;

      if (p.shape === 'square') {
        this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  // Draw Floating Damage Numbers
  public drawFloatingTexts(texts: FloatingText[]) {
    this.ctx.save();
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      const alpha = Math.max(0, t.life / t.maxLife);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = t.color;
      this.ctx.font = t.isCrit
        ? 'bold 15px "Press Start 2P", monospace'
        : '11px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.text, t.x, t.y);
    }
    this.ctx.restore();
  }
}
