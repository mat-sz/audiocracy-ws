import dotenv from 'dotenv-flow';
dotenv.config();

import Koa from 'koa';
import Router from '@koa/router';
import websockify from 'koa-websocket';

import { WSClient } from './WSClient';
import { ClientManager } from './ClientManager';
import { Queue } from './Queue';
import { MessageType } from './types/MessageType';
import { StateMessageModel, TimeMessageModel } from './types/Models';
import { isMessageModel } from './types/typeChecking';
import { scrapers } from './scrapers';

const app = websockify(new Koa());
const router = new Router();

async function App() {
  const host = process.env.WS_HOST || '127.0.0.1';
  const port = parseInt(process.env.WS_PORT) || 8000;
  const queue = new Queue(play);

  const clientManager = new ClientManager(queue);

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

  router.get('/stream', async ctx => {
    if (!ctx.query['id'] || !ctx.query['service']) {
      ctx.res.end(
        JSON.stringify({ error: 'Unsupported service or missing id.' })
      );
      return;
    }

    const id = ctx.query['id'];
    const service = ctx.query['service'];
    const scraper = scrapers.find(scraper => scraper.id === service);

    if (!scraper) {
      ctx.res.end(JSON.stringify({ error: 'Unsupported service.' }));
      return;
    }

    try {
      const item = await scraper.scrapeId(id);

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

    // TODO: New playback logic.
    clientManager.broadcast({
      type: MessageType.STATE,
      ...queue.state,
    } as StateMessageModel);
  }

  app.use(router.routes()).use(router.allowedMethods());
  app.listen(port, host);
}

App();
