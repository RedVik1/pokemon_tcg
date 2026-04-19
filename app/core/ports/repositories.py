# Ports — abstract interfaces that define contracts for adapters.
# Core depends on these; implementations live in adapters.

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from app.core.domain.entities import (
    Card,
    CollectionItem,
    PriceHistoryEntry,
    User,
)


class UserRepository(ABC):
    """Port for user persistence operations."""

    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        ...

    @abstractmethod
    async def create(self, email: str, password_hash: str) -> User:
        ...


class CardRepository(ABC):
    """Port for card persistence operations."""

    @abstractmethod
    async def get_by_id(self, card_id: int) -> Optional[Card]:
        ...

    @abstractmethod
    async def get_by_pokemon_tcg_id(self, pokemon_tcg_id: str) -> Optional[Card]:
        ...

    @abstractmethod
    async def create(self, card: Card) -> Card:
        ...

    @abstractmethod
    async def save(self, card: Card) -> Card:
        ...


class CollectionRepository(ABC):
    """Port for collection (user-owned cards) operations."""

    @abstractmethod
    async def get_by_user_id(self, user_id: int) -> List[CollectionItem]:
        ...

    @abstractmethod
    async def get_by_user_and_card(
        self, user_id: int, card_id: int
    ) -> Optional[CollectionItem]:
        ...

    @abstractmethod
    async def create(
        self,
        user_id: int,
        card_id: int,
        acquired_date: Optional[datetime],
        condition: Optional[str],
        quantity: int = 1,
    ) -> CollectionItem:
        ...

    @abstractmethod
    async def increment_quantity(self, collection_id: int) -> CollectionItem:
        ...

    @abstractmethod
    async def decrement_quantity_or_delete(self, collection_id: int) -> Optional[CollectionItem]:
        """Decrements quantity by 1; deletes the entry if quantity reaches 0."""
        ...

    @abstractmethod
    async def delete(self, collection_id: int) -> None:
        ...


class PriceHistoryRepository(ABC):
    """Port for price history operations."""

    @abstractmethod
    async def get_by_card_id(self, card_id: int) -> List[PriceHistoryEntry]:
        ...

    @abstractmethod
    async def get_latest_by_card_id(self, card_id: int) -> Optional[PriceHistoryEntry]:
        ...

    @abstractmethod
    async def create(self, card_id: int, price: Decimal) -> PriceHistoryEntry:
        ...
