# File: app/schemas.py
from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True  # Для Pydantic v2 (если старая версия, замени на orm_mode = True)

class CardCreate(BaseModel):
    pokemon_tcg_id: str

# В файле app/schemas.py найди CardOut и замени его на это:
class CardOut(BaseModel):
    id: int
    pokemon_tcg_id: str
    name: str
    set_name: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    history: Optional[dict] = None  # <-- ОБЯЗАТЕЛЬНО ДОБАВИТЬ ЭТО!

    class Config:
        from_attributes = True

class CardSearchResult(BaseModel):
    id: str
    name: str
    set_name: str
    rarity: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    history: Optional[dict] = None
    is_ebay: Optional[bool] = False  # <-- Добавили этот флаг

    class Config:
        from_attributes = True

class CollectionCreate(BaseModel):
    pokemon_tcg_id: str
    condition: Optional[str] = None
    acquired_date: Optional[datetime] = None

class CollectionOut(BaseModel):
    id: int
    user_id: int
    quantity: int = 1
    condition: Optional[str] = None
    acquired_date: Optional[datetime] = None
    card: CardOut

    class Config:
        from_attributes = True

class PortfolioStatsOut(BaseModel):
    total_cards: int
    total_portfolio_value: float
    most_valuable_card: Optional[CardOut] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None