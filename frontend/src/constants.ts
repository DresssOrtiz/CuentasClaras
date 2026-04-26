import type { MovementType, ReviewStatus } from "./types";

export const CATEGORIES_BY_TYPE: Record<MovementType, string[]> = {
  income: ["Salario", "Honorarios", "Ventas", "Otros ingresos"],
  expense: [
    "Hogar",
    "Transporte",
    "Salud",
    "Educacion",
    "Alimentacion",
    "Servicios",
    "Otros gastos",
  ],
};

export const REVIEW_STATUS_OPTIONS: Array<{
  value: ReviewStatus;
  label: string;
}> = [
  { value: "pending", label: "Pendiente" },
  { value: "reviewed", label: "Revisado" },
  { value: "flagged", label: "Observado" },
];
