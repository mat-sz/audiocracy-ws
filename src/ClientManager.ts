import bcrypt from 'bcrypt';
import NodeMpv from 'node-mpv';

import { Client } from './types/Client';
import {
  DownvotesMessageModel,
  MessageModel,
  PingMessageModel,
} from './types/Models';
import { MessageType } from './types/MessageType';
import Queue from './queue';
import {
  isAddMessageModel,
  isDownvoteMessageModel,
  isSkipMessageModel,
} from './types/typeChecking';

const downvoteThreshold = 3;
const password = process.env.SERVER_PASSWORD;

export class ClientManager {
  private clients: Client[] = [];

  constructor(
    private queue: typeof Queue,
    private play: any,
    private player: NodeMpv
  ) {}

  addClient(client: Client) {
    this.clients.push(client);
    client.send(this.queue.state() as any);
  }

  async handleMessage(client: Client, message: MessageModel) {
    client.lastSeen = new Date();

    if (isAddMessageModel(message)) {
      let added = await this.queue.add(message.url);
      if (added === true) {
        if (!this.queue.current()) {
          this.queue.next();
          this.play();
        }

        this.broadcast(this.queue.state() as any);
      } else {
        client.send({
          type: 'message',
          text: added,
        });
      }
    } else if (isDownvoteMessageModel(message)) {
      this.queue.downvote(client.remoteAddress);

      if (this.queue.downvoteCount() >= downvoteThreshold) {
        this.player.stop();
      } else {
        this.broadcast({
          type: MessageType.DOWNVOTES,
          count: this.queue.downvoteCount(),
        } as DownvotesMessageModel);
      }
    } else if (isSkipMessageModel(message)) {
      if (!message.password) return;
      if (await bcrypt.compare(message.password, password)) {
        this.player.stop();
      }
    }
  }

  broadcast(message: MessageModel) {
    const data = JSON.stringify({
      ...message,
    });

    this.clients.forEach(client => client.send(data));
  }

  pingClients() {
    const pingMessage = JSON.stringify({
      type: MessageType.PING,
      timestamp: new Date().getTime(),
    } as PingMessageModel);

    this.clients.forEach(client => {
      if (client.readyState !== 1) return;

      try {
        client.send(pingMessage);
      } catch {
        this.removeClient(client);
        client.close();
      }
    });
  }

  removeClient(client: Client) {
    this.clients = this.clients.filter(c => c !== client);
  }

  removeBrokenClients() {
    this.clients = this.clients.filter(client => client.readyState <= 1);
  }

  removeInactiveClients() {
    const minuteAgo = new Date(Date.now() - 1000 * 20);

    this.clients.forEach(client => {
      if (client.readyState !== 1) return;

      if (client.lastSeen < minuteAgo) {
        this.removeClient(client);
        client.close();
      }
    });
  }
}
