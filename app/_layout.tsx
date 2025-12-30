import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { initializeMapbox } from '../src/shared/config/mapbox.config';
import { paperLightTheme } from '../src/shared/design/paperTheme';

// Initialize Mapbox at app startup
initializeMapbox();

export default function RootLayout() {
  return (
    <PaperProvider theme={paperLightTheme}>
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
    </PaperProvider>
  );
}
