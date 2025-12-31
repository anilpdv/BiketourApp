import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapView, Camera, UserLocation, ShapeSource, LineLayer, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import { MAP_STYLES } from '../../src/shared/config/mapbox.config';
import { getAvailableRouteIds, ROUTE_CONFIGS } from '../../src/features/routes/services/routeLoader.service';
import { POIDetailSheet, POIDetailSheetRef, POIFilterBar } from '../../src/features/pois';
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
} from '../../src/features/map/hooks';

// Map feature components
import {
  MapControls,
  MapStylePicker,
  RouteChipSelector,
  RouteInfoCard,
  TerrainLayer,
} from '../../src/features/map/components';

export default function MapScreen() {
  const poiDetailSheetRef = useRef<POIDetailSheetRef>(null);

  // Custom hooks for state management
  const { location, errorMsg } = useLocation();

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
  } = useMapCamera(selectedFullRoute, location);

  // Stable ref for loadPOIsForBounds - prevents debounce reset on every render
  const loadPOIsRef = useRef(loadPOIsForBounds);
  useEffect(() => {
    loadPOIsRef.current = loadPOIsForBounds;
  }, [loadPOIsForBounds]);

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

  // Get loaded route IDs for chip selector
  const loadedRouteIds = routes.map(r => r.euroVeloId);

  return (
    <ErrorBoundary>
    <View style={styles.container}>
      <MapView
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

        {/* Routes */}
        {routeGeoJSON.features.length > 0 && (
          <ShapeSource id="routes" shape={routeGeoJSON} onPress={handleRoutePress}>
            <LineLayer
              id="route-lines-full"
              filter={['==', ['get', 'variant'], 'full']}
              style={{
                lineColor: ['get', 'color'],
                lineWidth: ['case', ['==', ['get', 'isSelected'], true], 3, 2],
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
      </MapView>

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
        onTogglePOIs={togglePOIs}
        onToggle3DTerrain={toggle3DTerrain}
        onToggle3DBuildings={toggle3DBuildings}
        onOpenStylePicker={openStylePicker}
      />

      {/* Map Style Picker */}
      <MapStylePicker
        visible={showStylePicker}
        currentStyle={currentMapStyle}
        styleOptions={styleOptions}
        onSelectStyle={setMapStyle}
        onClose={closeStylePicker}
      />

      {/* Route Info Card */}
      {selectedFullRoute && (
        <RouteInfoCard
          route={selectedFullRoute}
          developedRoute={selectedRoutes.find(r => r.variant === 'developed')}
        />
      )}

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
});
