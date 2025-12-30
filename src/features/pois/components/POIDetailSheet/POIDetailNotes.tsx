import React, { memo, useState, useCallback } from 'react';
import { View } from 'react-native';
import { Text, TextInput, Surface, useTheme } from 'react-native-paper';
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
  const theme = useTheme();

  const handleBlur = useCallback(() => {
    if (noteText.trim()) {
      updateFavoriteNote(poiId, noteText.trim());
    }
  }, [poiId, noteText, updateFavoriteNote]);

  return (
    <Surface style={styles.container} elevation={0}>
      <Text variant="titleSmall" style={styles.label}>Your Notes</Text>
      <TextInput
        mode="outlined"
        value={noteText}
        onChangeText={setNoteText}
        placeholder="Add a note about this place..."
        multiline
        numberOfLines={3}
        onBlur={handleBlur}
        style={styles.input}
      />
    </Surface>
  );
});
