# Use case: Get a user's collection.
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from typing import Callable, List

from app.core.domain.entities import Card, CollectionItem
from app.core.ports.repositories import CollectionRepository
from app.core.ports.usecases import GetCollection, GetCollectionCommand, CollectionResult


# Type alias for the mock history generator (injected to keep this use case pure).
HistoryGenerator = Callable[[float, str], dict]


class GetCollectionUseCase(GetCollection):
    def __init__(
        self,
        collection_repository: CollectionRepository,
        history_generator: HistoryGenerator,
    ):
        self._repository = collection_repository
        self._history_generator = history_generator

    async def execute(self, command: GetCollectionCommand) -> CollectionResult:
        collection_items = await self._repository.get_by_user_id(command.user_id)

        # Enrich each card with the latest price and generated history
        enriched: List[CollectionItem] = []
        for item in collection_items:
            latest_price = 0.0
            if item.card.price_history:
                latest_entry = max(item.card.price_history, key=lambda ph: ph.date_recorded)
                if latest_entry.price is not None:
                    latest_price = float(latest_entry.price)

            enriched_card = Card(
                id=item.card.id,
                pokemon_tcg_id=item.card.pokemon_tcg_id,
                name=item.card.name,
                set_name=item.card.set_name,
                image_url=item.card.image_url,
                price=latest_price,
                price_history=item.card.price_history,
                history=self._history_generator(latest_price, item.card.pokemon_tcg_id),
            )

            enriched.append(
                CollectionItem(
                    id=item.id,
                    user_id=item.user_id,
                    card_id=item.card_id,
                    card=enriched_card,
                    acquired_date=item.acquired_date,
                    condition=item.condition,
                    quantity=item.quantity,
                )
            )

        return CollectionResult(items=enriched)
