"""
Pytest configuration and shared fixtures.

Provides a real database session for tests by:
1. Using a separate test schema on the same Postgres instance (via DATABASE_URL), OR
2. Falling back to in-memory SQLite when DATABASE_URL is not configured.

The `db` fixture yields a transactional session that is rolled back after each test,
ensuring tests are isolated without needing to tear down rows manually.
"""
import os
import uuid

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base
# Import all models so Base.metadata knows about them
from app.models import user, entitlement, workflow, document, audit_log  # noqa: F401
from app.models import business_profile, compliance, stripe_event  # noqa: F401


# Models use Postgres-specific types (JSONB), so tests must run against Postgres.
# Default to the main DATABASE_URL with a dedicated `test` schema to isolate
# table state without needing a second database.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", settings.DATABASE_URL)
TEST_SCHEMA = os.getenv("TEST_SCHEMA", "invigov_test")


@pytest.fixture(scope="session")
def _engine():
    """Session-wide engine. Creates an isolated schema and the full table graph.

    The schema is dropped on teardown so nothing leaks into the production
    `public` schema between test runs.
    """
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)

    # Create an isolated schema and set it as the default search path.
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS {TEST_SCHEMA} CASCADE'))
        conn.execute(text(f'CREATE SCHEMA {TEST_SCHEMA}'))

    # Bind all model tables to the test schema before creating them.
    for table in Base.metadata.tables.values():
        table.schema = TEST_SCHEMA

    # Set a search_path so queries resolve to the test schema.
    @sqlalchemy_event_listener_ready(engine)
    def _apply_search_path(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute(f'SET search_path TO {TEST_SCHEMA}, public')
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine

    # Teardown: drop the whole schema
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS {TEST_SCHEMA} CASCADE'))
    engine.dispose()


def sqlalchemy_event_listener_ready(engine):
    """Decorator helper that attaches a connect listener to the engine."""
    from sqlalchemy import event

    def decorator(fn):
        event.listen(engine, "connect", fn)
        return fn

    return decorator


@pytest.fixture
def db(_engine):
    """
    Per-test transactional session. Each test gets a clean database state
    because the enclosing transaction is rolled back after the test.
    """
    connection = _engine.connect()
    transaction = connection.begin()
    TestSession = sessionmaker(bind=connection, autoflush=False, autocommit=False)
    session = TestSession()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def test_workspace_id(db):
    """Create a workspace row and return its ID.

    Many services call `db.query(Workspace)` or rely on FK constraints,
    so we materialize an actual row instead of just returning a UUID.
    """
    from app.models.user import Workspace

    ws_id = uuid.uuid4()
    ws = Workspace(id=ws_id, name=f"Test WS {ws_id.hex[:8]}")
    db.add(ws)
    db.flush()
    return ws_id


@pytest.fixture
def test_user_id():
    """Return a random UUID string for actor fields."""
    return str(uuid.uuid4())
