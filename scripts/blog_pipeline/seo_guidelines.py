"""Directrices SEO/GEO compartidas por todos los pasos del pipeline del blog.

Una sola fuente de verdad: los prompts importan ``BRAND_BRIEF`` y
``SEO_RULES`` y el paso 6 valida el resultado con ``lint_post``.
"""
import json
import re
from pathlib import Path

BRAND_BRIEF = (
    "Datos de marca verificados (no inventes otros): New York Cheese Cake C.A., conocida "
    "comercialmente como Alimentos New York, es una fábrica de panadería, repostería y "
    "congelados en La Urbina, Caracas, desde 1980 (cuando los "
    "hermanos Doñaque trajeron la cheesecake estilo Nueva York a Caracas). Modelo B2B y B2C: "
    "supermercados (Gama, Plaza's, Unicasa, Páramo y otros), HORECA y bodegones. Producción "
    "con certificación Kosher Parve y Pat Israel. Variantes de marca que la gente busca: "
    "'Panadería Nueva York', 'New York Bakery', 'Alimentos New York'."
)

SEO_RULES = (
    "REGLAS SEO/GEO (obligatorias):\n"
    "- Contexto local: menciona Caracas (o Venezuela) de forma natural al menos una vez en el "
    "primer párrafo y en un H2.\n"
    "- Marca: usa 'Alimentos New York' y, sin forzar, UNA variante ('Panadería Nueva York' o "
    "'New York Bakery'). Nunca repitas la keyword de forma artificial (sin keyword stuffing).\n"
    "- E-E-A-T: apóyate en experiencia real (planta propia, desde 1980 (nunca cifras de años), Kosher Parve, distribución "
    "tienda por tienda). No inventes cifras, premios, clientes ni testimonios.\n"
    "- GEO: el primer párrafo responde la pregunta del título en 2-3 oraciones autosuficientes, "
    "que un motor generativo pueda citar tal cual.\n"
    "- Enlaces internos: incluye 2-4 enlaces Markdown a rutas existentes del sitio (al menos UNO "
    "a otro post del blog de la lista proporcionada), con anchor "
    "descriptivo (nunca 'haz clic aquí'). Prioriza /catalogo/, /productos/<id>/, "
    "/donde-encontrarnos/, /empresa/ y /contacto/.\n"
    "- Estructura: H2 con preguntas o frases buscables; párrafos de máximo 4 líneas; "
    "extensión total objetivo de 700-900 palabras.\n"
    "- Imágenes: todas con alt descriptivo en español (qué se ve + producto/contexto), sin "
    "empezar con 'imagen de'."
)

_MD_LINK = re.compile(r"(?<!!)\[([^\]]+)\]\((/[^)\s]*)\)")
_GENERIC_ANCHORS = {"aquí", "aqui", "click aquí", "haz clic aquí", "ver más", "leer más"}


def valid_routes(repo_root: Path | None = None) -> set[str]:
    """Rutas internas válidas: páginas fijas + productos + posts publicados."""
    root = repo_root or Path(__file__).resolve().parents[2]
    routes = {"/", "/catalogo/", "/empresa/", "/blog/", "/contacto/",
              "/donde-encontrarnos/", "/solicitar-llamada/"}
    # Las rutas /productos/<id>/ salen de productos.json (los .md no siempre coinciden).
    data = json.loads((root / "src/data/productos.json").read_text(encoding="utf-8"))
    for producto in data["productos"]:
        routes.add(f"/productos/{producto['id']}/")
    for md in (root / "src/content/empresa").glob("*.md"):
        routes.add(f"/empresa/{md.stem}/")
    for md in (root / "src/content/blog").glob("*.md"):
        routes.add(f"/blog/{md.stem}/")
    return routes


# Los .md de src/content/productos/ son la base de conocimiento del pipeline y algunos ids
# son variantes que el sitio publica en una sola ficha (productos.json). Este mapa dice a qué
# página real debe enlazar un post cuando menciona esa variante.
PRODUCT_PAGE_ALIASES = {
    "baguettes-demi-mini": "baguettes-congelados",
    "baguettes-precocida-comercial": "baguettes-precocida",
    "baguettes-precocida-foodservice": "baguettes-precocida",
    "pan-hokkaido-1700": "pan-1700",
    "pizza-margarita-clasica": "pizza-margarita",
    "pizza-margarita-premium": "pizza-margarita",
}


