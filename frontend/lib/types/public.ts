export interface PersonSummary {
  id: string;
  studentCode: string;
  fullName: string;
  institutionalEmail: string;
  publicDescription?: string | null;
  photoUrl?: string | null;
  instagramUrl?: string | null;
  instagramLabel?: string | null;
}

export interface RepresentativeMandate {
  id: string;
  estateType: string;
  faculty: string;
  program: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status?: 'ACTIVE' | 'ENDED';
  person: PersonSummary;
}

export interface Leader {
  id: string;
  faculty: string;
  program: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
  person: PersonSummary;
}

export interface BoardMandate {
  id: string;
  position: string;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
  person: PersonSummary;
}

export interface EventPhoto {
  id: string;
  photoUrl: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface EventTimeSlot {
  startTime: string;
  endTime: string;
  label?: string | null;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timeSlots?: EventTimeSlot[];
  location: string;
  computedStatus: 'PROXIMO' | 'EN_REALIZACION' | 'FINALIZADO';
}

export interface EventDetail extends EventSummary {
  startTime: string;
  endTime: string;
  content?: string | null;
  photos: EventPhoto[];
}

export interface NewsSummary {
  id: string;
  slug: string;
  title: string;
  content: string;
  publishedAt?: string | null;
  coverPhotoUrl?: string | null;
}

export interface NewsDetail extends NewsSummary {
  coverPhotoUrl?: string | null;
  createdAt?: string;
}

export interface DocumentSummary {
  id: string;
  category: 'ESTATUTOS' | 'REGLAMENTOS' | 'LINEAMIENTOS' | 'COMUNICADOS';
  title: string;
  description?: string | null;
  publishedAt: string;
}
