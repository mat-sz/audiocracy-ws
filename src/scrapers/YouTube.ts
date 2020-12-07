import { execFile } from 'child_process';

import { Scraper } from '../types/Scraper';

export const YouTube: Scraper = {
  regex: /http(s):\/\/(www\.)youtu(\.be|be\.com)\/watch\?v=([a-zA-Z0-9_-]{11})$/,
  scrape: (url: string) => {
    return new Promise((resolve, _) => {
      execFile('youtube-dl', ['-j', url], (err, stdout, stderr) => {
        if (err) {
          resolve(null);
          return;
        }

        try {
          let response = JSON.parse(stdout);

          let url = null;
          for (let format of response['formats']) {
            if (format['acodec'] != 'none' && format['vcodec'] == 'none') {
              url = format['url'];
            }
          }

          if (!url) {
            resolve(null);
          } else {
            resolve({
              id: response['id'],
              url: response['webpage_url'],
              stream: url,
              title: response['title'],
              author: response['uploader'],
              thumbnail: response['thumbnail'],
              duration: +response['duration'],
              website: 'youtube',
            });
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
  },
};
