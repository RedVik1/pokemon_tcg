# File: app/schemas/card.py
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel

class CardCreate(BaseModel):
    pokemon_tcg_id: str

class CardOut(BaseModel):
    id: int
    pokemon_tcg_id: str
    name: str
    set_name: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None

    class Config:
        orm_mode = True

class CardSearchResult(BaseModel):
    id: str
    name: str
    set_name: str
    rarity: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None

    class Config:
        orm_mode = True

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
        orm_mode = True

class PortfolioStatsOut(BaseModel):
    total_cards: int
    total_portfolio_value: float
    most_valuable_card: Optional[CardOut] = None

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
