// Search result types
export type SearchResultType = 'place' | 'poi' | 'address';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  boundingBox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  placeType?: string;
  address?: {
    road?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: {
    road?: string;
    houseNumber?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  recentSearches: SearchResult[];
  isSearching: boolean;
  error: string | null;
}
