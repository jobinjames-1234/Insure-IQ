import logging
from sqlalchemy import inspect, text, Enum as SAEnum

logger = logging.getLogger("insureiq.migrations")

def auto_upgrade_schema(engine):
    """
    Auto-detects missing tables and missing columns in existing tables and adds them.
    Guarantees seamless schema evolution across SQLite (local dev) and PostgreSQL (Render/production).
    """
    from . import models

    # 1. Create missing tables and types using standard SQLAlchemy metadata
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"[AutoMigration] Base create_all warning: {e}")

    # 2. Inspect database for existing tables and columns
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    is_postgres = engine.dialect.name == "postgresql"

    with engine.connect() as conn:
        # For PostgreSQL, ensure enum types exist before adding enum columns
        if is_postgres:
            for table_name, table in models.Base.metadata.tables.items():
                for col in table.columns:
                    if isinstance(col.type, SAEnum) and col.type.name:
                        enum_name = col.type.name.lower()
                        enum_values = "', '".join(str(e) for e in col.type.enums)
                        enum_sql = f"""
                        DO $$
                        BEGIN
                            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{enum_name}') THEN
                                CREATE TYPE {enum_name} AS ENUM ('{enum_values}');
                            END IF;
                        END$$;
                        """
                        try:
                            conn.execute(text(enum_sql))
                            conn.commit()
                        except Exception as e:
                            logger.warning(f"[AutoMigration] Enum create warning for {enum_name}: {e}")

        # 3. Add any missing columns to existing tables
        for table_name, table in models.Base.metadata.tables.items():
            if table_name not in existing_tables:
                continue

            existing_cols = {c["name"] for c in inspector.get_columns(table_name)}

            for col in table.columns:
                if col.name not in existing_cols:
                    col_type = col.type.compile(engine.dialect)
                    default_clause = ""
                    
                    if is_postgres:
                        if col.server_default is not None:
                            default_clause = " DEFAULT NOW()"
                        elif col.default is not None and hasattr(col.default, "arg"):
                            val = col.default.arg
                            if hasattr(val, "value"):
                                val = val.value
                            if isinstance(val, str):
                                default_clause = f" DEFAULT '{val}'"
                            elif isinstance(val, (int, float)):
                                default_clause = f" DEFAULT {val}"
                            elif isinstance(val, bool):
                                default_clause = f" DEFAULT {'TRUE' if val else 'FALSE'}"
                    else:
                        # SQLite syntax
                        if col.server_default is not None:
                            default_clause = " DEFAULT CURRENT_TIMESTAMP"
                        elif col.default is not None and hasattr(col.default, "arg"):
                            val = col.default.arg
                            if hasattr(val, "value"):
                                val = val.value
                            if isinstance(val, str):
                                default_clause = f" DEFAULT '{val}'"
                            elif isinstance(val, (int, float)):
                                default_clause = f" DEFAULT {val}"
                            elif isinstance(val, bool):
                                default_clause = f" DEFAULT {1 if val else 0}"

                    if is_postgres:
                        sql = f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col.name}" {col_type}{default_clause}'
                    else:
                        sql = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type}{default_clause}'

                    print(f"[AutoMigration] Adding missing column: {table_name}.{col.name} ({col_type})")
                    try:
                        conn.execute(text(sql))
                        conn.commit()
                        logger.info(f"Successfully added column {table_name}.{col.name}")
                    except Exception as err:
                        print(f"[AutoMigration Warning] Failed adding {table_name}.{col.name}: {err}")
