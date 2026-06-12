let game = JSON.parse(localStorage.getItem("cosmicGame")) || {
  xp: 0,
  tickets: 0,
  rank: 1,
  sound: true,
  achievements: []
};

const ranks = [
  "Rookie Astronaut",
  "Star Cadet",
  "Galaxy Pilot",
  "Nebula Explorer",
  "Cosmic Commander",
  "Void Legend"
];

/* SAVE */
function save() {
  localStorage.setItem("cosmicGame", JSON.stringify(game));
}

/* SOUND SYSTEM */
function beep(type = "good") {
  if (!game.sound) return;

  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let osc = ctx.createOscillator();
  let gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.value = type === "bad" ? 200 : 600;

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

/* XP SYSTEM */
function addXP(amount) {
  game.xp += amount;
  if (game.xp > game.rank * 120) {
    game.rank++;
    showPopup("RANK UP!");
  }
  save();
  updateUI();
}

/* TICKETS */
function addTickets(amount) {
  game.tickets += amount;
  save();
  updateUI();
}

/* ACHIEVEMENTS */
function unlock(name) {
  if (!game.achievements.includes(name)) {
    game.achievements.push(name);
    addXP(50);
    addTickets(25);
    showPopup("Achievement: " + name);
    save();
  }
}

/* POPUP SYSTEM */
function showPopup(text) {
  let div = document.createElement("div");
  div.innerText = text;
  div.style.position = "fixed";
  div.style.top = "20px";
  div.style.left = "50%";
  div.style.transform = "translateX(-50%)";
  div.style.padding = "15px";
  div.style.background = "rgba(0,255,255,0.2)";
  div.style.border = "1px solid cyan";
  div.style.borderRadius = "10px";
  div.style.boxShadow = "0 0 20px cyan";
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 2000);
}

/* PARTICLE BURST */
function burst(x = 200, y = 200) {
  for (let i = 0; i < 10; i++) {
    let p = document.createElement("div");
    p.style.position = "fixed";
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.width = "6px";
    p.style.height = "6px";
    p.style.background = "cyan";
    p.style.borderRadius = "50%";
    document.body.appendChild(p);

    let angle = Math.random() * 360;
    let speed = Math.random() * 100;

    setTimeout(() => p.remove(), 600);
  }
}

/* MINI GAMES */

/* Reaction Game (UPGRADED) */
function reactionGame() {
  showPopup("WAIT FOR GREEN...");
  let start = Date.now();

  setTimeout(() => {
    let delay = Date.now() - start;
    addXP(20);
    addTickets(Math.max(5, 100 - delay));
    beep();
    showPopup("Reaction: " + delay + "ms");
  }, Math.random() * 3000 + 1000);
}

/* COIN GAME (UPGRADED) */
function coinGame() {
  let score = Math.floor(Math.random() * 20);
  addTickets(score * 2);
  addXP(score * 3);
  burst(300, 300);
  beep();
  showPopup("Coins: " + score);
}

/* UI UPDATE */
function updateUI() {
  document.querySelectorAll("#xp").forEach(e => e.innerText = game.xp);
  document.querySelectorAll("#tickets").forEach(e => e.innerText = game.tickets);
  document.querySelectorAll("#rank").forEach(e =>
    e.innerText = ranks[game.rank - 1] || "Cosmic God"
  );
}

/* TOGGLE SOUND */
function toggleSound() {
  game.sound = !game.sound;
  save();
  showPopup("Sound: " + (game.sound ? "ON" : "OFF"));
}
