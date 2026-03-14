"""Load run configuration (YAML or JSON)."""

import json
from pathlib import Path
from typing import Any

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


def load_run_config(path: Path) -> dict[str, Any]:
    """Load run_config.yaml or run_config.json."""
    raw = path.read_text(encoding="utf-8")
    if path.suffix in (".yaml", ".yml"):
        if not HAS_YAML:
            raise RuntimeError("PyYAML required to load run_config.yaml: pip install pyyaml")
        return yaml.safe_load(raw) or {}
    return json.loads(raw)
