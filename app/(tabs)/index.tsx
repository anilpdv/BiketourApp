import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MapView, Camera, UserLocation, ShapeSource, LineLayer, CircleLayer, SymbolLayer } from '@maplibre/maplibre-react-native';
import type { MapViewRef, RegionPayload } from '@maplibre/maplibre-react-native';
import type { Feature, Point } from 'geojson';
import { MAP_STYLES } from '../../src/shared/config/mapbox.config';
import { getAvailableRouteIds, ROUTE_CONFIGS } from '../../src/features/routes/services/routeLoader.service';
import { POIDetailSheet, POIDetailSheetRef, usePOIStore } from '../../src/features/pois';
import { FiltersModal } from '../../src/features/pois/components/FiltersModal';
import { POIListView, POIListHeader, SortOption } from '../../src/features/pois/components/POIListView';
import { useFilterStore } from '../../src/features/pois/store/filterStore';
import { usePOIDownloadStore } from '../../src/features/offline/store/poiDownloadStore';
import { debugDatabasePOIs } from '../../src/features/offline/services/poiDownload.service';
import { POIDownloadPrompt } from '../../src/features/offline/components/POIDownloadPrompt';
import { POIDownloadProgress } from '../../src/features/offline/components/POIDownloadProgress';
import { RoutePlanningToolbar, SaveRouteDialog, DraggableWaypointMarker, RouteDragPreview } from '../../src/features/routing';
import { useActiveNavigation, NavigationOverlay, NavigationStartButton } from '../../src/features/navigation';
import { SearchResults, SearchResult } from '../../src/features/search';
import { LoadingSpinner, ErrorMessage, ErrorBoundary } from '../../src/shared/components';
import { colors, spacing } from '../../src/shared/design/tokens';
import { debounce, logger } from '../../src/shared/utils';

// Map feature hooks
import {
  useLocation,
  useMapSettings,
  useRouteManagement,
  usePOIDisplay,
  useMapCamera,
  useRoutePlanning,
  useMarkerImages,
  useRouteDrag,
} from '../../src/features/map/hooks';

// Map feature components
import {
  MapStyleSelector,
  RouteInfoCard,
  TerrainLayer,
  RoutePlanningFAB,
  POILayer,
  MapLegend,
} from '../../src/features/map/components';
import { EuroVeloRoutesButton } from '../../src/features/routes/components/EuroVeloRoutesButton';
import { EuroVeloRoutesModal } from '../../src/features/routes/components/EuroVeloRoutesModal';
import { MapHeader } from '../../src/features/map/components/MapHeader';
import { FilterChipsBar } from '../../src/features/map/components/FilterChipsBar';
import { MapControlsBottom } from '../../src/features/map/components/MapControlsBottom';

// Settling detection constants
const SETTLE_TIMEOUT_MS = 5000; // Wait 5 seconds of no movement before prompting

