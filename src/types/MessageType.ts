export enum MessageType {
  // Sent:
  STATE = 'state',
  MESSAGE = 'message',
  DOWNVOTES = 'downvotes',
  TIME = 'time',
  SEARCH = 'search',

  // Recieved:
  DOWNVOTE = 'downvote',
  ADD = 'add',
  SKIP = 'skip',
  PING = 'ping',
}
