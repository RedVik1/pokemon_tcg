# Ports — use case interfaces.
# Each interface represents a single application operation.
# Implementations live in app/core/services/.

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.core.domain.entities import (
    Card,
    CollectionItem,
    MarketMover,
    PortfolioStats,
    User,
)


# ── Command objects (inputs to use cases) ──────────────────────────


@dataclass
class SearchCardsCommand:
    query: str = ""
    page: int = 1
    limit: int = 48
    rarity: str = ""
    sort_by: str = "Newest"


@dataclass
class GetCardDetailsCommand:
    pokemon_tcg_id: str


@dataclass
class AddCardToCollectionCommand:
    user_id: int
    pokemon_tcg_id: str
    condition: Optional[str] = None
    acquired_date: Optional[object] = None  # datetime, deferred import to avoid cycle


@dataclass
class RemoveFromCollectionCommand:
    user_id: int
    collection_id: int


@dataclass
class GetCollectionCommand:
    user_id: int


@dataclass
class CalculatePortfolioValueCommand:
    user_id: int


@dataclass
class RegisterUserCommand:
    email: str
    password: str


@dataclass
class AuthenticateUserCommand:
    email: str
    password: str


# ── Result objects (outputs from use cases) ────────────────────────


@dataclass
class AuthResult:
    user: User
    access_token: str


@dataclass
class SearchCardsResult:
    cards: List[Card]


@dataclass
class CollectionResult:
    items: List[CollectionItem]


# ── Use case interfaces ────────────────────────────────────────────


class SearchCards(ABC):
    """Search cards via the external PokemonTCG.io API."""

    @abstractmethod
    async def execute(self, command: SearchCardsCommand) -> SearchCardsResult:
        ...


class GetCardDetails(ABC):
    """Fetch details for a single card."""

    @abstractmethod
    async def execute(self, command: GetCardDetailsCommand) -> Card:
        ...


class AddCardToCollection(ABC):
    """Add a card to a user's collection (or increment quantity)."""

    @abstractmethod
    async def execute(self, command: AddCardToCollectionCommand) -> CollectionItem:
        ...


class RemoveFromCollection(ABC):
    """Remove a card from a user's collection (decrement or delete)."""

    @abstractmethod
    async def execute(self, command: RemoveFromCollectionCommand) -> None:
        ...


class GetCollection(ABC):
    """Retrieve all cards in a user's collection."""

    @abstractmethod
    async def execute(self, command: GetCollectionCommand) -> CollectionResult:
        ...


class CalculatePortfolioValue(ABC):
    """Calculate total portfolio value and statistics."""

    @abstractmethod
    async def execute(self, command: CalculatePortfolioValueCommand) -> PortfolioStats:
        ...


class GetMarketMovers(ABC):
    """Get cards with significant recent price movement."""

    @abstractmethod
    async def execute(self) -> List[MarketMover]:
        ...


class RegisterUser(ABC):
    """Register a new user account."""

    @abstractmethod
    async def execute(self, command: RegisterUserCommand) -> User:
        ...


class AuthenticateUser(ABC):
    """Authenticate a user and return a JWT token."""

    @abstractmethod
    async def execute(self, command: AuthenticateUserCommand) -> AuthResult:
        ...
