# Use case: Authenticate a user and return a JWT token.
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from typing import Callable

from app.core.ports.repositories import UserRepository
from app.core.ports.usecases import AuthenticateUser, AuthenticateUserCommand, AuthResult


class InvalidCredentialsError(Exception):
    """Raised when authentication fails."""
    pass


class AuthenticateUserUseCase(AuthenticateUser):
    def __init__(
        self,
        user_repository: UserRepository,
        password_verifier,  # Callable[[str, str], bool] — plain_password, hashed_password
        token_creator,      # Callable[[dict], str] — creates JWT token from payload
    ):
        self._repository = user_repository
        self._password_verifier = password_verifier
        self._token_creator = token_creator

    async def execute(self, command: AuthenticateUserCommand) -> AuthResult:
        # Lookup user by email
        user = await self._repository.get_by_email(command.email)
        if user is None:
            raise InvalidCredentialsError("Incorrect email or password")

        # Verify password
        if not self._password_verifier(command.password, user.password_hash):
            raise InvalidCredentialsError("Incorrect email or password")

        # Create JWT token
        access_token = self._token_creator({"sub": user.email})

        return AuthResult(user=user, access_token=access_token)
