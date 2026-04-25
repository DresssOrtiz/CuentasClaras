# Cuentas Claras

Cuentas Claras es una plataforma web orientada a personas naturales en Colombia, especialmente independientes y freelancers, para organizar ingresos, gastos y soportes con el fin de preparar un borrador de resumen tributario.

## Estado actual del proyecto

Este repositorio solo deja lista una base inicial de organizacion.

### Configurado en este paso

- Estructura base de carpetas para frontend, backend, documentacion, infraestructura, base de datos y scripts.
- Archivo `docker-compose.yml` con una instancia minima de PostgreSQL.
- Variables de entorno base en `.env.example`.
- Archivos `README.md` y placeholders para orientar el crecimiento del proyecto.

### No implementado todavia

- Frontend real.
- Backend real.
- Modelos de dominio definitivos.
- Endpoints o API.
- Autenticacion.
- Logica tributaria.
- Integraciones externas.

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

## Levantar PostgreSQL con Docker

1. Copia `.env.example` a `.env`.
2. Ajusta los valores si lo necesitas.
3. Ejecuta:

```bash
docker compose up -d postgres
```

4. Para detener el servicio:

```bash
docker compose down
```

El contenedor expone PostgreSQL en el puerto definido por `POSTGRES_PORT` y guarda los datos en un volumen persistente llamado `postgres_data`.
