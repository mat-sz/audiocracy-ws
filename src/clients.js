const bcrypt = require('bcrypt');

const downvoteThreshold = 3;
const password = process.env.SERVER_PASSWORD;

let clients = [];

setInterval(() => {
  clients = clients.filter(client => client.readyState <= 1);
}, 5000);

function broadcast(object) {
  let str = JSON.stringify(object);
  for (let client of clients) {
    if (client.readyState !== 1) continue;
    client.send(str);
  }
}

function send(client, object) {
  if (client.readyState !== 1) return;
  client.send(JSON.stringify(object));
}

function add(client, queue, play, player) {
  const ip = client._socket.remoteAddress;
  clients.push(client);
  send(client, queue.state());

  client.on('message', async data => {
    try {
      let object = JSON.parse(data);
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

module.exports = {
  add: add,
  broadcast: broadcast,
};
