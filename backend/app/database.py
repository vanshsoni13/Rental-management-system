from collections.abc import Iterator, Sequence
from contextlib import contextmanager
import os
from typing import Any

import pymysql
from pymysql.cursors import DictCursor


def connect(*, autocommit: bool = True) -> pymysql.Connection:
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "rental_management_db"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=autocommit,
        connect_timeout=5,
    )


def fetch_all(sql: str, params: Sequence[Any] = ()) -> list[dict[str, Any]]:
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return list(cursor.fetchall())


def fetch_one(sql: str, params: Sequence[Any] = ()) -> dict[str, Any] | None:
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchone()


def execute(sql: str, params: Sequence[Any] = ()) -> int:
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return int(cursor.lastrowid)


@contextmanager
def transaction() -> Iterator[tuple[pymysql.Connection, Any]]:
    connection = connect(autocommit=False)
    try:
        with connection.cursor() as cursor:
            yield connection, cursor
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
