import React, { memo, useState, useCallback } from 'react';
import { View, Text, TextInput } from 'react-native';
import { usePOIStore } from '../../store/poiStore';
import { notesStyles as styles } from './POIDetailSheet.styles';

export interface POIDetailNotesProps {
  poiId: string;
}

/**
 * Notes section for favorited POIs
 */
export const POIDetailNotes = memo(function POIDetailNotes({
  poiId,
}: POIDetailNotesProps) {
  const [noteText, setNoteText] = useState('');
  const { updateFavoriteNote } = usePOIStore();

  const handleBlur = useCallback(() => {
    if (noteText.trim()) {
      updateFavoriteNote(poiId, noteText.trim());
    }
  }, [poiId, noteText, updateFavoriteNote]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Notes</Text>
      <TextInput
        style={styles.input}
        value={noteText}
        onChangeText={setNoteText}
        placeholder="Add a note about this place..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
        onBlur={handleBlur}
      />
    </View>
  );
});
