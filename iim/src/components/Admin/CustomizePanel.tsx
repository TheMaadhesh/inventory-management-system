import React, { useCallback } from 'react';
import {
  useTheme,
  THEME_META, PRIMARY_COLORS, FONT_OPTIONS,
  type NavLayout, type SidenavShape, type NavColor,
  type TextDir, type FontFamily, type FontSize, type ThemeName,
} from '../../context/ThemeContext';
import { ConfirmDialog, useConfirm } from '../shared/ConfirmDialog';

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; badge?: string; children: React.ReactNode }> = ({ title, badge, children }) => {
  const { tokens } = useTheme();
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: tokens.textMuted }}>{title}</p>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${tokens.textSub}20`, color: tokens.textSub }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

// ─── Main panel ───────────────────────────────────────────────────────────────
const CustomizePanel: React.FC = () => {
  const {
    tokens, primary, theme, setTheme, setPrimary,
    navLayout, setNavLayout, sidenavShape, setSidenavShape,
    navColor, setNavColor, textDir, setTextDir,
    fontFamily, setFontFamily, fontSize, setFontSize,
    customizePanelOpen, setCustomizePanelOpen, resetAll,
  } = useTheme();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  const handleReset = useCallback(async () => {
    const ok = await confirm({
      title: 'Reset All Settings?',
      message: 'This will restore the default theme, colors, layout and font. Your current customizations will be lost.',
      confirmLabel: 'Yes, Reset',
      cancelLabel: 'Keep Current',
      icon: '🔄',
    });
    if (ok) resetAll();
  }, [confirm, resetAll]);

  if (!customizePanelOpen) return null;

  const isDark = ['dark', 'dracula', 'midnight', 'luxury'].includes(theme);

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        onClick={() => setCustomizePanelOpen(false)}
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: 300,
          background: tokens.surface,
          borderLeft: `1px solid ${tokens.border}`,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${tokens.border}` }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${primary}20` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: tokens.text }}>Customize</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: tokens.surfaceHover, color: tokens.textSub }}
              onMouseEnter={e => (e.currentTarget.style.background = tokens.border)}
              onMouseLeave={e => (e.currentTarget.style.background = tokens.surfaceHover)}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Reset
            </button>
            <button
              onClick={() => setCustomizePanelOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: tokens.surfaceHover, color: tokens.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.background = tokens.border)}
              onMouseLeave={e => (e.currentTarget.style.background = tokens.surfaceHover)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Theme ── */}
          <Section title="Theme">
            <div className="grid grid-cols-1 gap-1.5">
              {THEME_META.map(t => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name as ThemeName)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: theme === t.name ? `${primary}15` : tokens.surfaceHover,
                    border: `1.5px solid ${theme === t.name ? primary : 'transparent'}`,
                    color: tokens.text,
                  }}
                  onMouseEnter={e => { if (theme !== t.name) e.currentTarget.style.background = tokens.border; }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme === t.name ? `${primary}15` : tokens.surfaceHover; }}
                >
                  {/* Preview swatches */}
                  <div className="flex rounded-lg overflow-hidden flex-shrink-0 shadow-sm" style={{ width: 32, height: 22 }}>
                    <div style={{ flex: 1, background: t.preview[0] }} />
                    <div style={{ flex: 1, background: t.preview[1] }} />
                  </div>
                  <span>{t.label}</span>
                  {theme === t.name && (
                    <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill={primary} stroke="none">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Primary Color ── */}
          <Section title="Primary Color">
            <div className="flex flex-wrap gap-2">
              {PRIMARY_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setPrimary(c)}
                  className="w-8 h-8 rounded-full transition-transform flex items-center justify-center"
                  style={{
                    background: c,
                    boxShadow: primary === c ? `0 0 0 2px ${tokens.bg}, 0 0 0 4px ${c}` : 'none',
                    transform: primary === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {primary === c && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {/* Custom color input */}
            <div className="flex items-center gap-2 mt-3">
              <input
                type="color"
                value={primary}
                onChange={e => setPrimary(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                style={{ background: 'none' }}
              />
              <input
                type="text"
                value={primary}
                onChange={e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setPrimary(e.target.value); }}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none"
                style={{ background: tokens.surfaceHover, color: tokens.text, border: `1px solid ${tokens.border}` }}
              />
            </div>
          </Section>

          {/* ── Navigation Menu ── */}
          <Section title="Navigation Menu">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['sidenav', 'Sidenav'],
                ['topnav', 'Topnav'],
                ['combo', 'Combo'],
              ] as [NavLayout, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setNavLayout(key)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: navLayout === key ? `${primary}15` : tokens.surfaceHover,
                    border: `1.5px solid ${navLayout === key ? primary : 'transparent'}`,
                    color: navLayout === key ? primary : tokens.textSub,
                  }}
                >
                  {/* Mini layout icon */}
                  <div className="w-10 h-7 rounded overflow-hidden" style={{ background: tokens.border }}>
                    {key === 'sidenav' && (
                      <div className="flex h-full">
                        <div style={{ width: '30%', background: isDark ? '#444' : '#bbb' }} />
                        <div style={{ flex: 1, background: tokens.surfaceHover }} />
                      </div>
                    )}
                    {key === 'topnav' && (
                      <div className="flex flex-col h-full">
                        <div style={{ height: '30%', background: isDark ? '#444' : '#bbb' }} />
                        <div style={{ flex: 1, background: tokens.surfaceHover }} />
                      </div>
                    )}
                    {key === 'combo' && (
                      <div className="flex h-full">
                        <div style={{ width: '22%', background: isDark ? '#444' : '#bbb' }} />
                        <div className="flex flex-col flex-1">
                          <div style={{ height: '30%', background: isDark ? '#333' : '#ccc' }} />
                          <div style={{ flex: 1, background: tokens.surfaceHover }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Sidenav Shape ── */}
          {(navLayout === 'sidenav' || navLayout === 'combo') && (
            <Section title="Sidenav Shape">
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['default', 'Default'],
                  ['slim', 'Slim'],
                  ['stacked', 'Stacked'],
                ] as [SidenavShape, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSidenavShape(key)}
                    className="flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: sidenavShape === key ? `${primary}15` : tokens.surfaceHover,
                      border: `1.5px solid ${sidenavShape === key ? primary : 'transparent'}`,
                      color: sidenavShape === key ? primary : tokens.textSub,
                    }}
                  >
                    <div className="w-10 h-7 rounded overflow-hidden flex" style={{ background: tokens.border }}>
                      <div style={{
                        width: key === 'slim' ? '18%' : key === 'stacked' ? '45%' : '35%',
                        background: isDark ? '#444' : '#bbb',
                      }} />
                      <div style={{ flex: 1, background: tokens.surfaceHover }} />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ── Nav Color ── */}
          <Section title="Nav Color">
            <div className="grid grid-cols-2 gap-2">
              {([['default', 'Default'], ['vibrant', 'Vibrant']] as [NavColor, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setNavColor(key)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: navColor === key ? `${primary}15` : tokens.surfaceHover,
                    border: `1.5px solid ${navColor === key ? primary : 'transparent'}`,
                    color: navColor === key ? primary : tokens.textSub,
                  }}
                >
                  <div className="w-8 h-8 rounded-full" style={{
                    background: key === 'vibrant' ? primary : isDark ? '#2a2f45' : '#e8e8e8',
                    boxShadow: key === 'vibrant' ? `0 4px 12px ${primary}60` : 'none',
                  }} />
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Text Direction ── */}
          <Section title="Text Direction">
            <div className="grid grid-cols-2 gap-2">
              {([['ltr', 'LTR'], ['rtl', 'RTL']] as [TextDir, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTextDir(key)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: textDir === key ? `${primary}15` : tokens.surfaceHover,
                    border: `1.5px solid ${textDir === key ? primary : 'transparent'}`,
                    color: textDir === key ? primary : tokens.textSub,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: key === 'rtl' ? 'scaleX(-1)' : 'none' }}>
                    <path d="M21 6H3M15 12H3M17 18H3"/>
                    <path d="M21 12l-4-4v8l4-4z" fill="currentColor" stroke="none"/>
                  </svg>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Font Family ── */}
          <Section title="Font Family" badge="New">
            <div className="grid grid-cols-1 gap-1.5">
              {FONT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFontFamily(f.value as FontFamily)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                  style={{
                    fontFamily: f.value,
                    background: fontFamily === f.value ? `${primary}15` : tokens.surfaceHover,
                    border: `1.5px solid ${fontFamily === f.value ? primary : 'transparent'}`,
                    color: tokens.text,
                  }}
                  onMouseEnter={e => { if (fontFamily !== f.value) e.currentTarget.style.background = tokens.border; }}
                  onMouseLeave={e => { e.currentTarget.style.background = fontFamily === f.value ? `${primary}15` : tokens.surfaceHover; }}
                >
                  <span>{f.label}</span>
                  <span className="text-base" style={{ color: fontFamily === f.value ? primary : tokens.textMuted }}>{f.preview}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Font Size ── */}
          <Section title="Font Size">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['sm', 'Small', 'T', 15],
                ['md', 'Medium', 'T', 19],
                ['lg', 'Large', 'T', 23],
              ] as [FontSize, string, string, number][]).map(([key, label, t, sz]) => (
                <button
                  key={key}
                  onClick={() => setFontSize(key)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: fontSize === key ? `${primary}15` : tokens.surfaceHover,
                    border: `1.5px solid ${fontSize === key ? primary : 'transparent'}`,
                    color: fontSize === key ? primary : tokens.textSub,
                  }}
                >
                  <span style={{ fontSize: sz, fontWeight: 700, lineHeight: 1 }}>{t}</span>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Footer ── */}
          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold" style={{ color: primary }}>And more</p>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>Coming soon...</p>
          </div>
        </div>
      </aside>
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} tokens={{ ...tokens, card: tokens.surface, cardHover: tokens.surfaceHover, muted: tokens.textMuted, sub: tokens.textSub }} primary={primary} />
    </>
  );
};

export default CustomizePanel;
