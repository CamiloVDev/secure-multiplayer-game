# Secure Real Time Multiplayer Game

Proyecto de freeCodeCamp: juego multijugador 2D en tiempo real usando HTML Canvas + Socket.io, con cabeceras de seguridad.

## Cómo correrlo

```bash
npm install
npm start
```

Luego abre `http://localhost:3000`.

## Cómo correr los tests

```bash
npm test
```

## Estructura

- `server.js` — Express + Socket.io + Helmet (seguridad) + lógica del juego en el servidor (fuente de verdad).
- `public/Player.mjs` — Clase `Player` (movimiento, colisión, ranking). Usada tanto en servidor como en cliente.
- `public/Collectible.mjs` — Clase `Collectible`.
- `public/client.js` — Lógica de renderizado en `<canvas>` y captura de teclado (WASD / flechas).
- `views/index.html` — Página principal.
- `tests/` — Tests Mocha/Chai (headers de seguridad + unit tests de las clases).

## Controles

- Flechas o W A S D para mover el avatar.
- El círculo verde es tu jugador; los rojos son otros jugadores.
- Toca el objeto amarillo (collectible) para sumar puntos.
- El ranking se actualiza en vivo arriba del canvas.

## Seguridad implementada

- `helmet.noSniff()` → evita que el navegador adivine el MIME type.
- `helmet.xssFilter()` → mitigación XSS.
- `helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' })` → oculta que es Express y simula PHP 7.4.3.
- `nocache()` → evita cualquier caching del lado del cliente.
- `helmet.frameguard({ action: 'deny' })` → evita clickjacking (extra).
