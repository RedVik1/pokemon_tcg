# PokemonTCG.io API adapter — concrete implementation of the PokemonTCGClient port.
# Wraps the existing app/services/pokemon_api.py behind a clean interface.

from __future__ import annotations

from typing import Any, Dict, List

from app.core.ports.external_api import PokemonTCGClient

# Reuse existing battle-tested implementation
from app.services.pokemon_api import (
    fetch_card_data,
    search_cards_by_name,
    get_top_market_movers,
)


class PokemonTCGClientAdapter(PokemonTCGClient):
    """Adapter that delegates to the existing pokemon_api service functions."""

    async def fetch_card(self, pokemon_tcg_id: str) -> Dict[str, Any]:
        return await fetch_card_data(pokemon_tcg_id)

    async def search_cards(
        self,
        query: str,
        page: int = 1,
        limit: int = 48,
        rarity: str = "",
        sort_by: str = "Newest",
    ) -> List[Dict[str, Any]]:
        return await search_cards_by_name(query, page, limit, rarity, sort_by)

    async def get_market_movers(self) -> List[Dict[str, Any]]:
        return await get_top_market_movers()
