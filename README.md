# UFit Coach — Asistente de postventa con IA

Proyecto final del curso **AI Solution Architect**. **Coach** es un agente de IA que atiende la postventa de **UFit**, una tienda en línea mexicana de artículos deportivos: rastrea pedidos, explica las políticas de devolución, envío y garantía, calcula reembolsos, consulta stock y guía devoluciones y cambios de talla. Todo con guardrails, tracing y feedback humano.

Reutiliza la arquitectura de los laboratorios del curso: el backend **`06_agent_llmops_obs`** y el frontend **`02_agent_app_feedback`**. Cambian la base de conocimiento, la data, la colección de Qdrant, las tools y las skills.

📊 **Presentación:** [`presentacion/UFit_Coach.pptx`](presentacion/UFit_Coach.pptx) · 🏗️ **Arquitectura:** [`docs/arquitectura_c4_l2.md`](docs/arquitectura_c4_l2.md) · ✅ **Evidencias:** [`docs/evidencias/pruebas_e2e.md`](docs/evidencias/pruebas_e2e.md)

---

## 1. Problemática actual

La postventa de UFit se atiende de forma manual por WhatsApp y correo, en horario de oficina. El equipo busca cada guía en el portal de la paquetería, revisa el PDF de políticas y calcula los reembolsos en Excel. El resultado son respuestas lentas (horas), inconsistentes entre agentes y sin métricas de calidad. La mayoría de las consultas son repetitivas: *¿dónde está mi pedido?*, *¿cómo devuelvo?*, *¿qué talla me queda?*

## 2. Cómo se resuelve

| Necesidad del cliente | Cómo la resuelve Coach |
|---|---|
| Políticas (devoluciones, envíos, garantías, tallas, pagos, UFit Club) | **RAG**: `retrieve_documents` sobre Qdrant, colección `ufit_postventa_kb` |
| ¿Dónde está mi pedido? | **Tool** `rastrear_pedido`: API de paquetería (mock `envios.json`) con detección de retraso |
| ¿Cuánto me reembolsan? | **Tool** `calcular_reembolso`: regla de negocio determinista |
| Stock, tallas y productos de un pedido | **MCP de Neon**: `run_sql` sobre las tablas `ufit_*` |
| Devolución y cambio de talla | **Skills** `solicitud_devolucion` y `cambio_de_talla` |
| Seguridad | 8 capas de guardrails (secretos, prompt injection, toxicidad, reglas de negocio, PII, URLs, Prompt Guard 2, gpt-oss-safeguard) |
| Medición | **Tracing** en LangSmith (proyecto `ufit-coach`) + feedback 👍/👎 conectado al trace + golden set de evals |

## 3. Arquitectura (C4 nivel 2)

![C4 Nivel 2](docs/arquitectura_c4_l2.png)

El detalle está en [`docs/arquitectura_c4_l2.md`](docs/arquitectura_c4_l2.md): componentes de la API, diagrama de secuencia y decisiones de diseño.

## 4. Requisitos del proyecto final

| Requisito | Implementación |
|---|---|
| Base de conocimiento | [`data/kb/`](data/kb): 7 documentos de UFit (53 chunks), cargados con [`setup/ingest_kb.py`](setup/ingest_kb.py) |
| Data | [`backend/data/envios.json`](backend/data/envios.json) (paquetería) y [`setup/ufit_neon.sql`](setup/ufit_neon.sql) (catálogo, clientes y pedidos en Neon) |
| Qdrant collection name | `QDRANT_COLLECTION_NAME=ufit_postventa_kb` |
| MCP (opcional) | Neon MCP con allowlist de solo lectura: `run_sql`, `get_database_tables`, `describe_table_schema` |
| Tracing | LangSmith, trace `chat_request` por consulta con spans de guardrails, LLM y tools, tokens, costo y `user_score` |
| Tools en service | [`backend/src/services/tools.py`](backend/src/services/tools.py) y [`skills.py`](backend/src/services/skills.py) |
| Presentación con C4 nivel 2 | [`presentacion/UFit_Coach.pptx`](presentacion/UFit_Coach.pptx) |

### Qué cambió respecto a los labs

