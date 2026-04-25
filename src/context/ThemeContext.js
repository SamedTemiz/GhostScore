import { createContext, useContext } from 'react';
import { LIGHT_COLORS } from '../constants/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ colors: LIGHT_COLORS, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
