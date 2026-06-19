import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const rankDisplay = document.getElementById('rank-display');
const playersOnlineDisplay = document.getElementById('players-online');

const socket = io();

let selfId = null;
let players = {}; // id -> Player instance
let collectible = null;
let canvasSize = { width: 640, height: 480 };

const KEY_TO_DIR = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const pressedDirs = new Set();
let inputLoopId = null;

window.addEventListener('keydown', (e) => {
  const dir = KEY_TO_DIR[e.key];
  if (!dir) return;
  e.preventDefault();
  pressedDirs.add(dir);
});

window.addEventListener('keyup', (e) => {
  const dir = KEY_TO_DIR[e.key];
  if (!dir) return;
  pressedDirs.delete(dir);
});

function inputLoop() {
  pressedDirs.forEach((dir) => {
    socket.emit('move-player', dir);
  });
  inputLoopId = requestAnimationFrame(inputLoop);
}

socket.on('init', (data) => {
  selfId = data.selfId;
  canvasSize = data.canvas;
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  players = {};
  Object.values(data.players).forEach((p) => {
    players[p.id] = new Player(p);
  });

  collectible = new Collectible(data.collectible);

  if (!inputLoopId) {
    inputLoopId = requestAnimationFrame(inputLoop);
  }
});

socket.on('player-joined', (data) => {
  const p = data.player;
  players[p.id] = new Player(p);
});

socket.on('player-left', (data) => {
  delete players[data.id];
});

socket.on('state-update', (serialized) => {
  Object.values(serialized).forEach((p) => {
    if (players[p.id]) {
      players[p.id].x = p.x;
      players[p.id].y = p.y;
      players[p.id].score = p.score;
    } else {
      players[p.id] = new Player(p);
    }
  });

  // remove players no longer present
  Object.keys(players).forEach((id) => {
    if (!serialized[id]) delete players[id];
  });

  updateHud();
});

socket.on('collectible-update', (data) => {
  collectible = new Collectible(data);
});

function updateHud() {
  playersOnlineDisplay.textContent = `Players online: ${Object.keys(players).length}`;

  const self = players[selfId];
  if (self) {
    const allPlayers = Object.values(players);
    rankDisplay.textContent = self.calculateRank(allPlayers);
  }
}

function drawBackground() {
  ctx.fillStyle = '#0e1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawCollectible() {
  if (!collectible) return;
  ctx.beginPath();
  ctx.arc(collectible.x, collectible.y, collectible.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1b1f2a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(collectible.value), collectible.x, collectible.y);
}

function drawPlayer(p) {
  const isSelf = p.id === selfId;

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = isSelf ? '#06d6a0' : '#ef476f';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${p.score}`, p.x, p.y - p.radius - 6);
}

function gameLoop() {
  drawBackground();
  drawCollectible();
  Object.values(players).forEach(drawPlayer);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
