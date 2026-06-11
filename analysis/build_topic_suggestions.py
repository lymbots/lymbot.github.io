#!/usr/bin/env python3
"""Build topic suggestions for party-program chunks using the editorial taxonomy."""

from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "analysis" / "output"
CHUNKS_PATH = OUTPUT_DIR / "chunks.json"
TAXONOMY_PATH = ROOT / "analysis" / "topic_taxonomy.json"

PHRASE_BONUS = 0.1
MULTI_HIT_BONUS = 0.22
MIN_PRIMARY_SCORE = 0.26

# Broad value words are useful but too dominant unless dampened.
BROAD_KEYWORDS = {
    "frihed",
    "lighed",
    "fællesskab",
    "solidaritet",
    "værdier",
    "principper",
    "marked",
    "offentlige",
    "danske",
    "arbejde",
    "samfund",
    "sociale",
    "service",
    "kvalitet",
    "trivsel",
    "tryghed",
    "værdighed",
    "sikkerhed",
    "rettigheder",
    "international",
    "fred",
    "bistand",
    "produktion",
    "investeringer",
    "grøn",
}


def normalize_text(value: str) -> str:
    return " ".join(value.lower().split())


def keyword_pattern(keyword: str) -> re.Pattern:
    escaped = re.escape(normalize_text(keyword)).replace(r"\ ", r"\s+")
    return re.compile(rf"(?<![\wÆØÅæøå-]){escaped}(?![\wÆØÅæøå-])", re.IGNORECASE)


def score_keyword(keyword: str, hits: int) -> float:
    normalized = normalize_text(keyword)
    if normalized in BROAD_KEYWORDS:
        base = 0.06
    elif " " in normalized:
        base = 0.26 + PHRASE_BONUS
    else:
        base = 0.16
    return base * min(hits, 3)


def build_scores(chunk: dict, topics: dict) -> tuple[list[tuple[str, float]], list[str]]:
    text = normalize_text(chunk["text"])
    scores = defaultdict(float)
    reasons = defaultdict(list)
    hit_counts = defaultdict(int)

    for topic_id, topic in topics.items():
        for keyword in topic.get("keywords", []):
            matches = keyword_pattern(keyword).findall(text)
            if not matches:
                continue
            hit_count = len(matches)
            scores[topic_id] += score_keyword(keyword, hit_count)
            hit_counts[topic_id] += 1
            reasons[topic_id].append(f"keyword:{keyword}")

    for topic_id, hit_count in hit_counts.items():
        if hit_count >= 2:
            scores[topic_id] += MULTI_HIT_BONUS
            reasons[topic_id].append(f"multi_keyword:{hit_count}")
        if hit_count >= 4:
            scores[topic_id] += 0.18
            reasons[topic_id].append("dense_topic_signal")

    ranked = sorted(
        ((topic_id, score) for topic_id, score in scores.items() if score >= MIN_PRIMARY_SCORE),
        key=lambda item: (-item[1], item[0]),
    )
    top_reasons = []
    for topic_id, _score in ranked[:2]:
        top_reasons.extend(reasons.get(topic_id, [])[:4])
    return ranked, top_reasons


def main() -> None:
    chunks = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))
    taxonomy = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))

    topics = {item["id"]: item for item in taxonomy["topics"]}
    suggestion_rows = []
    topic_totals = Counter()
    skipped = 0

    for chunk in chunks:
        ranked, reasons = build_scores(chunk, topics)
        if not ranked:
            skipped += 1
            continue
        primary_id, primary_score = ranked[0]
        secondary_id, secondary_score = ranked[1] if len(ranked) > 1 else ("", 0.0)
        topic_totals[primary_id] += 1

        suggestion_rows.append(
            {
                "chunk_id": chunk["chunk_id"],
                "program_id": chunk["program_id"],
                "source_type": "party_program",
                "party_name": chunk["party_name"],
                "year": chunk["year"],
                "title": chunk["title"],
                "cluster_id": chunk.get("cluster_id", ""),
                "primary_topic_id": primary_id,
                "primary_topic_label": topics[primary_id]["label"],
                "primary_confidence": f"{primary_score:.2f}",
                "secondary_topic_id": secondary_id,
                "secondary_topic_label": topics.get(secondary_id, {}).get("label", secondary_id),
                "secondary_confidence": f"{secondary_score:.2f}" if secondary_id else "",
                "review_status": "needs_review",
                "reasons": ", ".join(reasons[:6]),
                "text": chunk["text"],
            }
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUTPUT_DIR / "topic_suggestions.json"
    csv_path = OUTPUT_DIR / "topic_suggestions.csv"
    md_path = OUTPUT_DIR / "topic_suggestions_summary.md"

    json_path.write_text(json.dumps(suggestion_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    fieldnames = list(suggestion_rows[0].keys())
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(suggestion_rows)

    lines = [
        "# Emneforslag for partiprogrammer",
        "",
        "Forslagene bygger på den realpolitiske 18-emne-taksonomi og bruges som primære emner på sitet.",
        "",
        f"- Tekststykker med emneforslag: {len(suggestion_rows)}",
        f"- Tekststykker uden tydeligt emnesignal: {skipped}",
        "",
        "## Emnefordeling",
        "",
    ]
    for topic in taxonomy["topics"]:
        lines.append(f"- {topic['label']}: {topic_totals.get(topic['id'], 0)}")

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "chunk_count": len(chunks),
                "suggestions": len(suggestion_rows),
                "skipped": skipped,
                "topics": len(taxonomy["topics"]),
                "output_files": [
                    str(json_path.relative_to(ROOT)),
                    str(csv_path.relative_to(ROOT)),
                    str(md_path.relative_to(ROOT)),
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
