/**
 * games.js - Complete Mini-Game Implementations for Cosmic Arcade Control
 * All games are DOM/Canvas based with full gameplay logic.
 */

(function (window) {
  'use strict';

  // ─── Shared utilities ────────────────────────────────────────────────────────

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randFloat(min, max) { return Math.random() * (max - min) + min; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Safe engine/UI calls (guard if not yet loaded)
  function addTickets(n) { if (window.GameEngine) window.GameEngine.addTickets(n); }
  function addXP(n) { if (window.GameEngine) window.GameEngine.addXP(n); }
  function checkAchievement(id) { if (window.GameEngine) window.GameEngine.checkAchievement(id); }
  function updateMission(type, val) { if (window.GameEngine) window.GameEngine.updateMissionProgress(type, val); }
  function showResults(data) { if (window.UI) window.UI.showGameResults(data); }

  // ─── 1. MEMORY MATCH ─────────────────────────────────────────────────────────

  const MemoryMatch = {
    container: null,
    difficulty: 'easy',
    cards: [],
    flipped: [],
    matched: 0,
    score: 0,
    timer: null,
    timeLeft: 60,
    startTime: 0,
    moves: 0,
    locked: false,

    EMOJIS: ['🚀','🌟','🪐','🌙','☄️','🛸','🌌','⭐','🔭','🛰️','🌍','🌠','💫','🌑','🪨','🌒'],

    init(container, difficulty = 'easy') {
      this.container = container;
      this.difficulty = difficulty;
      this.matched = 0;
      this.score = 0;
      this.moves = 0;
      this.locked = false;
      this.flipped = [];
      const cols = difficulty === 'hard' ? 6 : 4;
      const rows = difficulty === 'hard' ? 6 : 4;
      const total = cols * rows;
      const pairCount = total / 2;
      const symbols = this.EMOJIS.slice(0, pairCount);
      let deck = shuffle([...symbols, ...symbols]);
      this.cards = deck.map((sym, i) => ({ id: i, symbol: sym, flippedState: false, matched: false }));
      this.timeLeft = difficulty === 'medium' ? 45 : difficulty === 'hard' ? 90 : 60;

      container.innerHTML = '';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.gap = '12px';

      // HUD
      const hud = document.createElement('div');
      hud.style.cssText = 'display:flex;gap:20px;color:#fff;font-size:18px;font-family:monospace;';
      hud.innerHTML = `<span id="mm-score">Score: 0</span><span id="mm-timer">Time: ${this.timeLeft}s</span><span id="mm-moves">Moves: 0</span>`;
      container.appendChild(hud);

      // Grid
      const grid = document.createElement('div');
      grid.id = 'mm-grid';
      grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;`;
      this.cards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'mm-card';
        el.dataset.id = card.id;
        el.style.cssText = `
          width:70px;height:70px;background:linear-gradient(135deg,#1a1a3e,#2d2d6b);
          border:2px solid #4488ff;border-radius:8px;display:flex;align-items:center;
          justify-content:center;font-size:28px;cursor:pointer;user-select:none;
          transition:transform 0.3s;box-shadow:0 0 8px #4488ff44;
        `;
        el.textContent = '?';
        el.addEventListener('click', () => this._flip(card.id));
        grid.appendChild(el);
      });
      container.appendChild(grid);
    },

    start() {
      this.startTime = Date.now();
      this.timer = setInterval(() => {
        this.timeLeft--;
        const el = document.getElementById('mm-timer');
        if (el) el.textContent = `Time: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) this._end(false);
      }, 1000);
    },

    stop() {
      clearInterval(this.timer);
      this.timer = null;
    },

    _flip(id) {
      if (this.locked) return;
      const card = this.cards[id];
      if (card.matched || card.flippedState) return;
      if (this.flipped.length >= 2) return;

      card.flippedState = true;
      this.flipped.push(id);
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el) {
        el.textContent = card.symbol;
        el.style.background = 'linear-gradient(135deg,#2255aa,#4488ff)';
        el.style.transform = 'scale(1.1)';
      }

      if (this.flipped.length === 2) {
        this.locked = true;
        this.moves++;
        const movesEl = document.getElementById('mm-moves');
        if (movesEl) movesEl.textContent = `Moves: ${this.moves}`;
        setTimeout(() => this._checkMatch(), 700);
      }
    },

    _checkMatch() {
      const [a, b] = this.flipped;
      const ca = this.cards[a], cb = this.cards[b];
      if (ca.symbol === cb.symbol) {
        ca.matched = cb.matched = true;
        this.matched++;
        this.score += 100;
        [a, b].forEach(id => {
          const el = document.querySelector(`[data-id="${id}"]`);
          if (el) { el.style.background = 'linear-gradient(135deg,#005500,#00aa00)'; el.style.transform = ''; }
        });
        const scoreEl = document.getElementById('mm-score');
        if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
        if (this.matched === this.cards.length / 2) {
          setTimeout(() => this._end(true), 400);
        }
      } else {
        [a, b].forEach(id => {
          this.cards[id].flippedState = false;
          const el = document.querySelector(`[data-id="${id}"]`);
          if (el) { el.textContent = '?'; el.style.background = 'linear-gradient(135deg,#1a1a3e,#2d2d6b)'; el.style.transform = ''; }
        });
      }
      this.flipped = [];
      this.locked = false;
    },

    _end(won) {
      this.stop();
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const speedBonus = won ? Math.max(0, (60 - elapsed) * 10) : 0;
      const finalScore = this.score + speedBonus;
      const tickets = Math.floor(finalScore / 50);
      const xp = Math.floor(finalScore / 10);
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (won) checkAchievement('memory_master');
      showResults({ game: 'Memory Match', score: finalScore, tickets, xp, won, details: `Pairs: ${this.matched} | Moves: ${this.moves} | Speed Bonus: ${speedBonus}` });
    }
  };

  // ─── 2. REACTION SPEED TEST ──────────────────────────────────────────────────

  const ReactionSpeed = {
    container: null,
    round: 0,
    totalRounds: 5,
    times: [],
    state: 'idle', // idle | waiting | ready | result
    waitTimer: null,
    startTime: 0,
    penalty: false,

    init(container) {
      this.container = container;
      this.round = 0;
      this.times = [];
      this.state = 'idle';
      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:20px;';

      const info = document.createElement('div');
      info.style.cssText = 'color:#aaf;font-size:16px;font-family:monospace;text-align:center;';
      info.textContent = 'Wait for the circle to turn GREEN, then click it as fast as you can!';
      container.appendChild(info);

      const hud = document.createElement('div');
      hud.id = 'rt-hud';
      hud.style.cssText = 'color:#fff;font-size:18px;font-family:monospace;';
      hud.textContent = `Round: 0 / ${this.totalRounds}`;
      container.appendChild(hud);

      const circle = document.createElement('div');
      circle.id = 'rt-circle';
      circle.style.cssText = `
        width:180px;height:180px;border-radius:50%;background:#cc2200;
        display:flex;align-items:center;justify-content:center;
        font-size:22px;color:#fff;font-family:monospace;cursor:pointer;
        box-shadow:0 0 30px #cc220088;transition:background 0.2s,box-shadow 0.2s;
        user-select:none;
      `;
      circle.textContent = 'CLICK TO START';
      circle.addEventListener('click', () => this._handleClick());
      container.appendChild(circle);

      const results = document.createElement('div');
      results.id = 'rt-results';
      results.style.cssText = 'color:#aaf;font-size:15px;font-family:monospace;text-align:center;min-height:80px;';
      container.appendChild(results);
    },

    start() {
      this._nextRound();
    },

    stop() {
      clearTimeout(this.waitTimer);
      this.state = 'idle';
    },

    _nextRound() {
      if (this.round >= this.totalRounds) { this._end(); return; }
      this.round++;
      this.state = 'waiting';
      this.penalty = false;
      const hud = document.getElementById('rt-hud');
      if (hud) hud.textContent = `Round: ${this.round} / ${this.totalRounds}`;
      const circle = document.getElementById('rt-circle');
      if (circle) { circle.style.background = '#cc2200'; circle.style.boxShadow = '0 0 30px #cc220088'; circle.textContent = 'Wait...'; }
      const delay = randInt(1500, 4000);
      this.waitTimer = setTimeout(() => {
        if (this.state !== 'waiting') return;
        this.state = 'ready';
        this.startTime = Date.now();
        if (circle) { circle.style.background = '#00cc44'; circle.style.boxShadow = '0 0 30px #00cc4488'; circle.textContent = 'CLICK!'; }
      }, delay);
    },

    _handleClick() {
      if (this.state === 'idle') { this._nextRound(); return; }
      if (this.state === 'waiting') {
        clearTimeout(this.waitTimer);
        const circle = document.getElementById('rt-circle');
        if (circle) { circle.style.background = '#aa4400'; circle.textContent = 'Too early! -200ms penalty'; }
        this.times.push(1200); // penalty
        this.state = 'idle';
        const res = document.getElementById('rt-results');
        if (res) res.textContent += `Round ${this.round}: TOO EARLY (penalty)\n`;
        setTimeout(() => this._nextRound(), 1200);
        return;
      }
      if (this.state === 'ready') {
        const rt = Date.now() - this.startTime;
        this.times.push(rt);
        this.state = 'idle';
        const circle = document.getElementById('rt-circle');
        if (circle) { circle.style.background = '#0055cc'; circle.textContent = `${rt}ms!`; }
        const res = document.getElementById('rt-results');
        if (res) res.textContent += `Round ${this.round}: ${rt}ms\n`;
        setTimeout(() => this._nextRound(), 1000);
      }
    },

    _end() {
      const avg = Math.floor(this.times.reduce((s, t) => s + t, 0) / this.times.length);
      const score = clamp(1000 - avg, 0, 1000);
      const tickets = Math.floor(score / 50);
      const xp = Math.floor(score / 5);
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (avg < 200) checkAchievement('lightning_reflexes');
      showResults({ game: 'Reaction Speed Test', score, tickets, xp, won: score > 0, details: `Avg Reaction: ${avg}ms | Best: ${Math.min(...this.times)}ms` });
    }
  };

  // ─── 3. SPACE DODGER ─────────────────────────────────────────────────────────

  const SpaceDodger = {
    container: null,
    canvas: null,
    ctx: null,
    animFrame: null,
    running: false,
    score: 0,
    lives: 3,
    startTime: 0,
    speedLevel: 1,
    lastSpeedUp: 0,
    player: { x: 0, y: 0, w: 40, h: 40, shield: false, shieldTimer: 0 },
    asteroids: [],
    powerups: [],
    keys: {},
    mouse: { x: -1 },
    spawnTimer: 0,
    powerupTimer: 0,
    slowTime: false,
    slowTimer: 0,
    invincible: false,
    invincTimer: 0,

    init(container) {
      this.container = container;
      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';

      const hud = document.createElement('div');
      hud.id = 'sd-hud';
      hud.style.cssText = 'color:#fff;font-size:16px;font-family:monospace;display:flex;gap:20px;';
      hud.innerHTML = '<span id="sd-score">Score: 0</span><span id="sd-lives">Lives: ❤️❤️❤️</span><span id="sd-level">Speed: 1</span>';
      container.appendChild(hud);

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 500;
      canvas.style.cssText = 'border:2px solid #4488ff;border-radius:8px;background:#050520;cursor:none;';
      container.appendChild(canvas);
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      const tip = document.createElement('div');
      tip.style.cssText = 'color:#aaf;font-size:13px;font-family:monospace;';
      tip.textContent = 'Arrow keys or mouse to dodge | 🛡️=Shield | ⏱️=Slow | 💎=Bonus';
      container.appendChild(tip);

      this.player = { x: 220, y: 440, w: 36, h: 36, shield: false, shieldTimer: 0 };
      this.asteroids = [];
      this.powerups = [];
      this.score = 0;
      this.lives = 3;
      this.speedLevel = 1;
      this.slowTime = false;
      this.invincible = false;
      this.keys = {};
      this.mouse.x = -1;
      this.spawnTimer = 0;
      this.powerupTimer = 0;
      this.startTime = Date.now();
      this.lastSpeedUp = Date.now();

      this._keyDown = (e) => { this.keys[e.code] = true; e.preventDefault(); };
      this._keyUp = (e) => { this.keys[e.code] = false; };
      this._mouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
      };
      document.addEventListener('keydown', this._keyDown);
      document.addEventListener('keyup', this._keyUp);
      canvas.addEventListener('mousemove', this._mouseMove);
    },

    start() {
      this.running = true;
      this._loop();
    },

    stop() {
      this.running = false;
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
      document.removeEventListener('keydown', this._keyDown);
      document.removeEventListener('keyup', this._keyUp);
      if (this.canvas) this.canvas.removeEventListener('mousemove', this._mouseMove);
    },

    _loop() {
      if (!this.running) return;
      this._update();
      this._draw();
      this.animFrame = requestAnimationFrame(() => this._loop());
    },

    _update() {
      const now = Date.now();
      const elapsed = (now - this.startTime) / 1000;
      this.score = Math.floor(elapsed * 10 * this.speedLevel);
      const scoreEl = document.getElementById('sd-score');
      if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;

      // Speed up every 10s
      if (now - this.lastSpeedUp > 10000) {
        this.speedLevel = Math.min(5, this.speedLevel + 0.5);
        this.lastSpeedUp = now;
        const lvlEl = document.getElementById('sd-level');
        if (lvlEl) lvlEl.textContent = `Speed: ${this.speedLevel.toFixed(1)}`;
      }

      // Timers
      if (this.invincible) { this.invincTimer -= 16; if (this.invincTimer <= 0) this.invincible = false; }
      if (this.slowTime) { this.slowTimer -= 16; if (this.slowTimer <= 0) this.slowTime = false; }
      if (this.player.shield) { this.player.shieldTimer -= 16; if (this.player.shieldTimer <= 0) this.player.shield = false; }

      // Player movement
      const speed = 5;
      if ((this.keys['ArrowLeft'] || this.keys['KeyA']) && this.player.x > 0) this.player.x -= speed;
      if ((this.keys['ArrowRight'] || this.keys['KeyD']) && this.player.x < this.canvas.width - this.player.w) this.player.x += speed;
      if (this.mouse.x >= 0) this.player.x = clamp(this.mouse.x - this.player.w / 2, 0, this.canvas.width - this.player.w);

      // Spawn asteroids
      this.spawnTimer += 16;
      const spawnRate = Math.max(600, 1200 - this.speedLevel * 120);
      if (this.spawnTimer > spawnRate) {
        this.spawnTimer = 0;
        const sz = randInt(15, 40);
        this.asteroids.push({
          x: randInt(0, this.canvas.width - sz), y: -sz, w: sz, h: sz,
          speed: randFloat(1.5, 3) * this.speedLevel, r: sz / 2,
          color: `hsl(${randInt(0, 40)},60%,40%)`
        });
      }

      // Spawn power-ups
      this.powerupTimer += 16;
      if (this.powerupTimer > 8000) {
        this.powerupTimer = 0;
        const types = ['shield', 'slow', 'bonus'];
        const type = types[randInt(0, 2)];
        this.powerups.push({ x: randInt(20, this.canvas.width - 40), y: -20, type, speed: 1.5 });
      }

      const slowMult = this.slowTime ? 0.4 : 1;

      // Move & collide asteroids
      this.asteroids = this.asteroids.filter(a => {
        a.y += a.speed * slowMult;
        if (a.y > this.canvas.height + 50) return false;
        if (!this.invincible && this._circleRect(a.x + a.r, a.y + a.r, a.r, this.player)) {
          if (this.player.shield) { this.player.shield = false; this.player.shieldTimer = 0; }
          else {
            this.lives--;
            this.invincible = true; this.invincTimer = 1500;
            const livesEl = document.getElementById('sd-lives');
            if (livesEl) livesEl.textContent = `Lives: ${'❤️'.repeat(this.lives)}${'🖤'.repeat(3 - this.lives)}`;
            if (this.lives <= 0) { this._end(); return false; }
          }
          return false;
        }
        return true;
      });

      // Move & collect power-ups
      this.powerups = this.powerups.filter(p => {
        p.y += p.speed;
        if (p.y > this.canvas.height + 30) return false;
        if (this._rectRect({ x: p.x - 12, y: p.y - 12, w: 24, h: 24 }, this.player)) {
          if (p.type === 'shield') { this.player.shield = true; this.player.shieldTimer = 5000; }
          else if (p.type === 'slow') { this.slowTime = true; this.slowTimer = 4000; }
          else if (p.type === 'bonus') { this.score += 200; }
          return false;
        }
        return true;
      });
    },

    _circleRect(cx, cy, r, rect) {
      const nearX = clamp(cx, rect.x, rect.x + rect.w);
      const nearY = clamp(cy, rect.y, rect.y + rect.h);
      return (cx - nearX) ** 2 + (cy - nearY) ** 2 < r * r;
    },
    _rectRect(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },

    _draw() {
      const ctx = this.ctx;
      const W = this.canvas.width, H = this.canvas.height;
      ctx.fillStyle = '#050520';
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = '#ffffff44';
      for (let i = 0; i < 40; i++) {
        ctx.fillRect((i * 97 + 13) % W, (i * 137 + 7) % H, 1, 1);
      }

      // Asteroids
      this.asteroids.forEach(a => {
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff884444';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Power-ups
      this.powerups.forEach(p => {
        const icons = { shield: { emoji: '🛡️', bg: '#0044aa' }, slow: { emoji: '⏱️', bg: '#aaaa00' }, bonus: { emoji: '💎', bg: '#006600' } };
        const info = icons[p.type];
        ctx.fillStyle = info.bg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.emoji, p.x, p.y);
      });

      // Player ship
      const px = this.player.x, py = this.player.y;
      if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        // flicker
      } else {
        if (this.player.shield) {
          ctx.strokeStyle = '#4488ff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px + 18, py + 18, 26, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(px + 18, py);
        ctx.lineTo(px, py + 36);
        ctx.lineTo(px + 36, py + 36);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#88ccff';
        ctx.beginPath();
        ctx.moveTo(px + 18, py + 6);
        ctx.lineTo(px + 8, py + 28);
        ctx.lineTo(px + 28, py + 28);
        ctx.closePath();
        ctx.fill();
        // Engine glow
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.ellipse(px + 18, py + 38, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.slowTime) {
        ctx.fillStyle = '#ffff0033';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffff00';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⏱ SLOW TIME', W / 2, 20);
      }
    },

    _end() {
      this.stop();
      const tickets = Math.floor(this.score / 20);
      const xp = Math.floor(this.score / 5);
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (this.score > 500) checkAchievement('space_ace');
      showResults({ game: 'Space Dodger', score: this.score, tickets, xp, won: this.lives > 0, details: `Speed Level: ${this.speedLevel.toFixed(1)} | Lives Remaining: ${this.lives}` });
    }
  };

  // ─── 4. COIN COLLECTOR ───────────────────────────────────────────────────────

  const CoinCollector = {
    container: null, canvas: null, ctx: null,
    animFrame: null, running: false,
    score: 0, timeLeft: 30, timer: null,
    player: { x: 2, y: 2, w: 24, h: 24, speed: 3, invincTimer: 0 },
    coins: [], enemies: [],
    keys: {},
    TILE: 32,
    MAP: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,1,0,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,1,0,1,0,1],
      [1,0,0,0,1,1,1,1,1,0,0,0,0,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
      [1,1,0,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,0,0,1,0,1,0,1,0,1,0,0,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    init(container) {
      this.container = container;
      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';

      const hud = document.createElement('div');
      hud.style.cssText = 'color:#fff;font-size:16px;font-family:monospace;display:flex;gap:20px;';
      hud.innerHTML = '<span id="cc-score">Score: 0</span><span id="cc-timer">Time: 30s</span><span id="cc-coins">Coins: 0</span>';
      container.appendChild(hud);

      const canvas = document.createElement('canvas');
      canvas.width = 480; canvas.height = 480;
      canvas.style.cssText = 'border:2px solid #ffcc00;border-radius:8px;background:#111;';
      container.appendChild(canvas);
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      const tip = document.createElement('div');
      tip.style.cssText = 'color:#aaf;font-size:13px;font-family:monospace;';
      tip.textContent = 'WASD / Arrow keys to move | Collect coins! Avoid red enemies!';
      container.appendChild(tip);

      this.score = 0;
      this.timeLeft = 30;
      this.player = { x: 1.5 * this.TILE, y: 1.5 * this.TILE, w: 20, h: 20, speed: 3, invincTimer: 0 };
      this.keys = {};

      // Place coins on open tiles
      this.coins = [];
      let coinCount = 0;
      for (let r = 1; r < 14; r++) {
        for (let c = 1; c < 14; c++) {
          if (this.MAP[r][c] === 0 && Math.random() < 0.35) {
            this.coins.push({ x: c * this.TILE + 10, y: r * this.TILE + 10, r: 7, collected: false, spin: Math.random() * Math.PI * 2 });
            coinCount++;
          }
        }
      }

      // Place enemies
      this.enemies = [
        { x: 5 * this.TILE + 10, y: 1 * this.TILE + 10, dx: 1.5, dy: 0, w: 20, h: 20, tx: 5, ty: 1, dir: 1, steps: 0, maxSteps: 3 },
        { x: 10 * this.TILE + 10, y: 9 * this.TILE + 10, dx: 0, dy: 1.5, w: 20, h: 20, tx: 10, ty: 9, dir: 1, steps: 0, maxSteps: 3 },
        { x: 2 * this.TILE + 10, y: 11 * this.TILE + 10, dx: 1.5, dy: 0, w: 20, h: 20, tx: 2, ty: 11, dir: 1, steps: 0, maxSteps: 4 },
      ];

      this._keyDown = (e) => { this.keys[e.code] = true; };
      this._keyUp = (e) => { this.keys[e.code] = false; };
      document.addEventListener('keydown', this._keyDown);
      document.addEventListener('keyup', this._keyUp);
    },

    start() {
      this.running = true;
      this.timer = setInterval(() => {
        this.timeLeft--;
        const el = document.getElementById('cc-timer');
        if (el) el.textContent = `Time: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) this._end();
      }, 1000);
      this._loop();
    },

    stop() {
      this.running = false;
      clearInterval(this.timer);
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
      document.removeEventListener('keydown', this._keyDown);
      document.removeEventListener('keyup', this._keyUp);
    },

    _loop() {
      if (!this.running) return;
      this._update();
      this._draw();
      this.animFrame = requestAnimationFrame(() => this._loop());
    },

    _isWall(px, py, pw, ph) {
      const T = this.TILE;
      const corners = [[px, py], [px + pw, py], [px, py + ph], [px + pw, py + ph]];
      return corners.some(([cx, cy]) => {
        const col = Math.floor(cx / T), row = Math.floor(cy / T);
        return row >= 0 && row < 15 && col >= 0 && col < 15 && this.MAP[row][col] === 1;
      });
    },

    _update() {
      const p = this.player;
      const spd = p.speed;
      if (p.invincTimer > 0) p.invincTimer -= 16;
      let nx = p.x, ny = p.y;
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) nx -= spd;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) nx += spd;
      if (this.keys['ArrowUp'] || this.keys['KeyW']) ny -= spd;
      if (this.keys['ArrowDown'] || this.keys['KeyS']) ny += spd;
      nx = clamp(nx, 0, this.canvas.width - p.w);
      ny = clamp(ny, 0, this.canvas.height - p.h);
      if (!this._isWall(nx, p.y, p.w, p.h)) p.x = nx;
      if (!this._isWall(p.x, ny, p.w, p.h)) p.y = ny;

      // Coins
      let collected = 0;
      this.coins.forEach(c => {
        c.spin += 0.08;
        if (!c.collected && Math.abs(p.x + 10 - c.x) < 16 && Math.abs(p.y + 10 - c.y) < 16) {
          c.collected = true;
          this.score += 10;
          collected++;
        }
      });
      if (collected) {
        const scoreEl = document.getElementById('cc-score');
        if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
        const coinsEl = document.getElementById('cc-coins');
        if (coinsEl) coinsEl.textContent = `Coins: ${this.coins.filter(c => c.collected).length}/${this.coins.length}`;
      }
      if (this.coins.every(c => c.collected)) { this._end(); return; }

      // Enemies
      this.enemies.forEach(en => {
        en.x += en.dx;
        en.y += en.dy;
        en.steps++;
        if (en.steps >= en.maxSteps * this.TILE / Math.abs(en.dx || en.dy)) {
          en.dx *= -1; en.dy *= -1; en.steps = 0;
        }
        if (p.invincTimer <= 0 && Math.abs(p.x + 10 - en.x) < 20 && Math.abs(p.y + 10 - en.y) < 20) {
          this.timeLeft = Math.max(0, this.timeLeft - 5);
          p.invincTimer = 1500;
          const el = document.getElementById('cc-timer');
          if (el) el.textContent = `Time: ${this.timeLeft}s`;
        }
      });
    },

    _draw() {
      const ctx = this.ctx, T = this.TILE;
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 480, 480);
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          if (this.MAP[r][c] === 1) {
            ctx.fillStyle = '#223366';
            ctx.fillRect(c * T, r * T, T, T);
            ctx.strokeStyle = '#334477';
            ctx.strokeRect(c * T, r * T, T, T);
          }
        }
      }
      this.coins.forEach(coin => {
        if (!coin.collected) {
          const scaleX = Math.cos(coin.spin);
          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.scale(scaleX, 1);
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffee88';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          ctx.restore();
        }
      });
      this.enemies.forEach(en => {
        ctx.fillStyle = this.player.invincTimer > 0 ? '#ff4444aa' : '#ff4444';
        ctx.beginPath();
        ctx.arc(en.x, en.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👾', en.x, en.y);
      });
      const p = this.player;
      ctx.fillStyle = this.player.invincTimer > 0 && Math.floor(Date.now() / 100) % 2 ? '#ffffff44' : '#00ccff';
      ctx.beginPath();
      ctx.arc(p.x + 10, p.y + 10, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧑', p.x + 10, p.y + 10);
    },

    _end() {
      this.stop();
      const tickets = Math.floor(this.score / 10);
      const xp = this.score;
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      showResults({ game: 'Coin Collector', score: this.score, tickets, xp, won: true, details: `Coins: ${this.coins.filter(c => c.collected).length}/${this.coins.length}` });
    }
  };

  // ─── 5. WHACK-A-MOLE ─────────────────────────────────────────────────────────

  const WhackAMole = {
    container: null,
    score: 0,
    timeLeft: 30,
    timer: null,
    moleTimers: [],
    moles: Array(9).fill(false),
    golden: Array(9).fill(false),
    speed: 1,
    running: false,

    init(container) {
      this.container = container;
      this.score = 0;
      this.timeLeft = 30;
      this.moles = Array(9).fill(false);
      this.golden = Array(9).fill(false);
      this.moleTimers = [];
      this.speed = 1;
      this.running = false;

      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;';

      const hud = document.createElement('div');
      hud.style.cssText = 'color:#fff;font-size:18px;font-family:monospace;display:flex;gap:20px;';
      hud.innerHTML = '<span id="wam-score">Score: 0</span><span id="wam-timer">Time: 30s</span>';
      container.appendChild(hud);

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,100px);gap:12px;';
      for (let i = 0; i < 9; i++) {
        const hole = document.createElement('div');
        hole.style.cssText = `
          width:100px;height:100px;background:#1a0e08;border-radius:50%;
          border:3px solid #5c3d1e;position:relative;overflow:hidden;cursor:pointer;
          box-shadow:inset 0 10px 20px #00000088;
        `;
        const mole = document.createElement('div');
        mole.id = `wam-mole-${i}`;
        mole.style.cssText = `
          position:absolute;bottom:-60px;left:50%;transform:translateX(-50%);
          font-size:48px;transition:bottom 0.15s;user-select:none;
        `;
        mole.textContent = '🐹';
        hole.appendChild(mole);
        hole.addEventListener('click', () => this._whack(i));
        grid.appendChild(hole);
      }
      container.appendChild(grid);

      const tip = document.createElement('div');
      tip.style.cssText = 'color:#ffcc44;font-size:13px;font-family:monospace;';
      tip.textContent = '🐹 = 10pts | ⭐ Golden = 50pts | Miss = -5pts';
      container.appendChild(tip);
    },

    start() {
      this.running = true;
      this.timer = setInterval(() => {
        this.timeLeft--;
        this.speed = 1 + (30 - this.timeLeft) / 30;
        const el = document.getElementById('wam-timer');
        if (el) el.textContent = `Time: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) this._end();
      }, 1000);
      this._scheduleMoles();
    },

    stop() {
      this.running = false;
      clearInterval(this.timer);
      this.moleTimers.forEach(t => clearTimeout(t));
      this.moleTimers = [];
    },

    _scheduleMoles() {
      if (!this.running) return;
      const hole = randInt(0, 8);
      if (!this.moles[hole]) {
        const isGolden = Math.random() < 0.1;
        this._showMole(hole, isGolden);
      }
      const next = randInt(400, 1200) / this.speed;
      const t = setTimeout(() => this._scheduleMoles(), next);
      this.moleTimers.push(t);
    },

    _showMole(i, golden) {
      if (!this.running) return;
      this.moles[i] = true;
      this.golden[i] = golden;
      const el = document.getElementById(`wam-mole-${i}`);
      if (el) { el.textContent = golden ? '⭐' : '🐹'; el.style.bottom = '10px'; }
      const duration = (randInt(500, 2000)) / this.speed;
      const t = setTimeout(() => {
        if (this.moles[i]) this._hideMole(i, false);
      }, duration);
      this.moleTimers.push(t);
    },

    _hideMole(i, whacked) {
      this.moles[i] = false;
      const el = document.getElementById(`wam-mole-${i}`);
      if (el) el.style.bottom = '-60px';
      if (!whacked) {
        this.score = Math.max(0, this.score - 5);
        const scoreEl = document.getElementById('wam-score');
        if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
      }
    },

    _whack(i) {
      if (!this.moles[i] || !this.running) return;
      const pts = this.golden[i] ? 50 : 10;
      this.score += pts;
      const scoreEl = document.getElementById('wam-score');
      if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
      const el = document.getElementById(`wam-mole-${i}`);
      if (el) { el.style.bottom = '-60px'; }
      this.moles[i] = false;
    },

    _end() {
      this.stop();
      const tickets = Math.floor(this.score / 10);
      const xp = this.score * 2;
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (this.score >= 300) checkAchievement('mole_master');
      showResults({ game: 'Whack-a-Mole', score: this.score, tickets, xp, won: this.score > 0, details: `Final Score: ${this.score}` });
    }
  };

  // ─── 6. COLOR MATCH CHALLENGE ────────────────────────────────────────────────

  const ColorMatch = {
    container: null,
    round: 0, totalRounds: 20,
    score: 0, timer: null, roundTimer: null,
    timeLeft: 3,
    COLORS: [
      { name: 'RED', hex: '#ff3333' },
      { name: 'BLUE', hex: '#3366ff' },
      { name: 'GREEN', hex: '#33cc33' },
      { name: 'YELLOW', hex: '#ffcc00' },
    ],
    currentTextColor: null,
    startTime: 0,

    init(container) {
      this.container = container;
      this.round = 0;
      this.score = 0;
      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;';

      const hud = document.createElement('div');
      hud.style.cssText = 'color:#fff;font-size:16px;font-family:monospace;display:flex;gap:20px;';
      hud.innerHTML = `<span id="cm-round">Round: 0/${this.totalRounds}</span><span id="cm-score">Score: 0</span><span id="cm-timer">Time: 3s</span>`;
      container.appendChild(hud);

      const inst = document.createElement('div');
      inst.style.cssText = 'color:#aaf;font-size:14px;font-family:monospace;text-align:center;';
      inst.textContent = 'Click the button matching the COLOR of the text (not what it says!)';
      container.appendChild(inst);

      const wordEl = document.createElement('div');
      wordEl.id = 'cm-word';
      wordEl.style.cssText = 'font-size:64px;font-weight:bold;font-family:monospace;height:80px;display:flex;align-items:center;';
      container.appendChild(wordEl);

      const btnRow = document.createElement('div');
      btnRow.id = 'cm-buttons';
      btnRow.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;';
      this.COLORS.forEach(c => {
        const btn = document.createElement('button');
        btn.dataset.color = c.name;
        btn.style.cssText = `
          width:100px;height:50px;background:${c.hex};border:none;border-radius:8px;
          font-size:15px;font-weight:bold;color:#fff;cursor:pointer;
          text-shadow:0 1px 2px #0008;box-shadow:0 0 8px ${c.hex}88;
        `;
        btn.textContent = c.name;
        btn.addEventListener('click', () => this._answer(c.name));
        btnRow.appendChild(btn);
      });
      container.appendChild(btnRow);

      const feedbackEl = document.createElement('div');
      feedbackEl.id = 'cm-feedback';
      feedbackEl.style.cssText = 'font-size:24px;font-family:monospace;height:30px;';
      container.appendChild(feedbackEl);
    },

    start() {
      this._nextRound();
    },

    stop() {
      clearInterval(this.timer);
      clearTimeout(this.roundTimer);
    },

    _nextRound() {
      if (this.round >= this.totalRounds) { this._end(); return; }
      this.round++;
      this.timeLeft = 3;
      clearInterval(this.timer);

      const roundEl = document.getElementById('cm-round');
      if (roundEl) roundEl.textContent = `Round: ${this.round}/${this.totalRounds}`;
      const feedEl = document.getElementById('cm-feedback');
      if (feedEl) feedEl.textContent = '';

      // Pick word color and display color — must be different
      const wordColor = this.COLORS[randInt(0, 3)];
      let displayColorIdx = randInt(0, 3);
      while (this.COLORS[displayColorIdx].name === wordColor.name) displayColorIdx = randInt(0, 3);
      const displayColor = this.COLORS[displayColorIdx];
      this.currentTextColor = displayColor.name;

      const wordEl = document.getElementById('cm-word');
      if (wordEl) { wordEl.textContent = wordColor.name; wordEl.style.color = displayColor.hex; }

      this.startTime = Date.now();
      this.timer = setInterval(() => {
        this.timeLeft--;
        const timerEl = document.getElementById('cm-timer');
        if (timerEl) timerEl.textContent = `Time: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
          clearInterval(this.timer);
          const feedEl = document.getElementById('cm-feedback');
          if (feedEl) { feedEl.textContent = '⏰ Time up!'; feedEl.style.color = '#ff6644'; }
          setTimeout(() => this._nextRound(), 600);
        }
      }, 1000);
    },

    _answer(colorName) {
      if (this.round === 0) return;
      clearInterval(this.timer);
      const correct = colorName === this.currentTextColor;
      const rt = Date.now() - this.startTime;
      const speedBonus = correct ? Math.max(0, Math.floor((3000 - rt) / 30)) : 0;
      if (correct) this.score += 100 + speedBonus;
      const scoreEl = document.getElementById('cm-score');
      if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
      const feedEl = document.getElementById('cm-feedback');
      if (feedEl) {
        feedEl.textContent = correct ? `✅ +${100 + speedBonus}` : `❌ Wrong! It was ${this.currentTextColor}`;
        feedEl.style.color = correct ? '#44ff88' : '#ff4444';
      }
      setTimeout(() => this._nextRound(), 700);
    },

    _end() {
      this.stop();
      const tickets = Math.floor(this.score / 50);
      const xp = Math.floor(this.score / 5);
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (this.score >= 2000) checkAchievement('color_wizard');
      showResults({ game: 'Color Match Challenge', score: this.score, tickets, xp, won: this.score > 500, details: `${this.totalRounds} rounds completed` });
    }
  };

  // ─── 7. TRIVIA CHALLENGE ─────────────────────────────────────────────────────

  const TriviaChallenge = {
    container: null,
    questions: [],
    currentQ: 0,
    score: 0,
    timer: null,
    timeLeft: 15,
    startTime: 0,
    answered: false,

    ALL_QUESTIONS: [
      { q: 'What is the closest planet to the Sun?', opts: ['Mercury','Venus','Earth','Mars'], ans: 0 },
      { q: 'How many planets are in our solar system?', opts: ['7','8','9','10'], ans: 1 },
      { q: 'What is the largest planet in our solar system?', opts: ['Saturn','Neptune','Uranus','Jupiter'], ans: 3 },
      { q: 'What planet is known as the Red Planet?', opts: ['Venus','Mars','Jupiter','Neptune'], ans: 1 },
      { q: 'What is the name of our galaxy?', opts: ['Andromeda','Milky Way','Triangulum','Whirlpool'], ans: 1 },
      { q: 'What year did humans first land on the Moon?', opts: ['1965','1967','1969','1972'], ans: 2 },
      { q: 'What is the speed of light (approx)?', opts: ['150,000 km/s','200,000 km/s','300,000 km/s','400,000 km/s'], ans: 2 },
      { q: 'Which planet has the most moons?', opts: ['Jupiter','Saturn','Uranus','Neptune'], ans: 1 },
      { q: 'What is a light-year?', opts: ['Time light travels in 1 year','Speed of light per second','Distance light travels in 1 year','Mass of photons per year'], ans: 2 },
      { q: 'What planet has rings visible from Earth?', opts: ['Jupiter','Uranus','Saturn','Neptune'], ans: 2 },
      { q: 'What is the hottest planet?', opts: ['Mercury','Venus','Mars','Jupiter'], ans: 1 },
      { q: 'The first artificial satellite was named?', opts: ['Apollo 1','Sputnik 1','Vostok 1','Explorer 1'], ans: 1 },
      { q: 'What does NASA stand for?', opts: ['National Aeronautics and Space Administration','North American Space Agency','National Aerospace Science Agency','Natural Astronaut Space Agency'], ans: 0 },
      { q: 'Who was the first human in space?', opts: ['Neil Armstrong','Buzz Aldrin','Yuri Gagarin','Alan Shepard'], ans: 2 },
      { q: 'What is a black hole?', opts: ['A dark star','A region where gravity is so strong nothing escapes','A type of nebula','A dead galaxy'], ans: 1 },
      { q: 'How long does light take to travel from Sun to Earth?', opts: ['About 1 minute','About 8 minutes','About 30 minutes','About 1 hour'], ans: 1 },
      { q: 'What planet rotates on its side?', opts: ['Neptune','Saturn','Uranus','Jupiter'], ans: 2 },
      { q: 'What is the Great Red Spot on Jupiter?', opts: ['A volcano','A continent','A storm','A sea'], ans: 2 },
      { q: 'What is the name of Mars\'s largest moon?', opts: ['Io','Phobos','Titan','Europa'], ans: 1 },
      { q: 'What is the Milky Way?', opts: ['A nebula','A star cluster','Our home galaxy','A type of asteroid'], ans: 2 },
      { q: 'Which NASA mission first landed humans on the Moon?', opts: ['Apollo 10','Apollo 11','Apollo 12','Gemini 7'], ans: 1 },
      { q: 'What element is most abundant in the Sun?', opts: ['Helium','Oxygen','Hydrogen','Carbon'], ans: 2 },
    ],

    init(container) {
      this.container = container;
      this.score = 0;
      this.currentQ = 0;
      this.questions = shuffle(this.ALL_QUESTIONS).slice(0, 10);
      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:14px;max-width:500px;margin:auto;';

      const hud = document.createElement('div');
      hud.style.cssText = 'color:#fff;font-size:16px;font-family:monospace;display:flex;gap:20px;';
      hud.innerHTML = '<span id="tq-q">Q: 1/10</span><span id="tq-score">Score: 0</span><span id="tq-timer">Time: 15s</span>';
      container.appendChild(hud);

      const progress = document.createElement('div');
      progress.id = 'tq-progress';
      progress.style.cssText = 'width:100%;height:6px;background:#333;border-radius:3px;';
      const bar = document.createElement('div');
      bar.id = 'tq-bar';
      bar.style.cssText = 'height:6px;background:#4488ff;border-radius:3px;transition:width 0.3s;width:0%;';
      progress.appendChild(bar);
      container.appendChild(progress);

      const qText = document.createElement('div');
      qText.id = 'tq-text';
      qText.style.cssText = 'color:#fff;font-size:18px;font-family:monospace;text-align:center;min-height:60px;';
      container.appendChild(qText);

      const opts = document.createElement('div');
      opts.id = 'tq-options';
      opts.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;';
      container.appendChild(opts);

      const feedback = document.createElement('div');
      feedback.id = 'tq-feedback';
      feedback.style.cssText = 'font-size:18px;font-family:monospace;height:24px;';
      container.appendChild(feedback);
    },

    start() {
      this._showQuestion();
    },

    stop() {
      clearInterval(this.timer);
    },

    _showQuestion() {
      if (this.currentQ >= this.questions.length) { this._end(); return; }
      const q = this.questions[this.currentQ];
      this.timeLeft = 15;
      this.answered = false;
      clearInterval(this.timer);

      const qEl = document.getElementById('tq-q');
      if (qEl) qEl.textContent = `Q: ${this.currentQ + 1}/10`;
      const bar = document.getElementById('tq-bar');
      if (bar) bar.style.width = `${(this.currentQ / 10) * 100}%`;
      const textEl = document.getElementById('tq-text');
      if (textEl) textEl.textContent = q.q;
      const feedEl = document.getElementById('tq-feedback');
      if (feedEl) feedEl.textContent = '';
      const optsEl = document.getElementById('tq-options');
      if (optsEl) {
        optsEl.innerHTML = '';
        q.opts.forEach((opt, i) => {
          const btn = document.createElement('button');
          btn.dataset.idx = i;
          btn.style.cssText = `
            padding:12px;background:#1a1a3e;border:2px solid #4488ff;border-radius:8px;
            color:#fff;font-size:14px;font-family:monospace;cursor:pointer;text-align:left;
            transition:background 0.2s;
          `;
          btn.textContent = `${String.fromCharCode(65 + i)}) ${opt}`;
          btn.addEventListener('click', () => this._answer(i));
          optsEl.appendChild(btn);
        });
      }

      this.startTime = Date.now();
      this.timer = setInterval(() => {
        this.timeLeft--;
        const timerEl = document.getElementById('tq-timer');
        if (timerEl) timerEl.textContent = `Time: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
          clearInterval(this.timer);
          if (!this.answered) this._answer(-1);
        }
      }, 1000);
    },

    _answer(idx) {
      if (this.answered) return;
      this.answered = true;
      clearInterval(this.timer);
      const q = this.questions[this.currentQ];
      const correct = idx === q.ans;
      const rt = Date.now() - this.startTime;
      const timeBonus = correct ? Math.max(0, Math.floor((15000 - rt) / 100)) : 0;
      if (correct) this.score += 150 + timeBonus;

      const optsEl = document.getElementById('tq-options');
      if (optsEl) {
        Array.from(optsEl.children).forEach((btn, i) => {
          if (i === q.ans) btn.style.background = '#005500';
          else if (i === idx) btn.style.background = '#550000';
          btn.style.cursor = 'default';
        });
      }
      const feedEl = document.getElementById('tq-feedback');
      if (feedEl) {
        feedEl.textContent = correct ? `✅ Correct! +${150 + timeBonus}` : `❌ Wrong! Answer: ${q.opts[q.ans]}`;
        feedEl.style.color = correct ? '#44ff88' : '#ff4444';
      }
      const scoreEl = document.getElementById('tq-score');
      if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
      this.currentQ++;
      setTimeout(() => this._showQuestion(), 1200);
    },

    _end() {
      this.stop();
      const tickets = Math.floor(this.score / 50);
      const xp = Math.floor(this.score / 5);
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (this.score >= 1500) checkAchievement('trivia_genius');
      showResults({ game: 'Trivia Challenge', score: this.score, tickets, xp, won: this.score >= 750, details: `${this.questions.length} questions answered` });
    }
  };

  // ─── 8. MAZE RUNNER ──────────────────────────────────────────────────────────

  const MazeRunner = {
    container: null, canvas: null, ctx: null,
    animFrame: null, running: false,
    score: 0, startTime: 0,
    player: { x: 1, y: 1 },
    stars: [], collectedStars: 0,
    TILE: 28,
    keys: {},
    moveDelay: 120, lastMove: 0,

    MAZES: [
      // 15x15 maze layout #1
      [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
        [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
        [1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
        [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      ],
    ],
    currentMaze: null,

    init(container) {
      this.container = container;
      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';

      const hud = document.createElement('div');
      hud.style.cssText = 'color:#fff;font-size:16px;font-family:monospace;display:flex;gap:20px;';
      hud.innerHTML = '<span id="mz-score">Score: 0</span><span id="mz-time">Time: 0s</span><span id="mz-stars">⭐: 0</span>';
      container.appendChild(hud);

      const canvas = document.createElement('canvas');
      canvas.width = 420; canvas.height = 420;
      canvas.style.cssText = 'border:2px solid #44ff88;border-radius:8px;background:#050520;';
      container.appendChild(canvas);
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      const tip = document.createElement('div');
      tip.style.cssText = 'color:#aaf;font-size:13px;font-family:monospace;';
      tip.textContent = 'Arrow keys to navigate | Reach the exit | Collect ⭐ for bonus points!';
      container.appendChild(tip);

      this.currentMaze = JSON.parse(JSON.stringify(this.MAZES[0]));
      this.player = { x: 1, y: 1 };
      this.collectedStars = 0;
      this.score = 0;
      this.keys = {};

      // Place stars on open tiles
      this.stars = [];
      for (let r = 1; r < 14; r++) {
        for (let c = 1; c < 14; c++) {
          if (this.currentMaze[r][c] === 0 && Math.random() < 0.08 && !(r === 1 && c === 1) && !(r === 13 && c === 13)) {
            this.stars.push({ x: c, y: r, collected: false });
          }
        }
      }

      this._keyDown = (e) => { this.keys[e.code] = true; e.preventDefault(); };
      this._keyUp = (e) => { this.keys[e.code] = false; };
      document.addEventListener('keydown', this._keyDown);
      document.addEventListener('keyup', this._keyUp);
    },

    start() {
      this.running = true;
      this.startTime = Date.now();
      this._loop();
    },

    stop() {
      this.running = false;
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
      document.removeEventListener('keydown', this._keyDown);
      document.removeEventListener('keyup', this._keyUp);
    },

    _loop() {
      if (!this.running) return;
      this._update();
      this._draw();
      this.animFrame = requestAnimationFrame(() => this._loop());
    },

    _update() {
      const now = Date.now();
      const elapsed = Math.floor((now - this.startTime) / 1000);
      const timeEl = document.getElementById('mz-time');
      if (timeEl) timeEl.textContent = `Time: ${elapsed}s`;

      if (now - this.lastMove > this.moveDelay) {
        let dx = 0, dy = 0;
        if (this.keys['ArrowLeft']) dx = -1;
        else if (this.keys['ArrowRight']) dx = 1;
        else if (this.keys['ArrowUp']) dy = -1;
        else if (this.keys['ArrowDown']) dy = 1;

        if (dx || dy) {
          const nx = this.player.x + dx, ny = this.player.y + dy;
          if (ny >= 0 && ny < 15 && nx >= 0 && nx < 15 && this.currentMaze[ny][nx] === 0) {
            this.player.x = nx;
            this.player.y = ny;
            this.lastMove = now;

            // Collect stars
            this.stars.forEach(s => {
              if (!s.collected && s.x === nx && s.y === ny) {
                s.collected = true;
                this.collectedStars++;
                this.score += 50;
                const starsEl = document.getElementById('mz-stars');
                if (starsEl) starsEl.textContent = `⭐: ${this.collectedStars}`;
              }
            });

            // Check win (exit is bottom-right)
            if (nx === 13 && ny === 13) this._end(true);
          }
        }
      }
    },

    _draw() {
      const ctx = this.ctx, T = this.TILE;
      ctx.fillStyle = '#050520';
      ctx.fillRect(0, 0, 420, 420);
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          if (this.currentMaze[r][c] === 1) {
            ctx.fillStyle = '#223366';
            ctx.fillRect(c * T, r * T, T, T);
            ctx.strokeStyle = '#334499';
            ctx.strokeRect(c * T, r * T, T, T);
          }
        }
      }
      // Exit marker
      ctx.fillStyle = '#00ff8844';
      ctx.fillRect(13 * T, 13 * T, T, T);
      ctx.fillStyle = '#00ff88';
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪', 13 * T + T / 2, 13 * T + T / 2);

      // Stars
      this.stars.forEach(s => {
        if (!s.collected) {
          ctx.fillText('⭐', s.x * T + T / 2, s.y * T + T / 2);
        }
      });

      // Player
      ctx.fillStyle = '#00ccff';
      ctx.beginPath();
      ctx.arc(this.player.x * T + T / 2, this.player.y * T + T / 2, T / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('🧑', this.player.x * T + T / 2, this.player.y * T + T / 2);
    },

    _end(won) {
      this.stop();
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const timeScore = won ? Math.max(0, 1000 - elapsed * 10) : 0;
      const finalScore = timeScore + this.score;
      const tickets = Math.floor(finalScore / 50);
      const xp = Math.floor(finalScore / 5);
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (won && elapsed < 30) checkAchievement('maze_speedrun');
      showResults({ game: 'Maze Runner', score: finalScore, tickets, xp, won, details: `Time: ${elapsed}s | Stars: ${this.collectedStars}` });
    }
  };

  // ─── 9. PUZZLE SOLVER ────────────────────────────────────────────────────────

  const PuzzleSolver = {
    container: null,
    tiles: [], // 0 = empty
    moves: 0,
    startTime: 0,
    timer: null,
    elapsed: 0,
    SIZE: 3,

    SYMBOLS: ['🚀','🌟','🪐','🌙','☄️','🛸','🌌','⭐'],

    init(container) {
      this.container = container;
      this.moves = 0;
      this.elapsed = 0;
      container.innerHTML = '';
      container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;';

      const hud = document.createElement('div');
      hud.style.cssText = 'color:#fff;font-size:16px;font-family:monospace;display:flex;gap:20px;';
      hud.innerHTML = '<span id="ps-moves">Moves: 0</span><span id="ps-time">Time: 0s</span>';
      container.appendChild(hud);

      const inst = document.createElement('div');
      inst.style.cssText = 'color:#aaf;font-size:13px;font-family:monospace;';
      inst.textContent = 'Click a tile adjacent to the empty space to move it. Order: 1–8!';
      container.appendChild(inst);

      const grid = document.createElement('div');
      grid.id = 'ps-grid';
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,90px);gap:6px;';
      container.appendChild(grid);

      this.tiles = this._shuffle([1, 2, 3, 4, 5, 6, 7, 8, 0]);
      this._renderGrid();
    },

    _shuffle(arr) {
      // Ensure solvable by doing random valid moves from solved state
      let state = [1, 2, 3, 4, 5, 6, 7, 8, 0];
      let emptyIdx = 8;
      const adj = (i) => {
        const res = [];
        const r = Math.floor(i / 3), c = i % 3;
        if (r > 0) res.push(i - 3);
        if (r < 2) res.push(i + 3);
        if (c > 0) res.push(i - 1);
        if (c < 2) res.push(i + 1);
        return res;
      };
      for (let i = 0; i < 200; i++) {
        const nbrs = adj(emptyIdx);
        const next = nbrs[randInt(0, nbrs.length - 1)];
        [state[emptyIdx], state[next]] = [state[next], state[emptyIdx]];
        emptyIdx = next;
      }
      return state;
    },

    _renderGrid() {
      const grid = document.getElementById('ps-grid');
      if (!grid) return;
      grid.innerHTML = '';
      this.tiles.forEach((val, idx) => {
        const tile = document.createElement('div');
        if (val === 0) {
          tile.style.cssText = 'width:90px;height:90px;background:#111;border-radius:8px;';
        } else {
          const colors = ['','#1a237e','#1b5e20','#b71c1c','#f57f17','#880e4f','#006064','#4a148c','#e65100'];
          tile.style.cssText = `
            width:90px;height:90px;background:${colors[val]};border-radius:8px;
            display:flex;align-items:center;justify-content:center;flex-direction:column;
            cursor:pointer;border:2px solid #4488ff44;font-size:28px;color:#fff;
            font-family:monospace;font-weight:bold;box-shadow:0 0 8px #4488ff33;
            transition:transform 0.1s;user-select:none;
          `;
          tile.innerHTML = `<div>${this.SYMBOLS[val - 1]}</div><div style="font-size:14px;">${val}</div>`;
          tile.addEventListener('click', () => this._move(idx));
        }
        grid.appendChild(tile);
      });
    },

    start() {
      this.startTime = Date.now();
      this.timer = setInterval(() => {
        this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const el = document.getElementById('ps-time');
        if (el) el.textContent = `Time: ${this.elapsed}s`;
      }, 1000);
    },

    stop() { clearInterval(this.timer); },

    _move(idx) {
      const emptyIdx = this.tiles.indexOf(0);
      const r1 = Math.floor(idx / 3), c1 = idx % 3;
      const r2 = Math.floor(emptyIdx / 3), c2 = emptyIdx % 3;
      const adjacent = (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
      if (!adjacent) return;
      [this.tiles[idx], this.tiles[emptyIdx]] = [this.tiles[emptyIdx], this.tiles[idx]];
      this.moves++;
      const movesEl = document.getElementById('ps-moves');
      if (movesEl) movesEl.textContent = `Moves: ${this.moves}`;
      this._renderGrid();
      if (this._isSolved()) setTimeout(() => this._end(), 300);
    },

    _isSolved() {
      return this.tiles.join(',') === '1,2,3,4,5,6,7,8,0';
    },

    _end() {
      this.stop();
      const moveScore = Math.max(0, 1000 - this.moves * 10);
      const timeScore = Math.max(0, 500 - this.elapsed * 5);
      const finalScore = moveScore + timeScore;
      const tickets = Math.floor(finalScore / 50);
      const xp = Math.floor(finalScore / 5);
      addTickets(tickets);
      addXP(xp);
      updateMission('play_game', 1);
      if (this.moves <= 50) checkAchievement('puzzle_master');
      showResults({ game: 'Puzzle Solver', score: finalScore, tickets, xp, won: true, details: `Moves: ${this.moves} | Time: ${this.elapsed}s` });
    }
  };

  // ─── GAMES REGISTRY ──────────────────────────────────────────────────────────

  const GAME_LIST = [
    { id: 'memory_match',      name: 'Memory Match',          icon: '🧠', desc: 'Flip cards and find matching pairs!',             difficulty: 'Easy',   impl: MemoryMatch },
    { id: 'reaction_speed',    name: 'Reaction Speed Test',   icon: '⚡', desc: 'How fast can you react?',                         difficulty: 'Easy',   impl: ReactionSpeed },
    { id: 'space_dodger',      name: 'Space Dodger',          icon: '🚀', desc: 'Dodge asteroids and survive!',                    difficulty: 'Medium', impl: SpaceDodger },
    { id: 'coin_collector',    name: 'Coin Collector',        icon: '💰', desc: 'Collect coins and avoid enemies!',                difficulty: 'Medium', impl: CoinCollector },
    { id: 'whack_a_mole',      name: 'Whack-a-Mole',         icon: '🐹', desc: 'Whack those sneaky moles!',                       difficulty: 'Easy',   impl: WhackAMole },
    { id: 'color_match',       name: 'Color Match Challenge', icon: '🎨', desc: 'Match colors, not words!',                        difficulty: 'Medium', impl: ColorMatch },
    { id: 'trivia_challenge',  name: 'Trivia Challenge',      icon: '❓', desc: '10 space & science questions!',                   difficulty: 'Medium', impl: TriviaChallenge },
    { id: 'maze_runner',       name: 'Maze Runner',           icon: '🌀', desc: 'Navigate the maze to the exit!',                  difficulty: 'Hard',   impl: MazeRunner },
    { id: 'puzzle_solver',     name: 'Puzzle Solver',         icon: '🧩', desc: 'Slide tiles into order!',                         difficulty: 'Hard',   impl: PuzzleSolver },
  ];

  let _currentGame = null;

  const Games = {
    list: GAME_LIST.map(g => ({ id: g.id, name: g.name, icon: g.icon, desc: g.desc, difficulty: g.difficulty })),

    play(gameId, options = {}) {
      const entry = GAME_LIST.find(g => g.id === gameId);
      if (!entry) { console.warn('Unknown game:', gameId); return; }
      this.stop();

      let container = document.getElementById('game-area');
      if (!container) {
        container = document.createElement('div');
        container.id = 'game-area';
        document.body.appendChild(container);
      }
      container.innerHTML = '';

      _currentGame = entry.impl;
      entry.impl.init(container, options.difficulty);
      entry.impl.start();
    },

    stop() {
      if (_currentGame && typeof _currentGame.stop === 'function') {
        _currentGame.stop();
        _currentGame = null;
      }
    },

    getGame(gameId) {
      const entry = GAME_LIST.find(g => g.id === gameId);
      return entry ? entry.impl : null;
    }
  };

  window.Games = Games;

})(window);
