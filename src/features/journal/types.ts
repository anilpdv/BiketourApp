// Journal entry
export interface JournalEntry {
  id: string;
  date: string;              // ISO date string
  title: string;
  content: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  routeId: string | null;
  distanceKm: number | null; // Distance cycled that day
  photos: JournalPhoto[];
  weatherCode: number | null;
  temperature: number | null;
  mood: JournalMood | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Photo attachment
export interface JournalPhoto {
  id: string;
  uri: string;              // Local file URI
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  width: number;
  height: number;
}

// Mood options
export type JournalMood = 'amazing' | 'good' | 'okay' | 'tired' | 'challenging';

// Entry summary for list view
export interface JournalEntrySummary {
  id: string;
  date: string;
  title: string;
  previewText: string;
  photoCount: number;
  thumbnailUri: string | null;
  mood: JournalMood | null;
}

// Journal statistics
export interface JournalStats {
  totalEntries: number;
  totalPhotos: number;
  entriesThisMonth: number;
  longestStreak: number;
  currentStreak: number;
  countriesVisited: string[];
}

// Export options
export interface JournalExportOptions {
  format: 'pdf' | 'html' | 'markdown';
  includePhotos: boolean;
  includeWeather: boolean;
  includeLocation: boolean;
  dateRange: {
    start: string;
    end: string;
  } | null;
}
