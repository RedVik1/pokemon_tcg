# Use case: Calculate portfolio value and statistics.
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from typing import Callable, List, Optional

from app.core.domain.entities import Card, PortfolioStats
from app.core.ports.repositories import CollectionRepository
from app.core.ports.usecases import CalculatePortfolioValue, CalculatePortfolioValueCommand


# Type alias for the mock history generator (injected to keep this use case pure).
# Signature: (base_price: float, card_id: str) -> dict
HistoryGenerator = Callable[[float, str], dict]


class CalculatePortfolioValueUseCase(CalculatePortfolioValue):
    def __init__(
        self,
        collection_repository: CollectionRepository,
        history_generator: HistoryGenerator,
    ):
        self._repository = collection_repository
        self._history_generator = history_generator

    async def execute(self, command: CalculatePortfolioValueCommand) -> PortfolioStats:
        collection_items = await self._repository.get_by_user_id(command.user_id)

        total_value = 0.0
        total_qty = 0
        most_valuable_card: Optional[Card] = None
        highest_price = 0.0

        for item in collection_items:
            qty = item.quantity
            total_qty += qty

            if item.card.price_history:
                latest_entry = max(item.card.price_history, key=lambda ph: ph.date_recorded)
                latest_price = float(latest_entry.price)
                total_value += latest_price * qty

                if latest_price > highest_price:
                    highest_price = latest_price
                    most_valuable_card = Card(
                        id=item.card.id,
                        pokemon_tcg_id=item.card.pokemon_tcg_id,
                        name=item.card.name,
                        set_name=item.card.set_name,
                        image_url=item.card.image_url,
                        price=latest_price,
                        history=self._history_generator(latest_price, item.card.pokemon_tcg_id),
                    )

        return PortfolioStats(
            total_cards=total_qty,
            total_portfolio_value=total_value,
            most_valuable_card=most_valuable_card,
        )
