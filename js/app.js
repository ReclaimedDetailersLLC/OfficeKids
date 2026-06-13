/**
 * app.js - Main Application Controller for Cosmic Arcade Control
 * Ties together GameEngine, UI, SolarSystem, and Games.
 */

// ── Compatibility shim: ui.js was generated expecting window.GameState ──
// Map it to our GameEngine so both work.
(function patchGameState() {
  function syncState() {
    if (!window.GameEngine) return;
    const p = GameEngine.getPlayer();
    const prog = GameEngine.getXpProgress();
    window.GameState = {
      tickets: p.tickets,
      xp: p.xp,
      maxXp: prog.needed || 500,
      rank: p.rank,
      name: p.name,
      streak: p.streak,
      highScores: GameEngine.getState().highScores || {}
    };
  }
  // Proxy events to keep GameState in sync
  document.addEventListener('DOMContentLoaded', () => {
    syncState();
    if (window.GameEngine) {
      GameEngine.on('xp_gained', syncState);
      GameEngine.on('tickets_gained', syncState);
      GameEngine.on('rank_up', syncState);
    }
  });
  syncState();
})();

// ── Fix showPage: ui.js looks for element IDs directly, our pages have 'page-X' prefix ──
// Patch runs AFTER ui.js loads.
document.addEventListener('DOMContentLoaded', () => {
  if (window.UI && UI.showPage) {
    const _orig = UI.showPage.bind(UI);
    UI.showPage = function(pageId) {
      // Normalise: if caller passes 'home', try 'page-home' first
      const prefixed = 'page-' + pageId;
      const el = document.getElementById(prefixed) || document.getElementById(pageId);
      if (!el) return;
      document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
      el.classList.add('active');
      el.style.display = 'block';
      el.scrollTop = 0;
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageId);
      });
    };
  }

  // Also fix updateHUD to use our element IDs
  if (window.GameEngine) {
    const origUpdateHUD = (window.UI && UI.updateHUD) ? UI.updateHUD.bind(UI) : null;
    function myUpdateHUD() {
      const p = GameEngine.getPlayer();
      const prog = GameEngine.getXpProgress();
      const tc = document.getElementById('hud-tickets-count');
      if (tc) tc.textContent = (p.tickets || 0).toLocaleString();
      const xfill = document.getElementById('hud-xp-bar-fill');
      if (xfill) xfill.style.width = (prog.percent || 0) + '%';
      const rk = document.getElementById('hud-rank');
      if (rk) rk.textContent = p.rank || 'Space Cadet';
      // avatar page
      const an = document.getElementById('avatar-player-name');
      if (an) an.textContent = p.name || 'Explorer';
      const ar = document.getElementById('avatar-rank');
      if (ar) ar.textContent = (GameEngine.getRankDisplay().name || 'Space Cadet') + ' ' + (GameEngine.getRankDisplay().icon || '🚀');
      const stc = document.getElementById('shop-ticket-count');
      if (stc) stc.textContent = (p.tickets || 0) + ' 🎫';
    }
    if (window.UI) UI.updateHUD = myUpdateHUD;
    window._updateHUD = myUpdateHUD;
    GameEngine.on('xp_gained', myUpdateHUD);
    GameEngine.on('tickets_gained', myUpdateHUD);
    GameEngine.on('rank_up', myUpdateHUD);
    myUpdateHUD();
  }
});

