import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MapView, Camera, UserLocation, ShapeSource, LineLayer, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import type { MapView as MapViewType } from '@rnmapbox/maps';
import { MAP_STYLES } from '../../src/shared/config/mapbox.config';
import { getAvailableRouteIds, ROUTE_CONFIGS } from '../../src/features/routes/services/routeLoader.service';
import { POIDetailSheet, POIDetailSheetRef, usePOIStore } from '../../src/features/pois';
import { FiltersModal } from '../../src/features/pois/components/FiltersModal';
import { POIListView } from '../../src/features/pois/components/POIListView';
import { useFilterStore } from '../../src/features/pois/store/filterStore';
import { usePOIDownloadStore } from '../../src/features/offline/store/poiDownloadStore';
import { debugDatabasePOIs } from '../../src/features/offline/services/poiDownload.service';
import { POIDownloadPrompt } from '../../src/features/offline/components/POIDownloadPrompt';
import { POIDownloadProgress } from '../../src/features/offline/components/POIDownloadProgress';
import { RoutePlanningToolbar, SaveRouteDialog, DraggableWaypointMarker } from '../../src/features/routing';
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
} from '../../src/features/map/hooks';

// Map feature components
import {
  MapStylePicker,
  RouteInfoCard,
  TerrainLayer,
  RoutePlanningFAB,
  POILayer,
} from '../../src/features/map/components';
import { EuroVeloRoutesButton } from '../../src/features/routes/components/EuroVeloRoutesButton';
import { EuroVeloRoutesModal } from '../../src/features/routes/components/EuroVeloRoutesModal';
import { MapHeader } from '../../src/features/map/components/MapHeader';
import { FilterChipsBar } from '../../src/features/map/components/FilterChipsBar';
import { MapControlsBottom } from '../../src/features/map/components/MapControlsBottom';

