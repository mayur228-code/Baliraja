import { createContext, useContext } from 'react';

export interface ProgressSliderContextType {
  active: string;
  duration: number;
  handleButtonClick: (value: string) => void;
  vertical: boolean;
}

export const ProgressSliderContext = createContext<
  ProgressSliderContextType | undefined
>(undefined);

export const useProgressSliderContext = (): ProgressSliderContextType => {
  const context = useContext(ProgressSliderContext);
  if (!context) {
    throw new Error(
      'useProgressSliderContext must be used within a ProgressSlider'
    );
  }
  return context;
};
