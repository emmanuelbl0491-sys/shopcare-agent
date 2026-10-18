from pathlib import Path

from src.utils.environment import NEON_PROJECT_ID, PROMPT_VERSION

# Prompts versionados: el texto del system prompt vive en
# prompts/system/{PROMPT_VERSION}.md. Para cambiarlo se crea un archivo nuevo
# (v2.md, ...) y se sube PROMPT_VERSION; el PR dispara el prompt CI (evals).
PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts" / "system"

_neon_context = (
    f"Tienes acceso a la base de datos comercial de UFit en Neon Postgres. "
    f"El project_id que debes usar SIEMPRE en las herramientas MCP es: {NEON_PROJECT_ID}. "
    f"Nunca le preguntes al usuario el project_id, ya lo tienes. "
    f"La base de datos tiene las siguientes tablas: "
    f"- ufit_productos (id, sku, nombre, categoria (calzado, ropa, equipo, relojes, accesorios), talla, precio, stock) "
    f"- ufit_pedidos (numero_pedido, id_cliente, fecha_pedido, total, metodo_pago, estado (pagado, enviado, entregado, cancelado, devuelto)) "
    f"- ufit_detalle_pedidos (id, numero_pedido, id_producto, cantidad, precio_unitario) "
    f"- ufit_clientes (id, nombre, email, ciudad, nivel_club (Bronce, Plata, Oro)) "
    f"Cuando el cliente pregunte por stock, tallas disponibles, precios del catálogo o los productos de un pedido, "
    f"usa run_sql con ese project_id (solo consultas SELECT). Para buscar productos usa ILIKE sobre nombre. "
    f"Para el estado de envío de un pedido usa rastrear_pedido, y para políticas usa retrieve_documents. "
) if NEON_PROJECT_ID else ""



def load_system_prompt(version: str = PROMPT_VERSION) -> str:
    """Carga el system prompt de la versión indicada e inyecta el contexto de Neon."""
    path = PROMPTS_DIR / f"{version}.md"
    if not path.exists():
        raise FileNotFoundError(f"No existe el prompt versionado: {path}")
    template = path.read_text(encoding="utf-8").strip()
    # replace (no format) para que las llaves del markdown no rompan la plantilla.
    return template.replace("{neon_context}", _neon_context).strip()


SYSTEM_PROMPT = load_system_prompt()
