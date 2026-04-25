import { createContext, useContext } from 'react';
import { DARK_COLORS } from '../constants/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ colors: DARK_COLORS, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
