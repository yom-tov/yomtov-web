// Applies any saved accessibility preferences to <html> before first paint,
// the same early-script pattern as ThemeScript — so a returning visitor who
// set e.g. high contrast never sees a flash of the default styling.
const A11Y_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('yomtov-a11y');
    if (!raw) return;
    var s = JSON.parse(raw);
    var html = document.documentElement;
    if (s.fontSize && s.fontSize !== 100) html.setAttribute('data-a11y-fontsize', String(s.fontSize));
    if (s.highContrast) html.setAttribute('data-a11y-contrast', 'high');
    if (s.underlineLinks) html.setAttribute('data-a11y-underline-links', 'true');
    if (s.stopAnimations) html.setAttribute('data-a11y-stop-animations', 'true');
    if (s.readableFont) html.setAttribute('data-a11y-readable-font', 'true');
  } catch (e) {}
})();
`;

export function AccessibilityScript() {
  return <script dangerouslySetInnerHTML={{ __html: A11Y_SCRIPT }} />;
}
