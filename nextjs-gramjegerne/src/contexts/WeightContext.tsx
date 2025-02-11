'use client';

import {createContext, ReactNode, useContext} from 'react';

interface WeightContextType {
  weight: number;
}

const WeightContext = createContext<WeightContextType>({weight: 0});

export function WeightProvider({children, weight = 0}: {children: ReactNode; weight?: number}) {
  console.log('WeightProvider weight:', weight);
  return <WeightContext.Provider value={{weight}}>{children}</WeightContext.Provider>;
}

export function useWeight() {
  const context = useContext(WeightContext);
  console.log('useWeight context:', context);
  return context;
}
