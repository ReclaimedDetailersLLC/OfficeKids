/**
 * ui.js - UI Management Layer for Cosmic Arcade Control
 * Handles all DOM interactions, animations, sounds, and visual feedback.
 * Exported as window.UI
 */

(() => {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────────

  let currentPage = null;
  let soundEnabled = true;
  let audioCtx = null;
  let wheelRotation = 0;
  let wheelSpinning = false;
  let achievementQueue = [];
  let achievementShowing = false;
  let konamiIndex = 0;
  let countdownInterval = null;
  let blinkIntervals = [];
  let radarBlipInterval = null;

  const KONAMI = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
    'b','a'
  ];

  const WHEEL_SEGMENTS = [
    { label: '50 Tickets',   color: '#f7c948', textColor: '#1a1a2e' },
    { label: '10 XP',        color: '#4ecdc4', textColor: '#1a1a2e' },
    { label: '100 Tickets',  color: '#ff6b6b', textColor: '#fff'    },
    { label: 'Spin Again',   color: '#a855f7', textColor: '#fff'    },
    { label: '25 Tickets',   color: '#3b82f6', textColor: '#fff'    },
    { label: '5 XP',         color: '#22c55e', textColor: '#fff'    },
    { label: '200 Tickets',  color: '#f97316', textColor: '#fff'    },
    { label: 'Mystery Box',  color: '#ec4899', textColor: '#fff'    },
  ];

  const PLANETS = {
    mercury: { name: 'Mercury', icon: '⚫', desc: 'Closest to the Sun. Surface temps swing from -180°C to 430°C.', diameter: '4,879 km', distance: '57.9M km from Sun', moons: 0 },
    venus:   { name: 'Venus',   icon: '🟡', desc: 'Hottest planet. Thick CO₂ atmosphere creates a runaway greenhouse effect.', diameter: '12,104 km', distance: '108.2M km from Sun', moons: 0 },
    earth:   { name: 'Earth',   icon: '🌍', desc: 'Our home. Only known planet with life.', diameter: '12,742 km', distance: '149.6M km from Sun', moons: 1 },
    mars:    { name: 'Mars',    icon: '🔴', desc: 'The Red Planet. Home to Olympus Mons, the tallest volcano in the solar system.', diameter: '6,779 km', distance: '227.9M km from Sun', moons: 2 },
    jupiter: { name: 'Jupiter', icon: '🟠', desc: 'Largest planet. Great Red Spot storm has raged for 350+ years.', diameter: '139,820 km', distance: '778.5M km from Sun', moons: 95 },
    saturn:  { name: 'Saturn',  icon: '🪐', desc: 'Famous for its spectacular ring system made of ice and rock.', diameter: '116,460 km', distance: '1.43B km from Sun', moons: 146 },
    uranus:  { name: 'Uranus',  icon: '🔵', desc: 'Rotates on its side. Has 13 known rings.', diameter: '50,724 km', distance: '2.87B km from Sun', moons: 28 },
    neptune: { name: 'Neptune', icon: '💙', desc: 'Windiest planet with gusts up to 2,100 km/h.', diameter: '49,244 km', distance: '4.5B km from Sun', moons: 16 },
  };

  const NEWS_ITEMS = [
    '🚀 New asteroid belt discovered beyond Neptune sparks mining interest',
    '🌟 Cosmic Arcade breaks record with 1 million daily players',
    '👾 Ultra-rare Nebula Badge now available in the prize shop',
    '🛸 Annual Galaxy Cup tournament registration now open — sign up today',
    '🌌 Scientists confirm water ice detected on Moon\'s south pole',
    '🎮 Three new arcade cabinets arriving next week: Pulsar Pong, Void Racer & Meteor Mayhem',
    '🏆 Top player "StarPilot_99" wins the Galactic Grand Prix for the third year running',
    '☄️ Comet Halcyon makes its once-in-75-year flyby — visible this weekend',
  ];

  const SECRET_CODES = {
    COSMIC:   { bonus: 50,  msg: '🌌 Secret code COSMIC unlocked! +50 Tickets!' },
    NEBULA:   { bonus: 100, msg: '💫 Secret code NEBULA unlocked! +100 Tickets!' },
    STARDUST: { bonus: 75,  msg: '✨ Secret code STARDUST unlocked! +75 Tickets!' },
  };

  const CONFETTI_COLORS = ['#f7c948','#ff6b6b','#4ecdc4','#a855f7','#3b82f6','#22c55e'];

  // ─── Audio Context Bootstrap ──────────────────────────────────────────────────

  const getAudioCtx = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  };

  // ─── Sound System ─────────────────────────────────────────────────────────────

  const playTone = (frequency, startTime, duration, gainPeak = 0.3, type = 'sine', ctx = null) => {
    const ac = ctx || getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  };

  const playNoise = (startTime, duration, gainPeak = 0.15, ctx = null) => {
    const ac = ctx || getAudioCtx();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, startTime);
    filter.frequency.exponentialRampToValueAtTime(80, startTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(gainPeak, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    source.start(startTime);
    source.stop(startTime + duration + 0.05);
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const ac = getAudioCtx();
      const now = ac.currentTime;
      switch (type) {
        case 'click':
          playTone(220, now, 0.1, 0.2, 'square', ac);
          break;
        case 'earn':
          playTone(440, now, 0.12, 0.25, 'sine', ac);
          playTone(660, now + 0.13, 0.2, 0.25, 'sine', ac);
          break;
        case 'achievement':
          playTone(523, now, 0.15, 0.3, 'sine', ac);
          playTone(659, now + 0.16, 0.15, 0.3, 'sine', ac);
          playTone(784, now + 0.32, 0.3, 0.3, 'sine', ac);
          break;
        case 'rankup':
          playTone(392, now,       0.12, 0.3, 'sine', ac);
          playTone(523, now + 0.13, 0.12, 0.3, 'sine', ac);
          playTone(659, now + 0.26, 0.12, 0.3, 'sine', ac);
          playTone(784, now + 0.39, 0.35, 0.4, 'sine', ac);
          playTone(1047,now + 0.75, 0.5,  0.4, 'sine', ac);
          break;
        case 'error':
          playTone(110, now, 0.15, 0.3, 'sawtooth', ac);
          playTone(90,  now + 0.16, 0.2, 0.3, 'sawtooth', ac);
          break;
        case 'spin':
          for (let i = 0; i < 12; i++) {
            playTone(200 + i * 30, now + i * 0.08, 0.1, 0.15, 'triangle', ac);
          }
          break;
        case 'win':
          [523,659,784,1047,784,1047,1319].forEach((freq, i) => {
            playTone(freq, now + i * 0.1, 0.18, 0.3, 'sine', ac);
          });
          break;
        case 'launch':
          playNoise(now, 1.2, 0.2, ac);
          playTone(80, now, 0.5, 0.3, 'sawtooth', ac);
          playTone(60, now + 0.5, 0.7, 0.3, 'sawtooth', ac);
          break;
        default:
          playTone(330, now, 0.1, 0.2, 'sine', ac);
      }
    } catch (e) {
      console.warn('[UI] Sound playback error:', e);
    }
  };

  const toggleSound = () => {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound');
    if (btn) {
      btn.textContent = soundEnabled ? '🔊' : '🔇';
      btn.setAttribute('aria-label', soundEnabled ? 'Sound On' : 'Sound Off');
    }
    if (soundEnabled) playSound('click');
  };

  // ─── Loading Screen ───────────────────────────────────────────────────────────

  const showLoading = () => {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    el.style.display = 'flex';
    el.style.opacity = '0';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease';
      el.style.opacity = '1';
    });
  };

  const hideLoading = () => {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    el.style.transition = 'opacity 0.4s ease';
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; }, 420);
  };

  const setLoadingProgress = (percent) => {
    const bar = document.getElementById('loading-bar') || document.querySelector('#loading-screen .progress-bar');
    if (bar) {
      bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    const label = document.getElementById('loading-percent');
    if (label) label.textContent = `${Math.round(percent)}%`;
  };

  // ─── Page Navigation ──────────────────────────────────────────────────────────

  const PAGE_INIT = {
    'page-arcade':    () => { /* game cards already rendered */ },
    'page-wheel':     () => { initWheel(); },
    'page-avatar':    () => { initAvatarPage(); },
    'page-shop':      () => { renderPrizeShop(); },
    'page-missions':  () => { refreshMissionsDisplay(); startResetCountdown(); },
    'page-leaderboard': () => { updateLeaderboard(); },
    'page-home':      () => { updateLeaderboard(); refreshMissionsDisplay(); },
  };

  const showPage = (pageId) => {
    if (currentPage === pageId) return;
    document.querySelectorAll('.page').forEach(p => {
      p.style.display = 'none';
      p.setAttribute('aria-hidden', 'true');
    });
    const target = document.getElementById(pageId);
    if (target) {
      target.style.display = 'block';
      target.setAttribute('aria-hidden', 'false');
      target.scrollTop = 0;
    }
    document.querySelectorAll('.nav-link').forEach(link => {
      const active = link.dataset.page === pageId;
      link.classList.toggle('active', active);
      link.setAttribute('aria-current', active ? 'page' : 'false');
    });
    currentPage = pageId;
    if (PAGE_INIT[pageId]) PAGE_INIT[pageId]();
    updateHUD();
    playSound('click');
  };

  // ─── HUD Updates ──────────────────────────────────────────────────────────────

  const updateHUD = () => {
    const gs = window.GameState;
    if (!gs) return;

    const ticketEl = document.getElementById('hud-tickets');
    if (ticketEl) ticketEl.textContent = (gs.tickets ?? 0).toLocaleString();

    const xpBar = document.getElementById('hud-xp-bar');
    if (xpBar) {
      const pct = gs.maxXp > 0 ? Math.min(100, ((gs.xp ?? 0) / gs.maxXp) * 100) : 0;
      xpBar.style.width = `${pct}%`;
      xpBar.setAttribute('aria-valuenow', Math.round(pct));
    }

    const rankEl = document.getElementById('hud-rank');
    if (rankEl) rankEl.textContent = gs.rank ?? 'Cadet';

    const xpEl = document.getElementById('hud-xp');
    if (xpEl) xpEl.textContent = `${gs.xp ?? 0} / ${gs.maxXp ?? 100} XP`;
  };

  // ─── Achievement Notification ─────────────────────────────────────────────────

  const processAchievementQueue = () => {
    if (achievementShowing || achievementQueue.length === 0) return;
    achievementShowing = true;
    const achievement = achievementQueue.shift();
    const notif = document.getElementById('achievement-notif');
    if (!notif) { achievementShowing = false; return; }

    const iconEl = notif.querySelector('.achievement-icon') || (() => {
      const s = document.createElement('span');
      s.className = 'achievement-icon';
      notif.prepend(s);
      return s;
    })();
    const nameEl = notif.querySelector('.achievement-name') || (() => {
      const s = document.createElement('span');
      s.className = 'achievement-name';
      notif.appendChild(s);
      return s;
    })();

    iconEl.textContent = achievement.icon ?? '🏆';
    nameEl.textContent = achievement.name ?? 'Achievement Unlocked!';

    notif.style.transition = 'none';
    notif.style.transform = 'translateX(120%)';
    notif.style.opacity = '0';
    notif.style.display = 'flex';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notif.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease';
        notif.style.transform = 'translateX(0)';
        notif.style.opacity = '1';
      });
    });

    playSound('achievement');

    setTimeout(() => {
      notif.style.transition = 'transform 0.35s ease-in, opacity 0.3s ease';
      notif.style.transform = 'translateX(120%)';
      notif.style.opacity = '0';
      setTimeout(() => {
        notif.style.display = 'none';
        achievementShowing = false;
        processAchievementQueue();
      }, 380);
    }, 3000);
  };

  const showAchievementNotif = (achievement) => {
    achievementQueue.push(achievement);
    processAchievementQueue();
  };

  // ─── XP/Ticket Earned Popup ───────────────────────────────────────────────────

  const showEarnedPopup = (type, amount, x, y) => {
    const popup = document.createElement('div');
    popup.className = 'earned-popup';
    popup.textContent = type === 'xp' ? `+${amount} XP` : `+${amount} 🎟️`;
    Object.assign(popup.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)',
      color: type === 'xp' ? '#4ecdc4' : '#f7c948',
      fontWeight: '700',
      fontSize: '1.4rem',
      textShadow: '0 0 8px currentColor',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '1',
      transition: 'transform 1.5s ease-out, opacity 1.5s ease-out',
      willChange: 'transform, opacity',
    });
    document.body.appendChild(popup);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        popup.style.transform = `translate(-50%, calc(-50% - 80px))`;
        popup.style.opacity = '0';
      });
    });
    setTimeout(() => popup.remove(), 1600);
  };

  // ─── Alert System ─────────────────────────────────────────────────────────────

  let alertTimeout = null;

  const showAlert = (msg, type = 'info') => {
    const panel = document.getElementById('alert-panel');
    if (!panel) return;
    const colorMap = { info: '#3b82f6', warning: '#f7c948', error: '#ef4444', success: '#22c55e' };
    panel.textContent = msg;
    panel.style.background = colorMap[type] ?? colorMap.info;
    panel.style.display = 'block';
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(-20px)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      });
    });
    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-20px)';
      setTimeout(() => { panel.style.display = 'none'; }, 320);
    }, 4000);
  };

  // ─── Modal Helpers ────────────────────────────────────────────────────────────

  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.style.transition = 'opacity 0.25s ease';
        modal.style.opacity = '1';
      });
    });
    modal.setAttribute('aria-hidden', 'false');
    playSound('click');
  };

  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.transition = 'opacity 0.2s ease';
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }, 220);
  };

  // ─── Prize Wheel ──────────────────────────────────────────────────────────────

  const initWheel = () => {
    const wheel = document.getElementById('prize-wheel');
    if (!wheel) return;
    if (wheel.dataset.initialized) return;
    wheel.dataset.initialized = 'true';

    const segCount = WHEEL_SEGMENTS.length;
    const segAngle = 360 / segCount;
    const gradParts = WHEEL_SEGMENTS.map((seg, i) => {
      const start = i * segAngle;
      const end = start + segAngle;
      return `${seg.color} ${start}deg ${end}deg`;
    }).join(', ');
    wheel.style.background = `conic-gradient(${gradParts})`;
    wheel.style.borderRadius = '50%';
    wheel.style.position = 'relative';

    // Draw labels
    wheel.querySelectorAll('.wheel-label').forEach(l => l.remove());
    WHEEL_SEGMENTS.forEach((seg, i) => {
      const label = document.createElement('div');
      label.className = 'wheel-label';
      const angle = (i * segAngle) + segAngle / 2;
      const rad = (angle - 90) * (Math.PI / 180);
      const r = 38; // % from center
      const lx = 50 + r * Math.cos(rad);
      const ly = 50 + r * Math.sin(rad);
      Object.assign(label.style, {
        position: 'absolute',
        left: `${lx}%`,
        top: `${ly}%`,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        color: seg.textColor,
        fontSize: '0.65rem',
        fontWeight: '700',
        textAlign: 'center',
        pointerEvents: 'none',
        width: '60px',
        lineHeight: '1.2',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      });
      label.textContent = seg.label;
      wheel.appendChild(label);
    });
  };

  const spinWheel = (resultIndex, callback) => {
    if (wheelSpinning) return;
    const wheel = document.getElementById('prize-wheel');
    if (!wheel) return;
    wheelSpinning = true;

    const segAngle = 360 / WHEEL_SEGMENTS.length;
    // Pointer is at top (270deg in standard coords, so we aim for 270 - center of segment)
    const targetSegAngle = 270 - (resultIndex * segAngle) - (segAngle / 2);
    const extraSpins = 1440 + (Math.random() * 360); // 4+ full rotations + random
    const targetRotation = wheelRotation + extraSpins + ((targetSegAngle - wheelRotation % 360 + 360) % 360);

    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheel.style.transform = `rotate(${targetRotation}deg)`;
    wheelRotation = targetRotation % 360;

    playSound('spin');

    setTimeout(() => {
      wheelSpinning = false;
      if (typeof callback === 'function') callback(resultIndex);
    }, 4100);
  };

  // ─── Confetti ─────────────────────────────────────────────────────────────────

  const createConfetti = (count = 80) => {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size = 8 + Math.random() * 8;
      const startX = Math.random() * 100;
      const duration = 2 + Math.random() * 2;
      const drift = (Math.random() - 0.5) * 200;
      const delay = Math.random() * 0.8;
      Object.assign(p.style, {
        position: 'fixed',
        top: '-20px',
        left: `${startX}vw`,
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        pointerEvents: 'none',
        zIndex: '9998',
        opacity: '1',
        animation: `confettiFall ${duration}s ${delay}s ease-in forwards`,
        '--drift': `${drift}px`,
      });
      document.body.appendChild(p);
      setTimeout(() => p.remove(), (duration + delay + 0.1) * 1000);
    }
    ensureConfettiStyle();
  };

  const ensureConfettiStyle = () => {
    if (document.getElementById('confetti-style')) return;
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confettiFall {
        0%   { transform: translateY(0)    translateX(0)             rotate(0deg);   opacity: 1; }
        80%  { opacity: 1; }
        100% { transform: translateY(110vh) translateX(var(--drift)) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  };

  // ─── Star Particles ───────────────────────────────────────────────────────────

  const createStarParticles = (count = 30) => {
    ensureStarStyle();
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star-particle';
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = 1 + Math.random() * 2;
      const size = 4 + Math.random() * 8;
      Object.assign(star.style, {
        position: 'fixed',
        left: `${x}vw`,
        top: `${y}vh`,
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: 'none',
        zIndex: '9997',
        fontSize: `${size}px`,
        lineHeight: '1',
        animation: `starFly ${duration}s ease-out forwards`,
        '--vx': `${(Math.random() - 0.5) * 300}px`,
        '--vy': `${(Math.random() - 0.5) * 300}px`,
      });
      star.textContent = '⭐';
      document.body.appendChild(star);
      setTimeout(() => star.remove(), (duration + 0.1) * 1000);
    }
  };

  const ensureStarStyle = () => {
    if (document.getElementById('star-style')) return;
    const style = document.createElement('style');
    style.id = 'star-style';
    style.textContent = `
      @keyframes starFly {
        0%   { transform: translate(0,0)                            scale(1);   opacity: 1; }
        100% { transform: translate(var(--vx), var(--vy))           scale(0);   opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  };

  // ─── Rank Up Modal ────────────────────────────────────────────────────────────

  const RANK_ICONS = {
    'Cadet':       '🚀', 'Pilot':        '✈️',  'Navigator':   '🧭',
    'Commander':   '⭐', 'Captain':      '🌟',  'Major':       '💫',
    'Colonel':     '🌠', 'Admiral':      '🏅',  'Star Admiral':'🎖️',
    'Fleet Master':'👑',
  };

  const showRankUp = (newRank) => {
    const modal = document.getElementById('modal-rankup');
    if (!modal) return;
    const icon = RANK_ICONS[newRank] ?? '🌟';
    const iconEl = modal.querySelector('.rankup-icon');
    const nameEl = modal.querySelector('.rankup-name');
    if (iconEl) iconEl.textContent = icon;
    if (nameEl) nameEl.textContent = newRank;
    openModal('modal-rankup');
    createConfetti(120);
    playSound('rankup');
    createStarParticles(40);
  };

  // ─── Game Results Modal ───────────────────────────────────────────────────────

  const showGameResults = (game, score, tickets, xp) => {
    const modal = document.getElementById('modal-results');
    if (!modal) return;
    const gs = window.GameState;

    const setField = (sel, val) => {
      const el = modal.querySelector(sel);
      if (el) el.textContent = val;
    };

    setField('.result-game-name', game ?? 'Game');
    setField('.result-score',     score?.toLocaleString() ?? '0');
    setField('.result-tickets',   `+${tickets ?? 0} 🎟️`);
    setField('.result-xp',        `+${xp ?? 0} XP`);

    let isHighScore = false;
    if (gs && gs.highScores) {
      const prev = gs.highScores[game] ?? 0;
      if (score > prev) {
        gs.highScores[game] = score;
        isHighScore = true;
      }
    }

    const hsEl = modal.querySelector('.result-high-score');
    if (hsEl) {
      hsEl.textContent = isHighScore ? '🏆 NEW HIGH SCORE!' : `Best: ${(gs?.highScores?.[game] ?? score).toLocaleString()}`;
      hsEl.style.color = isHighScore ? '#f7c948' : '#aaa';
    }

    openModal('modal-results');
    if (isHighScore) {
      createConfetti(60);
      playSound('win');
    } else {
      playSound('earn');
    }
  };

  // ─── News Ticker ──────────────────────────────────────────────────────────────

  const initNewsTicker = () => {
    const ticker = document.getElementById('ticker-text');
    if (!ticker) return;
    const combined = NEWS_ITEMS.join('   •   ');
    ticker.textContent = combined + '   •   ' + combined; // double for seamless loop

    // Use CSS animation for smooth looping
    const style = document.getElementById('ticker-style') || (() => {
      const s = document.createElement('style');
      s.id = 'ticker-style';
      document.head.appendChild(s);
      return s;
    })();

    // Measure text width then set animation duration proportionally
    ticker.style.animation = 'none';
    ticker.style.transform = 'translateX(0)';
    requestAnimationFrame(() => {
      const textW = ticker.scrollWidth / 2;
      const vpW = window.innerWidth || 1200;
      const speed = 80; // px per second
      const duration = (textW + vpW) / speed;
      style.textContent = `
        @keyframes tickerScroll {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-${textW}px); }
        }
      `;
      ticker.style.animation = `tickerScroll ${duration}s linear infinite`;
      ticker.style.whiteSpace = 'nowrap';
      ticker.style.display = 'inline-block';
    });
  };

  // ─── Radar Animation ──────────────────────────────────────────────────────────

  const initRadar = () => {
    const radarEl = document.querySelector('.radar-sweep');
    if (radarEl && !radarEl.dataset.initialized) {
      radarEl.dataset.initialized = 'true';
      radarEl.style.animation = 'radarRotate 3s linear infinite';
      ensureRadarStyle();
    }

    clearInterval(radarBlipInterval);
    radarBlipInterval = setInterval(() => {
      const container = document.querySelector('.radar-screen') || document.querySelector('.radar');
      if (!container) return;
      const blip = document.createElement('div');
      blip.className = 'radar-blip';
      const angle = Math.random() * 360;
      const dist = 20 + Math.random() * 30;
      const rad = (angle - 90) * (Math.PI / 180);
      const x = 50 + dist * Math.cos(rad);
      const y = 50 + dist * Math.sin(rad);
      Object.assign(blip.style, {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: '6px',
        height: '6px',
        background: '#00ff88',
        borderRadius: '50%',
        boxShadow: '0 0 6px #00ff88',
        transform: 'translate(-50%,-50%)',
        opacity: '1',
        transition: 'opacity 2s ease',
        pointerEvents: 'none',
        zIndex: '2',
      });
      container.appendChild(blip);
      requestAnimationFrame(() => {
        setTimeout(() => { blip.style.opacity = '0'; }, 100);
      });
      setTimeout(() => blip.remove(), 2200);
    }, 700);
  };

  const ensureRadarStyle = () => {
    if (document.getElementById('radar-style')) return;
    const style = document.createElement('style');
    style.id = 'radar-style';
    style.textContent = `
      @keyframes radarRotate {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  };

  // ─── Blinking Lights ──────────────────────────────────────────────────────────

  const initBlinkingLights = () => {
    blinkIntervals.forEach(clearInterval);
    blinkIntervals = [];
    document.querySelectorAll('.status-indicator.blink').forEach(el => {
      const baseDelay = Math.random() * 1000;
      const interval = 600 + Math.random() * 800;
      setTimeout(() => {
        const id = setInterval(() => {
          el.style.opacity = el.style.opacity === '0' ? '1' : '0';
        }, interval);
        blinkIntervals.push(id);
      }, baseDelay);
    });
  };

  // ─── Daily Missions Display ───────────────────────────────────────────────────

  const refreshMissionsDisplay = () => {
    const gs = window.GameState;
    if (!gs || !gs.missions) return;

    const renderList = (containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      gs.missions.forEach(mission => {
        const pct = Math.min(100, Math.round((mission.current / mission.target) * 100));
        const done = pct >= 100;
        const item = document.createElement('div');
        item.className = `mission-item${done ? ' mission-done' : ''}`;
        item.innerHTML = `
          <div class="mission-header">
            <span class="mission-icon">${mission.icon ?? '🎯'}</span>
            <span class="mission-name">${mission.name ?? 'Mission'}</span>
            <span class="mission-reward">+${mission.reward ?? 0} 🎟️</span>
          </div>
          <div class="mission-progress-bar-wrap">
            <div class="mission-progress-bar" style="width:${pct}%"></div>
          </div>
          <div class="mission-progress-label">${mission.current}/${mission.target} ${done ? '✅' : ''}</div>
        `;
        container.appendChild(item);
      });
    };

    renderList('daily-missions');
    renderList('home-missions');
  };

  // ─── Leaderboard Display ──────────────────────────────────────────────────────

  const FAKE_PLAYERS = [
    { name: 'StarPilot_99',   score: 48200, rank: 'Fleet Master' },
    { name: 'NebulaNova',     score: 41750, rank: 'Admiral'      },
    { name: 'CosmicCrafter',  score: 37400, rank: 'Star Admiral' },
    { name: 'VoidHunter',     score: 33100, rank: 'Colonel'      },
    { name: 'AstroAce',       score: 28950, rank: 'Major'        },
    { name: 'GalaxyGhost',    score: 24600, rank: 'Captain'      },
    { name: 'PulsarPete',     score: 19850, rank: 'Commander'    },
    { name: 'MeteorMark',     score: 15200, rank: 'Navigator'    },
    { name: 'OrbitOlly',      score: 11400, rank: 'Pilot'        },
  ];

  const updateLeaderboard = () => {
    const gs = window.GameState;
    const playerScore = gs?.tickets ?? 0;
    const playerName = gs?.playerName ?? 'You';

    const allPlayers = [
      ...FAKE_PLAYERS,
      { name: playerName, score: playerScore, rank: gs?.rank ?? 'Cadet', isPlayer: true },
    ].sort((a, b) => b.score - a.score);

    const renderBoard = (containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      allPlayers.slice(0, 10).forEach((player, i) => {
        const row = document.createElement('div');
        row.className = `leaderboard-row${player.isPlayer ? ' player-row' : ''}`;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        row.innerHTML = `
          <span class="lb-rank">${medal}</span>
          <span class="lb-name">${player.name}${player.isPlayer ? ' (You)' : ''}</span>
          <span class="lb-score">${player.score.toLocaleString()}</span>
          <span class="lb-title">${player.rank}</span>
        `;
        container.appendChild(row);
      });
    };

    renderBoard('home-leaderboard');
    renderBoard('leaderboard-list');
  };

  // ─── Avatar System ────────────────────────────────────────────────────────────

  const AVATAR_LAYERS = ['base', 'helmet', 'suit', 'accessory', 'background'];

  const updateAvatarDisplay = () => {
    const display = document.getElementById('avatar-display');
    if (!display) return;
    const gs = window.GameState;
    const avatar = gs?.avatar ?? {};
    display.innerHTML = '';
    AVATAR_LAYERS.forEach(layer => {
      if (avatar[layer]) {
        const span = document.createElement('span');
        span.className = `avatar-layer avatar-${layer}`;
        span.textContent = avatar[layer];
        span.style.position = 'absolute';
        span.style.fontSize = '3rem';
        span.style.lineHeight = '1';
        display.appendChild(span);
      }
    });
    // Fallback default
    if (!display.children.length) {
      const def = document.createElement('span');
      def.textContent = '👨‍🚀';
      def.style.fontSize = '4rem';
      display.appendChild(def);
    }
  };

  const equipItem = (category, itemId) => {
    const gs = window.GameState;
    if (!gs) return;
    if (!gs.avatar) gs.avatar = {};
    gs.avatar[category] = itemId;
    updateAvatarDisplay();
    document.querySelectorAll(`.avatar-item[data-category="${category}"]`).forEach(el => {
      el.classList.toggle('equipped', el.dataset.itemId === itemId);
    });
    playSound('click');
    showAlert(`Equipped ${itemId} to ${category}!`, 'success');
  };

  const initAvatarPage = () => {
    document.querySelectorAll('.avatar-item').forEach(item => {
      if (item.dataset.avatarInitialized) return;
      item.dataset.avatarInitialized = 'true';
      item.addEventListener('click', () => {
        const category = item.dataset.category;
        const itemId = item.dataset.itemId;
        if (category && itemId) equipItem(category, itemId);
      });
    });
    updateAvatarDisplay();
  };

  // ─── Prize Shop ───────────────────────────────────────────────────────────────

  const SHOP_ITEMS = [
    { id: 'rocket_skin_red',   name: 'Red Rocket Skin',    cost: 200,  icon: '🚀', category: 'skins'  },
    { id: 'rocket_skin_gold',  name: 'Gold Rocket Skin',   cost: 500,  icon: '✨', category: 'skins'  },
    { id: 'helmet_astro',      name: 'Astro Helmet',        cost: 150,  icon: '⛑️', category: 'avatar' },
    { id: 'helmet_alien',      name: 'Alien Dome',          cost: 300,  icon: '👽', category: 'avatar' },
    { id: 'trail_fire',        name: 'Fire Trail',          cost: 250,  icon: '🔥', category: 'trails' },
    { id: 'trail_rainbow',     name: 'Rainbow Trail',       cost: 400,  icon: '🌈', category: 'trails' },
    { id: 'badge_star',        name: 'Star Badge',          cost: 100,  icon: '⭐', category: 'badges' },
    { id: 'badge_galaxy',      name: 'Galaxy Badge',        cost: 350,  icon: '🌌', category: 'badges' },
    { id: 'booster_xp',        name: 'XP Booster x2',      cost: 600,  icon: '⚡', category: 'boosts' },
    { id: 'booster_tickets',   name: 'Ticket Magnet',       cost: 450,  icon: '🎟️', category: 'boosts' },
    { id: 'ship_voyager',      name: 'USS Voyager Ship',    cost: 800,  icon: '🛸', category: 'ships'  },
    { id: 'ship_phoenix',      name: 'Phoenix Starship',    cost: 1200, icon: '🦅', category: 'ships'  },
  ];

  const renderPrizeShop = () => {
    const grid = document.getElementById('prize-shop');
    if (!grid) return;
    const gs = window.GameState;
    const tickets = gs?.tickets ?? 0;
    const owned = gs?.ownedItems ?? [];

    grid.innerHTML = '';
    SHOP_ITEMS.forEach(item => {
      const canAfford = tickets >= item.cost;
      const isOwned = owned.includes(item.id);
      const card = document.createElement('div');
      card.className = `shop-item${canAfford ? '' : ' shop-item-locked'}${isOwned ? ' shop-item-owned' : ''}`;
      card.dataset.itemId = item.id;
      card.innerHTML = `
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-cost">${isOwned ? '✅ Owned' : `${item.cost} 🎟️`}</div>
        ${!isOwned ? `<button class="btn-buy${canAfford ? '' : ' btn-disabled'}" data-item-id="${item.id}" ${canAfford ? '' : 'disabled'}>
          ${canAfford ? 'Buy' : 'Need more 🎟️'}
        </button>` : ''}
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-buy:not(.btn-disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item || !gs) return;
        if (gs.tickets >= item.cost) {
          gs.tickets -= item.cost;
          if (!gs.ownedItems) gs.ownedItems = [];
          gs.ownedItems.push(item.id);
          updateHUD();
          renderPrizeShop();
          playSound('earn');
          showEarnedPopup('ticket', -item.cost, e.clientX, e.clientY);
          showAlert(`Purchased ${item.name}!`, 'success');
        } else {
          playSound('error');
          showAlert('Not enough tickets!', 'error');
        }
      });
    });
  };

  // ─── Planet Info ──────────────────────────────────────────────────────────────

  const showPlanetInfo = (name) => {
    const planet = PLANETS[name.toLowerCase()];
    if (!planet) return;
    const panel = document.getElementById('planet-info');
    if (!panel) return;
    panel.innerHTML = `
      <div class="planet-info-header">
        <span class="planet-icon">${planet.icon}</span>
        <h3>${planet.name}</h3>
      </div>
      <p>${planet.desc}</p>
      <ul>
        <li><strong>Diameter:</strong> ${planet.diameter}</li>
        <li><strong>Distance:</strong> ${planet.distance}</li>
        <li><strong>Moons:</strong> ${planet.moons}</li>
      </ul>
      <button class="btn-close-panel" onclick="document.getElementById('planet-info').style.display='none'">Close ✕</button>
    `;
    panel.style.display = 'block';
    panel.style.opacity = '0';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.transition = 'opacity 0.3s ease';
        panel.style.opacity = '1';
      });
    });
    playSound('click');
  };

  // ─── Spin Cooldown ────────────────────────────────────────────────────────────

  const SPIN_KEY = 'lastSpinDate';

  const hasSpunToday = () => {
    const last = localStorage.getItem(SPIN_KEY);
    if (!last) return false;
    const today = new Date().toDateString();
    return last === today;
  };

  const markSpunToday = () => {
    localStorage.setItem(SPIN_KEY, new Date().toDateString());
  };

  // ─── Daily Reset Countdown ────────────────────────────────────────────────────

  const startResetCountdown = () => {
    clearInterval(countdownInterval);
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const str = [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
      const el = document.getElementById('missions-reset-timer');
      if (el) el.textContent = str;
    };
    tick();
    countdownInterval = setInterval(tick, 1000);
  };

  // ─── Secret Codes ─────────────────────────────────────────────────────────────

  const handleSecretCode = (code) => {
    const entry = SECRET_CODES[code.toUpperCase()];
    if (!entry) {
      playSound('error');
      showAlert('Unknown code. Try again!', 'warning');
      return;
    }
    const gs = window.GameState;
    if (!gs) return;

    const usedKey = `usedCode_${code.toUpperCase()}`;
    if (localStorage.getItem(usedKey)) {
      showAlert('Code already redeemed!', 'warning');
      playSound('error');
      return;
    }

    gs.tickets = (gs.tickets ?? 0) + entry.bonus;
    localStorage.setItem(usedKey, 'true');

    // Reveal secret box if present
    const secretBox = document.getElementById('secret-box');
    if (secretBox) {
      secretBox.style.display = 'block';
      secretBox.style.animation = 'none';
      requestAnimationFrame(() => {
        secretBox.style.transition = 'opacity 0.5s, transform 0.5s';
        secretBox.style.opacity = '1';
        secretBox.style.transform = 'scale(1)';
      });
    }

    updateHUD();
    createConfetti(50);
    playSound('win');
    showAlert(entry.msg, 'success');
    showAchievementNotif({ icon: '🔑', name: `Code Unlocked: ${code.toUpperCase()}` });
  };

  // ─── Konami Code ─────────────────────────────────────────────────────────────

  const setupKonamiCode = () => {
    document.addEventListener('keydown', (e) => {
      if (e.key === KONAMI[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === KONAMI.length) {
          konamiIndex = 0;
          triggerSecretZone();
        }
      } else {
        konamiIndex = e.key === KONAMI[0] ? 1 : 0;
      }
    });
  };

  const triggerSecretZone = () => {
    const zone = document.getElementById('secret-zone');
    if (zone) {
      zone.style.display = 'block';
      zone.style.opacity = '0';
      requestAnimationFrame(() => {
        zone.style.transition = 'opacity 0.6s ease';
        zone.style.opacity = '1';
      });
    }
    const gs = window.GameState;
    if (gs) gs.tickets = (gs.tickets ?? 0) + 999;
    updateHUD();
    createConfetti(150);
    createStarParticles(50);
    playSound('rankup');
    showAlert('🎮 KONAMI CODE ACTIVATED! +999 bonus tickets!', 'success');
    showAchievementNotif({ icon: '🕹️', name: 'Konami Code Master!' });
  };

  // ─── Game Launcher ────────────────────────────────────────────────────────────

  const launchGame = (gameId) => {
    showLoading();
    playSound('launch');
    let progress = 0;
    const tick = setInterval(() => {
      progress += 10 + Math.random() * 15;
      setLoadingProgress(Math.min(95, progress));
      if (progress >= 95) {
        clearInterval(tick);
        setTimeout(() => {
          setLoadingProgress(100);
          setTimeout(() => {
            hideLoading();
            if (window.GameEngine && typeof window.GameEngine.launch === 'function') {
              window.GameEngine.launch(gameId);
            } else {
              showAlert(`Launching ${gameId}... (Game engine not loaded)`, 'info');
            }
          }, 300);
        }, 400);
      }
    }, 120);
  };

  // ─── Game Filter ─────────────────────────────────────────────────────────────

  const filterGames = (category) => {
    document.querySelectorAll('.game-card').forEach(card => {
      const match = category === 'all' || card.dataset.category === category;
      card.style.display = match ? '' : 'none';
    });
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === category);
    });
  };

  // ─── Init All ─────────────────────────────────────────────────────────────────

  const init = () => {
    // Ensure AudioContext is created on first user interaction
    const unlockAudio = () => {
      getAudioCtx();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) showPage(page);
      });
    });

    // Sound toggle
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) btnSound.addEventListener('click', toggleSound);

    // Modal close buttons (data-close-modal or class .modal-close)
    document.querySelectorAll('[data-close-modal], .modal-close, .btn-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal, [id^="modal-"]');
        if (modal) closeModal(modal.id);
      });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal, [id^="modal-"]').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
      });
    });

    // Enter button (landing -> arcade)
    const btnEnter = document.getElementById('btn-enter');
    if (btnEnter) {
      btnEnter.addEventListener('click', () => {
        playSound('launch');
        showPage('page-arcade');
      });
    }

    // Prize wheel spin button
    const btnSpin = document.getElementById('btn-spin');
    if (btnSpin) {
      btnSpin.addEventListener('click', () => {
        if (wheelSpinning) {
          showAlert('Wheel is spinning!', 'warning');
          return;
        }
        if (hasSpunToday()) {
          showAlert('You already spun today! Come back tomorrow.', 'warning');
          playSound('error');
          return;
        }
        const resultIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
        spinWheel(resultIndex, (idx) => {
          markSpunToday();
          const seg = WHEEL_SEGMENTS[idx];
          const gs = window.GameState;
          if (gs) {
            if (seg.label.includes('Tickets')) {
              const amt = parseInt(seg.label) || 50;
              gs.tickets = (gs.tickets ?? 0) + amt;
              showEarnedPopup('ticket', amt, window.innerWidth / 2, window.innerHeight / 2);
            } else if (seg.label.includes('XP')) {
              const amt = parseInt(seg.label) || 10;
              gs.xp = (gs.xp ?? 0) + amt;
              showEarnedPopup('xp', amt, window.innerWidth / 2, window.innerHeight / 2);
            } else if (seg.label === 'Spin Again') {
              if (btnSpin) {
                localStorage.removeItem(SPIN_KEY);
                showAlert('Spin Again! Give it another whirl!', 'success');
              }
            } else if (seg.label === 'Mystery Box') {
              gs.tickets = (gs.tickets ?? 0) + 150;
              showAlert('Mystery Box! You found 150 bonus tickets!', 'success');
              createConfetti(60);
            }
            updateHUD();
          }
          createConfetti(40);
          playSound('win');
          showAlert(`You won: ${seg.label}!`, 'success');
        });
      });
    }

    // Secret code entry
    const btnEnterCode = document.getElementById('btn-enter-code');
    if (btnEnterCode) {
      btnEnterCode.addEventListener('click', () => {
        const input = document.getElementById('secret-code-input');
        if (input) {
          handleSecretCode(input.value.trim());
          input.value = '';
        }
      });
    }
    const codeInput = document.getElementById('secret-code-input');
    if (codeInput) {
      codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSecretCode(codeInput.value.trim());
          codeInput.value = '';
        }
      });
    }

    // Save avatar button
    const btnSaveAvatar = document.getElementById('btn-save-avatar');
    if (btnSaveAvatar) {
      btnSaveAvatar.addEventListener('click', () => {
        const gs = window.GameState;
        if (gs) {
          try {
            localStorage.setItem('cosmicAvatar', JSON.stringify(gs.avatar));
          } catch (e) { /* storage may be unavailable */ }
        }
        playSound('earn');
        showAlert('Avatar saved!', 'success');
      });
    }

    // Play buttons (game launchers)
    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = btn.closest('.game-card');
        const gameId = btn.dataset.game || card?.dataset?.gameId || 'unknown';
        launchGame(gameId);
      });
    });

    // Rocket color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        const preview = document.getElementById('rocket-preview');
        if (preview) preview.style.filter = `hue-rotate(${swatch.dataset.hue ?? 0}deg)`;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const gs = window.GameState;
        if (gs) gs.rocketColor = color;
        playSound('click');
      });
    });

    // Rocket part options
    document.querySelectorAll('.rocket-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const group = opt.dataset.group;
        document.querySelectorAll(`.rocket-option[data-group="${group}"]`).forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const gs = window.GameState;
        if (gs) {
          if (!gs.rocketParts) gs.rocketParts = {};
          gs.rocketParts[group] = opt.dataset.part;
        }
        playSound('click');
      });
    });

    // Game filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        filterGames(tab.dataset.filter ?? 'all');
        playSound('click');
      });
    });

    // Planet click handlers
    document.querySelectorAll('.planet, [data-planet]').forEach(planet => {
      planet.addEventListener('click', () => {
        const name = planet.dataset.planet || planet.id;
        if (name) showPlanetInfo(name);
      });
    });

    // Escape key closes open modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal[style*="flex"], [id^="modal-"][style*="flex"]').forEach(m => closeModal(m.id));
      }
    });

    // Alert panel click to dismiss
    const alertPanel = document.getElementById('alert-panel');
    if (alertPanel) {
      alertPanel.addEventListener('click', () => {
        alertPanel.style.opacity = '0';
        setTimeout(() => { alertPanel.style.display = 'none'; }, 320);
        clearTimeout(alertTimeout);
      });
    }

    // Initialize subsystems
    initNewsTicker();
    initRadar();
    initBlinkingLights();
    startResetCountdown();
    setupKonamiCode();

    // Initial state
    updateHUD();
    showPage('page-home');
  };

  // ─── DOMContentLoaded ─────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  window.UI = {
    showPage,
    updateHUD,
    showAchievementNotif,
    showEarnedPopup,
    showLoading,
    hideLoading,
    setLoadingProgress,
    toggleSound,
    playSound,
    spinWheel,
    createConfetti,
    showRankUp,
    showGameResults,
    initNewsTicker,
    refreshMissionsDisplay,
    updateLeaderboard,
    updateAvatarDisplay,
    equipItem,
    renderPrizeShop,
    openModal,
    closeModal,
    createStarParticles,
    showAlert,
    init,
    // Extras exposed for external use
    showPlanetInfo,
    filterGames,
    initWheel,
    initRadar,
    initBlinkingLights,
    startResetCountdown,
    hasSpunToday,
    markSpunToday,
    handleSecretCode,
  };

})();
