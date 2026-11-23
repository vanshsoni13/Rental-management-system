import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    email: str
    password: str = Field(min_length=6)
    confirmPassword: str | None = None
    phone: str | None = Field(default=None, max_length=20)

    @model_validator(mode="after")
    def validate_registration(self):
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", self.email.strip()):
            raise ValueError("Please enter a valid email address")
        if len(self.password.encode("utf-8")) > 72:
            raise ValueError("Password must be no more than 72 UTF-8 bytes")
        if self.confirmPassword and self.confirmPassword != self.password:
            raise ValueError("Password confirmation does not match")
        return self


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)


class RentalItemRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(default=1, ge=1)


class CreateRentalRequest(BaseModel):
    items: list[RentalItemRequest] = Field(min_length=1)
    start_datetime: datetime
    end_datetime: datetime
    duration_unit: Literal["hour", "day", "week", "month", "year"]

    @model_validator(mode="after")
    def validate_interval_and_products(self):
        start = self.start_datetime
        end = self.end_datetime
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        if end <= start:
            raise ValueError("end_datetime must be strictly after start_datetime")
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("A product may only appear once in the rental items")
        return self


class PaymentOrderRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    amount: Decimal | None = Field(default=None, gt=0)
    payment_type: str = "rent"
    rental_id: int | None = Field(default=None, gt=0)
    invoice_id: int | None = Field(default=None, gt=0)
    notes: dict[str, Any] | None = None

    @field_validator("payment_type")
    @classmethod
    def normalize_payment_type(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in {"rent", "full", "partial", "security_deposit", "late_fee", "invoice", "other"}:
            raise ValueError("A valid payment type is required")
        return normalized


class CashPaymentRequest(BaseModel):
    rental_id: int = Field(gt=0)
    amount: Decimal = Field(gt=0)
    payment_type: str = "RENT"


class SellerRegistrationRequest(RegisterRequest):
    store_name: str = Field(min_length=2, max_length=150)
    store_description: str | None = Field(default=None, max_length=2000)
    pickup_address: str = Field(min_length=5, max_length=1000)
    gstin: str | None = Field(default=None, max_length=15)
