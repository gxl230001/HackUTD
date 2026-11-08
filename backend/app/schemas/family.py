from uuid import UUID

from pydantic import BaseModel


class Family(BaseModel):
    id: UUID
    name: str
    member_count: int


class Member(BaseModel):
    id: UUID
    display_name: str
    relationship: str | None = None
    phone_label: str | None = None
