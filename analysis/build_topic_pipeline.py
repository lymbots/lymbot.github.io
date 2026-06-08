#!/usr/bin/env python3
"""Build chunked program data and an exploratory topic-cluster report.

This script reads program metadata from `docs/data/programs.json` and the
matching full texts from `docs/data/full_texts/`. It produces:

- `analysis/output/chunks.json`
- `analysis/output/chunks.csv`
- `analysis/output/topic_clusters.json`
- `analysis/output/topic_report.md`

The clustering is exploratory. It is intended to help define a stable,
editorial topic taxonomy for the site rather than act as final production
classification.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import statistics
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

os.environ.setdefault("LOKY_MAX_CPU_COUNT", "1")

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "docs" / "data" / "programs.json"
OUTPUT_DIR = ROOT / "analysis" / "output"

STOP_WORDS = {
    "af",
    "alle",
    "allerede",
    "alt",
    "anden",
    "andet",
    "andre",
    "arbejde",
    "at",
    "bag",
    "bare",
    "begge",
    "blev",
    "blive",
    "både",
    "da",
    "de",
    "dem",
    "den",
    "denne",
    "der",
    "deres",
    "det",
    "dette",
    "dig",
    "din",
    "dog",
    "du",
    "efter",
    "egen",
    "ej",
    "eller",
    "en",
    "end",
    "ene",
    "eneste",
    "enhver",
    "er",
    "et",
    "få",
    "fik",
    "fin",
    "flere",
    "for",
    "fordi",
    "forhold",
    "fra",
    "frihed",
    "frem",
    "gennem",
    "gerne",
    "gik",
    "givet",
    "godt",
    "gøre",
    "gøres",
    "gør",
    "ham",
    "han",
    "hans",
    "har",
    "have",
    "hele",
    "helhed",
    "heller",
    "hende",
    "her",
    "hos",
    "hun",
    "hvad",
    "hvem",
    "hver",
    "hvilke",
    "hvilket",
    "hvis",
    "hvor",
    "hvordan",
    "hvorfor",
    "i",
    "idet",
    "ikke",
    "ind",
    "ingen",
    "intet",
    "ja",
    "jeg",
    "jer",
    "kan",
    "komme",
    "kun",
    "kunne",
    "langt",
    "lidt",
    "lige",
    "livet",
    "man",
    "mange",
    "med",
    "meget",
    "men",
    "mens",
    "mere",
    "mig",
    "min",
    "mod",
    "må",
    "måtte",
    "ned",
    "noget",
    "nogle",
    "nu",
    "når",
    "og",
    "også",
    "om",
    "os",
    "over",
    "på",
    "ret",
    "sammen",
    "samfund",
    "samfundet",
    "samme",
    "selv",
    "sig",
    "sin",
    "sine",
    "sit",
    "skal",
    "skulle",
    "som",
    "store",
    "stor",
    "så",
    "sådan",
    "til",
    "ud",
    "under",
    "var",
    "ved",
    "vi",
    "vil",
    "ville",
    "vore",
    "vores",
    "være",
    "været",
    "år",
}


@dataclass
class Program:
    id: str
    party_id: str
    party_name: str
    year: int
    title: str
    full_text_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--clusters", type=int, default=12)
    parser.add_argument("--min-words", type=int, default=120)
    parser.add_argument("--target-words", type=int, default=220)
    parser.add_argument("--max-words", type=int, default=320)
    return parser.parse_args()


def load_programs() -> list[Program]:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    party_names = {party["id"]: party["name"] for party in payload["parties"]}
    programs = []

    for item in payload["programs"]:
        path_value = item.get("fullTextPath")
        if not path_value:
            continue
        full_text_path = ROOT / "docs" / path_value.replace("./", "")
        if not full_text_path.exists():
            continue
        programs.append(
            Program(
                id=item["id"],
                party_id=item["partyId"],
                party_name=party_names.get(item["partyId"], item["partyId"]),
                year=int(item["year"]),
                title=item["title"],
                full_text_path=full_text_path,
            )
        )

    return sorted(programs, key=lambda item: (item.year, item.party_name, item.title))


def normalize_text(raw_text: str) -> str:
    text = raw_text.replace("\ufeff", "\n")
    text = text.replace("\f", "\n\n")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def paragraph_like_blocks(text: str) -> list[str]:
    raw_blocks = re.split(r"\n\s*\n", text)
    blocks = []

    for block in raw_blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        combined = " ".join(lines)
        combined = re.sub(r"\s+", " ", combined).strip()
        combined = re.sub(
            r"(?<=[.!?])\s+([A-ZÆØÅ][A-Za-zÆØÅæøå0-9 /,&-]{2,50}:)",
            r"\n\n\1",
            combined,
        )
        for piece in re.split(r"\n\s*\n", combined):
            piece = piece.strip()
            if piece and not is_noise_block(piece):
                blocks.append(piece)

    return blocks


def is_noise_block(block: str) -> bool:
    cleaned = block.strip()
    if re.fullmatch(r"--- Side \d+ ---", cleaned):
        return True
    if re.fullmatch(r"\d{1,3}", cleaned):
        return True
    noise_patterns = [
        r"Digitaliseret af",
        r"Digitised by",
        r"DET KONGELIGE BIBLIOTEK",
        r"THE ROYAL LIBRARY",
        r"Copyright: Billedet",
        r"Ressourcetype:",
        r"Opstilling:",
        r"Relateret:",
    ]
    return any(re.search(pattern, cleaned, re.IGNORECASE) for pattern in noise_patterns)


def split_long_block(block: str, target_words: int, max_words: int) -> list[str]:
    if word_count(block) <= max_words:
        return [block]

    sentences = re.split(r"(?<=[.!?])\s+(?=[A-ZÆØÅ0-9\"“])", block)
    sentences = [sentence.strip() for sentence in sentences if sentence.strip()]

    if len(sentences) <= 1:
        words = block.split()
        pieces = []
        start = 0
        while start < len(words):
            stop = min(start + target_words, len(words))
            pieces.append(" ".join(words[start:stop]))
            start = stop
        return pieces

    pieces = []
    current: list[str] = []
    current_words = 0

    for sentence in sentences:
        sentence_words = word_count(sentence)
        if current and current_words + sentence_words > max_words:
            pieces.append(" ".join(current))
            current = []
            current_words = 0
        current.append(sentence)
        current_words += sentence_words
        if current_words >= target_words:
            pieces.append(" ".join(current))
            current = []
            current_words = 0

    if current:
        pieces.append(" ".join(current))

    return pieces


def looks_like_heading(block: str) -> bool:
    if len(block.split()) > 12:
        return False
    if re.fullmatch(r"[A-ZÆØÅ0-9 .,:;()'\"/-]+", block):
        return True
    if len(block) <= 40 and block[:1].isupper() and block == block.title():
        return True
    return False


def starts_with_inline_heading(block: str) -> bool:
    match = re.match(r"^([A-ZÆØÅ][A-Za-zÆØÅæøå0-9 /,&-]{2,50}):", block)
    return bool(match and len(match.group(1).split()) <= 8)


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\wÆØÅæøå]+\b", text))


def rebalance_short_chunks(chunks: list[dict], min_words: int, max_words: int) -> list[dict]:
    if not chunks:
        return []

    balanced = []
    index = 0
    while index < len(chunks):
        current = dict(chunks[index])
        if current["word_count"] >= min_words:
            balanced.append(current)
            index += 1
            continue

        if index + 1 < len(chunks):
            next_chunk = dict(chunks[index + 1])
            combined_text = f"{current['text']} {next_chunk['text']}".strip()
            combined_words = word_count(combined_text)
            if combined_words <= max_words:
                next_chunk["text"] = combined_text
                next_chunk["word_count"] = combined_words
                chunks[index + 1] = next_chunk
                index += 1
                continue

        if balanced:
            combined_text = f"{balanced[-1]['text']} {current['text']}".strip()
            combined_words = word_count(combined_text)
            if combined_words <= max_words:
                balanced[-1]["text"] = combined_text
                balanced[-1]["word_count"] = combined_words
                index += 1
                continue

        if current["word_count"] >= max(35, min_words // 2):
            balanced.append(current)
        index += 1

    return balanced


def renumber_chunks(chunks: list[dict], source_id: str) -> list[dict]:
    for index, chunk in enumerate(chunks):
        chunk["chunk_index"] = index
        chunk["chunk_id"] = f"{source_id}_chunk_{index:03d}"
        chunk["word_count"] = word_count(chunk["text"])
    return chunks


def chunk_program(program: Program, min_words: int, target_words: int, max_words: int) -> list[dict]:
    text = normalize_text(program.full_text_path.read_text(encoding="utf-8", errors="ignore"))
    blocks = paragraph_like_blocks(text)

    chunks = []
    pending_heading = ""
    current_parts: list[str] = []
    current_words = 0
    chunk_index = 0

    def flush() -> None:
        nonlocal current_parts, current_words, chunk_index, pending_heading
        if not current_parts:
            return
        chunk_text = " ".join(current_parts).strip()
        if pending_heading and pending_heading not in chunk_text:
            chunk_text = f"{pending_heading}. {chunk_text}"
        chunks.append(
            {
                "chunk_id": f"{program.id}_chunk_{chunk_index:03d}",
                "program_id": program.id,
                "party_id": program.party_id,
                "party_name": program.party_name,
                "year": program.year,
                "title": program.title,
                "source_path": str(program.full_text_path.relative_to(ROOT)),
                "chunk_index": chunk_index,
                "word_count": word_count(chunk_text),
                "text": chunk_text,
            }
        )
        chunk_index += 1
        current_parts = []
        current_words = 0
        pending_heading = ""

    for block in blocks:
        if current_parts and starts_with_inline_heading(block):
            flush()
        if looks_like_heading(block):
            if current_parts and current_words >= min_words:
                flush()
            pending_heading = block
            continue

        for piece in split_long_block(block, target_words=target_words, max_words=max_words):
            piece_words = word_count(piece)
            if piece_words < 12:
                continue

            if pending_heading and not current_parts:
                current_parts.append(pending_heading)
                current_words += word_count(pending_heading)
                pending_heading = ""

            projected_words = current_words + piece_words
            if current_parts and projected_words > max_words:
                flush()

            current_parts.append(piece)
            current_words += piece_words

            if current_words >= target_words:
                flush()

    flush()
    return renumber_chunks(rebalance_short_chunks(chunks, min_words=min_words, max_words=max_words), program.id)


def cluster_chunks(chunks: list[dict], cluster_count: int) -> tuple[list[dict], dict]:
    documents = [chunk["text"] for chunk in chunks]
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words=sorted(STOP_WORDS),
        max_df=0.6,
        min_df=2,
        ngram_range=(1, 2),
        token_pattern=r"(?u)\b[a-zA-ZÆØÅæøå][a-zA-ZÆØÅæøå\-]{2,}\b",
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(documents)

    if matrix.shape[0] < cluster_count:
        cluster_count = max(2, matrix.shape[0] // 2)

    model = KMeans(n_clusters=cluster_count, n_init=20, random_state=42)
    labels = model.fit_predict(matrix)

    try:
        silhouette = float(silhouette_score(matrix, labels))
    except Exception:
        silhouette = float("nan")

    feature_names = np.array(vectorizer.get_feature_names_out())
    distances = model.transform(matrix)

    cluster_summary = {}
    for cluster_id in range(cluster_count):
        cluster_indices = np.where(labels == cluster_id)[0]
        cluster_matrix = matrix[cluster_indices]
        centroid = np.asarray(cluster_matrix.mean(axis=0)).ravel()
        top_term_indices = centroid.argsort()[-12:][::-1]
        top_terms = feature_names[top_term_indices].tolist()

        ranked_local = sorted(
            cluster_indices,
            key=lambda idx: distances[idx, cluster_id],
        )[:5]
        representatives = []
        for idx in ranked_local:
            chunk = chunks[idx]
            representatives.append(
                {
                    "chunk_id": chunk["chunk_id"],
                    "party_name": chunk["party_name"],
                    "year": chunk["year"],
                    "title": chunk["title"],
                    "word_count": chunk["word_count"],
                    "preview": chunk["text"][:420].strip(),
                }
            )

        party_distribution = Counter(chunks[idx]["party_name"] for idx in cluster_indices)
        year_values = [chunks[idx]["year"] for idx in cluster_indices]
        cluster_summary[str(cluster_id)] = {
            "cluster_id": cluster_id,
            "size": int(len(cluster_indices)),
            "top_terms": top_terms,
            "party_distribution": dict(party_distribution.most_common()),
            "year_range": [min(year_values), max(year_values)],
            "median_year": int(statistics.median(year_values)),
            "representative_chunks": representatives,
        }

    for idx, chunk in enumerate(chunks):
        chunk["cluster_id"] = int(labels[idx])

    meta = {
        "cluster_count": cluster_count,
        "chunk_count": len(chunks),
        "feature_count": int(matrix.shape[1]),
        "silhouette_score": silhouette,
    }
    return chunks, {"meta": meta, "clusters": cluster_summary}


def write_chunks_json(chunks: list[dict], output_path: Path) -> None:
    output_path.write_text(
        json.dumps(chunks, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def write_chunks_csv(chunks: list[dict], output_path: Path) -> None:
    fieldnames = [
        "chunk_id",
        "program_id",
        "party_id",
        "party_name",
        "year",
        "title",
        "chunk_index",
        "word_count",
        "cluster_id",
        "source_path",
        "text",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for chunk in chunks:
            writer.writerow({key: chunk.get(key, "") for key in fieldnames})


def write_cluster_json(cluster_payload: dict, output_path: Path) -> None:
    output_path.write_text(
        json.dumps(cluster_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def first_sentence(text: str) -> str:
    match = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)
    return match[0][:240].strip()


def suggest_label(terms: Iterable[str]) -> str:
    filtered = []
    for term in terms:
        cleaned = term.replace(" ", "_")
        if "_" in cleaned:
            filtered.append(cleaned)
        elif len(cleaned) >= 5:
            filtered.append(cleaned)
        if len(filtered) == 3:
            break
    return " / ".join(filtered) if filtered else "ukendt"


def write_report(programs: list[Program], chunks: list[dict], cluster_payload: dict, output_path: Path) -> None:
    cluster_items = sorted(
        cluster_payload["clusters"].values(),
        key=lambda item: (-item["size"], item["cluster_id"]),
    )
    programs_by_party = Counter(program.party_name for program in programs)
    chunks_by_party = Counter(chunk["party_name"] for chunk in chunks)

    lines = [
        "# Emneanalyse for principprogrammer",
        "",
        "Denne rapport er et eksplorativt første output. Klyngerne er ikke endelige emner,",
        "men arbejdshypoteser til at opbygge en stabil redaktionel emnetaksonomi.",
        "",
        "## Datagrundlag",
        "",
        f"- Programmer: {len(programs)}",
        f"- Chunks: {len(chunks)}",
        f"- Klynger: {cluster_payload['meta']['cluster_count']}",
        f"- Silhouette score: {cluster_payload['meta']['silhouette_score']:.3f}",
        "",
        "### Programmer pr. parti",
        "",
    ]

    for party_name, count in programs_by_party.most_common():
        lines.append(f"- {party_name}: {count}")

    lines.extend(["", "### Chunks pr. parti", ""])
    for party_name, count in chunks_by_party.most_common():
        lines.append(f"- {party_name}: {count}")

    lines.extend(
        [
            "",
            "## Forslag til brug",
            "",
            "1. Læs klyngerne som rå mønstre, ikke som endelige emner.",
            "2. Brug klyngerne som teknisk kontrol op mod den stabile realpolitiske 16-emne-taksonomi.",
            "3. Brug chunk-filen til manuel eller halvautomatisk tagging i næste trin.",
            "",
            "## Klynger",
            "",
        ]
    )

    for cluster in cluster_items:
        label = suggest_label(cluster["top_terms"])
        lines.append(f"### Klynge {cluster['cluster_id']}: {label}")
        lines.append("")
        lines.append(f"- Størrelse: {cluster['size']} chunks")
        lines.append(
            f"- År: {cluster['year_range'][0]}-{cluster['year_range'][1]} (median {cluster['median_year']})"
        )
        lines.append(f"- Topord: {', '.join(cluster['top_terms'][:10])}")

        party_bits = [f"{name} ({count})" for name, count in cluster["party_distribution"].items()]
        lines.append(f"- Partier: {', '.join(party_bits[:8])}")
        lines.append("")
        lines.append("Eksempeluddrag:")
        lines.append("")

        for sample in cluster["representative_chunks"][:3]:
            lines.append(
                f"- `{sample['chunk_id']}` · {sample['party_name']} {sample['year']} · "
                f"{sample['title']} · {first_sentence(sample['preview'])}"
            )
        lines.append("")

    output_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    programs = load_programs()
    chunks = []
    for program in programs:
        chunks.extend(
            chunk_program(
                program,
                min_words=args.min_words,
                target_words=args.target_words,
                max_words=args.max_words,
            )
        )

    chunks, cluster_payload = cluster_chunks(chunks, cluster_count=args.clusters)

    write_chunks_json(chunks, OUTPUT_DIR / "chunks.json")
    write_chunks_csv(chunks, OUTPUT_DIR / "chunks.csv")
    write_cluster_json(cluster_payload, OUTPUT_DIR / "topic_clusters.json")
    write_report(programs, chunks, cluster_payload, OUTPUT_DIR / "topic_report.md")

    print(
        json.dumps(
            {
                "program_count": len(programs),
                "chunk_count": len(chunks),
                "cluster_count": cluster_payload["meta"]["cluster_count"],
                "silhouette_score": cluster_payload["meta"]["silhouette_score"],
                "output_dir": str(OUTPUT_DIR.relative_to(ROOT)),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
