from app.core.enums import Role
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPair


class AuthService:
    """Business logic for authentication.

    Depends on UserRepository (Liskov: any subclass works) and the stateless
    helpers in `core.security`. No SQL, no FastAPI imports — keeps the layer
    free of framework + persistence details.
    """

    def __init__(self, user_repo: UserRepository) -> None:
        self._users = user_repo

    # ---------- Public API ----------

    def register(self, email: str, password: str, role: Role = Role.USER) -> User:
        normalized_email = email.lower()
        if self._users.email_exists(normalized_email):
            raise ConflictError(
                "Email is already registered.",
                error_code="EMAIL_TAKEN",
            )
        user = User(
            email=normalized_email,
            password_hash=hash_password(password),
            role=role.value,
        )
        return self._users.add(user)

    def authenticate(self, email: str, password: str) -> User:
        user = self._users.get_by_email(email)
        # Constant-time-ish: always run verify_password to avoid leaking
        # whether an email exists via response timing.
        dummy_hash = "$2b$12$" + "x" * 53
        candidate_hash = user.password_hash if user else dummy_hash
        if not verify_password(password, candidate_hash) or user is None:
            raise UnauthorizedError(
                "Invalid credentials.",
                error_code="BAD_CREDENTIALS",
            )
        return user

    def issue_tokens(self, user: User) -> TokenPair:
        claims = {"email": user.email, "role": user.role}
        return TokenPair(
            access_token=create_access_token(user.id, extra_claims=claims),
            refresh_token=create_refresh_token(user.id, extra_claims=claims),
        )

    def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token, expected_type="refresh")
        user = self._users.get(payload["sub"])
        if user is None:
            raise UnauthorizedError(
                "User no longer exists.",
                error_code="USER_NOT_FOUND",
            )
        return self.issue_tokens(user)
