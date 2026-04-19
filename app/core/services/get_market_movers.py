# Use case: Get market movers (cards with significant price movement).
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from decimal import Decimal
from typing import List

from app.core.domain.entities import Card, MarketMover, PriceHistoryEntry
from app.core.ports.external_api import PokemonTCGClient
from app.core.ports.usecases import GetMarketMovers


class GetMarketMoversUseCase(GetMarketMovers):
    def __init__(self, pokemon_tcg_client: PokemonTCGClient):
        self._client = pokemon_tcg_client

    async def execute(self) -> List[MarketMover]:
        raw_results = await self._client.get_market_movers()

        movers: List[MarketMover] = []
        for raw in raw_results:
            history_raw = raw.get("history", {})
            pct_change = raw.get("pct_change", 0.0)

            price_history: List[PriceHistoryEntry] = []
            for ph in raw.get("price_history", []):
                price_history.append(
                    PriceHistoryEntry(
                        id=ph["id"],
                        card_id=ph["card_id"],
                        price=Decimal(str(ph["price"])),
                        date_recorded=ph["date_recorded"],
                    )
                )

            card = Card(
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

            movers.append(MarketMover(card=card, pct_change=pct_change))

        return movers
