import { createContext, useContext, useState, useEffect } from 'react';

// context global pentru tema aplicatiei (Premium/Classic), disponibil in toata aplicatia
const ThemeContext = createContext();

// paleta de culori pentru tema Premium (fundal intunecat, personalizat)
export const PREMIUM_COLORS = {
  bg: {
    primary: '#0b0e14',
    secondary: '#1a1d27',
    card: '#18202d',
    hover: '#212a38',
  },
  text: {
    primary: '#f0f3f7',
    secondary: '#d1d5db',
    muted: '#848e9c',
  },
  accent: {
    blue: '#3b82f6',
    green: '#2ebd85',
    red: '#f6465d',
    gold: '#fbbf24',
  },
};

// paleta de culori pentru tema Classic (foloseste variabilele CSS existente)
export const CLASSIC_COLORS = {
  bg: {
    primary: 'transparent',
    secondary: 'transparent',
    card: 'var(--bg-card)',
    hover: 'var(--bg-hover)',
  },
  text: {
    primary: 'var(--text-main)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
  },
  accent: {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    gold: '#fbbf24',
  },
};

// provider-ul de tema: retine preferinta in localStorage si expune functia de comutare
export const ThemeProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(() => {
    const saved = localStorage.getItem('theme-premium');
    return saved ? JSON.parse(saved) : false;
  });

  // sincronizam tema cu localStorage si actualizam fundalul paginii cand se schimba
  useEffect(() => {
    localStorage.setItem('theme-premium', JSON.stringify(isPremium));
    if (isPremium) {
      document.documentElement.style.background = PREMIUM_COLORS.bg.primary;
    } else {
      document.documentElement.style.background = 'transparent';
    }
  }, [isPremium]);

  const toggleTheme = () => {
    setIsPremium(prev => !prev);
  };

  const colors = isPremium ? PREMIUM_COLORS : CLASSIC_COLORS;

  return (
    <ThemeContext.Provider value={{ isPremium, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// hook custom pentru a folosi usor tema curenta in orice componenta
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
