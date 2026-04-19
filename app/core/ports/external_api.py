# Ports — external service interfaces.
# Core depends on these; implementations live in adapters.

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class PokemonTCGClient(ABC):
    """Port for the external PokemonTCG.io API."""

    @abstractmethod
    async def fetch_card(self, pokemon_tcg_id: str) -> Dict[str, Any]:
        """Fetch a single card by its external TCG ID."""
        ...

    @abstractmethod
    async def search_cards(
        self,
        query: str,
        page: int = 1,
        limit: int = 48,
        rarity: str = "",
        sort_by: str = "Newest",
    ) -> List[Dict[str, Any]]:
        """Search cards by name with optional filters."""
        ...

    @abstractmethod
    async def get_market_movers(self) -> List[Dict[str, Any]]:
        """Get cards with significant recent price movement."""
        ...
