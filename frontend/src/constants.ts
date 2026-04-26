import type { MovementType } from "./types";

export const CATEGORIES_BY_TYPE: Record<MovementType, string[]> = {
  income: ["Salario", "Honorarios", "Ventas", "Otros ingresos"],
  expense: [
    "Hogar",
    "Transporte",
    "Salud",
    "Educación",
    "Alimentación",
    "Servicios",
    "Otros gastos",
  ],
};