def product_route(product_id: str, routes: set[str] | None = None) -> str | None:
    """Ruta real de la ficha de un producto (resolviendo alias) o None si no existe."""
    routes = routes or valid_routes()
    for candidate in (product_id, PRODUCT_PAGE_ALIASES.get(product_id, "")):
        route = f"/productos/{candidate}/"
        if candidate and route in routes:
            return route
    return None


def existing_posts(repo_root: Path | None = None) -> list[tuple[str, str]]:
    """(ruta, título) de los posts ya publicados, para enlazarlos desde los nuevos."""
    root = repo_root or Path(__file__).resolve().parents[2]
    posts = []
    for md in sorted((root / "src/content/blog").glob("*.md")):
        text = md.read_text(encoding="utf-8")
        if re.search(r"^draft:\s*true", text, re.M):
            continue
        m = re.search(r"^title:\s*(.+?)\s*$", text, re.M)
        title = md.stem
        if m:
            raw = m.group(1)
            try:
                title = json.loads(raw)  # el frontmatter usa comillas JSON (\\u00e9)
            except json.JSONDecodeError:
                title = raw.strip("\"'")
        posts.append((f"/blog/{md.stem}/", title))
    return posts


def image_markup(src: str, alt: str, repo_root: Path | None = None) -> str:
    """Imagen de public/ como <img> con width/height (evita CLS); Markdown si no se puede leer."""
    import struct

    root = repo_root or Path(__file__).resolve().parents[2]
    file = root / "public" / src.lstrip("/")
    try:
        header = file.read_bytes()[:24]
        if header[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError("solo PNG")
        width, height = struct.unpack(">II", header[16:24])
    except (OSError, ValueError, struct.error):
        return f"![{alt}]({src})"
    safe_alt = alt.replace('"', "&quot;")
    return (f'<img src="{src}" alt="{safe_alt}" width="{width}" height="{height}" '
            'loading="lazy" decoding="async" />')


def filter_internal_links(links: list[str], routes: set[str] | None = None) -> list[str]:
    """Descarta rutas que el LLM invente y no existan en el sitio."""
    routes = routes or valid_routes()
    cleaned = []
    for link in links:
        norm = link if link.endswith("/") else link + "/"
        if norm.startswith("/productos/") and norm not in routes:
            norm = product_route(norm.split("/")[2], routes) or norm
        if norm in routes and norm not in cleaned:
            cleaned.append(norm)
    return cleaned


def lint_post(title: str, description: str, body: str, primary_keyword: str,
              routes: set[str] | None = None) -> list[str]:
    """Devuelve avisos SEO (lista vacía = todo bien). No bloquea la publicación."""
    routes = routes or valid_routes()
    warnings: list[str] = []
    if len(title) > 60:
        warnings.append(f"Título de {len(title)} caracteres (máx. 60): se truncará en Google.")
    if len(description) > 160:
        warnings.append(f"Descripción de {len(description)} caracteres (máx. 160).")
    if primary_keyword and primary_keyword.lower() not in title.lower():
        warnings.append("La keyword principal no aparece en el título.")
    if primary_keyword and primary_keyword.lower() not in body[:300].lower():
        warnings.append("La keyword principal no aparece en el primer párrafo.")
    words = len(re.findall(r"\w+", body))
    if words < 600:
        warnings.append(f"Contenido corto ({words} palabras); objetivo 700-900.")
    if not re.search(r"caracas|venezuela", body[:500], re.I):
        warnings.append("Falta contexto local (Caracas/Venezuela) en el primer párrafo.")
    links = _MD_LINK.findall(body)
    if not any(href.startswith("/blog/") for _, href in links):
        warnings.append("Ningún enlace a otro post del blog (añade al menos uno).")
    if len(links) < 2:
        warnings.append(f"Solo {len(links)} enlaces internos (mínimo 2).")
    for anchor, href in links:
        if href.split("#")[0] not in routes:
            warnings.append(f"Enlace interno roto o inexistente: {href}")
        if anchor.strip().lower() in _GENERIC_ANCHORS:
            warnings.append(f"Anchor genérico: '{anchor}'")
    for alt, _ in re.findall(r"!\[([^\]]*)\]\(([^)]*)\)", body):
        if not alt.strip():
            warnings.append("Imagen sin texto alternativo.")
    return warnings
