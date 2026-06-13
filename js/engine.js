// GameEngine - Core game state, progression, and persistence
window.GameEngine = (function () {
    'use strict';

    const SAVE_KEY = 'cosmicArcade';

    const RANKS = [
        { name: 'Space Cadet', minXp: 0, icon: '🚀' },
        { name: 'Pilot', minXp: 500, icon: '✈️' },
        { name: 'Navigator', minXp: 1500, icon: '🧭' },
        { name: 'Commander', minXp: 3500, icon: '⭐' },
        { name: 'Admiral', minXp: 7000, icon: '🌟' },
        { name: 'Cosmic Legend', minXp: 12000, icon: '🌌' }
    ];

    const ACHIEVEMENTS_DEF = [
        { id: 'first_launch', name: 'First Launch', desc: 'Launch your first rocket', icon: '🚀', xpReward: 100, ticketReward: 20 },
        { id: 'rocket_builder', name: 'Rocket Builder', desc: 'Customize and launch 3 rockets', icon: '🔧', xpReward: 150, ticketReward: 30 },
        { id: 'planet_explorer', name: 'Planet Explorer', desc: 'Visit your first planet', icon: '🌍', xpReward: 100, ticketReward: 25 },
        { id: 'five_planets', name: 'Solar Wanderer', desc: 'Visit 5 different planets', icon: '🪐', xpReward: 250, ticketReward: 50 },
        { id: 'all_planets', name: 'Universe Master', desc: 'Visit all planets', icon: '🌌', xpReward: 500, ticketReward: 100 },
        { id: 'arcade_champion', name: 'Arcade Champion', desc: 'Score over 1000 in any arcade game', icon: '🏆', xpReward: 200, ticketReward: 50 },
        { id: 'ticket_collector', name: 'Ticket Hoarder', desc: 'Collect 100 tickets', icon: '🎫', xpReward: 150, ticketReward: 0 },
        { id: 'hundred_tickets', name: 'Ticket Millionaire', desc: 'Have 500 tickets at once', icon: '💰', xpReward: 300, ticketReward: 0 },
        { id: 'alien_friend', name: 'Alien Friend', desc: 'Complete an alien encounter', icon: '👽', xpReward: 150, ticketReward: 30 },
        { id: 'puzzle_master', name: 'Puzzle Master', desc: 'Solve the sliding puzzle', icon: '🧩', xpReward: 200, ticketReward: 40 },
        { id: 'secret_finder', name: 'Secret Finder', desc: 'Discover a hidden secret', icon: '🔍', xpReward: 300, ticketReward: 75 },
        { id: 'daily_hero', name: 'Daily Hero', desc: 'Complete all daily missions', icon: '📋', xpReward: 250, ticketReward: 50 },
        { id: 'cosmic_legend', name: 'Cosmic Legend', desc: 'Reach the highest rank', icon: '🌟', xpReward: 1000, ticketReward: 200 },
        { id: 'memory_master', name: 'Memory Master', desc: 'Complete Memory Match without a mistake', icon: '🧠', xpReward: 200, ticketReward: 40 },
        { id: 'speed_demon', name: 'Speed Demon', desc: 'React in under 250ms', icon: '⚡', xpReward: 250, ticketReward: 50 },
        { id: 'dodger_pro', name: 'Dodger Pro', desc: 'Survive 60s in Space Dodger', icon: '🛸', xpReward: 200, ticketReward: 40 },
        { id: 'coin_hoarder', name: 'Coin Hoarder', desc: 'Collect 20 coins in one game', icon: '🪙', xpReward: 150, ticketReward: 30 },
        { id: 'mole_slayer', name: 'Mole Slayer', desc: 'Hit 30 moles in one game', icon: '🔨', xpReward: 150, ticketReward: 30 },
        { id: 'color_genius', name: 'Color Genius', desc: 'Score 100% in Color Match', icon: '🎨', xpReward: 200, ticketReward: 40 },
        { id: 'trivia_wizard', name: 'Trivia Wizard', desc: 'Answer 10/10 trivia correctly', icon: '🎓', xpReward: 300, ticketReward: 60 },
        { id: 'ten_games', name: 'Game Addict', desc: 'Play 10 arcade games', icon: '🎮', xpReward: 200, ticketReward: 40 },
        { id: 'first_spin', name: 'Lucky Spinner', desc: 'Spin the prize wheel for the first time', icon: '🎡', xpReward: 100, ticketReward: 0 },
        { id: 'prize_hunter', name: 'Prize Hunter', desc: 'Win a rare item from the wheel', icon: '🎁', xpReward: 250, ticketReward: 0 },
        { id: 'streak_3', name: 'On Fire!', desc: 'Log in 3 days in a row', icon: '🔥', xpReward: 150, ticketReward: 30 },
        { id: 'streak_7', name: 'Unstoppable', desc: 'Log in 7 days in a row', icon: '💫', xpReward: 400, ticketReward: 80 },
        { id: 'secret_room', name: 'Secret Room', desc: 'Find the hidden arcade room', icon: '🚪', xpReward: 300, ticketReward: 75 },
        { id: 'secret_vault', name: 'Vault Cracker', desc: 'Open the secret vault', icon: '🔐', xpReward: 500, ticketReward: 100 },
        { id: 'full_rank', name: 'Fully Ranked', desc: 'Reach Admiral rank', icon: '⭐', xpReward: 500, ticketReward: 100 },
        { id: 'avatar_master', name: 'Fashion Star', desc: 'Unlock 5 avatar items', icon: '👗', xpReward: 200, ticketReward: 40 },
        { id: 'daily_all', name: 'Mission Complete', desc: 'Complete all missions in a single day', icon: '✅', xpReward: 350, ticketReward: 70 }
    ];

    const WHEEL_SEGMENTS = [
        { label: '50 Tickets', type: 'tickets', value: 50, color: '#00f5ff', probability: 25 },
        { label: '100 Tickets', type: 'tickets', value: 100, color: '#b300ff', probability: 20 },
        { label: '200 XP', type: 'xp', value: 200, color: '#00ff88', probability: 20 },
        { label: '500 XP', type: 'xp', value: 500, color: '#ff00aa', probability: 10 },
        { label: 'Mystery Box', type: 'mystery_box', value: 1, color: '#ffdd00', probability: 10 },
        { label: 'Rare Item', type: 'rare_item', value: 1, color: '#ff6600', probability: 8 },
        { label: '500 Tickets', type: 'tickets', value: 500, color: '#ff0055', probability: 5 },
        { label: 'JACKPOT! 1000 Tickets', type: 'jackpot', value: 1000, color: '#ffffff', probability: 2 }
    ];

    const SHOP_ITEMS = [
        { id: 'suit_gold', name: 'Gold Space Suit', type: 'suit', cost: 150, icon: '👘', rarity: 'rare' },
        { id: 'suit_neon', name: 'Neon Suit', type: 'suit', cost: 200, icon: '🥻', rarity: 'epic' },
        { id: 'helmet_alien', name: 'Alien Helmet', type: 'helmet', cost: 100, icon: '👾', rarity: 'uncommon' },
        { id: 'helmet_astro', name: 'Astro Bubble Helmet', type: 'helmet', cost: 120, icon: '🪖', rarity: 'uncommon' },
        { id: 'effect_stars', name: 'Star Trail Effect', type: 'effect', cost: 300, icon: '✨', rarity: 'epic' },
        { id: 'effect_glow', name: 'Cosmic Glow Aura', type: 'effect', cost: 400, icon: '🌟', rarity: 'legendary' },
        { id: 'rocket_booster', name: 'Turbo Booster Upgrade', type: 'rocket', cost: 250, icon: '🔥', rarity: 'rare' },
        { id: 'rocket_shield', name: 'Rocket Shield', type: 'rocket', cost: 200, icon: '🛡️', rarity: 'rare' },
        { id: 'arcade_skin_cyber', name: 'Cyberpunk Arcade Skin', type: 'arcade', cost: 175, icon: '🎮', rarity: 'uncommon' },
        { id: 'mystery_box_small', name: 'Mystery Box (Small)', type: 'mystery', cost: 75, icon: '📦', rarity: 'common' },
        { id: 'mystery_box_large', name: 'Mystery Box (Large)', type: 'mystery', cost: 200, icon: '🎁', rarity: 'rare' },
        { id: 'accessory_wings', name: 'Cosmic Wings', type: 'accessory', cost: 350, icon: '🦋', rarity: 'legendary' }
    ];

    const FAKE_LEADERBOARD = [
        { name: 'StarBlaster99', xp: 14500, rank: 'Cosmic Legend', tickets: 2340 },
        { name: 'NebulaPilot', xp: 11200, rank: 'Admiral', tickets: 1890 },
        { name: 'CosmicKid_X', xp: 9800, rank: 'Admiral', tickets: 1560 },
        { name: 'SpaceRacer7', xp: 7400, rank: 'Commander', tickets: 1200 },
        { name: 'AstroQueen', xp: 6100, rank: 'Commander', tickets: 980 },
        { name: 'GalaxyHero', xp: 4900, rank: 'Navigator', tickets: 750 },
        { name: 'MoonWalker', xp: 3200, rank: 'Navigator', tickets: 620 },
        { name: 'RocketFuel', xp: 2100, rank: 'Pilot', tickets: 430 },
        { name: 'StarDust22', xp: 1400, rank: 'Pilot', tickets: 310 },
        { name: 'CosmoCat', xp: 800, rank: 'Space Cadet', tickets: 180 }
    ];

    // Event emitter
    const listeners = {};
    function on(event, cb) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
    }
    function off(event, cb) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(f => f !== cb);
    }
    function emit(event, data) {
        if (listeners[event]) listeners[event].forEach(cb => { try { cb(data); } catch (e) { } });
    }

    function defaultState() {
        return {
            player: {
                name: '',
                xp: 0,
                tickets: 0,
                rank: 'Space Cadet',
                rankIndex: 0,
                level: 1,
                streak: 0,
                lastLogin: null,
                gamesPlayed: 0,
                rocketsLaunched: 0,
                planetsVisited: [],
                secretsFound: [],
                avatar: { base: '👨‍🚀', helmet: null, suit: null, accessory: null, effect: null },
                rocketConfig: { nose: 'pointed', body: 'standard', engine: 'single', color: '#00f5ff', booster: 'none' }
            },
            achievements: ACHIEVEMENTS_DEF.map(a => ({ ...a, unlocked: false, unlockedAt: null })),
            missions: generateDailyMissions(),
            missionsDate: new Date().toDateString(),
            inventory: [],
            lastSpinDate: null,
            totalSpins: 0,
            highScores: {},
            settings: { sound: true }
        };
    }

    function generateDailyMissions() {
        return [
            { id: 'dm1', desc: 'Launch a rocket', type: 'launch_rocket', target: 1, progress: 0, completed: false, xpReward: 100, ticketReward: 25 },
            { id: 'dm2', desc: 'Play 3 arcade games', type: 'play_game', target: 3, progress: 0, completed: false, xpReward: 150, ticketReward: 30 },
            { id: 'dm3', desc: 'Collect 50 tickets', type: 'collect_tickets', target: 50, progress: 0, completed: false, xpReward: 100, ticketReward: 0 },
            { id: 'dm4', desc: 'Explore a planet', type: 'explore_planet', target: 1, progress: 0, completed: false, xpReward: 120, ticketReward: 25 },
            { id: 'dm5', desc: 'Find a hidden secret', type: 'find_secret', target: 1, progress: 0, completed: false, xpReward: 200, ticketReward: 50 }
        ];
    }

    let state = null;

    function load() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) {
                state = JSON.parse(saved);
                // Merge missing achievements
                ACHIEVEMENTS_DEF.forEach(def => {
                    if (!state.achievements.find(a => a.id === def.id)) {
                        state.achievements.push({ ...def, unlocked: false, unlockedAt: null });
                    }
                });
            } else {
                state = defaultState();
            }
        } catch (e) {
            state = defaultState();
        }
        checkDailyReset();
        updateStreak();
    }

    function save() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { }
    }

    function checkDailyReset() {
        const today = new Date().toDateString();
        if (state.missionsDate !== today) {
            state.missions = generateDailyMissions();
            state.missionsDate = today;
            emit('daily_reset', {});
            save();
        }
    }

    function updateStreak() {
        const today = new Date().toDateString();
        const last = state.player.lastLogin;
        if (!last) {
            state.player.streak = 1;
        } else if (last === today) {
            // same day, no change
        } else {
            const lastDate = new Date(last);
            const diff = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);
            if (Math.round(diff) === 1) {
                state.player.streak++;
                if (state.player.streak >= 3) checkAchievement('streak_3');
                if (state.player.streak >= 7) checkAchievement('streak_7');
            } else {
                state.player.streak = 1;
            }
        }
        state.player.lastLogin = today;
        save();
    }

    function getRank(xp) {
        let rank = RANKS[0];
        for (let i = RANKS.length - 1; i >= 0; i--) {
            if (xp >= RANKS[i].minXp) { rank = RANKS[i]; break; }
        }
        return rank;
    }

    function getRankIndex(xp) {
        let idx = 0;
        for (let i = RANKS.length - 1; i >= 0; i--) {
            if (xp >= RANKS[i].minXp) { idx = i; break; }
        }
        return idx;
    }

    function getXpToNextRank() {
        const idx = getRankIndex(state.player.xp);
        if (idx >= RANKS.length - 1) return { current: state.player.xp, needed: RANKS[RANKS.length - 1].minXp, percent: 100 };
        const next = RANKS[idx + 1];
        const current = RANKS[idx];
        const progress = state.player.xp - current.minXp;
        const total = next.minXp - current.minXp;
        return { current: progress, needed: total, percent: Math.min(100, Math.floor((progress / total) * 100)) };
    }

    function addXP(amount) {
        const oldIdx = getRankIndex(state.player.xp);
        state.player.xp += amount;
        const newIdx = getRankIndex(state.player.xp);
        state.player.rank = getRank(state.player.xp).name;
        emit('xp_gained', { amount, total: state.player.xp });
        if (newIdx > oldIdx) {
            const newRank = RANKS[newIdx];
            emit('rank_up', { rank: newRank });
            if (newIdx >= 4) checkAchievement('full_rank');
            if (newIdx >= 5) checkAchievement('cosmic_legend');
        }
        save();
    }

    function addTickets(amount) {
        state.player.tickets += amount;
        updateMissionProgress('collect_tickets', amount);
        emit('tickets_gained', { amount, total: state.player.tickets });
        if (state.player.tickets >= 100) checkAchievement('ticket_collector');
        if (state.player.tickets >= 500) checkAchievement('hundred_tickets');
        save();
    }

    function spendTickets(amount) {
        if (state.player.tickets < amount) return false;
        state.player.tickets -= amount;
        save();
        return true;
    }

    function checkAchievement(id) {
        const ach = state.achievements.find(a => a.id === id);
        if (!ach || ach.unlocked) return false;
        ach.unlocked = true;
        ach.unlockedAt = Date.now();
        // Give rewards without recursion
        state.player.xp += ach.xpReward;
        state.player.tickets += ach.ticketReward;
        state.player.rank = getRank(state.player.xp).name;
        emit('achievement_unlocked', ach);
        save();
        return true;
    }

    function updateMissionProgress(type, amount) {
        let anyComplete = false;
        state.missions.forEach(m => {
            if (m.type === type && !m.completed) {
                m.progress = Math.min(m.target, m.progress + amount);
                if (m.progress >= m.target) {
                    m.completed = true;
                    anyComplete = true;
                    emit('mission_complete', m);
                }
            }
        });
        if (anyComplete) {
            const allDone = state.missions.every(m => m.completed);
            if (allDone) checkAchievement('daily_all');
            checkAchievement('daily_hero');
        }
        save();
    }

    function claimMissionReward(missionId) {
        const m = state.missions.find(x => x.id === missionId);
        if (!m || !m.completed || m.claimed) return false;
        m.claimed = true;
        addXP(m.xpReward);
        addTickets(m.ticketReward);
        save();
        return true;
    }

    function canSpinToday() {
        if (!state.lastSpinDate) return true;
        return state.lastSpinDate !== new Date().toDateString();
    }

    function spinPrizeWheel() {
        if (!canSpinToday()) return null;
        const total = WHEEL_SEGMENTS.reduce((s, seg) => s + seg.probability, 0);
        let rand = Math.random() * total;
        let result = WHEEL_SEGMENTS[0];
        for (const seg of WHEEL_SEGMENTS) {
            rand -= seg.probability;
            if (rand <= 0) { result = seg; break; }
        }
        state.lastSpinDate = new Date().toDateString();
        state.totalSpins++;
        checkAchievement('first_spin');

        if (result.type === 'tickets' || result.type === 'jackpot') {
            addTickets(result.value);
            if (result.value >= 500) checkAchievement('prize_hunter');
        } else if (result.type === 'xp') {
            addXP(result.value);
        } else if (result.type === 'rare_item' || result.type === 'mystery_box') {
            checkAchievement('prize_hunter');
            addToInventory({ type: result.type, id: 'spin_reward_' + Date.now(), name: result.label });
        }
        emit('spin_complete', result);
        save();
        return result;
    }

    function addToInventory(item) {
        state.inventory.push(item);
        const uniq = new Set(state.inventory.map(i => i.id || i.type));
        if (uniq.size >= 5) checkAchievement('avatar_master');
        save();
    }

    function buyItem(itemId) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return false;
        if (!spendTickets(item.cost)) return false;
        addToInventory({ ...item });
        return true;
    }

    function hasItem(itemId) {
        return state.inventory.some(i => i.id === itemId);
    }

    function visitPlanet(planetId) {
        if (!state.player.planetsVisited.includes(planetId)) {
            state.player.planetsVisited.push(planetId);
            checkAchievement('planet_explorer');
            if (state.player.planetsVisited.length >= 5) checkAchievement('five_planets');
            if (state.player.planetsVisited.length >= 8) checkAchievement('all_planets');
            updateMissionProgress('explore_planet', 1);
            addXP(50);
            addTickets(15);
            save();
        }
    }

    function recordLaunch() {
        state.player.rocketsLaunched++;
        updateMissionProgress('launch_rocket', 1);
        checkAchievement('first_launch');
        if (state.player.rocketsLaunched >= 3) checkAchievement('rocket_builder');
        save();
    }

    function recordGamePlayed() {
        state.player.gamesPlayed++;
        updateMissionProgress('play_game', 1);
        if (state.player.gamesPlayed >= 10) checkAchievement('ten_games');
        save();
    }

    function updateHighScore(gameId, score) {
        if (!state.highScores[gameId] || score > state.highScores[gameId]) {
            state.highScores[gameId] = score;
            save();
            return true;
        }
        return false;
    }

    function findSecret(secretId) {
        if (!state.player.secretsFound.includes(secretId)) {
            state.player.secretsFound.push(secretId);
            updateMissionProgress('find_secret', 1);
            checkAchievement('secret_finder');
            addXP(100);
            addTickets(30);
            save();
            return true;
        }
        return false;
    }

    function getLeaderboard() {
        const lb = [...FAKE_LEADERBOARD];
        if (state.player.name) {
            lb.push({ name: state.player.name + ' (You)', xp: state.player.xp, rank: state.player.rank, tickets: state.player.tickets });
            lb.sort((a, b) => b.xp - a.xp);
        }
        return lb.slice(0, 10);
    }

    function getState() { return state; }
    function getPlayer() { return state.player; }
    function getAchievements() { return state.achievements; }
    function getMissions() { return state.missions; }
    function getInventory() { return state.inventory; }
    function getWheelSegments() { return WHEEL_SEGMENTS; }
    function getShopItems() { return SHOP_ITEMS; }
    function getRanks() { return RANKS; }
    function getXpProgress() { return getXpToNextRank(); }
    function resetGame() { state = defaultState(); save(); location.reload(); }

    load();
    setInterval(save, 30000);

    return {
        on, off, emit,
        addXP, addTickets, spendTickets,
        checkAchievement, updateMissionProgress, claimMissionReward,
        canSpinToday, spinPrizeWheel,
        addToInventory, buyItem, hasItem,
        visitPlanet, recordLaunch, recordGamePlayed,
        updateHighScore, findSecret,
        getLeaderboard, getState, getPlayer, getAchievements,
        getMissions, getInventory, getWheelSegments, getShopItems,
        getRanks, getXpProgress,
        getRankDisplay: () => getRank(state.player.xp),
        resetGame, save
    };
})();
