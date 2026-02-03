from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.accumulation_goal import AccumulationGoal
from ..schemas.accumulation_goal import AccumulationGoalCreate, AccumulationGoalUpdate, AccumulationGoalRead

router = APIRouter(prefix="/api/accumulation-goals", tags=["accumulation-goals"])


@router.get("", response_model=list[AccumulationGoalRead])
async def list_goals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AccumulationGoal).order_by(AccumulationGoal.id))
    return result.scalars().all()


@router.post("", response_model=AccumulationGoalRead, status_code=201)
async def create_goal(data: AccumulationGoalCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(AccumulationGoal, data.id)
    if existing:
        raise HTTPException(409, f"Goal {data.id} already exists")
    obj = AccumulationGoal(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/{goal_id}", response_model=AccumulationGoalRead)
async def get_goal(goal_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(AccumulationGoal, goal_id)
    if not obj:
        raise HTTPException(404, f"Goal {goal_id} not found")
    return obj


@router.put("/{goal_id}", response_model=AccumulationGoalRead)
async def update_goal(goal_id: str, data: AccumulationGoalUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(AccumulationGoal, goal_id)
    if not obj:
        raise HTTPException(404, f"Goal {goal_id} not found")
    for key, val in data.model_dump().items():
        setattr(obj, key, val)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(AccumulationGoal, goal_id)
    if not obj:
        raise HTTPException(404, f"Goal {goal_id} not found")
    await db.delete(obj)
    await db.commit()
