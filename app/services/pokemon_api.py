# File: app/services/pokemon_api.py
from __future__ import annotations

import os
import time
import asyncio
import httpx
import random
import logging
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("POKEMONTCG_API_KEY")

logger = logging.getLogger(__name__)

_search_cache: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}
_movers_cache: tuple[float, List[Dict[str, Any]]] = (0.0, []) # Отдельный кэш для Market Movers
CACHE_TTL = 3600  

def _generate_mock_history(base_price: float, card_id: str) -> dict:
    if base_price <= 0:
        return {"1W": [], "1M": [], "1Y": []}
        
    rng = random.Random(card_id)

    def generate_series(points: int, volatility: float):
        series = []
        current = base_price
        series.append(round(current, 2))
        for _ in range(points - 1):
            current = current * (1 + rng.uniform(-volatility, volatility))
            series.insert(0, round(current, 2))
        return series

    return {
        "1W": generate_series(7, 0.04),
        "1M": generate_series(30, 0.05),
        "1Y": generate_series(12, 0.15)
    }

def _extract_price(data: dict) -> float:
    tcgplayer = data.get("tcgplayer", {})
    prices = tcgplayer.get("prices", {})
    
    if isinstance(prices, dict):
        for p_data in prices.values():
            if isinstance(p_data, dict):
                price = float(p_data.get("market") or p_data.get("mid") or p_data.get("low") or 0.0)
                if price > 0:
                    return round(price, 2)
    return 0.0

# 🔥 АНАЛИТИКА: Вычисляем лидеров рынка (только элитные карты > $50)
async def get_top_market_movers() -> List[Dict[str, Any]]:
    global _movers_cache
    if time.time() - _movers_cache[0] < CACHE_TTL and _movers_cache[1]:
        return _movers_cache[1]

    # Ищем специально среди самых редких карт
    q_str = 'supertype:pokemon (rarity:"Secret Rare" OR rarity:"Special Illustration Rare" OR rarity:"Hyper Rare" OR rarity:"Illustration Rare" OR rarity:"Rare Secret")'
    url = "https://api.pokemontcg.io/v2/cards"
    headers = {"X-Api-Key": API_KEY} if API_KEY else {}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params={
                "q": q_str,
                "pageSize": 100, 
                "orderBy": "-set.releaseDate",
                "select": "id,name,images,tcgplayer,rarity,set"
            }, headers=headers)
            resp.raise_for_status()
            data = resp.json().get("data", [])

            valid_cards = []
            for c in data:
                price = _extract_price(c)
                if price < 10.0: # СТРОГИЙ ФИЛЬТР: ТОЛЬКО КАРТЫ ДОРОЖЕ $50
                    continue 

                c_id = c.get("id")
                images = c.get("images", {})
                image_url = images.get("large") or images.get("small")
                if not image_url: continue

                history = _generate_mock_history(price, c_id)
                
                # Математика роста для сортировки
                arr = history["1M"]
                pct = ((arr[-1] - arr[0]) / arr[0]) * 100 if arr and arr[0] > 0 else 0.0

                valid_cards.append({
                    "id": c_id,
                    "name": c.get("name", "Unknown"),
                    "set_name": c.get("set", {}).get("name", ""),
                    "rarity": c.get("rarity", "Common"),
                    "image_url": image_url,
                    "price": price,
                    "history": history,
                    "pct_change": pct # Временное поле для сортировки
                })

            # Сортируем по максимальному проценту роста
            valid_cards.sort(key=lambda x: x["pct_change"], reverse=True)
            top_4 = valid_cards[:4]

            if top_4:
                _movers_cache = (time.time(), top_4)
            return top_4
    except Exception as e:
        logger.error(f"Market Movers API Error: {e}")
        return []

