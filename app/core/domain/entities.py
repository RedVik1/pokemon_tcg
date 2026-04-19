# Pure domain entities — no framework dependencies.
# These represent business concepts, not database rows or HTTP schemas.

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional


class Condition(str, Enum):
    MINT = "Mint"
    NEAR_MINT = "Near Mint"
    EXCELLENT = "Excellent"
    VERY_GOOD = "Very Good"
    GOOD = "Good"
    POOR = "Poor"


@dataclass(frozen=True)
class User:
    id: int
    email: str
    password_hash: str
    created_at: datetime


@dataclass(frozen=True)
class PriceHistoryEntry:
    """A single price point recorded at a point in time."""
    id: int
    card_id: int
    price: Decimal
    date_recorded: datetime


@dataclass(frozen=True)
class Card:
    """A Pokémon TCG card identified by its external TCG ID."""
    id: int
    pokemon_tcg_id: str
    name: str
    set_name: Optional[str]
    image_url: Optional[str]
    price: float = 0.0
    rarity: Optional[str] = None
    price_history: List[PriceHistoryEntry] = field(default_factory=list)
    # Generated price history for charts (1W, 1M, 1Y)
    history: dict = field(default_factory=dict)


@dataclass(frozen=True)
class CollectionItem:
    """A card owned by a user, with quantity and condition tracking."""
    id: int
    user_id: int
    card_id: int
    card: Card
    acquired_date: Optional[datetime]
    condition: Optional[str]
    quantity: int = 1


@dataclass(frozen=True)
class PortfolioStats:
    """Aggregate statistics for a user's collection."""
    total_cards: int
    total_portfolio_value: float
    most_valuable_card: Optional[Card]


@dataclass(frozen=True)
class MarketMover:
    """A card with significant recent price movement."""
    card: Card
    pct_change: float


@dataclass
class SearchResult:
    """Paginated result from a card search operation."""
    items: List[Card]
    total: int = 0
    page: int = 1
    has_more: bool = False
