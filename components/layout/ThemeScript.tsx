// Runs before paint (via next/script beforeInteractive-equivalent placement
// directly in <head>) so a returning visitor who chose dark mode never sees
// a flash of the light theme. Deliberately does NOT consult
// prefers-color-scheme — the only source of truth is the explicit choice
// stored in localStorage, per the requirement that the default (no stored
// choice) must render exactly as light, unconditionally.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('yomtov-theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
