from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Persistence boundary for User. Routes/services must never touch the
    session directly — they go through this class."""

    def __init__(self, db: Session) -> None:
        super().__init__(db, User)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.get_by(email=email.lower())

    def email_exists(self, email: str) -> bool:
        return self.exists(email=email.lower())
