# Use case: Add a card to a user's collection (or increment quantity).
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from decimal import Decimal
from typing import Callable, Optional

from app.core.domain.entities import Card, CollectionItem, PriceHistoryEntry
from app.core.ports.external_api import PokemonTCGClient
from app.core.ports.repositories import CardRepository, CollectionRepository, PriceHistoryRepository
from app.core.ports.usecases import AddCardToCollection, AddCardToCollectionCommand


# Type alias for the mock history generator (injected to keep this use case pure).
HistoryGenerator = Callable[[float, str], dict]


class CardNotFoundError(Exception):
    """Raised when the external API has no data for a requested card."""
    pass


class AddCardToCollectionUseCase(AddCardToCollection):
    def __init__(
        self,
        card_repository: CardRepository,
        collection_repository: CollectionRepository,
        price_history_repository: PriceHistoryRepository,
        pokemon_tcg_client: PokemonTCGClient,
        history_generator: HistoryGenerator,
    ):
        self._card_repository = card_repository
        self._collection_repository = collection_repository
        self._price_history_repository = price_history_repository
        self._pokemon_tcg_client = pokemon_tcg_client
        self._history_generator = history_generator

    async def execute(self, command: AddCardToCollectionCommand) -> CollectionItem:
        # 1. Check if card already exists in our DB
        card = await self._card_repository.get_by_pokemon_tcg_id(command.pokemon_tcg_id)

        # 2. If not, fetch from external API and persist
        if not card:
            raw_data = await self._pokemon_tcg_client.fetch_card(command.pokemon_tcg_id)
            if not raw_data or not raw_data.get("name") or raw_data.get("name") == "Unknown":
                raise CardNotFoundError("Card not found")

            price = raw_data.get("price", 0.0)
            card = Card(
                id=0,  # Will be set by repository
                pokemon_tcg_id=command.pokemon_tcg_id,
                name=raw_data.get("name"),
                set_name=raw_data.get("set_name"),
                image_url=raw_data.get("image_url"),
                history=self._history_generator(price, command.pokemon_tcg_id),
            )
            card = await self._card_repository.create(card)

            # Create initial price history entry
            await self._price_history_repository.create(
                card_id=card.id, price=Decimal(str(price))
            )

            # Re-fetch with history loaded
            card = await self._card_repository.get_by_pokemon_tcg_id(command.pokemon_tcg_id)
            if not card:
                raise RuntimeError("Card disappeared after creation")

        # 3. Check if user already owns this card
        existing = await self._collection_repository.get_by_user_and_card(
            user_id=command.user_id, card_id=card.id
        )

        if existing:
            # Increment quantity
            return await self._collection_repository.increment_quantity(existing.id)
        else:
            # Add new collection entry
            return await self._collection_repository.create(
                user_id=command.user_id,
                card_id=card.id,
                acquired_date=command.acquired_date,
                condition=command.condition,
                quantity=1,
            )
