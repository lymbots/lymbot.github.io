#!/usr/bin/env python3
"""OCR scanned government-basis PDFs into full-text files.

Requires local tools:
- PyMuPDF (`python3 -m pip install PyMuPDF`)
- Tesseract with Danish language data (`brew install tesseract tesseract-lang`)
"""

from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOCS = {
    "RG_1994": ROOT / "docs/kildearkiv/Regeringsgrundlag/1994_fælles-fremtid.pdf",
    "RG_2001": ROOT / "docs/kildearkiv/Regeringsgrundlag/2001_vækst-velfærd-fornyelse.pdf",
}
OUTPUT_DIR = ROOT / "docs/data/full_texts"


def clean_ocr_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(lines).strip() + "\n"


def ocr_pdf(pdf_path: Path, language: str, scale: float) -> str:
    doc = fitz.open(pdf_path)
    page_texts: list[str] = []
    with tempfile.TemporaryDirectory(prefix="dpp_ocr_") as tmp:
        tmp_dir = Path(tmp)
        for index, page in enumerate(doc):
            image_path = tmp_dir / f"page_{index + 1:03d}.png"
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            pix.save(image_path)
            result = subprocess.run(
                ["tesseract", str(image_path), "stdout", "-l", language, "--psm", "3"],
                check=False,
                text=True,
                capture_output=True,
            )
            if result.returncode != 0:
                raise RuntimeError(f"Tesseract failed on {pdf_path.name} page {index + 1}: {result.stderr}")
            page_texts.append(result.stdout.strip())
            print(f"{pdf_path.name} page {index + 1}/{doc.page_count}: {len(result.stdout)} chars")
    return clean_ocr_text("\n\n".join(page_texts))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("ids", nargs="*", default=list(DEFAULT_DOCS), help="Government ids to OCR")
    parser.add_argument("--language", default="dan+eng")
    parser.add_argument("--scale", type=float, default=3.0)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for doc_id in args.ids:
        if doc_id not in DEFAULT_DOCS:
            raise SystemExit(f"Unknown document id: {doc_id}")
        text = ocr_pdf(DEFAULT_DOCS[doc_id], args.language, args.scale)
        output = OUTPUT_DIR / f"{doc_id}.txt"
        output.write_text(text, encoding="utf-8")
        print(f"wrote {output.relative_to(ROOT)} ({len(text)} chars)")


if __name__ == "__main__":
    main()
