"""Admin blog management (drafts visible)."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_blog_service
from app.schemas.blog import BlogPostCreate, BlogPostListResponse, BlogPostResponse, BlogPostUpdate
from app.schemas.common import SuccessResponse, success
from app.services.blog import BlogService

router = APIRouter(prefix="/blog", tags=["Admin: Blog"])


@router.get(
    "", response_model=SuccessResponse[list[BlogPostListResponse]], summary="List all posts"
)
async def list_blog(
    service: BlogService = Depends(get_blog_service),
) -> SuccessResponse[list[BlogPostListResponse]]:
    posts = await service.list_posts()
    return success([BlogPostListResponse.model_validate(p) for p in posts])


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
    "/{post_id}/archive", response_model=SuccessResponse[BlogPostResponse], summary="Archive"
)
async def archive_blog(
    post_id: uuid.UUID, service: BlogService = Depends(get_blog_service)
) -> SuccessResponse[BlogPostResponse]:
    return success(BlogPostResponse.model_validate(await service.archive_post(post_id)))
