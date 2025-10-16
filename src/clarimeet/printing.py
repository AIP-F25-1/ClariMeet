from __future__ import annotations
from typing import Iterable, Tuple

def print_kv_block(title: str, rows: Iterable[Tuple[str, str]]) -> None:
    rows = list(rows)
    width = max([len(k) for k, _ in rows] + [len(title)]) + 2
    bar = "=" * (width + 24)
    print(bar)
    print(title)
    print(bar)
    for k, v in rows:
        print(f"{k:<{width}}: {v}")
    print(bar)
