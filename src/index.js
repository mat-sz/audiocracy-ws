const dotenv = require('dotenv-flow');
dotenv.config();

const mpv = require('node-mpv');
const WebSocket = require('ws');

const player = new mpv({
  audio_only: true,
});

const queue = require('./queue');
const clients = require('./clients');

const host = process.env.WS_HOST || '127.0.0.1';
const port = parseInt(process.env.WS_PORT) || 8000;

const wss = new WebSocket.Server({ host, port });
wss.on('connection', client => {
  clients.add(client, queue, play, player);
});

let time = 0;
let playing = false;

function play() {
  if (!queue.current()) {
    clients.broadcast(queue.state());
    return;
  }

  player.load(queue.current().stream);
  player.play();
  clients.broadcast(queue.state());
}

player.on('started', number => {
  time = 0;
  playing = true;
});

player.on('stopped', () => {
  playing = false;
  time = 0;
  queue.next();
  play();
});

setInterval(() => {
  if (playing) {
    time++;
    clients.broadcast({
      type: 'time',
      time: time,
    });
  }
}, 1000);
