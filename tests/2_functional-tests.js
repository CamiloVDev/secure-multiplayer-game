import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import Player from '../public/Player.mjs';
import Collectible from '../public/Collectible.mjs';

chai.use(chaiHttp);
const { assert } = chai;

suite('Functional Tests - Security Headers', () => {
  test('Headers say the site is powered by PHP 7.4.3', (done) => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        assert.equal(res.headers['x-powered-by'], 'PHP 7.4.3');
        done();
      });
  });

  test('Client cannot guess/sniff the MIME type (X-Content-Type-Options)', (done) => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        assert.equal(res.headers['x-content-type-options'], 'nosniff');
        done();
      });
  });

  test('XSS protection header is set', (done) => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        assert.equal(res.headers['x-xss-protection'], '1; mode=block');
        done();
      });
  });

  test('Nothing is cached client-side', (done) => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        assert.include(res.headers['cache-control'], 'no-store');
        done();
      });
  });
});

suite('Unit Tests - Player class', () => {
  test('Player has id, score, x, y', () => {
    const p = new Player({ id: 'abc', x: 10, y: 20, score: 0 });
    assert.exists(p.id);
    assert.exists(p.score);
    assert.exists(p.x);
    assert.exists(p.y);
  });

  test('movePlayer moves the player up', () => {
    const p = new Player({ id: 'abc', x: 10, y: 20, score: 0 });
    p.movePlayer('up', 5);
    assert.equal(p.y, 15);
    assert.equal(p.x, 10);
  });

  test('movePlayer moves the player down/left/right', () => {
    const p = new Player({ id: 'abc', x: 10, y: 20, score: 0 });
    p.movePlayer('down', 5);
    assert.equal(p.y, 25);
    p.movePlayer('left', 3);
    assert.equal(p.x, 7);
    p.movePlayer('right', 10);
    assert.equal(p.x, 17);
  });

  test('calculateRank returns correct rank string', () => {
    const a = new Player({ id: 'a', x: 0, y: 0, score: 3 });
    const b = new Player({ id: 'b', x: 0, y: 0, score: 5 });
    const rankA = a.calculateRank([a, b]);
    const rankB = b.calculateRank([a, b]);
    assert.equal(rankA, 'Rank: 2/2');
    assert.equal(rankB, 'Rank: 1/2');
  });

  test('collision detects overlap with a collectible', () => {
    const p = new Player({ id: 'a', x: 100, y: 100, score: 0, radius: 20 });
    const closeItem = new Collectible({ id: 'i1', x: 105, y: 100, value: 1, radius: 10 });
    const farItem = new Collectible({ id: 'i2', x: 500, y: 500, value: 1, radius: 10 });
    assert.isTrue(p.collision(closeItem));
    assert.isFalse(p.collision(farItem));
  });
});

suite('Unit Tests - Collectible class', () => {
  test('Collectible has id, value, x, y', () => {
    const c = new Collectible({ id: 'i1', x: 1, y: 2, value: 3 });
    assert.exists(c.id);
    assert.exists(c.value);
    assert.exists(c.x);
    assert.exists(c.y);
  });
});
