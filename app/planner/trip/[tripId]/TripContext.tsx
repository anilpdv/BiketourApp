import { createContext, useContext } from 'react';

interface TripContextValue {
  tripId: string;
}

export const TripContext = createContext<TripContextValue | null>(null);

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within TripContext.Provider');
  }
  return context;
}
