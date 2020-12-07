import { QueueItem } from './types/Models';

import { YouTube } from './scrapers/YouTube';
import { Scraper } from './types/Scraper';

const scrapers: Scraper[] = [YouTube];

export class Queue {
  private _current: QueueItem = null;
  private _queue: QueueItem[] = [];
  private _downvotes: string[] = [];

  async add(url: string) {
    url.trim();
    let selected = null;
    for (let scraper of scrapers) {
      if (scraper.regex.test(url)) {
        selected = scraper;
        break;
      }
    }

    if (!selected) {
      selected = YouTube;
      url = 'ytsearch1:' + url;
    }

    let info = await selected.scrape(url);
    if (!info) return 'Not found.';

    if (this._queue.find(item => item.id == info.id))
      return 'Already in queue.';

    this._queue.push(info);
    return true;
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
      type: 'state',
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
