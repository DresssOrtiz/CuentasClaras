export type MovementType = "income" | "expense";
export type ReviewStatus = "pending" | "reviewed" | "flagged";

export type Support = {
  id: number;
  movement_id: number;
  filename: string;
  original_filename: string;
  content_type: string;
  storage_path: string;
  uploaded_at: string;
};

export type Movement = {
  id: number;
  type: MovementType;
  category: string;
  amount: string;
  description: string;
  date: string;
  review_status: ReviewStatus;
  review_note: string | null;
  created_at: string;
  support: Support | null;
};

export type MovementPayload = {
  type: MovementType;
  category: string;
  amount: string;
  description: string;
  date: string;
};

export type MovementUpdatePayload = MovementPayload;

export type MovementReviewPayload = {
  review_status: ReviewStatus;
  review_note: string;
};

export type CategoryBreakdownItem = {
  category: string;
  total_amount: string;
  movement_count: number;
};

export type MovementStats = {
  total_income: string;
  total_expense: string;
  total_movements: number;
  total_income_movements: number;
  total_expense_movements: number;
  movements_with_support: number;
  movements_without_support: number;
  income_by_category: CategoryBreakdownItem[];
  expense_by_category: CategoryBreakdownItem[];
};

export type ReviewSummary = {
  total_movements: number;
  movements_with_support: number;
  movements_without_support: number;
  pending_movements: number;
  reviewed_movements: number;
  flagged_movements: number;
  expenses_without_support: number;
  ready_for_simple_review: number;
};

export type HealthResponse = {
  message: string;
  service: string;
  status: string;
};
