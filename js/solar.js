// SolarSystem - Interactive solar system display and planet exploration
window.SolarSystem = (function () {
    'use strict';

    const PLANETS = [
        {
            id: 'mercury', name: 'Mercury', color: '#b5b5b5', glowColor: '#d0d0d0',
            size: 18, orbitRadius: 110, period: 4, emoji: '⚫',
            description: 'The smallest planet and closest to the Sun. Extreme temperatures from -180°C to 430°C!',
            funFacts: ['A year on Mercury is only 88 Earth days', 'Mercury has no atmosphere', 'Despite being closest to the Sun, it\'s not the hottest planet'],
            artifacts: ['Ancient Crater Rock', 'Solar Wind Crystal', 'Ice Core Sample'],
            missions: ['Scan surface craters', 'Collect mineral samples', 'Map magnetic field'],
            environment: { bg: 'linear-gradient(180deg, #1a1a2e 0%, #2d1b00 100%)', ground: '#8a8a8a', sky: '#1a0a00' }
        },
        {
            id: 'venus', name: 'Venus', color: '#e8cda0', glowColor: '#ffcc66',
            size: 28, orbitRadius: 160, period: 7, emoji: '🟡',
            description: 'The hottest planet with thick toxic clouds and crushing pressure. A true hellscape!',
            funFacts: ['Venus spins backwards compared to most planets', 'A day on Venus is longer than its year', 'Surface pressure is 92 times Earth\'s'],
            artifacts: ['Volcanic Gem', 'Sulfur Cloud Capsule', 'Heat Shield Fragment'],
            missions: ['Probe the atmosphere', 'Collect volcanic samples', 'Survive the heat'],
            environment: { bg: 'linear-gradient(180deg, #2d1a00 0%, #8b4513 100%)', ground: '#cc6600', sky: '#ff8800' }
        },
        {
            id: 'earth', name: 'Earth', color: '#4f9eff', glowColor: '#00aaff',
            size: 32, orbitRadius: 220, period: 12, emoji: '🌍',
            description: 'Our home planet! The only known world with life, vast oceans, and a breathable atmosphere.',
            funFacts: ['Earth is the densest planet in the solar system', '71% of Earth\'s surface is covered in water', 'Earth\'s core is as hot as the Sun\'s surface'],
            artifacts: ['Blue Ocean Crystal', 'Fossil Record Shard', 'Atmosphere Sample'],
            missions: ['Monitor climate data', 'Study ocean currents', 'Track satellite signals'],
            environment: { bg: 'linear-gradient(180deg, #001a4d 0%, #0066cc 50%, #006600 100%)', ground: '#228B22', sky: '#87CEEB' }
        },
        {
            id: 'mars', name: 'Mars', color: '#ff5733', glowColor: '#ff3300',
            size: 24, orbitRadius: 290, period: 22, emoji: '🔴',
            description: 'The Red Planet! Home to Olympus Mons, the tallest volcano in the solar system.',
            funFacts: ['Mars has the largest volcano in the solar system', 'A Martian day is 24 hours and 37 minutes', 'Mars has two tiny moons: Phobos and Deimos'],
            artifacts: ['Red Dust Sample', 'Ancient River Stone', 'Mars Meteorite Chip'],
            missions: ['Search for water ice', 'Survey Olympus Mons', 'Find life signs'],
            environment: { bg: 'linear-gradient(180deg, #1a0500 0%, #4d1500 100%)', ground: '#cc4400', sky: '#ff6633' }
        },
        {
            id: 'jupiter', name: 'Jupiter', color: '#c88b3a', glowColor: '#ffaa00',
            size: 60, orbitRadius: 390, period: 60, emoji: '🟠',
            description: 'The giant! Jupiter\'s Great Red Spot is a storm larger than Earth that\'s been raging for centuries.',
            funFacts: ['Jupiter is larger than all other planets combined', 'The Great Red Spot storm has lasted 350+ years', 'Jupiter has 95 known moons'],
            artifacts: ['Storm Cloud Vial', 'Magnetic Core Fragment', 'Europa Ice Chip'],
            missions: ['Study the Great Red Spot', 'Probe the atmosphere', 'Map the moons'],
            environment: { bg: 'linear-gradient(180deg, #1a0a00 0%, #663300 100%)', ground: '#cc8800', sky: '#ff9900' }
        },
        {
            id: 'saturn', name: 'Saturn', color: '#e4d191', glowColor: '#ffeeaa',
            size: 54, orbitRadius: 490, period: 120, emoji: '🪐',
            description: 'The ringed wonder! Saturn\'s iconic rings are made of ice and rock and stretch 282,000 km.',
            funFacts: ['Saturn\'s rings are only about 10 meters thick', 'Saturn could float on water — it\'s less dense!', 'Titan, Saturn\'s moon, has lakes of liquid methane'],
            artifacts: ['Ring Ice Crystal', 'Titan Rock', 'Saturn Gas Sample'],
            missions: ['Sample the rings', 'Explore Titan', 'Measure ring composition'],
            environment: { bg: 'linear-gradient(180deg, #0a0800 0%, #4d4400 100%)', ground: '#998800', sky: '#ccbb00' }
        },
        {
            id: 'uranus', name: 'Uranus', color: '#7de8e8', glowColor: '#00ffff',
            size: 40, orbitRadius: 590, period: 200, emoji: '🔵',
            description: 'The sideways planet! Uranus rotates on its side with a tilt of 98 degrees.',
            funFacts: ['Uranus orbits the Sun on its side', 'Uranus has 13 known rings', 'Uranus is the coldest planetary atmosphere in the solar system'],
            artifacts: ['Methane Ice Cube', 'Magnetic Anomaly Stone', 'Ring Particle'],
            missions: ['Map the magnetic field', 'Study the ring system', 'Probe the icy atmosphere'],
            environment: { bg: 'linear-gradient(180deg, #001a1a 0%, #003333 100%)', ground: '#006666', sky: '#00aaaa' }
        },
        {
            id: 'neptune', name: 'Neptune', color: '#4b70dd', glowColor: '#3355ff',
            size: 38, orbitRadius: 680, period: 380, emoji: '🔵',
            description: 'The windy giant! Neptune has the strongest winds in the solar system reaching 2,100 km/h!',
            funFacts: ['Neptune\'s winds are the fastest in the solar system', 'Neptune takes 165 Earth years to orbit the Sun', 'Triton, Neptune\'s moon, orbits backwards'],
            artifacts: ['Supersonic Wind Vial', 'Triton Ice', 'Deep Blue Crystal'],
            missions: ['Measure storm intensity', 'Explore Triton', 'Map the deep atmosphere'],
            environment: { bg: 'linear-gradient(180deg, #000a2e 0%, #001a66 100%)', ground: '#0000cc', sky: '#0033ff' }
        },
        {
            id: 'nebula_x', name: 'Nebula X', color: '#ff00ff', glowColor: '#ff00ff',
            size: 36, orbitRadius: 790, period: 500, emoji: '💜',
            hidden: true,
            description: '??? A mysterious planet that shouldn\'t exist. Pulsing with strange energy and alien signals...',
            funFacts: ['No probe has ever returned from this planet', 'The planet emits an unknown form of radiation', 'Strange geometric structures have been detected on the surface'],
            artifacts: ['Alien Artifact Alpha', 'Unknown Energy Crystal', 'Dimensional Shard'],
            missions: ['Investigate alien signals', 'Collect unknown materials', 'Decode the transmissions'],
            environment: { bg: 'linear-gradient(180deg, #0a0020 0%, #2d0040 100%)', ground: '#660099', sky: '#ff00ff' }
        }
    ];

    let sunClickCount = 0;
    let currentPlanet = null;

    function renderSolarSystem(container) {
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'solar-system-wrapper';
        wrapper.innerHTML = `
            <div class="solar-center">
                <div class="sun" id="sun-click-target" title="Click me 5 times...">☀️</div>
                <div class="sun-glow"></div>
            </div>
        `;

        const player = GameEngine.getPlayer();

        PLANETS.forEach((planet, i) => {
            if (planet.hidden && !player.secretsFound.includes('secret_planet')) return;

            const orbit = document.createElement('div');
            orbit.className = 'planet-orbit';
            orbit.style.cssText = `
                width: ${planet.orbitRadius * 2}px;
                height: ${planet.orbitRadius * 2}px;
                animation-duration: ${planet.period * 3}s;
            `;

            const dot = document.createElement('div');
            dot.className = 'planet-dot';
            dot.style.cssText = `
                width: ${planet.size}px;
                height: ${planet.size}px;
                background: ${planet.color};
                box-shadow: 0 0 ${planet.size}px ${planet.glowColor}, 0 0 ${planet.size * 2}px ${planet.glowColor}44;
                top: -${planet.size / 2}px;
                left: calc(50% - ${planet.size / 2}px);
                animation-duration: ${planet.period * 3}s;
            `;
            if (planet.id === 'saturn') {
                dot.classList.add('has-rings');
            }
            dot.setAttribute('data-planet', planet.id);
            dot.setAttribute('title', planet.name);

            const label = document.createElement('div');
            label.className = 'planet-label';
            label.textContent = planet.name;

            const visited = player.planetsVisited.includes(planet.id);
            if (visited) dot.classList.add('visited');

            dot.addEventListener('click', () => selectPlanet(planet.id));
            dot.appendChild(label);
            orbit.appendChild(dot);
            wrapper.appendChild(orbit);
        });

        container.appendChild(wrapper);

        // Info panel
        const panel = document.createElement('div');
        panel.id = 'planet-info-panel';
        panel.className = 'planet-info-panel hidden';
        panel.innerHTML = `
            <button class="panel-close-btn" onclick="SolarSystem.closePlanetPanel()">✕</button>
            <div id="planet-info-content"></div>
            <button class="btn btn-primary" id="explore-planet-btn" onclick="SolarSystem.exploreCurrent()">🚀 EXPLORE PLANET</button>
        `;
        container.appendChild(panel);

        // Sun click for secret
        document.getElementById('sun-click-target').addEventListener('click', handleSunClick);
    }

    function handleSunClick() {
        sunClickCount++;
        const sun = document.getElementById('sun-click-target');
        sun.style.transform = `scale(${1 + sunClickCount * 0.1})`;
        setTimeout(() => { sun.style.transform = ''; }, 300);
        if (sunClickCount >= 5) {
            sunClickCount = 0;
            GameEngine.findSecret('secret_planet');
            GameEngine.checkAchievement('secret_finder');
            showSecretPlanetReveal();
        }
    }

    function showSecretPlanetReveal() {
        UI.showAlert('🌌 MYSTERIOUS SIGNAL DETECTED! A hidden planet has been revealed...', 'epic');
        setTimeout(() => {
            const solarContainer = document.getElementById('solar-display');
            if (solarContainer) renderSolarSystem(solarContainer);
        }, 1500);
    }

    function selectPlanet(planetId) {
        const planet = PLANETS.find(p => p.id === planetId);
        if (!planet) return;
        currentPlanet = planet;
        const panel = document.getElementById('planet-info-panel');
        const content = document.getElementById('planet-info-content');
        const player = GameEngine.getPlayer();
        const visited = player.planetsVisited.includes(planet.id);

        content.innerHTML = `
            <div class="planet-info-header">
                <div class="planet-preview-icon" style="background:${planet.color};box-shadow:0 0 20px ${planet.glowColor};width:60px;height:60px;border-radius:50%;display:inline-block;margin-bottom:10px;"></div>
                <h2 class="neon-text" style="color:${planet.glowColor}">${planet.name}</h2>
                ${visited ? '<span class="badge badge-green">✓ Visited</span>' : '<span class="badge badge-blue">Undiscovered</span>'}
            </div>
            <p class="planet-desc">${planet.description}</p>
            <div class="fun-facts">
                <h4>🔭 Fun Facts</h4>
                <ul>${planet.funFacts.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>
            <div class="planet-artifacts-preview">
                <h4>💎 Artifacts: ${planet.artifacts.length} available</h4>
            </div>
        `;
        panel.classList.remove('hidden');
        panel.style.animation = 'slideInRight 0.3s ease';
    }

    function closePlanetPanel() {
        const panel = document.getElementById('planet-info-panel');
        if (panel) panel.classList.add('hidden');
    }

    function exploreCurrent() {
        if (!currentPlanet) return;
        window.App && App.explorePlanet(currentPlanet);
    }

    function getPlanet(id) {
        return PLANETS.find(p => p.id === id);
    }

    function getAllPlanets() {
        return PLANETS;
    }

    return { renderSolarSystem, selectPlanet, closePlanetPanel, exploreCurrent, getPlanet, getAllPlanets };
})();
