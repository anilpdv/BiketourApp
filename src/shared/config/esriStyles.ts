/**
 * ESRI/ArcGIS Map Style Configurations
 * Free for non-commercial use with attribution
 * https://server.arcgisonline.com/ArcGIS/rest/services/
 */

// Base URL for ESRI tile services
const ESRI_BASE = 'https://server.arcgisonline.com/ArcGIS/rest/services';

// Helper to create ESRI raster style
function createEsriStyle(name: string, service: string, attribution: string) {
  return {
    version: 8,
    name,
    sources: {
      'esri-tiles': {
        type: 'raster',
        tiles: [`${ESRI_BASE}/${service}/MapServer/tile/{z}/{y}/{x}`],
        tileSize: 256,
        attribution,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'esri-layer',
        type: 'raster',
        source: 'esri-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  };
}

// ESRI World Imagery (Satellite)
export const SATELLITE_STYLE = createEsriStyle(
  'ESRI Satellite',
  'World_Imagery',
  '&copy; Esri, Maxar, Earthstar Geographics, CNES/Airbus DS'
);

// ESRI World Topographic Map - Great for hiking/biking with terrain + trails
export const TOPO_STYLE = createEsriStyle(
  'ESRI Topographic',
  'World_Topo_Map',
  '&copy; Esri, HERE, Garmin, FAO, NOAA, USGS'
);

// ESRI World Hillshade - Terrain elevation shading
export const HILLSHADE_STYLE = createEsriStyle(
  'ESRI Hillshade',
  'Elevation/World_Hillshade',
  '&copy; Esri'
);

// ESRI National Geographic World Map - Beautiful cartography
export const NATGEO_STYLE = createEsriStyle(
  'National Geographic',
  'NatGeo_World_Map',
  '&copy; Esri, National Geographic'
);

// ESRI World Street Map
export const ESRI_STREETS_STYLE = createEsriStyle(
  'ESRI Streets',
  'World_Street_Map',
  '&copy; Esri, HERE, Garmin, USGS, NGA'
);

// ESRI World Terrain Base - Muted terrain for overlays
export const TERRAIN_BASE_STYLE = createEsriStyle(
  'ESRI Terrain',
  'World_Terrain_Base',
  '&copy; Esri, USGS, NOAA'
);
