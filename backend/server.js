const io = require('socket.io')({
  cors: {
    origin: '*',
  },
});

let entities = [];
let id = 0;

// Create new entity each 100ms and send to client
setInterval(() => {
  let newEntity = new Ent();
  entities.push(newEntity);

  for (const key in connectedClients) {
    let client = connectedClients[key];
    client.emit('new_entities', [newEntity]);
  }
}, 100);

// Create random updates for client to do.
setInterval(() => {
  let updated = [];
  let am = random(1, 5);
  for (let i = 0; i < am; i++) {
    let pick = random(entities);
    pick.xs = -1 + Math.random() * 2;
    pick.ys = -1 + Math.random() * 2;
    updated.push(pick);
  }

  for (const key in connectedClients) {
    let client = connectedClients[key];
    client.emit('updated_entities', updated);
  }
}, 250);

// update entities and remove any that get deleted. also send message to client about it.
setInterval(() => {
  entities.forEach((entity) => {
    entity.update();
  });
  for (let i = entities.length - 1; i >= 0; i--) {
    if (entities[i].remove) {
      entities.splice(i, 1);
      for (const key in connectedClients) {
        let client = connectedClients[key];
        client.emit('delete_entity', entities[i].id);
      }
    }
  }
}, 60 / 1000);

let connectedClients = {};

io.on('connection', (socket) => {
  // console.log('socket.id',socket.id);
  socket.emit('init', socket.id);

  socket.on('join_game', () => {
    console.log('joinGame');
    // Send entities to client when joined
    connectedClients[socket.id] = socket;
    socket.emit('new_entities', entities);
  });

  socket.on('test_feature', () => {
    console.log('test_feature');
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    delete connectedClients[socket.id];
  });
});

io.listen(process.env.PORT || 3000);

// Simple dummy entity
class Ent {
  constructor() {
    id++;
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.size = 1 + Math.random() * 20;

    this.lifetime = 0;

    this.xs = -1 + Math.random() * 2;
    this.ys = -1 + Math.random() * 2;
  }
  update() {
    this.lifetime += 1;
    if (this.lifetime > 1000) {
      this.remove = true;
    }
    this.x += this.xs;
    this.y += this.ys;
  }
}

// Random function
function random(min, max) {
  var rand;

  rand = Math.random();
  if (typeof min === 'undefined') {
    return rand;
  } else if (typeof max === 'undefined') {
    if (min instanceof Array) {
      return min[Math.floor(rand * min.length)];
    } else {
      return rand * min;
    }
  } else {
    if (min > max) {
      var tmp = min;
      min = max;
      max = tmp;
    }

    return rand * (max - min) + min;
  }
}
