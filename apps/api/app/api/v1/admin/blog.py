"""Admin blog management (drafts visible)."""

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_blog_service, pagination_params
from app.models.enums import ContentStatus
from app.repositories.blog import BlogFilters
from app.repositories.pagination import PageRequest
from app.schemas.blog import BlogPostCreate, BlogPostListResponse, BlogPostResponse, BlogPostUpdate
from app.schemas.common import SuccessResponse, paginated, success
from app.services.blog import BlogService

router = APIRouter(prefix="/blog", tags=["Admin: Blog"])


@router.get(
    "", response_model=SuccessResponse[list[BlogPostListResponse]], summary="List all posts"
)
async def list_blog(
    q: str | None = Query(default=None),
    status_filter: ContentStatus | None = Query(default=None, alias="status"),
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    pagination: PageRequest = Depends(pagination_params),
    service: BlogService = Depends(get_blog_service),
) -> SuccessResponse[list[BlogPostListResponse]]:
    page = await service.search(
        filters=BlogFilters(status=status_filter, category=category, tag=tag, search=q),
        pagination=pagination,
    )
    return paginated(
        [BlogPostListResponse.model_validate(p) for p in page.items],
        page=page.page,
        page_size=page.page_size,
        total=page.total,
    )


@router.get(
    "/by-slug/{slug}",
    response_model=SuccessResponse[BlogPostResponse],
    summary="Get a post by slug (any status) — used by the admin preview",
)
async def get_blog_by_slug(
    slug: str, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(
        BlogPostResponse.model_validate(await service.get_by_slug(slug, published_only=False))
    )


@router.post(
    "",
    response_model=SuccessResponse[BlogPostResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a post",
)
async def create_blog(
    payload: BlogPostCreate, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.create_post(payload)))


@router.get("/{post_id}", response_model=SuccessResponse[BlogPostResponse], summary="Get a post")
async def get_blog(
    post_id: uuid.UUID, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.get_post(post_id)))


@router.put("/{post_id}", response_model=SuccessResponse[BlogPostResponse], summary="Update a post")
async def update_blog(
    post_id: uuid.UUID, payload: BlogPostUpdate, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.update_post(post_id, payload)))


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a post")
async def delete_blog(post_id: uuid.UUID, service: BlogService = Depends(get_blog_service)) -> None:
    await service.delete_post(post_id)


@router.post(
    "/{post_id}/publish", response_model=SuccessResponse[BlogPostResponse], summary="Publish"
)
async def publish_blog(
    post_id: uuid.UUID, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.publish_post(post_id)))


@router.post(
    "/{post_id}/unpublish", response_model=SuccessResponse[BlogPostResponse], summary="Unpublish"
)
async def unpublish_blog(
    post_id: uuid.UUID, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.unpublish_post(post_id)))


@router.post(
    "/{post_id}/archive", response_model=SuccessResponse[BlogPostResponse], summary="Archive"
)
async def archive_blog(
    post_id: uuid.UUID, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.archive_post(post_id)))


@router.post(
    "/{post_id}/duplicate",
    response_model=SuccessResponse[BlogPostResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a post as a new draft",
)
async def duplicate_blog(
    post_id: uuid.UUID, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.duplicate_post(post_id)))
