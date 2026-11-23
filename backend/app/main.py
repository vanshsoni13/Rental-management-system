from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import hashlib
import hmac
import logging
import os
from pathlib import Path
import re
import secrets
from typing import Any
import uuid

import httpx
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pymysql.err import IntegrityError

from . import database
from .ai.recommendations import recommend_products
from .ai.search import expand_search_terms
from .analysis.statistics import correlation_analysis, descriptive_statistics, paired_task_time_test
from .config import BACKEND_DIR, cors_origins, required_setting
from .security import create_token, current_user, hash_password, optional_current_user, require_roles, seller_approved, verify_password
from .schemas import CashPaymentRequest, CreateRentalRequest, LoginRequest, PaymentOrderRequest, RegisterRequest, SellerRegistrationRequest

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("rental_management")
PRODUCT_IMAGES = BACKEND_DIR / "uploads" / "products"
PRODUCT_IMAGES.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(
    title="Rental Management System API",
    version="1.0.0",
    description="Python REST API for the existing RentHub React application.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    message = exc.detail if isinstance(exc.detail, str) else "Request validation failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": message},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    messages = [str(error.get("msg", "Invalid request")) for error in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "; ".join(messages)},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled API error for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )


@app.middleware("http")
async def secure_upload_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/uploads/"):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Content-Security-Policy"] = "default-src 'none'; sandbox"
    return response


app.mount("/uploads/products", StaticFiles(directory=PRODUCT_IMAGES), name="product-images")


def api_error(status: int, message: str) -> None:
    raise HTTPException(status_code=status, detail=message)


def as_dict(row: dict[str, Any] | None) -> dict[str, Any] | None:
    return jsonable_encoder(row) if row is not None else None


def as_float(value: Any) -> float:
    return float(value or 0)


def money(value: Any) -> Decimal:
    try:
        amount = Decimal(str(value))
        if not amount.is_finite():
            api_error(400, "A finite monetary amount is required")
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError) as exc:
        api_error(400, "A valid monetary amount is required")
        raise exc


