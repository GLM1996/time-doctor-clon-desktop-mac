import { dialog, shell, systemPreferences } from 'electron';

export function hasMacAccessibilityPermission() {
  return process.platform !== 'darwin' || systemPreferences.isTrustedAccessibilityClient(false);
}

export function macActiveWindowOptions() {
  if (process.platform !== 'darwin') return undefined;
  return {
    accessibilityPermission: hasMacAccessibilityPermission(),
    screenRecordingPermission: systemPreferences.getMediaAccessStatus('screen') === 'granted',
  };
}

export function assertMacScreenPermission() {
  if (process.platform !== 'darwin') return;
  const status = systemPreferences.getMediaAccessStatus('screen');
  // A first capture triggers the native consent prompt when not yet determined.
  if (status === 'denied' || status === 'restricted') {
    throw new Error('Autoriza LogYourTime en Ajustes del Sistema > Privacidad y seguridad > Grabación de pantalla y vuelve a abrir la aplicación.');
  }
}

export async function explainMacPermissions(window) {
  if (process.platform !== 'darwin') return;
  const accessibility = hasMacAccessibilityPermission();
  const screen = systemPreferences.getMediaAccessStatus('screen') === 'granted';
  if (accessibility && screen) return;
  const { response } = await dialog.showMessageBox(window, {
    type: 'info',
    title: 'Permisos de LogYourTime',
    message: 'Configura los permisos de macOS',
    detail: 'Accesibilidad permite identificar la aplicación y el dominio activos. Grabación de pantalla permite capturar los monitores y el título de la ventana durante el seguimiento. Puedes autorizarlos en Privacidad y seguridad. Después de cambiar estos permisos, cierra y vuelve a abrir LogYourTime.',
    buttons: ['Abrir Accesibilidad', 'Abrir Grabación de pantalla', 'Más tarde'],
    defaultId: 0,
    cancelId: 2,
  });
  if (response < 2) {
    const pane = response === 0 ? 'Privacy_Accessibility' : 'Privacy_ScreenCapture';
    await shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?${pane}`);
  }
}
