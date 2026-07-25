from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, func

from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DataUsageAcknowledgement(Base):
    __tablename__ = "data_usage_acknowledgements"

    id = Column(Integer, primary_key=True, index=True)
    user_sub = Column(String, unique=True, nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), server_default=func.now())


class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(String, primary_key=True)
    user_sub = Column(String, nullable=False, index=True)
    nickname = Column(String, nullable=True)
    currency = Column(String, nullable=False)
    account_type = Column(String, nullable=True)
    account_category = Column(String, nullable=True)
    status = Column(String, nullable=True)
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True)
    account_id = Column(String, ForeignKey("accounts.account_id"), nullable=False, index=True)
    amount = Column(Numeric(18, 2), nullable=False)
    currency = Column(String, nullable=False)
    credit_debit_indicator = Column(String, nullable=False)
    status = Column(String, nullable=True)
    booking_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    transaction_information = Column(String, nullable=True)
    merchant_name = Column(String, nullable=True)
    merchant_category_code = Column(String, nullable=True)
    bank_transaction_code = Column(String, nullable=True)
    bank_transaction_sub_code = Column(String, nullable=True)
    category = Column(String, nullable=True)
    category_source = Column(String, nullable=True)
