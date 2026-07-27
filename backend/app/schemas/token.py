from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.schemas.user import UserResponse

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str
