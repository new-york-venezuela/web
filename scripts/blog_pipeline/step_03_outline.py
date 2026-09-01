import json
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres un arquitecto de contenido SEO/GEO para Alimentos New York, fábrica de panadería "
    "industrial en Caracas. Produces estructuras de artículos en español natural que posicionan "
    "a la empresa como proveedor de referencia y que responden directamente a lo que busca el usuario."
)


def run(ctx: PipelineContext, brief: dict, keywords: dict) -> dict:
    output_path = ctx.checkpoint_dir / "03_outline.json"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 3):
        return json.loads(output_path.read_text(encoding="utf-8"))

    result = _call_llm(ctx, brief, keywords)
    _validate_outline(result)
    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    return result


def _call_llm(ctx: PipelineContext, brief: dict, keywords: dict) -> dict:
    products_list = "\n".join(f'- {p["id"]}: {p["title"]}' for p in brief.get("matched_products", []))
    kb_list = "\n".join(f'- {s["file"]}: {s["title"]}' for s in brief.get("matched_kb_sections", []))
    audiences = ", ".join(keywords.get("audience_segments", ["consumidor"]))

    prompt = (
        f"Crea el esquema (outline) del artículo en JSON.\n\n"
        f"Título del artículo: {brief['issue_title']}\n"
        f"Keyword principal: {keywords['primary_keyword']}\n"
        f"Keywords secundarias: {', '.join(keywords.get('secondary_keywords', []))}\n"
        f"Segmentos de audiencia: {audiences}\n"
        f"Respuesta GEO (va al inicio): {keywords['geo_answer']}\n\n"
        f"Productos disponibles para mencionar:\n{products_list or 'Ninguno'}\n\n"
        f"Secciones de KB de empresa disponibles:\n{kb_list or 'Ninguna'}\n\n"
        "INSTRUCCIONES:\n"
        "- El primer H2 introduce la respuesta GEO directa al inicio del artículo.\n"
        "- Cada H2 tiene exactamente un campo 'audience': 'consumidor', 'b2b' o 'ambos'.\n"
        "- Si el artículo tiene dos audiencias, alterna secciones o crea un bloque B2B explícito.\n"
        "- El cierre (closing_cta) siempre tiene 'consumer' y 'b2b' separados.\n"
        "- image_slot: {'type': 'product', 'product_id': '...'} si el producto tiene imagen, "
        "{'type': 'lifestyle', 'brief': 'descripción en español de la foto ideal'} si no, o null.\n"
        "- word_budget: número de palabras objetivo para esa sección H2 (incluyendo sus H3). "
        "Máximo 180 palabras por sección. Primer H2 (GEO intro): 80 palabras. "
        "Si solo hay 1 sección de contenido, 250 palabras.\n"
        "- PROHIBIDO: Incluir secciones de 'testimonios', 'opiniones de clientes', o 'reseñas'. "
        "No cites ni inventes testimonios. No uses frases como 'según nuestros clientes' o similares.\n"
        "- PROHIBIDO: Más de 4 secciones H2 en total (incluyendo intro GEO). "
        "Artículos de 3 secciones son preferidos.\n\n"
        "Devuelve ÚNICAMENTE este JSON:\n"
        "{\n"
        '  "slug": "slug-en-minusculas-con-guiones",\n'
        '  "sections": [\n'
        '    {\n'
        '      "h2": "Título de sección en español",\n'
        '      "audience": "consumidor|b2b|ambos",\n'
        '      "keyword_to_hit": "frase a incluir en esta sección",\n'
        '      "products_to_mention": ["product-id"],\n'
        '      "h3s": ["Subtítulo 1", "Subtítulo 2"],\n'
        '      "image_slot": null,\n'
        '      "internal_links": ["/ruta/"],\n'
        '      "word_budget": 180\n'
        "    }\n"
        "  ],\n"
        '  "closing_cta": {"consumer": "texto CTA consumidor", "b2b": "texto CTA B2B"}\n'
        "}"
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _validate_outline(data: dict) -> None:
    if not data.get("sections"):
        raise ValueError("Outline must have at least one section")
    if not data.get("slug"):
        raise ValueError("Outline must have a slug")
    cta = data.get("closing_cta", {})
    if not cta.get("consumer") or not cta.get("b2b"):
        raise ValueError("Outline closing_cta must have non-empty 'consumer' and 'b2b' keys")
    for section in data["sections"]:
        if "word_budget" not in section:
            section["word_budget"] = 180  # default if LLM omits it
