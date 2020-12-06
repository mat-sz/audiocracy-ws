import WebSocket from 'ws';
import bcrypt from 'bcrypt';

const downvoteThreshold = 3;
const password = process.env.SERVER_PASSWORD;

let clients: WebSocket[] = [];

setInterval(() => {
  clients = clients.filter(client => client.readyState <= 1);
}, 5000);

export function broadcast(object: any) {
  let str = JSON.stringify(object);
  for (let client of clients) {
    if (client.readyState !== 1) continue;
    client.send(str);
  }
}

export function send(client: WebSocket, object: any) {
  if (client.readyState !== 1) return;
  client.send(JSON.stringify(object));
}

export function add(
  client: WebSocket,
  queue: any,
  play: any,
  player: any,
  ip: string
) {
  clients.push(client);
  send(client, queue.state());

  client.on('message', async data => {
    try {
      let object = JSON.parse(data as string);
      switch (object.type) {
        case 'add':
          let added = await queue.add(object.url);
          if (added === true) {
            if (!queue.current()) {
              queue.next();
              play();
            }

            broadcast(queue.state());
          } else {
            send(client, {
              type: 'message',
              text: added,
            });
          }
          break;
        case 'state':
          send(client, queue.state());
          break;
        case 'downvote':
          queue.downvote(ip);

          if (queue.downvoteCount() >= downvoteThreshold) {
            player.stop();
          } else {
            broadcast({
              type: 'downvotes',
              count: queue.downvoteCount(),
            });
          }
          break;
        case 'skip':
          if (!object.password) return;
          if (await bcrypt.compare(object.password, password)) {
            player.stop();
          }
          break;
      }
    } catch (e) {}
  });
}
