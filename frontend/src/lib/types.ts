export type WaterpointType = 'borehole' | 'well' | 'tap';
export type WaterpointStatus = 'functional' | 'faulty' | 'under_repair';

export interface Waterpoint {
  id: string;
  name: string;
  type: WaterpointType;
  status: WaterpointStatus;
  latitude: number;
  longitude: number;
  community: string;
  lga: string;
  description: string;
  photo_url: string;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}
