import json
from functools import lru_cache
from pathlib import Path

_I18N_DIR = Path(__file__).parent

SUPPORTED_LANGUAGES = {"fr", "en"}
DEFAULT_LANGUAGE = "fr"


@lru_cache(maxsize=8)
def _load(lang: str) -> dict:
    path = _I18N_DIR / f"{lang}.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def get_translation(key: str, lang: str, **kwargs: str) -> str:
    """Return translated string for dot-notated key (e.g. 'email.subject').

    Falls back to DEFAULT_LANGUAGE if key not found in requested lang.
    Interpolates kwargs using str.format_map().
    """
    resolved_lang = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    data = _load(resolved_lang)

    value: object = data
    for part in key.split("."):
        if not isinstance(value, dict):
            break
        value = value.get(part)  # type: ignore[assignment]

    if not isinstance(value, str):
        fallback = _load(DEFAULT_LANGUAGE)
        value = fallback
        for part in key.split("."):
            if not isinstance(value, dict):
                break
            value = value.get(part)  # type: ignore[assignment]

    if not isinstance(value, str):
        return key

    if kwargs:
        return value.format_map(kwargs)
    return value
