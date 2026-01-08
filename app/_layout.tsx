import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { paperLightTheme } from '../src/shared/design/paperTheme';

// Suppress Reanimated worklet warnings from @gorhom/bottom-sheet
// These are known issues with bottom-sheet + Reanimated 4.x compatibility
// See: https://github.com/gorhom/react-native-bottom-sheet/issues/1983
LogBox.ignoreLogs([
  '[Worklets] Tried to modify key',
  'Tried to modify key',
]);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        <Stack.Screen
          name="planner"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
