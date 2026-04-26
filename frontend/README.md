# Frontend

Aplicacion base en React + Vite + TypeScript.

En esta etapa el frontend ofrece una primera experiencia visual navegable del producto, con vistas de inicio, historial, estadisticas, perfil y reporte IA.

El flujo real implementado en este paso permite:

- registrar ingresos y gastos desde `Inicio`
- consultar movimientos reales en `Historial`
- editar y eliminar movimientos desde `Historial`
- adjuntar, reemplazar y eliminar un soporte por movimiento desde `Historial`
- mostrar algunos totales reales en el dashboard
- mostrar estadisticas reales por categoria en `Estadisticas`

Soportes en esta etapa:

- cada movimiento puede tener 0 o 1 soporte
- se aceptan PDF e imagenes JPG, PNG y WEBP
- el historial muestra `Con soporte` o `Sin soporte`
- si se sube otro archivo para el mismo movimiento, el soporte anterior se reemplaza
