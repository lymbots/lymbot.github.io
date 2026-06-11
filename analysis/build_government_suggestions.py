#!/usr/bin/env python3
"""Build topic suggestions and party-similarity indicators for government foundations."""

from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).resolve().parents[1]
GOVERNMENTS_PATH = ROOT / "docs" / "data" / "governments.json"
PROGRAMS_PATH = ROOT / "docs" / "data" / "programs.json"
TAXONOMY_PATH = ROOT / "analysis" / "topic_taxonomy.json"
OUTPUT_DIR = ROOT / "analysis" / "output"
PARTY_SUGGESTIONS_PATH = OUTPUT_DIR / "topic_suggestions.json"
PARTY_CHUNKS_PATH = OUTPUT_DIR / "chunks.json"
DOCS_ANALYSIS_DIR = ROOT / "docs" / "data" / "analysis"

MIN_WORDS = 45
TARGET_WORDS = 180
MAX_WORDS = 340
MIN_PRIMARY_SCORE = 0.26
SECONDARY_TOPIC_WEIGHT = 0.65

STOP_WORDS = {
    "af", "alle", "at", "da", "de", "dem", "den", "der", "det", "en", "er", "et",
    "for", "fra", "har", "i", "ikke", "kan", "med", "men", "og", "om", "på", "som",
    "til", "ud", "var", "ved", "vi", "vil", "være", "år", "regeringen", "danmark",
    "danske", "skal", "mere", "nye", "sammen", "sikre", "styrke", "bedre",
}

EXTRA_TOPIC_KEYWORDS = {
    "oekonomi_skat_finans": ["finanspolitik", "økonomisk", "skattelettelser", "skattestop", "produktivitet", "råderum", "offentlige finanser", "moms"],
    "erhverv_arbejdsmarked_beskaeftigelse": ["konkurrenceevne", "erhvervsliv", "virksomhed", "virksomheder", "iværksætteri", "rammevilkår", "beskæftigelse", "arbejdsudbud", "arbejdspladser", "arbejdskraft", "løn", "overenskomster", "dagpenge"],
    "offentlig_sektor_velfaerd_forvaltning": ["offentlig sektor", "kommuner", "regioner", "bureaukrati", "decentralisering", "forvaltning", "service", "velfærdssamfund"],
    "sundhed_psykiatri": ["sundhedsvæsen", "sygehusvæsen", "patienter", "psykiatrien", "behandling", "ventelister", "praktiserende læger", "folkesundhed"],
    "aeldre_pension_omsorg": ["ældrepleje", "hjemmehjælp", "plejehjem", "værdig ældrepleje", "demens", "folkepension", "pensionister", "arnepension"],
    "boern_familie_socialpolitik": ["daginstitutioner", "børnefamilier", "børn", "unge", "familier", "forældre", "trivsel", "social", "udsatte", "fattigdom", "handicap", "hjemløse", "social arv"],
    "uddannelse_forskning_unge": ["folkeskole", "universiteter", "erhvervsuddannelser", "lærepladser", "forskning", "uddannelse", "gymnasier", "studerende", "historieundervisning"],
    "klima_miljoe_energi": ["grøn", "co2", "havmiljø", "drikkevand", "vind", "elektrificering", "biodiversitet", "energipolitik", "forsyning"],
    "landbrug_foedevarer_dyrevelfaerd": ["landbrug", "fødevarer", "dyrevelfærd", "kvælstof", "vandmiljø", "fiskeri", "økologi", "pesticider", "husdyr"],
    "udlaendinge_integration_statsborgerskab": ["udlændingepolitik", "indvandring", "integration", "asyl", "ophold", "statsborgerskab", "flygtninge", "familiesammenføring", "parallelsamfund"],
    "retspolitik_politi_kriminalitet": ["politi", "kriminalitet", "straf", "domstole", "retssikkerhed", "fængsler", "bander", "terror"],
    "forsvar_sikkerhed_beredskab": ["sikkerhedspolitik", "forsvaret", "cyber", "beredskab", "nato", "trusler", "militær", "totalforsvar"],
    "eu_udenrig_globalt": ["europa", "eu", "ukraine", "norden", "rigsfællesskab", "udenrigspolitik", "udviklingsbistand", "fn"],
    "demokrati_retsstat_forfatning": ["grundlov", "folketing", "folkestyre", "magtens tredeling", "forfatning", "borgerrettigheder", "folkeafstemning"],
    "bolig_transport_by_land": ["almene boliger", "lejeboliger", "landdistrikter", "yderområder", "byudvikling", "boligpolitik", "kollektiv trafik", "jernbane", "tog", "veje", "infrastruktur", "pendlere", "landkommuner"],
    "kultur_religion_medier_vaerdier": ["kulturarv", "medier", "idræt", "foreninger", "folkekirke", "religion", "etik", "værdier", "ytringsfrihed", "danske værdier"],
    "ligestilling_minoriteter_rettigheder": ["ligestilling", "kvinder", "minoritet", "minoriteter", "rettigheder", "diskrimination", "handicapkonvention", "ligeværd"],
    "ideologi_parti_samfundssyn": ["liberalisme", "socialisme", "konservatisme", "national", "solidaritet", "frihed", "fællesskab", "partiet", "bevægelse", "medlemmer", "værdigrundlag"],
}


