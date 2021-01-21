import io from 'socket.io-client';
import { uiState } from './uiStateStore';

const socket = io('http://192.168.0.10:3000');

socket.on('init', function (id) {
  console.log('init! id', id);
});

let entities = {};

socket.on('delete_entity', function (id) {
  // When delete entity gets called from the server it removes this entity. whether it exists or not.
  console.log('delete entity id', id);
  delete entities[id];
});

socket.on('new_entities', function (data) {
  // recieve inital entities.
  console.log('data', data);

  data.forEach((entry) => {
    let newEntity = new ClientEnt();
    Object.assign(newEntity, entry);
    newEntity.ready = true;
    entities[newEntity.id] = newEntity;
  });
  uiState.set('playing');
});

socket.on('updated_entities', function (data) {
  console.log('data', data);

  // update entities. if they exist. otherwise just ignore.
  data.forEach((entry) => {
    let updatedEntity = entities[entry.id];
    if (updatedEntity) {
      console.log('entity exists. updating');
      Object.assign(updatedEntity, entry);
    } else {
      console.log('entity doesnt exist,');
      // Could create a new entity here but might be useless if it already gets deleted after
    }
  });
});

function joinGame() {
  socket.emit('join_game');
  uiState.set('loading');
}
let lastTick = 0;

function onStep() {
  // Step loop, handles changes that have to be made before rendering.

  let newTime = Date.now();
  let client_dt = (newTime - lastTick) / 1000;

  lastTick = newTime;

  for (const key in entities) {
    let entity = entities[key];
    if (!entity.ready) return;
    entity.step(client_dt);
  }
}

function onRender() {
  // Render anything that needs to be rendered
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  for (const key in entities) {
    let entity = entities[key];
    if (!entity.ready) return;
    entity.render(ctx);
  }
  ctx.restore();
}

let canvas,
  ctx,
  frameWidth,
  frameHeight,
  scale = 1,
  width,
  height;

function initCanvas() {
  canvas = document.getElementById('main-canvas');
  ctx = canvas.getContext('2d');

  setCanvasDimensionsAndScale();

  window.addEventListener('resize', setCanvasDimensionsAndScale);

  requestAnimationFrame(onProcess);
}

function setCanvasDimensionsAndScale() {
  // Set values for use in canvases. same across all 3

  let w = window.innerWidth;
  let h = window.innerHeight;

  console.log('w', w);
  console.log('h', h);

  frameWidth = Math.ceil(w / scale);
  frameHeight = Math.ceil(h / scale);

  width = frameWidth;
  height = frameHeight;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = frameWidth + 'px';
  canvas.style.height = frameHeight + 'px';
  canvas.style.transform = `scale(${scale})`;
  ctx.imageSmoothingEnabled = false;
}

function onProcess() {
  onStep();
  onRender();
  requestAnimationFrame(onProcess);
}

// Simple client entity
class ClientEnt {
  constructor() {
    this.ready = false;
  }

  step() {
    this.lifetime += 1;
    if (this.lifetime > 900) {
      delete entities[this.id];
    }
    this.x += this.xs;
    this.y += this.ys;
  }

  render(ctx) {
    ctx.save();

    ctx.fillStyle = '#000000';
    ctx.translate(this.x, this.y);
    ctx.fillRect(0, 0, this.size, this.size);
    ctx.restore();
  }
}

export { joinGame, initCanvas };
