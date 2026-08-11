import pytest
from pathlib import Path
from scripts.blog_pipeline.catalog_loader import (
    load_productos,
    load_empresa_kb,
    match_by_keywords,
    extract_topic_words,
)


@pytest.fixture
def tmp_content(tmp_path):
    productos_dir = tmp_path / "productos"
    productos_dir.mkdir()
    (productos_dir / "cheesecake-clasico.md").write_text(
        '---\ntitle: "Cheesecake Clásico"\nid: "cheesecake-clasico"\n'
        'palabras_clave: ["cheesecake","postre","repostería"]\n'
        'imagen: "cheesecake-clasico"\ncategoria_primaria: "supermarket"\n'
        'categoria_secundaria: "reposteria"\n---\n\nDescripción del cheesecake.',
        encoding="utf-8",
    )
    empresa_dir = tmp_path / "empresa"
    empresa_dir.mkdir()
    (empresa_dir / "lineas-de-negocio.md").write_text(
        '---\ntitle: "Líneas de Negocio"\nkeywords: ["restaurantes","catering","foodservice"]\n---\n\nDistribuimos a restaurantes y hoteles.',
        encoding="utf-8",
    )
    return tmp_path


def test_load_productos_returns_all_files(tmp_content):
    result = load_productos(tmp_content)
    assert len(result) == 1
    assert result[0]["id"] == "cheesecake-clasico"
    assert "cheesecake" in result[0]["keywords"]


def test_load_empresa_kb_returns_sections(tmp_content):
    result = load_empresa_kb(tmp_content)
    assert len(result) == 1
    assert result[0]["file"] == "lineas-de-negocio.md"
    assert "restaurantes" in result[0]["keywords"]


def test_match_by_keywords_filters_correctly(tmp_content):
    productos = load_productos(tmp_content)
    matched = match_by_keywords(productos, {"cheesecake", "pan"})
    assert len(matched) == 1
    no_match = match_by_keywords(productos, {"bagel", "croissant"})
    assert len(no_match) == 0


def test_extract_topic_words_removes_stopwords():
    words = extract_topic_words("Cheesecake para restaurantes", "Los mejores postres de Caracas")
    assert "cheesecake" in words
    assert "restaurantes" in words
    assert "para" not in words
    assert "los" not in words
