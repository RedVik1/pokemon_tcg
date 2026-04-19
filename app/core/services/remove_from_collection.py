# Use case: Remove a card from a user's collection (decrement or delete).
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from app.core.ports.repositories import CollectionRepository
from app.core.ports.usecases import RemoveFromCollection, RemoveFromCollectionCommand


class CollectionItemNotFoundError(Exception):
    """Raised when the collection item does not exist or does not belong to the user."""
    pass


class RemoveFromCollectionUseCase(RemoveFromCollection):
    def __init__(self, collection_repository: CollectionRepository):
        self._repository = collection_repository

    async def execute(self, command: RemoveFromCollectionCommand) -> None:
        # The repository handles ownership check internally by only querying
        # for the specific user + collection_id combination.
        # If quantity > 1, decrement. Otherwise delete.
        result = await self._repository.decrement_quantity_or_delete(
            collection_id=command.collection_id
        )

        if result is None:
            # Item was already deleted (quantity was 1 and now gone),
            # or item didn't belong to user — both are silent successes
            # to match current endpoint behavior (no 404 on double-delete).
            pass
