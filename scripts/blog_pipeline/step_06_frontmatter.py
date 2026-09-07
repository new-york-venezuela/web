import datetime
import json
import re
from pathlib import Path
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres un especialista en metadatos SEO para el blog de Alimentos New York (español, Venezuela). "
    "Generas títulos y descripciones concisas, en español, con la keyword principal al inicio."
)


def run(
    ctx: PipelineContext,
    polished: str,
    outline: dict,
    keywords: dict,
    brief: dict,
    review_warnings: list[str],
) -> Path:
    slug = outline["slug"]
    blog_path = ctx.blog_output_dir / f"{slug}.md"

    # Checkpoint: return cached if output already exists and we're not forcing this step
    if blog_path.exists() and (ctx.force_step is None or ctx.force_step > 6):
        return blog_path

    meta = _call_llm(ctx, outline, keywords, brief)

    pub_date = brief.get("metadata", {}).get("scheduled_date") or str(datetime.date.today())
    tags = brief.get("metadata", {}).get("tags", [])
    post_id = brief.get("metadata", {}).get("post_id")

    og_image = _pick_og_image(outline, brief)

    frontmatter = (
        f"---\n"
        f'title: {json.dumps(meta["title"])}\n'
        f'description: {json.dumps(meta["description"])}\n'
        f"pubDate: {pub_date}\n"
        f'author: "eugenio"\n'
        f"draft: true\n"
        f'slug: {json.dumps(slug)}\n'
        f"tags: {json.dumps(tags)}\n"
        f"relatedIssue: {ctx.issue_number}\n"
    )
    if post_id:
        frontmatter += f'postId: {json.dumps(post_id)}\n'
    if og_image:
        frontmatter += f'ogImage: {json.dumps(og_image)}\n'
    frontmatter += "---\n\n"

    blog_path.parent.mkdir(parents=True, exist_ok=True)
    blog_path.write_text(frontmatter + polished, encoding="utf-8")

    image_briefs = [
        {
            "path": f"/blog/{slug}/{_slugify(s['image_slot']['brief'][:30])}.jpg",
            "brief": s["image_slot"]["brief"],
            "section": s["h2"],
        }
        for s in outline["sections"]
        if s.get("image_slot") and s["image_slot"].get("type") == "lifestyle"
    ]

    meta_doc = {
        "title": meta["title"],
        "description": meta["description"],
        "primary_keyword": keywords.get("primary_keyword", ""),
        "audience_segments": keywords.get("audience_segments", []),
        "search_intent": keywords.get("search_intent", ""),
        "image_briefs": image_briefs,
        "review_warnings": review_warnings,
        "slug": slug,
        "pub_date": pub_date,
    }
    (ctx.checkpoint_dir / "06_meta.json").write_text(
        json.dumps(meta_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    _write_pr_body(ctx.checkpoint_dir, meta_doc)

    return blog_path


def _call_llm(ctx: PipelineContext, outline: dict, keywords: dict, brief: dict) -> dict:
    prompt = (
        f"Genera el título SEO y la meta descripción para este artículo.\n\n"
        f"Slug: {outline['slug']}\n"
        f"Keyword principal: {keywords.get('primary_keyword', '')}\n"
        f"Keywords secundarias: {', '.join(keywords.get('secondary_keywords', []))}\n"
        f"Secciones del artículo: {', '.join(s['h2'] for s in outline['sections'])}\n\n"
        "REGLAS:\n"
        "- title: ≤60 caracteres, incluye la keyword principal, termina con '| Alimentos New York', en español\n"
        "- description: ≤160 caracteres, la keyword principal en los primeros 20 caracteres, responde la pregunta del usuario, en español\n\n"
        'Devuelve ÚNICAMENTE un objeto JSON: {"title": "...", "description": "..."}'
    )
    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    if len(result.get("title", "")) > 60:
        print(f"WARNING: Generated title exceeds 60 chars: {result['title'][:80]}")
    if len(result.get("description", "")) > 160:
        print(f"WARNING: Generated description exceeds 160 chars")
    return result


def _pick_og_image(outline: dict, brief: dict) -> str | None:
    products_by_id = {p["id"]: p for p in brief.get("matched_products", [])}
    for section in outline["sections"]:
        slot = section.get("image_slot")
        if slot and slot.get("type") == "product":
            pid = slot.get("product_id", "")
            product = products_by_id.get(pid)
            if product and product.get("imagen"):
                return f"/productos/{product['imagen']}"
    return None


def _write_pr_body(checkpoint_dir: Path, meta: dict) -> None:
    lines = [
        f"## {meta['title']}",
        "",
        f"**Keyword principal:** {meta['primary_keyword']}",
        f"**Audiencias:** {', '.join(meta['audience_segments'])}",
        f"**Intención de búsqueda:** {meta['search_intent']}",
        "",
    ]

    image_briefs = meta.get("image_briefs", [])
    if image_briefs:
        lines += ["## Imágenes requeridas (lifestyle)", ""]
        for ib in image_briefs:
            lines += [
                f"- **Sección:** {ib['section']}",
                f"  **Brief:** {ib['brief']}",
                f"  **Ruta:** `{ib['path']}`",
                "",
            ]

    review_warnings = meta.get("review_warnings", [])
    if review_warnings:
        lines += ["## Advertencias del revisor", ""]
        for w in review_warnings:
            lines.append(f"- {w}")
        lines.append("")

    lines += [
        "## Checklist para el revisor",
        "",
        "- [ ] Cambiar `draft: true` a `draft: false` antes de publicar",
        "- [ ] Crear todas las imágenes lifestyle listadas arriba y subirlas a `/public`",
        "- [ ] Verificar que la keyword principal aparece en el primer párrafo",
        "- [ ] Revisar que todos los enlaces internos (`href`) apuntan a URLs válidas del sitio",
        "- [ ] Confirmar que el CTA de cierre incluye secciones para consumidor y B2B",
    ]

    (checkpoint_dir / "pr_body.md").write_text("\n".join(lines), encoding="utf-8")


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
