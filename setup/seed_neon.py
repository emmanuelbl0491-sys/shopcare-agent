"""Crea y puebla las tablas ufit_* en Neon usando el mismo MCP que usa el agente.

Así la data queda en el mismo proyecto/base que consulta Coach con run_sql.
Alternativa manual: pegar setup/ufit_neon.sql en el SQL Editor de Neon.

Uso (desde la raíz del repo):
    backend/.venv/bin/python setup/seed_neon.py
Lee NEON_API_KEY y NEON_PROJECT_ID de backend/.env.
"""
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env")


def split_statements(sql: str) -> list[str]:
    lines = [line for line in sql.splitlines() if not line.strip().startswith("--")]
    return [s.strip() for s in "\n".join(lines).split(";") if s.strip()]


async def main() -> None:
    client = MultiServerMCPClient(
        {
            "neon": {
                "transport": "streamable_http",
                "url": "https://mcp.neon.tech/mcp",
                "headers": {"Authorization": f"Bearer {os.environ['NEON_API_KEY']}"},
            }
        }
    )
    tools = {t.name: t for t in await client.get_tools()}
    statements = split_statements((ROOT / "setup" / "ufit_neon.sql").read_text(encoding="utf-8"))
    await tools["run_sql_transaction"].ainvoke(
        {"sql_statements": statements, "project_id": os.environ["NEON_PROJECT_ID"]}
    )
    print(f"{len(statements)} sentencias ejecutadas")

    check = await tools["run_sql"].ainvoke(
        {
            "sql": "SELECT (SELECT count(*) FROM ufit_productos) AS productos, "
            "(SELECT count(*) FROM ufit_pedidos) AS pedidos",
            "project_id": os.environ["NEON_PROJECT_ID"],
        }
    )
    print(check)


if __name__ == "__main__":
    asyncio.run(main())
