import { MessageType } from './MessageType';

export interface MessageModel {
  type: MessageType;
}

export interface StateMessageModel extends MessageModel, ServerState {
  type: MessageType.STATE;
}

export interface MessageMessageModel extends MessageModel {
  type: MessageType.MESSAGE;
  text: string;
}

export interface DownvotesMessageModel extends MessageModel {
  type: MessageType.DOWNVOTES;
  count: number;
}

export interface TimeMessageModel extends MessageModel {
  type: MessageType.TIME;
  time: number;
}

export interface AddMessageModel extends MessageModel {
  type: MessageType.ADD;
  url: string;
}

export interface DownvoteMessageModel extends MessageModel {
  type: MessageType.DOWNVOTE;
}

export interface SkipMessageModel extends MessageModel {
  type: MessageType.SKIP;
  password: string;
}

export type Message =
  | StateMessageModel
  | MessageMessageModel
  | DownvotesMessageModel
  | TimeMessageModel
  | AddMessageModel
  | DownvoteMessageModel
  | SkipMessageModel;

export interface QueueItem {
  id: string;
  url?: string;
  stream: string;
  title: string;
  author?: string;
  thumbnail?: string;
  duration: number;
  website: string;
}

export interface ServerState {
  queue: QueueItem[];
  current: QueueItem;
  downvotes: number;
}
