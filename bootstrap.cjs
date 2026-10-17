const { app } = require('electron');
const path = require('node:path');
// Configurar antes de importar stores, colas y servicios del proceso principal.
app.setName('LogYourTime Mac Prototype');
app.setPath('userData', path.join(app.getPath('appData'), 'LogYourTime Mac Prototype'));
import('./out/main/index.js').catch(error => { console.error(error); app.exit(1); });
