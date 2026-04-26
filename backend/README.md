# Backend

API base en FastAPI.

Preparado para correr:

- en local con Docker Compose
- en Render como `Web Service`

En este paso expone:

- `GET /health`
- `GET /movements`
- `POST /movements`
- `PUT /movements/{movement_id}`
- `PATCH /movements/{movement_id}/review`
- `DELETE /movements/{movement_id}`
- `GET /movements/stats`
- `GET /review/summary`
- `POST /movements/{movement_id}/support`
- `GET /movements/{movement_id}/support`
- `DELETE /movements/{movement_id}/support`
- `GET /movements/{movement_id}/support/file`
- `GET /movements/{movement_id}/support/download`

Tambien persiste movimientos minimos y metadata de soportes en PostgreSQL, y crea las tablas necesarias al iniciar la aplicacion.

Soportes en esta etapa:

- un movimiento puede tener 0 o 1 soporte
- tipos permitidos: PDF, JPG, PNG y WEBP
- si un movimiento ya tiene soporte, una nueva carga reemplaza el archivo anterior
- los archivos se guardan en una ruta configurable por `SUPPORT_STORAGE_PATH`
- `support/file` devuelve el archivo real para visualizacion
- `support/download` devuelve el archivo real para descarga

Variables relevantes para despliegue:

- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `SUPPORT_STORAGE_PATH`
- `APP_ENV`

Revision en esta etapa:

- `pending`: movimiento aun no revisado
- `reviewed`: revisado sin observacion basica visible
- `flagged`: movimiento con observacion o seguimiento
- `review_note`: nota breve opcional asociada a la revision
- `review/summary` resume el estado real del expediente

Categorias permitidas en esta etapa:

- Ingresos: `Salario`, `Honorarios`, `Ventas`, `Otros ingresos`
- Gastos: `Hogar`, `Transporte`, `Salud`, `Educacion`, `Alimentacion`, `Servicios`, `Otros gastos`
