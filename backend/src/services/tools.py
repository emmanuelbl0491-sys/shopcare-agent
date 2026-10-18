import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Literal, Tuple

from langchain_core.tools import tool
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore

from src.services.skills import SKILL_TOOLS
from src.utils.environment import (
    NEON_API_KEY,
    OPENAI_API_KEY,
    QDRANT_KEY,
    QDRANT_COLLECTION_NAME,
    QDRANT_URL,
)
from src.utils.logger import get_logger

logger = get_logger(__name__)


# Datos de la paquetería (mock): en producción sería la API de Estafeta/FedEx/DHL.
ENVIOS_PATH = Path(__file__).resolve().parents[2] / "data" / "envios.json"

# Política de devoluciones UFit (data/kb/politica_devoluciones.md).
PLAZO_DEVOLUCION_DIAS = 30
PORCENTAJE_REEMBOLSO = {"nuevo": 1.0, "abierto": 0.85, "usado": 0.0}
COSTO_GUIA_RETORNO_MXN = 99.0
DIAS_HABILES_RETRASO = 8


@tool
def rastrear_pedido(numero_pedido: str) -> str:
    """Consulta el estado de envío de un pedido de UFit en la paquetería: estado
    (en_preparacion, en_transito, en_reparto, entregado, incidencia,
    devuelto_a_ufit), paquetería, número de guía, fechas y eventos. Úsala cuando
    el cliente pregunte dónde está su pedido o cuándo llega. El número de pedido
    tiene el formato UF-1234."""
    numero = numero_pedido.strip().upper()
    envios = json.loads(ENVIOS_PATH.read_text(encoding="utf-8"))
    envio = envios.get(numero)
    if envio is None:
        return f"No se encontró el pedido {numero}. Verifica el número (formato UF-1234)."

    resultado = {"numero_pedido": numero, **envio}
    if envio.get("fecha_entrega"):
        entrega = date.fromisoformat(envio["fecha_entrega"])
        resultado["dias_desde_entrega"] = (date.today() - entrega).days
    if envio["estado"] == "en_transito" and envio.get("fecha_envio"):
        # Política de envíos: más de 8 días hábiles en tránsito = retrasado.
        envio_desde = date.fromisoformat(envio["fecha_envio"])
        dias_habiles = sum(
            1
            for i in range(1, (date.today() - envio_desde).days + 1)
            if (envio_desde + timedelta(days=i)).weekday() < 5
        )
        resultado["dias_habiles_en_transito"] = dias_habiles
        resultado["retrasado"] = dias_habiles > DIAS_HABILES_RETRASO
    return json.dumps(resultado, ensure_ascii=False)


@tool
def calcular_reembolso(
    precio_producto: float,
    dias_desde_entrega: int,
    estado_producto: Literal["nuevo", "abierto", "usado"],
    motivo: Literal["defecto", "producto_equivocado", "talla", "cambio_de_opinion"],
) -> str:
    """Calcula el monto a reembolsar de una devolución según la política de UFit.
    estado_producto: "nuevo" (sin uso y con etiquetas), "abierto" (probado sin uso
    deportivo) o "usado". motivo: "defecto", "producto_equivocado", "talla" o
    "cambio_de_opinion". Úsala siempre que el cliente quiera saber cuánto le
    devuelven; no calcules el reembolso de memoria."""
    if motivo in ("defecto", "producto_equivocado"):
        return json.dumps(
            {
                "aplica": True,
                "porcentaje": 100,
                "costo_guia_mxn": 0,
                "reembolso_mxn": round(precio_producto, 2),
                "nota": "Defecto o error de UFit: reembolso total y guía de retorno gratis.",
            },
            ensure_ascii=False,
        )

    if dias_desde_entrega > PLAZO_DEVOLUCION_DIAS:
        return json.dumps(
            {
                "aplica": False,
                "reembolso_mxn": 0,
                "nota": f"Han pasado {dias_desde_entrega} días; el plazo es de "
                f"{PLAZO_DEVOLUCION_DIAS} días. Solo aplica la garantía por defecto de fábrica.",
            },
            ensure_ascii=False,
        )

    porcentaje = PORCENTAJE_REEMBOLSO[estado_producto]
    if porcentaje == 0:
        return json.dumps(
            {
                "aplica": False,
                "reembolso_mxn": 0,
                "nota": "Producto usado: no aplica reembolso por cambio de opinión.",
            },
            ensure_ascii=False,
        )

    reembolso = max(precio_producto * porcentaje - COSTO_GUIA_RETORNO_MXN, 0)
    return json.dumps(
        {
            "aplica": True,
            "porcentaje": int(porcentaje * 100),
            "costo_guia_mxn": COSTO_GUIA_RETORNO_MXN,
            "reembolso_mxn": round(reembolso, 2),
            "nota": "Se descuenta la guía de retorno de $99 MXN. Con monedero UFit "
            "recibes el reembolso inmediato y un bono del 5 %.",
        },
        ensure_ascii=False,
    )


