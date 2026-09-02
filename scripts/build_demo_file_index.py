#!/usr/bin/env python3
"""3業種デモZIPの中身から、課題本文が参照できるファイル一覧を生成する。

- 3つのZIPは業種ルートフォルダ名だけが違い、内側の相対パスは完全一致している前提。
  一致しない場合はエラーで止まる(教材の参照検査が業種別に壊れるため)。
- 出力: lib/demo-data-files.generated.json
- 実行: python3 scripts/build_demo_file_index.py
"""

from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIPS = {
    "salon": ROOT / "public/downloads/demo-data/salon-demo-data-full-v1.zip",
    "construction": ROOT
    / "public/downloads/demo-data/construction-demo-data-full-v1.zip",
    "realestate": ROOT / "public/downloads/demo-data/real-estate-demo-data-full-v1.zip",
}
OUTPUT = ROOT / "lib/demo-data-files.generated.json"
MATERIALS_OUTPUT = ROOT / "lib/demo-task-materials.generated.json"
MATERIALS_PUBLIC_OUTPUT = (
    ROOT / "public/downloads/demo-data/task-materials.generated.json"
)


def relative_names(zip_path: Path) -> tuple[str, set[str]]:
    archive = zipfile.ZipFile(zip_path)
    root_names: set[str] = set()
    names: set[str] = set()
    for info in archive.infolist():
        raw = info.filename
        if not (info.flag_bits & 0x800):
            raw = raw.encode("cp437").decode("utf-8", errors="strict")
        head, _, rest = raw.partition("/")
        root_names.add(head)
        if rest:
            names.add(rest)
    if len(root_names) != 1:
        raise SystemExit(f"{zip_path.name}: ルートフォルダが1つではありません: {sorted(root_names)}")
    return next(iter(root_names)), names


def main() -> int:
    per_industry: dict[str, set[str]] = {}
    roots: dict[str, str] = {}
    for industry, zip_path in ZIPS.items():
        if not zip_path.exists():
            raise SystemExit(f"ZIPが見つかりません: {zip_path}")
        roots[industry], per_industry[industry] = relative_names(zip_path)

    baseline = per_industry["salon"]
    for industry, names in per_industry.items():
        if names != baseline:
            missing = sorted(baseline - names)[:5]
            extra = sorted(names - baseline)[:5]
            raise SystemExit(
                f"{industry}: 相対構造が一致しません。不足例: {missing} / 余剰例: {extra}"
            )

    payload = {
        "note": "課題本文が『files』で参照できる、3業種共通の相対パス一覧。scripts/build_demo_file_index.py が生成する。",
        "industryRoots": roots,
        "fileCount": len(baseline),
        "files": sorted(baseline),
    }
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Generated {len(baseline)} shared demo file paths at {OUTPUT}")

    # スマホでZIPを展開しなくても始められるよう、課題/*.txt の本文をWeb表示用に抽出する
    materials: dict[str, dict[str, str]] = {}
    for industry, zip_path in ZIPS.items():
        archive = zipfile.ZipFile(zip_path)
        per: dict[str, str] = {}
        for info in archive.infolist():
            raw = info.filename
            if not (info.flag_bits & 0x800):
                raw = raw.encode("cp437").decode("utf-8", errors="strict")
            _, _, rest = raw.partition("/")
            if rest.startswith("課題/") and rest.endswith(".txt"):
                per[rest] = archive.read(info).decode("utf-8")
        materials[industry] = per
    materials_text = (
        json.dumps(
            {
                "note": "課題/*.txt の本文。スマホ等でZIPを展開しなくても貼り付けを試せるようにWebへ出す。scripts/build_demo_file_index.py が生成する。",
                "materials": materials,
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n"
    )
    MATERIALS_OUTPUT.write_text(materials_text, encoding="utf-8")
    MATERIALS_PUBLIC_OUTPUT.write_text(materials_text, encoding="utf-8")
    total = sum(len(per) for per in materials.values())
    print(
        f"Generated {total} task memo texts at {MATERIALS_OUTPUT} "
        f"and {MATERIALS_PUBLIC_OUTPUT}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
