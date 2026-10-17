import { ipcMain, systemPreferences, shell, desktopCapturer } from 'electron';
import { privacyPaneUrl } from './macPermissionPolicy.js';
export function getMacPermissionStatus() {
  if (process.platform !== 'darwin') return { supported: false };
  return { supported: true, screen: systemPreferences.getMediaAccessStatus('screen'), accessibility: systemPreferences.isTrustedAccessibilityClient(false) };
}
export function registerMacPermissions() {
  ipcMain.handle('mac-permissions:status', () => getMacPermissionStatus());
  ipcMain.handle('mac-permissions:open', async (_event, kind) => {
    const url = privacyPaneUrl(kind);
    if (process.platform !== 'darwin') return { supported: false };
    if (kind === 'screen') {
      // Acción explícita del usuario: registra la app y activa la solicitud del sistema.
      // Las miniaturas no se guardan ni se envían.
      try { await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } }); } catch {}
    }
    if (kind === 'accessibility') systemPreferences.isTrustedAccessibilityClient(true);
    await shell.openExternal(url);
    return getMacPermissionStatus();
  });
}
