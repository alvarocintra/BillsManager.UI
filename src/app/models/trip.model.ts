export interface TripAttachment {
  id: string;
  title: string;
  description?: string | null;
  kind: 'link' | 'file';
  url?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  gridFsId?: string | null;
  isPhoto?: boolean;
}

export interface TripActivity {
  id: string;
  order: number;
  title: string;
  time?: string | null;
  notes?: string | null;
  price?: number | null;
}

export interface TripDay {
  id: string;
  dayNumber: number;
  title: string;
  date?: Date | null;
  notes?: string | null;
  activities: TripActivity[];
  attachments: TripAttachment[];
}

export interface Trip {
  id: string;
  name: string;
  destination?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  days: TripDay[];
  attachments: TripAttachment[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}
