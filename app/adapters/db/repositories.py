# SQLAlchemy repository adapters — concrete implementations of domain ports.
# These translate port interfaces into SQLAlchemy ORM operations.

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.domain.entities import (
    Card,
    CollectionItem,
    PriceHistoryEntry,
    User,
)
from app.core.ports.repositories import (
    CardRepository,
    CollectionRepository,
    PriceHistoryRepository,
    UserRepository,
)
from app.db.models import (
    Card as CardModel,
    Collection as CollectionModel,
    PriceHistory as PriceHistoryModel,
    User as UserModel,
)


# ── Helper: domain ↔ model mappers ──────────────────────────────────

def _user_to_domain(model: UserModel) -> User:
    return User(
        id=model.id,
        email=model.email,
        password_hash=model.password_hash,
        created_at=model.created_at,
    )


def _card_to_domain(model: CardModel, history: list | None = None) -> Card:
    return Card(
        id=model.id,
        pokemon_tcg_id=model.pokemon_tcg_id,
        name=model.name,
        set_name=model.set_name,
        image_url=model.image_url,
        price_history=[
            PriceHistoryEntry(
                id=ph.id,
                card_id=ph.card_id,
                price=ph.price,
                date_recorded=ph.date_recorded,
            )
            for ph in (history or model.price_history)
        ],
    )


def _collection_to_domain(model: CollectionModel, card: Card) -> CollectionItem:
    return CollectionItem(
        id=model.id,
        user_id=model.user_id,
        card_id=model.card_id,
        card=card,
        acquired_date=model.acquired_date,
        condition=model.condition,
        quantity=model.quantity,
    )


def _price_history_to_domain(model: PriceHistoryModel) -> PriceHistoryEntry:
    return PriceHistoryEntry(
        id=model.id,
        card_id=model.card_id,
        price=model.price,
        date_recorded=model.date_recorded,
    )


# ── Repository implementations ──────────────────────────────────────


class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        model = result.scalar_one_or_none()
        return _user_to_domain(model) if model else None

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        model = result.scalar_one_or_none()
        return _user_to_domain(model) if model else None

    async def create(self, email: str, password_hash: str) -> User:
        model = UserModel(email=email, password_hash=password_hash)
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _user_to_domain(model)


