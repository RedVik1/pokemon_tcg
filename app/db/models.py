# File: app/models.py
# SQLAlchemy ORM models for:
# - User
# - Card
# - Collection (association with extra fields)
# - PriceHistory

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Numeric,
    func
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"User(id={self.id!r}, email={self.email!r})"

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    pokemon_tcg_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    set_name = Column(String, nullable=True)
    image_url = Column(String, nullable=True)

    collections = relationship("Collection", back_populates="card", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="card", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"Card(id={self.id!r}, pokemon_tcg_id={self.pokemon_tcg_id!r}, name={self.name!r})"

class Condition(str, Enum):
    MINT = "Mint"
    NEAR_MINT = "Near Mint"
    EXCELLENT = "Excellent"
    VERY_GOOD = "Very Good"
    GOOD = "Good"
    POOR = "Poor"

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    acquired_date = Column(DateTime(timezone=True), nullable=True)
    condition = Column(String, nullable=True)  # Could be Enum(Condition)

    # NEW: quantity field
    quantity = Column(Integer, nullable=False, default=1)

    user = relationship("User", back_populates="collections")
    card = relationship("Card", back_populates="collections")

    def __repr__(self) -> str:
        return f"Collection(id={self.id!r}, user_id={self.user_id!r}, card_id={self.card_id!r}, acquired_date={self.acquired_date!r}, quantity={self.quantity!r}, condition={self.condition!r})"

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    date_recorded = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    card = relationship("Card", back_populates="price_history")

    def __repr__(self) -> str:
        return f"PriceHistory(id={self.id!r}, card_id={self.card_id!r}, price={self.price!r}, date_recorded={self.date_recorded!r})"
