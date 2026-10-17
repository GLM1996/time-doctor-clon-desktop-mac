import { app, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../ipc/channels.js';
const unavailable = () => ({ success: false, message: 'Prototipo macOS: instala manualmente el siguiente paquete de prueba.' });
const service = {
  setBeforeInstallHandler() {}, startPeriodicCheck() {}, beginStartupHealthCheck() {}, destroy() {},
  checkForUpdates: unavailable, downloadUpdate: unavailable, installAndRestart: unavailable,
  getStatus: () => ({ isChecking: false, isDownloading: false, isInstalling: false, updateAvailable: false, updateDownloaded: false, currentVersion: app.getVersion(), health: {} }),
};
for (const [channel, handler] of [[IPC_CHANNELS.UPDATE_CHECK, unavailable], [IPC_CHANNELS.UPDATE_DOWNLOAD, unavailable], [IPC_CHANNELS.UPDATE_INSTALL, unavailable], [IPC_CHANNELS.UPDATE_GET_STATUS, service.getStatus]]) ipcMain.handle(channel, handler);
export default service;
