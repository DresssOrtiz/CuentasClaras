from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.constants import CATEGORIES_BY_TYPE


MovementType = Literal["income", "expense"]
ReviewStatus = Literal["pending", "reviewed", "flagged"]


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class MovementCreate(BaseModel):
    type: MovementType
    category: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(gt=0, decimal_places=2, max_digits=12)
    description: str = Field(min_length=1, max_length=255)
    date: date

    @model_validator(mode="after")
    def validate_category_for_type(self) -> "MovementCreate":
        allowed_categories = CATEGORIES_BY_TYPE[self.type]

        if self.category not in allowed_categories:
            allowed = ", ".join(allowed_categories)
            raise ValueError(
                f"Category '{self.category}' is not valid for type '{self.type}'. "
                f"Allowed categories: {allowed}."
            )

        return self


class MovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    type: MovementType
    category: str
    amount: Decimal
    description: str
    date: date
    review_status: ReviewStatus
    review_note: str | None = None
    created_at: datetime
    support: "SupportRead | None" = None


class MovementUpdate(BaseModel):
    type: MovementType
    category: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(gt=0, decimal_places=2, max_digits=12)
    description: str = Field(min_length=1, max_length=255)
    date: date

    @model_validator(mode="after")
    def validate_category_for_type(self) -> "MovementUpdate":
        allowed_categories = CATEGORIES_BY_TYPE[self.type]

        if self.category not in allowed_categories:
            allowed = ", ".join(allowed_categories)
            raise ValueError(
                f"Category '{self.category}' is not valid for type '{self.type}'. "
                f"Allowed categories: {allowed}."
            )

        return self


class MovementReviewUpdate(BaseModel):
    review_status: ReviewStatus
    review_note: str | None = Field(default=None, max_length=500)


class CategoryBreakdownItem(BaseModel):
    category: str
    total_amount: Decimal
    movement_count: int


class SupportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    movement_id: int
    filename: str
    original_filename: str
    content_type: str
    storage_path: str
    is_mock: bool = False
    mock_note: str | None = None
    uploaded_at: datetime


class MovementStatsRead(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    total_movements: int
    total_income_movements: int
    total_expense_movements: int
    movements_with_support: int
    movements_without_support: int
    income_by_category: list[CategoryBreakdownItem]
    expense_by_category: list[CategoryBreakdownItem]


class ReviewSummaryRead(BaseModel):
    total_movements: int
    movements_with_support: int
    movements_without_support: int
    pending_movements: int
    reviewed_movements: int
    flagged_movements: int
    expenses_without_support: int
    ready_for_simple_review: int
