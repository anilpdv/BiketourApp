import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarkerView } from '@rnmapbox/maps';
import { colors } from '../../../shared/design/tokens';

interface ClusterMarkerProps {
  coordinate: [number, number]; // [longitude, latitude]
  pointCount: number;
}

/**
 * Cluster marker using MarkerView (same z-level as POIMarker)
 * Displays as a green circle with the count of POIs in the cluster
 */
function ClusterMarkerComponent({ coordinate, pointCount }: ClusterMarkerProps) {
  // Calculate size based on point count
  const size = pointCount < 10 ? 36 : pointCount < 50 ? 44 : pointCount < 100 ? 52 : 60;

  return (
    <MarkerView
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      allowOverlap={true}
    >
      <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.clusterText}>
          {pointCount >= 1000 ? `${Math.floor(pointCount / 1000)}k` : pointCount}
        </Text>
      </View>
    </MarkerView>
  );
}

export const ClusterMarker = memo(ClusterMarkerComponent);

const styles = StyleSheet.create({
  cluster: {
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    color: colors.neutral[0],
    fontWeight: 'bold',
    fontSize: 13,
  },
});
