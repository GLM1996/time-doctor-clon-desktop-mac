# LogYourTime: prototipo macOS

Copia aislada de desktop para probar macOS. No modifica el cliente Windows.
Se excluyeron .git, .env, node_modules, logs, out e instaladores del original.
La aplicación usa otro identificador y otra carpeta de datos. No reutiliza credenciales ni colas de la versión estable.

## Estado

- Interfaz, temporizador, pausas, sincronización y capturas conservan la base existente.
- Permisos de pantalla y accesibilidad visibles dentro de la app, con acceso a Ajustes del Sistema.
- Ventana activa y dominios mediante get-windows; la extensión Chromium sigue disponible. El colector PowerShell está desactivado.
- Inicio automático en macOS opcional, desactivado inicialmente.
- Actualizaciones y publicación desactivadas: los instaladores de prueba se descargan manualmente.
- Paquetes separados arm64 (Apple Silicon) y x64 (Intel), con requisito mínimo macOS 12 (Monterey), incluido 12.7.6. La compatibilidad funcional debe verificarse en ese sistema.
- Firma ad hoc de desarrollo, sin notarización ni certificado Developer ID. No es una distribución pública final.

## Construir sin tener una Mac

1. Puedes subir el CONTENIDO de desktop-mac como un repositorio independiente: incluye su propio .github/workflows/macos-prototype.yml. Si utilizas un monorepositorio, sube desktop-mac y el workflow de la raíz .github/workflows/desktop-mac-prototype.yml conservando las rutas. No habilites las dos alternativas a la vez. Esta carpeta no contiene un repositorio Git anidado.
2. En GitHub, abre Actions → Desktop macOS prototype → Run workflow. También se ejecuta al subir cambios de estas rutas.
3. Cada arquitectura instala sus dependencias en un runner macOS, ejecuta pruebas, compila y verifica el arranque de Electron y el puente preload.
4. Descarga los artifacts LogYourTime-mac-prototype-arm64 y LogYourTime-mac-prototype-x64. Contienen DMG y ZIP; no se publican en releases ni en el servidor de Windows.
5. Los artifacts se conservan 14 días. El consumo de minutos depende de tu plan de GitHub.

El workflow está preparado en disco. Debe subirse al repositorio y ejecutarse para obtener un instalador macOS; una compilación de JavaScript en Windows no lo sustituye.

## Configurar el servidor

Copia .env.example a .env y ajusta VITE_API_URL antes de compilar. Sin configuración se usa el backend actual https://backend.logyourtime.com/api. Para pruebas que creen sesiones usa una cuenta/organización de pruebas.
En GitHub define la variable de repositorio MAC_PROTOTYPE_API_URL para compilar contra un backend de pruebas HTTPS. No guardes tokens ni contraseñas en el código.

## En una Mac remota o prestada

Para desarrollo: npm ci, npm run dev. El servidor de la interfaz usa el puerto 5174.
Para instalador: npm run dist:mac -- --arm64 (Apple Silicon) o --x64 (Intel).
Para probar arranque sin iniciar sesión: npm run build y npm run smoke:mac. Esta prueba bloquea las solicitudes HTTP/HTTPS y no inicia jornadas ni capturas.

Abre el DMG, arrastra LogYourTime Mac Prototype a Aplicaciones y ejecútalo desde allí. Al no estar notarizado, macOS puede bloquear su apertura: usa únicamente el paquete que generaste y la opción de apertura permitida en Privacidad y seguridad; no desactives Gatekeeper globalmente.

Autoriza la aplicación en Privacidad y seguridad → Grabación de pantalla y Accesibilidad. Cierra y abre tras cambiar pantalla. Para dominios del navegador puede aparecer también una solicitud de Automatización para el ejecutable auxiliar de get-windows. En modo desarrollo los permisos pueden figurar como Electron y deben concederse de nuevo a la app instalada.

## Pruebas manuales necesarias antes de usarlo con empleados

- Iniciar sesión con cuenta de pruebas, iniciar/parar jornada y usar pausas; comprobar los mismos tiempos en la web.
- Denegar y luego conceder los permisos; comprobar mensajes y capturas reales en todos los monitores.
- Cambiar entre aplicaciones y navegadores, verificar actividad, dominios y exclusiones.
- Probar desconexión/reconexión, cierre, reposo/reactivación y reinicio.
- Habilitar/deshabilitar el inicio al iniciar sesión y confirmar el resultado tras reiniciar.
- Verificar instalación limpia en otra Mac y en ambas arquitecturas si ambas se distribuyen.

Los runners validan compilación y arranque; no sustituyen estas pruebas interactivas, los permisos de privacidad ni una jornada real. No se ha afirmado compatibilidad real hasta ejecutarlas en macOS.

Documentación: https://www.electronjs.org/docs/latest/api/system-preferences y https://docs.github.com/en/actions/reference/runners/github-hosted-runners

## Descargas desde la web mediante Cloudflare R2

El menú de usuario de la web ofrece Windows y las dos arquitecturas de Mac. Los dos workflows incluyen una subida directa desde GitHub a Cloudflare R2 después de completar ambas compilaciones. Se ejecuta únicamente al pulsar Actions → Desktop macOS prototype → Run workflow; los eventos push y pull_request solo compilan y conservan los artifacts.

En el repositorio que uses, configura Settings → Secrets and variables → Actions con estos cuatro secretos:

| Secreto | Valor |
| --- | --- |
| R2_ACCESS_KEY_ID | Access Key ID del token R2. |
| R2_SECRET_ACCESS_KEY | Secret Access Key del token R2. |
| R2_ENDPOINT | Endpoint S3 HTTPS completo indicado por Cloudflare para el bucket, incluida su jurisdicción si corresponde. |
| R2_BUCKET | Nombre del bucket público de instaladores, sin URL ni rutas. |

El token debe tener Object Read & Write limitado a ese bucket. No guardes sus valores en archivos ni uses el bucket privado de capturas. Si falta un secreto, la subida falla con un mensaje de configuración; los artifacts de compilación se conservan en GitHub.

Cada ejecución manual guarda DMG y ZIP originales en mac/build-NUMERO-INTENTO/ y actualiza los DMG que consume la web con estas claves fijas:

- mac/LogYourTime-arm64.dmg → Apple Silicon.
- mac/LogYourTime-x64.dmg → Intel.

La web usa https://downloads.logyourtime.com/mac/LogYourTime-arm64.dmg y https://downloads.logyourtime.com/mac/LogYourTime-x64.dmg. R2 debe tener ese dominio conectado al bucket para servir los enlaces. Los DMG fijos se suben con Cache-Control para revalidar; si el dominio ya tenía copias en caché o reglas que fuerzan caché, purga esas dos URLs tras la primera publicación. Los enlaces devolverán 404 hasta la primera subida correcta. La configuración no crea el bucket, el dominio ni las credenciales y no habilita actualizaciones automáticas dentro de la app.
