import json
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres un especialista en SEO y GEO (Generative Engine Optimization) para Alimentos New York, "
    "una fábrica de panadería y repostería industrial en Caracas, Venezuela. "
    "Escribes siempre en español natural. Tu objetivo es la estrategia de palabras clave "
    "que posicione a la empresa como proveedor de referencia en su sector."
)

_REQUIRED_FIELDS = {
    "primary_keyword", "secondary_keywords", "audience_segments",
    "search_intent", "geo_answer", "internal_links",
}


def run(ctx: PipelineContext, brief: dict) -> dict:
    output_path = ctx.checkpoint_dir / "02_keywords.json"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 2):
        return json.loads(output_path.read_text(encoding="utf-8"))

    result = _call_llm(ctx, brief)
    _validate_keywords(result)
    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    return result


def _call_llm(ctx: PipelineContext, brief: dict) -> dict:
    gsc_lines = "\n".join(
        f'- "{q["query"]}" ({q["impressions"]} impresiones)'
        for q in brief.get("gsc_queries", [])[:15]
    )
    products_lines = "\n".join(
        f'- {p["title"]}: {", ".join(p["keywords"][:4])}'
        for p in brief.get("matched_products", [])[:8]
    )
    arbitrage = (
        "\n\nNOTA: Este tema capta búsquedas de 'cheesecake factory'. "
        "El geo_answer debe responder tanto a la intención de consumidor final "
        "(quiero cheesecake) como a la intención B2B (necesito proveedor de cheesecake)."
        if brief.get("traffic_arbitrage") else ""
    )

    prompt = (
        f"Analiza y devuelve una estrategia de palabras clave en JSON.\n\n"
        f"Tema: {brief['issue_title']}\n"
        f"Descripción: {brief.get('issue_body', '')[:400]}\n\n"
        f"Consultas reales de Google Search Console:\n{gsc_lines or 'Sin datos'}\n\n"
        f"Productos relevantes:\n{products_lines or 'Sin productos específicos'}"
        f"{arbitrage}\n\n"
        "Devuelve ÚNICAMENTE JSON con esta estructura exacta:\n"
        "{\n"
        '  "primary_keyword": "frase principal en español",\n'
        '  "secondary_keywords": ["frase 1", "frase 2", "frase 3"],\n'
        '  "audience_segments": ["consumidor"] o ["b2b"] o ["consumidor","b2b"],\n'
        '  "search_intent": "informacional" | "comercial" | "transaccional",\n'
        '  "geo_answer": "respuesta directa 2-3 oraciones para motores generativos (Perplexity, ChatGPT)",\n'
        '  "internal_links": ["/ruta/relativa/"]\n'
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


def _validate_keywords(data: dict) -> None:
    missing = _REQUIRED_FIELDS - set(data.keys())
    if missing:
        raise ValueError(f"Keyword strategy missing fields: {missing}")
