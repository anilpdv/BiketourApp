import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { POI } from '../types';
import { usePOIStore } from '../store/poiStore';

interface FavoriteButtonProps {
  poi: POI;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const SIZES = {
  small: { icon: 16, padding: 6 },
  medium: { icon: 22, padding: 8 },
  large: { icon: 28, padding: 10 },
};

export function FavoriteButton({
  poi,
  size = 'medium',
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = usePOIStore();
  const [loading, setLoading] = useState(false);

  const isFav = isFavorite(poi.id);
  const sizeConfig = SIZES[size];

  const handlePress = async () => {
    setLoading(true);
    try {
      await toggleFavorite(poi);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { padding: sizeConfig.padding },
        isFav && styles.containerActive,
      ]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFav ? '#DC143C' : '#888'}
        />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.icon, { fontSize: sizeConfig.icon }]}>
            {isFav ? '❤️' : '🤍'}
          </Text>
          {showLabel && (
            <Text style={[styles.label, isFav && styles.labelActive]}>
              {isFav ? 'Saved' : 'Save'}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    minWidth: 44,
    minHeight: 44,
  },
  containerActive: {
    backgroundColor: '#ffe4e8',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    lineHeight: undefined,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  labelActive: {
    color: '#DC143C',
  },
});
