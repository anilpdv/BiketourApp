import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MapView, Camera, UserLocation, ShapeSource, LineLayer, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import type { MapView as MapViewType } from '@rnmapbox/maps';
import { MAP_STYLES } from '../../src/shared/config/mapbox.config';
import { getAvailableRouteIds, ROUTE_CONFIGS } from '../../src/features/routes/services/routeLoader.service';
import { POIDetailSheet, POIDetailSheetRef, POIFilterBar } from '../../src/features/pois';
import { RoutePlanningToolbar, SaveRouteDialog, DraggableWaypointMarker } from '../../src/features/routing';
import { useActiveNavigation, NavigationOverlay, NavigationStartButton } from '../../src/features/navigation';
import { SearchBar, SearchResults, SearchResult } from '../../src/features/search';
import { LoadingSpinner, ErrorMessage, ErrorBoundary } from '../../src/shared/components';
import { colors, spacing } from '../../src/shared/design/tokens';
import { debounce } from '../../src/shared/utils';

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
  MapControls,
  MapStylePicker,
  RouteChipSelector,
  RouteInfoCard,
  TerrainLayer,
  RoutePlanningFAB,
} from '../../src/features/map/components';

export default function MapScreen() {
  const poiDetailSheetRef = useRef<POIDetailSheetRef>(null);
  const mapRef = useRef<MapViewType>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  const {
    cameraRef,
    initialCameraSettings,
    handleCameraChanged: baseCameraChanged,
    flyTo,
    fitToBounds,
  } = useMapCamera(selectedFullRoute, location);

  // Active navigation
  const navigation = useActiveNavigation();

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

    // Always update viewport bounds for filtering (shows only POIs in view)
    updateViewportBounds(bounds);

    // Load NEW POIs only when zoomed in enough (DEBOUNCED)
    const latDelta = bounds.ne[1] - bounds.sw[1];
    if (latDelta < 0.5 && showPOIs) {
      debouncedLoadPOIs(bounds);
    }
  }, [baseCameraChanged, debouncedLoadPOIs, updateViewportBounds, showPOIs]);

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

        {/* POIs with clustering */}
        {showPOIs && poiGeoJSON.features.length > 0 && (
          <ShapeSource
            id="pois"
            shape={poiGeoJSON}
            cluster
            clusterRadius={40}
            clusterMaxZoomLevel={14}
            onPress={handlePOIShapePress}
          >
            <CircleLayer
              id="poi-clusters"
              filter={['has', 'point_count']}
              style={{
                circleColor: colors.primary[500],
                circleRadius: ['step', ['get', 'point_count'], 15, 10, 20, 25, 25, 50, 30],
                circleOpacity: 0.9,
                circleStrokeWidth: 2,
                circleStrokeColor: colors.neutral[0],
              }}
            />
            <SymbolLayer
              id="poi-cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count_abbreviated'],
                textSize: 12,
                textColor: colors.neutral[0],
                textFont: ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              }}
            />
            <CircleLayer
              id="poi-points"
              filter={['!', ['has', 'point_count']]}
              style={{
                circleColor: ['get', 'color'],
                circleRadius: 18,
                circleStrokeWidth: 3,
                circleStrokeColor: colors.neutral[0],
                circleOpacity: 0.95,
              }}
            />
            <SymbolLayer
              id="poi-icons"
              filter={['!', ['has', 'point_count']]}
              style={{
                iconImage: ['get', 'makiIcon'],
                iconSize: 1.2,
                iconColor: colors.neutral[0],
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />
            <SymbolLayer
              id="poi-favorite-badge"
              filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'isFavorite'], true]]}
              style={{
                textField: '❤️',
                textSize: 10,
                textOffset: [1.2, -1.2],
                textAnchor: 'center',
                textAllowOverlap: true,
              }}
            />
          </ShapeSource>
        )}

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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search location..."
        />
        {isSearchFocused && (
          <SearchResults onSelectResult={handleSelectSearchResult} />
        )}
      </View>

      {/* Route Chip Selector */}
      <RouteChipSelector
        availableRouteIds={getAvailableRouteIds()}
        enabledRouteIds={enabledRouteIds}
        selectedRouteId={selectedRouteId}
        loadedRouteIds={loadedRouteIds}
        isLoading={routesLoading}
        onToggleRoute={toggleRoute}
      />

      {/* POI Filter Bar */}
      {showPOIs && (
        <View style={styles.poiFilterContainer}>
          <POIFilterBar
            selectedCategories={filters.categories}
            onToggleCategory={toggleCategory}
            poiCounts={poiCounts}
            isLoading={poisLoading}
          />
        </View>
      )}

      {/* Map Controls */}
      <MapControls
        showPOIs={showPOIs}
        show3DTerrain={show3DTerrain}
        show3DBuildings={show3DBuildings}
        hasLocation={!!location}
        onTogglePOIs={togglePOIs}
        onToggle3DTerrain={toggle3DTerrain}
        onToggle3DBuildings={toggle3DBuildings}
        onOpenStylePicker={openStylePicker}
        onCenterOnLocation={handleCenterOnLocation}
      />

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

      {/* POI Detail Sheet */}
      <POIDetailSheet
        ref={poiDetailSheetRef}
        onClose={handlePOISheetClose}
        userLocation={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null}
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
  poiFilterContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: spacing['3xl'],
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
  },
});
