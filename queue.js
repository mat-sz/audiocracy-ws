const youtube = require('./scrapers/youtube');

const scrapers = [youtube];

let current = null;
let queue = [];
let downvotes = [];

function state(skipStream = true) {
  return {
    type: 'state',
    queue: queue.map(item => {
      let newItem = { ...item };
      delete newItem['stream'];
      return newItem;
    }),
    current: current,
    downvotes: downvotes.length,
  };
}

async function add(url) {
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

function downvote(ip) {
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

module.exports = {
  add: add,
  state: state,
  downvote: downvote,
  next: next,
  downvoteCount: () => downvotes.length,
  downvoted: ip => downvotes.includes(ip),
  current: () => current,
};
