from typing import TypedDict

from langchain_core.tools import tool

from src.utils.logger import get_logger

logger = get_logger(__name__)


class Skill(TypedDict):
    """Skill que se revela al agente de forma progresiva (progressive disclosure)."""

    name: str  # Identificador único de la skill
    description: str  # Descripción breve (1-2 frases) que se muestra al listar
    content: str  # Instrucciones completas que se cargan solo cuando se necesitan


SKILLS: list[Skill] = [
    {
        "name": "solicitud_devolucion",
        "description": (
            "Procedimiento para registrar la devolución de un producto de UFit con "
            "reembolso: datos a pedir, validaciones de la política y formato de la solicitud."
        ),
        "content": """# Solicitud de devolución

## Objetivo
Guiar al cliente para registrar la devolución de un producto, calcular su reembolso
según la política de UFit y entregarle la solicitud final para su confirmación.

## Datos obligatorios
| Campo               | Validación                                                         |
|---------------------|--------------------------------------------------------------------|
| Número de pedido    | Formato UF- seguido de 4 dígitos (ej. UF-1001)                     |
| Correo de la compra | Formato válido (usuario@dominio.ext)                               |
| Producto            | Debe estar en el pedido                                            |
| Estado del producto | "nuevo" (con etiquetas), "abierto" (probado sin uso) o "usado"     |
| Motivo              | defecto, producto_equivocado, talla o cambio_de_opinion            |
| Método de reembolso | Método de pago original o monedero UFit                            |

## Pasos
1. Saluda y explica brevemente qué datos necesitas. Pide como máximo 3 datos por
   mensaje y nunca inventes datos del cliente.
2. Usa `rastrear_pedido` con el número de pedido para confirmar que fue entregado y
   obtener `dias_desde_entrega`. Si el pedido no está entregado, explícale que la
   devolución se pide después de recibirlo (o que puede cancelarlo si está en preparación).
3. Si el producto pertenece a una categoría no retornable (ropa interior, trajes de
   baño, suplementos abiertos, personalizados), consulta `retrieve_documents` y
   explica por qué no procede.
4. Pregunta el precio pagado del producto si no lo conoces (puedes consultarlo con
   `run_sql` en la tabla ufit_detalle_pedidos si está disponible).
5. Usa `calcular_reembolso` con precio, días desde la entrega, estado y motivo.
   Nunca calcules el monto de memoria.
6. Muestra la solicitud con la plantilla de abajo y pide confirmación.
7. Si el cliente confirma, indícale que recibirá la guía de retorno de Estafeta por
   correo en 24 horas y que tiene 7 días para entregar el paquete.

## Plantilla de la solicitud
```
SOLICITUD DE DEVOLUCIÓN UFit
============================
Pedido:              <UF-XXXX>
Correo:              <correo>
Producto:            <producto>
Estado del producto: <nuevo | abierto | usado>
Motivo:              <motivo>
Días desde entrega:  <n>

Reembolso:           $<monto> MXN (<porcentaje> %)
Guía de retorno:     <Gratis | $99 MXN descontados>
Método de reembolso: <método>
Estado:              PENDIENTE DE CONFIRMACIÓN
```
""",
    },
    {
        "name": "cambio_de_talla",
        "description": (
            "Procedimiento para cambiar un producto de UFit por otra talla del mismo "
            "modelo: condiciones, verificación de stock y formato de la solicitud."
        ),
        "content": """# Solicitud de cambio de talla

## Objetivo
Guiar al cliente para cambiar un producto por otra talla del mismo modelo,
verificando las condiciones y el stock disponible.

## Datos obligatorios
| Campo            | Validación                                                     |
|------------------|----------------------------------------------------------------|
| Número de pedido | Formato UF- seguido de 4 dígitos                               |
| Producto         | Debe estar en el pedido                                        |
| Talla actual     | Talla MX de calzado (22-30) o ropa (XS, S, M, L, XL)           |
| Talla nueva      | Distinta de la actual y del mismo sistema de tallas            |
| Estado           | Debe estar sin uso y con etiquetas                             |

## Pasos
1. Pide los datos que falten de forma conversacional. Si el cliente duda de su
   talla, usa `retrieve_documents` para consultar la guía de tallas.
2. Usa `rastrear_pedido` para confirmar que el pedido se entregó hace 30 días o menos.
   Si pasaron más de 30 días, explica que ya no aplica el cambio.
3. Si el producto está usado, explica que no aplica el cambio de talla.
4. Verifica el stock de la talla nueva con `run_sql` sobre ufit_productos (mismo
   nombre de producto, columna talla). Si no hay stock, ofrece una devolución
   (skill solicitud_devolucion) o una talla cercana con stock.
5. Recuerda que el primer cambio es gratis y desde el segundo la guía cuesta $99 MXN
   (nivel Oro de UFit Club: cambios ilimitados gratis).
6. Muestra la solicitud con la plantilla y pide confirmación. Si confirma, indica que
   la talla nueva se envía cuando el almacén reciba el original (2 a 5 días hábiles).

## Plantilla de la solicitud
```
SOLICITUD DE CAMBIO DE TALLA UFit
=================================
Pedido:          <UF-XXXX>
Producto:        <producto>
Talla actual:    <talla>
Talla nueva:     <talla>
Stock talla nueva: <disponible | sin stock>
Costo de guía:   <Gratis | $99 MXN>
Estado:          PENDIENTE DE CONFIRMACIÓN
```
""",
    },
]


@tool
def list_skills() -> str:
    """Lista las skills disponibles (nombre y descripción breve). Úsala para
    descubrir qué procedimientos especializados existen antes de cargar uno."""
    logger.info("Listando %d skill(s)", len(SKILLS))
    return "\n".join(f"- {skill['name']}: {skill['description']}" for skill in SKILLS)


@tool
def load_skill(skill_name: str) -> str:
    """Carga el contenido completo de una skill: instrucciones, validaciones y
    plantillas para atender un tipo de solicitud. Úsala después de list_skills
    con el nombre exacto de la skill (por ejemplo, "solicitud_devolucion")."""
    for skill in SKILLS:
        if skill["name"] == skill_name:
            logger.info("Skill cargada: %s", skill_name)
            return f"Skill cargada: {skill_name}\n\n{skill['content']}"

    available = ", ".join(skill["name"] for skill in SKILLS)
    logger.warning("Skill no encontrada: %s", skill_name)
    return f"La skill '{skill_name}' no existe. Skills disponibles: {available}"


SKILL_TOOLS = [list_skills, load_skill]
