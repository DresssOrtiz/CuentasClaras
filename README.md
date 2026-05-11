# Cuentas Claras

Cuentas Claras es una plataforma web orientada a personas naturales en Colombia, especialmente independientes y freelancers, para organizar ingresos, gastos y soportes con el fin de preparar un borrador de resumen tributario.

## Estado actual del proyecto

Este repositorio ya cuenta con un MVP local funcional y con preparacion para una demo publica gratis en Render.

### Ya implementado

- Autenticacion minima real con registro, login, logout y usuario autenticado actual.
- Frontend en `frontend/` con React + Vite + TypeScript.
- Backend en `backend/` con FastAPI.
- PostgreSQL para persistencia de movimientos y metadata de soportes.
- Flujo real para crear, listar, editar y eliminar movimientos por usuario autenticado.
- Estadisticas reales por tipo y categoria.
- Soporte por movimiento con carga, reemplazo, visualizacion, descarga y eliminacion.
- Revision manual real por movimiento con estados `pending`, `reviewed` y `flagged`.
- Resumen real del expediente en el dashboard.
- Compatibilidad local con Docker Compose.
- Preparacion de despliegue gratis en Render con frontend estatico, backend web service, Render Postgres free y soportes simulados para demo.

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
- `SUPPORT_STORAGE_MODE`: `disk` en local y `mock` para demo publica gratis sin almacenamiento persistente.
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

- `VITE_API_URL`: URL base del backend. En local con Docker Compose se usa `/api` para aprovechar el proxy de Vite. En Render debe apuntar al dominio del backend, por ejemplo `https://tu-backend.onrender.com`.
- `VITE_PROXY_TARGET`: destino interno que usa Vite solo en desarrollo local para reenviar `/api/*` hacia FastAPI.

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

## Despliegue gratis en Render

La configuracion gratuita sigue esta arquitectura:

- Frontend: `Static Site`
- Backend: `Web Service` plan `free`
- Base de datos: `Render Postgres` plan `free`
- Soportes: modo `mock`, sin `Persistent Disk`

### Archivo `render.yaml`

El repositorio incluye [render.yaml](C:/Users/andre/OneDrive/Desktop/Innovacion/CuentasClaras/render.yaml:1) para facilitar un despliegue gratis con:

- un `Web Service` para el backend
- un `Static Site` para el frontend
- una base `Render Postgres` free
- soportes simulados para no depender de disco pago

El blueprint deja conectados:

- `DATABASE_URL` desde Render Postgres hacia el backend
- `VITE_API_URL` desde el frontend hacia el host del backend
- `CORS_ALLOWED_ORIGINS` desde el backend hacia el host del frontend

La app normaliza esos valores para que funcionen bien aunque Render entregue solo el host del servicio.

### Variables recomendadas para demo gratis

Backend:

- `APP_ENV=demo`
- `DATABASE_URL` desde Render Postgres
- `CORS_ALLOWED_ORIGINS` con el dominio del frontend publico
- `SUPPORT_STORAGE_MODE=mock`
- `AUTH_SECRET_KEY` generado en Render

Frontend:

- `VITE_API_URL=https://<backend-service>.onrender.com`

### Como funciona la subida de archivos en demo

- El usuario puede seleccionar un PDF o imagen.
- La API guarda la metadata del archivo en PostgreSQL.
- La UI muestra el nombre del archivo y el movimiento queda `Con soporte`.
- `Ver soporte` abre una vista demo intencional.
- `Descargar` baja un archivo demo explicando que el contenido es simulado.
- `Eliminar soporte` sigue funcionando normal.

Esto evita depender de `Persistent Disk` y mantiene la experiencia completa para demo publica.

### Pasos exactos para desplegar en Render

1. Sube esta rama al repositorio remoto que usaras en Render.
2. En Render, crea un nuevo Blueprint apuntando a este repo.
3. Usa el archivo `render.yaml` de la raiz.
4. Revisa los recursos que se van a crear:
   - `cuentas-claras-demo-backend`
   - `cuentas-claras-demo-frontend`
   - `cuentas-claras-demo-db`
5. Confirma que el backend este en plan `free`.
6. Confirma que la base este en plan `free`.
7. Lanza el deploy inicial.
8. Cuando termine:
   - abre el frontend publico
   - verifica `GET /health` en el backend
   - crea un movimiento
   - adjunta un soporte
   - abre y descarga el soporte
   - revisa `Historial`, `Estadisticas` y `Inicio`

### Dominio propio opcional

No necesitas Google ni otro proveedor adicional para publicar la app en Render: cada servicio recibe su URL `onrender.com`.

Solo necesitas un proveedor de dominio si quieres una URL propia como `app.tudominio.com`. En ese caso:

- compras o usas un dominio existente con cualquier registrador
- agregas el dominio en Render sobre el frontend
- configuras los registros DNS en tu proveedor
- verificas el dominio en Render

### Como conectar frontend y backend en demo

- El frontend debe apuntar al backend con `VITE_API_URL`.
- El backend debe permitir el dominio del frontend en `CORS_ALLOWED_ORIGINS`.
- En el blueprint actual, ambos valores quedan enlazados usando referencias entre servicios.

### Como probar la demo una vez desplegada

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

## Limitaciones reales de la demo gratis

- La autenticacion y los movimientos siguen funcionando, pero dependen de una base free de Render.
- La base `Render Postgres` free expira 30 dias despues de creada si no se actualiza a pago.
- El backend free de Render se duerme tras inactividad y puede tardar cerca de un minuto en despertar.
- Los soportes son simulados: se conserva la metadata, no el contenido original del archivo.
- No hay OCR ni procesamiento inteligente de soportes.
- No hay endurecimiento completo de seguridad, observabilidad o escalamiento para produccion.
- La evolucion de esquema sigue siendo basica y todavia no usa migraciones formales.

## Estado de preparacion para demo gratis

En este punto, el repo queda listo para desplegarse online en un entorno de demo publica gratis en Render dentro del alcance actual del MVP.

Los puntos tecnicos clave ya cubiertos son:

- configuracion de backend por variables de entorno
- CORS configurable para dominio de frontend
- conexion remota a PostgreSQL por `DATABASE_URL`
- modo mock para soportes por `SUPPORT_STORAGE_MODE`
- frontend configurado por `VITE_API_URL`
- blueprint base de Render para frontend, backend y Postgres free

La principal limitacion que queda es propia del modo demo gratis, no un bloqueo de despliegue.