def normalize_text(raw_text: str) -> str:
    text = raw_text.replace("\ufeff", "\n").replace("\f", "\n\n")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"(?<=\S)\n(?=\d{1,2}\.\s+[A-ZÆØÅ])", "\n\n", text)
    text = re.sub(r"(?<=\S)\n(?=[A-ZÆØÅ][A-Za-zÆØÅæøå ,/&-]{2,64}\n)", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\wÆØÅæøå]+\b", text))


def paragraph_like_blocks(text: str) -> list[str]:
    blocks = []
    for block in re.split(r"\n\s*\n", text):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        combined = re.sub(r"\s+", " ", " ".join(lines)).strip()
        combined = re.sub(
            r"\s+(?=(?:\d{1,2}|[A-ZÆØÅ])\.\s+[A-ZÆØÅ])",
            r"\n\n",
            combined,
        )
        combined = re.sub(
            r"\s+(?=[A-ZÆØÅ][A-Za-zÆØÅæøå ,/&-]{2,64}:)",
            r"\n\n",
            combined,
        )
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
    if cleaned.count(".") > 20 and len(cleaned) < 900:
        return True
    if re.search(r"ISBN\s+\d", cleaned, re.IGNORECASE):
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
        r"Henvendelse om udgivelsen",
        r"Publikationen kan hentes",
        r"Elektronisk publikation",
    ]
    return any(re.search(pattern, cleaned, re.IGNORECASE) for pattern in noise_patterns)


def looks_like_heading(block: str) -> bool:
    if re.fullmatch(r"\d{1,2}\.\s+\S.{2,120}", block):
        return True
    if re.fullmatch(r"[A-ZÆØÅ]\.\s+\S.{2,120}", block):
        return True
    if len(block.split()) > 12:
        return False
    if re.fullmatch(r"[A-ZÆØÅ0-9 .,:;()'\"/-]+", block):
        return True
    return len(block) <= 42 and block[:1].isupper() and block == block.title()


def starts_with_inline_heading(block: str) -> bool:
    if re.match(r"^\d{1,2}\.\s+[A-ZÆØÅ]", block):
        return True
    if re.match(r"^[A-ZÆØÅ]\.\s+[A-ZÆØÅ]", block):
        return True
    match = re.match(r"^([A-ZÆØÅ][A-Za-zÆØÅæøå0-9 /,&-]{2,50}):", block)
    return bool(match and len(match.group(1).split()) <= 8)


