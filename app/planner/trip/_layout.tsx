import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function TripLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
      <Stack.Screen
        name="[tripId]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
