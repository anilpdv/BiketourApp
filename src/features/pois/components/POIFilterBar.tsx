import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { POICategory } from '../types';
import { POI_CATEGORIES } from '../services/overpass.service';

// Category icon mapping
const CATEGORY_ICONS: Record<POICategory, string> = {
  campsite: '⛺',
  drinking_water: '💧',
  bike_shop: '🚲',
  bike_repair: '🔧',
  hotel: '🏨',
  hostel: '🛏️',
  guest_house: '🏠',
  shelter: '🏕️',
  supermarket: '🛒',
  restaurant: '🍽️',
};

interface POIFilterBarProps {
  selectedCategories: POICategory[];
  onToggleCategory: (category: POICategory) => void;
  poiCounts?: Record<POICategory, number>;
  isLoading?: boolean;
}

function POIFilterBarComponent({
  selectedCategories,
  onToggleCategory,
  poiCounts = {},
  isLoading = false,
}: POIFilterBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {POI_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const count = poiCounts[category.id] || 0;
          const icon = CATEGORY_ICONS[category.id] || '📍';

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isSelected && { borderColor: category.color },
              ]}
              onPress={() => onToggleCategory(category.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipIcon}>{icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {category.name}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isSelected ? category.color : '#ccc' },
                  ]}
                >
                  <Text style={styles.countText}>{count > 99 ? '99+' : count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading POIs...</Text>
        </View>
      )}
    </View>
  );
}

export const POIFilterBar = memo(POIFilterBarComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#f8f8f8',
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chipTextSelected: {
    color: '#333',
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
