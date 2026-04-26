from decimal import Decimal
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.constants import EXPENSE_CATEGORIES, INCOME_CATEGORIES
from app.database import get_db
from app.models import Movement, Support, User
from app.schemas import (
    CategoryBreakdownItem,
    MovementCreate,
    MovementRead,
    MovementReviewUpdate,
    MovementStatsRead,
    MovementUpdate,
    SupportRead,
)
from app.security import get_current_user
from app.storage import (
    ALLOWED_SUPPORT_CONTENT_TYPES,
    delete_support_file,
    resolve_support_file_path,
    save_support_file,
)

router = APIRouter(prefix="/movements", tags=["movements"])


@router.post("", response_model=MovementRead, status_code=status.HTTP_201_CREATED)
def create_movement(
    payload: MovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Movement:
    movement = Movement(**payload.model_dump(), user_id=current_user.id)
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


@router.get("", response_model=list[MovementRead])
def list_movements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Movement]:
    statement = (
        select(Movement)
        .options(selectinload(Movement.support))
        .where(Movement.user_id == current_user.id)
        .order_by(Movement.date.desc(), Movement.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.put("/{movement_id}", response_model=MovementRead)
def update_movement(
    movement_id: int,
    payload: MovementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Movement:
    movement = get_owned_movement(movement_id, db, current_user.id)

    for field, value in payload.model_dump().items():
        setattr(movement, field, value)

    db.commit()
    db.refresh(movement)
    return movement


@router.patch("/{movement_id}/review", response_model=MovementRead)
def update_movement_review(
    movement_id: int,
    payload: MovementReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Movement:
    movement = get_owned_movement(movement_id, db, current_user.id)

    movement.review_status = payload.review_status
    movement.review_note = payload.review_note.strip() if payload.review_note else None

    db.commit()
    db.refresh(movement)
    return movement


@router.delete("/{movement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movement(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    movement = get_owned_movement(movement_id, db, current_user.id)

    if movement.support is not None:
        delete_support_file(movement.support.storage_path)

    db.delete(movement)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{movement_id}/support",
    response_model=SupportRead,
    status_code=status.HTTP_201_CREATED,
)
def upload_support(
    movement_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Support:
    movement = get_owned_movement(movement_id, db, current_user.id)

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
def get_support_metadata(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Support:
    return get_required_support(movement_id, db, current_user.id)


@router.get("/{movement_id}/support/file")
def get_support_file(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    support = get_required_support(movement_id, db, current_user.id)
    file_path = resolve_support_file_path(support.storage_path)

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support file for movement with id {movement_id} was not found.",
        )

    return FileResponse(
        path=file_path,
        media_type=support.content_type,
        headers={
            "Content-Disposition": build_content_disposition(
                "inline", support.original_filename
            )
        },
    )


@router.get("/{movement_id}/support/download")
def download_support_file(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    support = get_required_support(movement_id, db, current_user.id)
    file_path = resolve_support_file_path(support.storage_path)

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support file for movement with id {movement_id} was not found.",
        )

    return FileResponse(
        path=file_path,
        media_type=support.content_type,
        headers={
            "Content-Disposition": build_content_disposition(
                "attachment", support.original_filename
            )
        },
    )


@router.delete("/{movement_id}/support", status_code=status.HTTP_204_NO_CONTENT)
def delete_support(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    movement = get_owned_movement(movement_id, db, current_user.id)

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
def get_movement_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MovementStatsRead:
    movements = list(
        db.scalars(
            select(Movement)
            .options(selectinload(Movement.support))
            .where(Movement.user_id == current_user.id)
        ).all()
    )

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


def get_required_support(movement_id: int, db: Session, user_id: int) -> Support:
    movement = get_owned_movement(movement_id, db, user_id)

    if movement.support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} does not have a support.",
        )

    return movement.support


def get_owned_movement(movement_id: int, db: Session, user_id: int) -> Movement:
    movement = db.scalar(
        select(Movement)
        .options(selectinload(Movement.support))
        .where(Movement.id == movement_id, Movement.user_id == user_id)
    )

    if movement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movement with id {movement_id} was not found.",
        )

    return movement


def build_content_disposition(disposition_type: str, filename: str) -> str:
    quoted_filename = quote(filename)
    return (
        f'{disposition_type}; filename="{filename}"; '
        f"filename*=UTF-8''{quoted_filename}"
    )
