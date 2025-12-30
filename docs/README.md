# 🚴 BikeTour Europe

A React Native app for bicycle touring across Europe. 100% FREE tech stack - no paid APIs required!

## 💰 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Map Tiles (OpenFreeMap) | **FREE** | No limits, no API key |
| POI Data (Overpass API) | **FREE** | OpenStreetMap data |
| Route Data (EuroVelo) | **FREE** | ODbL license |
| Total | **$0/month** | 🎉 |

## 📁 Feature-Based Architecture

```
src/
├── features/                 # Feature modules
│   ├── map/                  # Map display feature
│   │   ├── components/
│   │   │   ├── MapView.tsx      # Main map component
│   │   │   ├── RouteLayer.tsx   # Route polyline
│   │   │   └── POIMarkers.tsx   # POI markers layer
│   │   ├── hooks/
│   │   │   └── useMapRegion.ts
│   │   ├── store/
│   │   │   └── map.store.ts     # Map state (zoom, center)
│   │   └── index.ts             # Public exports
│   │
│   ├── pois/                 # Points of Interest feature
│   │   ├── api/
│   │   │   └── overpass.api.ts  # Overpass API calls
│   │   ├── components/
│   │   │   ├── POICard.tsx      # POI detail sheet
│   │   │   └── FilterBar.tsx    # Category filters
│   │   ├── store/
│   │   │   └── poi.store.ts     # POI data & filters
│   │   ├── types/
│   │   │   └── poi.types.ts
│   │   └── index.ts
│   │
│   ├── routes/               # Cycling routes feature
│   │   ├── api/
│   │   │   └── routes.api.ts    # GPX loading
│   │   ├── components/
│   │   │   └── RouteCard.tsx
│   │   ├── screens/
│   │   │   └── RoutesScreen.tsx
│   │   ├── utils/
│   │   │   └── gpxParser.ts
│   │   └── index.ts
│   │
│   └── settings/
│       └── ...
│
├── shared/                   # Shared utilities
│   ├── config/
│   │   ├── maps.config.ts       # Map tile providers
│   │   ├── content.config.json  # 📝 CMS - Edit this!
│   │   └── content.service.ts   # Config loader
│   ├── components/
│   ├── hooks/
│   └── utils/
│
├── navigation/
│   └── AppNavigator.tsx
│
└── App.tsx
```

## 🎛️ CMS-Like Content Management

### Adding/Removing Routes

Edit `src/shared/config/content.config.json`:

```json
{
  "routes": [
    {
      "id": "ev15",
      "euroVeloId": 15,
      "name": "Rhine Cycle Route",
      "enabled": true,        // ← Toggle visibility
      "gpxFile": "gpx/ev15.gpx"
    }
  ]
}
```

### Adding/Removing POI Categories

```json
{
  "poiCategories": [
    {
      "id": "supermarket",
      "name": "Supermarkets",
      "icon": "🛒",
      "color": "#795548",
      "osmQuery": "shop=supermarket",
      "enabled": true          // ← Toggle visibility
    }
  ]
}
```

### Switching Map Providers

Edit `src/shared/config/maps.config.ts`:

```typescript
// Change this to switch providers
export const ACTIVE_PROVIDER: TileProvider = 'openfreemap';

// Available options:
// - 'openfreemap'  → 100% free, no limits
// - 'stadia'       → Free 200k tiles/month
// - 'maptiler'     → Free 100k tiles/month (needs key)
// - 'carto'        → Free, simpler style
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the app
npx expo start

# 3. Run on device
npx expo start --android
# or
npx expo start --ios
```

## 📊 Data Sources

### Map Tiles
- **Provider**: OpenFreeMap (default)
- **Cost**: FREE
- **Setup**: None required

### POI Data (Campsites, Water, Bike Shops)
- **Provider**: OpenStreetMap via Overpass API
- **Cost**: FREE
- **Rate Limits**: Be reasonable (~1 req/sec)

### Cycling Routes
- **Provider**: EuroVelo
- **Cost**: FREE (ODbL license)
- **Setup**: Download GPX files from eurovelo.com

## 🔌 Future: Remote Content (Optional)

For production, you can switch to remote content:

### Option A: CDN-hosted JSON

```typescript
// In content.service.ts
const CONTENT_SOURCE: ContentSource = 'remote';
const REMOTE_CONFIG_URL = 'https://your-cdn.com/config/content.json';
```

### Option B: Supabase Backend

```typescript
// Free tier: 500MB DB, 1GB storage
const CONTENT_SOURCE: ContentSource = 'supabase';

// Setup tables:
// - routes (id, name, gpx_url, enabled, ...)
// - poi_categories (id, name, icon, osm_query, enabled)
// - custom_pois (id, name, lat, lon, type, ...)
```

## 📱 Offline Support (Phase 2)

For offline usage, you'll need to:

1. **Cache map tiles**: Use `@maplibre/maplibre-react-native` offline packs
2. **Cache POIs**: Store in MMKV/SQLite by region
3. **Bundle GPX files**: Include in app assets

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Follow feature-based structure
4. Submit PR

## 📄 License

MIT - Free for personal and commercial use

---

Built with ❤️ for bicycle tourers
