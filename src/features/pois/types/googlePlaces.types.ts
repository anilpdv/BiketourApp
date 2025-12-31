/**
 * Google Places API Types
 */

export interface GooglePlacesNearbyResponse {
  results: GooglePlace[];
  status: string;
  error_message?: string;
}

export interface GooglePlace {
  place_id: string;
  name: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: GooglePlacePhoto[];
  vicinity?: string;
}

export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface POIPhoto {
  uri: string;
  attribution: string;
  width: number;
  height: number;
}
