import mpv from 'node-mpv';
import WebSocket from 'ws';

import queue from './queue';
import * as clients from './clients';

export default async function App() {
  const player = new mpv({
    audio_only: true,
  });

  await player.start();

  const host = process.env.WS_HOST || '127.0.0.1';
  const port = parseInt(process.env.WS_PORT) || 8000;

  const wss = new WebSocket.Server({ host, port });
  wss.on('connection', (client, req) => {
    clients.add(client, queue, play, player, req.connection.remoteAddress);
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

  (player as any).on('started', () => {
    time = 0;
    playing = true;
  });

  (player as any).on('stopped', () => {
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
}
