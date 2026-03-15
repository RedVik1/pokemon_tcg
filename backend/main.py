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


@app.get("/api/market/search/{query}")
def search_market(query: str):
    # Очищаем запрос от пробелов
    query = query.strip().lower()
    url = "https://api.pokemontcg.io/v2/cards"
    params = {"q": f"name:{query}", "pageSize": 12}
    
    headers = {
        "X-Api-Key": "b59140f9-4c47-4602-a3e5-c419bdd4b797",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Encoding": "identity", # Запрещаем сжатие, чтобы ускорить обработку
        "Connection": "keep-alive"
    }

    for attempt in range(2):
        try:
            # 40 секунд — это очень много, должно хватить даже самому ленивому серверу
            res = requests.get(url, headers=headers, params=params, timeout=40)
            
            if res.status_code == 200:
                data = res.json().get("data", [])
                if not data:
                    return {"data": []}
                
                results = []
                for card in data:
                    prices = card.get("cardmarket", {}).get("prices", {})
                    price = prices.get("averageSellPrice") or prices.get("trendPrice") or 0.0
                    results.append({
                        "id": card["id"],
                        "name": card["name"],
                        "set": card.get("set", {}).get("name", "Unknown"),
                        "image": card["images"]["small"],
                        "price": float(price)
                    })
                return {"data": results}
                
        except Exception as e:
            print(f"Попытка {attempt+1} провалилась: {e}")
            time.sleep(2)
            continue
            
    raise HTTPException(status_code=504, detail="API Pokémon TCG перегружен. Попробуйте еще раз через 10 секунд.")

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