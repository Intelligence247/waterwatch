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
  duplicate_review?: {
    status: 'clear' | 'pending_review' | 'resolved_keep' | 'resolved_merged';
    candidate_waterpoint_id: string | null;
    distance_meters: number | null;
    flagged_at: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    resolution_note: string;
  };
  created_at: string;
  updated_at: string;
}
