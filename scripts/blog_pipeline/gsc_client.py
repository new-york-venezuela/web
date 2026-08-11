from datetime import datetime, timedelta
from pathlib import Path

TRAFFIC_ARBITRAGE_TERMS = {
    "cheesecake", "pastelería", "postres", "torta", "repostería", "postre",
    "cheese cake", "cheesecake factory",
}


def _build_gsc_service(credentials_file: str):
    from googleapiclient.discovery import build
    from google.oauth2 import service_account

    creds = service_account.Credentials.from_service_account_file(
        credentials_file,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def fetch_top_queries(
    site_url: str,
    credentials_file: str,
    days: int = 90,
    min_impressions: int = 10,
    limit: int = 50,
) -> list[dict]:
    if not Path(credentials_file).exists():
        return []
    try:
        service = _build_gsc_service(credentials_file)
    except Exception:
        return []

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)

    response = service.searchanalytics().query(
        siteUrl=site_url,
        body={
            "startDate": str(start_date),
            "endDate": str(end_date),
            "dimensions": ["query"],
            "rowLimit": limit * 2,
        },
    ).execute()

    rows = response.get("rows", [])
    result = [
        {
            "query": row["keys"][0],
            "impressions": int(row.get("impressions", 0)),
            "clicks": int(row.get("clicks", 0)),
            "ctr": float(row.get("ctr", 0.0)),
            "position": float(row.get("position", 0.0)),
        }
        for row in rows
        if row.get("impressions", 0) >= min_impressions
    ]
    return sorted(result, key=lambda r: r["impressions"], reverse=True)[:limit]


def filter_queries_for_topic(queries: list[dict], topic_words: set[str]) -> list[dict]:
    return [
        q for q in queries
        if set(q["query"].lower().split()) & topic_words
    ]


def detect_traffic_arbitrage(topic_words: set[str]) -> bool:
    return bool(topic_words & {t.lower() for t in TRAFFIC_ARBITRAGE_TERMS})