export default function MapScreen() {
  const poiDetailSheetRef = useRef<POIDetailSheetRef>(null);
  const mapRef = useRef<MapViewType>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat: number; lon: number} | null>(null);

  // Filter store for advanced filtering
  const {
    filters: extendedFilters,
    isModalVisible: isFiltersModalVisible,
    openModal: openFiltersModal,
    closeModal: closeFiltersModal,
    applyFilters,
    getActiveFilterCount,
    getQuickFilters,
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
    styleOptions,
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
    initialCameraSettings,
    handleCameraChanged: baseCameraChanged,
    flyTo,
    fitToBounds,
  } = useMapCamera(selectedFullRoute, location);

  // Active navigation
  const navigation = useActiveNavigation();

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

  // Auto-pan to downloaded region after download completes AND load POIs
  useEffect(() => {
    if (downloadCompletedRegion) {
      logger.info('offline', 'Auto-panning to downloaded region', {
        region: downloadCompletedRegion.displayName,
        bounds: downloadCompletedRegion.boundingBox,
      });

      // Calculate center of the downloaded region
      const center = [
        (downloadCompletedRegion.boundingBox.east + downloadCompletedRegion.boundingBox.west) / 2,
        (downloadCompletedRegion.boundingBox.north + downloadCompletedRegion.boundingBox.south) / 2,
      ];

      // Pan to the downloaded region
      flyTo(center as [number, number], 10);

      // Force POI reload with downloaded region's bounds
      // This ensures POIs appear immediately after download, not waiting for camera animation
      const downloadedBounds = {
        sw: [downloadCompletedRegion.boundingBox.west, downloadCompletedRegion.boundingBox.south] as [number, number],
        ne: [downloadCompletedRegion.boundingBox.east, downloadCompletedRegion.boundingBox.north] as [number, number],
      };
      loadPOIsForBounds(downloadedBounds);

      // Auto-enable POI visibility after download so user sees their downloaded POIs
      if (!showPOIs) {
        logger.info('offline', 'Auto-enabling POI visibility after download');
        togglePOIs();
      }

      // Clear the flag after panning
      clearDownloadCompletedRegion();
    }
  }, [downloadCompletedRegion, flyTo, loadPOIsForBounds, showPOIs, togglePOIs, clearDownloadCompletedRegion]);

  // Auto-prompt for POI download when viewing new region
  // Uses map viewport center (where user is looking), not GPS location
  useEffect(() => {
    if (!mapCenter) return;

    let timer: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const checkAndPrompt = async () => {
      // Delay to let user settle in the area first
      timer = setTimeout(async () => {
        if (isCancelled) return;

        // Don't show download prompt if another modal is already open
        if (isFiltersModalVisible) {
          return;
        }

        const result = await checkShouldPromptForRegion(
          mapCenter.lat,
          mapCenter.lon
        );

        // DEBUG: Track prompt state flow
        console.log('[DEBUG] Region check result:', {
          shouldPrompt: result.shouldPrompt,
          region: result.region?.displayName,
          showDownloadPrompt,
        });

        if (result.shouldPrompt && result.region) {
          console.log('[DEBUG] Calling showRegionDownloadPrompt for:', result.region.displayName);
          // Show region-based download prompt
          showRegionDownloadPrompt(result.region);
        } else {
          console.log('[DEBUG] NOT showing prompt. Reason:', {
            hasShouldPrompt: result.shouldPrompt,
            hasRegion: !!result.region,
          });
        }
      }, 2000); // 2 second delay before checking region
    };

    checkAndPrompt();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [mapCenter?.lat, mapCenter?.lon, checkShouldPromptForRegion, showRegionDownloadPrompt, isFiltersModalVisible]);

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

  // Handle camera changes with POI loading
  const handleCameraChanged = useCallback((state: any) => {
    baseCameraChanged(state);

    if (!state.properties.bounds) return;
    const bounds = {
      ne: state.properties.bounds.ne as [number, number],
      sw: state.properties.bounds.sw as [number, number],
    };

    // Calculate and update map center for region detection
    const centerLat = (bounds.ne[1] + bounds.sw[1]) / 2;
    const centerLon = (bounds.ne[0] + bounds.sw[0]) / 2;
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
      handleRoutePlanningPress({
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
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
    flyTo([result.longitude, result.latitude], 15);
    setIsSearchFocused(false);
  }, [flyTo]);

  // Toggle list/map view
  const handleToggleView = useCallback(() => {
    setIsListView((prev) => !prev);
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
        styleURL={MAP_STYLES[currentMapStyle]}
        compassEnabled
        scaleBarEnabled
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        attributionEnabled
        logoEnabled
        onCameraChanged={handleCameraChanged}
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
        {routeGeoJSON.features.length > 0 && (
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
        )}

        {/* POIs with clustering - droplet-shaped pin markers */}
        <POILayer
          visible={filteredPOIs.length > 0}
          pois={filteredPOIs}
          poiGeoJSON={poiGeoJSON}
          onPOIPress={handlePOIMarkerPress}
        />

        {/* Planned Route Line with Casing */}
        {isPlanning && plannedRouteGeoJSON && (
          <ShapeSource id="planned-route" shape={plannedRouteGeoJSON}>
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
        )}

        {/* Waypoints with MarkerView - supports gestures and nested views */}
        {isPlanning && waypoints.map((waypoint) => (
          <DraggableWaypointMarker
            key={waypoint.id}
            waypoint={waypoint}
            onDrag={handleWaypointDrag}
            onDragEnd={handleWaypointDragEnd}
            mapRef={mapRef}
          />
        ))}
      </MapView>

      {/* Map Header with Search and List Toggle */}
      <MapHeader
        isListView={isListView}
        onToggleView={handleToggleView}
        onSearchFocus={() => setIsSearchFocused(true)}
        onSearchBlur={() => setIsSearchFocused(false)}
      />

      {/* Search Results (when focused) */}
      {isSearchFocused && (
        <View style={styles.searchResultsContainer}>
          <SearchResults onSelectResult={handleSelectSearchResult} />
        </View>
      )}

      {/* Filter Chips Bar */}
      <FilterChipsBar
        onOpenFilters={openFiltersModal}
        activeFilterCount={getActiveFilterCount()}
        quickFilters={getQuickFilters()}
        onToggleQuickFilter={handleToggleQuickFilter}
      />

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

      {/* Map Style Picker */}
      <MapStylePicker
        visible={showStylePicker}
        currentStyle={currentMapStyle}
        styleOptions={styleOptions}
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

      {/* POI List View - shown when in list mode */}
      {isListView && (
        <POIListView
          pois={filteredPOIs}
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
        />
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
    bottom: spacing['3xl'],
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 115,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 25,
  },
});
