import json
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres el redactor oficial del blog de Alimentos New York, fábrica de panadería y repostería "
    "industrial en Caracas, Venezuela. REGLAS ABSOLUTAS:\n"
    "1. Escribe ÚNICAMENTE en español natural y fluido. Cero anglicismos innecesarios.\n"
    "2. Cita SÓLO los datos de producto y empresa que te proporciono. Nunca inventes cifras, "
    "precios, ni especificaciones técnicas.\n"
    "3. Escribe en prosa continua. Evita listas largas. Usa párrafos.\n"
    "4. El tono varía: para consumidores es cálido y apetitoso; para B2B es profesional y directo.\n"
    "5. No menciones a la empresa en tercera persona de forma robótica. Escribe como si fueras parte del equipo."
)


def run(ctx: PipelineContext, brief: dict, outline: dict) -> str:
    output_path = ctx.checkpoint_dir / "04_draft.md"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 4):
        return output_path.read_text(encoding="utf-8")

    products_by_id = {p["id"]: p for p in brief.get("matched_products", [])}
    parts = []
    image_briefs: list[dict] = []

    for section in outline["sections"]:
        section_products = [
            products_by_id[pid]
            for pid in section.get("products_to_mention", [])
            if pid in products_by_id
        ]
        section_md = _generate_section(ctx, section, section_products, brief.get("matched_kb_sections", []))

        image_slot = section.get("image_slot")
        if image_slot and image_slot.get("type") == "product":
            product_id = image_slot.get("product_id", "")
            product = products_by_id.get(product_id)
            if product and product.get("imagen"):
                img_path = f"/productos/{product['imagen']}"
                img_alt = product.get("title", product_id)
                section_md += f"\n\n![{img_alt}]({img_path})"
        elif image_slot and image_slot.get("type") == "lifestyle":
            image_briefs.append({
                "section": section["h2"],
                "brief": image_slot["brief"],
            })

        parts.append(section_md)

    cta = outline.get("closing_cta", {})
    closing = (
        "\n\n---\n\n"
        f"**Para consumidores:** {cta.get('consumer', '')}\n\n"
        f"**Para negocios:** {cta.get('b2b', '')}"
    )
    parts.append(closing)

    # Append image from issue metadata if no product image was embedded and no lifestyle slots
    issue_image_brief = brief.get("metadata", {}).get("image_brief")
    issue_image_url = brief.get("metadata", {}).get("image_url")
    if issue_image_url:
        # A real asset exists: embed it in the first section
        post_title = outline["sections"][0]["h2"] if outline["sections"] else "Post"
        parts[0] += f"\n\n![{post_title}]({issue_image_url})"
    elif issue_image_brief and not image_briefs:
        # No asset, but issue has an image description: use it as a lifestyle brief
        image_briefs.append({
            "section": outline["sections"][0]["h2"] if outline["sections"] else "Post",
            "brief": issue_image_brief,
        })

    # Trailing comment block with all lifestyle image briefs
    if image_briefs:
        brief_lines = ["<!-- IMAGE BRIEFS"]
        for ib in image_briefs:
            brief_lines.append(f"  Section: {ib['section']}")
            brief_lines.append(f"  Brief:   {ib['brief']}")
        brief_lines.append("-->")
        parts.append("\n".join(brief_lines))

    draft = "\n\n".join(parts)
    output_path.write_text(draft, encoding="utf-8")
    return draft


def _generate_section(ctx: PipelineContext, section: dict, products: list[dict], kb_sections: list[dict]) -> str:
    h3s_text = "\n".join(f"  - ### {h}" for h in section.get("h3s", []))
    products_text = "\n".join(
        f"- **{p['title']}**: {p['body'][:300]}" for p in products
    ) or "Sin productos específicos para esta sección."
    kb_text = "\n".join(
        f"[{s['title']}]: {s['excerpt']}" for s in kb_sections[:3]
    ) or ""
    audience_map = {
        "consumidor": "tono cálido y cercano",
        "b2b": "tono profesional y directo",
        "ambos": "equilibra ambos tonos",
    }
    tone = audience_map.get(section.get("audience", "ambos"), "equilibra ambos tonos")
    word_budget = section.get("word_budget", 180)

    prompt = (
        f"Escribe la sección del artículo con este encabezado H2: {section['h2']}\n\n"
        f"Subtítulos H3 a desarrollar:\n{h3s_text or '(sin subtítulos, desarrolla en párrafos)'}\n\n"
        f"Keyword a incluir naturalmente: {section.get('keyword_to_hit', '')}\n"
        f"Tono: {tone}\n"
        f"Límite de palabras: {word_budget} palabras para esta sección completa. "
        f"Sé conciso y directo. No rellenes con frases genéricas.\n\n"
        f"Datos de productos (cita SÓLO estos):\n{products_text}\n\n"
        f"Contexto de empresa:\n{kb_text}\n\n"
        "REGLAS:\n"
        "- Empieza directamente con el encabezado ## (no con H1).\n"
        "- No añadas frontmatter.\n"
        "- Escribe en prosa fluida en español. Evita listas largas.\n"
        "- No inventes datos, precios, ni testimonios que no estén en los datos de producto.\n"
        "- No repitas información que ya aparece en el título del artículo.\n"
        "- No uses frases de relleno como 'En conclusión', 'En resumen', 'Sin duda alguna'."
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
