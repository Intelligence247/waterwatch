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
    candidate_waterpoint_name?: string | null;
    distance_meters: number | null;
    flagged_at: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    resolution_note: string;
  };
  created_at: string;
  updated_at: string;
}

export const KWARA_LGAS = [
  'Asa',
  'Baruten',
  'Edu',
  'Ekiti',
  'Ifelodun',
  'Ilorin East',
  'Ilorin South',
  'Ilorin West',
  'Irepodun',
  'Isin',
  'Kaiama',
  'Moro',
  'Offa',
  'Oke Ero',
  'Oyun',
  'Pategi',
] as const;

export type UserStatus = 'active' | 'suspended' | 'blocked';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'citizen';
  phone?: string | null;
  community?: string | null;
  lga?: string | null;
  emailVerified: boolean;
  status: UserStatus;
  statusReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
