# Use case: Search cards via the external PokemonTCG.io API.
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from decimal import Decimal
from typing import List

from app.core.domain.entities import Card, PriceHistoryEntry
from app.core.ports.external_api import PokemonTCGClient
from app.core.ports.usecases import SearchCards, SearchCardsCommand, SearchCardsResult


class SearchCardsUseCase(SearchCards):
    def __init__(self, pokemon_tcg_client: PokemonTCGClient):
        self._client = pokemon_tcg_client

    async def execute(self, command: SearchCardsCommand) -> SearchCardsResult:
        raw_results = await self._client.search_cards(
            query=command.query,
            page=command.page,
            limit=command.limit,
            rarity=command.rarity,
            sort_by=command.sort_by,
        )

        cards: List[Card] = []
        for raw in raw_results:
            # The existing service returns dicts with history already generated.
            # We preserve them as-is for now; later phases will move generation here.
            history_raw = raw.get("history", {})
            price_history_raw = raw.get("price_history", [])

            price_history: List[PriceHistoryEntry] = []
            for ph in price_history_raw:
                price_history.append(
                    PriceHistoryEntry(
                        id=ph["id"],
                        card_id=ph["card_id"],
                        price=Decimal(str(ph["price"])),
                        date_recorded=ph["date_recorded"],
                    )
                )

            cards.append(
                Card(
                    id=raw.get("id", 0),
                    pokemon_tcg_id=raw["id"] if isinstance(raw.get("id"), str) else raw.get("pokemon_tcg_id", ""),
                    name=raw.get("name", "Unknown"),
                    set_name=raw.get("set_name"),
                    image_url=raw.get("image_url"),
                    price=float(raw.get("price", 0.0)),
                    rarity=raw.get("rarity"),
                    price_history=price_history,
                    history=history_raw,
                )
            )

        return SearchCardsResult(cards=cards)
