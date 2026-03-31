from __future__ import annotations

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Ссылка на твою локальную базу в Postgres.app (замени 5432 на 5433, если остался на том порту)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://yehor@localhost:5433/pokemon_tcg",
)

# Создаем асинхронный движок для работы с базой
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Генератор сессий для эндпоинтов FastAPI.
    """
    async with AsyncSessionLocal() as session:
        yield session

async def init_db() -> None:
    """
    Создает все таблицы в базе данных при запуске приложения.
    """
    # ИСПРАВЛЕННЫЙ ИМПОРТ: теперь FastAPI точно знает, где лежат модели
    from app.db.models import Base 

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

__all__ = ["engine", "get_session", "init_db"]