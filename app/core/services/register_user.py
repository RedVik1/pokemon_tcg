# Use case: Register a new user account.
# Pure business logic — no FastAPI, no database, no HTTP concerns.

from __future__ import annotations

from app.core.ports.repositories import UserRepository
from app.core.ports.usecases import RegisterUser, RegisterUserCommand


class UserAlreadyExistsError(Exception):
    """Raised when a user with the given email already exists."""
    pass


class RegisterUserUseCase(RegisterUser):
    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher,  # Callable[[str], str] — injected to avoid framework dependency
    ):
        self._repository = user_repository
        self._password_hasher = password_hasher

    async def execute(self, command: RegisterUserCommand):
        # Check for duplicate email
        existing = await self._repository.get_by_email(command.email)
        if existing is not None:
            raise UserAlreadyExistsError("Email is already registered")

        # Hash password and create user
        hashed_password = self._password_hasher(command.password)
        return await self._repository.create(
            email=command.email,
            password_hash=hashed_password,
        )
