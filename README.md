# Cuentas Claras

Cuentas Claras es una plataforma web orientada a personas naturales en Colombia, especialmente independientes y freelancers, para organizar ingresos, gastos y soportes con el fin de preparar un borrador de resumen tributario.

## Estado actual del proyecto

Este repositorio ya cuenta con un MVP local funcional y con preparacion para un entorno `staging` en Render.

### Ya implementado

- Autenticacion minima real con registro, login, logout y usuario autenticado actual.
- Frontend en `frontend/` con React + Vite + TypeScript.
- Backend en `backend/` con FastAPI.
- PostgreSQL para persistencia de movimientos y metadata de soportes.
- Flujo real para crear, listar, editar y eliminar movimientos por usuario autenticado.
- Estadisticas reales por tipo y categoria.
- Soporte real por movimiento con carga, reemplazo, visualizacion, descarga y eliminacion.
- Revision manual real por movimiento con estados `pending`, `reviewed` y `flagged`.
- Resumen real del expediente en el dashboard.
- Compatibilidad local con Docker Compose.
- Preparacion de despliegue `staging` para Render con frontend estatico, backend web service, Render Postgres y persistent disk para soportes.

### No implementado todavia

- Multiusuario.
- OCR.
- IA real.
- Storage cloud.
- Logica tributaria compleja.
- Endurecimiento completo de produccion.

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
|-- docker-compose.yml
`-- render.yaml
```

## Variables de entorno

### Backend

- `APP_NAME`: nombre visible de la API.
- `APP_ENV`: ambiente de ejecucion, por ejemplo `development` o `staging`.
- `BACKEND_PORT`: puerto local para Docker Compose.
- `DATABASE_URL`: conexion a PostgreSQL. La app acepta URLs tipo `postgresql://...` de Render y las normaliza para SQLAlchemy + psycopg.
- `CORS_ALLOWED_ORIGINS`: lista separada por comas con los origenes permitidos para el frontend.
- `SUPPORT_STORAGE_PATH`: ruta donde se guardan los archivos de soporte.
- `AUTH_SECRET_KEY`: secreto usado para firmar tokens de autenticacion.
- `AUTH_TOKEN_EXPIRE_MINUTES`: duracion del token.
- `AUTH_PASSWORD_ITERATIONS`: iteraciones del hash PBKDF2.

### Base de datos

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

### Frontend

- `VITE_API_URL`: URL base del backend. En local suele ser `http://localhost:8000`. En Render puede apuntar al dominio del backend, por ejemplo `https://tu-backend.onrender.com`.

## Desarrollo local con Docker Compose

### URLs locales

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- Movimientos: `http://localhost:8000/movements`
- Estadisticas: `http://localhost:8000/movements/stats`
- Resumen de revision: `http://localhost:8000/review/summary`
- PostgreSQL: `localhost:5432`

### Levantar el proyecto

1. Copia `.env.example` a `.env`.
2. Revisa los valores locales.
3. Ejecuta:

```bash
docker compose up --build
```

4. Abre:

```text
http://localhost:5173
```

### Detener el proyecto

```bash
docker compose down
```

PostgreSQL mantiene sus datos en el volumen `postgres_data`.
Los archivos de soporte se conservan en el volumen `support_uploads`.

