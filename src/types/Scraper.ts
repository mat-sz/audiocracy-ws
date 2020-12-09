import { QueueItem } from './Models';

export interface Scraper {
  regex: RegExp;
  scrape(url: string): Promise<QueueItem>;
  search(text: string): Promise<QueueItem[]>;
}
