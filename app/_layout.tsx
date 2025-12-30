import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initializeMapbox } from '../src/shared/config/mapbox.config';

// Initialize Mapbox at app startup
initializeMapbox();

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="route/[id]"
          options={{
            title: 'Route Details',
            headerStyle: { backgroundColor: '#2196F3' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="journal/[id]"
          options={{
            title: 'Journal Entry',
            headerStyle: { backgroundColor: '#7E57C2' },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="journal/create"
          options={{
            title: 'New Entry',
            headerStyle: { backgroundColor: '#7E57C2' },
            headerTintColor: '#fff',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
