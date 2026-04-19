# File: app/main.py
from __future__ import annotations
import logging
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from app.db.database import init_db
from app.db.models import User
from app.schemas import (
    UserCreate, UserOut, CardOut, CollectionCreate, CollectionOut,
    PortfolioStatsOut, CardSearchResult, Token
)
from app.adapters.api.auth import get_current_user
from app.adapters.wiring import (
    get_search_cards_use_case,
    get_market_movers_use_case,
    get_calculate_portfolio_value_use_case,
    get_collection_use_case,
    get_add_card_to_collection_use_case,
    get_remove_from_collection_use_case,
    get_register_user_use_case,
    get_authenticate_user_use_case,
)
from app.core.ports.usecases import (
    SearchCardsCommand, GetMarketMovers, CalculatePortfolioValueCommand,
    CalculatePortfolioValue, GetCollectionCommand, GetCollection,
    AddCardToCollectionCommand, AddCardToCollection,
    RemoveFromCollectionCommand, RemoveFromCollection,
    RegisterUserCommand, RegisterUser, AuthenticateUserCommand, AuthenticateUser,
)
from app.core.services.add_card_to_collection import CardNotFoundError
from app.core.services.register_user import UserAlreadyExistsError

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

@app.on_event("startup")
async def startup_event():
    await init_db()


# 🔥 НОВЫЙ ЭНДПОИНТ: Регистрация пользователей
@app.post("/users/register", response_model=UserOut)
async def register_user(
    user_in: UserCreate,
    use_case: RegisterUser = Depends(get_register_user_use_case),
):
    try:
        result = await use_case.execute(RegisterUserCommand(
            email=user_in.email, password=user_in.password,
        ))
        return result
    except UserAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email is already registered")

@app.post("/users/login", response_model=Token)
async def login_api(
    form_data: OAuth2PasswordRequestForm = Depends(),
    use_case: AuthenticateUser = Depends(get_authenticate_user_use_case),
):
    try:
        result = await use_case.execute(AuthenticateUserCommand(
            email=form_data.username, password=form_data.password,
        ))
        return {"access_token": result.access_token, "token_type": "bearer"}
    except Exception:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

@app.get("/search", response_model=List[CardSearchResult])
async def search(
    query: str = "",
    page: int = 1,
    limit: int = 48,
    rarity: str = "",
    sort_by: str = "Newest",
    use_case: SearchCards = Depends(get_search_cards_use_case),
):
    result = await use_case.execute(SearchCardsCommand(
        query=query, page=page, limit=limit, rarity=rarity, sort_by=sort_by,
    ))
    return [
        {
            "id": card.pokemon_tcg_id,
            "name": card.name,
            "set_name": card.set_name or "",
            "rarity": card.rarity,
            "image_url": card.image_url,
            "price": card.price,
            "history": card.history,
            "is_ebay": False,
        }
        for card in result.cards
    ]

@app.get("/market-movers", response_model=List[CardSearchResult])
async def market_movers_api(
    use_case: GetMarketMovers = Depends(get_market_movers_use_case),
):
    movers = await use_case.execute()
    return [
        {
            "id": mover.card.pokemon_tcg_id,
            "name": mover.card.name,
            "set_name": mover.card.set_name or "",
            "rarity": mover.card.rarity,
            "image_url": mover.card.image_url,
            "price": mover.card.price,
            "history": mover.card.history,
            "is_ebay": False,
        }
        for mover in movers
    ]

@app.get("/portfolio/stats", response_model=PortfolioStatsOut)
async def portfolio_stats(
    current_user: User = Depends(get_current_user),
    use_case: CalculatePortfolioValue = Depends(get_calculate_portfolio_value_use_case),
):
    stats = await use_case.execute(CalculatePortfolioValueCommand(user_id=current_user.id))
    top_card_out = None
    if stats.most_valuable_card:
        c = stats.most_valuable_card
        top_card_out = CardOut(
            id=c.id, pokemon_tcg_id=c.pokemon_tcg_id, name=c.name,
            set_name=c.set_name, image_url=c.image_url, price=c.price,
            history=c.history,
        )
    return PortfolioStatsOut(
        total_cards=stats.total_cards,
        total_portfolio_value=stats.total_portfolio_value,
        most_valuable_card=top_card_out,
    )

@app.get("/collections/me", response_model=List[CollectionOut])
async def get_me(
    current_user: User = Depends(get_current_user),
    use_case: GetCollection = Depends(get_collection_use_case),
):
    result = await use_case.execute(GetCollectionCommand(user_id=current_user.id))
    from app.services.pokemon_api import _generate_mock_history
    output = []
    for item in result.items:
        card_history = item.card.history
        if not card_history:
            card_history = _generate_mock_history(item.card.price or 0, item.card.pokemon_tcg_id)
        c_out = CardOut(
            id=item.card.id, pokemon_tcg_id=item.card.pokemon_tcg_id, name=item.card.name,
            set_name=item.card.set_name, image_url=item.card.image_url, price=item.card.price,
            history=card_history,
        )
        output.append(CollectionOut(
            id=item.id, user_id=item.user_id, acquired_date=item.acquired_date,
            condition=item.condition, card=c_out, quantity=item.quantity,
        ))
    return output

@app.post("/collections/add", response_model=CollectionOut)
async def add_to_vault(
    coll_in: CollectionCreate,
    current_user: User = Depends(get_current_user),
    use_case: AddCardToCollection = Depends(get_add_card_to_collection_use_case),
):
    try:
        result = await use_case.execute(AddCardToCollectionCommand(
            user_id=current_user.id,
            pokemon_tcg_id=coll_in.pokemon_tcg_id,
            condition=coll_in.condition,
            acquired_date=coll_in.acquired_date,
        ))
    except CardNotFoundError:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card_history = result.card.history
    if not card_history:
        from app.services.pokemon_api import _generate_mock_history
        card_history = _generate_mock_history(result.card.price or 0, result.card.pokemon_tcg_id)
    
    c_out = CardOut(
        id=result.card.id, pokemon_tcg_id=result.card.pokemon_tcg_id, name=result.card.name,
        set_name=result.card.set_name, image_url=result.card.image_url, price=result.card.price,
        history=card_history,
    )
    return CollectionOut(
        id=result.id, user_id=result.user_id, acquired_date=result.acquired_date,
        condition=result.condition, card=c_out, quantity=result.quantity,
    )

@app.delete("/collections/{collection_id}", status_code=204)
async def delete_from_vault(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    use_case: RemoveFromCollection = Depends(get_remove_from_collection_use_case),
):
    await use_case.execute(RemoveFromCollectionCommand(
        user_id=current_user.id,
        collection_id=collection_id,
    ))

# ==========================================
# SERVE FRONTEND (REACT)
# ==========================================

# Serve CSS, JS, images from dist/assets
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# Serve favicon from dist root
@app.get("/favicon.svg")
async def serve_favicon():
    return FileResponse("dist/favicon.svg")

# All other routes → React SPA (index.html)
@app.get("/{catchall:path}")
async def serve_react_app(catchall: str):
    if catchall in ("docs", "openapi.json"):
        raise HTTPException(status_code=404)
    return FileResponse("dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)