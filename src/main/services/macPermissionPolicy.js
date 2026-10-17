export const MAC_PRIVACY_PANES = Object.freeze({
  screen: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  accessibility: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
  automation: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation',
});
export function privacyPaneUrl(kind) {
  if (!Object.hasOwn(MAC_PRIVACY_PANES, kind)) throw new Error('Permiso no reconocido.');
  return MAC_PRIVACY_PANES[kind];
}
