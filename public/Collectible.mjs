class Collectible {
  constructor({ x, y, value = 1, id, radius = 10 }) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.id = id;
    this.radius = radius;
  }
}

export default Collectible;
