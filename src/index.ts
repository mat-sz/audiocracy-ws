import dotenv from 'dotenv-flow';
dotenv.config();

import mpv from 'node-mpv';
import Koa from 'koa';
import Router from '@koa/router';
import websockify from 'koa-websocket';

import { WSClient } from './WSClient';
import { ClientManager } from './ClientManager';
import { Queue } from './Queue';
import { MessageType } from './types/MessageType';
import { StateMessageModel, TimeMessageModel } from './types/Models';
import { isMessageModel } from './types/typeChecking';
import { YouTubeScraper } from './scrapers/YouTube';

const app = websockify(new Koa());
const router = new Router();

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

  router.get('/stream', async (ctx, next) => {
    if (!ctx.query['id'] || !ctx.query['service']) {
      ctx.res.end(
        JSON.stringify({ error: 'Unsupported service or missing id.' })
      );
      return;
    }

    if (ctx.query['service'] !== 'youtube') {
      ctx.res.end(JSON.stringify({ error: 'Unsupported service.' }));
      return;
    }

    try {
      const item = await YouTubeScraper.scrape(
        'https://www.youtube.com/watch?v=' + ctx.query['id']
      );

      if (!item || !item.stream) {
        ctx.res.end(JSON.stringify({ error: 'Invalid id.' }));
        return;
      }

      ctx.redirect(item.stream);
    } catch (e) {
      ctx.res.end(JSON.stringify({ error: 'Error.' }));
      return;
    }
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

  app.use(router.routes()).use(router.allowedMethods());
  app.listen(port, host);
}

App();
