import dotenv from 'dotenv-flow';
dotenv.config();

import mpv from 'node-mpv';
import Koa from 'koa';
import router from '@koa/router';
import websockify from 'koa-websocket';

import { WSClient } from './WSClient';
import { ClientManager } from './ClientManager';
import { Queue } from './Queue';
import { MessageType } from './types/MessageType';
import { StateMessageModel, TimeMessageModel } from './types/Models';
import { isMessageModel } from './types/typeChecking';

const app = websockify(new Koa());

async function App() {
  const player = new mpv({
    audio_only: true,
  });

  await player.start();

  const host = process.env.WS_HOST || '127.0.0.1';
  const port = parseInt(process.env.WS_PORT) || 8000;
  const queue = new Queue(play);

  const clientManager = new ClientManager(queue, player);

  app.ws.use(function (ctx, next) {
    if (ctx.websocket) {
      const client = new WSClient(ctx.websocket, ctx.req);
      clientManager.addClient(client);

      ctx.websocket.on('message', (data: string) => {
        // Prevents DDoS and abuse.
        if (!data || data.length > 1024) return;

        try {
          const message = JSON.parse(data);

          if (isMessageModel(message)) {
            clientManager.handleMessage(client, message);
          }
        } catch (e) {}
      });

      ctx.websocket.on('close', () => {
        clientManager.removeClient(client);
      });
    }

    return next();
  });

  setInterval(() => {
    clientManager.removeBrokenClients();
  }, 1000);

  // Ping clients to keep the connection alive (when behind nginx)
  setInterval(() => {
    clientManager.pingClients();
  }, 5000);

  setInterval(() => {
    clientManager.removeInactiveClients();
  }, 10000);

  let time = 0;
  let playing = false;

  function play() {
    if (!queue.current) {
      clientManager.broadcast({
        type: MessageType.STATE,
        ...queue.state,
      } as StateMessageModel);
      return;
    }

    player.load(queue.current.stream);
    player.play();
    clientManager.broadcast({
      type: MessageType.STATE,
      ...queue.state,
    } as StateMessageModel);
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
      clientManager.broadcast({
        type: MessageType.TIME,
        time: time,
      } as TimeMessageModel);
    }
  }, 1000);

  app.listen(port, host);
}

App();
