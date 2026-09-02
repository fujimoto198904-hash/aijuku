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

INK = HexColor("#172128")
IVORY = HexColor("#F6F0E4")
CYAN = HexColor("#64C7CF")
CORAL = HexColor("#C95843")
AMBER = HexColor("#D8AA51")
LIME = HexColor("#B8D879")
WHITE = HexColor("#FFFFFF")
MUTED = HexColor("#647078")


def find_japanese_font() -> Path:
    custom_font = os.environ.get("FUJIMOTO_JITSUGAKU_JP_FONT") or os.environ.get("TOYOTA_AI_JP_FONT")
    candidates = ([Path(custom_font).expanduser()] if custom_font else []) + FONT_CANDIDATES
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    checked = "\n".join(f"  - {path}" for path in candidates)
    raise FileNotFoundError(
        "日本語フォントが見つかりません。FUJIMOTO_JITSUGAKU_JP_FONT に "
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
    pdf.drawString(42, 22, "藤本実学塾 | 2026.11.01 現地開講ガイド")
    pdf.drawRightString(width - 42, 22, f"{page_number} / 2")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("JP", str(find_japanese_font())))
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    pdf.setTitle("藤本実学塾 スタートガイド")
    pdf.setAuthor("藤本実学塾")
    pdf.setSubject("2026年11月1日の現地開講予定・受講方法・料金・AI安全ルール")
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
    pdf.drawString(42, content_y, "自分の仕事を、ひとつ完成させる。")
    content_y -= 28
    content_y = draw_wrapped(
        pdf,
        "藤本実学塾は、公開Web教科書を見ながら自分の仕事を進める、大人向けのAI実学塾です。2026年11月1日から、東京23区内で対面・教科書自習式を開始予定。自習中に詰まった時は、当日の担当講師へ質問できます。",
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
        ("現地開講予定", "2026.11.01", CYAN),
        ("対面自習・月額", "10,000円", AMBER),
        ("毎日の開講時間", "17:00-21:00", LIME),
    ]
    for index, (small, large, accent) in enumerate(cards):
        x = 42 + index * (card_width + card_gap)
        rounded_box(pdf, x, content_y - 70, card_width, 70, HexColor("#1C2931"), HexColor("#30434E"), 7)
        pdf.setFont("JP", 7.5)
        pdf.setFillColor(HexColor("#7C8C93"))
        pdf.drawString(x + 13, content_y - 20, small)
        pdf.setFont("JP", 13)
        pdf.setFillColor(accent)
        pdf.drawString(x + 13, content_y - 46, large)

    content_y -= 96
    label(pdf, "TEXTBOOK SELF-STUDY", 42, content_y, CORAL)
    content_y -= 28
    rounded_box(pdf, 42, content_y - 92, width - 84, 92, IVORY, None, 14)
    pdf.setFont("JP", 8)
    pdf.setFillColor(CORAL)
    pdf.drawString(57, content_y - 18, "実務課題例 | 調査")
    pdf.setFont("JP", 14)
    pdf.setFillColor(INK)
    pdf.drawString(57, content_y - 43, "地域別最低賃金を、出典つきの表にしよう")
    draw_wrapped(
        pdf,
        "教科書の手順に沿ってAIへ依頼し、出典と抜け漏れを自分で確認。迷った箇所だけ当日の講師へ相談します。",
        57,
        content_y - 64,
        width - 114,
        8.2,
        MUTED,
        13,
        2,
    )
    draw_wrapped(
        pdf,
        "Web教科書は登録なしで無料公開しています。使う材料、進め方、完成条件まで、このサイトだけで学べます。",
        57,
        content_y - 109,
        width - 114,
        7.2,
        MUTED,
        11,
        2,
    )
    footer(pdf, 1)
    pdf.showPage()

    # Page 2
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(INK)
    pdf.rect(0, height - 155, width, 155, fill=1, stroke=0)
    label(pdf, "JITSUGAKU, YOUR WAY", 42, height - 48, CYAN)
    pdf.setFont("JP", 25)
    pdf.setFillColor(WHITE)
    pdf.drawString(42, height - 88, "教科書で進める。")
    pdf.setFillColor(AMBER)
    pdf.drawString(42, height - 120, "分からない時は、講師に聞ける。")

    y = height - 195
    label(pdf, "HOW TO LEARN", 42, y)
    y -= 32
    steps = [
        "正式案内で、その日の会場を確認",
        "教科書から今日の課題を選ぶ",
        "自分でAIを使い、成果物を作る",
        "詰まった箇所を当日の講師に聞く",
        "成果物と次に直す点を持ち帰る",
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
        draw_wrapped(pdf, step, x + 32, row_y - 18, 124, 8, INK, 12, 2)

    y -= 145
    label(pdf, "WAYS TO JOIN", 42, y)
    y -= 28
    card_gap = 6
    join_width = (width - 84 - card_gap * 2) / 3
    join_cards = [
        ("01 対面家庭教師", "10,000円 / 60分", "東京23区内 / 企業は5人まで", WHITE, INK),
        ("02 オンライン", "4,000円 / 50分", "全国 / Google Meet", WHITE, INK),
        ("03 対面自習", "月額 10,000円", "17:00-21:00 / 23区内", INK, WHITE),
    ]
    for index, (title, price, detail, fill, text_color) in enumerate(join_cards):
        x = 42 + index * (join_width + card_gap)
        rounded_box(pdf, x, y - 112, join_width, 112, fill, HexColor("#DDD6CB") if fill == WHITE else None, 10)
        pdf.setFont("JP", 9)
        pdf.setFillColor(text_color)
        pdf.drawString(x + 12, y - 22, title)
        pdf.setFont("JP", 11)
        pdf.drawString(x + 12, y - 48, price)
        draw_wrapped(pdf, detail, x + 12, y - 72, join_width - 24, 7.2, MUTED if fill == WHITE else HexColor("#AAB4B8"), 11, 2)

    draw_wrapped(
        pdf,
        "OPEN記念: 先着1,000名まで入会金0円（通常10,000円）。定員到達で終了。Web教科書は無料。紙版は希望者のみ1冊2,000円前後。",
        42,
        y - 126,
        width - 84,
        7.2,
        MUTED,
        11,
        2,
    )

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

    y -= len(safety) * 27 + 4
    label(pdf, "OPERATIONS / CONTACT", 42, y, CORAL)
    y -= 23
    draw_wrapped(
        pdf,
        "運営本部｜豊田市東梅坪町10-4-9　お問い合わせ｜メールのみ｜info@mon-ai.jp",
        42,
        y,
        width - 84,
        8.2,
        MUTED,
        13,
        2,
    )
    pdf.setFont("JP", 7.2)
    pdf.setFillColor(MUTED)
    pdf.drawString(42, y - 31, "本文・日ごとの会場・予約方法・税区分・規約は準備中です。確定内容は申込前に案内します。")

    footer(pdf, 2)
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
