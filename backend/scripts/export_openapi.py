"""导出 OpenAPI JSON，供前端生成 TS 类型。用法：python scripts/export_openapi.py"""
import json
from pathlib import Path

from app.main import app


def main() -> None:
    schema = app.openapi()
    out = Path(__file__).resolve().parent.parent / "openapi.json"
    out.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[done] {out} ({len(schema.get('paths', {}))} paths)")


if __name__ == "__main__":
    main()
