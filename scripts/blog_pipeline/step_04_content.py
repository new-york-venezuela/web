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
            brief_text = image_slot.get("brief", "")
            section_md += f"\n\n<!-- IMAGE_BRIEF: {brief_text} -->"

        parts.append(section_md)

    cta = outline.get("closing_cta", {})
    closing = (
        "\n\n---\n\n"
        f"**Para consumidores:** {cta.get('consumer', '')}\n\n"
        f"**Para negocios:** {cta.get('b2b', '')}"
    )
    parts.append(closing)

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
    audience_map = {"consumidor": "tono cálido y cercano", "b2b": "tono profesional y directo", "ambos": "equilibra ambos tonos"}
    tone = audience_map.get(section.get("audience", "ambos"), "equilibra ambos tonos")

    prompt = (
        f"Escribe la sección del artículo con este encabezado H2: {section['h2']}\n\n"
        f"Subtítulos H3 a desarrollar:\n{h3s_text or '(sin subtítulos, desarrolla en párrafos)'}\n\n"
        f"Keyword a incluir naturalmente: {section.get('keyword_to_hit', '')}\n"
        f"Tono: {tone}\n\n"
        f"Datos de productos (cita SÓLO estos):\n{products_text}\n\n"
        f"Contexto de empresa:\n{kb_text}\n\n"
        "IMPORTANTE: Empieza directamente con el encabezado ## (no con H1). "
        "No añadas frontmatter. Escribe en prosa fluida en español. "
        "No inventes datos que no estén en los datos de producto arriba."
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