| Archivo | Cambio |
|---|---|
| `backend/src/services/tools.py` | `get_weather` → `rastrear_pedido` y `calcular_reembolso`; docstring de `retrieve_documents`; allowlist de tools MCP |
| `backend/src/services/skills.py` | Skills de matrícula y certificados → `solicitud_devolucion` y `cambio_de_talla` |
| `backend/prompts/system/v1.md` | Prompt de "Coach de UFit" |
| `backend/src/services/prompts.py` | Contexto de Neon con las tablas `ufit_*` |
| `backend/src/services/guardrails/` | Capas 7-8 reactivadas; política de la capa 8 y reglas de la capa 4 adaptadas a la tienda |
| `backend/evals/` | Golden set de UFit (26 casos) y prompts de los evaluadores |
| `frontend/app/` | Marca UFit Coach (título, textos y color) |

Sin cambios: el pipeline de guardrails, los hooks, el feedback, el historial, los prompts versionados, el código de tracing y la lógica del frontend.

## 5. Estructura del repositorio

```
shopcare-agent/
├── backend/        # API FastAPI + agente LangChain (basado en 06_agent_llmops_obs)
├── frontend/       # Next.js + Firebase Auth (basado en 02_agent_app_feedback)
├── data/kb/        # Base de conocimiento de UFit (markdown)
├── setup/          # Ingesta a Qdrant, seed de Neon y DDL de history
├── docs/           # Arquitectura C4 L2 y evidencias
└── presentacion/   # UFit_Coach.pptx y los scripts que la generan
```

## 6. Cómo ejecutarlo

### Prerrequisitos
Python 3.12, Node 20+, y cuentas de OpenAI, Qdrant Cloud, Neon, Groq, LangSmith y Firebase.

### 1) Backend
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt langchain-text-splitters
cp .env.example .env        # completa las keys y la DATABASE_URL
```
Crea la tabla `history` con [`setup/database_history.sql`](setup/database_history.sql).

### 2) Cargar la base de conocimiento y la data (desde la raíz del repo)
```bash
backend/.venv/bin/python setup/ingest_kb.py   # Qdrant → ufit_postventa_kb
backend/.venv/bin/python setup/seed_neon.py   # Neon → tablas ufit_* (vía MCP)
```

### 3) Levantar la API
```bash
cd backend && python -m src.main              # http://localhost:8080 (docs en /docs)
```

### 4) Frontend
```bash
cd frontend
cp .env.example .env                           # credenciales de Firebase y NEXT_PUBLIC_API_BASE
npm install && npm run dev                     # http://localhost:3000
```

### 5) Pruebas
```bash
cd backend && python -m pytest -q              # 61 tests
python evals/run_evals.py                      # eval gate con el golden set (opcional)
```

Preguntas de ejemplo:
- *¿Cuántos días tengo para devolver un producto?* (RAG)
- *¿Dónde está mi pedido UF-1006?* (tool, pedido retrasado)
- *Compré unos tenis de $2,499 hace 10 días, están nuevos, ¿cuánto me devuelven?* (tool de reembolso)
- *¿Tienen stock de los tenis Velox Nimbus en talla 27?* (MCP)
- *Quiero cambiar la talla de mis tenis del pedido UF-1008* (skill + MCP)

## 7. Conclusiones

1. **La arquitectura se reutiliza.** Cambiar de dominio (de academia a tienda deportiva) fue cambiar la KB, la data, las tools y el prompt; la estructura del backend y del frontend no cambió.
2. **Los cálculos de negocio van en tools deterministas**, no en el LLM: el reembolso y el retraso de un envío son exactos y auditables.
3. **MCP con mínimo privilegio.** El MCP de Neon expone más de 100 tools, incluida `delete_project`. Filtrarlas reduce el riesgo y también los tokens del prompt.
4. **El fail-close tiene costo.** Con timeout de 3 s, los picos de latencia del free tier de Groq bloqueaban consultas legítimas. Se subió a 10 s; en producción convendría un tier pagado o un clasificador local.
5. **Observabilidad desde el día uno.** Con un `trace_id` compartido entre la API, la BD y LangSmith, cada 👍/👎 queda conectado a su trace: tokens, costo (unos USD 0.0006 por consulta) y tools usadas.

**Próximos pasos:** API real de las paqueterías, PII de México (CURP, RFC) en la capa 5, despliegue en Cloud Run con el CI/CD del lab 06, online evals y escalamiento a humano por WhatsApp.
