# Wiring — dependency injection container.
# Creates use case instances with their adapter dependencies.
# Route handlers get use cases via these factory functions.

from __future__ import annotations

from typing import Callable

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.db.repositories import (
    SQLAlchemyCardRepository,
    SQLAlchemyCollectionRepository,
    SQLAlchemyPriceHistoryRepository,
    SQLAlchemyUserRepository,
)
from app.adapters.external.pokemon_tcg_client import PokemonTCGClientAdapter
from app.core.ports.usecases import (
    AddCardToCollection,
    AuthenticateUser,
    CalculatePortfolioValue,
    GetCardDetails,
    GetCollection,
    GetMarketMovers,
    RegisterUser,
    RemoveFromCollection,
    SearchCards,
)
from app.core.services.add_card_to_collection import AddCardToCollectionUseCase
from app.core.services.authenticate_user import AuthenticateUserUseCase
from app.core.services.calculate_portfolio_value import CalculatePortfolioValueUseCase
from app.core.services.get_collection import GetCollectionUseCase
from app.core.services.get_market_movers import GetMarketMoversUseCase
from app.core.services.register_user import RegisterUserUseCase
from app.core.services.remove_from_collection import RemoveFromCollectionUseCase
from app.core.services.search_cards import SearchCardsUseCase
from app.db.database import get_session


def _get_history_generator():
    """Returns the mock history generator function (from existing service)."""
    from app.services.pokemon_api import _generate_mock_history
    return _generate_mock_history


def _get_password_hasher():
    """Returns the password hashing function."""
    from app.core.security import hash_password
    return hash_password


def _get_password_verifier():
    """Returns the password verification function."""
    from app.core.security import verify_password
    return verify_password


def _get_token_creator():
    """Returns the JWT token creation function."""
    from app.core.security import create_access_token
    return create_access_token


# ── Use case factories (one per use case) ─────────────────────────────
# Each factory takes a FastAPI Depends(get_session) and returns a ready-to-use use case.
# This is the composition root — the only place that knows about concrete implementations.


def _make_search_cards_use_case(session: AsyncSession) -> SearchCards:
    return SearchCardsUseCase(
        pokemon_tcg_client=PokemonTCGClientAdapter(),
    )


def _make_get_market_movers_use_case(session: AsyncSession) -> GetMarketMovers:
    return GetMarketMoversUseCase(
        pokemon_tcg_client=PokemonTCGClientAdapter(),
    )


def _make_calculate_portfolio_value_use_case(session: AsyncSession) -> CalculatePortfolioValue:
    return CalculatePortfolioValueUseCase(
        collection_repository=SQLAlchemyCollectionRepository(session),
        history_generator=_get_history_generator(),
    )


def _make_get_collection_use_case(session: AsyncSession) -> GetCollection:
    return GetCollectionUseCase(
        collection_repository=SQLAlchemyCollectionRepository(session),
        history_generator=_get_history_generator(),
    )


def _make_add_card_to_collection_use_case(session: AsyncSession) -> AddCardToCollection:
    return AddCardToCollectionUseCase(
        card_repository=SQLAlchemyCardRepository(session),
        collection_repository=SQLAlchemyCollectionRepository(session),
        price_history_repository=SQLAlchemyPriceHistoryRepository(session),
        pokemon_tcg_client=PokemonTCGClientAdapter(),
        history_generator=_get_history_generator(),
    )


def _make_remove_from_collection_use_case(session: AsyncSession) -> RemoveFromCollection:
    return RemoveFromCollectionUseCase(
        collection_repository=SQLAlchemyCollectionRepository(session),
    )


def _make_register_user_use_case(session: AsyncSession) -> RegisterUser:
    return RegisterUserUseCase(
        user_repository=SQLAlchemyUserRepository(session),
        password_hasher=_get_password_hasher(),
    )


def _make_authenticate_user_use_case(session: AsyncSession) -> AuthenticateUser:
    return AuthenticateUserUseCase(
        user_repository=SQLAlchemyUserRepository(session),
        password_verifier=_get_password_verifier(),
        token_creator=_get_token_creator(),
    )


# ── FastAPI-compatible dependency functions ───────────────────────────
# These wrap factories so route handlers can use `Depends(get_X_use_case)`.


async def get_search_cards_use_case(
    session: AsyncSession = Depends(get_session),
) -> SearchCards:
    return _make_search_cards_use_case(session)


async def get_market_movers_use_case(
    session: AsyncSession = Depends(get_session),
) -> GetMarketMovers:
    return _make_get_market_movers_use_case(session)


async def get_calculate_portfolio_value_use_case(
    session: AsyncSession = Depends(get_session),
) -> CalculatePortfolioValue:
    return _make_calculate_portfolio_value_use_case(session)


async def get_collection_use_case(
    session: AsyncSession = Depends(get_session),
) -> GetCollection:
    return _make_get_collection_use_case(session)


async def get_add_card_to_collection_use_case(
    session: AsyncSession = Depends(get_session),
) -> AddCardToCollection:
    return _make_add_card_to_collection_use_case(session)


async def get_remove_from_collection_use_case(
    session: AsyncSession = Depends(get_session),
) -> RemoveFromCollection:
    return _make_remove_from_collection_use_case(session)


async def get_register_user_use_case(
    session: AsyncSession = Depends(get_session),
) -> RegisterUser:
    return _make_register_user_use_case(session)


async def get_authenticate_user_use_case(
    session: AsyncSession = Depends(get_session),
) -> AuthenticateUser:
    return _make_authenticate_user_use_case(session)
