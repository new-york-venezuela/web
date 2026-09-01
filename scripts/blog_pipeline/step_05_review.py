import json
from openai import OpenAI
from .context import PipelineContext
from . import step_04_content

_SYSTEM_REVIEWER = (
    "Eres un editor senior de SEO/GEO en español. Revisas artículos del blog de Alimentos New York "
    "con criterios estrictos. Devuelves un JSON de revisión, nunca texto libre."
)


def run(ctx: PipelineContext, draft: str, brief: dict, keywords: dict, outline: dict) -> tuple[str, list[str]]:
    output_path = ctx.checkpoint_dir / "05_polished.md"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 5):
        return output_path.read_text(encoding="utf-8"), []

    review = _call_reviewer(ctx, draft, keywords)
    warnings: list[str] = []

    if not review.get("pass"):
        retried = _retry_sections(ctx, draft, brief, outline, review["issues"])
        review2 = _call_reviewer(ctx, retried, keywords)
        if review2.get("pass"):
            draft = retried
        else:
            draft = review2.get("polished") or retried
            warnings = [f"{i['section']}: {i['problem']}" for i in review2.get("issues", [])]
    else:
        draft = review.get("polished") or draft

    output_path.write_text(draft, encoding="utf-8")
    return draft, warnings


def _call_reviewer(ctx: PipelineContext, draft: str, keywords: dict) -> dict:
    primary_kw = keywords.get("primary_keyword", "")
    geo_answer = keywords.get("geo_answer", "")
    audiences = keywords.get("audience_segments", [])

    prompt = (
        f"Revisa el siguiente artículo de blog en español.\n\n"
        f"Keyword principal a verificar: '{primary_kw}'\n"
        f"Respuesta GEO que debe aparecer al inicio: '{geo_answer}'\n"
        f"Audiencias requeridas: {audiences}\n\n"
        f"ARTÍCULO:\n{draft}\n\n"
        "Verifica (devuelve problemas sólo si están presentes):\n"
        "1. La keyword principal aparece en los primeros 100 caracteres Y en al menos 2 encabezados H2.\n"
        "2. La respuesta GEO (o paráfrasis cercana) aparece en el primer párrafo.\n"
        "3. No hay datos de producto inventados (precios, especificaciones no proporcionadas).\n"
        "4. No hay testimonios inventados, citas de clientes o frases como 'según nuestros clientes'.\n"
        "5. El español es fluido y natural, sin anglicismos innecesarios.\n"
        "6. Si se requieren dos audiencias, ambas están representadas.\n"
        "7. No hay repetición de ideas entre secciones H2 — cada sección aporta información nueva.\n"
        "8. Hay un CTA al final con secciones separadas para consumidor y B2B.\n\n"
        "Devuelve ÚNICAMENTE este JSON:\n"
        "{\n"
        '  "pass": true|false,\n'
        '  "issues": [\n'
        '    {"section": "nombre del H2 afectado o \\"global\\"", "problem": "descripción concisa", "suggestion": "cómo corregirlo"}\n'
        "  ],\n"
        '  "polished": "artículo completo corregido si hay problemas menores de redacción (null si pass=true)"\n'
        "}"
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM_REVIEWER}, {"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _retry_sections(ctx: PipelineContext, draft: str, brief: dict, outline: dict, issues: list[dict]) -> str:
    flagged_h2s = {i["section"] for i in issues}
    products_by_id = {p["id"]: p for p in brief.get("matched_products", [])}
    kb = brief.get("matched_kb_sections", [])
    lines = draft.split("\n")
    result_lines = []
    skip_section = False
    pending_replacement = None

    for line in lines:
        if line.startswith("## "):
            current_h2 = line[3:].strip()
            if current_h2 in flagged_h2s:
                skip_section = True
                matching = next(
                    (s for s in outline["sections"] if s["h2"] == current_h2), None
                )
                if matching:
                    issue = next((i for i in issues if i["section"] == current_h2), {})
                    section_products = [products_by_id[pid] for pid in matching.get("products_to_mention", []) if pid in products_by_id]
                    new_section = step_04_content._generate_section(ctx, matching, section_products, kb)
                    pending_replacement = new_section
                continue
            else:
                skip_section = False
                if pending_replacement:
                    result_lines.append(pending_replacement)
                    pending_replacement = None
        if not skip_section:
            result_lines.append(line)

    if pending_replacement:
        result_lines.append(pending_replacement)

    return "\n".join(result_lines)
