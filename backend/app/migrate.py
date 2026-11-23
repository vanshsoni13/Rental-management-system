"""Apply additive, idempotent MySQL changes required by the Python API."""

from __future__ import annotations

import re

from app.database import connect


def enum_values(column_type: str) -> list[str]:
    return [value.replace("\\'", "'").replace("\\\\", "\\") for value in re.findall(r"'((?:\\.|[^'])*)'", column_type)]


def migrate() -> None:
    connection = connect(autocommit=False)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS db_name")
            database_name = cursor.fetchone()["db_name"]

            def table_exists(table: str) -> bool:
                cursor.execute(
                    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s",
                    (database_name, table),
                )
                return cursor.fetchone() is not None

            def columns(table: str) -> set[str]:
                cursor.execute(
                    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s",
                    (database_name, table),
                )
                return {row["COLUMN_NAME"] for row in cursor.fetchall()}

            def add_column(table: str, column: str, declaration: str) -> None:
                if not table_exists(table):
                    raise RuntimeError(f"Required table {table!r} is missing; initialize the existing schema first")
                if column not in columns(table):
                    cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {declaration}")

            def ensure_enum_values(table: str, column: str, required: tuple[str, ...], default: str) -> None:
                cursor.execute(
                    """SELECT COLUMN_TYPE FROM information_schema.COLUMNS
                       WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s AND COLUMN_NAME=%s""",
                    (database_name, table, column),
                )
                existing = cursor.fetchone()
                if not existing or not existing["COLUMN_TYPE"].lower().startswith("enum("):
                    return
                values = enum_values(existing["COLUMN_TYPE"])
                if all(value in values for value in required):
                    return
                merged = list(dict.fromkeys([*values, *required]))
                options = ",".join("'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'" for value in merged)
                escaped_default = default.replace("\\", "\\\\").replace("'", "\\'")
                cursor.execute(
                    f"ALTER TABLE `{table}` MODIFY COLUMN `{column}` ENUM({options}) NOT NULL DEFAULT '{escaped_default}'"
                )

            for name, declaration in (
                ("created_by", "INT NULL"),
            ):
                add_column("products", name, declaration)

            for name, declaration in (
                ("base_rent", "DECIMAL(10,2) NOT NULL DEFAULT 0.00"),
                ("other_charges", "DECIMAL(10,2) NOT NULL DEFAULT 0.00"),
                ("discount", "DECIMAL(10,2) NOT NULL DEFAULT 0.00"),
            ):
                add_column("invoices", name, declaration)
            ensure_enum_values(
                "invoices", "status",
                ("DRAFT", "PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"),
                "PENDING",
            )

            for name, declaration in (
                ("invoice_id", "INT NULL"),
                ("overdue_days", "INT NOT NULL DEFAULT 0"),
                ("applied_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"),
            ):
                add_column("late_fees", name, declaration)

            for name, declaration in (
                ("deposit_number", "VARCHAR(100) NULL"),
                ("paid_amount", "DECIMAL(10,2) NOT NULL DEFAULT 0.00"),
                ("adjusted_amount", "DECIMAL(10,2) NOT NULL DEFAULT 0.00"),
            ):
                add_column("security_deposits", name, declaration)
            ensure_enum_values(
                "security_deposits", "status",
                ("PENDING", "PARTIAL", "PAID", "REFUNDED", "ADJUSTED"),
                "PENDING",
            )

            for name, declaration in (
                ("razorpay_order_id", "VARCHAR(100) NULL"),
                ("razorpay_payment_id", "VARCHAR(100) NULL"),
                ("razorpay_signature", "VARCHAR(255) NULL"),
            ):
                add_column("payments", name, declaration)

            cursor.execute(
                """CREATE TABLE IF NOT EXISTS seller_profiles (
                    seller_id INT NOT NULL AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    seller_number BIGINT UNSIGNED DEFAULT NULL,
                    store_name VARCHAR(150) NOT NULL,
                    store_description TEXT DEFAULT NULL,
                    pickup_address VARCHAR(1000) NOT NULL,
                    gstin VARCHAR(15) DEFAULT NULL,
                    status ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
                    admin_notes TEXT DEFAULT NULL,
                    reviewed_by INT DEFAULT NULL,
                    reviewed_at TIMESTAMP NULL DEFAULT NULL,
                    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (seller_id),
                    UNIQUE KEY uq_seller_profiles_seller_number (seller_number),
                    UNIQUE KEY uq_seller_profiles_user (user_id),
                    KEY idx_seller_profiles_status (status),
                    CONSTRAINT fk_seller_profiles_user FOREIGN KEY (user_id)
                      REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
                    CONSTRAINT fk_seller_profiles_reviewer FOREIGN KEY (reviewed_by)
                      REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"""
            )
            add_column("seller_profiles", "seller_number", "BIGINT UNSIGNED NULL")
            for name, declaration in (
                ("store_description", "TEXT NULL"),
                ("gstin", "VARCHAR(15) NULL"),
                ("status", "ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending'"),
                ("admin_notes", "TEXT NULL"),
                ("reviewed_by", "INT NULL"),
                ("reviewed_at", "TIMESTAMP NULL DEFAULT NULL"),
                ("created_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"),
                ("updated_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            ):
                add_column("seller_profiles", name, declaration)
            cursor.execute(
                """SELECT 1 FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA=%s AND TABLE_NAME='seller_profiles'
                     AND INDEX_NAME='uq_seller_profiles_seller_number'""",
                (database_name,),
            )
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE seller_profiles ADD UNIQUE KEY uq_seller_profiles_seller_number (seller_number)")
            cursor.execute(
                """CREATE TABLE IF NOT EXISTS late_fee_configs (
                    config_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL DEFAULT 'Default Config',
                    grace_period_days INT NOT NULL DEFAULT 3,
                    late_fee_type ENUM('fixed','percentage','per_day') NOT NULL DEFAULT 'fixed',
                    late_fee_value DECIMAL(10,2) NOT NULL DEFAULT 500.00,
                    max_late_fee DECIMAL(10,2) DEFAULT 2000.00,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"""
            )
            cursor.execute(
                """CREATE TABLE IF NOT EXISTS security_deposit_logs (
                    log_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    deposit_id INT NOT NULL,
                    action_type ENUM('PAYMENT','REFUND','PARTIAL_REFUND','ADJUSTMENT_DAMAGE','ADJUSTMENT_DUES') NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    remaining_balance DECIMAL(10,2) NOT NULL,
                    reason TEXT DEFAULT NULL,
                    transaction_id VARCHAR(100) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    KEY idx_deposit_logs_deposit (deposit_id),
                    KEY idx_deposit_logs_action (action_type),
                    CONSTRAINT fk_deposit_logs_deposit FOREIGN KEY (deposit_id)
                      REFERENCES security_deposits(deposit_id) ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"""
            )

            if "role" not in columns("users"):
                raise RuntimeError("Required users.role column is missing")
            ensure_enum_values("users", "role", ("seller",), "customer")
            ensure_enum_values(
                "payments", "payment_method",
                ("mock_card", "mock_upi", "razorpay", "cash", "bank_transfer", "cash_on_delivery"),
                "mock_card",
            )
            ensure_enum_values(
                "payments", "status",
                ("pending", "success", "failed", "refunded", "PENDING", "SUCCESS", "FAILED", "REFUNDED", "PENDING_COLLECTION"),
                "PENDING",
            )
            ensure_enum_values(
                "payments", "payment_type",
                ("full", "partial", "security_deposit", "late_fee", "invoice", "RENT", "SECURITY_DEPOSIT", "LATE_FEE", "OTHER"),
                "full",
            )

            cursor.execute("SELECT COUNT(*) AS count FROM late_fee_configs")
            if cursor.fetchone()["count"] == 0:
                cursor.execute(
                    """INSERT INTO late_fee_configs (name,grace_period_days,late_fee_type,late_fee_value,max_late_fee)
                       VALUES ('Standard Policy',3,'fixed',500.00,2000.00)"""
                )
        connection.commit()
        print("Python backend schema requirements are ready; existing records were preserved.")
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == "__main__":
    migrate()
