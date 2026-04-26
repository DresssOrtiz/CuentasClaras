export const summaryMetrics = [
  {
    label: "Estado del mes",
    value: "Al dia",
    detail: "Sin alertas criticas",
    tone: "success" as const,
  },
  {
    label: "Ingresos registrados",
    value: "$ 12.480.000",
    detail: "Abril 2026",
    tone: "accent" as const,
  },
  {
    label: "Gastos registrados",
    value: "$ 4.760.000",
    detail: "Con soportes parciales",
    tone: "neutral" as const,
  },
  {
    label: "Borrador tributario",
    value: "72%",
    detail: "Listo para revision",
    tone: "warning" as const,
  },
];

export const quickActions = [
  {
    title: "Registrar ingresos",
    description: "Agregar un nuevo movimiento de entrada.",
  },
  {
    title: "Registrar gastos",
    description: "Cargar un gasto y asociar su soporte.",
  },
  {
    title: "Revisar informacion",
    description: "Ver movimientos pendientes y consistencias.",
  },
  {
    title: "Controlar y resumir",
    description: "Abrir el reporte preliminar del periodo.",
  },
];

export const monthlyBars = [
  { label: "Sem 1", value: 35, tone: "accent" as const },
  { label: "Sem 2", value: 70, tone: "primary" as const },
  { label: "Sem 3", value: 48, tone: "accent" as const },
  { label: "Sem 4", value: 88, tone: "primary" as const },
  { label: "Sem 5", value: 62, tone: "accent" as const },
];

export const taxChecklist = [
  {
    title: "Ingresos de honorarios consolidados",
    description: "Ultima actualizacion registrada hace dos dias.",
    done: true,
  },
  {
    title: "Soportes medicos por adjuntar",
    description: "Faltan dos comprobantes de abril.",
    done: false,
  },
  {
    title: "Resumen preliminar del mes",
    description: "Listo para una primera revision guiada.",
    done: true,
  },
];

export const historyItems = [
  {
    date: "25 Abr 2026",
    title: "Pago proyecto branding",
    category: "Honorarios",
    supportReady: true,
    amount: "+$ 2.400.000",
  },
  {
    date: "24 Abr 2026",
    title: "Curso de actualizacion",
    category: "Educacion",
    supportReady: true,
    amount: "-$ 320.000",
  },
  {
    date: "22 Abr 2026",
    title: "Suscripcion herramientas",
    category: "Operacion",
    supportReady: false,
    amount: "-$ 89.000",
  },
  {
    date: "19 Abr 2026",
    title: "Consulta medica",
    category: "Salud",
    supportReady: false,
    amount: "-$ 180.000",
  },
  {
    date: "17 Abr 2026",
    title: "Transferencia cliente recurrente",
    category: "Servicios",
    supportReady: true,
    amount: "+$ 3.100.000",
  },
];

export const categoryStats = [
  { label: "Hogar", share: 45, amount: "$ 1.180.000", tone: "primary" },
  { label: "Educacion", share: 30, amount: "$ 910.000", tone: "accent" },
  { label: "Salud", share: 15, amount: "$ 520.000", tone: "success" },
  { label: "Otros", share: 10, amount: "$ 240.000", tone: "neutral" },
] as const;

export const profileSections = [
  {
    kicker: "Cuenta",
    title: "Informacion principal",
    items: [
      { label: "Tipo de usuario", value: "Persona natural" },
      { label: "Actividad", value: "Servicios profesionales" },
      { label: "Ciudad", value: "Bogota, Colombia" },
    ],
  },
  {
    kicker: "Preferencias",
    title: "Configuracion actual",
    items: [
      { label: "Recordatorios", value: "Activos" },
      { label: "Resumen mensual", value: "Correo + panel" },
      { label: "Estado del onboarding", value: "En progreso" },
    ],
  },
];

export const aiHighlights = [
  {
    title: "Deduccion educativa detectada",
    description:
      "Se identifico un gasto formativo con soporte valido que podria revisarse despues.",
  },
  {
    title: "Ingreso recurrente bien clasificado",
    description:
      "Los honorarios de tus clientes principales ya siguen una trazabilidad consistente.",
  },
  {
    title: "Dos soportes faltantes",
    description:
      "Conviene completar los adjuntos pendientes para evitar inconsistencias basicas.",
  },
];