_vector_store: QdrantVectorStore | None = None


def _get_vector_store() -> QdrantVectorStore:
    global _vector_store
    if _vector_store is None:
        logger.info(
            "Inicializando QdrantVectorStore",
            extra={"collection": QDRANT_COLLECTION_NAME},
        )
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small", api_key=OPENAI_API_KEY
        )
        _vector_store = QdrantVectorStore.from_existing_collection(
            embedding=embeddings,
            collection_name=QDRANT_COLLECTION_NAME,
            url=QDRANT_URL,
            api_key=QDRANT_KEY,
        )
    return _vector_store


@tool(response_format="content_and_artifact")
def retrieve_documents(query: str, k: int = 4) -> Tuple[str, List[Dict[str, Any]]]:
    """Busca en la base de conocimiento de UFit (Qdrant) las políticas oficiales:
    devoluciones y reembolsos, envíos y entregas, garantías, guía de tallas y
    cambios de talla, métodos de pago, meses sin intereses, facturación, UFit
    Club, tiendas físicas y canales de atención. Usa siempre esta herramienta
    para responder preguntas sobre estos temas, en lugar de responder de memoria."""
    vector_store = _get_vector_store()
    results = vector_store.similarity_search_with_score(query, k=k)

    if not results:
        return "No se encontraron documentos relevantes.", []

    contexts: List[Dict[str, Any]] = []
    content_parts: List[str] = []
    for doc, score in results:
        contexts.append(
            {
                "page_content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
            }
        )
        content_parts.append(doc.page_content)

    content = "\n\n---\n\n".join(content_parts)
    return content, contexts


LOCAL_TOOLS = [rastrear_pedido, calcular_reembolso, retrieve_documents, *SKILL_TOOLS]

# Mínimo privilegio: el MCP de Neon expone >100 tools (incluye delete_project,
# create_branch, ...). El agente solo recibe las de lectura de datos.
NEON_ALLOWED_TOOLS = {"run_sql", "get_database_tables", "describe_table_schema"}


async def load_neon_tools() -> Tuple[list, object | None]:
    """Conecta al MCP de Neon y retorna (tools, client). Retorna ([], None) si NEON_API_KEY no está configurado."""
    if not NEON_API_KEY:
        logger.info("NEON_API_KEY no configurado — omitiendo integración Neon MCP")
        return [], None

    client = MultiServerMCPClient(
        {
            "neon": {
                "transport": "streamable_http",
                "url": "https://mcp.neon.tech/mcp",
                "headers": {
                    "Authorization": f"Bearer {NEON_API_KEY}"
                },
            }
        }
    )
    tools = [t for t in await client.get_tools() if t.name in NEON_ALLOWED_TOOLS]
    return tools, client


def get_all_tools(mcp_tools: list | None = None) -> list:
    """Retorna las tools locales combinadas con las tools MCP opcionales."""
    all_tools = list(LOCAL_TOOLS)
    if mcp_tools:
        all_tools.extend(mcp_tools)
        logger.info("Cargadas %d tool(s) de Neon MCP: %s", len(mcp_tools), [t.name for t in mcp_tools])
    return all_tools