class SQLAlchemyCardRepository(CardRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, card_id: int) -> Optional[Card]:
        result = await self._session.execute(
            select(CardModel)
            .where(CardModel.id == card_id)
            .options(selectinload(CardModel.price_history))
        )
        model = result.scalar_one_or_none()
        return _card_to_domain(model) if model else None

    async def get_by_pokemon_tcg_id(self, pokemon_tcg_id: str) -> Optional[Card]:
        result = await self._session.execute(
            select(CardModel)
            .where(CardModel.pokemon_tcg_id == pokemon_tcg_id)
            .options(selectinload(CardModel.price_history))
        )
        model = result.scalar_one_or_none()
        return _card_to_domain(model) if model else None

    async def create(self, card: Card) -> Card:
        model = CardModel(
            pokemon_tcg_id=card.pokemon_tcg_id,
            name=card.name,
            set_name=card.set_name,
            image_url=card.image_url,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        # After commit, re-fetch with relationships
        return await self.get_by_id(model.id) or card

    async def save(self, card: Card) -> Card:
        result = await self._session.execute(
            select(CardModel).where(CardModel.id == card.id)
        )
        model = result.scalar_one()
        model.name = card.name
        model.set_name = card.set_name
        model.image_url = card.image_url
        await self._session.commit()
        await self._session.refresh(model)
        return _card_to_domain(model)


class SQLAlchemyCollectionRepository(CollectionRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_user_id(self, user_id: int) -> List[CollectionItem]:
        result = await self._session.execute(
            select(CollectionModel)
            .where(CollectionModel.user_id == user_id)
            .options(
                selectinload(CollectionModel.card).selectinload(CardModel.price_history)
            )
        )
        models = result.scalars().all()
        items: List[CollectionItem] = []
        for m in models:
            card = _card_to_domain(m.card)
            items.append(_collection_to_domain(m, card))
        return items

    async def get_by_user_and_card(
        self, user_id: int, card_id: int
    ) -> Optional[CollectionItem]:
        result = await self._session.execute(
            select(CollectionModel)
            .where(
                CollectionModel.user_id == user_id,
                CollectionModel.card_id == card_id,
            )
        )
        model = result.scalar_one_or_none()
        if not model:
            return None
        card_result = await self._session.execute(
            select(CardModel)
            .where(CardModel.id == card_id)
            .options(selectinload(CardModel.price_history))
        )
        card_model = card_result.scalar_one_or_none()
        card = _card_to_domain(card_model) if card_model else Card(
            id=card_id, pokemon_tcg_id="", name="", set_name=None, image_url=None
        )
        return _collection_to_domain(model, card)

    async def create(
        self,
        user_id: int,
        card_id: int,
        acquired_date: Optional[datetime],
        condition: Optional[str],
        quantity: int = 1,
    ) -> CollectionItem:
        model = CollectionModel(
            user_id=user_id,
            card_id=card_id,
            acquired_date=acquired_date,
            condition=condition,
            quantity=quantity,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        # Load the associated card
        card_result = await self._session.execute(
            select(CardModel)
            .where(CardModel.id == card_id)
            .options(selectinload(CardModel.price_history))
        )
        card_model = card_result.scalar_one_or_none()
        card = _card_to_domain(card_model) if card_model else Card(
            id=card_id, pokemon_tcg_id="", name="", set_name=None, image_url=None
        )
        return _collection_to_domain(model, card)

    async def increment_quantity(self, collection_id: int) -> CollectionItem:
        result = await self._session.execute(
            select(CollectionModel).where(CollectionModel.id == collection_id)
        )
        model = result.scalar_one()
        model.quantity = model.quantity + 1
        await self._session.commit()
        await self._session.refresh(model)
        # Load card
        card_result = await self._session.execute(
            select(CardModel)
            .where(CardModel.id == model.card_id)
            .options(selectinload(CardModel.price_history))
        )
        card_model = card_result.scalar_one_or_none()
        card = _card_to_domain(card_model) if card_model else Card(
            id=model.card_id, pokemon_tcg_id="", name="", set_name=None, image_url=None
        )
        return _collection_to_domain(model, card)

    async def decrement_quantity_or_delete(self, collection_id: int) -> Optional[CollectionItem]:
        result = await self._session.execute(
            select(CollectionModel).where(CollectionModel.id == collection_id)
        )
        model = result.scalar_one_or_none()
        if not model:
            return None
        if model.quantity > 1:
            model.quantity = model.quantity - 1
            await self._session.commit()
            await self._session.refresh(model)
            card_result = await self._session.execute(
                select(CardModel)
                .where(CardModel.id == model.card_id)
                .options(selectinload(CardModel.price_history))
            )
            card_model = card_result.scalar_one_or_none()
            card = _card_to_domain(card_model) if card_model else Card(
                id=model.card_id, pokemon_tcg_id="", name="", set_name=None, image_url=None
            )
            return _collection_to_domain(model, card)
        else:
            await self._session.delete(model)
            await self._session.commit()
            return None

    async def delete(self, collection_id: int) -> None:
        result = await self._session.execute(
            select(CollectionModel).where(CollectionModel.id == collection_id)
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.commit()


class SQLAlchemyPriceHistoryRepository(PriceHistoryRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_card_id(self, card_id: int) -> List[PriceHistoryEntry]:
        result = await self._session.execute(
            select(PriceHistoryModel).where(PriceHistoryModel.card_id == card_id)
        )
        models = result.scalars().all()
        return [_price_history_to_domain(m) for m in models]

    async def get_latest_by_card_id(self, card_id: int) -> Optional[PriceHistoryEntry]:
        result = await self._session.execute(
            select(PriceHistoryModel)
            .where(PriceHistoryModel.card_id == card_id)
            .order_by(PriceHistoryModel.date_recorded.desc())
            .limit(1)
        )
        model = result.scalar_one_or_none()
        return _price_history_to_domain(model) if model else None

    async def create(self, card_id: int, price: Decimal) -> PriceHistoryEntry:
        model = PriceHistoryModel(card_id=card_id, price=price)
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _price_history_to_domain(model)