def boolean_value(value: Any, *, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if value in (0, 1):
        return bool(value)
    if isinstance(value, str) and value.lower() in {"true", "false", "1", "0"}:
        return value.lower() in {"true", "1"}
    api_error(400, "A boolean value is required")
    return default


def validate_nonnegative_prices(payload: dict[str, Any]) -> tuple[Decimal, Decimal, Decimal, Decimal, Decimal, Decimal]:
    fields = ("price_hourly", "price_daily", "price_weekly", "price_monthly", "price_yearly", "deposit_amount")
    values = tuple(money(payload.get(field, 0)) for field in fields)
    if any(value < 0 for value in values):
        api_error(400, "Prices and deposit amounts must be non-negative")
    return values


def parse_datetime(value: Any, field: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        api_error(400, f"{field} is required")
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"{field} must be a valid ISO datetime") from exc


def notify(user_id: int, title: str, message: str, notification_type: str = "GENERAL", reference_id: Any = None, cursor: Any = None) -> None:
    sql = """
        INSERT INTO notifications (user_id, type, title, message, reference_id)
        VALUES (%s, %s, %s, %s, %s)
    """
    params = (user_id, notification_type, title, message, str(reference_id) if reference_id is not None else None)
    if cursor is not None:
        cursor.execute(sql, params)
    else:
        database.execute(sql, params)


def require_seller_ownership(product: dict[str, Any], user: dict[str, Any]) -> None:
    if user.get("role") != "admin" and product.get("created_by") != user.get("user_id"):
        api_error(403, "Access denied: You can only manage products you created")


def product_query(where: str = "", params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    return database.fetch_all(
        """
        SELECT p.product_id, p.category_id, p.name, p.description, p.image_url,
               p.total_quantity, p.price_hourly, p.price_daily, p.price_weekly,
               p.price_monthly, p.price_yearly, p.deposit_amount, p.is_active,
               p.created_at, p.updated_at, p.created_by, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        """ + where,
        params,
    )


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "success": True,
        "message": "Rental Management System REST API is running",
        "documentation": {
            "openapi": "/docs",
            "health": "/api/health",
            "auth": "/api/auth",
            "categories": "/api/categories",
            "products": "/api/products",
            "rentals": "/api/rentals",
            "payments": "/api/payments",
            "returns": "/api/returns",
            "invoices": "/api/invoices",
            "late_fees": "/api/late-fees",
            "security_deposits": "/api/security-deposits",
            "notifications": "/api/notifications",
            "admin": "/api/admin",
            "customer": "/api/customer",
        },
    }


@app.get("/api/health")
def health() -> JSONResponse:
    connected = False
    try:
        database.fetch_one("SELECT 1 AS connected")
        connected = True
    except Exception:
        logger.exception("Health check could not reach MySQL")
    payload = {
        "success": connected,
        "message": "Backend is running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "Rental Management System API",
        "version": "1.0.0",
        "database": {
            "connected": connected,
            "host": os.getenv("DB_HOST", "localhost"),
            "name": os.getenv("DB_NAME", "rental_management_db"),
            "error": None if connected else "Database unavailable",
        },
    }
    return JSONResponse(status_code=200 if connected else 503, content=payload)


@app.post("/api/auth/register", status_code=201)
def register(request_body: RegisterRequest) -> dict[str, Any]:
    payload = request_body.model_dump()
    name = str(payload.get("name") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    password = payload.get("password")
    phone = str(payload.get("phone") or "").strip() or None
    if not name or not email or not password:
        api_error(400, "Name, email, and password are required")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        api_error(400, "Please enter a valid email address")
    if not isinstance(password, str) or len(password) < 6:
        api_error(400, "Password must be at least 6 characters long")
    if len(password.encode("utf-8")) > 72:
        api_error(400, "Password must be no more than 72 UTF-8 bytes")
    if payload.get("confirmPassword") and payload["confirmPassword"] != password:
        api_error(400, "Password confirmation does not match")
    existing = database.fetch_one("SELECT user_id FROM users WHERE email = %s", (email,))
    if existing:
        api_error(400, "Registration failed: Email is already registered")
    role = "customer"
    token_user = {"user_id": 0, "name": name, "email": email, "role": role}
    try:
        with database.transaction() as (_, cursor):
            cursor.execute(
                "INSERT INTO users (name, email, password, phone, role, auth_provider) VALUES (%s, %s, %s, %s, %s, 'EMAIL')",
                (name, email, hash_password(password), phone, role),
            )
            user_id = int(cursor.lastrowid)
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail="Registration failed: Email is already registered") from exc
    token_user["user_id"] = user_id
    return {
        "success": True,
        "message": "Customer account registered successfully",
        "token": create_token(token_user),
        "user": {
            "user_id": user_id,
            "name": name,
            "email": email,
            "phone": phone,
            "role": role,
            "auth_provider": "EMAIL",
            "profile_image": None,
        },
    }


@app.post("/api/auth/login")
def login(request_body: LoginRequest) -> dict[str, Any]:
    payload = request_body.model_dump()
    email = str(payload.get("email") or "").strip().lower()
    password = payload.get("password")
    if not email or not password:
        api_error(400, "Email and password are required")
    user = database.fetch_one("SELECT * FROM users WHERE email = %s", (email,))
    if not user or not verify_password(str(password), user.get("password")):
        api_error(401, "Invalid email or password.")
    token = create_token(user)
    user_data = {key: user.get(key) for key in ("user_id", "name", "email", "phone", "role", "auth_provider", "profile_image", "created_at")}
    user_data["auth_provider"] = user_data.get("auth_provider") or "EMAIL"
    return {"success": True, "message": "Login successful", "token": token, "user": user_data}


@app.get("/api/auth/me")
def get_profile(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    profile = database.fetch_one(
        "SELECT user_id, name, email, phone, role, auth_provider, profile_image, created_at FROM users WHERE user_id = %s",
        (user["user_id"],),
    )
    if not profile:
        api_error(404, "User profile not found")
    return {"success": True, "user": profile}


@app.get("/api/categories")
def get_categories() -> dict[str, Any]:
    categories = database.fetch_all("SELECT * FROM categories ORDER BY name ASC")
    return {"success": True, "count": len(categories), "categories": categories}


@app.post("/api/categories", status_code=201)
def create_category(payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    name = str(payload.get("name") or "").strip()
    if not name:
        api_error(400, "Category name is required")
    if database.fetch_one("SELECT category_id FROM categories WHERE name = %s", (name,)):
        api_error(400, "Category name already exists")
    category_id = database.execute(
        "INSERT INTO categories (name, description, image_url) VALUES (%s, %s, %s)",
        (name, payload.get("description") or None, payload.get("image_url") or None),
    )
    return {"success": True, "message": "Category created successfully", "category": {
        "category_id": category_id, "name": name, "description": payload.get("description") or None,
        "image_url": payload.get("image_url") or None,
    }}


@app.put("/api/categories/{category_id}")
def update_category(category_id: int, payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    name = str(payload.get("name") or "").strip()
    existing = database.fetch_one("SELECT category_id FROM categories WHERE category_id = %s", (category_id,))
    if not existing:
        api_error(404, "Category not found")
    if not name:
        api_error(400, "Category name is required")
    try:
        database.execute(
            "UPDATE categories SET name = %s, description = %s, image_url = %s WHERE category_id = %s",
            (name, payload.get("description") or None, payload.get("image_url") or None, category_id),
        )
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail="Category name already exists") from exc
    return {"success": True, "message": "Category updated successfully", "category": {
        "category_id": category_id, "name": name, "description": payload.get("description") or None,
        "image_url": payload.get("image_url") or None,
    }}


@app.delete("/api/categories/{category_id}")
def delete_category(category_id: int, _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    if not database.fetch_one("SELECT category_id FROM categories WHERE category_id = %s", (category_id,)):
        api_error(404, "Category not found")
    if database.fetch_one("SELECT product_id FROM products WHERE category_id = %s LIMIT 1", (category_id,)):
        api_error(400, "Cannot delete category containing existing products. Reassign or delete products first.")
    database.execute("DELETE FROM categories WHERE category_id = %s", (category_id,))
    return {"success": True, "message": "Category deleted successfully"}


@app.get("/api/products")
def get_products(
    category_id: int | None = None,
    search: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    active_only: str = "true",
    user: dict[str, Any] | None = Depends(optional_current_user),
) -> dict[str, Any]:
    search = search.strip() if search else None
    if active_only == "false":
        if not user:
            api_error(401, "Authentication failed: No token provided")
        if user.get("role") != "admin":
            api_error(403, "Access denied: insufficient permissions")
    clauses = ["WHERE 1=1"] if active_only == "false" else ["WHERE p.is_active = TRUE"]
    params: list[Any] = []
    if category_id is not None:
        clauses.append("AND p.category_id = %s")
        params.append(category_id)
    if search:
        search_clauses = []
        for term in expand_search_terms(search):
            search_clauses.append("(p.name LIKE %s OR p.description LIKE %s)")
            params.extend((f"%{term}%", f"%{term}%"))
        clauses.append("AND (" + " OR ".join(search_clauses) + ")")
    if min_price is not None:
        clauses.append("AND p.price_daily >= %s")
        params.append(min_price)
    if max_price is not None:
        clauses.append("AND p.price_daily <= %s")
        params.append(max_price)
    products = product_query(" ".join(clauses) + " ORDER BY p.product_id DESC", tuple(params))
    return {"success": True, "count": len(products), "products": products}


@app.get("/api/products/mine")
def get_my_products(user: dict[str, Any] = Depends(seller_approved)) -> dict[str, Any]:
    products = product_query("WHERE p.created_by = %s ORDER BY p.product_id DESC", (user["user_id"],))
    return {"success": True, "count": len(products), "products": products}


@app.get("/api/products/mine/{product_id}")
def get_my_product(product_id: int, user: dict[str, Any] = Depends(seller_approved)) -> dict[str, Any]:
    rows = product_query("WHERE p.product_id = %s AND p.created_by = %s", (product_id, user["user_id"]))
    if not rows:
        api_error(404, "Product not found")
    return {"success": True, "product": rows[0]}


@app.get("/api/products/{product_id}/availability")
def check_availability(
    product_id: int,
    start_datetime: str,
    end_datetime: str,
    quantity: int = Query(default=1, ge=1),
) -> dict[str, Any]:
    start, end = parse_datetime(start_datetime, "start_datetime"), parse_datetime(end_datetime, "end_datetime")
    if end <= start:
        api_error(400, "Invalid date format or end_datetime must be strictly after start_datetime")
    product = database.fetch_one(
        "SELECT product_id, name, total_quantity, is_active FROM products WHERE product_id = %s",
        (product_id,),
    )
    if not product:
        api_error(404, "Product not found")
    if not product["is_active"]:
        return {"success": True, "is_available": False, "message": "Product is currently inactive and unavailable for rent", "available_quantity": 0, "total_quantity": product["total_quantity"]}
    overlap = database.fetch_one(
        """SELECT COALESCE(SUM(ri.quantity), 0) AS rented_quantity
           FROM rental_items ri JOIN rentals r ON r.rental_id = ri.rental_id
           WHERE ri.product_id = %s AND r.status IN ('pending', 'approved', 'active')
             AND r.start_datetime < %s AND r.end_datetime > %s""",
        (product_id, end, start),
    )
    rented = int(overlap["rented_quantity"] or 0)
    available = max(0, int(product["total_quantity"]) - rented)
    return {
        "success": True, "product_id": product_id, "product_name": product["name"],
        "total_quantity": product["total_quantity"], "rented_quantity": rented,
        "available_quantity": available, "requested_quantity": quantity,
        "is_available": available >= quantity,
        "period": {"start_datetime": start_datetime, "end_datetime": end_datetime},
    }


@app.get("/api/products/{product_id}")
def get_product(product_id: int) -> dict[str, Any]:
    rows = product_query("WHERE p.product_id = %s", (product_id,))
    if not rows:
        api_error(404, "Product not found")
    return {"success": True, "product": rows[0]}


def ai_catalog_data() -> list[dict[str, Any]]:
    products = product_query("ORDER BY p.product_id DESC")
    rental_counts = database.fetch_all(
        """SELECT ri.product_id, COUNT(ri.rental_item_id) AS rental_count,
                  COALESCE(SUM(ri.subtotal), 0) AS total_revenue_generated
           FROM rental_items ri
           GROUP BY ri.product_id"""
    )
    counts_by_product = {
        int(row["product_id"]): row
        for row in rental_counts
    }
    for product in products:
        rental_stats = counts_by_product.get(int(product["product_id"]), {})
        product["rental_count"] = int(rental_stats.get("rental_count") or 0)
        product["total_revenue_generated"] = rental_stats.get("total_revenue_generated") or 0
    return products


@app.get("/api/ai/frequently-rented")
def frequently_rented_products(limit: int = Query(default=8, ge=1, le=20)) -> dict[str, Any]:
    products = [
        product
        for product in ai_catalog_data()
        if product.get("is_active") and int(product["rental_count"]) > 0
    ]
    products.sort(
        key=lambda product: (
            -int(product["rental_count"]),
            -float(product["total_revenue_generated"]),
            -int(product["product_id"]),
        )
    )
    return {
        "success": True,
        "basis": "Rental count and revenue, matching the admin report",
        "products": products[:limit],
    }


@app.get("/api/ai/recommendations")
def ai_recommendations(
    product_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=4, ge=1, le=12),
    user: dict[str, Any] | None = Depends(optional_current_user),
) -> dict[str, Any]:
    products = ai_catalog_data()
    profile_product_ids: list[int] = []
    profile_weights: dict[int, int] = {}
    profile_label = "your rental history"
    strategy = "popular_catalog"

    if product_id is not None:
        if not any(int(product["product_id"]) == product_id for product in products):
            api_error(404, "Product not found")
        profile_product_ids = [product_id]
        profile_weights[product_id] = 1
        profile_label = "this item"
        strategy = "content_similarity"
    elif user and user.get("role") == "customer":
        history = database.fetch_all(
            """SELECT ri.product_id, COUNT(DISTINCT r.rental_id) AS rental_count
               FROM rentals r
               JOIN rental_items ri ON ri.rental_id = r.rental_id
               WHERE r.user_id = %s
                 AND LOWER(r.status) IN ('approved', 'active', 'completed')
               GROUP BY ri.product_id""",
            (user["user_id"],),
        )
        profile_product_ids = [int(row["product_id"]) for row in history]
        profile_weights = {
            int(row["product_id"]): int(row["rental_count"])
            for row in history
        }
        if profile_product_ids:
            strategy = "personalized_content_similarity"
    if strategy == "popular_catalog" and not any(int(product["rental_count"]) > 0 for product in products):
        strategy = "catalog_fallback"

    recommendations = recommend_products(
        products,
        profile_product_ids=profile_product_ids,
        profile_weights=profile_weights,
        limit=limit,
        profile_label=profile_label,
    )
    return {
        "success": True,
        "strategy": strategy,
        "model": "TF-IDF content similarity with rental-popularity ranking",
        "recommendations": recommendations,
    }


@app.post("/api/products/upload-image", status_code=201)
async def upload_product_image(
    image: UploadFile = File(...),
    user: dict[str, Any] = Depends(require_roles("admin", "seller")),
) -> dict[str, Any]:
    if user.get("role") == "seller":
        seller_approved(user)
    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        api_error(400, "Only JPG, JPEG, PNG, and WEBP images are accepted")
    content = await image.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        api_error(400, "Image size must not exceed 5 MB")
    if not content:
        api_error(400, "Uploaded image is empty")
    valid_signature = (
        (suffix in {".jpg", ".jpeg"} and content.startswith(b"\xff\xd8\xff"))
        or (suffix == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (suffix == ".webp" and content.startswith(b"RIFF") and content[8:12] == b"WEBP")
    )
    if not valid_signature:
        api_error(400, "Image content does not match its file type")
    filename = f"product_{uuid.uuid4().hex}{suffix}"
    (PRODUCT_IMAGES / filename).write_bytes(content)
    return {"success": True, "message": "Product image uploaded successfully", "image_url": f"/uploads/products/{filename}"}


@app.post("/api/products", status_code=201)
def create_product(payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("admin", "seller"))) -> dict[str, Any]:
    if user.get("role") == "seller":
        seller_approved(user)
    try:
        category_id = int(payload.get("category_id"))
        quantity = int(payload.get("total_quantity", 1))
    except (TypeError, ValueError):
        api_error(400, "Valid category_id and total_quantity are required")
    name = str(payload.get("name") or "").strip()
    description = str(payload.get("description") or "").strip()
    if not name or not description or quantity < 0:
        api_error(400, "Product name, description, and a non-negative total_quantity are required")
    if not database.fetch_one("SELECT category_id FROM categories WHERE category_id = %s", (category_id,)):
        api_error(400, "Invalid category_id: Category does not exist")
    hourly, daily, weekly, monthly, yearly, deposit = validate_nonnegative_prices(payload)
    product_id = database.execute(
        """INSERT INTO products
           (category_id, name, description, image_url, total_quantity, price_hourly, price_daily,
            price_weekly, price_monthly, price_yearly, deposit_amount, is_active, created_by)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (category_id, name, description, payload.get("image_url") or None, quantity,
         hourly, daily, weekly, monthly, yearly, deposit,
         boolean_value(payload.get("is_active"), default=True), user["user_id"]),
    )
    return {"success": True, "message": "Product created successfully", "product_id": product_id}


@app.put("/api/products/{product_id}")
def update_product(product_id: int, payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("admin", "seller"))) -> dict[str, Any]:
    if user.get("role") == "seller":
        seller_approved(user)
    existing = database.fetch_one("SELECT * FROM products WHERE product_id = %s", (product_id,))
    if not existing:
        api_error(404, "Product not found")
    require_seller_ownership(existing, user)
    try:
        quantity = int(payload.get("total_quantity", existing["total_quantity"]))
        category_id = int(payload.get("category_id", existing["category_id"]))
    except (TypeError, ValueError):
        api_error(400, "Valid category_id and total_quantity are required")
    if quantity < 0 or not str(payload.get("name") or "").strip() or not str(payload.get("description") or "").strip():
        api_error(400, "Product name, description, and a non-negative total_quantity are required")
    if not database.fetch_one("SELECT category_id FROM categories WHERE category_id=%s", (category_id,)):
        api_error(400, "Invalid category_id: Category does not exist")
    reserved = database.fetch_one(
        "SELECT COALESCE(SUM(ri.quantity), 0) AS reserved FROM rental_items ri JOIN rentals r ON r.rental_id = ri.rental_id WHERE ri.product_id = %s AND r.status IN ('pending', 'approved', 'active')",
        (product_id,),
    )
    if quantity < int(reserved["reserved"] or 0):
        api_error(400, f"Total stock cannot be lower than the {reserved['reserved']} unit(s) reserved in pending or active rentals")
    hourly, daily, weekly, monthly, yearly, deposit = validate_nonnegative_prices(payload)
    database.execute(
        """UPDATE products SET category_id=%s, name=%s, description=%s, image_url=%s, total_quantity=%s,
           price_hourly=%s, price_daily=%s, price_weekly=%s, price_monthly=%s, price_yearly=%s,
           deposit_amount=%s, is_active=%s WHERE product_id=%s""",
        (category_id, payload["name"].strip(), payload["description"].strip(), payload.get("image_url") or None,
         quantity, hourly, daily, weekly, monthly, yearly, deposit,
         boolean_value(payload.get("is_active"), default=True), product_id),
    )
    return {"success": True, "message": "Product updated successfully"}


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, user: dict[str, Any] = Depends(require_roles("admin", "seller"))) -> dict[str, Any]:
    if user.get("role") == "seller":
        seller_approved(user)
    with database.transaction() as (_, cursor):
        cursor.execute("SELECT * FROM products WHERE product_id = %s FOR UPDATE", (product_id,))
        product = cursor.fetchone()
        if not product:
            api_error(404, "Product not found")
        require_seller_ownership(product, user)
        cursor.execute("SELECT rental_item_id FROM rental_items WHERE product_id = %s LIMIT 1", (product_id,))
        if cursor.fetchone():
            cursor.execute("UPDATE products SET is_active = FALSE WHERE product_id = %s", (product_id,))
            return {"success": True, "message": "Product has rental history so it was deactivated instead of deleted"}
        cursor.execute("DELETE FROM products WHERE product_id = %s", (product_id,))
    return {"success": True, "message": "Product deleted successfully"}


def duration_count(start: datetime, end: datetime, unit: str) -> int:
    hours = (end - start).total_seconds() / 3600
    divisor = {"hour": 1, "day": 24, "week": 168, "month": 720, "year": 8760}.get(unit)
    if divisor is None:
        api_error(400, "Valid duration_unit is required")
    if hours <= 0:
        api_error(400, "Invalid dates: end_datetime must be strictly after start_datetime")
    return max(1, int((hours + divisor - 1e-10) // divisor))


@app.post("/api/rentals", status_code=201)
def create_rental(request_body: CreateRentalRequest, user: dict[str, Any] = Depends(require_roles("customer", "seller"))) -> dict[str, Any]:
    payload = request_body.model_dump(mode="json")
    items = payload.get("items")
    if not isinstance(items, list) or not items:
        api_error(400, "Rental booking must contain at least one item")
    start_text, end_text, unit = payload.get("start_datetime"), payload.get("end_datetime"), payload.get("duration_unit")
    start, end = parse_datetime(start_text, "start_datetime"), parse_datetime(end_text, "end_datetime")
    if not isinstance(unit, str) or unit.lower() not in {"hour", "day", "week", "month", "year"}:
        api_error(400, "Valid duration_unit is required")
    unit = unit.lower()
    count = duration_count(start, end, unit)
    if any(not isinstance(item, dict) for item in items):
        api_error(400, "Each rental item must be an object")
    try:
        product_ids = [int(item.get("product_id")) for item in items]
    except (TypeError, ValueError):
        api_error(400, "Valid product_id is required for every item")
    if len(set(product_ids)) != len(items):
        api_error(400, "A product may only appear once in the rental items")
    total = Decimal("0.00")
    deposit_total = Decimal("0.00")
    processed: list[dict[str, Any]] = []
    booking_number = f"RNT-{datetime.now():%Y%m%d}-{secrets.token_hex(3).upper()}"
    try:
        with database.transaction() as (_, cursor):
            for item in items:
                try:
                    product_id, quantity = int(item.get("product_id")), int(item.get("quantity", 1))
                except (TypeError, ValueError, AttributeError):
                    api_error(400, "Valid product_id and quantity are required")
                if quantity < 1:
                    api_error(400, "Quantity must be at least 1")
                cursor.execute("SELECT * FROM products WHERE product_id=%s FOR UPDATE", (product_id,))
                product = cursor.fetchone()
                if not product:
                    api_error(404, f"Product ID {product_id} not found")
                if not product["is_active"]:
                    api_error(400, f'Product "{product["name"]}" is currently inactive')
                cursor.execute(
                    """SELECT COALESCE(SUM(ri.quantity), 0) AS rented_quantity
                       FROM rental_items ri JOIN rentals r ON r.rental_id=ri.rental_id
                       WHERE ri.product_id=%s AND r.status IN ('pending','approved','active')
                         AND r.start_datetime < %s AND r.end_datetime > %s""",
                    (product_id, end, start),
                )
                rented = int(cursor.fetchone()["rented_quantity"] or 0)
                available = int(product["total_quantity"]) - rented
                if quantity > available:
                    api_error(400, f'Overbooking prevented: Product "{product["name"]}" has only {available} unit(s) available for the selected dates (requested {quantity}).')
                rate = money(product.get(f"price_{unit}", 0))
                subtotal = rate * count * quantity
                deposit = money(product.get("deposit_amount", 0)) * quantity
                total += subtotal
                deposit_total += deposit
                processed.append({
                    "product_id": product_id, "product_name": product["name"], "quantity": quantity,
                    "unit_price": rate, "subtotal": subtotal, "security_deposit": deposit,
                })
            final_total = (total + deposit_total).quantize(Decimal("0.01"))
            cursor.execute(
                """INSERT INTO rentals (user_id, booking_number, start_datetime, end_datetime, duration_unit,
                   total_amount, security_deposit, status, payment_status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,'pending','pending')""",
                (user["user_id"], booking_number, start, end, unit, final_total, deposit_total),
            )
            rental_id = int(cursor.lastrowid)
            for item in processed:
                cursor.execute(
                    "INSERT INTO rental_items (rental_id, product_id, quantity, unit_price, subtotal) VALUES (%s,%s,%s,%s,%s)",
                    (rental_id, item["product_id"], item["quantity"], item["unit_price"], item["subtotal"]),
                )
            notify(user["user_id"], "Booking Created", f"Your rental booking {booking_number} has been placed successfully and is pending approval.", cursor=cursor)
    except IntegrityError as exc:
        logger.exception("Rental booking transaction failed")
        raise HTTPException(status_code=500, detail="Failed to create rental booking") from exc
    return {
        "success": True, "message": "Rental booking created successfully",
        "booking": {
            "rental_id": rental_id, "booking_number": booking_number,
            "start_datetime": start_text, "end_datetime": end_text, "duration_unit": unit,
            "subtotal_amount": total, "security_deposit": deposit_total,
            "total_amount": final_total, "status": "pending", "payment_status": "pending",
            "items": processed,
        },
    }


@app.get("/api/rentals")
def get_rentals(
    status: str | None = None,
    payment_status: str | None = None,
    user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller")),
) -> dict[str, Any]:
    clauses, params = ["WHERE 1=1"], []
    select = "SELECT r.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone FROM rentals r JOIN users u ON r.user_id=u.user_id"
    if user["role"] != "admin":
        clauses.append("AND r.user_id=%s")
        params.append(user["user_id"])
    if status:
        clauses.append("AND r.status=%s")
        params.append(status)
    if payment_status:
        clauses.append("AND r.payment_status=%s")
        params.append(payment_status)
    rentals = database.fetch_all(select + " " + " ".join(clauses) + " ORDER BY r.rental_id DESC", tuple(params))
    return {"success": True, "count": len(rentals), "rentals": rentals}


@app.get("/api/rentals/{rental_id}")
def get_rental(rental_id: int, user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    rental = database.fetch_one(
        "SELECT r.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone FROM rentals r JOIN users u ON r.user_id=u.user_id WHERE r.rental_id=%s",
        (rental_id,),
    )
    if not rental:
        api_error(404, "Rental booking not found")
    if user["role"] != "admin" and int(rental["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied: You cannot view another customer’s rental")
    rental["items"] = database.fetch_all(
        "SELECT ri.*, p.name AS product_name, p.image_url FROM rental_items ri JOIN products p ON p.product_id=ri.product_id WHERE ri.rental_id=%s",
        (rental_id,),
    )
    rental["payments"] = database.fetch_all("SELECT * FROM payments WHERE rental_id=%s ORDER BY payment_id DESC", (rental_id,))
    returns = database.fetch_all(
        """SELECT ret.*, lf.overdue_hours, lf.calculated_fee AS late_fee, lf.status AS late_fee_status
           FROM returns ret LEFT JOIN late_fees lf ON lf.return_id=ret.return_id WHERE ret.rental_id=%s""",
        (rental_id,),
    )
    rental["return_details"] = returns[0] if returns else None
    return {"success": True, "rental": rental}


@app.put("/api/rentals/{rental_id}/status")
def update_rental_status(rental_id: int, payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    status = payload.get("status")
    allowed = {"pending", "approved", "active", "completed", "cancelled", "rejected"}
    if status not in allowed:
        api_error(400, f"Invalid status. Allowed values: [{', '.join(sorted(allowed))}]")
    rental = database.fetch_one("SELECT * FROM rentals WHERE rental_id=%s", (rental_id,))
    if not rental:
        api_error(404, "Rental booking not found")
    if user["role"] != "admin":
        if int(rental["user_id"]) != int(user["user_id"]):
            api_error(403, "Access denied: You cannot update another customer’s rental")
        if status != "cancelled" or rental["status"] != "pending":
            api_error(400, "Customers can only cancel bookings that are currently in pending status")
    with database.transaction() as (_, cursor):
        cursor.execute("UPDATE rentals SET status=%s WHERE rental_id=%s", (status, rental_id))
        notify(rental["user_id"], "Booking Status Updated", f'Your rental booking {rental["booking_number"]} status has been updated to "{status.upper()}".', cursor=cursor)
    return {"success": True, "message": f'Rental status updated to "{status}"', "rental_id": rental_id, "new_status": status}


@app.delete("/api/rentals/{rental_id}")
def delete_rental(rental_id: int, _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    if not database.fetch_one("SELECT rental_id FROM rentals WHERE rental_id=%s", (rental_id,)):
        api_error(404, "Rental booking not found")
    database.execute("DELETE FROM rentals WHERE rental_id=%s", (rental_id,))
    return {"success": True, "message": "Rental booking deleted successfully"}


def seller_profile_row(user_id: int) -> dict[str, Any] | None:
    return database.fetch_one(
        """SELECT sp.*, u.name, u.email, u.phone
           FROM seller_profiles sp JOIN users u ON u.user_id=sp.user_id
           WHERE sp.user_id=%s""",
        (user_id,),
    )


@app.post("/api/sellers/register", status_code=201)
def register_seller(request_body: SellerRegistrationRequest) -> dict[str, Any]:
    payload = request_body.model_dump()
    name = str(payload.get("name") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    password = payload.get("password")
    store_name = str(payload.get("store_name") or "").strip()
    pickup_address = str(payload.get("pickup_address") or "").strip()
    phone = str(payload.get("phone") or "").strip() or None
    store_description = str(payload.get("store_description") or "").strip() or None
    gstin = str(payload.get("gstin") or "").strip().upper() or None
    if not 2 <= len(name) <= 100 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        api_error(400, "A valid full name and email address are required")
    if not isinstance(password, str) or len(password) < 6:
        api_error(400, "Password must be at least 6 characters")
    if payload.get("confirmPassword") != password:
        api_error(400, "Password confirmation does not match")
    if len(store_name) < 2 or len(store_name) > 150 or len(pickup_address) < 5 or len(pickup_address) > 1000:
        api_error(400, "A valid store name and pickup address are required")
    if store_description and len(store_description) > 2000:
        api_error(400, "Store description must be 2000 characters or fewer")
    if gstin and not re.fullmatch(r"[0-9A-Z]{15}", gstin):
        api_error(400, "GSTIN must be 15 letters and digits")
    if database.fetch_one("SELECT user_id FROM users WHERE email=%s", (email,)):
        api_error(409, "Email is already registered")
    try:
        with database.transaction() as (_, cursor):
            cursor.execute(
                "INSERT INTO users (name,email,password,phone,role,auth_provider) VALUES (%s,%s,%s,%s,'seller','EMAIL')",
                (name, email, hash_password(password), phone),
            )
            user_id = int(cursor.lastrowid)
            cursor.execute(
                """INSERT INTO seller_profiles (user_id,store_name,store_description,pickup_address,gstin,status)
                   VALUES (%s,%s,%s,%s,%s,'pending')""",
                (user_id, store_name, store_description, pickup_address, gstin),
            )
            seller_id = int(cursor.lastrowid)
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Email is already registered") from exc
    user = {"user_id": user_id, "name": name, "email": email, "role": "seller"}
    return {
        "success": True,
        "message": "Seller application submitted for admin review",
        "token": create_token(user),
        "user": {"user_id": user_id, "name": name, "email": email, "phone": phone, "role": "seller", "seller_status": "pending"},
        "seller_id": seller_id,
    }


@app.get("/api/sellers/profile")
def get_seller_profile(user: dict[str, Any] = Depends(require_roles("seller"))) -> dict[str, Any]:
    profile = seller_profile_row(int(user["user_id"]))
    if not profile:
        api_error(404, "Seller profile not found")
    return {"success": True, "seller": profile}


@app.put("/api/sellers/profile")
def update_seller_profile(payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("seller"))) -> dict[str, Any]:
    store_name = str(payload.get("store_name") or "").strip()
    pickup_address = str(payload.get("pickup_address") or "").strip()
    store_description = str(payload.get("store_description") or "").strip() or None
    gstin = str(payload.get("gstin") or "").strip().upper() or None
    if len(store_name) < 2 or len(store_name) > 150 or len(pickup_address) < 5 or len(pickup_address) > 1000:
        api_error(400, "A valid store name and pickup address are required")
    if store_description and len(store_description) > 2000:
        api_error(400, "Store description must be 2000 characters or fewer")
    if gstin and not re.fullmatch(r"[0-9A-Z]{15}", gstin):
        api_error(400, "GSTIN must be 15 letters and digits")
    database.execute(
        "UPDATE seller_profiles SET store_name=%s,store_description=%s,pickup_address=%s,gstin=%s WHERE user_id=%s",
        (store_name, store_description, pickup_address, gstin, user["user_id"]),
    )
    return get_seller_profile(user)


@app.get("/api/admin/dashboard")
def admin_dashboard(_: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    revenue = database.fetch_one("SELECT COALESCE(SUM(amount),0) AS total_revenue FROM payments WHERE UPPER(status)='SUCCESS'")
    active = database.fetch_one("SELECT COUNT(*) AS count FROM rentals WHERE status='active'")
    pending = database.fetch_one("SELECT COUNT(*) AS count FROM rentals WHERE status='pending'")
    overdue = database.fetch_one("SELECT COUNT(*) AS count FROM rentals WHERE status='active' AND end_datetime<NOW()")
    sellers = database.fetch_one("SELECT COUNT(*) AS count FROM seller_profiles")
    customers = database.fetch_one("SELECT COUNT(*) AS count FROM users WHERE role='customer'")
    products = database.fetch_one("SELECT COUNT(*) AS count FROM products WHERE is_active=TRUE")
    recent = database.fetch_all(
        """SELECT r.rental_id,r.booking_number,r.start_datetime,r.end_datetime,r.total_amount,r.status,u.name AS customer_name
           FROM rentals r JOIN users u ON r.user_id=u.user_id ORDER BY r.rental_id DESC LIMIT 5"""
    )
    return {
        "success": True,
        "stats": {
            "total_revenue": as_float(revenue["total_revenue"]),
            "active_rentals": active["count"],
            "pending_rentals": pending["count"],
            "overdue_rentals": overdue["count"],
            "total_sellers": sellers["count"],
            "total_customers": customers["count"],
            "total_products": products["count"],
        },
        "recent_rentals": recent,
    }


@app.get("/api/admin/customers")
def admin_customers(_: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    customers = database.fetch_all(
        """SELECT u.user_id,u.name,u.email,u.phone,u.created_at,
                  COALESCE(r.total_bookings,0) AS total_bookings,COALESCE(r.total_spent,0) AS total_spent
           FROM users u LEFT JOIN (
             SELECT user_id,COUNT(*) AS total_bookings,SUM(total_amount) AS total_spent
             FROM rentals GROUP BY user_id
           ) r ON r.user_id=u.user_id
           WHERE u.role='customer' ORDER BY u.user_id DESC"""
    )
    return {"success": True, "count": len(customers), "customers": customers}


def filtered_rentals(status: str | None, payment_status: str | None, search: str | None) -> list[dict[str, Any]]:
    clauses, params = ["WHERE 1=1"], []
    if status:
        clauses.append("AND r.status=%s")
        params.append(status)
    if payment_status:
        clauses.append("AND r.payment_status=%s")
        params.append(payment_status)
    if search:
        clauses.append("AND (r.booking_number LIKE %s OR u.name LIKE %s OR u.email LIKE %s)")
        params.extend([f"%{search}%"] * 3)
    return database.fetch_all(
        """SELECT r.*,u.name AS customer_name,u.email AS customer_email,u.phone AS customer_phone
           FROM rentals r JOIN users u ON u.user_id=r.user_id """
        + " ".join(clauses) + " ORDER BY r.rental_id DESC",
        tuple(params),
    )


@app.get("/api/admin/rentals")
def admin_rentals(status: str | None = None, payment_status: str | None = None, search: str | None = None, _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    rentals = filtered_rentals(status, payment_status, search)
    return {"success": True, "count": len(rentals), "rentals": rentals}


@app.get("/api/admin/revenue")
def admin_revenue(_: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    total = database.fetch_one("SELECT COALESCE(SUM(amount),0) AS grand_total FROM payments WHERE UPPER(status)='SUCCESS'")
    monthly = database.fetch_all(
        """SELECT DATE_FORMAT(payment_date,'%%Y-%%m') AS month,SUM(amount) AS monthly_total,
                  COUNT(payment_id) AS transaction_count
           FROM payments WHERE UPPER(status)='SUCCESS' GROUP BY DATE_FORMAT(payment_date,'%%Y-%%m') ORDER BY month DESC"""
    )
    by_type = database.fetch_all(
        "SELECT payment_type,SUM(amount) AS total_amount,COUNT(payment_id) AS count FROM payments WHERE UPPER(status)='SUCCESS' GROUP BY payment_type"
    )
    top = database.fetch_all(
        """SELECT p.product_id,p.name AS product_name,c.name AS category_name,
                  COUNT(ri.rental_item_id) AS times_rented,COALESCE(SUM(ri.subtotal),0) AS total_revenue_generated
           FROM products p LEFT JOIN categories c ON p.category_id=c.category_id
           LEFT JOIN rental_items ri ON ri.product_id=p.product_id
           GROUP BY p.product_id,p.name,c.name
           ORDER BY times_rented DESC,total_revenue_generated DESC,p.product_id DESC LIMIT 5"""
    )
    return {"success": True, "total_revenue": as_float(total["grand_total"]), "monthly_revenue": monthly, "revenue_by_type": by_type, "top_rented_products": top}


@app.get("/api/customer/dashboard")
def customer_dashboard(user: dict[str, Any] = Depends(require_roles("customer"))) -> dict[str, Any]:
    stats = database.fetch_one(
        """SELECT COUNT(*) AS total_rentals,
                  SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active_rentals,
                  SUM(CASE WHEN status='active' AND end_datetime<NOW() THEN 1 ELSE 0 END) AS overdue_rentals
           FROM rentals WHERE user_id=%s""",
        (user["user_id"],),
    )
    spent = database.fetch_one(
        """SELECT COALESCE(SUM(amount),0) AS total_spent FROM payments
           WHERE UPPER(status)='SUCCESS' AND rental_id IN (SELECT rental_id FROM rentals WHERE user_id=%s)""",
        (user["user_id"],),
    )
    recent = database.fetch_all(
        """SELECT r.rental_id,r.booking_number,r.start_datetime,r.end_datetime,r.total_amount,r.status,
                  GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS product_names
           FROM rentals r LEFT JOIN rental_items ri ON ri.rental_id=r.rental_id
           LEFT JOIN products p ON p.product_id=ri.product_id WHERE r.user_id=%s
           GROUP BY r.rental_id,r.booking_number,r.start_datetime,r.end_datetime,r.total_amount,r.status
           ORDER BY r.rental_id DESC LIMIT 5""",
        (user["user_id"],),
    )
    return {
        "success": True,
        "stats": {
            "total_spent": as_float(spent["total_spent"]), "total_rentals": int(stats["total_rentals"] or 0),
            "active_rentals": int(stats["active_rentals"] or 0), "overdue_rentals": int(stats["overdue_rentals"] or 0),
        },
        "recent_rentals": recent,
    }


@app.get("/api/sellers/products")
def seller_products(user: dict[str, Any] = Depends(seller_approved)) -> dict[str, Any]:
    return get_my_products(user)


@app.get("/api/sellers/rentals")
def seller_rentals(status: str | None = None, user: dict[str, Any] = Depends(seller_approved)) -> dict[str, Any]:
    clauses, params = ["WHERE p.created_by=%s"], [user["user_id"]]
    if status:
        clauses.append("AND r.status=%s")
        params.append(status)
    rentals = database.fetch_all(
        """SELECT r.rental_id,r.booking_number,r.start_datetime,r.end_datetime,
                  CASE WHEN totals.items_subtotal>0 THEN SUM(ri.subtotal)/totals.items_subtotal*r.total_amount ELSE 0 END AS total_amount,
                  r.status,u.name AS customer_name
           FROM rentals r JOIN rental_items ri ON ri.rental_id=r.rental_id
           JOIN products p ON p.product_id=ri.product_id
           JOIN (SELECT rental_id,SUM(subtotal) AS items_subtotal FROM rental_items GROUP BY rental_id) totals ON totals.rental_id=r.rental_id
           JOIN users u ON u.user_id=r.user_id """
        + " ".join(clauses)
        + """ GROUP BY r.rental_id,r.booking_number,r.start_datetime,r.end_datetime,r.total_amount,r.status,u.name,totals.items_subtotal
             ORDER BY r.rental_id DESC""",
        tuple(params),
    )
    return {"success": True, "count": len(rentals), "rentals": rentals}


@app.get("/api/sellers/reports")
def seller_reports(user: dict[str, Any] = Depends(seller_approved)) -> dict[str, Any]:
    products = database.fetch_all(
        """SELECT p.product_id,p.name AS product_name,c.name AS category_name,
                  COUNT(ri.rental_item_id) AS times_rented,COALESCE(SUM(ri.subtotal),0) AS total_revenue_generated
           FROM products p LEFT JOIN categories c ON c.category_id=p.category_id
           LEFT JOIN rental_items ri ON ri.product_id=p.product_id
           WHERE p.created_by=%s GROUP BY p.product_id,p.name,c.name
           ORDER BY times_rented DESC,total_revenue_generated DESC LIMIT 5""",
        (user["user_id"],),
    )
    return {"success": True, "top_rented_products": products}


@app.get("/api/sellers/dashboard")
def seller_dashboard(user: dict[str, Any] = Depends(seller_approved)) -> dict[str, Any]:
    product_count = database.fetch_one("SELECT COUNT(*) AS total_products FROM products WHERE created_by=%s", (user["user_id"],))
    active = database.fetch_one(
        """SELECT COUNT(DISTINCT r.rental_id) AS count FROM rentals r JOIN rental_items ri ON ri.rental_id=r.rental_id
           JOIN products p ON p.product_id=ri.product_id WHERE p.created_by=%s AND r.status='active'""",
        (user["user_id"],),
    )
    overdue = database.fetch_one(
        """SELECT COUNT(DISTINCT r.rental_id) AS count FROM rentals r JOIN rental_items ri ON ri.rental_id=r.rental_id
           JOIN products p ON p.product_id=ri.product_id WHERE p.created_by=%s AND r.status='active' AND r.end_datetime<NOW()""",
        (user["user_id"],),
    )
    revenue = database.fetch_one(
        """SELECT COALESCE(SUM(
             CASE WHEN item_totals.items_subtotal>0
                  THEN COALESCE(paid.paid_amount,0)*owned.owner_subtotal/item_totals.items_subtotal
                  ELSE 0 END
           ),0) AS total_revenue
           FROM rentals r
           JOIN (
             SELECT ri.rental_id,SUM(ri.subtotal) AS owner_subtotal
             FROM rental_items ri JOIN products p ON p.product_id=ri.product_id
             WHERE p.created_by=%s GROUP BY ri.rental_id
           ) owned ON owned.rental_id=r.rental_id
           JOIN (
             SELECT rental_id,SUM(subtotal) AS items_subtotal FROM rental_items GROUP BY rental_id
           ) item_totals ON item_totals.rental_id=r.rental_id
           LEFT JOIN (
             SELECT rental_id,SUM(amount) AS paid_amount FROM payments
             WHERE UPPER(status) IN ('SUCCESS','PAID') GROUP BY rental_id
           ) paid ON paid.rental_id=r.rental_id
           WHERE r.status NOT IN ('cancelled','rejected')""",
        (user["user_id"],),
    )
    recent = seller_rentals(user=user)["rentals"][:5]
    return {
        "success": True,
        "stats": {"total_revenue": as_float(revenue["total_revenue"]), "active_rentals": int(active["count"] or 0), "overdue_rentals": int(overdue["count"] or 0), "total_products": product_count["total_products"]},
        "recent_rentals": recent,
    }


@app.get("/api/admin/sellers")
def get_seller_applications(status: str | None = None, _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    allowed = {"pending", "approved", "rejected", "suspended"}
    if status and status not in allowed:
        api_error(400, "Invalid seller status filter")
    where, params = ("WHERE sp.status=%s", (status,)) if status else ("", ())
    sellers = database.fetch_all(
        "SELECT sp.*,u.name,u.email,u.phone FROM seller_profiles sp JOIN users u ON u.user_id=sp.user_id " + where + " ORDER BY sp.created_at DESC",
        params,
    )
    return {"success": True, "count": len(sellers), "sellers": sellers}


@app.patch("/api/admin/sellers/{seller_id}/status")
def update_seller_status(seller_id: int, payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    status = payload.get("status")
    if status not in {"approved", "rejected", "suspended"}:
        api_error(400, "Status must be approved, rejected, or suspended")
    if len(str(payload.get("admin_notes") or "")) > 2000:
        api_error(400, "Admin note must be 2000 characters or fewer")
    profile = database.fetch_one("SELECT * FROM seller_profiles WHERE seller_id=%s", (seller_id,))
    if not profile:
        api_error(404, "Seller application not found")
    seller_number = profile.get("seller_number")
    if status == "approved" and seller_number is None:
        seller_number = secrets.randbelow(90_000_000) + 10_000_000
    database.execute(
        """UPDATE seller_profiles SET seller_number=%s,status=%s,admin_notes=%s,reviewed_by=%s,reviewed_at=CURRENT_TIMESTAMP
           WHERE seller_id=%s""",
        (seller_number, status, str(payload.get("admin_notes") or "").strip() or None, user["user_id"], seller_id),
    )
    return {"success": True, "message": f"Seller application {status}", "seller_id": seller_id, "seller_number": seller_number, "status": status}


def razorpay_credentials() -> tuple[str, str]:
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id.startswith("rzp_test_") or not key_secret:
        api_error(503, "Razorpay Test Mode credentials are not configured")
    return key_id, key_secret


def validate_rental_payment(rental_id: int, user: dict[str, Any], payment_type: str, amount: Decimal | None = None) -> tuple[dict[str, Any], Decimal]:
    rental = database.fetch_one("SELECT * FROM rentals WHERE rental_id=%s", (rental_id,))
    if not rental:
        api_error(404, "Rental booking not found")
    if user.get("role") != "admin" and int(rental["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied: Cannot create a payment for another customer’s rental")
    is_deposit = payment_type.lower() == "security_deposit"
    due = money(rental["security_deposit"] if is_deposit else rental["total_amount"])
    paid = database.fetch_one(
        """SELECT COALESCE(SUM(amount),0) AS total_paid FROM payments
           WHERE rental_id=%s AND UPPER(status) IN ('SUCCESS','PAID')
             AND (LOWER(payment_type)='security_deposit')=%s""",
        (rental_id, is_deposit),
    )
    outstanding = max(Decimal("0.00"), due - money(paid["total_paid"]))
    if outstanding <= 0:
        api_error(400, "This rental payment is already fully paid")
    selected = outstanding if amount is None or payment_type.lower() == "full" else money(amount)
    if selected <= 0:
        api_error(400, "Payment amount must be greater than zero")
    if selected > outstanding:
        api_error(400, "Payment amount cannot exceed the outstanding amount for this rental")
    return rental, selected


@app.post("/api/payments/create-order", status_code=201)
def create_payment_order(request_body: PaymentOrderRequest, user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    payload = request_body.model_dump(exclude_none=True)
    payment_type = str(payload.get("payment_type") or "RENT").lower()
    valid_types = {"rent", "full", "partial", "security_deposit", "late_fee", "invoice", "other"}
    if payment_type not in valid_types:
        api_error(400, "A valid payment type and amount greater than zero are required")
    if not payload.get("rental_id"):
        amount = money(payload.get("amount"))
        if amount <= 0:
            api_error(400, "Payment amount must be greater than zero")
        rental = None
        payment_user_id = user["user_id"]
        if payload.get("invoice_id"):
            invoice = database.fetch_one("SELECT invoice_id,user_id,total_amount,status FROM invoices WHERE invoice_id=%s", (payload["invoice_id"],))
            if not invoice:
                api_error(404, "Invoice not found")
            if user["role"] != "admin" and int(invoice["user_id"]) != int(user["user_id"]):
                api_error(403, "Access denied: Cannot create a payment for another customer’s invoice")
            if str(invoice["status"]).upper() in {"PAID", "CANCELLED"}:
                api_error(400, f"Invoice status is {invoice['status']}; no payment is due")
            paid = database.fetch_one(
                "SELECT COALESCE(SUM(amount),0) AS total_paid FROM payments WHERE invoice_id=%s AND UPPER(status) IN ('SUCCESS','PAID')",
                (invoice["invoice_id"],),
            )
            outstanding = max(Decimal("0.00"), money(invoice["total_amount"]) - money(paid["total_paid"]))
            if amount > outstanding:
                api_error(400, "Payment amount cannot exceed the outstanding amount for this invoice")
            payment_user_id = invoice["user_id"]
    else:
        rental, amount = validate_rental_payment(
            int(payload["rental_id"]), user, payment_type,
            money(payload["amount"]) if payment_type != "full" else None,
        )
        payment_user_id = rental["user_id"]
    try:
        key_id, key_secret = razorpay_credentials()
        response = httpx.post(
            "https://api.razorpay.com/v1/orders",
            auth=(key_id, key_secret),
            json={
                "amount": int(amount * 100),
                "currency": "INR",
                "receipt": f"rcpt_{secrets.token_hex(8)}",
                "notes": {**(payload.get("notes") or {}), "user_id": str(payment_user_id), "payment_type": payment_type},
            },
            timeout=15,
        )
        response.raise_for_status()
        order = response.json()
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Razorpay order creation failed")
        raise HTTPException(status_code=502, detail="Failed to create Razorpay order. Check the Test Mode credentials and try again.") from exc

    transaction_id = f"TXN-RZP-{int(datetime.now().timestamp() * 1000)}-{secrets.token_hex(2).upper()}"
    payment_id = database.execute(
        """INSERT INTO payments
           (rental_id,user_id,invoice_id,transaction_id,amount,payment_type,payment_method,status,razorpay_order_id)
           VALUES (%s,%s,%s,%s,%s,%s,'razorpay','PENDING',%s)""",
        (rental["rental_id"] if rental else None, payment_user_id, payload.get("invoice_id"), transaction_id, amount, payment_type, order["id"]),
    )
    return {
        "success": True, "message": "Razorpay payment order created successfully", "payment_id": payment_id,
        "order_id": order["id"], "amount": order["amount"], "currency": order["currency"],
        "key_id": key_id, "transaction_id": transaction_id, "payment_type": payment_type, "status": "PENDING",
    }


@app.post("/api/payments/verify")
def verify_payment(payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    order_id = payload.get("razorpay_order_id")
    razorpay_payment_id = payload.get("razorpay_payment_id")
    signature = payload.get("razorpay_signature")
    if not order_id or not razorpay_payment_id or not signature:
        api_error(400, "Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)")
    secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not secret:
        api_error(503, "Razorpay Test Mode credentials are not configured")
    expected = hmac.new(secret.encode(), f"{order_id}|{razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, str(signature)):
        return JSONResponse(status_code=400, content={"success": False, "verified": False, "error": "Payment verification failed: Invalid Razorpay signature."})
    payment = database.fetch_one("SELECT * FROM payments WHERE razorpay_order_id=%s", (order_id,))
    if not payment:
        api_error(404, "Payment order record not found")
    if user["role"] != "admin" and int(payment["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied for this payment order")
    if payload.get("payment_id") and int(payload["payment_id"]) != int(payment["payment_id"]):
        api_error(400, "Payment record does not match the Razorpay order")
    if str(payment["status"]).upper() == "SUCCESS":
        if payment.get("razorpay_payment_id") != razorpay_payment_id:
            api_error(409, "This order was already completed with another payment")
        return {"success": True, "verified": True, "message": "Payment was already processed", "payment": {
            "payment_id": payment["payment_id"], "transaction_id": payment["transaction_id"],
            "razorpay_order_id": order_id, "razorpay_payment_id": razorpay_payment_id,
            "amount": as_float(payment["amount"]), "payment_type": payment["payment_type"], "status": "SUCCESS",
        }}
    if str(payment["status"]).upper() != "PENDING":
        api_error(409, "This payment order is no longer pending")
    try:
        key_id, key_secret = razorpay_credentials()
        with httpx.Client(auth=(key_id, key_secret), timeout=15) as client:
            order_response = client.get(f"https://api.razorpay.com/v1/orders/{order_id}")
            payment_response = client.get(f"https://api.razorpay.com/v1/payments/{razorpay_payment_id}")
            order_response.raise_for_status()
            payment_response.raise_for_status()
            order = order_response.json()
            gateway_payment = payment_response.json()
    except Exception as exc:
        logger.exception("Razorpay payment fetch failed")
        raise HTTPException(status_code=502, detail="Could not confirm payment status with Razorpay") from exc
    expected_amount = int(money(payment["amount"]) * 100)
    if (
        order.get("id") != order_id or order.get("amount") != expected_amount
        or order.get("currency") != "INR" or order.get("status") != "paid"
        or gateway_payment.get("id") != razorpay_payment_id
        or gateway_payment.get("order_id") != order_id
        or gateway_payment.get("amount") != expected_amount
        or gateway_payment.get("currency") != "INR"
        or gateway_payment.get("status") != "captured"
    ):
        return JSONResponse(status_code=400, content={"success": False, "verified": False, "error": "Razorpay payment is not a captured payment for this order and amount."})
    try:
        with database.transaction() as (_, cursor):
            cursor.execute("SELECT * FROM payments WHERE payment_id=%s FOR UPDATE", (payment["payment_id"],))
            locked = cursor.fetchone()
            if locked and str(locked["status"]).upper() == "SUCCESS":
                if locked.get("razorpay_payment_id") != razorpay_payment_id:
                    api_error(409, "This order was already completed with another payment")
                return {"success": True, "verified": True, "message": "Payment was already processed", "payment": {
                    "payment_id": locked["payment_id"], "transaction_id": locked["transaction_id"],
                    "razorpay_order_id": order_id, "razorpay_payment_id": razorpay_payment_id,
                    "amount": as_float(locked["amount"]), "payment_type": locked["payment_type"], "status": "SUCCESS",
                }}
            if not locked or str(locked["status"]).upper() != "PENDING":
                api_error(409, "This payment order is no longer pending")
            cursor.execute(
                "UPDATE payments SET status='SUCCESS',razorpay_payment_id=%s,razorpay_signature=%s WHERE payment_id=%s",
                (razorpay_payment_id, signature, locked["payment_id"]),
            )
            if locked["rental_id"] and str(locked["payment_type"]).lower() != "security_deposit":
                cursor.execute("SELECT total_amount FROM rentals WHERE rental_id=%s FOR UPDATE", (locked["rental_id"],))
                rental = cursor.fetchone()
                if not rental:
                    api_error(404, "Associated rental booking was not found")
                cursor.execute(
                    """SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE rental_id=%s
                       AND LOWER(payment_type)<>'security_deposit' AND UPPER(status) IN ('SUCCESS','PAID')""",
                    (locked["rental_id"],),
                )
                paid = money(cursor.fetchone()["paid"])
                due = money(rental["total_amount"])
                rental_status = "paid" if paid >= due else "partial" if paid > 0 else "pending"
                cursor.execute("UPDATE rentals SET payment_status=%s WHERE rental_id=%s", (rental_status, locked["rental_id"]))
            if locked["invoice_id"]:
                cursor.execute("SELECT total_amount FROM invoices WHERE invoice_id=%s FOR UPDATE", (locked["invoice_id"],))
                invoice = cursor.fetchone()
                if invoice:
                    cursor.execute(
                        "SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE invoice_id=%s AND UPPER(status) IN ('SUCCESS','PAID')",
                        (locked["invoice_id"],),
                    )
                    invoice_paid = money(cursor.fetchone()["paid"])
                    invoice_status = "PAID" if invoice_paid >= money(invoice["total_amount"]) else "PARTIALLY_PAID"
                    cursor.execute("UPDATE invoices SET status=%s WHERE invoice_id=%s", (invoice_status, locked["invoice_id"]))
            if str(locked["payment_type"]).lower() == "security_deposit" and locked["rental_id"]:
                cursor.execute(
                    """SELECT * FROM security_deposits WHERE rental_id=%s AND user_id=%s
                       ORDER BY deposit_id DESC LIMIT 1 FOR UPDATE""",
                   
                    (locked["rental_id"], locked["user_id"]),
                )
                deposit = cursor.fetchone()
                if deposit:
                    paid_amount = money(deposit.get("paid_amount")) + money(locked["amount"])
                    deposit_status = "PAID" if paid_amount >= money(deposit["amount"]) else "PARTIAL"
                    cursor.execute(
                        "UPDATE security_deposits SET paid_amount=%s,status=%s WHERE deposit_id=%s",
                        (paid_amount, deposit_status, deposit["deposit_id"]),
                    )
                    notify(locked["user_id"], "Security Deposit Payment Received", f"Your security deposit payment of ₹{money(locked['amount'])} was received.", "SECURITY_DEPOSIT", deposit["deposit_id"], cursor)
            notify(locked["user_id"], "Payment Verified & Confirmed", f"Your Razorpay payment of ₹{money(locked['amount'])} (Tx ID: {razorpay_payment_id}) has been verified and confirmed successfully.", "PAYMENT_SUCCESS", locked["payment_id"], cursor)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Payment settlement transaction failed")
        raise HTTPException(status_code=500, detail="Failed to apply verified payment to the booking") from exc
    return {"success": True, "verified": True, "message": "Payment verified and applied successfully", "payment": {
        "payment_id": payment["payment_id"], "transaction_id": payment["transaction_id"],
        "razorpay_order_id": order_id, "razorpay_payment_id": razorpay_payment_id,
        "amount": as_float(payment["amount"]), "payment_type": payment["payment_type"], "status": "SUCCESS",
    }}


def create_cash_payment(payload: dict[str, Any], user: dict[str, Any], *, method: str, title: str, message: str) -> dict[str, Any]:
    try:
        rental_id = int(payload.get("rental_id"))
        requested = money(payload.get("amount"))
    except (TypeError, ValueError):
        api_error(400, "A valid rental_id and payment amount are required")
    payment_type = str(payload.get("payment_type") or "RENT").lower()
    if requested <= 0:
        api_error(400, "Payment amount must be greater than 0")
    rental = database.fetch_one("SELECT * FROM rentals WHERE rental_id=%s", (rental_id,))
    if not rental:
        api_error(404, "Rental booking not found")
    if user["role"] != "admin" and int(rental["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied: Cannot process payment for another user’s rental")
    _, requested = validate_rental_payment(rental_id, user, payment_type, requested if payment_type != "full" else None)
    transaction_id = f"TXN-{method.upper()}-{int(datetime.now().timestamp() * 1000)}-{secrets.token_hex(2).upper()}"
    with database.transaction() as (_, cursor):
        cursor.execute(
            """INSERT INTO payments (rental_id,user_id,transaction_id,amount,payment_type,payment_method,status)
               VALUES (%s,%s,%s,%s,%s,%s,'PENDING_COLLECTION')""",
            (rental_id, user["user_id"], transaction_id, requested, payment_type, method),
        )
        payment_id = int(cursor.lastrowid)
        notify(
            user["user_id"], title,
            message.format(booking_number=rental["booking_number"], amount=requested),
            reference_id=rental_id, cursor=cursor,
        )
    return {
        "success": True,
        "message": f"{title} request registered successfully. Payment pending collection.",
        "payment": {
            "payment_id": payment_id, "rental_id": rental_id, "transaction_id": transaction_id,
            "amount": requested, "payment_type": payment_type, "payment_method": method,
            "status": "PENDING_COLLECTION", "booking_number": rental["booking_number"],
        },
    }


@app.post("/api/payments/cash-on-delivery", status_code=201)
def cash_on_delivery(request_body: CashPaymentRequest, user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    payload = request_body.model_dump()
    return create_cash_payment(
        payload, user, method="cash_on_delivery", title="Cash on Delivery Selected",
        message="Cash on Delivery selected for Booking #{booking_number}. Payable Amount: ₹{amount}. Payment will be collected upon equipment delivery.",
    )


@app.post("/api/payments/cash-at-pickup", status_code=201)
def cash_at_pickup(request_body: CashPaymentRequest, user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    payload = request_body.model_dump()
    return create_cash_payment(
        payload, user, method="cash", title="Cash at Pickup Selected",
        message="Cash at Pickup selected for Booking #{booking_number}. Amount: ₹{amount}. Please present cash upon equipment collection.",
    )


@app.post("/api/payments", status_code=201)
def legacy_mock_payment(payload: dict[str, Any], user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    if os.getenv("ENABLE_MOCK_PAYMENTS", "false").strip().lower() != "true":
        api_error(403, "Mock payments are disabled; use Razorpay checkout or cash collection")
    if os.getenv("NODE_ENV", os.getenv("APP_ENV", "development")).lower() == "production":
        api_error(403, "Mock payments are disabled in production")
    try:
        rental_id = int(payload.get("rental_id"))
        amount = money(payload.get("amount"))
    except (TypeError, ValueError):
        api_error(400, "A valid rental_id and amount are required")
    if amount <= 0:
        api_error(400, "Payment amount must be greater than zero")
    rental = database.fetch_one("SELECT * FROM rentals WHERE rental_id=%s", (rental_id,))
    if not rental:
        api_error(404, "Rental booking not found")
    if user["role"] != "admin" and int(rental["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied: Cannot process payment for another user’s rental")
    payment_type = str(payload.get("payment_type") or "full").lower()
    payment_method = str(payload.get("payment_method") or "mock_card").lower()
    if payment_method not in {"mock_card", "mock_upi"}:
        api_error(400, "Invalid mock payment method")
    _, amount = validate_rental_payment(rental_id, user, payment_type, amount)
    transaction_id = f"TXN-MOCK-{int(datetime.now().timestamp() * 1000)}-{secrets.token_hex(2).upper()}"
    with database.transaction() as (_, cursor):
        cursor.execute(
            """INSERT INTO payments (rental_id,user_id,transaction_id,amount,payment_type,payment_method,status)
               VALUES (%s,%s,%s,%s,%s,%s,'SUCCESS')""",
            (rental_id, user["user_id"], transaction_id, amount, payment_type, payment_method),
        )
        payment_id = int(cursor.lastrowid)
        cursor.execute(
            "SELECT COALESCE(SUM(amount),0) AS total_paid FROM payments WHERE rental_id=%s AND UPPER(status) IN ('SUCCESS','PAID')",
            (rental_id,),
        )
        total_paid = money(cursor.fetchone()["total_paid"])
        rental_total = money(rental["total_amount"])
        payment_status = "paid" if total_paid >= rental_total else "partial" if total_paid > 0 else "pending"
        cursor.execute("UPDATE rentals SET payment_status=%s WHERE rental_id=%s", (payment_status, rental_id))
    return {
        "success": True, "message": "Mock payment processed successfully",
        "payment": {
            "payment_id": payment_id, "rental_id": rental_id, "transaction_id": transaction_id,
            "amount": amount, "payment_type": payment_type, "payment_method": payment_method,
            "status": "SUCCESS", "rental_payment_status": payment_status,
            "total_paid": total_paid, "remaining_balance": max(Decimal("0.00"), rental_total - total_paid),
        },
    }


@app.put("/api/payments/{payment_id}/confirm-cash")
def confirm_cash_collection(payment_id: int, user: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    with database.transaction() as (_, cursor):
        cursor.execute("SELECT * FROM payments WHERE payment_id=%s FOR UPDATE", (payment_id,))
        payment = cursor.fetchone()
        if not payment:
            api_error(404, "Payment transaction record not found")
        if str(payment["status"]).upper() in {"SUCCESS", "PAID"}:
            api_error(400, "Payment has already been confirmed as paid")
        cursor.execute("UPDATE payments SET status='SUCCESS' WHERE payment_id=%s", (payment_id,))
        if payment["rental_id"]:
            cursor.execute("UPDATE rentals SET payment_status='paid' WHERE rental_id=%s", (payment["rental_id"],))
        if payment["user_id"]:
            notify(payment["user_id"], "Cash Payment Confirmed", f"Cash collection of ₹{payment['amount']} for Tx ID: {payment['transaction_id']} has been confirmed by staff.", "PAYMENT_SUCCESS", payment_id, cursor)
    return {"success": True, "message": "Cash payment confirmed and recorded successfully!", "payment": {
        "payment_id": payment_id, "transaction_id": payment["transaction_id"], "amount": as_float(payment["amount"]), "status": "SUCCESS",
    }}


@app.get("/api/payments/admin/all")
def all_payments(_: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    payments = database.fetch_all(
        """SELECT p.*,u.name AS customer_name,u.email AS customer_email,r.booking_number
           FROM payments p LEFT JOIN users u ON u.user_id=p.user_id
           LEFT JOIN rentals r ON r.rental_id=p.rental_id ORDER BY p.payment_id DESC"""
    )
    return {"success": True, "count": len(payments), "payments": payments}


@app.get("/api/payments/{payment_id}")
def get_payment(payment_id: int, user: dict[str, Any] = Depends(require_roles("admin", "customer", "seller"))) -> dict[str, Any]:
    payment = database.fetch_one(
        """SELECT p.*,r.booking_number,r.total_amount AS rental_total FROM payments p
           LEFT JOIN rentals r ON r.rental_id=p.rental_id WHERE p.payment_id=%s""",
        (payment_id,),
    )
    if not payment:
        api_error(404, "Payment transaction record not found")
    if user["role"] != "admin" and payment["user_id"] != user["user_id"]:
        api_error(403, "Access denied")
    return {"success": True, "payment": payment}


@app.get("/api/notifications")
def get_notifications(
    is_read: str | None = None,
    notification_type: str | None = Query(default=None, alias="type"),
    limit: int | None = Query(default=None, ge=1, le=500),
    user: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    clauses, params = ["WHERE user_id=%s"], [user["user_id"]]
    if is_read is not None:
        clauses.append("AND is_read=%s")
        params.append(is_read.lower() in {"true", "1"})
    if notification_type:
        clauses.append("AND type=%s")
        params.append(notification_type.upper())
    sql = "SELECT * FROM notifications " + " ".join(clauses) + " ORDER BY notification_id DESC"
    if limit is not None:
        sql += " LIMIT %s"
        params.append(limit)
    notifications = database.fetch_all(sql, tuple(params))
    return {"success": True, "count": len(notifications), "notifications": notifications}


@app.get("/api/notifications/unread")
def unread_notifications(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    notifications = database.fetch_all(
        "SELECT * FROM notifications WHERE user_id=%s AND is_read=FALSE ORDER BY notification_id DESC",
        (user["user_id"],),
    )
    return {"success": True, "unread_count": len(notifications), "notifications": notifications}


@app.put("/api/notifications/read-all")
def mark_all_notifications_read(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    with database.transaction() as (_, cursor):
        cursor.execute("UPDATE notifications SET is_read=TRUE WHERE user_id=%s AND is_read=FALSE", (user["user_id"],))
        updated_count = cursor.rowcount
    return {"success": True, "message": "All notifications marked as read", "updated_count": updated_count}


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    exists = database.fetch_one("SELECT notification_id FROM notifications WHERE notification_id=%s AND user_id=%s", (notification_id, user["user_id"]))
    if not exists:
        api_error(404, "Notification not found or access denied")
    database.execute("UPDATE notifications SET is_read=TRUE WHERE notification_id=%s AND user_id=%s", (notification_id, user["user_id"]))
    return {"success": True, "message": "Notification marked as read", "notification_id": notification_id}


@app.delete("/api/notifications/{notification_id}")
def delete_notification(notification_id: int, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    exists = database.fetch_one("SELECT notification_id FROM notifications WHERE notification_id=%s AND user_id=%s", (notification_id, user["user_id"]))
    if not exists:
        api_error(404, "Notification not found or access denied")
    database.execute("DELETE FROM notifications WHERE notification_id=%s AND user_id=%s", (notification_id, user["user_id"]))
    return {"success": True, "message": "Notification deleted successfully"}


def late_fee_details(invoice: dict[str, Any], config: dict[str, Any], target_date: datetime) -> dict[str, Any]:
    due = invoice["due_date"]
    if isinstance(due, str):
        due = datetime.fromisoformat(due)
    elif not isinstance(due, datetime):
        due = datetime.combine(due, datetime.min.time())
    due = due.replace(hour=23, minute=59, second=59, microsecond=999000)
    grace_days = int(config.get("grace_period_days") or 0)
    cutoff = due + timedelta(days=grace_days)
    fee_type = str(config.get("late_fee_type") or "fixed")
    if target_date <= due:
        return {"isOverdue": False, "inGracePeriod": False, "overdueDays": 0, "calculatedFee": 0.0, "feeType": fee_type, "message": "Payment on time (before due date)"}
    if target_date <= cutoff:
        return {"isOverdue": False, "inGracePeriod": True, "overdueDays": 0, "calculatedFee": 0.0, "feeType": fee_type, "message": f"Within grace period of {grace_days} days after due date. No late fee applied."}
    days_past_grace = max(1, int(((target_date - cutoff).total_seconds() + 86399) // 86400))
    overdue_days = max(1, int(((target_date - due).total_seconds() + 86399) // 86400))
    value = as_float(config.get("late_fee_value"))
    base = as_float(invoice.get("base_rent") or invoice.get("total_amount"))
    if fee_type.lower() == "percentage":
        fee = base * value / 100
    elif fee_type.lower() == "per_day":
        fee = value * days_past_grace
    else:
        fee = value
    cap = config.get("max_late_fee")
    if cap is not None and as_float(cap) > 0:
        fee = min(fee, as_float(cap))
    fee = round(fee, 2)
    return {
        "isOverdue": True, "inGracePeriod": False, "overdueDays": overdue_days,
        "daysPastGrace": days_past_grace, "calculatedFee": fee, "feeType": fee_type,
        "maxFeeCap": as_float(cap) if cap is not None else None,
        "message": f"Overdue by {overdue_days} day(s) ({days_past_grace} day(s) past grace period). Late fee applied.",
    }


@app.get("/api/late-fees/config")
def get_late_fee_config(_: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    config = database.fetch_one("SELECT * FROM late_fee_configs WHERE is_active=TRUE ORDER BY config_id DESC LIMIT 1")
    if not config:
        api_error(404, "No active late fee configuration found")
    return {"success": True, "config": config}


@app.post("/api/late-fees/config", status_code=201)
def update_late_fee_config(payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    fee_type = str(payload.get("late_fee_type") or "fixed").lower()
    if fee_type not in {"fixed", "percentage", "per_day"}:
        api_error(400, "Invalid late_fee_type. Allowed: [fixed, percentage, per_day]")
    name = str(payload.get("name") or "Updated Policy").strip()
    grace = int(payload.get("grace_period_days") or 3)
    value = money(payload.get("late_fee_value", 500))
    cap = money(payload["max_late_fee"]) if payload.get("max_late_fee") is not None else None
    with database.transaction() as (_, cursor):
        cursor.execute("UPDATE late_fee_configs SET is_active=FALSE")
        cursor.execute(
            """INSERT INTO late_fee_configs (name,grace_period_days,late_fee_type,late_fee_value,max_late_fee,is_active)
               VALUES (%s,%s,%s,%s,%s,TRUE)""",
            (name, grace, fee_type, value, cap),
        )
        config_id = int(cursor.lastrowid)
    return {"success": True, "message": "Late fee configuration updated successfully", "config": {
        "config_id": config_id, "name": name, "grace_period_days": grace, "late_fee_type": fee_type,
        "late_fee_value": value, "max_late_fee": cap,
    }}


@app.post("/api/late-fees/calculate")
def calculate_late_fee(payload: dict[str, Any], _: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    due_date = payload.get("due_date")
    if not due_date:
        api_error(400, "due_date is required")
    try:
        target = datetime.fromisoformat(str(payload.get("target_date") or datetime.now().isoformat()).replace("Z", "+00:00"))
        due = datetime.fromisoformat(str(due_date))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="due_date and target_date must be valid dates") from exc
    if target.tzinfo:
        target = target.astimezone(timezone.utc).replace(tzinfo=None)
    if due.tzinfo:
        due = due.astimezone(timezone.utc).replace(tzinfo=None)
    invoice = {"due_date": due, "base_rent": payload.get("base_rent") or payload.get("total_amount") or 10000, "total_amount": payload.get("total_amount") or 10000}
    config = {
        "grace_period_days": payload.get("grace_period_days", 3),
        "late_fee_type": payload.get("late_fee_type", "fixed"),
        "late_fee_value": payload.get("late_fee_value", 500),
        "max_late_fee": payload.get("max_late_fee", 2000),
    }
    return {"success": True, "input": {"invoice": invoice, "config": config, "target_date": target.isoformat()}, "result": late_fee_details(invoice, config, target)}


def invoice_detail(invoice_id: str) -> dict[str, Any] | None:
    if invoice_id.isdigit():
        condition, value = "i.invoice_id=%s", int(invoice_id)
    else:
        condition, value = "i.invoice_number=%s", invoice_id
    invoice = database.fetch_one(
        f"""SELECT i.*,u.name AS tenant_name,u.email AS tenant_email,u.phone AS tenant_phone,r.booking_number
            FROM invoices i JOIN users u ON u.user_id=i.user_id
            LEFT JOIN rentals r ON r.rental_id=i.rental_id WHERE {condition}""",
        (value,),
    )
    if invoice:
        invoice["items"] = database.fetch_all("SELECT * FROM invoice_items WHERE invoice_id=%s", (invoice["invoice_id"],))
        invoice["payments"] = database.fetch_all("SELECT * FROM payments WHERE invoice_id=%s ORDER BY payment_id DESC", (invoice["invoice_id"],))
    return invoice


@app.post("/api/invoices", status_code=201)
def create_invoice(payload: dict[str, Any], user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    target_user_id = payload.get("user_id") or payload.get("tenantId")
    billing_month = str(payload.get("billing_month") or "")
    if not target_user_id:
        api_error(400, "Target user_id or tenantId is required")
    if user["role"] != "admin" and int(target_user_id) != int(user["user_id"]):
        api_error(403, "Access denied: Cannot create an invoice for another user")
    if not re.fullmatch(r"\d{4}-\d{2}", billing_month):
        api_error(400, 'Valid billing_month is required in YYYY-MM format (e.g. "2026-09")')
    tenant = database.fetch_one("SELECT user_id,name FROM users WHERE user_id=%s", (target_user_id,))
    if not tenant:
        api_error(404, f"Tenant/User ID {target_user_id} not found")
    rental = None
    if payload.get("rental_id"):
        rental = database.fetch_one("SELECT rental_id,booking_number,total_amount,user_id FROM rentals WHERE rental_id=%s", (payload["rental_id"],))
        if not rental:
            api_error(404, f"Rental agreement ID {payload['rental_id']} not found")
        if int(rental["user_id"]) != int(target_user_id):
            api_error(400, f"Rental agreement ID {payload['rental_id']} does not belong to tenant ID {target_user_id}")
    existing = database.fetch_one("SELECT invoice_id,invoice_number FROM invoices WHERE user_id=%s AND billing_month=%s", (target_user_id, billing_month))
    if existing:
        api_error(400, f'Duplicate invoice error: Tenant ID {target_user_id} has already received invoice ({existing["invoice_number"]}) for billing month "{billing_month}"')
    base_rent = money(payload.get("base_rent", rental["total_amount"] if rental else 0))
    other_charges = money(payload.get("other_charges", 0))
    discount = money(payload.get("discount", 0))
    late_amount = money(payload.get("late_fee_amount", 0))
    total = base_rent + other_charges - discount + late_amount
    if total < 0:
        api_error(400, "Calculated total invoice amount cannot be negative")
    due_date = payload.get("due_date") or (datetime.now().date() + timedelta(days=15)).isoformat()
    status = str(payload.get("status") or "PENDING").upper()
    invoice_number = f"INV-{datetime.now():%Y}-{uuid.uuid4().hex[:8].upper()}"
    try:
        with database.transaction() as (_, cursor):
            cursor.execute(
                """INSERT INTO invoices (invoice_number,user_id,rental_id,billing_month,base_rent,other_charges,discount,
                   late_fee_amount,subtotal_amount,tax_amount,total_amount,due_date,status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,0,%s,%s,%s)""",
                (invoice_number, target_user_id, payload.get("rental_id"), billing_month, base_rent,
                 other_charges, discount, late_amount, base_rent + other_charges, total, due_date, status),
            )
            invoice_id = int(cursor.lastrowid)
            items = payload.get("items")
            if isinstance(items, list) and items:
                for item in items:
                    quantity = int(item.get("quantity") or 1)
                    price = money(item.get("unit_price") or 0)
                    cursor.execute(
                        "INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,subtotal) VALUES (%s,%s,%s,%s,%s)",
                        (invoice_id, item.get("description") or "Rental Charge", quantity, price, price * quantity),
                    )
            else:
                cursor.execute(
                    "INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,subtotal) VALUES (%s,%s,1,%s,%s)",
                    (invoice_id, f"Base Rent for Billing Month {billing_month}", base_rent, base_rent),
                )
            notify(int(target_user_id), "New Invoice Generated", f"Invoice {invoice_number} for ₹{total} has been generated for billing month {billing_month}. Due date: {due_date}.", "INVOICE_GENERATED", invoice_id, cursor)
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail=f'Duplicate invoice error: An invoice has already been issued for billing month "{billing_month}" for this tenant.') from exc
    return {
        "success": True, "message": "Invoice generated successfully",
        "invoice": {
            "invoice_id": invoice_id, "invoice_number": invoice_number, "user_id": int(target_user_id),
            "tenant_name": tenant["name"], "rental_id": payload.get("rental_id"),
            "billing_month": billing_month,
            "calculation": {"base_rent": base_rent, "other_charges": other_charges, "discount": discount,
                            "late_fee_amount": late_amount, "formula": "Base Rent + Other Charges - Discount + Late Fee = Total Amount",
                            "total_amount": total},
            "due_date": due_date, "status": status,
        },
    }


@app.get("/api/invoices")
def get_invoices(
    status: str | None = None,
    billing_month: str | None = None,
    user_id: int | None = None,
    tenant_id: int | None = None,
    user: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    target = user_id or tenant_id
    if user["role"] != "admin":
        if target is not None and target != int(user["user_id"]):
            api_error(403, "Access denied")
        target = int(user["user_id"])
    clauses, params = ["WHERE 1=1"], []
    if target:
        clauses.append("AND i.user_id=%s")
        params.append(target)
    if status:
        clauses.append("AND i.status=%s")
        params.append(status.upper())
    if billing_month:
        clauses.append("AND i.billing_month=%s")
        params.append(billing_month)
    invoices = database.fetch_all(
        "SELECT i.*,u.name AS tenant_name,u.email AS tenant_email,r.booking_number FROM invoices i JOIN users u ON u.user_id=i.user_id LEFT JOIN rentals r ON r.rental_id=i.rental_id "
        + " ".join(clauses) + " ORDER BY i.invoice_id DESC",
        tuple(params),
    )
    return {"success": True, "count": len(invoices), "invoices": invoices}


@app.get("/api/invoices/tenant/{tenant_id}")
def get_tenant_invoices(tenant_id: int, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] != "admin" and int(user["user_id"]) != tenant_id:
        api_error(403, "Access denied")
    tenant = database.fetch_one("SELECT user_id,name,email FROM users WHERE user_id=%s", (tenant_id,))
    if not tenant:
        api_error(404, f"Tenant ID {tenant_id} not found")
    invoices = database.fetch_all(
        "SELECT i.*,r.booking_number FROM security_deposits sd LEFT JOIN rentals r ON r.rental_id=i.rental_id WHERE sd.user_id=%s ORDER BY sd.deposit_id DESC",
        (tenant_id,),
    )
    return {"success": True, "tenant": tenant, "count": len(invoices), "invoices": invoices}


@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: str, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    invoice = invoice_detail(invoice_id)
    if not invoice:
        api_error(404, "Invoice not found")
    if user["role"] != "admin" and int(invoice["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied")
    return {"success": True, "invoice": invoice}


@app.put("/api/invoices/{invoice_id}")
def update_invoice(invoice_id: int, payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    invoice = database.fetch_one("SELECT * FROM invoices WHERE invoice_id=%s", (invoice_id,))
    if not invoice:
        api_error(404, "Invoice not found")
    valid_statuses = {"DRAFT", "PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"}
    status = str(payload.get("status") or invoice["status"]).upper()
    if status not in valid_statuses:
        api_error(400, f"Invalid invoice status. Allowed values: [{', '.join(sorted(valid_statuses))}]")
    base = money(payload.get("base_rent", invoice.get("base_rent", 0)))
    charges = money(payload.get("other_charges", invoice.get("other_charges", 0)))
    discount = money(payload.get("discount", invoice.get("discount", 0)))
    late = money(payload.get("late_fee_amount", invoice.get("late_fee_amount", 0)))
    total = base + charges - discount + late
    database.execute(
        "UPDATE invoices SET base_rent=%s,other_charges=%s,discount=%s,late_fee_amount=%s,total_amount=%s,due_date=%s,status=%s WHERE invoice_id=%s",
        (base, charges, discount, late, total, payload.get("due_date") or invoice["due_date"], status, invoice_id),
    )
    return {"success": True, "message": "Invoice updated successfully", "invoice_id": invoice_id,
            "updated_data": {"base_rent": base, "other_charges": charges, "discount": discount,
                             "late_fee_amount": late, "total_amount": total, "due_date": payload.get("due_date") or invoice["due_date"], "status": status}}


@app.post("/api/invoices/{invoice_id}/apply-late-fee")
def apply_invoice_late_fee(invoice_id: int, payload: dict[str, Any] | None = None, _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    invoice = database.fetch_one("SELECT * FROM invoices WHERE invoice_id=%s", (invoice_id,))
    if not invoice:
        api_error(404, f"Invoice ID {invoice_id} not found")
    if str(invoice["status"]).upper() in {"PAID", "CANCELLED"}:
        return {"success": True, "result": {"applied": False, "reason": f"Invoice status is {invoice['status']}. Cannot apply late fee."}}
    existing = database.fetch_one("SELECT * FROM late_fees WHERE invoice_id=%s AND status IN ('unpaid','paid')", (invoice_id,))
    if existing:
        return {"success": True, "result": {"applied": False, "isDuplicate": True, "existingRecord": existing, "message": "Late fee already applied; duplicate prevention active."}}
    body = payload or {}
    config = body.get("customConfig") or database.fetch_one("SELECT * FROM late_fee_configs WHERE is_active=TRUE ORDER BY config_id DESC LIMIT 1")
    if not config:
        api_error(400, "No active late fee configuration found in database")
    target = body.get("targetDate") or datetime.now().isoformat()
    try:
        target_date = datetime.fromisoformat(str(target).replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="targetDate must be a valid ISO date") from exc
    if target_date.tzinfo:
        target_date = target_date.astimezone(timezone.utc).replace(tzinfo=None)
    calculation = late_fee_details(invoice, config, target_date)
    if not calculation["isOverdue"] or calculation["calculatedFee"] <= 0:
        return {"success": True, "result": {"applied": False, **calculation}}
    fee = money(calculation["calculatedFee"])
    total = money(invoice.get("base_rent") or 0) + money(invoice.get("other_charges") or 0) - money(invoice.get("discount") or 0) + fee
    with database.transaction() as (_, cursor):
        cursor.execute(
            """INSERT INTO late_fees (invoice_id,overdue_hours,overdue_days,rate_per_hour,calculated_fee,status)
               VALUES (%s,%s,%s,%s,%s,'unpaid')""",
            (invoice_id, calculation["overdueDays"] * 24, calculation["overdueDays"], config["late_fee_value"], fee),
        )
        late_fee_id = int(cursor.lastrowid)
        cursor.execute("UPDATE invoices SET late_fee_amount=%s,total_amount=%s,status='OVERDUE' WHERE invoice_id=%s", (fee, total, invoice_id))
        notify(invoice["user_id"], "Late Fee Applied", f"A late fee of ₹{fee} has been applied to Invoice {invoice['invoice_number']}. Total amount due: ₹{total}.", "LATE_FEE", invoice_id, cursor)
        notify(invoice["user_id"], "Invoice Overdue Notice", f"Invoice {invoice['invoice_number']} is overdue by {calculation['overdueDays']} day(s).", "RENT_OVERDUE", invoice_id, cursor)
    return {"success": True, "result": {"applied": True, "late_fee_id": late_fee_id, "invoice_number": invoice["invoice_number"],
            "overdue_days": calculation["overdueDays"], "calculated_fee": fee, "new_total_amount": total,
            "invoice_status": "OVERDUE", "details": calculation}}


@app.post("/api/returns", status_code=201)
def process_return(payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        rental_id = int(payload.get("rental_id"))
    except (TypeError, ValueError):
        api_error(400, "Valid rental_id is required")
    rental = database.fetch_one("SELECT * FROM rentals WHERE rental_id=%s", (rental_id,))
    if not rental:
        api_error(404, "Rental booking not found")
    if database.fetch_one("SELECT return_id FROM returns WHERE rental_id=%s", (rental_id,)):
        api_error(400, "Return has already been processed for this rental")
    condition = payload.get("condition_on_return") or "good"
    if condition not in {"good", "minor_damage", "severe_damage"}:
        api_error(400, "Valid condition is required")
    actual_text = payload.get("actual_return_datetime") or datetime.now(timezone.utc).isoformat()
    actual = parse_datetime(actual_text, "actual_return_datetime")
    scheduled = rental["end_datetime"]
    if not isinstance(scheduled, datetime):
        scheduled = datetime.fromisoformat(str(scheduled))
    rate = money(payload.get("hourly_late_rate", 100))
    overdue_hours = max(0, int(((actual - scheduled).total_seconds() + 3599) // 3600))
    late_fee = money(rate * overdue_hours)
    with database.transaction() as (_, cursor):
        cursor.execute(
            """INSERT INTO returns (rental_id,scheduled_return_datetime,actual_return_datetime,condition_on_return,admin_notes)
               VALUES (%s,%s,%s,%s,%s)""",
            (rental_id, scheduled, actual, condition, payload.get("admin_notes")),
        )
        return_id = int(cursor.lastrowid)
        fee_record = None
        if overdue_hours and late_fee > 0:
            cursor.execute(
                "INSERT INTO late_fees (return_id,overdue_hours,rate_per_hour,calculated_fee,status) VALUES (%s,%s,%s,%s,'unpaid')",
                (return_id, overdue_hours, rate, late_fee),
            )
            fee_record = {"late_fee_id": int(cursor.lastrowid), "overdue_hours": overdue_hours, "rate_per_hour": rate, "calculated_fee": late_fee, "status": "unpaid"}
        cursor.execute("UPDATE rentals SET status='completed' WHERE rental_id=%s", (rental_id,))
        note = f"Your rental booking {rental['booking_number']} has been returned and marked as completed."
        if late_fee > 0:
            note += f" An overdue late fee of ₹{late_fee} ({overdue_hours} hours late) has been applied."
        notify(rental["user_id"], "Rental Returned", note, cursor=cursor)
    return {"success": True, "message": "Product return processed successfully", "return_details": {
        "return_id": return_id, "rental_id": rental_id, "scheduled_return": scheduled,
        "actual_return": actual_text, "condition_on_return": condition, "late_fee": fee_record,
    }}


@app.get("/api/returns/{return_id}")
def get_return(return_id: int, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    row = database.fetch_one(
        """SELECT ret.*,r.booking_number,r.user_id,lf.late_fee_id,lf.overdue_hours,lf.rate_per_hour,
                  lf.calculated_fee,lf.status AS late_fee_status
           FROM returns ret JOIN rentals r ON r.rental_id=ret.rental_id
           LEFT JOIN late_fees lf ON lf.return_id=ret.return_id WHERE ret.return_id=%s""",
        (return_id,),
    )
    if not row:
        api_error(404, "Return record not found")
    if user["role"] != "admin" and int(row["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied: You cannot view another customer’s return")
    return {"success": True, "return_record": row}


@app.get("/api/sellers/returns")
def seller_returns(user: dict[str, Any] = Depends(seller_approved)) -> dict[str, Any]:
    rows = database.fetch_all(
        """SELECT ret.return_id,ret.rental_id,ret.scheduled_return_datetime,ret.actual_return_datetime,
                  ret.condition_on_return,ret.processed_at,r.booking_number,r.status AS rental_status,
                  u.name AS customer_name,GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS product_names,
                  lf.overdue_hours,lf.calculated_fee AS late_fee,lf.status AS late_fee_status
           FROM returns ret JOIN rentals r ON r.rental_id=ret.rental_id
           JOIN users u ON u.user_id=r.user_id JOIN rental_items ri ON ri.rental_id=r.rental_id
           JOIN products p ON p.product_id=ri.product_id LEFT JOIN late_fees lf ON lf.return_id=ret.return_id
           WHERE p.created_by=%s
           GROUP BY ret.return_id,ret.rental_id,ret.scheduled_return_datetime,ret.actual_return_datetime,
                    ret.condition_on_return,ret.processed_at,r.booking_number,r.status,u.name,
                    lf.overdue_hours,lf.calculated_fee,lf.status ORDER BY ret.processed_at DESC""",
        (user["user_id"],),
    )
    return {"success": True, "count": len(rows), "returns": rows}


def deposit_with_balance(deposit: dict[str, Any]) -> dict[str, Any]:
    deposit["available_balance"] = money(
        money(deposit.get("paid_amount")) - money(deposit.get("refunded_amount")) - money(deposit.get("adjusted_amount"))
    )
    return deposit


def get_deposit_row(deposit_id: str) -> dict[str, Any] | None:
    if deposit_id.isdigit():
        return database.fetch_one(
            """SELECT sd.*,u.name AS tenant_name,u.email AS tenant_email,r.booking_number
               FROM security_deposits sd JOIN users u ON u.user_id=sd.user_id
               LEFT JOIN rentals r ON r.rental_id=sd.rental_id WHERE sd.deposit_id=%s""",
            (int(deposit_id),),
        )
    return database.fetch_one(
        """SELECT sd.*,u.name AS tenant_name,u.email AS tenant_email,r.booking_number
           FROM security_deposits sd JOIN users u ON u.user_id=sd.user_id
           LEFT JOIN rentals r ON r.rental_id=sd.rental_id WHERE sd.deposit_number=%s""",
        (deposit_id,),
    )


@app.post("/api/security-deposits", status_code=201)
def create_security_deposit(payload: dict[str, Any], user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    target_user_id = payload.get("user_id") or payload.get("tenantId") or user["user_id"]
    if user["role"] != "admin" and int(target_user_id) != int(user["user_id"]):
        api_error(403, "Access denied: Cannot create a deposit for another user")
    amount = money(payload.get("amount"))
    paid = money(payload.get("paid_amount", 0))
    if amount <= 0:
        api_error(400, "Security deposit amount must be greater than 0")
    if paid < 0 or paid > amount:
        api_error(400, "Initial paid amount must be between zero and the required deposit")
    tenant = database.fetch_one("SELECT user_id FROM users WHERE user_id=%s", (target_user_id,))
    if not tenant:
        api_error(404, f"Tenant/User ID {target_user_id} not found")
    status = "PAID" if paid >= amount else "PARTIAL" if paid > 0 else "PENDING"
    deposit_number = f"DEP-{datetime.now():%Y}-{secrets.token_hex(3).upper()}"
    with database.transaction() as (_, cursor):
        cursor.execute(
            """INSERT INTO security_deposits
               (deposit_number,user_id,rental_id,amount,paid_amount,refunded_amount,adjusted_amount,status,notes)
               VALUES (%s,%s,%s,%s,%s,0,0,%s,%s)""",
            (deposit_number, target_user_id, payload.get("rental_id"), amount, paid, status, payload.get("notes")),
        )
        deposit_id = int(cursor.lastrowid)
        if paid > 0:
            cursor.execute(
                """INSERT INTO security_deposit_logs (deposit_id,action_type,amount,remaining_balance,reason)
                   VALUES (%s,'PAYMENT',%s,%s,'Initial deposit payment received')""",
                (deposit_id, paid, paid),
            )
        notify(int(target_user_id), "Security Deposit Created", f"Security deposit requirement {deposit_number} of ₹{amount} has been generated. Status: {status}.", "SECURITY_DEPOSIT", deposit_id, cursor)
    return {"success": True, "message": "Security deposit record created successfully", "deposit": {
        "deposit_id": deposit_id, "deposit_number": deposit_number, "user_id": int(target_user_id),
        "rental_id": payload.get("rental_id"), "total_amount": amount, "paid_amount": paid,
        "remaining_balance": paid, "status": status, "notes": payload.get("notes"),
    }}


@app.get("/api/security-deposits/tenant/{tenant_id}")
def get_tenant_deposits(tenant_id: int, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] != "admin" and int(user["user_id"]) != tenant_id:
        api_error(403, "Access denied")
    tenant = database.fetch_one("SELECT user_id,name,email FROM users WHERE user_id=%s", (tenant_id,))
    if not tenant:
        api_error(404, f"Tenant ID {tenant_id} not found")
    deposits = database.fetch_all(
        "SELECT sd.*,r.booking_number FROM security_deposits sd LEFT JOIN rentals r ON r.rental_id=sd.rental_id WHERE sd.user_id=%s ORDER BY sd.deposit_id DESC",
        (tenant_id,),
    )
    return {"success": True, "tenant": tenant, "count": len(deposits), "deposits": [deposit_with_balance(row) for row in deposits]}


@app.get("/api/security-deposits/{deposit_id}")
def get_security_deposit(deposit_id: str, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    deposit = get_deposit_row(deposit_id)
    if not deposit:
        api_error(404, "Security deposit record not found")
    if user["role"] != "admin" and int(deposit["user_id"]) != int(user["user_id"]):
        api_error(403, "Access denied")
    deposit = deposit_with_balance(deposit)
    deposit["audit_logs"] = database.fetch_all(
        "SELECT * FROM security_deposit_logs WHERE deposit_id=%s ORDER BY log_id DESC",
        (deposit["deposit_id"],),
    )
    return {"success": True, "deposit": deposit}


@app.put("/api/security-deposits/{deposit_id}")
def update_security_deposit(deposit_id: int, payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    with database.transaction() as (_, cursor):
        cursor.execute("SELECT * FROM security_deposits WHERE deposit_id=%s FOR UPDATE", (deposit_id,))
        deposit = cursor.fetchone()
        if not deposit:
            api_error(404, "Security deposit record not found")
        amount = money(deposit["amount"])
        current_paid = money(deposit.get("paid_amount"))
        if "additional_payment" in payload:
            updated_paid = current_paid + money(payload["additional_payment"])
        else:
            updated_paid = money(payload.get("new_paid_amount", current_paid))
        if updated_paid < 0 or updated_paid > amount:
            api_error(400, "Paid amount must be between zero and the required deposit")
        status = "PAID" if updated_paid >= amount else "PARTIAL" if updated_paid > 0 else "PENDING"
        cursor.execute(
            "UPDATE security_deposits SET paid_amount=%s,status=%s,notes=COALESCE(%s,notes) WHERE deposit_id=%s",
            (updated_paid, status, payload.get("notes") or None, deposit_id),
        )
        difference = updated_paid - current_paid
        if difference > 0:
            remaining = updated_paid - money(deposit.get("refunded_amount")) - money(deposit.get("adjusted_amount"))
            cursor.execute(
                """INSERT INTO security_deposit_logs (deposit_id,action_type,amount,remaining_balance,reason)
                   VALUES (%s,'PAYMENT',%s,%s,'Additional deposit payment recorded')""",
                (deposit_id, difference, remaining),
            )
    return {"success": True, "message": "Security deposit record updated successfully", "deposit_id": deposit_id,
            "total_amount": amount, "paid_amount": updated_paid, "status": status}


@app.post("/api/security-deposits/{deposit_id}/refund")
def refund_security_deposit(deposit_id: int, payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    refund = money(payload.get("refund_amount"))
    if refund <= 0:
        api_error(400, "Refund amount must be greater than 0")
    with database.transaction() as (_, cursor):
        cursor.execute("SELECT * FROM security_deposits WHERE deposit_id=%s FOR UPDATE", (deposit_id,))
        deposit = cursor.fetchone()
        if not deposit:
            api_error(404, "Security deposit record not found")
        available = money(deposit.get("paid_amount")) - money(deposit.get("refunded_amount")) - money(deposit.get("adjusted_amount"))
        if refund > available:
            api_error(400, f"Refund denied: Refund amount (₹{refund}) exceeds available deposit balance (₹{available}).")
        refunded = money(deposit.get("refunded_amount")) + refund
        remaining = available - refund
        status = "REFUNDED" if remaining == 0 and money(deposit.get("adjusted_amount")) == 0 else "ADJUSTED" if remaining == 0 else deposit["status"]
        tx_id = payload.get("transaction_id") or f"REFUND-TXN-{int(datetime.now().timestamp() * 1000)}-{secrets.token_hex(2).upper()}"
        cursor.execute("UPDATE security_deposits SET refunded_amount=%s,refund_transaction_id=%s,status=%s WHERE deposit_id=%s", (refunded, tx_id, status, deposit_id))
        cursor.execute(
            """INSERT INTO security_deposit_logs (deposit_id,action_type,amount,remaining_balance,reason,transaction_id)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (deposit_id, "REFUND" if status == "REFUNDED" else "PARTIAL_REFUND", refund, remaining, payload.get("reason") or "Security deposit refund processed", tx_id),
        )
        notify(deposit["user_id"], "Security Deposit Refund Processed", f"A refund of ₹{refund} for security deposit {deposit['deposit_number']} has been processed. Remaining balance: ₹{remaining}.", "SECURITY_DEPOSIT", deposit_id, cursor)
    return {"success": True, "message": "Deposit refund processed successfully", "refund_details": {
        "deposit_id": deposit_id, "deposit_number": deposit["deposit_number"], "refunded_amount": refund,
        "total_refunded_so_far": refunded, "remaining_balance": remaining, "status": status,
        "transaction_id": tx_id, "reason": payload.get("reason") or "Deposit refund",
    }}


@app.post("/api/security-deposits/{deposit_id}/adjust")
def adjust_security_deposit(deposit_id: int, payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    adjustment = money(payload.get("adjustment_amount"))
    if adjustment <= 0:
        api_error(400, "Adjustment amount must be greater than 0")
    kind = str(payload.get("adjustment_type") or "damage").lower()
    action = "ADJUSTMENT_DUES" if kind == "dues" else "ADJUSTMENT_DAMAGE"
    with database.transaction() as (_, cursor):
        cursor.execute("SELECT * FROM security_deposits WHERE deposit_id=%s FOR UPDATE", (deposit_id,))
        deposit = cursor.fetchone()
        if not deposit:
            api_error(404, "Security deposit record not found")
        available = money(deposit.get("paid_amount")) - money(deposit.get("refunded_amount")) - money(deposit.get("adjusted_amount"))
        if adjustment > available:
            api_error(400, f"Adjustment denied: Adjustment amount (₹{adjustment}) exceeds available deposit balance (₹{available}).")
        adjusted = money(deposit.get("adjusted_amount")) + adjustment
        remaining = available - adjustment
        status = "ADJUSTED" if remaining == 0 else deposit["status"]
        reason = payload.get("reason") or kind
        cursor.execute("UPDATE security_deposits SET adjusted_amount=%s,status=%s WHERE deposit_id=%s", (adjusted, status, deposit_id))
        cursor.execute(
            """INSERT INTO security_deposit_logs (deposit_id,action_type,amount,remaining_balance,reason)
               VALUES (%s,%s,%s,%s,%s)""",
            (deposit_id, action, adjustment, remaining, reason),
        )
        notify(deposit["user_id"], "Security Deposit Adjusted", f"An amount of ₹{adjustment} was adjusted from your security deposit {deposit['deposit_number']} due to {reason}. Remaining balance: ₹{remaining}.", "SECURITY_DEPOSIT", deposit_id, cursor)
    return {"success": True, "message": "Deposit adjustment processed successfully", "adjustment_details": {
        "deposit_id": deposit_id, "deposit_number": deposit["deposit_number"], "adjusted_amount": adjustment,
        "total_adjusted_so_far": adjusted, "remaining_balance": remaining, "status": status, "reason": reason,
    }}


@app.post("/api/analysis/descriptive")
def analyze_descriptive(payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    variable = str(payload.get("variable") or "variable")
    values = payload.get("values")
    if not isinstance(values, list):
        api_error(400, "values must be an array of numbers or null values")
    try:
        result = descriptive_statistics(values)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="values must contain only numbers or null values") from exc
    return {"success": True, "variable": variable, "statistics": result}


@app.post("/api/analysis/correlation")
def analyze_correlation(payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        result = correlation_analysis(
            payload.get("x", []), payload.get("y", []), method=payload.get("method", "spearman")
        )
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    result["variables"] = [payload.get("x_name") or "x", payload.get("y_name") or "y"]
    return {"success": True, "analysis": result}


@app.post("/api/analysis/paired-task-time")
def analyze_paired_task_time(payload: dict[str, Any], _: dict[str, Any] = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        result = paired_task_time_test(
            payload.get("before", []), payload.get("after", []), alpha=payload.get("alpha", 0.05)
        )
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    result["outcome"] = payload.get("outcome") or "task completion time"
    return {"success": True, "analysis": result}
