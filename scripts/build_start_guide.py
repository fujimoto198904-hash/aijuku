import os
from pathlib import Path
from typing import Optional

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "downloads" / "toyota-ai-school-start-guide.pdf"
HERO = ROOT / "public" / "og.png"
FONT_CANDIDATES = [
    Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
    Path("/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"),
    Path("/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc"),
]

INK = HexColor("#081019")
IVORY = HexColor("#F7F2E8")
CYAN = HexColor("#45E6FF")
CORAL = HexColor("#E66D51")
AMBER = HexColor("#F2BC5B")
LIME = HexColor("#C8F65A")
WHITE = HexColor("#FFFFFF")
MUTED = HexColor("#647078")


def find_japanese_font() -> Path:
    custom_font = os.environ.get("TOYOTA_AI_JP_FONT")
    candidates = ([Path(custom_font).expanduser()] if custom_font else []) + FONT_CANDIDATES
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    checked = "\n".join(f"  - {path}" for path in candidates)
    raise FileNotFoundError(
        "日本語フォントが見つかりません。TOYOTA_AI_JP_FONT に "
        f"TTF/TTCファイルのパスを指定してください。\n確認した場所:\n{checked}"
    )


def wrap_text(text: str, font_name: str, font_size: float, width: float) -> list[str]:
    lines: list[str] = []
    current = ""
    for char in text:
        candidate = current + char
        if current and pdfmetrics.stringWidth(candidate, font_name, font_size) > width:
            lines.append(current)
            current = char
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    font_size: float,
    color,
    leading: Optional[float] = None,
    max_lines: Optional[int] = None,
) -> float:
    leading = leading or font_size * 1.55
    lines = wrap_text(text, "JP", font_size, width)
    if max_lines:
        lines = lines[:max_lines]
    pdf.setFont("JP", font_size)
    pdf.setFillColor(color)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def rounded_box(pdf, x, y, width, height, fill, stroke=None, radius=14):
    pdf.setFillColor(fill)
    if stroke:
        pdf.setStrokeColor(stroke)
        pdf.setLineWidth(0.7)
    else:
        pdf.setStrokeColor(fill)
    pdf.roundRect(x, y, width, height, radius, fill=1, stroke=1 if stroke else 0)


def label(pdf, text, x, y, color=CORAL):
    pdf.setStrokeColor(color)
    pdf.setLineWidth(1.2)
    pdf.line(x, y + 2, x + 24, y + 2)
    pdf.setFont("JP", 7.5)
    pdf.setFillColor(color)
    pdf.drawString(x + 32, y, text)


