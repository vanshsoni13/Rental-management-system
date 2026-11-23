from math import log1p
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _product_text(product: dict[str, Any]) -> str:
    name = str(product.get("name") or "")
    category = str(product.get("category_name") or "")
    description = str(product.get("description") or "")
    return " ".join((name, name, category, category, description))


def recommend_products(
    products: list[dict[str, Any]],
    *,
    profile_product_ids: list[int],
    profile_weights: dict[int, int],
    limit: int,
    profile_label: str,
) -> list[dict[str, Any]]:
    active_products = [product for product in products if product.get("is_active")]
    if not active_products:
        return []

    products_by_id = {int(product["product_id"]): product for product in products}
    profile_products = [
        products_by_id[product_id]
        for product_id in profile_product_ids
        if product_id in products_by_id
    ]
    max_rentals = max((int(product.get("rental_count") or 0) for product in active_products), default=0)

    def popularity_score(product: dict[str, Any]) -> float:
        count = int(product.get("rental_count") or 0)
        return log1p(count) / log1p(max_rentals) if max_rentals else 0.0

    if profile_products:
        documents_by_id = {
            int(product["product_id"]): _product_text(product)
            for product in [*active_products, *profile_products]
        }
        product_ids = list(documents_by_id)
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            strip_accents="unicode",
            token_pattern=r"(?u)\b\w+\b",
        )
        vectors = vectorizer.fit_transform(documents_by_id.values())
        positions = {product_id: index for index, product_id in enumerate(product_ids)}

        profile_indices = [positions[int(product["product_id"])] for product in profile_products]
        weights = np.asarray(
            [max(1, int(profile_weights.get(int(product["product_id"]), 1))) for product in profile_products],
            dtype=float,
        )
        profile_vector = np.asarray(
            vectors[profile_indices].multiply(weights[:, None]).sum(axis=0)
        ).ravel().reshape(1, -1)
        candidate_indices = [positions[int(product["product_id"])] for product in active_products]
        similarity_scores = cosine_similarity(vectors[candidate_indices], profile_vector).ravel()
    else:
        similarity_scores = np.zeros(len(active_products), dtype=float)

    ranked = []
    for product, similarity in zip(active_products, similarity_scores):
        if int(product["product_id"]) in profile_product_ids:
            continue
        popularity = popularity_score(product)
        score = 0.85 * float(similarity) + 0.15 * popularity if profile_products else popularity
        item = dict(product)
        item["recommendation_score"] = round(score, 4)
        if profile_products and similarity >= 0.05:
            item["recommendation_reason"] = f"Similar to {profile_label}"
        elif int(product.get("rental_count") or 0) > 0:
            item["recommendation_reason"] = "Frequently rented"
        else:
            item["recommendation_reason"] = "Available in the catalog"
        ranked.append(item)

    ranked.sort(
        key=lambda item: (
            -item["recommendation_score"],
            -int(item.get("rental_count") or 0),
            -int(item["product_id"]),
        )
    )
    return ranked[:limit]
