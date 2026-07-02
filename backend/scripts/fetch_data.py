"""下载全量种子 seed_full.json（gzip 解压）。首启由 Dockerfile CMD 调用。

数据源：GitHub Release asset（环境变量 DATA_RELEASE_URL 覆盖；否则用默认官方 Release）。
幂等：seed_full.json 已存在则跳过；--force 强制重下。

运行：
  cd backend && python scripts/fetch_data.py           # 首启/跳过
  cd backend && python scripts/fetch_data.py --force   # 强制重下
"""
import gzip
import os
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent / "seed_full.json"

# 维护者首发 Release 后替换为真实地址（见 README「数据发布流程」）
DEFAULT_RELEASE_URL = "https://github.com/OWNER/REPO/releases/download/data-v1/seed_full.json.gz"


def fetch(force: bool = False) -> None:
    if OUT.exists() and not force:
        print(f"[skip] {OUT.name} 已存在，跳过（--force 可强制重下）")
        return

    url = os.environ.get("DATA_RELEASE_URL") or DEFAULT_RELEASE_URL
    if "OWNER/REPO" in url:
        print("[error] DATA_RELEASE_URL 未配置：请在 .env 设置指向 GitHub Release 的 seed_full.json.gz 地址")
        print("       或维护者本地直接运行 export_seed_full.py 生成。")
        sys.exit(1)

    print(f"[fetch] {url}")
    try:
        with urllib.request.urlopen(url, timeout=60) as resp:
            raw = resp.read()
    except Exception as e:
        print(f"[error] 下载失败：{e}")
        print("       请检查网络与 DATA_RELEASE_URL，或维护者本地改跑 export_seed_full.py 生成。")
        sys.exit(1)

    text = gzip.decompress(raw).decode("utf-8")
    OUT.write_text(text, encoding="utf-8")
    print(f"[done] {OUT.name} 已就绪（{OUT.stat().st_size / 1024 / 1024:.2f} MB）")


if __name__ == "__main__":
    fetch(force="--force" in sys.argv)
