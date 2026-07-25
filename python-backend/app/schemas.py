from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ItemBase(BaseModel):
    name: str
    description: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemOut(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    expires_in: int | None = None
    refresh_token: str | None = None
    refresh_expires_in: int | None = None
    token_type: str | None = None
    scope: str | None = None


class AcknowledgementStatus(BaseModel):
    acknowledged: bool
    acknowledged_at: datetime | None = None
