# Personalización institucional futura

Actualizado el 13/10/2026. La interfaz incorpora `ThemeProvider`, pero no solicita una API de marca en esta fase. Todas las instituciones, el acceso general, OTP, primer acceso y aceptación de invitaciones usan la identidad predeterminada de TutorLink.

## Comportamiento actual

- Los tokens semánticos definen azul `#18529D`, verde de identidad `#28AD56` y acción positiva accesible `#166534` con texto blanco.
- Al cambiar de contexto se resuelve de nuevo el tema y se restablecen colores, logotipos y favicon al tema TutorLink antes de poder mostrar una marca futura. Así no persiste la identidad visual de la institución anterior.
- Las configuraciones futuras se validan localmente: colores hexadecimales de seis caracteres con contraste suficiente, URL HTTPS sin credenciales ni fragmento y activos de hasta 2048 caracteres. Un valor inválido se descarta por campo y nunca bloquea el acceso.
- El nombre textual de la institución permanece como referencia de contexto aunque un futuro logo no cargue.

## Contratos a implementar posteriormente

El contexto autenticado podrá añadir, asociado al JWT contextual, un objeto validado con `institutionId`, `primaryColor`, `secondaryColor`, `logoUrl`, `sidebarLogoUrl`, `loginLogoUrl` y `faviconUrl`. El backend debe validar la pertenencia de los activos, HTTPS, formato/tamaño y contrastes antes de emitirlo. No debe conceder permisos ni reemplazar la institución declarada por el JWT.

Una fase separada podrá ofrecer `GET /api/public/institutions/{code}/branding` para una ruta pública como `/{code}` antes de iniciar sesión. `code` debe validarse y la respuesta solo entrega marca pública validada. La URL no selecciona institución activa, no crea sesión ni concede permisos. La ruta `/BenitoJuarez` y ese endpoint no existen todavía.
