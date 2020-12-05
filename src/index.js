const dotenv = require('dotenv-flow');
dotenv.config();

const mpv = require('node-mpv');
const express = require('express');

const player = new mpv({
  audio_only: true,
});

const queue = require('./queue');
const clients = require('./clients');

const app = express();
const port = +process.env.SERVER_PORT;
const expressWs = require('express-ws')(app);

app.ws('/ws', client => {
  clients.add(client, queue, play, player);
});

app.use(express.static('public'));

app.listen(port);

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
