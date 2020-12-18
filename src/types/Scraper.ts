import { QueueItem } from './Models';

export interface Scraper {
  id: string;
  regex: RegExp;
  scrape(url: string): Promise<QueueItem>;
  scrapeId(id: string): Promise<QueueItem>;
  search(text: string): Promise<QueueItem[]>;
}
