"""Authentication endpoints: login, logout, me.

The session token is delivered only via a secure, HTTP-only cookie — it is never
present in the response body, so frontend JavaScript can't read it.
"""

from fastapi import APIRouter, Depends, Request, Response

from app.api.deps import get_auth_service, require_authenticated_user
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.schemas.common import SuccessResponse, success
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.session_samesite,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.session_samesite,
        path="/",
    )


@router.post("/login", response_model=SuccessResponse[LoginResponse], summary="Log in")
async def login(
    payload: LoginRequest,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
) -> SuccessResponse[LoginResponse]:
    user, token = await auth.login(payload.email, payload.password)
    _set_session_cookie(response, token)
    return success(LoginResponse(user=UserResponse.model_validate(user)))


@router.post("/logout", response_model=SuccessResponse[dict], summary="Log out")
async def logout(
    request: Request,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
) -> SuccessResponse[dict]:
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        await auth.logout(token)
    _clear_session_cookie(response)
    return success({"message": "Logged out"})


@router.get("/me", response_model=SuccessResponse[UserResponse], summary="Current user")
async def me(
    user: User = Depends(require_authenticated_user),
) -> SuccessResponse[UserResponse]:
    return success(UserResponse.model_validate(user))
