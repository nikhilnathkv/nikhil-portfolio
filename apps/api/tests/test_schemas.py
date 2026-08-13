"""M2.3 acceptance tests — pure schema validation (no database).

Covers: valid data accepted; invalid URL / enum / missing field / date / slug /
email rejected; and partial updates without every field.
"""

from datetime import date

import pytest
from pydantic import ValidationError

from app.models.enums import ContentStatus
from app.schemas.blog import BlogPostCreate
from app.schemas.contact import ContactMessageCreate
from app.schemas.experience import ExperienceCreate
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.schemas.repository import RepositoryCreate


# --- valid data ------------------------------------------------------------
def test_valid_project_create() -> None:
    p = ProjectCreate(
        title="Aviation Intelligence",
        short_description="Forecasting aviation demand",
        github_url="https://github.com/nikhil/aviation",
        slug="aviation-intelligence-platform",
    )
    assert p.status is ContentStatus.DRAFT
    # URLs are carried as plain strings, not Pydantic Url objects.
    assert isinstance(p.github_url, str)


def test_valid_experience_create() -> None:
    exp = ExperienceCreate(company="Acme", role="ML Engineer", start_date=date(2023, 1, 1))
    assert exp.start_date == date(2023, 1, 1)


def test_valid_blog_create() -> None:
    post = BlogPostCreate(title="Hello World", content="Body text")
    assert post.status is ContentStatus.DRAFT


# --- invalid data ----------------------------------------------------------
def test_invalid_url_rejected() -> None:
    with pytest.raises(ValidationError):
        ProjectCreate(title="X", short_description="Y", github_url="not a url")


def test_invalid_enum_rejected() -> None:
    with pytest.raises(ValidationError):
        ProjectCreate(title="X", short_description="Y", status="nonsense")


def test_missing_required_field_rejected() -> None:
    with pytest.raises(ValidationError):
        ProjectCreate(short_description="Y")  # missing title


def test_invalid_date_rejected() -> None:
    with pytest.raises(ValidationError):
        ExperienceCreate(company="A", role="B", start_date="August 2026")


@pytest.mark.parametrize(
    "bad_slug", ["Aviation Intelligence!!!", "Has Spaces", "UPPER", "trailing-"]
)
def test_invalid_slug_rejected(bad_slug: str) -> None:
    with pytest.raises(ValidationError):
        ProjectCreate(title="X", short_description="Y", slug=bad_slug)


def test_invalid_email_rejected() -> None:
    with pytest.raises(ValidationError):
        ContactMessageCreate(name="N", email="not-an-email", message="hi")


def test_repository_requires_valid_url() -> None:
    with pytest.raises(ValidationError):
        RepositoryCreate(name="repo", url="ftp-ish nonsense")
    ok = RepositoryCreate(name="repo", url="https://github.com/x/repo")
    assert ok.url == "https://github.com/x/repo"


# --- partial update --------------------------------------------------------
def test_project_update_is_partial() -> None:
    update = ProjectUpdate(short_description="Just this field")
    dumped = update.model_dump(exclude_unset=True)
    assert dumped == {"short_description": "Just this field"}


def test_project_update_still_validates_provided_fields() -> None:
    with pytest.raises(ValidationError):
        ProjectUpdate(github_url="not a url")
    with pytest.raises(ValidationError):
        ProjectUpdate(slug="Not A Slug")
