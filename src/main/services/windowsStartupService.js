import { app } from 'electron';

import logger from '../utils/logger.js';


function isSupported() {
  return process.platform === 'darwin' && app.isPackaged;
}

const windowsStartupService = {
  setEnabled(enabled) {
    if (!isSupported()) {
      logger.info('Inicio con macOS omitido fuera de una instalacion empaquetada.');
      return { enabled: enabled === true, supported: false };
    }

    try {
      app.setLoginItemSettings({
        openAtLogin: enabled === true,
      });

      const settings = app.getLoginItemSettings();

      if (settings.openAtLogin !== (enabled === true)) {
        logger.warn('macOS no confirmo el cambio de inicio automatico.');
      }

      logger.info(`Inicio automatico con macOS ${settings.openAtLogin ? 'habilitado' : 'deshabilitado'}.`);
      return { enabled: settings.openAtLogin, supported: true };
    } catch (error) {
      logger.error(`No se pudo cambiar el inicio con macOS: ${error.message}`);
      return { enabled: enabled === true, supported: true, error: true };
    }
  },

  enable() {
    return this.setEnabled(true);
  },
};

export default windowsStartupService;
