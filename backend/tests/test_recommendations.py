from app.ai.recommendations import recommend_products


def product(product_id, name, category, description, rental_count=0, is_active=True):
    return {
        "product_id": product_id,
        "name": name,
        "category_name": category,
        "description": description,
        "rental_count": rental_count,
        "is_active": is_active,
    }


def test_content_recommendations_match_product_text_and_exclude_profile():
    catalog = [
        product(1, "Mirrorless camera", "Photography", "Camera body and lens for photography"),
        product(2, "DSLR camera kit", "Photography", "Digital camera with interchangeable lens"),
        product(3, "Mountain bicycle", "Cycling", "Trail bike with suspension"),
    ]

    recommendations = recommend_products(
        catalog,
        profile_product_ids=[1],
        profile_weights={1: 1},
        limit=2,
        profile_label="this item",
    )

    assert [item["product_id"] for item in recommendations] == [2, 3]
    assert recommendations[0]["recommendation_reason"] == "Similar to this item"


def test_cold_start_recommendations_rank_by_rental_popularity():
    catalog = [
        product(1, "Camera", "Photography", "Camera kit", rental_count=2),
        product(2, "Bike", "Cycling", "Mountain bicycle", rental_count=8),
        product(3, "Inactive item", "Other", "Not available", rental_count=100, is_active=False),
    ]

    recommendations = recommend_products(
        catalog,
        profile_product_ids=[],
        profile_weights={},
        limit=2,
        profile_label="your rental history",
    )

    assert [item["product_id"] for item in recommendations] == [2, 1]
    assert recommendations[0]["recommendation_reason"] == "Frequently rented"


def test_recommendations_return_empty_for_empty_active_catalog():
    result = recommend_products(
        [product(1, "Inactive item", "Other", "Not available", is_active=False)],
        profile_product_ids=[],
        profile_weights={},
        limit=4,
        profile_label="your rental history",
    )

    assert result == []
