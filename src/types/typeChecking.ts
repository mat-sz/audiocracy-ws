import {
  AddMessageModel,
  DownvoteMessageModel,
  MessageModel,
  SkipMessageModel,
} from './Models';
import { MessageType } from './MessageType';

export function isMessageModel(message: any): message is MessageModel {
  return message && 'type' in message && typeof message['type'] === 'string';
}

export function isAddMessageModel(
  message: MessageModel
): message is AddMessageModel {
  return (
    message.type === MessageType.ADD &&
    'url' in message &&
    typeof message['url'] === 'string'
  );
}

export function isSkipMessageModel(
  message: MessageModel
): message is SkipMessageModel {
  return (
    message.type === MessageType.SKIP &&
    'password' in message &&
    typeof message['password'] === 'string'
  );
}

export function isDownvoteMessageModel(
  message: MessageModel
): message is DownvoteMessageModel {
  return message.type === MessageType.DOWNVOTE;
}
