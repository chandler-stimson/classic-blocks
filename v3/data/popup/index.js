/* global Tetris */

const opt = {
  width: 10,
  height: 20,
  speed: 500 // ms
};

class Block {
  constructor(parent) {
    this.canvas = parent.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.parent = parent;
    this.speed = opt.speed;
    this.score = 0;
  }
  create() {
    this.stage = new Tetris.Stage(opt.width, opt.height);
  }
  add() {
    this.block = new Tetris.Block(
      0 | (opt.width / 2) - 2, 0, 0,
      Tetris.shapes[0 | (Math.random() * Tetris.shapes.length)]
    );
  }
  step() {
    const {block, stage} = this;

    const next = block.fall();
    if (next.ok(stage)) {
      this.block = next;
    }
    else {
      block.put(stage);
      const v = stage.shrink();
      if (v) {
        this.score += v;
      }
      this.add();
      if (this.block.ok(stage) === false) {
        throw Error('Game Over');
      }
    }
    this.draw();
  }
  navigate(action = 'right') {
    const {block, stage} = this;

    const next = block[action]();
    if (next.ok(stage)) {
      this.block = next;
      this.draw();
    }
  }
}
class Render extends Block {
  constructor(...args) {
    super(...args);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const {canvas} = this;
    canvas.width = opt.width;
    canvas.height = opt.height;

    const xz = document.body.scrollWidth / opt.width;
    const yz = document.body.scrollHeight / opt.height;

    canvas.style['image-rendering'] = 'pixelated';
    canvas.style.zoom = Math.floor(Math.min(xz, yz));
  }
  draw() {
    const {block, stage} = this;
    // clean
    this.ctx.clearRect(0, 0, opt.width, opt.height);
    // draw
    const dot = (x, y, color) => {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.rect(x, y, 1, 1);
      this.ctx.fill();
    };
    stage.eachStone(dot);
    block.eachStone(dot);
  }
}
class User extends Render {
  constructor(...args) {
    super(...args);
    document.addEventListener('keydown', e => this.keypress(e));

    this.state = 'ready';
  }
  get state() {
    return this._state || 'ready';
  }
  set state(v) {
    this.parent.dataset.state = v;
    this._state = v;
  }
  get score() {
    return this._score || 0;
  }
  set score(v) {
    this._score = v;

    const s = 500 - Math.floor(v / 10) * 50;

    if (s !== this.speed) {
      this.speed = s;
      this.resume();

      document.getElementById('speed').textContent = (500 - s) / 50 + 1;
    }

    document.getElementById('score').textContent = v;
  }
  step() {
    try {
      super.step();
    }
    catch (e) {
      console.warn(e);
      this.stop('stop');
    }
  }
  resume() {
    console.log(new Error().stack);
    this.state = 'active';
    clearInterval(this.id);
    this.id = setInterval(() => this.step(), this.speed);
  }
  stop(reason = 'paused') {
    clearInterval(this.id);
    this.state = reason;
  }
  keypress(e) {
    if (e.code === 'KeyS') {
      if (['ready', 'end'].some(a => a === this.state) === false) {
        if (confirm('Do you want to start over?') === false) {
          return;
        }
      }
      this.create();
      this.add();
      this.resume();
    }
    else if (this.state === 'end') {
      return;
    }
    else if (e.code === 'KeyR') {
      this.resume();
    }
    else if (this.state === 'active') {
      switch (e.code) {
      case 'ArrowLeft':
      case 'KeyJ':
        this.navigate('left');
        break;
      case 'ArrowRight':
      case 'KeyL':
        this.navigate('right');
        break;
      case 'ArrowUp':
      case 'KeyI':
        this.navigate('rotate');
        break;
      case 'ArrowDown':
      case 'KeyK':
        this.stop();
        this.step();
        this.resume();
        break;
      case 'KeyP':
        this.stop();
        break;
      }
    }
  }
}

const cb = new User(document.getElementById('parent'));
const args = new URLSearchParams(location.search);
if (args.get('action') === 'start') {
  cb.keypress({
    code: 'KeyS'
  });
}
