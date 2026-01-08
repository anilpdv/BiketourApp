import { Stack, useRouter } from 'expo-router';
import { useTheme, IconButton } from 'react-native-paper';

export default function PlannerLayout() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
      <Stack.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          headerRight: () => (
            <IconButton
              icon="close"
              iconColor={theme.colors.onPrimary}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <Stack.Screen
        name="add-expense"
        options={{
          title: 'Add Expense',
          presentation: 'modal',
          headerRight: () => (
            <IconButton
              icon="close"
              iconColor={theme.colors.onPrimary}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <Stack.Screen
        name="create-trip"
        options={{
          title: 'Create Trip',
          headerRight: () => (
            <IconButton
              icon="close"
              iconColor={theme.colors.onPrimary}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <Stack.Screen
        name="trip/[tripId]"
        options={{
          title: 'Trip Details',
          headerRight: () => (
            <IconButton
              icon="close"
              iconColor={theme.colors.onPrimary}
              onPress={() => router.back()}
            />
          ),
        }}
      />
    </Stack>
  );
}
