# TutorLink Frontend

Baseline tecnico del frontend de TutorLink construido con React, Vite y
Tailwind CSS.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalacion local

```bash
npm install
```

## Variables de entorno

Usa `frontend/.env.example` como referencia segura.

```bash
cp .env.example .env
```

No subas archivos `.env` reales ni credenciales al repositorio.

## Scripts utiles

```bash
npm run dev
npm run build
npm run lint
```

## Estado de esta integracion

Esta primera sesion versiona solo el baseline tecnico:

- configuracion Vite y ESLint
- estilos globales
- shell minimo de la aplicacion
- documentacion local de arranque

Las vistas por rol, autenticacion completa y modulos de negocio se integraran
en commits posteriores dentro de la rama `benjamin`.
