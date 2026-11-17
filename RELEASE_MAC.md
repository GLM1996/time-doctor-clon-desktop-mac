# Publicación de LogYourTime para macOS

Esta carpeta es la raíz del repositorio independiente:
https://github.com/GLM1996/time-doctor-clon-desktop-mac
No coloques este workflow en el repositorio de Windows.
El remoto origin de esta copia ya apunta al repositorio de Mac.
Comprueba `git remote -v` antes de publicar desde otra copia.

## Instaladores

`npm ci`, `npm test` y `npm run dist:mac` en un Mac generan DMG y ZIP
para Intel (x64) y Apple Silicon (arm64). Los ZIP son necesarios para las
actualizaciones. `npm run release:verify` comprueba versión, tamaño y SHA-512
contra latest-mac.yml para las dos arquitecturas.

Las compilaciones de distribución requieren firma Developer ID Application
y notarización de Apple. No se distribuyen builds sin firma.
El workflow además valida la firma y el ticket de notarización antes de publicar.

## GitHub Actions

Configura estos secretos del repositorio:

- MAC_CERTIFICATE_BASE64: certificado Developer ID Application exportado como P12,
  incluyendo la clave privada, codificado en Base64.
- MAC_CERTIFICATE_PASSWORD: contraseña del P12.
- APPLE_ID: cuenta del Apple Developer Program.
- APPLE_APP_SPECIFIC_PASSWORD: contraseña específica para notarización.
- APPLE_TEAM_ID: identificador del equipo Apple.

Conserva estos secretos del repositorio que usa el workflow anterior:

- R2_ENDPOINT: endpoint HTTPS completo de R2.
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY

- R2_BUCKET: nombre del bucket existente.
Las credenciales R2 necesitan escritura de objetos únicamente en ese bucket.
No guardes certificados ni credenciales en Git.

Se confirmó el uso de Cloudflare R2 en el workflow remoto macos-prototype.yml.
Se conservan mac/LogYourTime-arm64.dmg y mac/LogYourTime-x64.dmg para la web.
El bucket debe servir públicamente:
https://downloads.logyourtime.com/mac/
Si el dominio o prefijo real es otro, ajusta build.publish.url en package.json
y DEST en el workflow antes de compilar. Una regla de Cloudflare debe omitir caché
para /mac/latest-mac.yml, incluso si existe una regla general de caché.
El workflow publica primero los instaladores y después el manifiesto con no-store.
No borra archivos anteriores ni escribe objetos en /windows/.

1. Actualiza version en package.json y package-lock.json.
2. Sube los cambios al repositorio Mac. Retira los workflows antiguos
   macos-prototype.yml y macos-legacy.yml al integrar esta carpeta; dependen de
   scripts del prototipo anterior y no deben publicar a la vez que release.yml.
3. Crea un tag v<version> que coincida con package.json y súbelo.
4. El workflow compila en macOS, prueba, firma, notariza y guarda los artefactos.
5. El job publish-r2 descarga esos artefactos y los publica en el prefijo mac/.

La ejecución manual también debe seleccionar el tag de esa versión.
No vuelvas a publicar el mismo número: usa una versión nueva para cada release.

## Comprobación en un Mac real

Instala arrastrando LogYourTime a Aplicaciones antes de abrirla. Autoriza
Accesibilidad y Grabación de pantalla en Ajustes del Sistema > Privacidad y
seguridad. Cierra por completo y abre otra vez después de cambiar permisos.
Autoriza Automatización para el navegador si macOS lo solicita.

Comprueba inicio de sesión, inicio/pausa/fin del seguimiento, actividad y dominio
en Safari y Chrome, capturas de todos los monitores, suspensión y reconexión,
inicio al iniciar sesión y actualización desde una versión anterior firmada.
La X mantiene la aplicación en la barra de menús; minimizar usa el Dock.
Salir desde el menú de la aplicación o Cmd+Q termina el proceso.

La compilación de JavaScript y las pruebas en Windows no sustituyen esta prueba
nativa. RELEASE_WINDOWS.md y el verificador Windows se conservan como referencia;
los comandos de publicación de esta carpeta usan exclusivamente el flujo Mac.

## Pruebas sin certificado Apple

En GitHub abre Actions > Generar instalador macOS de pruebas > Run workflow,
selecciona main y confirma Run workflow. No requiere tags ni secretos Apple.
Utiliza los cuatro secretos R2 ya configurados. Genera DMG y ZIP para ambas
arquitecturas con firma ad hoc local, sin certificado Developer ID ni notarización.
Las actualizaciones automáticas quedan desactivadas en esta compilación.

Descarga el artifact LogYourTime-macOS-pruebas del workflow o usa:
- https://downloads.logyourtime.com/mac/testing/LogYourTime-arm64.dmg
- https://downloads.logyourtime.com/mac/testing/LogYourTime-x64.dmg

Los enlaces existen después de completar el job upload-r2. macOS puede bloquear
la apertura: después de intentar abrir la app, usa Ajustes del Sistema > Privacidad
y seguridad > Abrir igualmente, si macOS ofrece esa opción.
