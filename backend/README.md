# Backend

API base en FastAPI.

En este paso expone:

- `GET /health`
- `GET /movements`
- `POST /movements`
- `PUT /movements/{movement_id}`
- `DELETE /movements/{movement_id}`
- `GET /movements/stats`
- `POST /movements/{movement_id}/support`
- `GET /movements/{movement_id}/support`
- `DELETE /movements/{movement_id}/support`

Tambien persiste movimientos minimos y metadata de soportes en PostgreSQL, y crea las tablas necesarias al iniciar la aplicacion.

Soportes en esta etapa:

- un movimiento puede tener 0 o 1 soporte
- tipos permitidos: PDF, JPG, PNG y WEBP
- si un movimiento ya tiene soporte, una nueva carga reemplaza el archivo anterior
- los archivos se guardan localmente en `storage/supports`

Categorias permitidas en esta etapa:

- Ingresos: `Salario`, `Honorarios`, `Ventas`, `Otros ingresos`
- Gastos: `Hogar`, `Transporte`, `Salud`, `Educacion`, `Alimentacion`, `Servicios`, `Otros gastos`
