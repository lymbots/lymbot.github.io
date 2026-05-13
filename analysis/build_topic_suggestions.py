#!/usr/bin/env python3
"""Build first-pass topic suggestions for each chunk."""

from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "analysis" / "output"
CHUNKS_PATH = OUTPUT_DIR / "chunks.json"
CLUSTERS_PATH = OUTPUT_DIR / "topic_clusters.json"
TAXONOMY_PATH = ROOT / "analysis" / "topic_taxonomy.json"


def normalize_text(value: str) -> str:
    return " ".join(value.lower().split())


def build_scores(chunk: dict, topics: dict, cluster_topic_map: dict) -> tuple[list[tuple[str, float]], list[str]]:
    text = normalize_text(chunk["text"])
    scores = defaultdict(float)
    reasons = defaultdict(list)
    keyword_hits = defaultdict(int)

    cluster_topic = cluster_topic_map.get(str(chunk["cluster_id"]))
    if cluster_topic:
        scores[cluster_topic] += 0.55
        reasons[cluster_topic].append(f"cluster:{chunk['cluster_id']}")

    for topic_id, topic in topics.items():
        for keyword in topic["keywords"]:
            if normalize_text(keyword) in text:
                scores[topic_id] += 0.14
                keyword_hits[topic_id] += 1
                reasons[topic_id].append(f"keyword:{keyword}")

    for topic_id, hit_count in keyword_hits.items():
        if hit_count >= 2:
            scores[topic_id] += 0.28
            reasons[topic_id].append(f"multi_keyword:{hit_count}")
        if topic_id == "forsvar_sikkerhed" and hit_count >= 1:
            scores[topic_id] += 0.35
            reasons[topic_id].append("security_boost")
            if cluster_topic == "internationalt_europa":
                scores[topic_id] += 0.30
                reasons[topic_id].append("security_override")
        if topic_id == "nation_udlaendinge" and hit_count >= 2:
            scores[topic_id] += 0.12
            reasons[topic_id].append("identity_boost")

    if not scores and cluster_topic:
        scores[cluster_topic] = 0.5

    ranked = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    top_reasons = []
    for topic_id, _score in ranked[:2]:
        top_reasons.extend(reasons.get(topic_id, []))
    return ranked, top_reasons


def main() -> None:
    chunks = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))
    _clusters = json.loads(CLUSTERS_PATH.read_text(encoding="utf-8"))
    taxonomy = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))

    topics = {item["id"]: item for item in taxonomy["topics"]}
    cluster_topic_map = taxonomy["cluster_topic_map"]

    suggestion_rows = []
    topic_totals = Counter()

    for chunk in chunks:
        ranked, reasons = build_scores(chunk, topics, cluster_topic_map)
        primary_id, primary_score = ranked[0] if ranked else ("ukendt", 0.0)
        secondary_id, secondary_score = ranked[1] if len(ranked) > 1 else ("", 0.0)

        if primary_id in topics:
            topic_totals[primary_id] += 1

        suggestion_rows.append(
            {
                "chunk_id": chunk["chunk_id"],
                "program_id": chunk["program_id"],
                "party_name": chunk["party_name"],
                "year": chunk["year"],
                "title": chunk["title"],
                "cluster_id": chunk["cluster_id"],
                "primary_topic_id": primary_id,
                "primary_topic_label": topics.get(primary_id, {}).get("label", primary_id),
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

    json_path.write_text(json.dumps(suggestion_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    fieldnames = list(suggestion_rows[0].keys())
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(suggestion_rows)

    lines = [
        "# Første emneforslag pr. chunk",
        "",
        "Denne fil bygger oven på klyngeanalysen og giver et første emneforslag til hvert chunk.",
        "Forslagene er arbejdsforslag og skal gennemgås redaktionelt.",
        "",
        "## Emnefordeling",
        "",
    ]
    for topic in taxonomy["topics"]:
        lines.append(f"- {topic['label']}: {topic_totals.get(topic['id'], 0)}")

    lines.extend(
        [
            "",
            "## Arbejdsgang",
            "",
            "1. Start i `analysis/output/topic_suggestions.csv`.",
            "2. Sortér på `primary_topic_label` eller `program_id`.",
            "3. Ret `primary_topic_id` og `secondary_topic_id`, hvor forslaget er forkert.",
            "4. Skift `review_status` til `approved`, når et chunk er gennemgået.",
        ]
    )
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "chunk_count": len(suggestion_rows),
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
