import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ThemeName = 'retro' | 'light' | 'dark' | 'arctic' | 'nature' | 'ember' | 'dracula' | 'midnight' | 'luxury';
export type NavLayout = 'sidenav' | 'topnav' | 'combo';
export type SidenavShape = 'default' | 'slim' | 'stacked';
export type NavColor = 'default' | 'vibrant';
export type TextDir = 'ltr' | 'rtl';
export type FontFamily = 'Georgia, serif' | "'Palatino Linotype', serif" | "'Courier New', monospace" | "Verdana, sans-serif" | "'Trebuchet MS', sans-serif";
export type FontSize = 'sm' | 'md' | 'lg';

export interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  textSub: string;
  topbar: string;
  sidebar: string;
  sidebarHover: string;
  sidebarActive: string;
  sidebarText: string;
}

// ─── Token Maps ───────────────────────────────────────────────────────────────
export const THEME_TOKENS: Record<ThemeName, ThemeTokens> = {
  retro: {
    bg: '#f0ebe3', surface: '#e8e2d8', surfaceHover: '#ddd7cc',
    border: '#d4ccc0', text: '#2c2416', textMuted: '#9b8e7e',
    textSub: '#7a6e60', topbar: '#e8e2d8', sidebar: '#e0d9cf',
    sidebarHover: '#d4ccc0', sidebarActive: '#c8c0b4', sidebarText: '#5a4e40',
  },
  light: {
    bg: '#f5f6fa', surface: '#ffffff', surfaceHover: '#f0f2f8',
    border: '#e2e6f0', text: '#1a1f36', textMuted: '#8a94b0',
    textSub: '#5c6480', topbar: '#ffffff', sidebar: '#fafbff',
    sidebarHover: '#f0f2ff', sidebarActive: '#e8ecff', sidebarText: '#4a5280',
  },
  dark: {
    bg: '#0f1117', surface: '#1a1d27', surfaceHover: '#22263a',
    border: '#2a2f45', text: '#e8ecff', textMuted: '#5c6480',
    textSub: '#8a94b0', topbar: '#141720', sidebar: '#141720',
    sidebarHover: '#1e2235', sidebarActive: '#252a40', sidebarText: '#8a94b0',
  },
  arctic: {
    bg: '#eaf6ff', surface: '#f0faff', surfaceHover: '#ddf0fc',
    border: '#b8dff5', text: '#0a3558', textMuted: '#6aaed4',
    textSub: '#3a7ea8', topbar: '#f0faff', sidebar: '#e4f4fd',
    sidebarHover: '#d4ecf8', sidebarActive: '#bde1f5', sidebarText: '#2a6a94',
  },
  nature: {
    bg: '#eef7f0', surface: '#f3faf5', surfaceHover: '#e0f2e5',
    border: '#b8dfc2', text: '#0d3320', textMuted: '#6aad7a',
    textSub: '#3a7a4a', topbar: '#f3faf5', sidebar: '#e5f3e8',
    sidebarHover: '#d5eadb', sidebarActive: '#c0e2c8', sidebarText: '#2a6a3a',
  },
  ember: {
    bg: '#fff8f0', surface: '#fff3e8', surfaceHover: '#ffe8d0',
    border: '#f0d0a8', text: '#3a1800', textMuted: '#c08060',
    textSub: '#905030', topbar: '#fff3e8', sidebar: '#ffeedd',
    sidebarHover: '#ffdfc8', sidebarActive: '#ffd0b0', sidebarText: '#7a3a18',
  },
  dracula: {
    bg: '#1e1f2e', surface: '#282a36', surfaceHover: '#343646',
    border: '#44475a', text: '#f8f8f2', textMuted: '#6272a4',
    textSub: '#8be9fd', topbar: '#21222c', sidebar: '#21222c',
    sidebarHover: '#2e3048', sidebarActive: '#383a54', sidebarText: '#bd93f9',
  },
  midnight: {
    bg: '#06071a', surface: '#0d0f26', surfaceHover: '#141636',
    border: '#1e2245', text: '#c8ceff', textMuted: '#404880',
    textSub: '#6870c0', topbar: '#090b1f', sidebar: '#090b1f',
    sidebarHover: '#111330', sidebarActive: '#181b3e', sidebarText: '#7078cc',
  },
  luxury: {
    bg: '#1a1208', surface: '#251a0a', surfaceHover: '#302212',
    border: '#4a3418', text: '#f0e0c0', textMuted: '#8a7050',
    textSub: '#c0a060', topbar: '#201608', sidebar: '#201608',
    sidebarHover: '#2e2010', sidebarActive: '#3a2a14', sidebarText: '#c0a060',
  },
};