def split_long_block(block: str) -> list[str]:
    if word_count(block) <= MAX_WORDS:
        return [block]
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-ZÆØÅ0-9\"“])", block) if s.strip()]
    if len(sentences) <= 1:
        words = block.split()
        return [" ".join(words[i : i + TARGET_WORDS]) for i in range(0, len(words), TARGET_WORDS)]
    pieces, current, current_words = [], [], 0
    for sentence in sentences:
        sentence_words = word_count(sentence)
        if current and current_words + sentence_words > MAX_WORDS:
            pieces.append(" ".join(current))
            current, current_words = [], 0
        current.append(sentence)
        current_words += sentence_words
        if current_words >= TARGET_WORDS:
            pieces.append(" ".join(current))
            current, current_words = [], 0
    if current:
        pieces.append(" ".join(current))
    return pieces


def rebalance_short_chunks(chunks: list[dict]) -> list[dict]:
    if not chunks:
        return []

    balanced = []
    index = 0
    while index < len(chunks):
        current = dict(chunks[index])
        if current["word_count"] >= MIN_WORDS:
            balanced.append(current)
            index += 1
            continue

        if index + 1 < len(chunks):
            next_chunk = dict(chunks[index + 1])
            combined_text = f"{current['text']} {next_chunk['text']}".strip()
            combined_words = word_count(combined_text)
            if combined_words <= MAX_WORDS:
                next_chunk["text"] = combined_text
                next_chunk["word_count"] = combined_words
                chunks[index + 1] = next_chunk
                index += 1
                continue

        if balanced:
            combined_text = f"{balanced[-1]['text']} {current['text']}".strip()
            combined_words = word_count(combined_text)
            if combined_words <= MAX_WORDS:
                balanced[-1]["text"] = combined_text
                balanced[-1]["word_count"] = combined_words
                index += 1
                continue

        if current["word_count"] >= max(18, MIN_WORDS // 2):
            balanced.append(current)
        index += 1

    return balanced


def renumber_chunks(chunks: list[dict], source_id: str) -> list[dict]:
    for index, chunk in enumerate(chunks):
        chunk["chunk_index"] = index
        chunk["chunk_id"] = f"{source_id}_chunk_{index:03d}"
        chunk["word_count"] = word_count(chunk["text"])
    return chunks


def chunk_document(document: dict) -> list[dict]:
    full_path = document.get("fullTextPath")
    if not full_path:
        return []
    text_path = ROOT / "docs" / full_path.replace("./", "")
    if not text_path.exists():
        return []
    blocks = paragraph_like_blocks(normalize_text(text_path.read_text(encoding="utf-8", errors="ignore")))
    chunks, pending_heading, current_parts, current_words = [], "", [], 0

    def flush() -> None:
        nonlocal pending_heading, current_parts, current_words
        if not current_parts:
            return
        chunk_text = " ".join(current_parts).strip()
        if pending_heading and pending_heading not in chunk_text:
            chunk_text = f"{pending_heading}. {chunk_text}"
        index = len(chunks)
        chunks.append(
            {
                "chunk_id": f"{document['id']}_chunk_{index:03d}",
                "program_id": document["id"],
                "source_type": "government_basis",
                "party_id": "REGERING",
                "party_name": "Regeringsgrundlag",
                "year": int(document["year"]),
                "title": document["title"],
                "source_path": document.get("sourcePath", ""),
                "chunk_index": index,
                "word_count": word_count(chunk_text),
                "text": chunk_text,
            }
        )
        pending_heading, current_parts, current_words = "", [], 0

    for block in blocks:
        if current_parts and starts_with_inline_heading(block):
            flush()
        if looks_like_heading(block):
            if current_parts and current_words >= MIN_WORDS:
                flush()
            pending_heading = block
            continue
        for piece in split_long_block(block):
            piece_words = word_count(piece)
            if current_parts and current_words + piece_words > MAX_WORDS:
                flush()
            current_parts.append(piece)
            current_words += piece_words
            if current_words >= TARGET_WORDS:
                flush()
    if current_parts:
        flush()
    return renumber_chunks(rebalance_short_chunks(chunks), document["id"])


def topic_keywords(topic: dict) -> list[str]:
    return list(dict.fromkeys(topic.get("keywords", []) + EXTRA_TOPIC_KEYWORDS.get(topic["id"], [])))


def keyword_pattern(keyword: str) -> re.Pattern:
    escaped = re.escape(" ".join(keyword.lower().split())).replace(r"\ ", r"\s+")
    return re.compile(rf"(?<![\wÆØÅæøå-]){escaped}(?![\wÆØÅæøå-])", re.IGNORECASE)


def score_chunk(text: str, topics: list[dict]) -> tuple[str, float, str, float, str]:
    normalized = " ".join(text.lower().split())
    scored = []
    reasons_by_topic = defaultdict(list)
    for topic in topics:
        hits = []
        for keyword in topic_keywords(topic):
            key = " ".join(keyword.lower().split())
            if topic["id"] == "udlaendinge_integration_statsborgerskab" and key == "danske":
                continue
            if key and keyword_pattern(key).search(normalized):
                hits.append(keyword)
        if not hits:
            continue
        score = 0.18 * len(set(hits))
        if len(set(hits)) >= 2:
            score += 0.25
        if topic["id"] in {"forsvar_sikkerhed_beredskab", "klima_miljoe_energi"} and hits:
            score += 0.12
        scored.append((topic["id"], score, hits[:4]))
        reasons_by_topic[topic["id"]] = [f"keyword:{hit}" for hit in hits[:4]]
    if not scored:
        return "ukendt", 0.0, "", 0.0, "ingen klare nøgleord"
    scored.sort(key=lambda item: (-item[1], item[0]))
    if scored[0][1] < MIN_PRIMARY_SCORE:
        return "ukendt", 0.0, "", 0.0, "ingen stærke emnesignaler"
    primary = scored[0]
    secondary = scored[1] if len(scored) > 1 else ("", 0.0, [])
    reasons = reasons_by_topic.get(primary[0], []) + reasons_by_topic.get(secondary[0], [])
    return primary[0], primary[1], secondary[0], secondary[1], ", ".join(reasons[:6])


def build_similarity(combined_suggestions: list[dict], programs: dict, governments: list[dict], topics: list[dict]) -> list[dict]:
    latest_by_party = {}
    for program in programs["programs"]:
        pid = program["partyId"]
        if pid not in latest_by_party or int(program["year"]) > int(latest_by_party[pid]["year"]):
            latest_by_party[pid] = program

    by_program_topic = defaultdict(list)
    by_program_secondary_topic = defaultdict(list)
    for item in combined_suggestions:
        if item.get("primary_topic_id") and item.get("primary_topic_id") != "ukendt":
            by_program_topic[(item["program_id"], item["primary_topic_id"])].append(item["text"])
        if item.get("secondary_topic_id") and item.get("secondary_topic_id") != "ukendt":
            by_program_secondary_topic[(item["program_id"], item["secondary_topic_id"])].append(item["text"])

    rows = []
    for government in governments:
        candidate_ids = list(dict.fromkeys(government.get("governmentParties", []) + government.get("parliamentaryBasis", [])))
        available = [pid for pid in candidate_ids if pid in latest_by_party]
        missing = [pid for pid in candidate_ids if pid not in latest_by_party]
        for topic in topics:
            gov_text = " ".join(by_program_topic.get((government["id"], topic["id"]), []))
            if not gov_text or not available:
                rows.append({
                    "government_id": government["id"],
                    "topic_id": topic["id"],
                    "topic_label": topic["label"],
                    "scores": [],
                    "unavailable_topic_parties": [],
                    "missing_party_ids": missing,
                    "note": "Ikke nok emnetekst til beregning." if not gov_text else "Ingen partiprogrammer i datagrundlaget.",
                })
                continue
            parties = []
            for pid in available:
                program = latest_by_party[pid]
                party_text = " ".join(by_program_topic.get((program["id"], topic["id"]), []))
                secondary_text = " ".join(by_program_secondary_topic.get((program["id"], topic["id"]), []))
                if party_text:
                    comparison_text = party_text
                    match_basis = "primary"
                    match_label = "Primært emne"
                    match_weight = 1.0
                elif secondary_text:
                    comparison_text = secondary_text
                    match_basis = "secondary"
                    match_label = "Sekundært emnesignal"
                    match_weight = SECONDARY_TOPIC_WEIGHT
                else:
                    comparison_text = ""
                    match_basis = ""
                    match_label = ""
                    match_weight = 0.0
                parties.append((pid, program, comparison_text, match_basis, match_label, match_weight))
            comparable_parties = [
                (pid, program, text, match_basis, match_label, match_weight)
                for pid, program, text, match_basis, match_label, match_weight in parties
                if text
            ]
            unavailable_topic_parties = [
                {
                    "party_id": pid,
                    "party_name": programs["parties_by_id"].get(pid, pid),
                    "program_id": program["id"],
                    "program_year": program["year"],
                    "program_title": program["title"],
                    "role": "Regeringsparti" if pid in government.get("governmentParties", []) else "Parlamentarisk grundlag",
                }
                for pid, program, text, _match_basis, _match_label, _match_weight in parties
                if not text
            ]
            if not comparable_parties:
                rows.append({
                    "government_id": government["id"],
                    "topic_id": topic["id"],
                    "topic_label": topic["label"],
                    "scores": [],
                    "unavailable_topic_parties": unavailable_topic_parties,
                    "missing_party_ids": missing,
                    "calculation": "tfidf_cosine_relative",
                    "note": "Regeringsgrundlaget har emnetekst, men ingen af de relevante aktuelle partiprogrammer har identificeret primær eller sekundær emnetekst for dette emne.",
                })
                continue
            docs = [gov_text] + [party_text for _pid, _program, party_text, _basis, _label, _weight in comparable_parties]
            vectorizer = TfidfVectorizer(lowercase=True, stop_words=list(STOP_WORDS), ngram_range=(1, 2), min_df=1)
            matrix = vectorizer.fit_transform(docs)
            raw_sims = cosine_similarity(matrix[0], matrix[1:]).ravel().tolist()
            sims = [
                raw_score * match_weight
                for raw_score, (_pid, _program, _text, _basis, _label, match_weight) in zip(raw_sims, comparable_parties)
            ]
            total = sum(max(score, 0.0) for score in sims)
            if total <= 0:
                rows.append({
                    "government_id": government["id"],
                    "topic_id": topic["id"],
                    "topic_label": topic["label"],
                    "scores": [],
                    "unavailable_topic_parties": unavailable_topic_parties,
                    "missing_party_ids": missing,
                    "calculation": "tfidf_cosine_relative",
                    "note": "Der er emnetekst på begge sider, men den tekstlige lighed er for lav til en meningsfuld relativ fordeling.",
                })
                continue
            scores = []
            for (pid, program, _party_text, match_basis, match_label, match_weight), raw_score, score in zip(comparable_parties, raw_sims, sims):
                share = float(score / total)
                scores.append({
                    "party_id": pid,
                    "party_name": programs["parties_by_id"].get(pid, pid),
                    "program_id": program["id"],
                    "program_year": program["year"],
                    "program_title": program["title"],
                    "match_basis": match_basis,
                    "match_label": match_label,
                    "match_weight": match_weight,
                    "raw_similarity": round(float(raw_score), 4),
                    "similarity": round(float(score), 4),
                    "share": round(share, 4),
                    "relative_similarity_share": round(share, 4),
                    "has_topic_text": True,
                    "role": "Regeringsparti" if pid in government.get("governmentParties", []) else "Parlamentarisk grundlag",
                })
            scores.sort(key=lambda item: (-item["share"], item["party_name"]))
            rows.append({
                "government_id": government["id"],
                "topic_id": topic["id"],
                "topic_label": topic["label"],
                "scores": scores,
                "unavailable_topic_parties": unavailable_topic_parties,
                "missing_party_ids": missing,
                "calculation": "tfidf_cosine_relative",
                "note": "Procenten fordeler kun mellem partier med identificeret primær eller sekundær emnetekst. Sekundære emnesignaler vægtes lavere; partier uden emnetekst vises separat og indgår ikke som 0%.",
            })
    return rows


def main() -> None:
    governments_payload = json.loads(GOVERNMENTS_PATH.read_text(encoding="utf-8"))
    programs = json.loads(PROGRAMS_PATH.read_text(encoding="utf-8"))
    programs["parties_by_id"] = {party["id"]: party["name"] for party in programs["parties"]}
    taxonomy = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    raw_party_suggestions = json.loads(PARTY_SUGGESTIONS_PATH.read_text(encoding="utf-8"))
    party_chunks = json.loads(PARTY_CHUNKS_PATH.read_text(encoding="utf-8"))
    party_suggestions = [
        item for item in raw_party_suggestions if item.get("source_type", "party_program") == "party_program"
    ]
    for item in party_suggestions:
        item.setdefault("source_type", "party_program")

    topics = taxonomy["topics"]
    topic_by_id = {topic["id"]: topic for topic in topics}
    chunks = []
    for document in governments_payload["governments"]:
        chunks.extend(chunk_document(document))

    suggestions = []
    topic_totals = Counter()
    for chunk in chunks:
        primary_id, primary_score, secondary_id, secondary_score, reasons = score_chunk(chunk["text"], topics)
        if primary_id not in topic_by_id:
            continue
        topic_totals[primary_id] += 1
        suggestions.append({
            "chunk_id": chunk["chunk_id"],
            "program_id": chunk["program_id"],
            "source_type": "government_basis",
            "party_name": chunk["party_name"],
            "year": chunk["year"],
            "title": chunk["title"],
            "cluster_id": "gov_keyword",
            "primary_topic_id": primary_id,
            "primary_topic_label": topic_by_id.get(primary_id, {}).get("label", primary_id),
            "primary_confidence": f"{primary_score:.2f}",
            "secondary_topic_id": secondary_id,
            "secondary_topic_label": topic_by_id.get(secondary_id, {}).get("label", secondary_id),
            "secondary_confidence": f"{secondary_score:.2f}" if secondary_id else "",
            "review_status": "needs_review",
            "reasons": reasons,
            "text": chunk["text"],
        })

    combined = party_suggestions + suggestions
    combined_chunks = party_chunks + chunks
    similarity = build_similarity(combined, programs, governments_payload["governments"], topics)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "government_chunks.json").write_text(json.dumps(chunks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "combined_chunks.json").write_text(json.dumps(combined_chunks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "government_topic_suggestions.json").write_text(json.dumps(suggestions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "government_similarity.json").write_text(json.dumps(similarity, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DOCS_ANALYSIS_DIR / "topic_suggestions.json").write_text(json.dumps(combined, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DOCS_ANALYSIS_DIR / "chunks.json").write_text(json.dumps(combined_chunks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DOCS_ANALYSIS_DIR / "government_similarity.json").write_text(json.dumps(similarity, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Emneforslag for regeringsgrundlag",
        "",
        f"- Regeringsdokumenter med tekst: {len({chunk['program_id'] for chunk in chunks})}",
        f"- Tekststykker: {len(chunks)}",
        "",
        "## Emnefordeling",
        "",
    ]
    for topic in topics:
        lines.append(f"- {topic['label']}: {topic_totals.get(topic['id'], 0)}")
    lines.extend([
        "",
        "## Metode",
        "",
        "Regeringsgrundlagene er opdelt med samme tekststykke-størrelser som partiprogrammerne.",
        "Emneforslagene bruger den samme realpolitiske 18-emne-taksonomi som partiprogrammerne.",
        "Tekstlig nærhed er TF-IDF/cosinus mellem regeringsgrundlagets primære emnetekst og de seneste principprogrammer for partier i regering/parlamentarisk grundlag.",
        "Partier indgår med primær emnetekst, når den findes. Hvis et emne kun er identificeret som sekundært signal, indgår teksten med lavere vægt.",
        "Den viste procent er en relativ normalisering mellem de partier, hvor der faktisk er identificeret emnetekst. Partier uden emnetekst indgår ikke som 0%, men vises som ikke beregnet.",
        "Indikatoren er en læsehjælp til tekstlig nærhed, ikke en måling af kausal politisk indflydelse.",
    ])
    (OUTPUT_DIR / "government_topic_suggestions_summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    party_totals = Counter(item["primary_topic_id"] for item in party_suggestions)
    combined_totals = Counter(item["primary_topic_id"] for item in combined)
    combined_lines = [
        "# Emneforslag",
        "",
        "Denne fil opsummerer de analysebaserede emneforslag, der bruges på sitet.",
        "",
        "## Datagrundlag",
        "",
        f"- Partiprogram-tekststykker med emneforslag: {len(party_suggestions)}",
        f"- Regeringsgrundlag-tekststykker med emneforslag: {len(suggestions)}",
        f"- Samlet antal tekststykker med emneforslag: {len(combined)}",
        f"- Emner i taksonomien: {len(topics)}",
        "",
        "## Emnefordeling",
        "",
    ]
    for topic in topics:
        topic_id = topic["id"]
        combined_lines.append(
            f"- {topic['label']}: {combined_totals.get(topic_id, 0)} "
            f"(partiprogrammer {party_totals.get(topic_id, 0)}, regeringsgrundlag {topic_totals.get(topic_id, 0)})"
        )
    combined_lines.extend([
        "",
        "## Metode",
        "",
        "Partiprogrammer og regeringsgrundlag er genkørt med automatisk tekstopdeling, TF-IDF/KMeans-klyngekontrol og en stabil realpolitisk 18-emne-taksonomi.",
        "KMeans-klyngerne bruges som teknisk kontrol og dokumentation; sitet viser de forklarlige emneforslag fra taksonomien.",
        "Emneklassifikationen kræver enten et stærkt frase-hit eller flere emnespecifikke nøgleord, så brede enkeltord ikke alene placerer et tekststykke under et emne.",
        "Tekstopdelingen filtrerer side-/biblioteksstøj, samler korte fragmenter og forsøger at splitte interne overskrifter i OCR-tekst, så uddrag starter tættere på det emne, de matcher.",
        "Et dokument vises kun under et emne, når der er fundet tekststykker, som primært matcher emnet. Manglende visning betyder derfor ikke nødvendigvis manglende politisk stillingtagen.",
        "Procentvis partinærhed beregnes som en relativ normalisering af TF-IDF/cosinus-scorer mellem partier med identificeret emnetekst. Primær emnetekst bruges direkte; sekundære emnesignaler indgår med lavere vægt.",
        "Partier uden primær eller sekundær emnetekst vises særskilt og tæller ikke som 0%.",
        "Indikatoren må ikke læses som kausal politisk indflydelse.",
        "1994- og 2001-regeringsgrundlagene samt Fremskridtspartiets 1993-program er OCR-behandlet lokalt, fordi de originale PDF'er er billedbaserede.",
        "Dansk Folkepartis 2009-tekst er registreret som arbejdsprogram, fordi partiet selv bruger den betegnelse.",
        "2019-dokumentet er markeret som forståelsespapir, og 2000/2003 er markeret som supplerende regeringsgrundlag.",
    ])
    (DOCS_ANALYSIS_DIR / "topic_suggestions_summary.md").write_text(
        "\n".join(combined_lines) + "\n",
        encoding="utf-8",
    )

    print(json.dumps({
        "government_chunks": len(chunks),
        "government_suggestions": len(suggestions),
        "combined_suggestions": len(combined),
        "combined_chunks": len(combined_chunks),
        "similarity_rows": len(similarity),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
