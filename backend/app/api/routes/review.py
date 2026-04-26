from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Movement
from app.schemas import ReviewSummaryRead

router = APIRouter(prefix="/review", tags=["review"])


@router.get("/summary", response_model=ReviewSummaryRead)
def get_review_summary(db: Session = Depends(get_db)) -> ReviewSummaryRead:
    movements = list(
        db.scalars(select(Movement).options(selectinload(Movement.support))).all()
    )

    movements_with_support = [movement for movement in movements if movement.support is not None]
    pending_movements = [movement for movement in movements if movement.review_status == "pending"]
    reviewed_movements = [
        movement for movement in movements if movement.review_status == "reviewed"
    ]
    flagged_movements = [movement for movement in movements if movement.review_status == "flagged"]
    expenses_without_support = [
        movement
        for movement in movements
        if movement.type == "expense" and movement.support is None
    ]

    return ReviewSummaryRead(
        total_movements=len(movements),
        movements_with_support=len(movements_with_support),
        movements_without_support=len(movements) - len(movements_with_support),
        pending_movements=len(pending_movements),
        reviewed_movements=len(reviewed_movements),
        flagged_movements=len(flagged_movements),
        expenses_without_support=len(expenses_without_support),
        ready_for_simple_review=len(movements_with_support),
    )
