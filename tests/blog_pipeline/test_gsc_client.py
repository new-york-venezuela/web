from unittest.mock import MagicMock, patch
from scripts.blog_pipeline.gsc_client import (
    filter_queries_for_topic,
    detect_traffic_arbitrage,
    fetch_top_queries,
)

SAMPLE_QUERIES = [
    {"query": "cheesecake factory caracas", "impressions": 340, "clicks": 12, "ctr": 0.035, "position": 4.2},
    {"query": "pan artesanal caracas", "impressions": 80, "clicks": 5, "ctr": 0.062, "position": 7.1},
    {"query": "proveedor panaderia venezuela", "impressions": 25, "clicks": 2, "ctr": 0.08, "position": 9.0},
]


def test_filter_queries_for_topic():
    result = filter_queries_for_topic(SAMPLE_QUERIES, {"cheesecake", "postre"})
    assert len(result) == 1
    assert result[0]["query"] == "cheesecake factory caracas"


def test_filter_queries_no_match():
    result = filter_queries_for_topic(SAMPLE_QUERIES, {"croissant", "bagel"})
    assert result == []


def test_detect_traffic_arbitrage_true():
    assert detect_traffic_arbitrage({"cheesecake", "restaurante"}) is True


def test_detect_traffic_arbitrage_false():
    assert detect_traffic_arbitrage({"pan", "harina", "levadura"}) is False


def test_fetch_top_queries_returns_empty_when_no_credentials(tmp_path):
    result = fetch_top_queries(
        site_url="https://example.com",
        credentials_file=str(tmp_path / "missing.json"),
    )
    assert result == []


@patch("scripts.blog_pipeline.gsc_client._build_gsc_service")
def test_fetch_top_queries_filters_by_impressions(mock_build):
    mock_service = MagicMock()
    mock_build.return_value = mock_service
    mock_service.searchanalytics().query().execute.return_value = {
        "rows": [
            {"keys": ["cheesecake caracas"], "impressions": 200, "clicks": 8, "ctr": 0.04, "position": 3.1},
            {"keys": ["pan viejo"], "impressions": 5, "clicks": 0, "ctr": 0.0, "position": 20.0},
        ]
    }
    result = fetch_top_queries("https://example.com", "fake.json", min_impressions=10)
    assert len(result) == 1
    assert result[0]["query"] == "cheesecake caracas"
