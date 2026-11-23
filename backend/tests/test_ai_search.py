from app.ai.search import expand_search_terms


def test_search_expands_common_rental_synonyms():
    assert expand_search_terms("bike") == [
        "bike",
        "bikes",
        "bicycle",
        "bicycles",
        "cycle",
        "cycles",
    ]


def test_search_expands_synonyms_inside_multiword_queries():
    assert "mountain bicycle" in expand_search_terms("Mountain Bike")
