export enum MessageType {
  // Received:
  STATE = 'state',
  MESSAGE = 'message',
  DOWNVOTES = 'downvotes',
  TIME = 'time',

  // Sent:
  DOWNVOTE = 'downvote',
  ADD = 'add',
  SKIP = 'skip',
  PING = 'ping',
}
