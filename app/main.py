# File: app/main.py
from __future__ import annotations
import os
import logging
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

import jwt
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_session, init_db
from app.db.models import User, Card, PriceHistory, Collection
from app.schemas import (
    UserCreate, UserOut, CardOut, CollectionCreate, CollectionOut,
    PortfolioStatsOut, CardSearchResult, Token
)
from app.services.pokemon_api import fetch_card_data, search_cards_by_name, _generate_mock_history, get_top_market_movers
from app.core.security import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pokémon TCG Vault PRO")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

@app.on_event("startup")
async def startup_event():
    await init_db()

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_session)) -> User:
    cred_ex = HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except jwt.PyJWTError:
        raise cred_ex
    if not email:
        raise cred_ex
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        raise cred_ex
    return user

# 🔥 НОВЫЙ ЭНДПОИНТ: Регистрация пользователей
@app.post("/users/register", response_model=UserOut)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_session)):
    # Проверяем, существует ли уже такой email
    res = await db.execute(select(User).where(User.email == user_in.email))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    # Хэшируем пароль и сохраняем
    hashed_pw = hash_password(user_in.password)
    new_user = User(email=user_in.email, password_hash=hashed_pw)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.post("/users/login", response_model=Token)
async def login_api(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(User).where(User.email == form_data.username))
    user = res.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/search", response_model=List[CardSearchResult])
async def search(query: str = "", page: int = 1, limit: int = 48, rarity: str = "", sort_by: str = "Newest"):
    return await search_cards_by_name(query, page, limit, rarity, sort_by)

@app.get("/market-movers", response_model=List[CardSearchResult])
async def market_movers_api():
    return await get_top_market_movers()

@app.get("/portfolio/stats", response_model=PortfolioStatsOut)
async def portfolio_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(Collection).where(Collection.user_id == current_user.id).options(
        selectinload(Collection.card).selectinload(Card.price_history)
    ))
    colls = res.scalars().all()
    total = sum([float(max(c.card.price_history, key=lambda ph: ph.date_recorded).price) * getattr(c, 'quantity', 1) for c in colls if c.card.price_history]) or 0.0
    total_qty = sum([getattr(c, 'quantity', 1) for c in colls])
    top_card = None
    if colls and [c for c in colls if c.card.price_history]:
        best = max([c for c in colls if c.card.price_history], key=lambda c: float(max(c.card.price_history, key=lambda ph: ph.date_recorded).price))
        lp = float(max(best.card.price_history, key=lambda ph: ph.date_recorded).price)
        top_card = CardOut(
            id=best.card.id, pokemon_tcg_id=best.card.pokemon_tcg_id, name=best.card.name,
            set_name=best.card.set_name, image_url=best.card.image_url, price=lp,
            history=_generate_mock_history(lp, best.card.pokemon_tcg_id) 
        )
    return PortfolioStatsOut(total_cards=total_qty, total_portfolio_value=total, most_valuable_card=top_card)

@app.get("/collections/me", response_model=List[CollectionOut])
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(Collection).where(Collection.user_id == current_user.id).options(
        selectinload(Collection.card).selectinload(Card.price_history)
    ))
    items = res.scalars().all()
    output = []
    for coll in items:
        card = coll.card
        latest_price = 0.0
        if card and card.price_history:
            latest = max(card.price_history, key=lambda ph: ph.date_recorded)
            if latest and latest.price is not None:
                latest_price = float(latest.price)
                
        c_out = CardOut(
            id=card.id, pokemon_tcg_id=card.pokemon_tcg_id, name=card.name,
            set_name=card.set_name, image_url=card.image_url, price=latest_price,
            history=_generate_mock_history(latest_price, card.pokemon_tcg_id)
        )
        output.append(CollectionOut(
            id=coll.id, user_id=coll.user_id, acquired_date=coll.acquired_date,
            condition=coll.condition, card=c_out, quantity=getattr(coll, "quantity", 1)
        ))
    return output

@app.post("/collections/add", response_model=CollectionOut)
async def add_to_vault(coll_in: CollectionCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(Card).where(Card.pokemon_tcg_id == coll_in.pokemon_tcg_id).options(selectinload(Card.price_history)))
    card = res.scalar_one_or_none()
    
    if not card:
        data = await fetch_card_data(coll_in.pokemon_tcg_id)
        if not data or not data.get("name") or data.get("name") == "Unknown":
            raise HTTPException(status_code=404, detail="Card not found")
            
        card = Card(pokemon_tcg_id=coll_in.pokemon_tcg_id, name=data.get("name"), set_name=data.get("set_name"), image_url=data.get("image_url"))
        db.add(card)
        await db.commit()
        await db.refresh(card)
        
        price = data.get("price") or 0.0
        ph = PriceHistory(card_id=card.id, price=Decimal(str(price)))
        db.add(ph)
        await db.commit()
        
        res = await db.execute(select(Card).where(Card.id == card.id).options(selectinload(Card.price_history)))
        card = res.scalar_one()
        
    existing_res = await db.execute(select(Collection).where(Collection.user_id == current_user.id, Collection.card_id == card.id))
    existing = existing_res.scalar_one_or_none()
    
    if existing:
        existing.quantity = getattr(existing, "quantity", 1) + 1
        await db.commit()
    else:
        coll = Collection(user_id=current_user.id, card_id=card.id, acquired_date=coll_in.acquired_date, condition=coll_in.condition)
        if hasattr(coll, 'quantity'): coll.quantity = 1
        db.add(coll)
        await db.commit()
        coll_out = coll
    
    await db.refresh(existing if existing else coll_out)
    return Response(status_code=200)

@app.delete("/collections/{collection_id}", response_model=None)
async def delete_from_vault(collection_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id))
    coll = res.scalar_one_or_none()
    if not coll: raise HTTPException(status_code=404)
    
    if getattr(coll, "quantity", 1) > 1:
        coll.quantity = coll.quantity - 1
    else:
        await db.delete(coll)
    await db.commit()
    return Response(status_code=204)

# ==========================================
# SERVE FRONTEND (REACT)
# ==========================================

# Serve all static files from dist/ with SPA fallback to index.html
app.mount("/", StaticFiles(directory="dist", html=True, check_dir=False), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)