from pydantic import BaseModel
from datetime import date
from typing import Optional


class CustomDeadlineRequest(BaseModel):
    title: str
    deadline_date: date
    description: Optional[str] = None
