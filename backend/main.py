import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from datetime import datetime, timedelta
import random
import time

app = FastAPI(title="Collectr Pro Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Render автоматически подставит сюда ссылку на свою базу данных!
# А если запускаешь дома - будет использовать локальную.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1111@127.0.0.1:5432/postgres")

def get_db():
    return psycopg2.connect(DATABASE_URL)

# МАГИЯ: При запуске сервера в облаке он сам создаст таблицу, если её нет!
@app.on_event("startup")
def startup_event():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS collections (
            id SERIAL PRIMARY KEY,
            card_id VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            set_name VARCHAR(100) DEFAULT 'Unknown',
            image_url TEXT NOT NULL,
            purchase_price DECIMAL(10, 2) NOT NULL,
            market_price DECIMAL(10, 2) DEFAULT 0.00,
            condition VARCHAR(50) DEFAULT 'Raw / NM',
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    cur.close()
    conn.close()

class PortfolioItem(BaseModel):
    card_id: str
    name: str
    set_name: str
    image_url: str
    purchase_price: float
    market_price: float
    condition: str


import time # Добавь этот импорт в самый верх файла

@app.get("/api/market/search/{query}")
def search_market(query: str):
    url = "https://api.pokemontcg.io/v2/cards"
    params = {"q": f"name:{query}"}
    headers = {
        "X-Api-Key": "b59140f9-4c47-4602-a3e5-c419bdd4b797",
        "User-Agent": "Mozilla/5.0"
    }

    # Пытаемся сделать запрос до 3 раз
    for attempt in range(3):
        try:
            # Увеличиваем таймаут до 20 секунд
            res = requests.get(url, headers=headers, params=params, timeout=20)
            res.raise_for_status()
            
            cards = res.json().get("data", [])
            results = []
            for card in cards[:12]:
                price_data = card.get("cardmarket", {}).get("prices", {})
                price = price_data.get("averageSellPrice") or price_data.get("trendPrice") or 0.0
                
                results.append({
                    "id": card["id"],
                    "name": card["name"],
                    "set": card.get("set", {}).get("name", "Unknown"),
                    "image": card["images"]["small"],
                    "price": float(price)
                })
            return {"data": results}

        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            print(f"Попытка {attempt + 1} не удалась (таймаут). Ждем и пробуем снова...")
            time.sleep(1) # Ждем 1 секунду перед следующей попыткой
            continue
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    # Если все 3 попытки провалились
    raise HTTPException(status_code=504, detail="Pokémon TCG API слишком долго не отвечает. Попробуйте еще раз через минуту.")

@app.post("/api/portfolio/add")
def add_to_portfolio(item: PortfolioItem):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO collections 
            (card_id, name, set_name, image_url, purchase_price, market_price, condition) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (item.card_id, item.name, item.set_name, item.image_url, item.purchase_price, item.market_price, item.condition)
        )
        conn.commit()
        return {"status": "success"}
    finally:
        cur.close()
        conn.close()

@app.get("/api/portfolio/analytics")
def get_portfolio_analytics():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM collections ORDER BY added_at DESC")
        items = cur.fetchall()
        
        total_invested = sum(item['purchase_price'] for item in items)
        current_value = sum(item['market_price'] for item in items)
        profit_loss = current_value - total_invested
        roi = (profit_loss / total_invested * 100) if total_invested > 0 else 0

        chart_data = []
        base_val = current_value * 0.8 
        for i in range(30, -1, -1):
            date = (datetime.now() - timedelta(days=i)).strftime("%b %d")
            base_val += random.uniform(-10, 20) if i > 0 else (current_value - base_val)
            chart_data.append({"date": date, "value": round(base_val, 2)})

        return {
            "stats": {
                "total_cards": len(items),
                "total_invested": round(total_invested, 2),
                "current_value": round(current_value, 2),
                "profit_loss": round(profit_loss, 2),
                "roi_percent": round(roi, 2)
            },
            "chart_data": chart_data,
            "items": items
        }
    finally:
        cur.close()
        conn.close()

@app.delete("/api/portfolio/{item_id}")
def delete_item(item_id: int):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM collections WHERE id = %s", (item_id,))
        conn.commit()
        return {"status": "deleted"}
    finally:
        cur.close()
        conn.close()