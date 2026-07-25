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


class SyncResult(BaseModel):
    accounts_synced: int
    transactions_synced: int


class MonthlyCategoryBreakdown(BaseModel):
    merchant_category_code: str | None
    total: float


class MonthlyMerchantBreakdown(BaseModel):
    merchant_name: str | None
    total: float


class MonthlyAccountBreakdown(BaseModel):
    account_id: str
    nickname: str | None
    total_spend: float
    total_income: float
    transaction_count: int


class MonthlySpendSummary(BaseModel):
    month: str
    total_spend: float
    total_income: float
    pending_spend: float
    pending_income: float
    transaction_count: int
    by_category: list[MonthlyCategoryBreakdown]
    by_merchant: list[MonthlyMerchantBreakdown]
    by_account: list[MonthlyAccountBreakdown]


class HealthObservation(BaseModel):
    type: str
    severity: str
    message: str


class MonthlyHealthSummary(BaseModel):
    month: str
    observations: list[HealthObservation]
