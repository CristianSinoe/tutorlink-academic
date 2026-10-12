# TutorLink

TutorLink es una plataforma academica con:

- `frontend`: React + Vite
- `backend`: Spring Boot
- `db`: PostgreSQL

## Uso local con Docker

Levanta todo el stack con:

```bash
docker compose up --build
```

Servicios expuestos:

- Frontend en `http://localhost:5173`
- Backend en `http://localhost:8080`

Desde otros dispositivos en la misma red local, abre el frontend con:

```text
http://IP_DE_LA_MAQUINA:5173
```

En ese caso, el frontend detecta automaticamente el host usado en el navegador y llama al backend en:

```text
http://IP_DE_LA_MAQUINA:8080
```

## Obtener la IP local en Linux

Puedes obtener la IP de la maquina anfitriona con cualquiera de estos comandos:

```bash
ip addr
hostname -I
```

## Variables de entorno importantes

### Frontend

- `VITE_API_BASE_URL`
  - si tiene valor, el frontend usa esa URL del backend;
  - si esta vacia o no existe, el frontend usa `window.location` y construye `PROTOCOLO://HOST:8080`.

El archivo [`frontend/.env.example`](/home/sinoe/TUTORLINK/frontend/.env.example) deja `VITE_API_BASE_URL` vacio a proposito para activar la autodeteccion.

### Backend

- `FRONTEND_BASE_URL`
  - se usa para links generados por el backend, como flujos de primer ingreso o correos;
  - no se autodetecta en servidor, asi que si necesitas enlaces externos correctos en LAN debes definirlo manualmente, por ejemplo `http://IP_DE_LA_MAQUINA:5173`.
- `TUTORLINK_CORS_ALLOWED_ORIGIN_PATTERNS`
  - por defecto permite patrones para `localhost`, `127.0.0.1`, `192.168.*.*` y `10.*.*.*`;
  - esta configuracion es solo para desarrollo local/LAN y en produccion debe restringirse.

## Notas de Docker Compose

- `backend` se conecta a PostgreSQL usando el hostname interno `db`.
- PostgreSQL no se publica hacia la red local; queda accesible solo dentro de Docker.
- No hay IPs fijas en `docker-compose.yml`, por lo que el stack puede levantarse en cualquier maquina sin tocar codigo.
