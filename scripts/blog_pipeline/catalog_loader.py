import re
from pathlib import Path


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm: dict = {}
    for line in parts[1].strip().splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            fm[key.strip()] = value.strip().strip("\"'")
    return fm, parts[2].strip()


def _parse_list_field(raw: str) -> list[str]:
    return re.findall(r'"([^"]+)"', raw)


def load_productos(content_dir: Path) -> list[dict]:
    productos = []
    for md_file in sorted((content_dir / "productos").glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        fm, body = _parse_frontmatter(text)
        productos.append({
            "id": fm.get("id", md_file.stem),
            "title": fm.get("title", ""),
            "keywords": _parse_list_field(fm.get("palabras_clave", "[]")),
            "imagen": fm.get("imagen", ""),
            "categoria_primaria": fm.get("categoria_primaria", ""),
            "categoria_secundaria": fm.get("categoria_secundaria", ""),
            "body": body,
        })
    return productos


def load_empresa_kb(content_dir: Path) -> list[dict]:
    empresa_dir = content_dir / "empresa"
    if not empresa_dir.exists():
        return []
    sections = []
    for md_file in sorted(empresa_dir.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        fm, body = _parse_frontmatter(text)
        sections.append({
            "file": md_file.name,
            "title": fm.get("title", md_file.stem),
            "keywords": _parse_list_field(fm.get("keywords", "[]")),
            "excerpt": body[:500],
            "full_text": body,
        })
    return sections


def match_by_keywords(items: list[dict], topic_words: set[str]) -> list[dict]:
    topic_words_lower = {w.lower() for w in topic_words}
    matched = []
    for item in items:
        item_kws = {k.lower() for k in item.get("keywords", [])}
        if item_kws & topic_words_lower:
            matched.append(item)
    return matched


def extract_topic_words(title: str, body: str) -> set[str]:
    text = f"{title} {body}".lower()
    words = re.findall(r"\b[a-záéíóúüñ]{3,}\b", text)
    stopwords = {
        "que", "los", "las", "del", "una", "con", "para", "por", "como",
        "este", "esta", "son", "sus", "más", "pero", "sin", "sobre", "los",
        "hay", "ser", "está", "han", "fue", "ser", "sus", "una", "uno",
    }
    return {w for w in words if w not in stopwords}
