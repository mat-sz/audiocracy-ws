import { ContentStreamType, YouTube } from 'media-api';
import { URL } from 'url';

import { Scraper } from '../types/Scraper';
import { QueueItem } from '../types/Models';

const regex = /http(?:s):\/\/(?:www\.)youtu(?:\.be|be\.com)\/watch\?v=([a-zA-Z0-9_-]{11})$/;
const youtube = new YouTube();
const cache: Record<string, QueueItem> = {};
const scrapeId = async (id: string) => {
  if (cache[id]) {
    const item = cache[id];
    if (item.expiresAt.getTime() > new Date().getTime()) {
      return item;
    } else {
      delete cache[id];
    }
  }

  const content = await youtube.content(id);
  let streamUrl = null;
  for (let stream of content.streams.sort(
    (a, b) => (b.bitrate || 0) - (a.bitrate || 0)
  )) {
    if (stream.type === ContentStreamType.AUDIO) {
      streamUrl = stream.url;
      break;
    }
  }

  if (!streamUrl) {
    return null;
  }

  const urlObject = new URL(streamUrl);
  let expiresAt = new Date();

  if (urlObject?.searchParams?.get('expire')) {
    expiresAt = new Date(parseInt(urlObject.searchParams.get('expire')) * 1000);

    expiresAt.setHours(expiresAt.getHours() - 1);
  } else {
    expiresAt.setHours(expiresAt.getHours() + 1);
  }

  cache[content.id] = {
    id: content.id,
    url: content.url,
    stream: streamUrl,
    title: content.title,
    author: content.author?.name,
    thumbnail: content.thumbnails?.[0]?.url,
    duration: content.duration,
    website: 'youtube',
    expiresAt,
  };

  return cache[content.id];
};

export const YouTubeScraper: Scraper = {
  id: 'youtube',
  regex,
  scrape: async (url: string) => {
    const match = regex.exec(url);
    if (!match?.[1]) {
      return null;
    }

    return await scrapeId(match[1]);
  },
  scrapeId,
  search: async (text: string) => {
    const results = await youtube.search(text);

    return results.contents?.map(content => ({
      id: content.id,
      url: content.url,
      title: content.title,
      author: content.author?.name,
      thumbnail: content.thumbnails?.[0]?.url,
      duration: content.duration,
      website: 'youtube',
    }));
  },
};