async def fetch_card_data(pokemon_tcg_id: str) -> Dict[str, Any]:
    url = f"https://api.pokemontcg.io/v2/cards/{pokemon_tcg_id}"
    headers = {"X-Api-Key": API_KEY} if API_KEY else {}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"select": "id,name,images,tcgplayer,rarity,set"}, headers=headers)
            resp.raise_for_status()
            data = resp.json().get("data", {})
            
            price = _extract_price(data)
            images = data.get("images", {})
            image_url = images.get("large") or images.get("small")
            set_name = data.get("set", {}).get("name", "Unknown")
            rarity = data.get("rarity", "Common")
            
            return {
                "name": data.get("name", "Unknown"),
                "set_name": f"{set_name} • {rarity}",
                "image_url": image_url,
                "price": price,
                "rarity": rarity,
                "history": _generate_mock_history(price, pokemon_tcg_id)
            }
    except Exception as e:
        logger.error(f"Fetch Error {pokemon_tcg_id}: {e}")
        return {"name": "Unknown", "set_name": "Error", "image_url": None, "price": 0.0, "rarity": "Common"}

async def search_cards_by_name(query: str, page: int = 1, limit: int = 48, rarity: str = "", sort_by: str = "Newest") -> List[Dict[str, Any]]:
    cache_key = f"q_{query}_r_{rarity}_s_{sort_by}_p_{page}"
    
    if cache_key in _search_cache:
        timestamp, cached_data = _search_cache[cache_key]
        if time.time() - timestamp < CACHE_TTL:
            return cached_data

    # 1. Сортировка на стороне API
    api_order = "-set.releaseDate" 
    if sort_by == "Price: High to Low":
        api_order = "-tcgplayer.prices.holofoil.market,-tcgplayer.prices.normal.market"
    elif sort_by == "Price: Low to High":
        api_order = "tcgplayer.prices.holofoil.market,tcgplayer.prices.normal.market"
    elif sort_by == "Name: A-Z":
        api_order = "name"

    # 2. Формируем строку запроса q
    # 🔥 Добавляем обязательное условие: цена должна быть больше 0
    q_parts = ['supertype:pokemon', '(tcgplayer.prices.holofoil.market:[0.01 TO *] OR tcgplayer.prices.normal.market:[0.01 TO *])']

    if rarity and rarity != "All":
        if rarity == "Secret Rare":
            q_parts.append('(rarity:"Rare Secret" OR rarity:"Hyper Rare" OR rarity:"Secret Rare")')
        elif rarity == "Ultra Rare":
            q_parts.append('(rarity:"Rare Ultra" OR rarity:"Ultra Rare")')
        elif rarity == "Holo Rare":
            q_parts.append('(rarity:"Rare Holo" OR rarity:"Holo Rare")')
        elif rarity == "Double Rare":
            q_parts.append('(rarity:"Double Rare" OR rarity:"Rare Holo V" OR rarity:"Rare Holo EX")')
        else:
            q_parts.append(f'rarity:"{rarity}"')

    if query:
        q_parts.append(f'name:"*{query}*"')

    q_string = " ".join(q_parts)

    url = "https://api.pokemontcg.io/v2/cards"
    headers = {"X-Api-Key": API_KEY} if API_KEY else {}
            
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params={
                "q": q_string, 
                "page": page, 
                "pageSize": limit, 
                "orderBy": api_order,
                "select": "id,name,images,tcgplayer,rarity,set"
            }, headers=headers)
            
            resp.raise_for_status()
            data = resp.json().get("data", [])
            
            results = []
            for c in data:
                price = _extract_price(c)
                # Дополнительная проверка на всякий случай
                if price <= 0: continue
                
                images = c.get("images", {})
                image_url = images.get("large") or images.get("small")
                if not image_url: continue
                
                results.append({
                    "id": c.get("id"),
                    "name": c.get("name", "Unknown"),
                    "set_name": c.get("set", {}).get("name", ""),
                    "rarity": c.get("rarity", "Common"),
                    "image_url": image_url,
                    "price": price,
                    "history": _generate_mock_history(price, c.get("id"))
                })
            
            if results:
                _search_cache[cache_key] = (time.time(), results)
            return results

    except Exception as e:
        logger.error(f"Search API Error: {e}")
        return []