"""Blog endpoints (published only, newest first)."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_blog_service, pagination_params
from app.repositories.pagination import PageRequest
from app.schemas.blog import BlogPostListResponse, BlogPostResponse
from app.schemas.common import SuccessResponse, paginated, success
from app.services.blog import BlogService

router = APIRouter(prefix="/blog", tags=["Blog"])


@router.get(
    "",
    response_model=SuccessResponse[list[BlogPostListResponse]],
    summary="List published blog posts",
)
async def list_blog(
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    pagination: PageRequest = Depends(pagination_params),
    service: BlogService = Depends(get_blog_service),
) -> SuccessResponse[list[BlogPostListResponse]]:
    page = await service.list_public(category=category, tag=tag, pagination=pagination)
    return paginated(
        [BlogPostListResponse.model_validate(p) for p in page.items],
        page=page.page,
        page_size=page.page_size,
        total=page.total,
    )


@router.get(
    "/{slug}",
    response_model=SuccessResponse[BlogPostResponse],
    summary="Get a published blog post by slug",
)
async def get_blog(
    slug: str, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    post = await service.get_by_slug(slug)
    return success(BlogPostResponse.model_validate(post))
