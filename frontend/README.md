# Frontend

Aplicacion base en React + Vite + TypeScript.

En esta etapa el frontend ofrece una primera experiencia visual navegable del producto, con vistas de inicio, historial, estadisticas, perfil y reporte IA.

El flujo real implementado en este paso permite:

- registrar ingresos y gastos desde `Inicio`
- consultar movimientos reales en `Historial`
- editar y eliminar movimientos desde `Historial`
- cambiar el estado de revision y guardar una nota breve por movimiento
- adjuntar, reemplazar y eliminar un soporte por movimiento desde `Historial`
- ver y descargar el soporte real desde `Historial`
- mostrar algunos totales reales en el dashboard
- mostrar estadisticas reales por categoria en `Estadisticas`
- mostrar un checklist real en `Inicio` segun el resumen de revision

Soportes en esta etapa:

- cada movimiento puede tener 0 o 1 soporte
- se aceptan PDF e imagenes JPG, PNG y WEBP
- el historial muestra `Con soporte` o `Sin soporte`
- si se sube otro archivo para el mismo movimiento, el soporte anterior se reemplaza
- cuando existe soporte, el historial permite `Ver soporte`, `Descargar` y `Eliminar soporte`

Revision en esta etapa:

- cada movimiento muestra `Pendiente`, `Revisado` u `Observado`
- el historial permite cambiar el estado y guardar una nota breve
- el dashboard resume movimientos con soporte, sin soporte, pendientes, revisados y observados
