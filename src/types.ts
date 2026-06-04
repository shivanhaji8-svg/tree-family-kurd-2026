export interface Person {
  id: string;
  name: string;
  parentId: string | null;
  birthYear?: string;
  birthPlace?: string;
  notes?: string;
  createdAt: string;
  colorTheme?: 'teal' | 'blue' | 'emerald' | 'amber' | 'rose';
}

export interface FamilyPhoto {
  id: string;
  url: string; // Base64 data url or object URL
  caption: string;
  dateAdded: string;
  personId?: string; // Optional link to a specific ancestor / person
}

export interface TreeData {
  projectName: string;
  authorName: string;
  phoneNumber: string;
  whatsappNumber: string;
  lastSavedAt: string;
  members: Person[];
  photos: FamilyPhoto[];
}

export type ViewMode = 'tree' | 'table';

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}
