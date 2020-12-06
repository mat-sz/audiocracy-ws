import { QueueItem } from './types/Models';

import * as youtube from './scrapers/youtube';

const scrapers = [youtube];

let current: QueueItem = null;
let queue: QueueItem[] = [];
let downvotes: string[] = [];

function state() {
  return {
    type: 'state',
    queue: queue,
    current: current,
    downvotes: downvotes.length,
  };
}

async function add(url: string) {
  url.trim();
  let selected = null;
  for (let scraper of scrapers) {
    if (scraper.regex.test(url)) {
      selected = scraper;
      break;
    }
  }

  if (!selected) {
    selected = youtube;
    url = 'ytsearch1:' + url;
  }

  let info = await selected.scrape(url);
  if (!info) return 'Not found.';

  if (queue.find(item => item.id == info.id)) return 'Already in queue.';

  queue.push(info);
  return true;
}

function downvote(ip: string) {
  if (!current) return false;
  if (downvotes.includes(ip)) return false;
  downvotes.push(ip);
  return true;
}

function next() {
  downvotes = [];

  if (queue.length == 0) {
    current = null;
  } else {
    current = queue.shift();
  }
}

export default {
  add: add,
  state: state,
  downvote: downvote,
  next: next,
  downvoteCount: () => downvotes.length,
  downvoted: (ip: string) => downvotes.includes(ip),
  current: () => current,
};
