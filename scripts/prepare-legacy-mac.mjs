import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Generate an isolated project; never downgrade the modern client's dependencies.
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(source, 'legacy-build');
try {
  await access(target);
  throw new Error('legacy-build already exists. Use a clean checkout to prepare another legacy build.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await mkdir(target);
for (const name of ['src', 'assets', 'resources', 'browser-extension', 'scripts', 'test', 'tailwind.config.js', 'postcss.config.js']) {
  await cp(path.join(source, name), path.join(target, name), { recursive: true });
}
const pkg = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
pkg.name = 'log-your-time-mac-legacy-experimental';
pkg.build.appId += '.legacy';
pkg.build.productName = 'LogYourTime Mac Legacy Experimental';
pkg.build.mac.minimumSystemVersion = '10.13';
pkg.build.mac.target = [{ target: 'dmg', arch: ['x64'] }, { target: 'zip', arch: ['x64'] }];
pkg.build.asarUnpack = ['node_modules/active-win/**', 'node_modules/better-sqlite3/**'];
pkg.dependencies['active-win'] = '7.7.2';
delete pkg.dependencies['get-windows'];
pkg.dependencies['electron-store'] = '8.2.0';
pkg.dependencies['better-sqlite3'] = '9.4.3';
pkg.devDependencies.electron = '26.6.10';
await writeFile(path.join(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
await writeFile(path.join(target, 'bootstrap.cjs'), `const { app } = require('electron');
const path = require('node:path');
app.setName('LogYourTime Mac Legacy Experimental');
app.setPath('userData', path.join(app.getPath('appData'), 'LogYourTime Mac Legacy Experimental'));
require('./out/main/index.cjs');
`);
await writeFile(path.join(target, 'electron.vite.config.js'), `import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: { 'import.meta.url': '__legacyModuleUrl' },
    build: { target: 'node18', rollupOptions: {
      input: { index: path.resolve('src/main/index.js') },
      output: { format: 'cjs', entryFileNames: 'index.cjs', banner: 'const __legacyModuleUrl = require("node:url").pathToFileURL(module.filename).href;' }
    } }
  },
  preload: { plugins: [externalizeDepsPlugin()], build: { rollupOptions: {
    output: { format: 'cjs', entryFileNames: 'preload.cjs' }
  } } },
  renderer: { root: 'src/renderer', plugins: [react()], build: { target: 'chrome116' } }
});
`);
const activity = path.join(target, 'src/main/services/activityService.js');
await writeFile(activity, (await readFile(activity, 'utf8')).replace(
  "import { activeWindow } from 'get-windows';", "import activeWindow from 'active-win';"));
// Screen recording privacy controls were introduced in Catalina (Darwin 19).
const permissions = path.join(target, 'src/main/services/macPermissions.js');
await writeFile(permissions, (await readFile(permissions, 'utf8'))
  .replace("import { privacyPaneUrl }", "import { release } from 'node:os';\nimport { privacyPaneUrl }")
  .replace("screen: systemPreferences.getMediaAccessStatus('screen')", "screen: Number(release().split('.')[0]) < 19 ? 'granted' : systemPreferences.getMediaAccessStatus('screen')"));
console.log(`Experimental Intel project prepared at ${target}. Install dependencies and validate on macOS before distribution.`);
