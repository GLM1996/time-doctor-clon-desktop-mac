import test from 'node:test';
import assert from 'node:assert/strict';
import { privacyPaneUrl } from '../src/main/services/macPermissionPolicy.js';
test('solo se abren los paneles de privacidad autorizados', () => {
  assert.match(privacyPaneUrl('screen'), /Privacy_ScreenCapture$/);
  assert.match(privacyPaneUrl('accessibility'), /Privacy_Accessibility$/);
  for (const value of ['https://example.com', 'constructor', '__proto__', null]) assert.throws(() => privacyPaneUrl(value));
});