def footer(pdf, page_number):
    width, _ = A4
    pdf.setStrokeColor(HexColor("#DAD4C9"))
    pdf.setLineWidth(0.5)
    pdf.line(42, 35, width - 42, 35)
    pdf.setFont("JP", 7)
    pdf.setFillColor(MUTED)
    pdf.drawString(42, 22, "豊田Ai塾 | START GUIDE | 2026.08")
    pdf.drawRightString(width - 42, 22, f"{page_number} / 2")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("JP", str(find_japanese_font())))
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    pdf.setTitle("豊田Ai塾 スタートガイド")
    pdf.setAuthor("豊田Ai塾")
    pdf.setSubject("初回体験・受講方法・料金・AI安全ルール")
    width, height = A4

    # Page 1
    pdf.setFillColor(INK)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    image = ImageReader(str(HERO))
    image_width = width - 56
    image_height = image_width * 941 / 1672
    pdf.drawImage(image, 28, height - 28 - image_height, width=image_width, height=image_height, mask="auto")

    content_y = height - 28 - image_height - 30
    label(pdf, "START HERE", 42, content_y, CYAN)
    content_y -= 34
    pdf.setFont("JP", 25)
    pdf.setFillColor(WHITE)
    pdf.drawString(42, content_y, "最初の1問を、完成させる夜。")
    content_y -= 28
    content_y = draw_wrapped(
        pdf,
        "豊田Ai塾は、100の実践ミッションを自分のペースで進める、大人向けの対面AI塾です。ひとりで進め、詰まった時だけMONに質問します。",
        42,
        content_y,
        width - 84,
        10,
        HexColor("#AAB4B8"),
        17,
    )

    content_y -= 12
    card_gap = 8
    card_width = (width - 84 - card_gap * 2) / 3
    cards = [
        ("月会費", "5,000円", CYAN),
        ("開講時間", "平日 18:00-21:00", AMBER),
        ("初回体験", "0円", LIME),
    ]
    for index, (small, large, accent) in enumerate(cards):
        x = 42 + index * (card_width + card_gap)
        rounded_box(pdf, x, content_y - 70, card_width, 70, HexColor("#0D1923"), HexColor("#1B2C37"), 12)
        pdf.setFont("JP", 7.5)
        pdf.setFillColor(HexColor("#7C8C93"))
        pdf.drawString(x + 13, content_y - 20, small)
        pdf.setFont("JP", 13)
        pdf.setFillColor(accent)
        pdf.drawString(x + 13, content_y - 46, large)

    content_y -= 96
    label(pdf, "YOUR FIRST MISSION", 42, content_y, CORAL)
    content_y -= 28
    rounded_box(pdf, 42, content_y - 92, width - 84, 92, IVORY, None, 14)
    pdf.setFont("JP", 8)
    pdf.setFillColor(CORAL)
    pdf.drawString(57, content_y - 18, "LEVEL 08 | 調査")
    pdf.setFont("JP", 14)
    pdf.setFillColor(INK)
    pdf.drawString(57, content_y - 43, "地域別最低賃金を、出典つきの表にしよう")
    draw_wrapped(
        pdf,
        "基準日、47都道府県、一次情報、参照URL、不明時の扱いをAIへ伝え、最後に抜け漏れまで自己点検します。",
        57,
        content_y - 64,
        width - 114,
        8.2,
        MUTED,
        13,
        2,
    )
    footer(pdf, 1)
    pdf.showPage()

    # Page 2
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(INK)
    pdf.rect(0, height - 155, width, 155, fill=1, stroke=0)
    label(pdf, "THE EVENING LAB", 42, height - 48, CYAN)
    pdf.setFont("JP", 25)
    pdf.setFillColor(WHITE)
    pdf.drawString(42, height - 88, "ひとりで進める。")
    pdf.setFillColor(AMBER)
    pdf.drawString(42, height - 120, "でも、ひとりで悩まない。")

    y = height - 195
    label(pdf, "HOW TO SPEND YOUR EVENING", 42, y)
    y -= 32
    steps = [
        "予約して、仕事帰りに教室へ",
        "今日のミッションを自分で選ぶ",
        "AIだけを使って、まず試してみる",
        "詰まった瞬間だけMONに質問",
        "成果物を保存し、次のレベルへ",
    ]
    for index, step in enumerate(steps):
        x = 42 + (index % 3) * 172
        row_y = y - (index // 3) * 64
        rounded_box(pdf, x, row_y - 47, 162, 47, WHITE, HexColor("#DDD6CB"), 10)
        pdf.setFillColor(CYAN if index < 3 else CORAL)
        pdf.circle(x + 18, row_y - 23, 10, fill=1, stroke=0)
        pdf.setFont("JP", 7)
        pdf.setFillColor(INK if index < 3 else WHITE)
        pdf.drawCentredString(x + 18, row_y - 25.5, str(index + 1))
        draw_wrapped(pdf, step, x + 35, row_y - 18, 115, 8, INK, 12, 2)

    y -= 145
    label(pdf, "BRING / RENT", 42, y)
    y -= 28
    col_width = (width - 92) / 2
    rounded_box(pdf, 42, y - 116, col_width, 116, WHITE, HexColor("#DDD6CB"), 12)
    pdf.setFont("JP", 12)
    pdf.setFillColor(INK)
    pdf.drawString(57, y - 23, "自分の環境で参加")
    draw_wrapped(pdf, "ノートPC / 電源 / AIアカウント / 作りたいもののメモ", 57, y - 47, col_width - 30, 8.5, MUTED, 14)
    pdf.setFont("JP", 9)
    pdf.setFillColor(HexColor("#4D7207"))
    pdf.drawString(57, y - 96, "追加料金なし")

    right_x = 50 + col_width
    rounded_box(pdf, right_x, y - 116, col_width, 116, INK, None, 12)
    pdf.setFont("JP", 12)
    pdf.setFillColor(WHITE)
    pdf.drawString(right_x + 15, y - 23, "PC + AI環境をレンタル")
    draw_wrapped(pdf, "手ぶらでも参加できます。受講者ごとに分離した安全な利用環境を準備します。", right_x + 15, y - 47, col_width - 30, 8.5, HexColor("#AAB4B8"), 14)
    pdf.setFont("JP", 9)
    pdf.setFillColor(AMBER)
    pdf.drawString(right_x + 15, y - 96, "1回 最大3時間 1,000円")

    y -= 151
    label(pdf, "SAFE AI RULES", 42, y)
    y -= 25
    safety = [
        "勤務先・顧客の機密情報を入力しない",
        "数字・日付・法律は一次情報で確かめる",
        "本番システムは架空データから試す",
        "生成物の著作権・利用条件を確認する",
    ]
    for index, item in enumerate(safety):
        item_y = y - index * 27
        pdf.setFillColor(LIME)
        pdf.circle(48, item_y + 3, 4, fill=1, stroke=0)
        pdf.setFont("JP", 8.5)
        pdf.setFillColor(INK)
        pdf.drawString(60, item_y, item)

    footer(pdf, 2)
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
