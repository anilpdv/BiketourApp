import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

type Mood = 'amazing' | 'good' | 'okay' | 'tired' | 'challenging';

const moodOptions: { mood: Mood; emoji: string; label: string }[] = [
  { mood: 'amazing', emoji: '🤩', label: 'Amazing' },
  { mood: 'good', emoji: '😊', label: 'Good' },
  { mood: 'okay', emoji: '😐', label: 'Okay' },
  { mood: 'tired', emoji: '😴', label: 'Tired' },
  { mood: 'challenging', emoji: '😤', label: 'Challenging' },
];

export default function CreateJournalEntry() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [distance, setDistance] = useState('');

  const handleSave = () => {
    // Save entry logic would go here
    console.log({ title, content, selectedMood, distance });
    router.back();
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.dateLabel}>{today}</Text>

        {/* Title */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="What happened today?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
        </View>

        {/* Mood */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {moodOptions.map((option) => (
              <TouchableOpacity
                key={option.mood}
                style={[
                  styles.moodButton,
                  selectedMood === option.mood && styles.moodButtonSelected,
                ]}
                onPress={() => setSelectedMood(option.mood)}
              >
                <Text style={styles.moodEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    selectedMood === option.mood && styles.moodLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Distance */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Distance cycled (km)</Text>
          <TextInput
            style={styles.distanceInput}
            placeholder="0"
            value={distance}
            onChangeText={setDistance}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        {/* Content */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Journal Entry</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Write about your day..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        {/* Add Photos */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Photos</Text>
          <TouchableOpacity style={styles.addPhotoButton}>
            <Text style={styles.addPhotoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Add Photos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (!title || !content) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!title || !content}
        >
          <Text style={styles.saveButtonText}>Save Entry</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1, padding: 16 },
  dateLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  inputSection: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    color: '#333',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 4,
  },
  moodButtonSelected: {
    backgroundColor: '#7E57C2',
  },
  moodEmoji: { fontSize: 24, marginBottom: 4 },
  moodLabel: { fontSize: 10, color: '#666' },
  moodLabelSelected: { color: '#fff' },
  distanceInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  contentInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
  },
  addPhotoButton: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addPhotoIcon: { fontSize: 32, marginBottom: 8 },
  addPhotoText: { fontSize: 14, color: '#666' },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#7E57C2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
