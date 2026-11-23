import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas import CreateRentalRequest, PaymentOrderRequest, RegisterRequest
from app.security import create_token

client = TestClient(app)


def test_registration_request_validates_email_and_password_confirmation():
    request = RegisterRequest(
        name="Test User",
        email="user@example.test",
        password="a-strong-password",
        confirmPassword="a-strong-password",
    )
    assert request.email == "user@example.test"
    with pytest.raises(ValidationError):
        RegisterRequest(name="Test User", email="invalid", password="a-strong-password")


def test_rental_request_rejects_nonpositive_intervals_and_duplicate_products():
    with pytest.raises(ValidationError):
        CreateRentalRequest(
            items=[{"product_id": 1}],
            start_datetime="2026-01-02T00:00:00Z",
            end_datetime="2026-01-01T00:00:00Z",
            duration_unit="day",
        )
    with pytest.raises(ValidationError):
        CreateRentalRequest(
            items=[{"product_id": 1}, {"product_id": 1}],
            start_datetime="2026-01-01T00:00:00Z",
            end_datetime="2026-01-02T00:00:00Z",
            duration_unit="day",
        )


def test_payment_request_normalizes_legacy_uppercase_payment_type():
    assert PaymentOrderRequest(payment_type="RENT").payment_type == "rent"


def test_root_and_openapi_are_available():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["documentation"]["openapi"] == "/docs"
    assert client.get("/openapi.json").status_code == 200


def test_protected_api_returns_compatible_unauthorized_shape():
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json() == {
        "success": False,
        "error": "Authentication failed: No token provided",
    }


def test_analysis_api_requires_admin_authentication():
    response = client.post(
        "/api/analysis/descriptive",
        json={"variable": "task_time_seconds", "values": [3, 5, None]},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False


def test_admin_dashboard_includes_total_seller_count(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-that-is-long-enough")
    monkeypatch.setattr(
        "app.main.database.fetch_one",
        lambda query, *args: {"count": 7, "total_revenue": 1250},
    )
    monkeypatch.setattr("app.main.database.fetch_all", lambda *args: [])
    token = create_token({"user_id": 1, "name": "Test Admin", "email": "admin@example.test", "role": "admin"})

    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["stats"]["total_sellers"] == 7


def test_admin_revenue_report_returns_revenue_breakdowns(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-that-is-long-enough")

    def fake_fetch_all(query, *args):
        if "DATE_FORMAT" in query:
            return [{"month": "2026-11", "monthly_total": 500, "transaction_count": 2}]
        if "payment_type" in query:
            return [{"payment_type": "rent", "total_amount": 500, "count": 2}]
        return [{
            "product_id": 4,
            "product_name": "Camera",
            "category_name": "Photography",
            "times_rented": 2,
            "total_revenue_generated": 500,
        }]

    monkeypatch.setattr("app.main.database.fetch_one", lambda *args: {"grand_total": 500})
    monkeypatch.setattr("app.main.database.fetch_all", fake_fetch_all)
    token = create_token({"user_id": 1, "name": "Test Admin", "email": "admin@example.test", "role": "admin"})

    response = client.get("/api/admin/revenue", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["total_revenue"] == 500
    assert body["monthly_revenue"][0]["month"] == "2026-11"
    assert body["revenue_by_type"][0]["payment_type"] == "rent"
    assert body["top_rented_products"][0]["product_id"] == 4


def test_admin_can_analyze_supplied_synthetic_observations(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-that-is-long-enough")
    token = create_token({"user_id": 1, "name": "Test Admin", "email": "admin@example.test", "role": "admin"})
    response = client.post(
        "/api/analysis/descriptive",
        headers={"Authorization": f"Bearer {token}"},
        json={"variable": "synthetic_task_time_seconds", "values": [5, 7, None, 9]},
    )
    assert response.status_code == 200
    assert response.json()["statistics"]["n"] == 3
    assert response.json()["statistics"]["missing"] == 1


def test_non_admin_cannot_run_analysis(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-that-is-long-enough")
    token = create_token({"user_id": 2, "name": "Test Customer", "email": "customer@example.test", "role": "customer"})
    response = client.post(
        "/api/analysis/descriptive",
        headers={"Authorization": f"Bearer {token}"},
        json={"values": [1, 2, 3]},
    )
    assert response.status_code == 403


def test_ai_product_recommendations_use_related_active_inventory(monkeypatch):
    products = [
        {
            "product_id": 1,
            "name": "Mirrorless camera",
            "category_name": "Photography",
            "description": "Camera body and lens for photography",
            "is_active": True,
            "rental_count": 0,
            "units_rented": 0,
        },
        {
            "product_id": 2,
            "name": "DSLR camera kit",
            "category_name": "Photography",
            "description": "Digital camera with interchangeable lens",
            "is_active": True,
            "rental_count": 0,
            "units_rented": 0,
        },
        {
            "product_id": 3,
            "name": "Mountain bicycle",
            "category_name": "Cycling",
            "description": "Trail bike with suspension",
            "is_active": True,
            "rental_count": 0,
            "units_rented": 0,
        },
    ]
    monkeypatch.setattr("app.main.product_query", lambda *args: products)
    monkeypatch.setattr("app.main.database.fetch_all", lambda *args: [])

    response = client.get("/api/ai/recommendations?product_id=1")

    assert response.status_code == 200
    body = response.json()
    assert body["strategy"] == "content_similarity"
    assert body["recommendations"][0]["product_id"] == 2


def test_frequently_rented_catalog_excludes_zero_rental_and_inactive_items(monkeypatch):
    products = [
        {"product_id": 1, "is_active": True, "rental_count": 0, "units_rented": 0},
        {"product_id": 2, "is_active": True, "rental_count": 3, "units_rented": 4},
        {"product_id": 3, "is_active": False, "rental_count": 10, "units_rented": 12},
    ]
    monkeypatch.setattr("app.main.product_query", lambda *args: products)
    monkeypatch.setattr(
        "app.main.database.fetch_all",
        lambda *args: [
            {"product_id": 2, "rental_count": 3, "units_rented": 4},
            {"product_id": 3, "rental_count": 10, "units_rented": 12},
        ],
    )

    response = client.get("/api/ai/frequently-rented")

    assert response.status_code == 200
    assert [item["product_id"] for item in response.json()["products"]] == [2]


def test_frequently_rented_orders_by_report_count_then_revenue(monkeypatch):
    products = [
        {"product_id": 1, "is_active": True},
        {"product_id": 2, "is_active": True},
        {"product_id": 3, "is_active": False},
    ]
    monkeypatch.setattr("app.main.product_query", lambda *args: products)
    monkeypatch.setattr(
        "app.main.database.fetch_all",
        lambda *args: [
            {"product_id": 1, "rental_count": 3, "total_revenue_generated": 100},
            {"product_id": 2, "rental_count": 3, "total_revenue_generated": 250},
            {"product_id": 3, "rental_count": 20, "total_revenue_generated": 1000},
        ],
    )

    response = client.get("/api/ai/frequently-rented")

    assert response.status_code == 200
    assert [product["product_id"] for product in response.json()["products"]] == [2, 1]


def test_catalog_search_passes_expanded_synonyms_to_product_query(monkeypatch):
    captured = {}

    def fake_product_query(where, params):
        captured["where"] = where
        captured["params"] = params
        return []

    monkeypatch.setattr("app.main.product_query", fake_product_query)

    response = client.get("/api/products", params={"search": "bike"})

    assert response.status_code == 200
    assert "%bike%" in captured["params"]
    assert "%bicycle%" in captured["params"]
