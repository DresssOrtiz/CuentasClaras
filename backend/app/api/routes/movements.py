from decimal import Decimal

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.constants import EXPENSE_CATEGORIES, INCOME_CATEGORIES
from app.database import get_db
from app.models import Movement, Support
from app.schemas import (
    CategoryBreakdownItem,
    MovementCreate,
    MovementRead,
    MovementStatsRead,
    SupportRead,
    MovementUpdate,
)
from app.storage import (
    ALLOWED_SUPPORT_CONTENT_TYPES,
    delete_support_file,
    save_support_file,
)

router = APIRouter(prefix="/movements", tags=["movements"])


@router.post("", response_model=MovementRead, status_code=status.HTTP_201_CREATED)
def create_movement(
    payload: MovementCreate, db: Session = Depends(get_db)
) -> Movement:
    movement = Movement(**payload.model_dump())
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


@router.get("", response_model=list[MovementRead])
def list_movements(db: Session = Depends(get_db)) -> list[Movement]:
    statement = (
        select(Movement)
        .options(selectinload(Movement.support))
        .order_by(Movement.date.desc(), Movement.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.put("/{movement_id}", response_model=MovementRead)
def update_movement(
    movement_id: int, payload: MovementUpdate, db: Session = Depends(get_db)
) -> Movement:
    movement = db.get(Movement, movement_id)

    if movement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} was not found.",
        )

    for field, value in payload.model_dump().items():
        setattr(movement, field, value)

    db.commit()
    db.refresh(movement)
    return movement


@router.delete("/{movement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movement(movement_id: int, db: Session = Depends(get_db)) -> Response:
    movement = db.scalar(
        select(Movement)
        .options(selectinload(Movement.support))
        .where(Movement.id == movement_id)
    )

    if movement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} was not found.",
        )

    if movement.support is not None:
        delete_support_file(movement.support.storage_path)

    db.delete(movement)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{movement_id}/support", response_model=SupportRead, status_code=status.HTTP_201_CREATED)
def upload_support(
    movement_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Support:
    movement = db.scalar(
        select(Movement)
        .options(selectinload(Movement.support))
        .where(Movement.id == movement_id)
    )

    if movement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} was not found.",
        )

    if file.content_type not in ALLOWED_SUPPORT_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPG, PNG, and WEBP files are allowed for supports.",
        )

    if movement.support is not None:
        delete_support_file(movement.support.storage_path)
        db.delete(movement.support)
        db.flush()

    generated_filename, storage_path = save_support_file(file)
    support = Support(
        movement_id=movement_id,
        filename=generated_filename,
        original_filename=file.filename or generated_filename,
        content_type=file.content_type or "application/octet-stream",
        storage_path=storage_path,
    )
    db.add(support)
    db.commit()
    db.refresh(support)
    return support


@router.get("/{movement_id}/support", response_model=SupportRead)
def get_support_metadata(movement_id: int, db: Session = Depends(get_db)) -> Support:
    movement = db.scalar(
        select(Movement)
        .options(selectinload(Movement.support))
        .where(Movement.id == movement_id)
    )

    if movement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} was not found.",
        )

    if movement.support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} does not have a support.",
        )

    return movement.support


@router.delete("/{movement_id}/support", status_code=status.HTTP_204_NO_CONTENT)
def delete_support(movement_id: int, db: Session = Depends(get_db)) -> Response:
    movement = db.scalar(
        select(Movement)
        .options(selectinload(Movement.support))
        .where(Movement.id == movement_id)
    )

    if movement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} was not found.",
        )

    if movement.support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} does not have a support.",
        )

    delete_support_file(movement.support.storage_path)
    db.delete(movement.support)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/stats", response_model=MovementStatsRead)
def get_movement_stats(db: Session = Depends(get_db)) -> MovementStatsRead:
    statement = select(Movement)
    movements = list(db.scalars(statement).all())

    income_movements = [movement for movement in movements if movement.type == "income"]
    expense_movements = [movement for movement in movements if movement.type == "expense"]
    movements_with_support = [movement for movement in movements if movement.support is not None]

    return MovementStatsRead(
        total_income=sum((movement.amount for movement in income_movements), Decimal("0")),
        total_expense=sum((movement.amount for movement in expense_movements), Decimal("0")),
        total_movements=len(movements),
        total_income_movements=len(income_movements),
        total_expense_movements=len(expense_movements),
        movements_with_support=len(movements_with_support),
        movements_without_support=len(movements) - len(movements_with_support),
        income_by_category=build_category_breakdown(income_movements, INCOME_CATEGORIES),
        expense_by_category=build_category_breakdown(expense_movements, EXPENSE_CATEGORIES),
    )


def build_category_breakdown(
    movements: list[Movement], categories: list[str]
) -> list[CategoryBreakdownItem]:
    breakdown: list[CategoryBreakdownItem] = []

    for category in categories:
        category_movements = [
            movement for movement in movements if movement.category == category
        ]
        total_amount = sum(
            (movement.amount for movement in category_movements),
            Decimal("0"),
        )

        breakdown.append(
            CategoryBreakdownItem(
                category=category,
                total_amount=total_amount,
                movement_count=len(category_movements),
            )
        )

    return breakdown
