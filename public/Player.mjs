class Player {
  constructor({ x, y, score = 0, id, avatar = '🙂', radius = 20, speed = 5 }) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.avatar = avatar;
    this.radius = radius;
    this.speed = speed;
  }

  // direction: 'up' | 'down' | 'left' | 'right'
  // pixels: number of pixels to move
  movePlayer(dir, pixels) {
    switch (dir) {
      case 'up':
        this.y -= pixels;
        break;
      case 'down':
        this.y += pixels;
        break;
      case 'left':
        this.x -= pixels;
        break;
      case 'right':
        this.x += pixels;
        break;
      default:
        break;
    }
  }

  // collectible: { x, y, value, id, radius }
  collision(item) {
    const itemRadius = item.radius || 10;
    const dx = this.x - item.x;
    const dy = this.y - item.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + itemRadius;
  }

  // players: array of all player objects (including this one)
  // returns "Rank: currentRanking/totalPlayers"
  calculateRank(players) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const currentRanking = sorted.findIndex((p) => p.id === this.id) + 1;
    return `Rank: ${currentRanking}/${players.length}`;
  }
}

export default Player;
