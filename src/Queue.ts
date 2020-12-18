import { Message, QueueItem } from './types/Models';

import { scrapers } from './scrapers';
import { MessageType } from './types/MessageType';

export class Queue {
  private _current: QueueItem = null;
  private _queue: QueueItem[] = [];
  private _downvotes: string[] = [];

  constructor(private play: any) {}

  async add(url: string): Promise<Message> {
    url.trim();
    let selected = null;
    for (let scraper of scrapers) {
      if (scraper.regex.test(url)) {
        selected = scraper;
        break;
      }
    }

    if (!selected) {
      selected = scrapers[0];
      const results = await selected.search(url);

      if (!results || results.length === 0) {
        return {
          type: MessageType.MESSAGE,
          text: 'Not found.',
        };
      }

      return {
        type: MessageType.SEARCH,
        items: results,
      };
    }

    let info = await selected.scrape(url);
    if (!info) {
      return {
        type: MessageType.MESSAGE,
        text: 'Not found.',
      };
    }

    if (this._queue.find(item => item.id == info.id)) {
      return {
        type: MessageType.MESSAGE,
        text: 'Already in queue.',
      };
    }

    this._queue.push(info);

    if (!this.current) {
      this.next();
      this.play();
    }

    return {
      type: MessageType.STATE,
      ...this.state,
    };
  }

  downvote(ip: string) {
    if (!this._current) {
      return false;
    }

    if (this._downvotes.includes(ip)) {
      return false;
    }

    this._downvotes.push(ip);
    return true;
  }

  next() {
    this._downvotes = [];

    if (this._queue.length == 0) {
      this._current = null;
    } else {
      this._current = this._queue.shift();
    }
  }

  get state() {
    return {
      queue: this._queue,
      current: this._current,
      downvotes: this._downvotes.length,
    };
  }

  get downvoteCount() {
    return this._downvotes.length;
  }

  get current() {
    return this._current;
  }

  downvoted(ip: string) {
    return this._downvotes.includes(ip);
  }
}
