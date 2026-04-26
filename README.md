# Cuentas Claras

Cuentas Claras es una plataforma web orientada a personas naturales en Colombia, especialmente independientes y freelancers, para organizar ingresos, gastos y soportes con el fin de preparar un borrador de resumen tributario.

## Estado actual del proyecto

Este repositorio ya cuenta con un esqueleto tecnico inicial para desarrollo local usando React, FastAPI, PostgreSQL y Docker Compose.

### Configurado en este paso

- Frontend base en `frontend/` con React + Vite + TypeScript.
- Backend base en `backend/` con FastAPI y endpoints minimos para salud, movimientos y soportes.
- `docker-compose.yml` con servicios para `postgres`, `backend` y `frontend`.
- Conexion minima desde el frontend al backend para mostrar el estado de la API.
- Interfaz visual navegable con vistas de inicio, historial, estadisticas, perfil y reporte IA.
- Flujo funcional real para registrar, consultar, editar y eliminar movimientos en PostgreSQL.
- Endpoint real de estadisticas para totales, desglose por categoria y conteo de soportes.
- Soporte real por movimiento con carga de PDF o imagen, metadata en PostgreSQL y archivo guardado localmente.
- Consulta real del archivo de soporte para verlo y descargarlo desde la aplicacion.
- Revision manual real por movimiento con estado, nota y resumen del expediente.
- Variables de entorno base en `.env.example`.

### No implementado todavia

- Modelos de dominio definitivos.
- Autenticacion.
- Logica tributaria.
- Integraciones externas.
- OCR, IA y reglas tributarias reales.

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
- Movimientos: `http://localhost:8000/movements`
- Estadisticas: `http://localhost:8000/movements/stats`
- Resumen de revision: `http://localhost:8000/review/summary`
- Soporte por movimiento: `http://localhost:8000/movements/{movement_id}/support`
- Archivo del soporte: `http://localhost:8000/movements/{movement_id}/support/file`
- Descarga del soporte: `http://localhost:8000/movements/{movement_id}/support/download`
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

Deberias ver la app de `Cuentas Claras` con vistas de `Inicio`, `Historial`, `Estadisticas`, `Perfil` y `Reporte IA`.
Tambien deberias poder registrar movimientos reales desde `Inicio`, verlos reflejados en `Historial` y adjuntar soportes PDF o imagen.

## Probar el backend

Puedes abrir directamente:

```text
http://localhost:8000/health
```

Y para movimientos:

```text
http://localhost:8000/movements
```

O probarlo por consola:

```bash
curl http://localhost:8000/health
```

## Probar el flujo de movimientos

1. Abre `http://localhost:5173`.
2. En la vista `Inicio`, usa el formulario `Nuevo movimiento`.
3. Alterna entre `Registrar ingreso` o `Registrar gasto`.
4. Completa categoria, monto, descripcion y fecha.
5. Guarda el movimiento.
6. Revisa la vista `Historial` para confirmar que el registro se guardo en PostgreSQL.

Ejemplo de `POST /movements`:

```bash
curl -X POST http://localhost:8000/movements \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"income\",\"category\":\"Honorarios\",\"amount\":\"2500000.00\",\"description\":\"Pago proyecto abril\",\"date\":\"2026-04-26\"}"
```

Endpoints disponibles en este paso:

- `GET /health`
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

## Probar estadisticas

1. Registra uno o varios ingresos y gastos desde el frontend.
2. Abre `http://localhost:5173` y entra a `Estadisticas`.
3. Verifica los totales, el desglose por categoria y el conteo de soportes.
4. Si quieres validar la respuesta cruda del backend, abre:

```text
http://localhost:8000/movements/stats
```

## Estados de revision en esta etapa

- `pending`: movimiento aun no revisado
- `reviewed`: movimiento revisado sin problema basico visible
- `flagged`: movimiento con observacion o algo por revisar

El campo `review_note` permite guardar una nota breve de revision.

## Probar revision manual

1. Abre `http://localhost:5173`.
2. Ve a `Historial`.
3. En cualquier movimiento, cambia el selector de revision.
4. Si lo necesitas, agrega una nota breve.
5. Usa `Guardar revision`.
6. Verifica que el dashboard cambia su checklist real.

Ejemplo de actualizacion por API:

```bash
curl -X PATCH http://localhost:8000/movements/1/review \
  -H "Content-Type: application/json" \
  -d "{\"review_status\":\"flagged\",\"review_note\":\"Falta validar el soporte\"}"
```

Resumen real del expediente:

```text
http://localhost:8000/review/summary
```

## Probar soportes

Tipos de archivo aceptados en esta etapa:

- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/webp`

Regla actual de este paso:

- cada movimiento puede tener maximo 1 soporte
- si vuelves a subir un archivo para el mismo movimiento, el soporte anterior se reemplaza

Desde el frontend:

1. Abre `http://localhost:5173`.
2. Ve a `Historial`.
3. En un movimiento, usa `Adjuntar soporte`.
4. Selecciona un PDF o imagen valida.
5. Confirma que el estado cambia a `Con soporte` y que aparece el nombre del archivo.
6. Usa `Ver soporte` para abrirlo.
7. Usa `Descargar` para guardarlo localmente.
8. Si quieres retirarlo, usa `Eliminar soporte`.

Desde el backend:

```bash
curl -X POST http://localhost:8000/movements/1/support \
  -F "file=@ruta/al/soporte.pdf;type=application/pdf"
```

```bash
curl http://localhost:8000/movements/1/support
```

```bash
curl http://localhost:8000/movements/1/support/file
```

```bash
curl -OJ http://localhost:8000/movements/1/support/download
```

```bash
curl -X DELETE http://localhost:8000/movements/1/support
```

Si el movimiento no existe, no tiene soporte o el archivo fisico ya no esta disponible, el backend responde con `404`.

## Probar edicion y eliminacion

1. Abre `http://localhost:5173`.
2. Ve a `Historial`.
3. Usa `Editar` sobre cualquier movimiento para cambiar tipo, categoria, monto, descripcion o fecha.
4. Guarda los cambios y confirma que `Inicio` y `Estadisticas` reflejan el nuevo valor.
5. Usa `Eliminar` sobre cualquier movimiento y confirma la accion.
6. Verifica que el historial se refresca y que los agregados cambian.

## Detener el proyecto

Para detener los servicios:

```bash
docker compose down
```

PostgreSQL mantiene sus datos en el volumen persistente `postgres_data`.
Los archivos de soporte se conservan en el volumen persistente `support_uploads`.
