from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class IssueMetadata:
    scheduled_date: Optional[str] = None
    series: Optional[str] = None
    part: Optional[int] = None
    prerequisites: list = field(default_factory=list)
    parent_topic: Optional[str] = None
    tags: list = field(default_factory=list)


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
