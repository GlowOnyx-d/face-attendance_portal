import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('theme');
        if (saved) {
          setIsDark(saved === 'dark');
        } else if (colorScheme) {
          setIsDark(colorScheme === 'dark');
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      }
    })();
  }, [colorScheme]);

  const toggleTheme = async () => {
    try {
      const newValue = !isDark;
      setIsDark(newValue);
      await AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
