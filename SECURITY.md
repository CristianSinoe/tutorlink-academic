# Configuración privada y publicación segura

Los archivos `.env`, `.env.*` (excepto plantillas `.example`), `cypress.env.json`, claves privadas, logs, vídeos, capturas y volcados locales no deben versionarse. `.gitignore` protege el árbol de trabajo y los contextos Docker excluyen configuración privada. Un archivo ya versionado no queda protegido por añadirlo a `.gitignore`.

Nunca introducir secretos en variables `VITE_*`: su contenido puede terminar en el navegador. Únicamente la URL pública de API y la clave **pública** de reCAPTCHA pertenecen a la configuración frontend. Contraseñas, secretos JWT, SMTP, capacidades IPC y claves reCAPTCHA privadas pertenecen al servidor o al proceso local de pruebas.

## Antes de publicar

```sh
python3 scripts/check-secrets.py
# Revisión adicional de todas las referencias locales del historial:
python3 scripts/check-secrets.py --history
git diff --cached --stat
git diff --cached --check
```

El detector utiliza firmas de claves privadas y tokens conocidos; revisa archivos versionados, bytes preparados en el índice e historial opcional. Muestra rutas/tipos, nunca los valores detectados. No sustituye una revisión humana ni garantiza encontrar contraseñas arbitrarias, secretos codificados o credenciales en sistemas externos. No analiza archivos ignorados ni referencias remotas no descargadas. Las credenciales demo sintéticas y la clave oficial pública de prueba de reCAPTCHA son fixtures de prueba, no credenciales productivas. Nunca reutilizarlas fuera de demo/E2E.

Si una credencial real se publicó, **revocarla o rotarla primero**. Borrar el archivo en un commit posterior no la elimina del historial. La reescritura de ramas compartidas debe coordinarse; no hacer `push --force` como limpieza automática. Tampoco compartir HAR, logs de Cypress o vídeos de pruebas con datos reales: pueden contener sesiones o respuestas sensibles.

## Entorno reproducible de pruebas

Consultar [README](README.md) y [la guía E2E](docs/ui-ux/INTEGRACION_LOCAL_E2E.md). `python3 scripts/e2e/prepare-local.py` genera contraseña PostgreSQL y secreto JWT aleatorios en un archivo local con permisos `0600`; no muestra valores ni sobrescribe una configuración existente. La clave secreta oficial de **prueba** de Google incluida en esa configuración es pública y se limita al entorno `demo,e2e`; el acceso automatizado usa además una capacidad aleatoria por ejecución.

Los Compose exigen contraseña por variable de entorno, sin valores privados fijos. El Compose E2E publica PostgreSQL solo en loopback y usa `tmpfs`. El runner comprueba host/puerto/base/usuario, activa exclusivamente `demo,e2e`, genera capacidades IPC temporales y elimina sus recursos al terminar. No ejecutar estos perfiles ni sembrar datos demo en producción.

En desarrollo persistente, cambiar la variable de contraseña no cambia una contraseña ya almacenada en un volumen PostgreSQL existente. No borrar ese volumen para resolverlo: conservar su configuración local o coordinar una rotación explícita.