export default function MapScreen() {
  const poiDetailSheetRef = useRef<POIDetailSheetRef>(null);
  const mapRef = useRef<MapViewRef>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat: number; lon: number} | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // Settling detection refs - prevent popup spam during navigation
  const lastMoveTimeRef = useRef<number>(Date.now());
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPromptedRegionRef = useRef<string | null>(null);

  // Filter store for advanced filtering
  const {
    filters: extendedFilters,
    isModalVisible: isFiltersModalVisible,
    openModal: openFiltersModal,
    closeModal: closeFiltersModal,
    applyFilters,
    getActiveFilterCount,
    getQuickFilters,
    getQuickFiltersWithCounts,
    toggleCategory: toggleFilterCategory,
  } = useFilterStore();

  // POI download store for offline downloads
  const {
    showPrompt: showDownloadPrompt,
    isDownloading,
    currentRegion,
    downloadCompletedRegion,
    checkShouldPromptForRegion,
    showRegionDownloadPrompt,
    hideDownloadPrompt,
    dismissRegion,
    startRegionDownload,
    loadDownloadedRegions,
    clearDownloadCompletedRegion,
  } = usePOIDownloadStore();

  // Custom hooks for state management
  const { location, errorMsg, refreshLocation } = useLocation();

  // Route planning
  const {
    isPlanning,
    waypoints,
    calculatedGeometry,
    isCalculating,
    error: routeError,
    routeGeoJSON: plannedRouteGeoJSON,
    routeDistance,
    editingRouteId,
    editingRouteName,
    editingRouteDescription,
    startRoutePlanning,
    cancelPlanning,
    handleMapPress: handleRoutePlanningPress,
    handleWaypointDrag,
    handleWaypointDragEnd,
    handleSaveRoute,
  } = useRoutePlanning();

  // Route drag-to-modify (Komoot-style)
  const {
    isDraggingRoute,
    dragPreviewCoordinate,
    handleRouteLinePress,
    confirmRouteDrag,
    cancelRouteDrag,
  } = useRouteDrag();

  const {
    routes,
    enabledRouteIds,
    selectedRouteId,
    isLoading: routesLoading,
    enabledRoutes,
    selectedRoutes,
    selectedFullRoute,
    routeGeoJSON,
    toggleRoute,
    selectRoute,
  } = useRouteManagement();

  const {
    show3DTerrain,
    show3DBuildings,
    currentMapStyle,
    showStylePicker,
    toggle3DTerrain,
    toggle3DBuildings,
    setMapStyle,
    openStylePicker,
    closeStylePicker,
  } = useMapSettings();

  const {
    showPOIs,
    pois,
    filteredPOIs,
    poiCounts,
    poiGeoJSON,
    isLoading: poisLoading,
    filters,
    favoriteIds,
    togglePOIs,
    toggleCategory,
    loadPOIsForBounds,
    updateViewportBounds,
    selectPOI,
  } = usePOIDisplay(location, enabledRoutes);

  // Sort POIs based on sortBy
  const sortedPOIs = useMemo(() => {
    const sorted = [...filteredPOIs];
    switch (sortBy) {
      case 'distance':
        return sorted.sort(
          (a, b) => (a.distanceFromUser ?? Infinity) - (b.distanceFromUser ?? Infinity)
        );
      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = parseFloat(a.tags?.rating || a.tags?.stars || '0');
          const ratingB = parseFloat(b.tags?.rating || b.tags?.stars || '0');
          return ratingB - ratingA;
        });
      case 'price':
        // Lower price first
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.tags?.fee?.match(/\d+/)?.[0] || '9999');
          const priceB = parseFloat(b.tags?.fee?.match(/\d+/)?.[0] || '9999');
          return priceA - priceB;
        });
      default:
        return sorted; // relevance = default order
    }
  }, [filteredPOIs, sortBy]);

  // Diagnostic logging for POI rendering state
  useEffect(() => {
    logger.info('poi', '[DIAGNOSTIC] POI rendering state', {
      showPOIs,
      poiGeoJSONFeatures: poiGeoJSON.features.length,
      filteredPOIsCount: filteredPOIs.length,
      poisLoading,
    });
  }, [showPOIs, poiGeoJSON.features.length, filteredPOIs.length, poisLoading]);

  const {
    cameraRef,
    currentBounds,
    currentZoom,
    initialCameraSettings,
    handleCameraChanged: baseCameraChanged,
    flyTo,
    fitToBounds,
  } = useMapCamera(selectedFullRoute, location);

  // Active navigation
  const navigation = useActiveNavigation();

  // Marker images for POIs (generated once at startup)
  const { markerImages, MarkerGenerator } = useMarkerImages();

  // Load downloaded regions on mount
  useEffect(() => {
    loadDownloadedRegions();
  }, [loadDownloadedRegions]);

  // Debug: Check database content on mount to verify POI location
  useEffect(() => {
    debugDatabasePOIs().then(result => {
      logger.info('poi', '[DEBUG] Database content', result);
    });
  }, []);

  // Load POIs after download completes - fly to downloaded region and show POIs
  useEffect(() => {
    if (downloadCompletedRegion) {
      // Calculate center of downloaded region from bounding box
      const { boundingBox } = downloadCompletedRegion;
      const centerLat = (boundingBox.south + boundingBox.north) / 2;
      const centerLon = (boundingBox.west + boundingBox.east) / 2;

      logger.info('offline', 'Download completed, flying to region center', {
        region: downloadCompletedRegion.displayName,
        center: { lat: centerLat, lon: centerLon },
      });

      // Auto-enable POI visibility after download so user sees their downloaded POIs
      if (!showPOIs) {
        logger.info('offline', 'Auto-enabling POI visibility after download');
        togglePOIs();
      }

      // Fly to the center of downloaded region immediately
      flyTo([centerLon, centerLat], 12);

      // Clear the completion flag
      clearDownloadCompletedRegion();
    }
  }, [downloadCompletedRegion, showPOIs, togglePOIs, clearDownloadCompletedRegion, flyTo]);

  // Auto-prompt for POI download when user has SETTLED in a new region
  // Uses settling detection: only prompt after 5+ seconds of no movement
  // Prevents popup spam during navigation
  useEffect(() => {
    if (!mapCenter) return;

    // Clear any pending settle check when user moves again
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }

    // Wait for user to settle (5 seconds after last movement)
    settleTimerRef.current = setTimeout(async () => {
      // Double-check user hasn't moved since timer started
      const timeSinceLastMove = Date.now() - lastMoveTimeRef.current;
      if (timeSinceLastMove < SETTLE_TIMEOUT_MS) {
        // User moved during the wait - skip this check
        return;
      }

      // Don't show download prompt if another modal is already open
      if (
        isFiltersModalVisible ||
        showStylePicker ||
        showRoutesModal ||
        isDownloading ||
        poiDetailSheetRef.current?.isOpen()
      ) {
        return;
      }

      const result = await checkShouldPromptForRegion(
        mapCenter.lat,
        mapCenter.lon
      );

      // Don't re-prompt for the same region in this session
      if (result.region && lastPromptedRegionRef.current === result.region.displayName) {
        return;
      }

      if (result.shouldPrompt && result.region) {
        // Remember this region so we don't re-prompt
        lastPromptedRegionRef.current = result.region.displayName;
        showRegionDownloadPrompt(result.region);
      }
    }, SETTLE_TIMEOUT_MS);

    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, [mapCenter?.lat, mapCenter?.lon, checkShouldPromptForRegion, showRegionDownloadPrompt, isFiltersModalVisible, showStylePicker, showRoutesModal, isDownloading]);

  // Stable ref for loadPOIsForBounds - prevents debounce reset on every render
  const loadPOIsRef = useRef(loadPOIsForBounds);
  useEffect(() => {
    loadPOIsRef.current = loadPOIsForBounds;
  }, [loadPOIsForBounds]);

  // Fit camera to loaded saved route bounds
  useEffect(() => {
    if (isPlanning && calculatedGeometry.length >= 2 && editingRouteId) {
      // Small delay to ensure camera is mounted before fitting bounds
      const timer = setTimeout(() => {
        const lats = calculatedGeometry.map(c => c.latitude);
        const lons = calculatedGeometry.map(c => c.longitude);
        const bounds = {
          ne: [Math.max(...lons), Math.max(...lats)] as [number, number],
          sw: [Math.min(...lons), Math.min(...lats)] as [number, number],
        };
        fitToBounds(bounds, 50);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [editingRouteId, isPlanning, calculatedGeometry, fitToBounds]);

  // Debounced POI loading - prevents constant API calls during pan
  // Uses ref so dependency array is empty = stable debounce timer
  // 500ms debounce gives user time to settle before fetching
  const debouncedLoadPOIs = useMemo(
    () => debounce((bounds: { ne: [number, number]; sw: [number, number] }) => {
      loadPOIsRef.current(bounds);
    }, 500),
    [] // Empty deps = stable reference, won't reset timer
  );

  // Lightweight handler for during gestures - minimal work only
  // This prevents JavaScript from blocking the native animation thread
  // All state updates happen in onRegionDidChange when gesture ends
  const handleCameraChanging = useCallback((_state: any) => {
    // Only track movement time - very cheap, no React state updates
    // This is used by settling detection to know when user stopped moving
    lastMoveTimeRef.current = Date.now();
  }, []);

  // Handle camera changes with POI loading - only called when gesture ENDS
  const handleCameraChanged = useCallback((state: any) => {
    // Update zoom/bounds state only when gesture ends (not during)
    baseCameraChanged(state);

    if (!state.properties.visibleBounds) return;

    // Validate bounds structure - MapLibre provides [northEast, southWest] array
    const [ne, sw] = state.properties.visibleBounds;
    if (!Array.isArray(ne) || !Array.isArray(sw) || ne.length !== 2 || sw.length !== 2) {
      logger.warn('ui', 'Invalid bounds structure in camera changed');
      return;
    }

    const bounds = {
      ne: ne as [number, number],
      sw: sw as [number, number],
    };

    // Calculate and update map center for region detection
    const centerLat = (bounds.ne[1] + bounds.sw[1]) / 2;
    const centerLon = (bounds.ne[0] + bounds.sw[0]) / 2;

    // Validate center coordinates are finite numbers
    if (!isFinite(centerLat) || !isFinite(centerLon)) {
      logger.warn('ui', 'Invalid center coordinates calculated from bounds');
      return;
    }

    setMapCenter({ lat: centerLat, lon: centerLon });

    // Always update viewport bounds for filtering (shows only POIs in view)
    updateViewportBounds(bounds);

    // Load POIs when zoomed in enough (DEBOUNCED)
    // Always load - downloaded POIs will always be fetched
    // API POIs will only be fetched when showPOIs is true
    const latDelta = bounds.ne[1] - bounds.sw[1];
    if (latDelta < 0.5) {
      debouncedLoadPOIs(bounds);
    }
  }, [baseCameraChanged, debouncedLoadPOIs, updateViewportBounds]);

  // Handle POI press from map
  const handlePOIShapePress = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature?.properties?.id) {
      const poi = filteredPOIs.find(p => p.id === feature.properties.id);
      if (poi) {
        selectPOI(poi);
        poiDetailSheetRef.current?.present(poi);
      }
    }
  }, [filteredPOIs, selectPOI]);

  // Handle route press from map
  const handleRoutePress = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature?.properties?.routeId) {
      selectRoute(feature.properties.routeId);
    }
  }, [selectRoute]);

  // Handle POI sheet close
  const handlePOISheetClose = useCallback(() => {
    selectPOI(null);
  }, [selectPOI]);

  // Handle map press for route planning
  const handleMapPress = useCallback((event: any) => {
    if (!isPlanning) return;

    const { geometry } = event;
    if (geometry?.coordinates) {
      const [lon, lat] = geometry.coordinates;

      // Validate coordinates are numbers within valid ranges
      if (
        typeof lon !== 'number' || typeof lat !== 'number' ||
        !isFinite(lon) || !isFinite(lat) ||
        lon < -180 || lon > 180 ||
        lat < -90 || lat > 90
      ) {
        logger.warn('ui', 'Invalid map press coordinates', { lon, lat });
        return;
      }

      handleRoutePlanningPress({
        longitude: lon,
        latitude: lat,
      });
    }
  }, [isPlanning, handleRoutePlanningPress]);

  // Handle saving the planned route
  const handleSave = useCallback(async (name: string, description?: string) => {
    await handleSaveRoute(name, description);
    setShowSaveDialog(false);
  }, [handleSaveRoute]);

  // Handle cancel planning with confirmation
  const handleCancelPlanning = useCallback(() => {
    // Show confirmation if there are waypoints or editing an existing route
    if (waypoints.length > 0 || editingRouteId) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes to this route.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: cancelPlanning }
        ]
      );
    } else {
      cancelPlanning();
    }
  }, [waypoints.length, editingRouteId, cancelPlanning]);

  // Handle center on current location - refresh GPS first for accuracy
  const handleCenterOnLocation = useCallback(async () => {
    // Get fresh GPS location before centering
    const freshLocation = await refreshLocation();
    if (freshLocation?.coords) {
      flyTo([freshLocation.coords.longitude, freshLocation.coords.latitude], 14);
    } else if (location?.coords) {
      // Fallback to cached location
      flyTo([location.coords.longitude, location.coords.latitude], 14);
    }
  }, [refreshLocation, location, flyTo]);

  // Handle start navigation for loaded route
  const handleStartNavigation = useCallback(async () => {
    if (!editingRouteId || calculatedGeometry.length < 2) return;

    // Construct route object from planning state
    const routeForNavigation = {
      id: editingRouteId,
      name: editingRouteName || 'My Route',
      description: editingRouteDescription || undefined,
      mode: 'point-to-point' as const,
      waypoints: waypoints,
      geometry: calculatedGeometry,
      distance: routeDistance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await navigation.startNavigation(routeForNavigation);
  }, [editingRouteId, editingRouteName, editingRouteDescription, waypoints, calculatedGeometry, routeDistance, navigation]);

  // Handle search result selection - fly to location
  const handleSelectSearchResult = useCallback((result: SearchResult) => {
    // Validate search result coordinates
    if (
      typeof result.longitude !== 'number' || typeof result.latitude !== 'number' ||
      !isFinite(result.longitude) || !isFinite(result.latitude)
    ) {
      logger.warn('ui', 'Invalid search result coordinates', { result });
      return;
    }

    flyTo([result.longitude, result.latitude], 15);
    setIsSearchFocused(false);
  }, [flyTo]);

  // Toggle list/map view
  const handleToggleView = useCallback(() => {
    setIsListView((prev) => !prev);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
  }, []);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.zoomTo(14, 300);
    }
  }, [cameraRef]);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.zoomTo(8, 300);
    }
  }, [cameraRef]);

  // Handle quick filter toggle
  const handleToggleQuickFilter = useCallback((filterId: string) => {
    // Handle category quick filters
    if (filterId.startsWith('category_')) {
      const category = filterId.replace('category_', '');
      toggleFilterCategory(category as any);
    }
    // Price and rating filters open the modal
    if (filterId === 'maxPrice' || filterId === 'minRating') {
      openFiltersModal();
    }
  }, [toggleFilterCategory, openFiltersModal]);

  // Handle POI selection from list
  const handleSelectPOIFromList = useCallback((poi: any) => {
    selectPOI(poi);
    poiDetailSheetRef.current?.present(poi);
    // Optionally switch to map view to show location
  }, [selectPOI]);

  // Handle POI marker press on map
  const handlePOIMarkerPress = useCallback((poi: any) => {
    selectPOI(poi);
    poiDetailSheetRef.current?.present(poi);
  }, [selectPOI]);

  // Handle toggle favorite from list - uses POI store directly
  const handleToggleFavoriteFromList = useCallback((poi: any) => {
    usePOIStore.getState().toggleFavorite(poi);
  }, []);

  // Handle refresh POIs in list - triggers POI reload for current bounds
  const handleRefreshPOIs = useCallback(() => {
    if (currentBounds) {
      loadPOIsForBounds(currentBounds);
    }
  }, [currentBounds, loadPOIsForBounds]);

  // Handle POI download from prompt (region-based)
  const handleStartPOIDownload = useCallback(async () => {
    if (!currentRegion) return;
    await startRegionDownload(currentRegion);
  }, [currentRegion, startRegionDownload]);

  // Handle dismiss download prompt (region-based)
  const handleDismissDownload = useCallback(() => {
    if (currentRegion) {
      dismissRegion(currentRegion.displayName);
    } else {
      hideDownloadPrompt();
    }
  }, [currentRegion, dismissRegion, hideDownloadPrompt]);

  // Handle download progress complete
  const handleDownloadComplete = useCallback(() => {
    hideDownloadPrompt();
  }, [hideDownloadPrompt]);

  // Get loaded route IDs for chip selector
  const loadedRouteIds = routes.map(r => r.euroVeloId);

  return (
    <ErrorBoundary>
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapStyle={MAP_STYLES[currentMapStyle]}
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        attributionEnabled
        logoEnabled
        onRegionIsChanging={handleCameraChanging}
        onRegionDidChange={handleCameraChanged}
        onPress={handleMapPress}
      >
        {/* Camera */}
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCameraSettings.centerCoordinate,
            zoomLevel: initialCameraSettings.zoomLevel,
          }}
          minZoomLevel={2}
          maxZoomLevel={18}
        />

        {/* User location */}
        <UserLocation visible showsUserHeadingIndicator />

        {/* 3D Terrain and Buildings */}
        <TerrainLayer
          show3DTerrain={show3DTerrain}
          show3DBuildings={show3DBuildings}
          mapStyle={currentMapStyle}
        />

        {/* Routes - disable press during planning so taps pass through to MapView */}
        {routeGeoJSON.features.length > 0 ? (
          <ShapeSource id="routes" shape={routeGeoJSON} onPress={isPlanning ? undefined : handleRoutePress}>
            <LineLayer
              id="route-lines-full"
              filter={['==', ['get', 'variant'], 'full']}
              style={{
                lineColor: ['get', 'color'],
                lineWidth: ['case', ['==', ['get', 'isSelected'], true], 4, 3],
                lineCap: 'round',
                lineJoin: 'round',
                lineDasharray: [2, 1],
                lineOpacity: 0.7,
              }}
            />
            <LineLayer
              id="route-lines-developed"
              filter={['==', ['get', 'variant'], 'developed']}
              style={{
                lineColor: ['get', 'color'],
                lineWidth: ['case', ['==', ['get', 'isSelected'], true], 5, 3],
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        ) : <></>}

        {/* POIs with clustering - custom pin markers */}
        <POILayer
          visible={filteredPOIs.length > 0}
          pois={filteredPOIs}
          poiGeoJSON={poiGeoJSON}
          zoomLevel={currentZoom}
          onPOIPress={handlePOIMarkerPress}
          markerImages={markerImages}
        />

        {/* Planned Route Line with Casing - tap to add via waypoints */}
        {isPlanning && plannedRouteGeoJSON ? (
          <ShapeSource
            id="planned-route"
            shape={plannedRouteGeoJSON}
            onPress={(e) => {
              // Handle route line press for drag-to-modify
              if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                if (feature.geometry.type === 'Point') {
                  handleRouteLinePress({
                    geometry: { coordinates: feature.geometry.coordinates as [number, number] },
                  });
                }
              }
            }}
            hitbox={{ width: 30, height: 30 }} // Larger hit area for easier tapping
          >
            {/* Route casing (dark outline) */}
            <LineLayer
              id="planned-route-casing"
              style={{
                lineColor: '#1a365d',
                lineWidth: 8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Main route line */}
            <LineLayer
              id="planned-route-line"
              style={{
                lineColor: colors.primary[500],
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        ) : <></>}

        {/* Route Drag Preview - shows when user taps on route line */}
        {isDraggingRoute && dragPreviewCoordinate && (
          <RouteDragPreview
            coordinate={dragPreviewCoordinate}
            onConfirm={confirmRouteDrag}
            onCancel={cancelRouteDrag}
          />
        )}

        {/* Waypoints with MarkerView - supports gestures and nested views */}
        {isPlanning ? waypoints.map((waypoint) => (
          <DraggableWaypointMarker
            key={waypoint.id}
            waypoint={waypoint}
            onDrag={handleWaypointDrag}
            onDragEnd={handleWaypointDragEnd}
            mapRef={mapRef}
          />
        )) : <></>}
      </MapView>

      {/* Map Header with Search and List Toggle - hide in list view */}
      {!isListView && (
        <MapHeader
          isListView={isListView}
          onToggleView={handleToggleView}
          onSearchFocus={() => setIsSearchFocused(true)}
          onSearchBlur={() => setIsSearchFocused(false)}
        />
      )}

      {/* Search Results (when focused) */}
      {isSearchFocused && (
        <View style={styles.searchResultsContainer}>
          <SearchResults onSelectResult={handleSelectSearchResult} />
        </View>
      )}

      {/* Filter Chips Bar - hide in list view */}
      {!isListView && (
        <FilterChipsBar
          onOpenFilters={openFiltersModal}
          activeFilterCount={getActiveFilterCount()}
          quickFilters={getQuickFiltersWithCounts(poiCounts)}
          onToggleQuickFilter={handleToggleQuickFilter}
        />
      )}

      {/* EuroVelo Routes Button */}
      <EuroVeloRoutesButton
        activeCount={enabledRouteIds.length}
        onPress={() => setShowRoutesModal(true)}
      />

      {/* EuroVelo Routes Modal */}
      <EuroVeloRoutesModal
        visible={showRoutesModal}
        onClose={() => setShowRoutesModal(false)}
        availableRouteIds={getAvailableRouteIds()}
        enabledRouteIds={enabledRouteIds}
        loadedRouteIds={loadedRouteIds}
        isLoading={routesLoading}
        onToggleRoute={toggleRoute}
      />

      {/* Map Controls Bottom - only show in map view */}
      {!isListView && (
        <MapControlsBottom
          hasLocation={!!location}
          onCenterOnLocation={handleCenterOnLocation}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onOpenLayers={openStylePicker}
        />
      )}

      {/* Map Legend - only show for CyclOSM raster style */}
      <MapLegend visible={currentMapStyle === 'cyclosm'} />

      {/* Map Style Selector */}
      <MapStyleSelector
        visible={showStylePicker}
        currentStyle={currentMapStyle}
        onSelectStyle={setMapStyle}
        onClose={closeStylePicker}
      />

      {/* Route Info Card - hide during planning and navigation */}
      {selectedFullRoute && !isPlanning && !navigation.isNavigating && (
        <RouteInfoCard
          route={selectedFullRoute}
          developedRoute={selectedRoutes.find(r => r.variant === 'developed')}
        />
      )}

      {/* Active Navigation Overlay */}
      {navigation.isNavigating && (
        <NavigationOverlay
          routeName={navigation.routeName}
          formattedSpeed={navigation.formattedSpeed}
          currentSpeedKmh={navigation.currentSpeedKmh}
          formattedDistanceRemaining={navigation.formattedDistanceRemaining}
          formattedDistanceTraveled={navigation.formattedDistanceTraveled}
          progressPercent={navigation.progressPercent}
          formattedTimeRemaining={navigation.formattedTimeRemaining}
          isOffRoute={navigation.isOffRoute}
          isPaused={navigation.isPaused}
          onPause={navigation.pauseNavigation}
          onResume={navigation.resumeNavigation}
          onStop={navigation.stopNavigation}
        />
      )}

      {/* Navigation Start Button - show when route loaded but not navigating */}
      {isPlanning && editingRouteId && calculatedGeometry.length >= 2 && !navigation.isNavigating && (
        <NavigationStartButton
          onPress={handleStartNavigation}
          routeName={editingRouteName || undefined}
        />
      )}

      {/* Route Planning FAB - hide during navigation */}
      <RoutePlanningFAB
        onPress={startRoutePlanning}
        isPlanning={isPlanning || navigation.isNavigating}
      />

      {/* Route Planning Toolbar - hide during navigation */}
      {isPlanning && !navigation.isNavigating && (
        <View style={styles.toolbarContainer}>
          <RoutePlanningToolbar
            onSave={() => setShowSaveDialog(true)}
            onCancel={handleCancelPlanning}
          />
        </View>
      )}

      {/* Save Route Dialog */}
      <SaveRouteDialog
        visible={showSaveDialog}
        onSave={handleSave}
        onCancel={() => setShowSaveDialog(false)}
        distance={routeDistance}
        waypointCount={waypoints.length}
        initialName={editingRouteName || undefined}
        initialDescription={editingRouteDescription || undefined}
        isEditing={!!editingRouteId}
      />

      {/* Loading Overlay */}
      {routesLoading && (
        <LoadingSpinner overlay message="Loading routes..." />
      )}

      {/* Error Banner */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <ErrorMessage message={errorMsg} variant="banner" />
        </View>
      )}

      {/* POI List View - Full screen with header when in list mode */}
      {isListView && (
        <View style={styles.listViewContainer}>
          <POIListHeader
            onToggleToMap={handleToggleView}
            onOpenFilters={openFiltersModal}
            activeFilterCount={getActiveFilterCount()}
            quickFilters={getQuickFiltersWithCounts(poiCounts)}
            onToggleQuickFilter={handleToggleQuickFilter}
            onSearchFocus={() => setIsSearchFocused(true)}
            onSearchBlur={() => setIsSearchFocused(false)}
          />
          <POIListView
            pois={sortedPOIs}
            userLocation={
              location
                ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }
                : null
            }
            onSelectPOI={handleSelectPOIFromList}
            onToggleFavorite={handleToggleFavoriteFromList}
            favoriteIds={favoriteIds}
            isLoading={poisLoading}
            onRefresh={handleRefreshPOIs}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        </View>
      )}

      {/* Filters Modal */}
      <FiltersModal
        visible={isFiltersModalVisible}
        onClose={closeFiltersModal}
        onApply={applyFilters}
        currentFilters={extendedFilters}
        pois={pois}
      />

      {/* POI Detail Sheet */}
      <POIDetailSheet
        ref={poiDetailSheetRef}
        onClose={handlePOISheetClose}
        userLocation={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null}
      />

      {/* POI Download Prompt */}
      <POIDownloadPrompt
        visible={showDownloadPrompt}
        region={currentRegion}
        onClose={handleDismissDownload}
        onDownload={handleStartPOIDownload}
      />

      {/* POI Download Progress */}
      <POIDownloadProgress
        visible={isDownloading}
        onComplete={handleDownloadComplete}
      />

      {/* Hidden marker image generator - captures marker PNGs at startup */}
      {MarkerGenerator}
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorContainer: {
    position: 'absolute',
    top: 160,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 5,
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 75,
    left: spacing.lg,
    right: 70,
    zIndex: 10,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 115,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 25,
  },
  listViewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.neutral[50],
    zIndex: 20,
  },
});