window.App = (function () {
  'use strict';

  let selectedPlanet = null;
  let rocketConfig = { nose: 'pointed', body: 'standard', engine: 'single', color: '#00f5ff', booster: 'none' };
  let launchTimer = null;
  let missionAlertTimer = null;
  let idleTimer = null;
  let logoClickCount = 0;
  let alienVisible = false;

  // ── Initialization ─────────────────────────────────────────────────────────
  function init() {
    setupGameEngineListeners();
    setupNavigation();
    setupHomePage();
    setupMissionControl();
    setupRocketLaunch();
    setupArcade();
    setupAvatar();
    setupPrizes();
    setupAchievements();
    setupMissions();
    setupSecretZone();
    setupEasterEggs();
    setupIdleAlien();

    // Auto-save
    setInterval(() => GameEngine.save(), 30000);

    // Start on home
    UI.showPage('home');
    UI.updateHUD();

    // First-time welcome
    const player = GameEngine.getPlayer();
    if (!player.name) {
      setTimeout(showWelcome, 1200);
    } else {
      UI.showAlert(`Welcome back, ${player.name}! 🚀`, 'info');
    }
  }

  // ── Welcome / Name Setup ───────────────────────────────────────────────────
  function showWelcome() {
    const modal = document.getElementById('modal-welcome');
    if (modal) modal.classList.add('active');
  }

  function submitName() {
    const input = document.getElementById('player-name-input');
    const name = (input ? input.value.trim() : '') || 'Cosmic Explorer';
    GameEngine.getPlayer().name = name;
    GameEngine.save();
    const modal = document.getElementById('modal-welcome');
    if (modal) modal.classList.remove('active');
    UI.updateHUD();
    UI.showAlert(`Welcome aboard, ${name}! Your adventure begins! 🌌`, 'success');
    setTimeout(() => GameEngine.addXP(50), 800);
  }

  // ── Game Engine Event Listeners ────────────────────────────────────────────
  function setupGameEngineListeners() {
    GameEngine.on('xp_gained', ({ amount, total }) => {
      UI.showEarnedPopup('xp', amount);
      UI.updateHUD();
    });
    GameEngine.on('tickets_gained', ({ amount }) => {
      UI.showEarnedPopup('tickets', amount);
      UI.updateHUD();
    });
    GameEngine.on('rank_up', ({ rank }) => {
      UI.showRankUp(rank);
      UI.updateHUD();
    });
    GameEngine.on('achievement_unlocked', (ach) => {
      UI.showAchievementNotif(ach);
      refreshAchievements();
    });
    GameEngine.on('mission_complete', (mission) => {
      UI.showAlert(`✅ Mission complete: "${mission.desc}"! Claim your reward!`, 'success');
      refreshMissions();
    });
    GameEngine.on('daily_reset', () => {
      UI.showAlert('🌅 Daily missions have refreshed! New challenges await!', 'info');
      refreshMissions();
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.getAttribute('data-page');
        navigateTo(page);
      });
    });
    // Close modals on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.remove('active');
      });
    });
  }

  function navigateTo(page) {
    if (page === 'solar') {
      UI.showPage('solar');
      const container = document.getElementById('solar-display');
      if (container) SolarSystem.renderSolarSystem(container);
    } else if (page === 'arcade') {
      UI.showPage('arcade');
      refreshArcade();
    } else if (page === 'achievements') {
      UI.showPage('achievements');
      refreshAchievements();
    } else if (page === 'missions') {
      UI.showPage('missions');
      refreshMissions();
    } else if (page === 'prizes') {
      UI.showPage('prizes');
      refreshPrizes();
    } else if (page === 'avatar') {
      UI.showPage('avatar');
      refreshAvatar();
    } else {
      UI.showPage(page);
    }
    // Close mobile menu
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.remove('open');
  }

  // ── Home Page ──────────────────────────────────────────────────────────────
  function setupHomePage() {
    // Feature cards
    document.querySelectorAll('.feature-card[data-page]').forEach(card => {
      card.addEventListener('click', () => navigateTo(card.getAttribute('data-page')));
    });
    refreshLeaderboard();
    refreshHomeMissions();
    startNewsTicker();
  }

  function refreshLeaderboard() {
    const lb = GameEngine.getLeaderboard();
    const el = document.getElementById('leaderboard-list');
    if (!el) return;
    el.innerHTML = lb.slice(0, 5).map((p, i) => `
      <div class="lb-row ${p.name.includes('(You)') ? 'lb-you' : ''}">
        <span class="lb-rank">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
        <span class="lb-name">${p.name}</span>
        <span class="lb-xp">${p.xp.toLocaleString()} XP</span>
      </div>
    `).join('');
  }

  function refreshHomeMissions() {
    const el = document.getElementById('home-missions-list');
    if (!el) return;
    const missions = GameEngine.getMissions();
    el.innerHTML = missions.slice(0, 3).map(m => `
      <div class="home-mission ${m.completed ? 'completed' : ''}">
        <span>${m.completed ? '✅' : '⬜'} ${m.desc}</span>
        <span class="mission-reward">+${m.xpReward}XP +${m.ticketReward}🎫</span>
      </div>
    `).join('');
  }

  function startNewsTicker() {
    const ticker = document.getElementById('news-ticker-text');
    if (!ticker) return;
    const news = [
      '🚀 New rocket upgrades available in the Prize Center!',
      '🌟 DAILY BONUS: Double XP on all planet explorations today!',
      '🎮 Whack-a-Mole tournament starting soon — prepare your reflexes!',
      '👽 Alien traders spotted near Jupiter — rare items available!',
      '🏆 StarBlaster99 just became a Cosmic Legend!',
      '💫 Secret planet discovered by 3 explorers this week!',
      '🎡 Prize wheel jackpot won — 1000 tickets awarded!',
      '🔭 New mission: Explore all 8 planets for a mega reward!',
      '⭐ Daily streak bonuses now stack up to 7 days!',
      '🎁 Mystery boxes on sale in the Prize Shop!',
    ];
    let i = 0;
    ticker.textContent = news[0];
    setInterval(() => {
      ticker.style.opacity = '0';
      setTimeout(() => {
        i = (i + 1) % news.length;
        ticker.textContent = news[i];
        ticker.style.opacity = '1';
      }, 500);
    }, 4000);
  }

  // ── Mission Control ────────────────────────────────────────────────────────
  function setupMissionControl() {
    const launchBtn = document.getElementById('mc-launch-btn');
    if (launchBtn) launchBtn.addEventListener('click', () => navigateTo('rocket'));

    // Random mission alerts
    missionAlertTimer = setInterval(() => {
      if (document.getElementById('page-mission') && document.getElementById('page-mission').classList.contains('active')) {
        flashMissionAlert();
      }
    }, 8000);

    startMissionLog();
    startCountdown();
  }

  function startMissionLog() {
    const log = document.getElementById('mission-log');
    if (!log) return;
    const entries = [
      'ALPHA-7 station systems nominal.',
      'Fuel reserves at 94%.',
      'Radar sweep: no anomalies detected.',
      'Solar wind intensity: moderate.',
      'All crew stations manned.',
      'Orbital trajectory calculated.',
      'Launch window opens in T-10 minutes.',
      'Communication link with base: STRONG.',
    ];
    let i = 0;
    function addEntry() {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> ${entries[i % entries.length]}`;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      i++;
      setTimeout(addEntry, 3000 + Math.random() * 4000);
    }
    addEntry();
  }

  function flashMissionAlert() {
    const panel = document.getElementById('mission-alert-panel');
    if (!panel) return;
    const alerts = [
      '⚠️ SOLAR FLARE DETECTED — Shields on standby',
      '📡 INCOMING TRANSMISSION from Sector 7',
      '🛸 UNIDENTIFIED OBJECT approaching outer ring',
      '⭐ ASTEROID FIELD — Adjust trajectory',
      '🌌 QUANTUM ANOMALY in sector 4',
    ];
    panel.textContent = alerts[Math.floor(Math.random() * alerts.length)];
    panel.classList.add('flashing');
    setTimeout(() => panel.classList.remove('flashing'), 3000);
  }

  function startCountdown() {
    const el = document.getElementById('launch-countdown');
    if (!el) return;
    let t = 600; // 10 minutes
    setInterval(() => {
      t = (t - 1 + 600) % 600;
      const m = String(Math.floor(t / 60)).padStart(2, '0');
      const s = String(t % 60).padStart(2, '0');
      el.textContent = `T-${m}:${s}`;
    }, 1000);
  }

  // ── Rocket Launch ──────────────────────────────────────────────────────────
  function setupRocketLaunch() {
    document.querySelectorAll('.rocket-part-option').forEach(opt => {
      opt.addEventListener('click', function () {
        const type = this.dataset.type;
        const val = this.dataset.value;
        rocketConfig[type] = val;
        document.querySelectorAll(`.rocket-part-option[data-type="${type}"]`).forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        updateRocketPreview();
      });
    });

    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', function () {
        rocketConfig.color = this.dataset.color;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        updateRocketPreview();
      });
    });

    const launchBtn = document.getElementById('launch-btn');
    if (launchBtn) launchBtn.addEventListener('click', initiateLaunch);

    updateRocketPreview();
  }

  function updateRocketPreview() {
    const preview = document.getElementById('rocket-preview-svg');
    if (!preview) return;
    const c = rocketConfig.color;
    // Build a nice rocket SVG
    const noseShapes = {
      pointed: `<polygon points="60,10 40,60 80,60" fill="${c}" filter="url(#neon)"/>`,
      rounded: `<ellipse cx="60" cy="40" rx="20" ry="35" fill="${c}" filter="url(#neon)"/>`,
      cone: `<polygon points="60,5 35,65 85,65" fill="${c}" filter="url(#neon)"/>`
    };
    const bodyShapes = {
      standard: `<rect x="42" y="55" width="36" height="70" rx="6" fill="${c}" filter="url(#neon)"/>`,
      wide: `<rect x="34" y="55" width="52" height="70" rx="8" fill="${c}" filter="url(#neon)"/>`,
      sleek: `<rect x="48" y="55" width="24" height="80" rx="4" fill="${c}" filter="url(#neon)"/>`
    };
    const engineShapes = {
      single: `<ellipse cx="60" cy="135" rx="12" ry="8" fill="#ff6600"/><rect x="52" y="130" width="16" height="15" fill="#ff4400"/>`,
      double: `<ellipse cx="48" cy="135" rx="9" ry="7" fill="#ff6600"/><ellipse cx="72" cy="135" rx="9" ry="7" fill="#ff6600"/>`,
      triple: `<ellipse cx="36" cy="135" rx="7" ry="6" fill="#ff6600"/><ellipse cx="60" cy="135" rx="7" ry="6" fill="#ff6600"/><ellipse cx="84" cy="135" rx="7" ry="6" fill="#ff6600"/>`
    };
    const boosterShapes = {
      none: '',
      small: `<rect x="22" y="75" width="14" height="45" rx="5" fill="${c}88"/><rect x="84" y="75" width="14" height="45" rx="5" fill="${c}88"/>`,
      large: `<rect x="14" y="65" width="20" height="60" rx="7" fill="${c}aa"/><rect x="86" y="65" width="20" height="60" rx="7" fill="${c}aa"/>`
    };
    preview.innerHTML = `
      <defs>
        <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g>
        ${boosterShapes[rocketConfig.booster] || ''}
        ${noseShapes[rocketConfig.nose] || noseShapes.pointed}
        ${bodyShapes[rocketConfig.body] || bodyShapes.standard}
        ${engineShapes[rocketConfig.engine] || engineShapes.single}
        <circle cx="60" cy="90" r="9" fill="#001a2e" stroke="${c}" stroke-width="2"/>
        <circle cx="60" cy="90" r="5" fill="${c}" opacity="0.7"/>
      </g>
    `;
    // Update stat bars
    const thrustMap = { single: 60, double: 80, triple: 100 };
    const speedMap = { sleek: 90, standard: 70, wide: 50 };
    const boostMap = { none: 20, small: 60, large: 100 };
    setStatBar('stat-thrust', thrustMap[rocketConfig.engine] || 60);
    setStatBar('stat-speed', speedMap[rocketConfig.body] || 70);
    setStatBar('stat-boost', boostMap[rocketConfig.booster] || 20);
  }

  function setStatBar(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = pct + '%';
  }

  function initiateLaunch() {
    const btn = document.getElementById('launch-btn');
    const countdownEl = document.getElementById('launch-display-countdown');
    const rocketEl = document.getElementById('rocket-preview-svg');
    if (btn) btn.disabled = true;
    if (countdownEl) countdownEl.classList.remove('hidden');

    let count = 5;
    const cdNum = document.getElementById('countdown-number');
    const cdLabel = document.getElementById('countdown-label');
    const stages = ['IGNITION SEQUENCE', 'FUEL PRESSURIZED', 'ENGINES ACTIVE', 'ALL SYSTEMS GO', 'LIFTOFF! 🚀'];

    launchTimer = setInterval(() => {
      if (cdNum) cdNum.textContent = count;
      if (cdLabel) cdLabel.textContent = stages[5 - count] || '';
      if (count === 0) {
        clearInterval(launchTimer);
        if (countdownEl) countdownEl.classList.add('hidden');
        if (rocketEl) {
          rocketEl.style.animation = 'rocketFly 1.5s ease-in forwards';
        }
        setTimeout(showLaunchResult, 1800);
      }
      count--;
    }, 1000);
  }

  function showLaunchResult() {
    const success = Math.random() < 0.82;
    const xpGain = success ? (80 + Math.floor(Math.random() * 60)) : 20;
    const ticketGain = success ? (25 + Math.floor(Math.random() * 30)) : 5;
    const resultEl = document.getElementById('launch-result');
    const rocketEl = document.getElementById('rocket-preview-svg');
    const btn = document.getElementById('launch-btn');

    GameEngine.recordLaunch();
    GameEngine.addXP(xpGain);
    GameEngine.addTickets(ticketGain);
    if (success) UI.createConfetti();

    if (resultEl) {
      resultEl.classList.remove('hidden');
      resultEl.innerHTML = success
        ? `<div class="result-success">
            <div class="result-icon">🚀✨</div>
            <h2>LAUNCH SUCCESSFUL!</h2>
            <p>Your rocket reached orbit! Mission accomplished!</p>
            <div class="result-rewards"><span>+${xpGain} XP</span><span>+${ticketGain} 🎫</span></div>
           </div>`
        : `<div class="result-failure">
            <div class="result-icon">💥</div>
            <h2>MISSION FAILED</h2>
            <p>Something went wrong at T-0. Recalibrate and try again!</p>
            <div class="result-rewards"><span>+${xpGain} XP (consolation)</span></div>
           </div>`;
    }
    if (rocketEl) { rocketEl.style.animation = ''; rocketEl.style.opacity = success ? '0.3' : '1'; }
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 LAUNCH AGAIN';
      setTimeout(() => { if (resultEl) resultEl.classList.add('hidden'); if (rocketEl) rocketEl.style.opacity = '1'; }, 5000);
    }
  }

  // ── Planet Exploration ─────────────────────────────────────────────────────
  function explorePlanet(planet) {
    selectedPlanet = planet;
    GameEngine.visitPlanet(planet.id);

    const page = document.getElementById('page-planet');
    if (!page) return;

    page.style.background = planet.environment.bg;

    const content = document.getElementById('planet-content');
    if (!content) return;

    const player = GameEngine.getPlayer();
    const collectedKey = 'collected_' + planet.id;
    const collected = JSON.parse(localStorage.getItem(collectedKey) || '[]');

    content.innerHTML = `
      <div class="planet-world-header">
        <button class="btn btn-secondary" onclick="App.goBack('solar')">← Solar System</button>
        <h1 class="neon-text planet-world-title" style="color:${planet.glowColor}">${planet.emoji || '🌍'} ${planet.name}</h1>
      </div>
      <div class="planet-world-grid">
        <div class="planet-world-left">
          <div class="glass-panel mission-panel">
            <h3>🎯 Planet Missions</h3>
            ${planet.missions.map((m, i) => `
              <div class="planet-mission">
                <span class="planet-mission-icon">${['🔭','🧪','📡'][i]}</span>
                <span>${m}</span>
                <button class="btn-small btn-primary" onclick="App.completePlanetMission(this, '${planet.id}', ${i})">Complete</button>
              </div>
            `).join('')}
          </div>
          <div class="glass-panel alien-panel">
            <h3>👽 Alien Encounter</h3>
            <div id="alien-encounter-area">
              <p>Strange readings detected nearby...</p>
              <button class="btn btn-secondary" onclick="App.triggerAlienEncounter('${planet.id}')">🔭 Investigate</button>
            </div>
          </div>
        </div>
        <div class="planet-world-center">
          <div class="planet-surface" style="background:${planet.environment.ground}22;border:2px solid ${planet.glowColor}44;border-radius:16px;padding:20px;text-align:center;min-height:200px;">
            <div class="planet-big-preview" style="width:120px;height:120px;background:${planet.color};border-radius:50%;margin:0 auto 20px;box-shadow:0 0 40px ${planet.glowColor}, 0 0 80px ${planet.glowColor}44;display:flex;align-items:center;justify-content:center;font-size:3rem;">${planet.emoji || '🌍'}</div>
            <p class="planet-world-desc">${planet.description}</p>
            <div class="fun-facts-ticker" id="planet-facts-ticker">${planet.funFacts[0]}</div>
          </div>
        </div>
        <div class="planet-world-right">
          <div class="glass-panel artifacts-panel">
            <h3>💎 Artifacts</h3>
            <div class="artifacts-grid">
              ${planet.artifacts.map((art, i) => `
                <div class="artifact-slot ${collected.includes(i) ? 'collected' : ''}" data-idx="${i}" onclick="App.collectArtifact('${planet.id}', ${i}, this)">
                  <div class="artifact-icon">${collected.includes(i) ? '✅' : '📦'}</div>
                  <div class="artifact-name">${art}</div>
                  ${collected.includes(i) ? '' : '<div class="artifact-reward">+10 🎫</div>'}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="glass-panel facts-panel">
            <h3>🔭 Fun Facts</h3>
            ${planet.funFacts.map(f => `<p class="fun-fact">• ${f}</p>`).join('')}
          </div>
        </div>
      </div>
    `;

    // Cycle facts
    let factIdx = 0;
    setInterval(() => {
      const ftEl = document.getElementById('planet-facts-ticker');
      if (ftEl) {
        ftEl.style.opacity = '0';
        setTimeout(() => {
          factIdx = (factIdx + 1) % planet.funFacts.length;
          ftEl.textContent = planet.funFacts[factIdx];
          ftEl.style.opacity = '1';
        }, 500);
      }
    }, 4000);

    UI.showPage('planet');
    SolarSystem.closePlanetPanel();
  }

  function collectArtifact(planetId, idx, el) {
    if (el.classList.contains('collected')) return;
    el.classList.add('collected');
    el.querySelector('.artifact-icon').textContent = '✅';
    const rewardEl = el.querySelector('.artifact-reward');
    if (rewardEl) rewardEl.remove();
    GameEngine.addTickets(10);
    GameEngine.addXP(20);
    UI.showEarnedPopup('tickets', 10);

    const collectedKey = 'collected_' + planetId;
    const collected = JSON.parse(localStorage.getItem(collectedKey) || '[]');
    if (!collected.includes(idx)) {
      collected.push(idx);
      localStorage.setItem(collectedKey, JSON.stringify(collected));
    }
  }

  function completePlanetMission(btn, planetId, idx) {
    btn.disabled = true;
    btn.textContent = '✅ Done!';
    btn.style.background = '#00ff8833';
    GameEngine.addXP(40);
    GameEngine.addTickets(15);
    UI.showAlert(`Mission complete! +40 XP, +15 🎫`, 'success');
  }

  function triggerAlienEncounter(planetId) {
    const area = document.getElementById('alien-encounter-area');
    if (!area) return;
    const dialogues = [
      { alien: '👽', name: 'Zyx-7', msg: '"Greetings, space traveler! I have rare crystals to trade."', reward: 30 },
      { alien: '🤖', name: 'UNIT-Ω', msg: '"SCANNING... Human detected. Initiating friendship protocol."', reward: 25 },
      { alien: '🐙', name: 'Quorr', msg: '"Eight tentacles, eight greetings! You smell like adventure!"', reward: 20 },
      { alien: '👾', name: 'Blip', msg: '"Bleep bloop! You have come far. Here — a gift from our world!"', reward: 35 },
    ];
    const d = dialogues[Math.floor(Math.random() * dialogues.length)];
    area.innerHTML = `
      <div class="alien-encounter">
        <div class="alien-avatar">${d.alien}</div>
        <div class="alien-name">${d.name}</div>
        <div class="alien-dialogue">${d.msg}</div>
        <button class="btn btn-primary" onclick="App.acceptAlienTrade(${d.reward}, this)">Accept Trade +${d.reward} 🎫</button>
      </div>
    `;
    GameEngine.checkAchievement('alien_friend');
  }

  function acceptAlienTrade(reward, btn) {
    btn.disabled = true;
    btn.textContent = '✅ Traded!';
    GameEngine.addTickets(reward);
    GameEngine.addXP(30);
    UI.showAlert(`Alien trade complete! +${reward} tickets earned! 👽`, 'success');
  }

  function goBack(page) { navigateTo(page); }

  // ── Arcade ─────────────────────────────────────────────────────────────────
  function setupArcade() {
    document.querySelectorAll('.arcade-play-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const gameId = this.dataset.game;
        launchGame(gameId);
      });
    });
  }

  function refreshArcade() {
    const scores = GameEngine.getState().highScores;
    document.querySelectorAll('.arcade-machine[data-game]').forEach(card => {
      const id = card.dataset.game;
      const scoreEl = card.querySelector('.arcade-high-score');
      if (scoreEl) scoreEl.textContent = 'Best: ' + (scores[id] || 0);
    });
  }

  function launchGame(gameId) {
    const pageEl = document.getElementById('page-gameplay');
    if (!pageEl) return;
    const titleEl = document.getElementById('game-title');
    if (titleEl) titleEl.textContent = Games.getGameName(gameId);
    UI.showPage('gameplay');
    const area = document.getElementById('game-area');
    if (area) {
      area.innerHTML = '';
      Games.play(gameId, area);
    }
    GameEngine.recordGamePlayed();
  }

  const exitGameBtn = document.getElementById ? document.getElementById('exit-game-btn') : null;
  document.addEventListener('DOMContentLoaded', () => {
    const exitBtn = document.getElementById('exit-game-btn');
    if (exitBtn) exitBtn.addEventListener('click', () => { Games.stop(); navigateTo('arcade'); });
  });

  // ── Avatar ─────────────────────────────────────────────────────────────────
  function setupAvatar() {
    document.querySelectorAll('.avatar-tab').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.avatar-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        showAvatarCategory(this.dataset.cat);
      });
    });
    const saveBtn = document.getElementById('save-avatar-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveAvatar);
  }

  function refreshAvatar() {
    showAvatarCategory('base');
    updateAvatarDisplay();
  }

  const AVATAR_ITEMS = {
    base: [
      { id: 'base_astronaut', icon: '👨‍🚀', name: 'Astronaut', cost: 0 },
      { id: 'base_girl', icon: '👩‍🚀', name: 'Star Pilot', cost: 0 },
      { id: 'base_robot', icon: '🤖', name: 'Space Bot', cost: 50 },
      { id: 'base_alien', icon: '👽', name: 'Alien Explorer', cost: 100 },
    ],
    helmet: [
      { id: 'helm_none', icon: '—', name: 'None', cost: 0 },
      { id: 'helm_astro', icon: '🪖', name: 'Astro Helmet', cost: 80 },
      { id: 'helm_crown', icon: '👑', name: 'Crown', cost: 150 },
      { id: 'helm_star', icon: '⭐', name: 'Star Cap', cost: 120 },
    ],
    suit: [
      { id: 'suit_default', icon: '🥼', name: 'Standard Suit', cost: 0 },
      { id: 'suit_gold', icon: '🌟', name: 'Gold Suit', cost: 150 },
      { id: 'suit_neon', icon: '💜', name: 'Neon Suit', cost: 200 },
      { id: 'suit_rainbow', icon: '🌈', name: 'Rainbow Suit', cost: 300 },
    ],
    accessory: [
      { id: 'acc_none', icon: '—', name: 'None', cost: 0 },
      { id: 'acc_wings', icon: '🦋', name: 'Cosmic Wings', cost: 250 },
      { id: 'acc_shield', icon: '🛡️', name: 'Force Shield', cost: 180 },
      { id: 'acc_jetpack', icon: '🎒', name: 'Jetpack', cost: 200 },
    ],
    effect: [
      { id: 'fx_none', icon: '—', name: 'None', cost: 0 },
      { id: 'fx_stars', icon: '✨', name: 'Star Trail', cost: 300 },
      { id: 'fx_fire', icon: '🔥', name: 'Fire Aura', cost: 350 },
      { id: 'fx_glow', icon: '💫', name: 'Cosmic Glow', cost: 400 },
    ]
  };

  function showAvatarCategory(cat) {
    const grid = document.getElementById('avatar-items-grid');
    if (!grid) return;
    const items = AVATAR_ITEMS[cat] || [];
    const player = GameEngine.getPlayer();
    const inventory = GameEngine.getInventory().map(i => i.id);
    const equipped = player.avatar || {};

    grid.innerHTML = items.map(item => {
      const owned = item.cost === 0 || inventory.includes(item.id);
      const isEquipped = equipped[cat] === item.id || (item.id.includes('none') && !equipped[cat]);
      return `
        <div class="avatar-item ${isEquipped ? 'equipped' : ''} ${!owned ? 'locked' : ''}" onclick="App.equipAvatarItem('${cat}','${item.id}','${item.icon}',${item.cost})">
          <div class="avatar-item-icon">${item.icon}</div>
          <div class="avatar-item-name">${item.name}</div>
          ${!owned ? `<div class="avatar-item-cost">${item.cost} 🎫</div>` : ''}
          ${isEquipped ? '<div class="equipped-badge">✓ ON</div>' : ''}
        </div>
      `;
    }).join('');
  }

  function equipAvatarItem(cat, id, icon, cost) {
    const player = GameEngine.getPlayer();
    const inventory = GameEngine.getInventory().map(i => i.id);
    const owned = cost === 0 || inventory.includes(id);
    if (!owned) {
      if (!GameEngine.spendTickets(cost)) {
        UI.showAlert(`Not enough tickets! You need ${cost} 🎫`, 'error');
        return;
      }
      GameEngine.addToInventory({ id, type: 'avatar', name: cat });
      UI.showAlert(`Unlocked ${icon}! `, 'success');
    }
    if (!player.avatar) player.avatar = {};
    player.avatar[cat] = id;
    GameEngine.save();
    updateAvatarDisplay();
    showAvatarCategory(cat);
    GameEngine.checkAchievement('avatar_master');
  }

  function updateAvatarDisplay() {
    const preview = document.getElementById('avatar-preview');
    if (!preview) return;
    const player = GameEngine.getPlayer();
    const av = player.avatar || {};
    const baseMap = { base_astronaut: '👨‍🚀', base_girl: '👩‍🚀', base_robot: '🤖', base_alien: '👽' };
    const base = baseMap[av.base] || '👨‍🚀';
    const effects = { fx_stars: '✨', fx_fire: '🔥', fx_glow: '💫' };
    const fx = effects[av.effect] || '';
    preview.innerHTML = `<div class="avatar-big">${base}</div><div class="avatar-fx">${fx}</div>`;
  }

  function saveAvatar() {
    GameEngine.save();
    UI.showAlert('Avatar saved! Looking cosmic! 🌟', 'success');
    UI.createConfetti();
  }

  // ── Prizes ─────────────────────────────────────────────────────────────────
  function setupPrizes() {
    const spinBtn = document.getElementById('spin-wheel-btn');
    if (spinBtn) spinBtn.addEventListener('click', handleSpin);
  }

  function refreshPrizes() {
    const spinBtn = document.getElementById('spin-wheel-btn');
    const spinStatus = document.getElementById('spin-status');
    if (GameEngine.canSpinToday()) {
      if (spinBtn) { spinBtn.disabled = false; spinBtn.textContent = '🎡 SPIN NOW!'; }
      if (spinStatus) spinStatus.textContent = 'Daily spin available!';
    } else {
      if (spinBtn) { spinBtn.disabled = true; spinBtn.textContent = '⏳ Come back tomorrow'; }
      if (spinStatus) spinStatus.textContent = 'Already spun today. Reset at midnight!';
    }
    renderPrizeShop();
    renderWheelSegments();
  }

  function renderWheelSegments() {
    const wheel = document.getElementById('prize-wheel-canvas');
    if (!wheel || !wheel.getContext) return;
    const ctx = wheel.getContext('2d');
    const segs = GameEngine.getWheelSegments();
    const cx = wheel.width / 2, cy = wheel.height / 2, r = cx - 10;
    const total = segs.reduce((s, g) => s + g.probability, 0);
    let startAngle = -Math.PI / 2;
    segs.forEach(seg => {
      const angle = (seg.probability / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + angle);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#020510';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + angle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#020510';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(seg.label, r - 8, 4);
      ctx.restore();
      startAngle += angle;
    });
    // Center hub
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#020510';
    ctx.fill();
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#00f5ff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy);
  }

  function handleSpin() {
    if (!GameEngine.canSpinToday()) return;
    const wheel = document.getElementById('prize-wheel-canvas');
    if (!wheel) return;
    const result = GameEngine.spinPrizeWheel();
    if (!result) return;

    // Find segment index for animation
    const segs = GameEngine.getWheelSegments();
    const total = segs.reduce((s, g) => s + g.probability, 0);
    let targetAngle = 0, accum = 0;
    for (const seg of segs) {
      const segAngle = (seg.probability / total) * 360;
      accum += segAngle;
      if (seg === result) { targetAngle = accum - segAngle / 2; break; }
    }

    const spinDeg = 1800 + (360 - targetAngle);
    wheel.style.transition = 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)';
    wheel.style.transform = `rotate(${spinDeg}deg)`;

    setTimeout(() => {
      wheel.style.transition = '';
      showSpinResult(result);
      refreshPrizes();
      if (result.type === 'jackpot' || result.value >= 500) UI.createConfetti();
    }, 4200);
  }

  function showSpinResult(result) {
    const el = document.getElementById('spin-result-display');
    if (!el) return;
    el.innerHTML = `
      <div class="spin-result">
        <div class="spin-result-icon">${result.type === 'jackpot' ? '🎉' : result.type === 'rare_item' ? '💎' : '⭐'}</div>
        <div class="spin-result-label">YOU WON: ${result.label}!</div>
      </div>
    `;
    el.classList.remove('hidden');
    el.style.animation = 'popIn 0.5s ease';
    setTimeout(() => el.classList.add('hidden'), 5000);
  }

  function renderPrizeShop() {
    const grid = document.getElementById('prize-shop-grid');
    if (!grid) return;
    const items = GameEngine.getShopItems();
    const inv = GameEngine.getInventory().map(i => i.id);
    grid.innerHTML = items.map(item => `
      <div class="shop-item ${inv.includes(item.id) ? 'owned' : ''}">
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-rarity rarity-${item.rarity}">${item.rarity}</div>
        ${inv.includes(item.id)
          ? '<div class="shop-owned-badge">✅ Owned</div>'
          : `<button class="btn btn-primary btn-small" onclick="App.purchaseItem('${item.id}','${item.name}',${item.cost})">${item.cost} 🎫</button>`
        }
      </div>
    `).join('');
  }

  function purchaseItem(id, name, cost) {
    if (GameEngine.buyItem(id)) {
      UI.showAlert(`Purchased ${name}! ✨`, 'success');
      UI.createConfetti();
      renderPrizeShop();
    } else {
      UI.showAlert(`Not enough tickets! Need ${cost} 🎫`, 'error');
    }
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  function refreshAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    const achs = GameEngine.getAchievements();
    const unlocked = achs.filter(a => a.unlocked).length;
    const totalEl = document.getElementById('ach-total');
    if (totalEl) totalEl.textContent = `${unlocked} / ${achs.length} Unlocked`;

    grid.innerHTML = achs.map(a => `
      <div class="achievement-badge ${a.unlocked ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${a.unlocked ? a.icon : '🔒'}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.unlocked ? a.desc : '???'}</div>
        ${a.unlocked ? `<div class="ach-rewards">+${a.xpReward}XP${a.ticketReward ? ' +' + a.ticketReward + '🎫' : ''}</div>` : ''}
      </div>
    `).join('');
  }

  // ── Daily Missions ─────────────────────────────────────────────────────────
  function refreshMissions() {
    const list = document.getElementById('missions-list');
    if (!list) return;
    const missions = GameEngine.getMissions();
    const player = GameEngine.getPlayer();

    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = player.streak || 1;

    list.innerHTML = missions.map(m => `
      <div class="mission-card ${m.completed ? 'mission-complete' : ''}">
        <div class="mission-info">
          <div class="mission-desc">${m.desc}</div>
          <div class="mission-rewards">+${m.xpReward} XP  +${m.ticketReward} 🎫</div>
          <div class="mission-progress-bar">
            <div class="mission-progress-fill" style="width:${Math.min(100, (m.progress / m.target) * 100)}%"></div>
          </div>
          <div class="mission-progress-text">${m.progress} / ${m.target}</div>
        </div>
        ${m.completed && !m.claimed
          ? `<button class="btn btn-primary" onclick="App.claimMission('${m.id}')">🎁 CLAIM</button>`
          : m.claimed ? '<span class="claimed-badge">✅ Claimed</span>' : ''}
      </div>
    `).join('');
  }

  function claimMission(id) {
    if (GameEngine.claimMissionReward(id)) {
      UI.showAlert('Reward claimed! 🎉', 'success');
      UI.createConfetti();
      refreshMissions();
    }
  }

  // ── Secret Zone ─────────────────────────────────────────────────────────────
  function setupSecretZone() {
    const codeInput = document.getElementById('secret-code-input');
    const codeBtn = document.getElementById('secret-code-btn');
    if (codeBtn) codeBtn.addEventListener('click', () => submitSecretCode(codeInput ? codeInput.value : ''));
    if (codeInput) codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitSecretCode(codeInput.value); });

    document.querySelectorAll('.easter-egg-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const secret = this.dataset.secret;
        triggerEasterEgg(secret);
      });
    });
  }

  const SECRET_CODES = {
    'NEBULA': { reward: 'tickets', value: 200, msg: '🌌 NEBULA CODE ACCEPTED! +200 Tickets!', achievement: 'secret_vault' },
    'ARCADE42': { reward: 'xp', value: 500, msg: '🎮 ARCADE42 CODE ACCEPTED! +500 XP!', achievement: 'secret_vault' },
    'COSMIC99': { reward: 'both', ticketVal: 150, xpVal: 300, msg: '🚀 COSMIC99 ACCEPTED! +150 Tickets +300 XP!', achievement: 'secret_vault' },
    'STARBLAST': { reward: 'tickets', value: 100, msg: '⭐ STARBLAST ACCEPTED! +100 Tickets!', achievement: 'secret_finder' },
  };

  function submitSecretCode(code) {
    const trimmed = code.trim().toUpperCase();
    const usedKey = 'usedCode_' + trimmed;
    if (localStorage.getItem(usedKey)) {
      UI.showAlert('Code already used!', 'error');
      return;
    }
    const data = SECRET_CODES[trimmed];
    if (!data) { UI.showAlert('❌ Invalid code. Keep exploring!', 'error'); return; }
    localStorage.setItem(usedKey, '1');
    if (data.reward === 'tickets') GameEngine.addTickets(data.value);
    else if (data.reward === 'xp') GameEngine.addXP(data.value);
    else { GameEngine.addTickets(data.ticketVal); GameEngine.addXP(data.xpVal); }
    GameEngine.findSecret(trimmed);
    GameEngine.checkAchievement(data.achievement);
    UI.showAlert(data.msg, 'success');
    UI.createConfetti();
    const input = document.getElementById('secret-code-input');
    if (input) input.value = '';
  }

  function triggerEasterEgg(type) {
    if (type === 'vault') {
      const vault = document.getElementById('vault-door');
      if (vault) { vault.classList.toggle('open'); }
      GameEngine.findSecret('vault_easter');
      GameEngine.checkAchievement('secret_room');
      UI.showAlert('🔐 The vault opens... something glitters inside!', 'epic');
      GameEngine.addTickets(50);
    } else if (type === 'alien_message') {
      UI.showAlert('👽 "WE HAVE BEEN WATCHING YOU. YOU ARE WORTHY." — The Void Collective', 'epic');
      GameEngine.addXP(100);
    } else if (type === 'nebula_pulse') {
      document.body.style.animation = 'nebulaPulse 2s ease';
      setTimeout(() => document.body.style.animation = '', 2000);
      GameEngine.addTickets(25);
      UI.showAlert('💫 Nebula pulse detected! Energy absorbed!', 'success');
    }
  }

  // ── Easter Eggs ────────────────────────────────────────────────────────────
  function setupEasterEggs() {
    // Logo click 7 times
    const logo = document.getElementById('nav-logo');
    if (logo) {
      logo.addEventListener('click', () => {
        logoClickCount++;
        if (logoClickCount >= 7) {
          logoClickCount = 0;
          UI.showAlert('🌌 YOU FOUND THE LOGO SECRET! The universe thanks you. +100 Tickets!', 'epic');
          GameEngine.addTickets(100);
          GameEngine.findSecret('logo_secret');
          UI.createConfetti();
        }
      });
    }

    // Konami code
    const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let ki = 0;
    document.addEventListener('keydown', e => {
      if (e.key === KONAMI[ki]) {
        ki++;
        if (ki === KONAMI.length) {
          ki = 0;
          GameEngine.addTickets(500);
          UI.showAlert('🎮 KONAMI CODE ACTIVATED! +500 BONUS TICKETS! 🎉', 'epic');
          GameEngine.findSecret('konami');
          UI.createConfetti();
        }
      } else { ki = 0; }
    });
  }

  // ── Idle Alien ─────────────────────────────────────────────────────────────
  function setupIdleAlien() {
    let lastActivity = Date.now();
    ['mousemove','keydown','click','touchstart'].forEach(e => {
      document.addEventListener(e, () => {
        lastActivity = Date.now();
        hideAlien();
      });
    });
    setInterval(() => {
      if (!alienVisible && Date.now() - lastActivity > 60000) showAlien();
    }, 5000);
  }

  function showAlien() {
    alienVisible = true;
    let alien = document.getElementById('idle-alien');
    if (!alien) {
      alien = document.createElement('div');
      alien.id = 'idle-alien';
      alien.className = 'idle-alien';
      alien.innerHTML = `<div class="alien-wave">👽</div><div class="alien-speech">Psst! Still there? I found something... <button onclick="App.alienGift()">Claim Gift!</button></div>`;
      document.body.appendChild(alien);
    }
    alien.classList.add('visible');
  }

  function hideAlien() {
    const alien = document.getElementById('idle-alien');
    if (alien) { alien.classList.remove('visible'); alienVisible = false; }
  }

  function alienGift() {
    GameEngine.addTickets(30);
    GameEngine.addXP(50);
    UI.showAlert('👽 The alien left you 30 tickets and 50 XP! How generous!', 'success');
    hideAlien();
    GameEngine.checkAchievement('alien_friend');
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init, navigateTo, goBack,
    explorePlanet, collectArtifact, completePlanetMission, triggerAlienEncounter, acceptAlienTrade,
    equipAvatarItem, saveAvatar,
    purchaseItem, handleSpin,
    claimMission,
    submitSecretCode, triggerEasterEgg, alienGift,
    refreshAchievements, refreshMissions
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
