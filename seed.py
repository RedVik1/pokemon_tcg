import asyncio
import logging
from datetime import datetime
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.db.database import AsyncSessionLocal, init_db
from app.db.models import User, Card, PriceHistory, Collection
from app.core.security import hash_password
from app.services.pokemon_api import fetch_card_data

async def seed():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("seed")

    await init_db()

    async with AsyncSessionLocal() as session:
        test_email = "test_demo@example.com"
        test_password = "password123"

        # Створюємо користувача
        res = await session.execute(select(User).where(User.email == test_email))
        user = res.scalar_one_or_none()
        if user is None:
            user = User(email=test_email, password_hash=hash_password(test_password))
            session.add(user)
            try:
                await session.commit()
                await session.refresh(user)
                logger.info("Created test user: %s", test_email)
            except IntegrityError:
                await session.rollback()
                res = await session.execute(select(User).where(User.email == test_email))
                user = res.scalar_one_or_none()
        else:
            logger.info("Test user already exists: %s", test_email)

        # Картки для колекції
        tcg_ids = ["base1-4", "sv4-1", "base1-1", "base2-1"]

        for tcgid in tcg_ids:
            res = await session.execute(select(Card).where(Card.pokemon_tcg_id == tcgid))
            card = res.scalar_one_or_none()
            data = None

            if card is None:
                try:
                    data = await fetch_card_data(tcgid)
                except Exception as e:
                    logger.warning("Failed to fetch data for %s: %s", tcgid, e)
                    data = None

                if not data or not data.get("name"):
                    logger.warning("No data for %s; skipping", tcgid)
                    continue

                card = Card(
                    pokemon_tcg_id=tcgid,
                    name=data.get("name"),
                    set_name=data.get("set_name"),
                    image_url=data.get("image_url"),
                )
                session.add(card)
                try:
                    await session.commit()
                    await session.refresh(card)
                except IntegrityError:
                    await session.rollback()
                    res = await session.execute(select(Card).where(Card.pokemon_tcg_id == tcgid))
                    card = res.scalar_one()
                    data = data or {}

            # Історія цін
            price = data.get("price") if data else None
            price_value = float(price) if isinstance(price, (int, float)) else 0.0
            
            # БЕЗПЕЧНА ПЕРЕВІРКА ЦІНИ (без ледачого завантаження)
            ph_res = await session.execute(select(PriceHistory).where(PriceHistory.card_id == card.id))
            has_price = ph_res.first()

            if not has_price:
                ph = PriceHistory(card_id=card.id, price=Decimal(str(price_value)))
                session.add(ph)
                try:
                    await session.commit()
                except IntegrityError:
                    await session.rollback()

            # Додаємо в колекцію
            if user and card:
                res = await session.execute(
                    select(Collection).where(Collection.user_id == user.id, Collection.card_id == card.id)
                )
                existing = res.scalar_one_or_none()
                if existing is None:
                    coll = Collection(
                        user_id=user.id,
                        card_id=card.id,
                        acquired_date=datetime.utcnow(),
                        condition="Mint",
                    )
                    session.add(coll)
                    try:
                        await session.commit()
                        logger.info(f"Added {card.name} to collection!")
                    except IntegrityError:
                        await session.rollback()

    logger.info("Seed finished.")

if __name__ == "__main__":
    asyncio.run(seed())