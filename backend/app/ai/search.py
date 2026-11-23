import re


_SYNONYM_GROUPS = (
    ("bike", "bikes", "bicycle", "bicycles", "cycle", "cycles"),
    ("scooter", "scooters", "moped", "mopeds"),
    ("camera", "cameras", "camcorder", "camcorders"),
    ("speaker", "speakers", "loudspeaker", "loudspeakers"),
    ("microphone", "microphones", "mic", "mics"),
    ("laptop", "laptops", "notebook", "notebooks"),
    ("drone", "drones", "quadcopter", "quadcopters"),
    ("tv", "television", "televisions"),
)
_SYNONYMS = {
    term: group
    for group in _SYNONYM_GROUPS
    for term in group
}


def expand_search_terms(query: str) -> list[str]:
    normalized = " ".join(query.split()).casefold()
    if not normalized:
        return []

    variants = [normalized]
    for token in dict.fromkeys(re.findall(r"(?u)\b\w+\b", normalized)):
        for synonym in _SYNONYMS.get(token, ()):
            variant = re.sub(rf"\b{re.escape(token)}\b", synonym, normalized)
            if variant not in variants:
                variants.append(variant)
    return variants
