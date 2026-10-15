#!/usr/bin/env python3
"""يبني بيانات موقع ملخصات «مستشار المنشآت العائلية المعتمد».

الاستخدام: ضع ملفات PDF في مجلد pdfs/ ثم شغّل:
    python3 build.py

يقرأ كل ملف يطابق النمط «[اسم المقرر]_ملخص_مكثف.pdf» أو «[اسم المقرر]_ملخص_ومراجعة.pdf»،
ويستخرج عدد صفحاته وحجمه، ثم يكتب files.js ويجهّز ملف ZIP بكل الملفات.
لا يعدّل ملفات PDF ولا يعيد تسميتها.
"""

import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PDF_DIR = ROOT / "pdfs"
DATA_FILE = ROOT / "files.js"
ZIP_NAME = "cfba-summaries.zip"
ZIP_DOWNLOAD_NAME = "ملخصات_مستشار_المنشآت_العائلية.zip"

AXES = [
    "المعارف النظامية والقانونية",
    "المعارف الإدارية والمالية",
    "المهارات",
]

# (الرقم، الاسم المعروض، رقم المحور، بادئات اسم الملف المقبولة)
COURSES = [
    (1, "البعد القانوني", 0, ["البعد_القانوني_للمنشآت_العائلية", "البعد_القانوني"]),
    (2, "الحوكمة", 0, ["حوكمة_المنشآت_العائلية", "الحوكمة"]),
    (3, "الأوقاف العائلية", 0, ["الأوقاف_العائلية"]),
    (4, "مالية المنشآت العائلية", 1, ["مالية_المنشآت_العائلية"]),
    (5, "التخطيط الاستراتيجي", 1, ["التخطيط_الاستراتيجي"]),
    (6, "إدارة الأعمال", 1, ["إدارة_الأعمال_في_المنشآت_العائلية", "إدارة_الأعمال"]),
    (7, "الميثاق العائلي", 2, ["الميثاق_العائلي"]),
    (8, "التفاوض والوساطة", 2, ["مهارات_التفاوض_وإدارة_الوساطة", "التفاوض_والوساطة"]),
    (9, "توظيف وتحفيز الكفاءات", 2, ["توظيف_وتحفيز_الكفاءات"]),
]

TYPES = {
    "ملخص_مكثف": ("brief", "ملخص مكثف"),
    "ملخص_ومراجعة": ("full", "ملخص ومراجعة"),
}


def nfc(text):
    # ملفات ماك تُحفظ أسماؤها بصيغة NFD؛ نوحّد الصيغة للمقارنة فقط
    return unicodedata.normalize("NFC", text)


def page_count(path):
    try:
        from pypdf import PdfReader
        return len(PdfReader(str(path)).pages)
    except ImportError:
        data = path.read_bytes()
        return len(re.findall(rb"/Type\s*/Page(?![a-z])", data)) or None


def classify(name):
    stem = nfc(name)[: -len(".pdf")]
    for suffix, (key, _) in TYPES.items():
        if stem.endswith("_" + suffix):
            prefix = stem[: -len(suffix) - 1]
            for num, _, _, prefixes in COURSES:
                if prefix in (nfc(p) for p in prefixes):
                    return num, key
    return None


def main():
    found = {}
    unknown = []
    pdfs = sorted(p for p in PDF_DIR.iterdir() if p.suffix.lower() == ".pdf" and not p.name.startswith("._"))
    for path in pdfs:
        match = classify(path.name)
        if not match:
            unknown.append(path.name)
            continue
        if match in found:
            print(f"تحذير: ملف مكرر للمقرر نفسه، تم تجاهله: {path.name}", file=sys.stderr)
            continue
        found[match] = {
            "file": path.name,
            "size": path.stat().st_size,
            "pages": page_count(path),
        }

    courses = []
    for num, title, axis, _ in COURSES:
        courses.append({
            "num": num,
            "title": title,
            "axis": axis,
            "files": {key: found.get((num, key)) for key, _ in TYPES.values()},
        })

    zip_path = ROOT / ZIP_NAME
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_STORED) as zf:
        for (num, key), info in sorted(found.items()):
            # تاريخ ثابت كي لا يتغير ملف ZIP بين بناءين متطابقين
            entry = zipfile.ZipInfo(info["file"], date_time=(2020, 1, 1, 0, 0, 0))
            entry.external_attr = 0o644 << 16
            zf.writestr(entry, (PDF_DIR / info["file"]).read_bytes())

    data = {
        "axes": AXES,
        "types": {key: label for key, label in TYPES.values()},
        "courses": courses,
        "total": len(COURSES) * len(TYPES),
        "available": len(found),
        "zip": {"file": ZIP_NAME, "name": ZIP_DOWNLOAD_NAME, "size": zip_path.stat().st_size},
    }
    DATA_FILE.write_text(
        "// مولَّد آلياً بواسطة build.py — لا تعدّله يدوياً\n"
        "window.CFBA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )

    print(f"الملفات المتوفرة: {len(found)} من {data['total']}")
    for num, title, _, _ in COURSES:
        for key, label in TYPES.values():
            info = found.get((num, key))
            status = f"{info['pages']} صفحة، {info['size'] // 1024} ك.ب" if info else "غير موجود"
            print(f"  {num}. {title} — {label}: {status}")
    if unknown:
        print("ملفات لم يُتعرّف عليها (تحقق من نمط التسمية):", file=sys.stderr)
        for name in unknown:
            print(f"  - {name}", file=sys.stderr)


if __name__ == "__main__":
    main()
