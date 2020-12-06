export interface QueueItem {
  id: string;
  url?: string;
  stream: string;
  title: string;
  author?: string;
  thumbnail?: string;
  duration: number;
  website: string;
}