## Endpoints disponibles

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /movements`
- `POST /movements`
- `PUT /movements/{movement_id}`
- `DELETE /movements/{movement_id}`
- `GET /movements/stats`
- `PATCH /movements/{movement_id}/review`
- `POST /movements/{movement_id}/support`
- `GET /movements/{movement_id}/support`
- `DELETE /movements/{movement_id}/support`
- `GET /movements/{movement_id}/support/file`
- `GET /movements/{movement_id}/support/download`
- `GET /review/summary`

## Categorias disponibles en esta etapa

Ingresos:

- `Salario`
- `Honorarios`
- `Ventas`
- `Otros ingresos`

Gastos:

- `Hogar`
- `Transporte`
- `Salud`
- `Educacion`
- `Alimentacion`
- `Servicios`
- `Otros gastos`

## Despliegue de staging en Render

La preparacion de staging sigue esta arquitectura:

- Frontend: `Static Site`
- Backend: `Web Service`
- Base de datos: `Render Postgres`
- Soportes: `Persistent Disk` montado en el backend

### Archivo `render.yaml`

El repositorio incluye [render.yaml](C:/Users/andre/OneDrive/Desktop/Innovacion/CuentasClaras/render.yaml:1) para facilitar un despliegue de staging con:

- un `Web Service` para el backend
- un `Static Site` para el frontend
- una base `Render Postgres`
- un `Persistent Disk` para los soportes

El blueprint deja conectados:

- `DATABASE_URL` desde Render Postgres hacia el backend
- `VITE_API_URL` desde el frontend hacia el host del backend
- `CORS_ALLOWED_ORIGINS` desde el backend hacia el host del frontend

La app normaliza esos valores para que funcionen bien aunque Render entregue solo el host del servicio.

### Variables recomendadas para staging

Backend:

- `APP_ENV=staging`
- `DATABASE_URL` desde Render Postgres
- `CORS_ALLOWED_ORIGINS` con el dominio del frontend de staging
- `SUPPORT_STORAGE_PATH=/opt/render/project/src/storage/supports`
- `AUTH_SECRET_KEY` generado en Render

Frontend:

- `VITE_API_URL=https://<backend-service>.onrender.com`

### Persistent disk para soportes

Mount path recomendado:

```text
/opt/render/project/src/storage
```

Ruta efectiva de soportes:

```text
/opt/render/project/src/storage/supports
```

Esto mantiene persistentes los archivos subidos por movimiento entre deploys y reinicios del backend.

### Pasos exactos para desplegar en Render

1. Sube esta rama al repositorio remoto que usaras en Render.
2. En Render, crea un nuevo Blueprint apuntando a este repo.
3. Usa el archivo `render.yaml` de la raiz.
4. Revisa los recursos que se van a crear:
   - `cuentas-claras-staging-backend`
   - `cuentas-claras-staging-frontend`
   - `cuentas-claras-staging-db`
5. Confirma que el backend tenga attached disk en:
   - `/opt/render/project/src/storage`
6. Lanza el deploy inicial.
7. Cuando termine:
   - abre el frontend de staging
   - verifica `GET /health` en el backend
   - crea un movimiento
   - adjunta un soporte
   - abre y descarga el soporte
   - revisa `Historial`, `Estadisticas` y `Inicio`

### Como conectar frontend y backend en staging

- El frontend debe apuntar al backend con `VITE_API_URL`.
- El backend debe permitir el dominio del frontend en `CORS_ALLOWED_ORIGINS`.
- En el blueprint actual, ambos valores quedan enlazados usando referencias entre servicios.

### Como probar staging una vez desplegado

1. Abre la URL publica del frontend.
2. Confirma que la app carga y navega entre `Inicio`, `Historial`, `Estadisticas`, `Perfil` y `Reporte IA`.
3. Prueba:
   - crear un ingreso
   - crear un gasto
   - editar un movimiento
   - eliminar un movimiento
   - subir un PDF o imagen como soporte
   - ver y descargar el soporte
   - cambiar estados de revision
4. Consulta:
   - `https://<backend-service>.onrender.com/health`
   - `https://<backend-service>.onrender.com/movements/stats`
   - `https://<backend-service>.onrender.com/review/summary`

## Limitaciones normales de este MVP en staging

- No hay autenticacion.
- Los soportes siguen guardandose en disco local persistente del backend, no en storage cloud.
- No hay OCR ni procesamiento inteligente de soportes.
- No hay endurecimiento completo de seguridad, observabilidad o escalamiento para produccion.
- La evolucion de esquema sigue siendo basica y todavia no usa migraciones formales.

## Estado de preparacion para staging

En este punto, el repo queda listo para desplegarse online en un entorno `staging` en Render dentro del alcance actual del MVP.

Los puntos tecnicos clave ya cubiertos son:

- configuracion de backend por variables de entorno
- CORS configurable para dominio de frontend
- conexion remota a PostgreSQL por `DATABASE_URL`
- ruta configurable de soportes por `SUPPORT_STORAGE_PATH`
- frontend configurado por `VITE_API_URL`
- blueprint base de Render para frontend, backend, Postgres y persistent disk

La principal limitacion que queda es propia del alcance del MVP, no un bloqueo de despliegue.
