let gameData = JSON.parse(localStorage.getItem("cosmicData")) || {
  xp: 0,
  tickets: 0,
  rank: 1,
  unlocked: ["lobby"],
  achievements: []
};

function save() {
  localStorage.setItem("cosmicData", JSON.stringify(gameData));
}

function addXP(amount) {
  gameData.xp += amount;
  if (gameData.xp > gameData.rank * 100) {
    gameData.rank++;
  }
  save();
  updateUI();
}

function addTickets(amount) {
  gameData.tickets += amount;
  save();
  updateUI();
}

function unlock(item) {
  if (!gameData.unlocked.includes(item)) {
    gameData.unlocked.push(item);
    save();
  }
}

function addAchievement(name) {
  if (!gameData.achievements.includes(name)) {
    gameData.achievements.push(name);
    addXP(50);
    addTickets(20);
    alert("Achievement Unlocked: " + name);
    save();
  }
}

function updateUI() {
  document.querySelectorAll("#xp").forEach(el => el.innerText = gameData.xp);
  document.querySelectorAll("#tickets").forEach(el => el.innerText = gameData.tickets);
  document.querySelectorAll("#rank").forEach(el => el.innerText = gameData.rank);
}

/* MINI GAME 1: Reaction Test */
function reactionGame() {
  let start = Date.now();
  alert("Wait for green...");
  setTimeout(() => {
    let clicked = Date.now();
    let time = clicked - start;
    alert("Reaction: " + time + "ms");
    addXP(20);
    addTickets(10);
  }, Math.random() * 3000 + 1000);
}

/* MINI GAME 2: Coin Grab */
function coinGame() {
  let score = Math.floor(Math.random() * 10);
  alert("You collected " + score + " coins!");
  addTickets(score * 2);
  addXP(score * 5);
}