export const THEME_META: { name: ThemeName; label: string; preview: [string, string] }[] = [
  { name: 'light',    label: 'Light',    preview: ['#ffffff', '#3b82f6'] },
  { name: 'dark',     label: 'Dark',     preview: ['#1a1d27', '#818cf8'] },
  { name: 'retro',    label: 'Retro',    preview: ['#e8e2d8', '#2c2416'] },
  { name: 'arctic',   label: 'Arctic',   preview: ['#eaf6ff', '#0a8fd0'] },
  { name: 'nature',   label: 'Nature',   preview: ['#eef7f0', '#2a7a40'] },
  { name: 'ember',    label: 'Ember',    preview: ['#fff3e8', '#c04020'] },
  { name: 'dracula',  label: 'Dracula',  preview: ['#282a36', '#bd93f9'] },
  { name: 'midnight', label: 'Midnight', preview: ['#0d0f26', '#6870c0'] },
  { name: 'luxury',   label: 'Luxury',   preview: ['#251a0a', '#c0a060'] },
];

export const PRIMARY_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#14b8a6', '#06b6d4', '#4a7c6a',
];

export const FONT_OPTIONS: { value: FontFamily; label: string; preview: string }[] = [
  { value: 'Georgia, serif',                 label: 'Georgia',   preview: 'Aa' },
  { value: "'Palatino Linotype', serif",     label: 'Palatino',  preview: 'Aa' },
  { value: "'Courier New', monospace",       label: 'Courier',   preview: 'Aa' },
  { value: "Verdana, sans-serif",            label: 'Verdana',   preview: 'Aa' },
  { value: "'Trebuchet MS', sans-serif",     label: 'Trebuchet', preview: 'Aa' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English',    native: 'English',    flag: '🇬🇧' },
  { code: 'ms', label: 'Malay',      native: 'Bahasa',     flag: '🇲🇾' },
  { code: 'zh', label: 'Chinese',    native: '中文',         flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic',     native: 'العربية',    flag: '🇸🇦' },
  { code: 'fr', label: 'French',     native: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'German',     native: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ja', label: 'Japanese',   native: '日本語',       flag: '🇯🇵' },
  { code: 'ko', label: 'Korean',     native: '한국어',       flag: '🇰🇷' },
  { code: 'es', label: 'Spanish',    native: 'Español',    flag: '🇪🇸' },
];

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextType {
  // Current values
  theme: ThemeName;
  primary: string;
  navLayout: NavLayout;
  sidenavShape: SidenavShape;
  navColor: NavColor;
  textDir: TextDir;
  fontFamily: FontFamily;
  fontSize: FontSize;
  language: string;
  tokens: ThemeTokens;
  sidebarCollapsed: boolean;
  customizePanelOpen: boolean;
  mobileSidebarOpen: boolean;

  // Setters
  setTheme: (t: ThemeName) => void;
  setPrimary: (c: string) => void;
  setNavLayout: (n: NavLayout) => void;
  setSidenavShape: (s: SidenavShape) => void;
  setNavColor: (c: NavColor) => void;
  setTextDir: (d: TextDir) => void;
  setFontFamily: (f: FontFamily) => void;
  setFontSize: (s: FontSize) => void;
  setLanguage: (l: string) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCustomizePanelOpen: (v: boolean) => void;
  setMobileSidebarOpen: (v: boolean) => void;
  resetAll: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>('retro');
  const [primary, setPrimary] = useState('#4a7c6a');
  const [navLayout, setNavLayout] = useState<NavLayout>('sidenav');
  const [sidenavShape, setSidenavShape] = useState<SidenavShape>('default');
  const [navColor, setNavColor] = useState<NavColor>('default');
  const [textDir, setTextDir] = useState<TextDir>('ltr');
  const [fontFamily, setFontFamily] = useState<FontFamily>('Georgia, serif');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [language, setLanguage] = useState('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customizePanelOpen, setCustomizePanelOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const resetAll = useCallback(() => {
    setTheme('retro');
    setPrimary('#4a7c6a');
    setNavLayout('sidenav');
    setSidenavShape('default');
    setNavColor('default');
    setTextDir('ltr');
    setFontFamily('Georgia, serif');
    setFontSize('md');
    setLanguage('en');
    setSidebarCollapsed(false);
  }, []);

  const tokens = THEME_TOKENS[theme];

  const fontSizeMap: Record<FontSize, string> = { sm: '13px', md: '14px', lg: '15px' };

  return (
    <ThemeContext.Provider value={{
      theme, primary, navLayout, sidenavShape, navColor, textDir,
      fontFamily, fontSize, language, tokens, sidebarCollapsed,
      customizePanelOpen, mobileSidebarOpen,
      setTheme, setPrimary, setNavLayout, setSidenavShape, setNavColor,
      setTextDir, setFontFamily, setFontSize, setLanguage,
      setSidebarCollapsed, setCustomizePanelOpen, setMobileSidebarOpen, resetAll,
    }}>
      <div
        dir={textDir}
        style={{
          fontFamily,
          fontSize: fontSizeMap[fontSize],
          background: tokens.bg,
          color: tokens.text,
          minHeight: '100vh',
          transition: 'background 0.3s, color 0.3s',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
