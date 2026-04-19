from __future__ import annotations

import importlib
import os
import sys
import unittest
from unittest.mock import patch

from app.main import app
from app.services import pokemon_api


class SecurityConfigTests(unittest.TestCase):
    def test_secret_key_can_come_from_environment(self) -> None:
        module_name = "app.core.security"
        original_module = sys.modules.get(module_name)

        with patch.dict(os.environ, {"JWT_SECRET_KEY": "env-secret"}, clear=False):
            sys.modules.pop(module_name, None)
            security = importlib.import_module(module_name)
            try:
                self.assertEqual(security.SECRET_KEY, "env-secret")
            finally:
                if original_module is not None:
                    sys.modules[module_name] = original_module
                else:
                    sys.modules.pop(module_name, None)


class CollectionRouteTests(unittest.TestCase):
    def test_add_collection_route_returns_no_content(self) -> None:
        route = next(
            route
            for route in app.routes
            if getattr(route, "path", None) == "/collections/add"
        )

        self.assertIsNone(route.response_model)
        self.assertEqual(route.status_code, 204)


class SearchCachingTests(unittest.IsolatedAsyncioTestCase):
    async def test_search_cache_key_includes_limit(self) -> None:
        class FakeResponse:
            def raise_for_status(self) -> None:
                return None

            def json(self) -> dict:
                return {
                    "data": [
                        {
                            "id": "base1-4",
                            "name": "Charizard",
                            "images": {"large": "https://example.com/card.png"},
                            "tcgplayer": {"prices": {"holofoil": {"market": 120.0}}},
                            "rarity": "Rare Holo",
                            "set": {"name": "Base"},
                        }
                    ]
                }

        calls: list[int] = []

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs) -> None:
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb) -> None:
                return None

            async def get(self, url: str, params: dict | None = None, headers: dict | None = None):
                calls.append(params["pageSize"])
                return FakeResponse()

        pokemon_api._search_cache.clear()

        with patch("app.services.pokemon_api.httpx.AsyncClient", FakeAsyncClient):
            await pokemon_api.search_cards_by_name("charizard", page=1, limit=48)
            await pokemon_api.search_cards_by_name("charizard", page=1, limit=50)

        self.assertEqual(calls, [48, 50])


if __name__ == "__main__":
    unittest.main()
