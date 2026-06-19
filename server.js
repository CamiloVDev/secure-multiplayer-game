import express from 'express';
import helmet from 'helmet';
import nocache from 'nocache';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

import Player from './public/Player.mjs';
import Collectible from './public/Collectible.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;


/* ----------------------- SECURITY MIDDLEWARE ----------------------- */
// helmet@3.21.3 style API

// Allow the FCC test runner (and others) to reach this app cross-origin,
// and explicitly expose the security headers so client-side JS can read them
app.use(
  cors({
    origin: '*',
    exposedHeaders: [
      'X-Powered-By',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Cache-Control',
      'Pragma',
      'Expires',
      'Surrogate-Control',
    ],
  })
);

// Prevent MIME type sniffing
app.use(helmet.noSniff());

// Prevent XSS attacks
app.use(helmet.xssFilter());

// Hide that the app is powered by Express, fake it as PHP 7.4.3
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));

// Disable client side caching
app.use(nocache());

/* --------------------------- STATIC FILES --------------------------- */
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.route('/').get((req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

/* ------------------------ FCC TESTING ROUTES ------------------------ */
try {
  const { default: fccTestingRoutes } = await import('./routes/fcctesting.js');
  fccTestingRoutes(app);
} catch (e) {
  // routes file optional
}

/* ------------------------------ 404 ------------------------------ */
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

/* ----------------------------- GAME STATE ----------------------------- */
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const PLAYER_RADIUS = 20;
const COLLECTIBLE_RADIUS = 10;
const MOVE_SPEED = 6;

const players = {}; // id -> Player instance
let collectible = spawnCollectible();

function randomPos(radius) {
  return {
    x: Math.floor(Math.random() * (CANVAS_WIDTH - radius * 2)) + radius,
    y: Math.floor(Math.random() * (CANVAS_HEIGHT - radius * 2)) + radius,
  };
}

function spawnCollectible() {
  const pos = randomPos(COLLECTIBLE_RADIUS);
  return new Collectible({
    x: pos.x,
    y: pos.y,
    value: Math.floor(Math.random() * 5) + 1,
    id: 'item-' + Math.random().toString(36).slice(2, 9),
    radius: COLLECTIBLE_RADIUS,
  });
}

function serializePlayers() {
  const out = {};
  Object.keys(players).forEach((id) => {
    const p = players[id];
    out[id] = {
      id: p.id,
      x: p.x,
      y: p.y,
      score: p.score,
      avatar: p.avatar,
      radius: p.radius,
    };
  });
  return out;
}

io.on('connection', (socket) => {
  const pos = randomPos(PLAYER_RADIUS);
  const newPlayer = new Player({
    id: socket.id,
    x: pos.x,
    y: pos.y,
    score: 0,
    radius: PLAYER_RADIUS,
    avatar: '🙂',
    speed: MOVE_SPEED,
  });

  players[socket.id] = newPlayer;

  // send initial state to the newly connected player
  socket.emit('init', {
    selfId: socket.id,
    players: serializePlayers(),
    collectible,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  });

  // notify everyone else
  socket.broadcast.emit('player-joined', {
    player: players[socket.id],
  });

  socket.on('move-player', (dir) => {
    const player = players[socket.id];
    if (!player) return;
    if (!['up', 'down', 'left', 'right'].includes(dir)) return;

    player.movePlayer(dir, player.speed);

    // clamp to canvas bounds
    player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y));

    // check collision with collectible
    if (player.collision(collectible)) {
      player.score += collectible.value;
      collectible = spawnCollectible();
      io.emit('collectible-update', collectible);
    }

    io.emit('state-update', serializePlayers());
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('player-left', { id: socket.id });
    io.emit('state-update', serializePlayers());
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

export default app; // for testing
