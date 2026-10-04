from scripts.blog_pipeline import seo_guidelines as sg

ROUTES = {"/catalogo/", "/empresa/", "/donde-encontrarnos/", "/blog/otro/"}


def test_filter_internal_links_drops_invented_routes():
    out = sg.filter_internal_links(["/catalogo", "/inventada/", "/empresa/", "/catalogo/"], ROUTES)
    assert out == ["/catalogo/", "/empresa/"]


def test_valid_routes_includes_real_site_pages():
    routes = sg.valid_routes()
    assert "/donde-encontrarnos/" in routes
    assert "/productos/croissants/" in routes


def test_lint_flags_long_title_and_missing_links():
    warnings = sg.lint_post("T" * 70, "d", "texto corto", "croissants", ROUTES)
    joined = " ".join(warnings)
    assert "Título" in joined and "enlaces internos" in joined and "Contenido corto" in joined


def test_lint_clean_post_has_no_warnings():
    body = ("Croissants en Caracas " + "palabra " * 700 +
            "[catálogo](/catalogo/) y [otro post](/blog/otro/)")
    assert sg.lint_post("Croissants Caracas | Alimentos New York", "desc", body,
                        "croissants", ROUTES) == []


def test_existing_posts_decodes_titles_and_lists_blog_routes():
    posts = dict(sg.existing_posts())
    assert any(url.startswith("/blog/") for url in posts)
    assert all("\\u" not in title for title in posts.values())


def test_lint_requires_a_blog_link():
    body = "Caracas " + "palabra " * 700 + "[a](/catalogo/) [b](/empresa/)"
    assert any("otro post" in w for w in sg.lint_post("t", "d", body, "", ROUTES))


def test_every_internal_link_in_published_posts_resolves():
    """Evita enlaces rotos entre posts/productos (p. ej. fichas que no existen)."""
    import re
    from pathlib import Path

    routes = sg.valid_routes()
    root = Path(__file__).resolve().parents[2] / "src/content/blog"
    broken = []
    for md in root.glob("*.md"):
        for href in re.findall(r"(?<!!)\[[^\]]+\]\((/[^)\s]*)\)", md.read_text(encoding="utf-8")):
            if href.split("#")[0] not in routes:
                broken.append((md.name, href))
    assert broken == []


def test_image_markup_adds_dimensions_for_public_png():
    out = sg.image_markup("/blog/torta-queso-new-york-comercial-chocolate.png", 'Torta "choco"')
    assert out.startswith("<img ") and 'width="350"' in out and 'height="243"' in out
    assert "&quot;" in out


def test_image_markup_falls_back_to_markdown_when_unreadable():
    assert sg.image_markup("/blog/no-existe.png", "x") == "![x](/blog/no-existe.png)"


def test_every_product_in_the_knowledge_base_maps_to_a_real_page():
    """Los .md de productos (KB del pipeline) deben resolver a una ficha publicada."""
    from pathlib import Path

    routes = sg.valid_routes()
    kb = Path(__file__).resolve().parents[2] / "src/content/productos"
    unmapped = [md.stem for md in kb.glob("*.md") if sg.product_route(md.stem, routes) is None]
    assert unmapped == []


def test_filter_rewrites_variant_links_to_the_published_page():
    routes = {"/productos/baguettes-precocida/"}
    assert sg.filter_internal_links(["/productos/baguettes-precocida-foodservice/"], routes) == [
        "/productos/baguettes-precocida/"
    ]


def test_brand_brief_uses_stable_founding_year_not_age_count():
    assert "1980" in sg.BRAND_BRIEF
    assert "44 años" not in sg.BRAND_BRIEF
    assert "44 años" not in sg.SEO_RULES
