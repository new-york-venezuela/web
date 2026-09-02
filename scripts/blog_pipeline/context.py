from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class IssueMetadata:
    post_id: Optional[str] = None
    week: Optional[int] = None
    scheduled_date: Optional[str] = None
    pilar: Optional[str] = None
    audience: Optional[str] = None
    primary_keyword: Optional[str] = None
    prerequisites: list = field(default_factory=list)   # legacy: post-XXX ids
    related_posts: list = field(default_factory=list)   # new: GH issue numbers (int)
    tags: list = field(default_factory=list)
    image_url: Optional[str] = None
    image_brief: Optional[str] = None


@dataclass
class PipelineContext:
    issue_number: int
    issue_title: str
    issue_body: str
    metadata: IssueMetadata
    checkpoint_dir: Path
    blog_output_dir: Path
    content_dir: Path
    ai_model: str
    ai_api_key: str
    ai_base_url: str
    gsc_site_url: str
    gsc_credentials_file: str
    github_repo: str
    blog_lang: str = "es"
    force_step: Optional[int] = None
    debug: bool = False
