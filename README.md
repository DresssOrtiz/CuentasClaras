# Cuentas Claras

Cuentas Claras es una plataforma web orientada a personas naturales en Colombia, especialmente independientes y freelancers, para organizar ingresos, gastos y soportes con el fin de preparar un borrador de resumen tributario.

## Estado actual del proyecto

Este repositorio ya cuenta con un esqueleto tecnico inicial para desarrollo local usando React, FastAPI, PostgreSQL y Docker Compose.

### Configurado en este paso

- Frontend base en `frontend/` con React + Vite + TypeScript.
- Backend base en `backend/` con FastAPI y endpoint `GET /health`.
- `docker-compose.yml` con servicios para `postgres`, `backend` y `frontend`.
- Conexion minima desde el frontend al backend para mostrar el estado de la API.
- Interfaz visual navegable con vistas mock de inicio, historial, estadisticas, perfil y reporte IA.
- Variables de entorno base en `.env.example`.

### No implementado todavia

- Modelos de dominio definitivos.
- Autenticacion.
- CRUD real.
- Logica tributaria.
- Integraciones externas.
- Conexion funcional completa a PostgreSQL desde la aplicacion.

## Estructura del repositorio

```text
.
|-- backend/
|-- database/
|   |-- init/
|   `-- migrations/
|-- docs/
|   |-- architecture/
|   |-- decisions/
|   `-- product/
|-- frontend/
|-- infra/
|-- scripts/
|-- .editorconfig
|-- .env.example
|-- .gitignore
`-- docker-compose.yml
```

## Servicios y puertos

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check del backend: `http://localhost:8000/health`
- PostgreSQL: `localhost:5432`

## Levantar el proyecto

1. Copia `.env.example` a `.env`.
2. Ajusta los valores si lo necesitas.
3. Ejecuta:

```bash
docker compose up --build
```

4. Abre el frontend en:

```text
http://localhost:5173
```

Deberias ver el titulo `Cuentas Claras`, el texto `Proyecto base en construccion` y el estado de conexion con la API.
Tambien deberias poder navegar entre las vistas base del producto con contenido visual mock.

## Probar el backend

Puedes abrir directamente:

```text
http://localhost:8000/health
```

O probarlo por consola:

```bash
curl http://localhost:8000/health
```

## Detener el proyecto

Para detener los servicios:

```bash
docker compose down
```

PostgreSQL mantiene sus datos en el volumen persistente `postgres_data`.
