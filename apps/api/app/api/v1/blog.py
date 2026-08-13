"""Blog endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.blog import BlogPostListResponse, BlogPostResponse
from app.schemas.common import SuccessResponse, success
from app.services.content import BlogService

router = APIRouter(prefix="/blog", tags=["blog"])


@router.get("", response_model=SuccessResponse[list[BlogPostListResponse]])
async def list_blog(
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse[list[BlogPostListResponse]]:
    posts = await BlogService(db).list()
    return success([BlogPostListResponse.model_validate(p) for p in posts])


@router.get("/{slug}", response_model=SuccessResponse[BlogPostResponse])
async def get_blog(
    slug: str, db: AsyncSession = Depends(get_db)
) -> SuccessResponse[BlogPostResponse]:
    post = await BlogService(db).get_by_slug(slug)
    return success(BlogPostResponse.model_validate(post))
