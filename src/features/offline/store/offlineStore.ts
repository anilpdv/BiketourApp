import { create } from 'zustand';
import {
  OfflinePack,
  OfflinePackStatus,
  getOfflineRegions,
  deleteOfflineRegion,
  downloadOfflineRegion,
  OfflineRegion,
} from '../services/offlineMap.service';

interface OfflineState {
  packs: OfflinePack[];
  downloadingPacks: Map<string, OfflinePackStatus>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPacks: () => Promise<void>;
  downloadRegion: (region: OfflineRegion) => Promise<void>;
  deleteRegion: (name: string) => Promise<void>;
  updateDownloadProgress: (name: string, status: OfflinePackStatus) => void;
  clearError: () => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  packs: [],
  downloadingPacks: new Map(),
  isLoading: false,
  error: null,

  loadPacks: async () => {
    set({ isLoading: true, error: null });
    try {
      const packs = await getOfflineRegions();
      set({ packs, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load offline packs',
        isLoading: false,
      });
    }
  },

  downloadRegion: async (region: OfflineRegion) => {
    const { downloadingPacks } = get();

    // Initialize download status
    const initialStatus: OfflinePackStatus = {
      name: region.name,
      state: 'active',
      percentage: 0,
      completedResourceCount: 0,
      completedResourceSize: 0,
      completedTileCount: 0,
      completedTileSize: 0,
      requiredResourceCount: 0,
    };

    set({
      downloadingPacks: new Map(downloadingPacks).set(region.name, initialStatus),
      error: null,
    });

    try {
      await downloadOfflineRegion(region, (pack, status) => {
        get().updateDownloadProgress(region.name, status);
      });

      // Reload packs after successful download
      await get().loadPacks();

      // Remove from downloading
      const updatedDownloading = new Map(get().downloadingPacks);
      updatedDownloading.delete(region.name);
      set({ downloadingPacks: updatedDownloading });
    } catch (error) {
      // Remove from downloading on error
      const updatedDownloading = new Map(get().downloadingPacks);
      updatedDownloading.delete(region.name);
      set({
        downloadingPacks: updatedDownloading,
        error: error instanceof Error ? error.message : 'Download failed',
      });
    }
  },

  deleteRegion: async (name: string) => {
    set({ error: null });
    try {
      await deleteOfflineRegion(name);
      set((state) => ({
        packs: state.packs.filter((p) => p.name !== name),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete region',
      });
    }
  },

  updateDownloadProgress: (name: string, status: OfflinePackStatus) => {
    set((state) => ({
      downloadingPacks: new Map(state.downloadingPacks).set(name, status),
    }));
  },

  clearError: () => set({ error: null }),
}));
