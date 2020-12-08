import { ContentStreamType, YouTube } from 'media-api';

import { Scraper } from '../types/Scraper';

const regex = /http(?:s):\/\/(?:www\.)youtu(?:\.be|be\.com)\/watch\?v=([a-zA-Z0-9_-]{11})$/;

export const YouTubeScraper: Scraper = {
  regex,
  scrape: async (url: string) => {
    const youtube = new YouTube();
    const match = regex.exec(url);
    if (!match[1]) {
      return null;
    }

    const content = await youtube.content(match[1]);
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

    return {
      id: content.id,
      url,
      stream: streamUrl,
      title: content.title,
      author: content.author?.name,
      thumbnail: content.thumbnails?.[0]?.url,
      duration: content.duration,
      website: 'youtube',
    };
  },
};
