import { create } from 'zustand';
import {
  JournalEntry,
  JournalPhoto,
  JournalEntrySummary,
  JournalStats,
  JournalMood,
} from '../types';

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface JournalState {
  // All entries
  entries: JournalEntry[];

  // Selected entry for viewing/editing
  selectedEntryId: string | null;

  // Draft entry being created
  draftEntry: Partial<JournalEntry> | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => JournalEntry;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  selectEntry: (id: string | null) => void;
  setDraft: (draft: Partial<JournalEntry> | null) => void;
  addPhotoToEntry: (entryId: string, photo: Omit<JournalPhoto, 'id'>) => void;
  removePhotoFromEntry: (entryId: string, photoId: string) => void;
  getEntrySummaries: () => JournalEntrySummary[];
  getStats: () => JournalStats;
  getEntriesByDate: (startDate: string, endDate: string) => JournalEntry[];
  getEntryForDate: (date: string) => JournalEntry | undefined;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  selectedEntryId: null,
  draftEntry: null,
  isLoading: false,
  error: null,

  addEntry: (entryData) => {
    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      ...entryData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    } as JournalEntry;

    set((state) => ({
      entries: [newEntry, ...state.entries],
      draftEntry: null,
    }));

    return newEntry;
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      ),
    }));
  },

  deleteEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
      selectedEntryId: state.selectedEntryId === id ? null : state.selectedEntryId,
    }));
  },

  selectEntry: (id) => set({ selectedEntryId: id }),

  setDraft: (draft) => set({ draftEntry: draft }),

  addPhotoToEntry: (entryId, photoData) => {
    const photo: JournalPhoto = {
      ...photoData,
      id: generateId(),
    };

    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              photos: [...entry.photos, photo],
              updatedAt: new Date().toISOString(),
            }
          : entry
      ),
    }));
  },

  removePhotoFromEntry: (entryId, photoId) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              photos: entry.photos.filter((p) => p.id !== photoId),
              updatedAt: new Date().toISOString(),
            }
          : entry
      ),
    }));
  },

  getEntrySummaries: () => {
    return get().entries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      previewText: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
      photoCount: entry.photos.length,
      thumbnailUri: entry.photos[0]?.uri || null,
      mood: entry.mood,
    }));
  },

  getStats: () => {
    const entries = get().entries;
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const entriesThisMonth = entries.filter((e) => e.date.startsWith(thisMonth)).length;
    const totalPhotos = entries.reduce((sum, e) => sum + e.photos.length, 0);

    // Calculate streaks
    const sortedDates = [...new Set(entries.map((e) => e.date))].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
          currentStreak = 1;
        }
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000;

        if (diffDays === 1) {
          tempStreak++;
          if (currentStreak > 0) currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          currentStreak = 0;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      totalEntries: entries.length,
      totalPhotos,
      entriesThisMonth,
      longestStreak,
      currentStreak,
      countriesVisited: [], // TODO: Extract from location data
    };
  },

  getEntriesByDate: (startDate, endDate) => {
    return get().entries.filter(
      (entry) => entry.date >= startDate && entry.date <= endDate
    );
  },

  getEntryForDate: (date) => {
    return get().entries.find((entry) => entry.date === date);
  },
}));

// Selectors
export const selectSelectedEntry = (state: JournalState) =>
  state.entries.find((e) => e.id === state.selectedEntryId);

export const selectRecentEntries = (limit: number = 5) => (state: JournalState) =>
  state.entries.slice(0, limit);

export const selectEntriesWithPhotos = (state: JournalState) =>
  state.entries.filter((e) => e.photos.length > 0);

// Mood emoji mapping
export const moodEmojis: Record<JournalMood, string> = {
  amazing: '🤩',
  good: '😊',
  okay: '😐',
  tired: '😴',
  challenging: '😤',
};
