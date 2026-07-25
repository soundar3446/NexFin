from sqlalchemy import text

from app.database import engine

# The project uses Base.metadata.create_all (no migration tool), which only
# creates missing tables - it never alters columns onto a table that already
# exists in a running database. These statements keep existing "transactions"
# tables in sync with new columns added to the model.
_STATEMENTS = [
    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR",
    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_source VARCHAR",
]


def apply_schema_upgrades():
    with engine.begin() as conn:
        for statement in _STATEMENTS:
            conn.execute(text(statement))
