const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
// apply_theme (opcional) escribe la paleta en el tema del .pptx; sin él, el deck usa colores hex igual.
let applyTheme = async () => {};
try { ({ applyTheme } = require(process.env.SKILL_DIR + "/scripts/apply_theme.js")); } catch (_) {}

const OUT = process.argv[2];
const DIAGRAM = process.argv[3];

const THEME = {
  name: "UFit Coach",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "1F2933", lt1: "FFFFFF", dk2: "3E4C59", lt2: "F4F5F7",
    accent1: "E8590C", accent2: "1168BD", accent3: "2F9E44", accent4: "F59F00",
    accent5: "6B6B6B", accent6: "C92A2A", hlink: "1168BD", folHlink: "6B6B6B",
  },
};
const HEX = THEME.colors;

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = "UFit Coach — Proyecto final AI Solution Architect";
  pres.author = "Manu BL";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  pres.defineSlideMaster({
    title: "DARK",
    background: { color: HEX.dk1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.2, w: 11.7, h: 1.3, fontSize: 54, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.7, w: 11.7, h: 1.6, fontSize: 22, color: "FFD8A8", valign: "top", align: "left", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CONTENT",
    background: { color: HEX.lt1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontSize: 36, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: "UFit Coach · Proyecto final AI Solution Architect", options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: "8A94A0", margin: 0 } } },
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: "8A94A0" },
  });

  const card = (s, x, y, w, h, fill = HEX.lt2, name) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill }, objectName: name });
  const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, color: HEX.dk1, fontSize: 16, ...o });
  const circleIcon = async (s, Comp, x, y, d, bg, fg = "FFFFFF") => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg } });
    const pad = d * 0.24;
    s.addImage({ data: await icon(Comp, fg), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
  };

  // 1. Portada
  pres.addSection({ title: "Portada" });
  let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Portada" });
  s.addText("UFit Coach", { placeholder: "title" });
  s.addText("Asistente de postventa con IA para UFit, tienda en línea de artículos deportivos en México", { placeholder: "body" });
  await circleIcon(s, fa.FaRunning, 0.8, 0.9, 1.1, HEX.accent1);
  txt(s, "Proyecto final · AI Solution Architect · Manu BL · Octubre 2026", { x: 0.8, y: 6.4, w: 11, h: 0.4, fontSize: 14, color: "C9CED6" });
  s.addNotes("Presentar el proyecto en una frase: Coach es un agente de IA que resuelve la postventa de UFit 24/7, reutilizando la arquitectura del curso (backend 06 y frontend 02).");

  // 2. Problemática
  pres.addSection({ title: "Problema" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Problema" });
  s.addText("La postventa de UFit no escala con las ventas", { placeholder: "title" });
  txt(s, "Cada pedido genera preguntas repetitivas que hoy atiende un equipo pequeño, por WhatsApp y correo, solo en horario de oficina.", { x: 0.6, y: 1.4, w: 12, h: 0.7, fontSize: 18, color: HEX.dk2 });
  const stats = [
    ["1,200", "consultas de postventa por semana"],
    ["18 h", "tiempo medio de primera respuesta"],
    ["65 %", "son preguntas repetitivas: pedido, devolución, talla"],
    ["0", "métricas de calidad de las respuestas"],
  ];
  stats.forEach(([n, l], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 2.5, 2.8, 2.9, HEX.lt2, "stat" + i);
    txt(s, n, { x: x + 0.25, y: 2.8, w: 2.3, h: 1.1, fontSize: 54, bold: true, color: HEX.accent1, fontFace: THEME.headFontFace });
    txt(s, l, { x: x + 0.25, y: 4.0, w: 2.3, h: 1.1, fontSize: 16, color: HEX.dk2, valign: "top" });
  });
  txt(s, "Costo de no actuar: clientes que esperan un día por una respuesta, abandonan la compra siguiente y saturan el canal con mensajes de seguimiento.", { x: 0.6, y: 5.8, w: 12, h: 0.7, fontSize: 16, italic: true, color: HEX.dk1 });
  txt(s, "Cifras ilustrativas del caso de estudio (supuestos)", { x: 8.7, y: 6.6, w: 4, h: 0.3, fontSize: 10, color: "8A94A0", align: "right" });
  s.addNotes("Hook: la tienda crece, pero la postventa es manual. Aclarar que las cifras son supuestos del caso de estudio, no datos históricos.");

  // 3. Cómo se resuelve hoy
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Problema" });
  s.addText("Hoy cada respuesta es un proceso manual de cinco pasos", { placeholder: "title" });
  const today = [
    [fa.FaWhatsapp, "Cliente escribe", "WhatsApp o correo, en horario 9-19 h"],
    [fa.FaTruck, "Busca la guía", "Portal de cada paquetería, a mano"],
    [fa.FaFilePdf, "Revisa la política", "PDF de devoluciones y garantías"],
    [fa.FaCalculator, "Calcula el reembolso", "Excel con reglas que cada agente interpreta"],
    [fa.FaClock, "Responde", "Horas después, sin registro ni métricas"],
  ];
  for (let i = 0; i < today.length; i++) {
    const [Ic, t, d] = today[i];
    const x = 0.6 + i * 2.5;
    await circleIcon(s, Ic, x + 0.65, 1.8, 0.9, i === 4 ? HEX.accent6 : HEX.dk2);
    if (i < 4) s.addShape(pres.shapes.LINE, { x: x + 1.7, y: 2.25, w: 1.4, h: 0, line: { color: "B0B7C0", width: 1.5, endArrowType: "triangle" } });
    txt(s, t, { x, y: 2.95, w: 2.2, h: 0.5, fontSize: 18, bold: true, align: "center" });
    txt(s, d, { x, y: 3.45, w: 2.2, h: 0.9, fontSize: 14, color: HEX.dk2, align: "center", valign: "top" });
  }
  card(s, 0.6, 4.8, 12.1, 1.7, "FFF4E6", "pains");
  txt(s, [
    { text: "Dolores: ", options: { bold: true, color: HEX.accent1 } },
    { text: "respuestas inconsistentes entre agentes · sin atención nocturna ni en fin de semana · cálculos de reembolso con errores · nadie sabe qué respuestas fueron buenas o malas." },
  ], { x: 0.9, y: 5.0, w: 11.5, h: 1.3, fontSize: 16, valign: "middle" });
  s.addNotes("Explicar el proceso actual paso a paso y los cuatro dolores. Cada uno se conecta con un pilar de la solución.");

  // 4. Solución
  pres.addSection({ title: "Solución" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Solución" });
  s.addText("Coach resuelve la postventa 24/7 en segundos", { placeholder: "title" });
  txt(s, "Un agente de IA en la web de UFit que responde con las políticas oficiales, consulta los datos reales del pedido y guía los trámites.", { x: 0.6, y: 1.4, w: 12, h: 0.7, fontSize: 18, color: HEX.dk2 });
  const pillars = [
    [fa.FaBookOpen, HEX.accent1, "Responde con la política oficial", "RAG sobre 7 documentos de UFit (devoluciones, envíos, garantías, tallas, pagos, UFit Club, FAQ) en Qdrant."],
    [fa.FaBolt, HEX.accent2, "Actúa sobre datos reales", "Tools para rastrear el pedido y calcular el reembolso; MCP de Neon para stock y pedidos; skills para devolución y cambio de talla."],
    [fa.FaShieldAlt, HEX.accent3, "Seguro y medible", "8 capas de guardrails, tracing en LangSmith con tokens y costo, y feedback 👍/👎 conectado a cada trace."],
  ];
  for (let i = 0; i < 3; i++) {
    const [Ic, col, t, d] = pillars[i];
    const x = 0.6 + i * 4.1;
    card(s, x, 2.4, 3.8, 3.9, HEX.lt2, "pillar" + i);
    await circleIcon(s, Ic, x + 0.3, 2.7, 0.9, col);
    txt(s, t, { x: x + 0.3, y: 3.8, w: 3.2, h: 0.8, fontSize: 20, bold: true, valign: "top" });
    txt(s, d, { x: x + 0.3, y: 4.6, w: 3.2, h: 1.6, fontSize: 15, color: HEX.dk2, valign: "top" });
  }
  s.addNotes("Tres pilares, uno por cada grupo de dolores: inconsistencia → política oficial; trabajo manual → datos y cálculos automáticos; sin métricas → observabilidad.");

  // 5. Cómo funciona
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Solución" });
  s.addText("Así responde Coach una consulta", { placeholder: "title" });
  const flow = [
    [fa.FaComments, "1", "El cliente pregunta", "“¿Dónde está mi pedido UF-1006?” desde la web, con sesión de Firebase"],
    [fa.FaShieldAlt, "2", "Guardrails filtran", "8 capas: secretos, prompt injection, toxicidad, PII, URLs y 2 clasificadores LLM"],
    [fa.FaRobot, "3", "El agente decide", "Elige la herramienta: política (RAG), envío, reembolso, stock (MCP) o skill"],
    [fa.FaDatabase, "4", "Responde y registra", "Respuesta en segundos; la conversación queda en la tabla history"],
    [fa.FaChartLine, "5", "Se mide", "Trace en LangSmith con tokens y costo; el 👍/👎 se asocia al trace"],
  ];
  for (let i = 0; i < flow.length; i++) {
    const [Ic, n, t, d] = flow[i];
    const y = 1.5 + i * 1.05;
    await circleIcon(s, Ic, 0.6, y, 0.8, i === 2 ? HEX.accent1 : HEX.accent2);
    txt(s, `${n}. ${t}`, { x: 1.65, y: y + 0.02, w: 3.6, h: 0.76, fontSize: 18, bold: true, valign: "middle" });
    txt(s, d, { x: 5.3, y: y + 0.02, w: 7.4, h: 0.76, fontSize: 15, color: HEX.dk2, valign: "middle" });
  }
  s.addNotes("Recorrer el flujo con el ejemplo del pedido retrasado UF-1006: la tool calcula que lleva 11 días hábiles en tránsito y lo marca como retrasado.");

  // 6. Arquitectura C4
  pres.addSection({ title: "Arquitectura" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Arquitectura" });
  s.addText("Arquitectura: diagrama de contenedores C4 nivel 2", { placeholder: "title" });
  s.addImage({ path: DIAGRAM, x: 1.45, y: 1.35, w: 10.43, h: 5.5, altText: "Diagrama C4 nivel 2 de UFit Coach" });
  s.addNotes("Tres contenedores propios: Frontend Next.js, API del agente (FastAPI + LangChain) y la BD de historial. Siete sistemas externos: Firebase, OpenAI, Qdrant, Groq, Neon vía MCP, la paquetería (mock) y LangSmith.");

  // 7. Reutilizado vs reemplazado
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Arquitectura" });
  s.addText("Se reutilizó la arquitectura y se reemplazó el dominio", { placeholder: "title" });
  const rows = [
    ["Requisito", "Antes (labs del curso)", "UFit Coach"],
    ["Base de conocimiento", "10 docs de la academia", "7 políticas de UFit · 53 chunks"],
    ["Data", "Ventas genéricas", "envios.json + tablas ufit_* en Neon"],
    ["Colección Qdrant", "Colección de la academia", "ufit_postventa_kb"],
    ["Tools del servicio", "get_weather · skills de matrícula", "rastrear_pedido · calcular_reembolso · devolución · cambio de talla"],
    ["MCP", "Neon con todas sus tools", "Neon con allowlist de 3 tools de lectura"],
    ["Tracing", "Proyecto agent-llmops-obs", "Proyecto ufit-coach · tags ufit-coach"],
  ];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({
    text: c,
    options: {
      bold: i === 0 || j === 0, color: i === 0 ? "FFFFFF" : HEX.dk1,
      fill: { color: i === 0 ? HEX.dk1 : (i % 2 ? "FFFFFF" : HEX.lt2) },
      fontSize: 14, valign: "middle", margin: [4, 8, 4, 8],
    },
  }))), { x: 0.6, y: 1.5, w: 12.1, colW: [2.8, 3.9, 5.4], rowH: 0.55, border: { type: "solid", color: "D9DDE2", pt: 0.75 } });
  txt(s, [
    { text: "Sin cambios: ", options: { bold: true, color: HEX.accent3 } },
    { text: "guardrails de 8 capas, hooks, feedback, historial, prompts versionados, evals, tracing (código) y todo el frontend (salvo la marca)." },
  ], { x: 0.6, y: 5.6, w: 12.1, h: 0.9, fontSize: 16 });
  s.addNotes("Esta slide responde la rúbrica del proyecto: cada requisito reemplazado y qué se mantuvo igual.");

  // 8. Observabilidad
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Arquitectura" });
  s.addText("Cada respuesta queda trazada y evaluada", { placeholder: "title" });
  const obs = [["5,495", "tokens en la consulta de stock (MCP)"], ["$0.0006", "USD de costo por esa consulta"], ["7.6 s", "latencia total con 8 guardrails"], ["👍 = 1", "user_score enviado al trace"]];
  obs.forEach(([n, l], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.5, 2.8, 2.2, HEX.lt2, "obs" + i);
    txt(s, n, { x: x + 0.25, y: 1.7, w: 2.3, h: 0.9, fontSize: 40, bold: true, color: HEX.accent2, fontFace: THEME.headFontFace });
    txt(s, l, { x: x + 0.25, y: 2.65, w: 2.3, h: 0.9, fontSize: 15, color: HEX.dk2, valign: "top" });
  });
  txt(s, "Medido en LangSmith, proyecto ufit-coach, trace chat_request", { x: 0.6, y: 3.8, w: 12, h: 0.3, fontSize: 11, color: "8A94A0" });
  const qa = [
    ["Trace por consulta", "trace_id compartido entre la API, la tabla history y LangSmith; spans de guardrails, modelo y tools."],
    ["Feedback humano", "POST /api/feedback guarda is_ok en la BD y envía user_score al trace."],
    ["Evaluación offline", "Golden set de 26 casos: RAG, tools, MCP, skills y guardrails, con 4 evaluadores y umbrales de calidad."],
  ];
  qa.forEach(([t, d], i) => {
    const y = 4.35 + i * 0.8;
    txt(s, t, { x: 0.6, y, w: 3.2, h: 0.7, fontSize: 17, bold: true, valign: "middle" });
    txt(s, d, { x: 3.9, y, w: 8.8, h: 0.7, fontSize: 15, color: HEX.dk2, valign: "middle" });
  });
  s.addNotes("Estas cifras son reales: salen del trace de la prueba end-to-end. Mostrar el trace en LangSmith si hay demo en vivo.");

  // 9. Impacto
  pres.addSection({ title: "Impacto" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Impacto" });
  s.addText("Impacto esperado en la operación de UFit", { placeholder: "title" });
  const impact = [
    ["18 h → < 10 s", "tiempo de primera respuesta", HEX.accent1],
    ["~60 %", "consultas resueltas sin un agente humano", HEX.accent2],
    ["24/7", "atención, incluidas noches y fines de semana", HEX.accent3],
    ["< $0.02 MXN", "costo de modelo por consulta", HEX.accent4],
  ];
  impact.forEach(([n, l, col], i) => {
    const x = 0.6 + (i % 2) * 6.1, y = 1.5 + Math.floor(i / 2) * 2.4;
    card(s, x, y, 5.9, 2.1, HEX.lt2, "imp" + i);
    txt(s, n, { x: x + 0.35, y: y + 0.25, w: 5.2, h: 1.0, fontSize: 40, bold: true, color: col, fontFace: THEME.headFontFace });
    txt(s, l, { x: x + 0.35, y: y + 1.25, w: 5.2, h: 0.6, fontSize: 17, color: HEX.dk2 });
  });
  txt(s, "Proyecciones conservadoras del caso de estudio; el costo por consulta sale del trace medido (USD 0.0006).", { x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 12, italic: true, color: "8A94A0" });
  s.addNotes("Aclarar que las métricas son proyecciones. El único dato medido es el costo por consulta.");

  // 10. Conclusiones
  pres.addSection({ title: "Conclusiones" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conclusiones" });
  s.addText("Conclusiones y próximos pasos", { placeholder: "title" });
  card(s, 0.6, 1.5, 5.9, 5.1, HEX.lt2, "concl");
  card(s, 6.8, 1.5, 5.9, 5.1, "FFF4E6", "next");
  txt(s, "Conclusiones", { x: 0.95, y: 1.75, w: 5.2, h: 0.5, fontSize: 22, bold: true, color: HEX.accent2 });
  txt(s, [
    { text: "Una arquitectura agéntica bien separada se reutiliza: cambiar de dominio fue cambiar KB, data, tools y prompt.", options: { bullet: true, breakLine: true } },
    { text: "Los cálculos de negocio van en tools deterministas, no en el LLM.", options: { bullet: true, breakLine: true } },
    { text: "MCP con mínimo privilegio: de más de 100 tools de Neon, el agente solo usa 3 de lectura.", options: { bullet: true, breakLine: true } },
    { text: "Fail-close tiene un costo: los timeouts de Groq bloqueaban consultas legítimas, así que se ajustó el timeout.", options: { bullet: true } },
  ], { x: 0.95, y: 2.35, w: 5.2, h: 4.0, fontSize: 15, color: HEX.dk1, paraSpaceAfter: 8, valign: "top" });
  txt(s, "Próximos pasos", { x: 7.15, y: 1.75, w: 5.2, h: 0.5, fontSize: 22, bold: true, color: HEX.accent1 });
  txt(s, [
    { text: "Integrar la API real de las paqueterías (Estafeta, FedEx, DHL).", options: { bullet: true, breakLine: true } },
    { text: "PII de México en la capa 5 (CURP, RFC, teléfonos de 10 dígitos).", options: { bullet: true, breakLine: true } },
    { text: "Despliegue en Cloud Run con el CI/CD y canary del lab 06.", options: { bullet: true, breakLine: true } },
    { text: "Online evals en LangSmith y feedback negativo → golden set.", options: { bullet: true, breakLine: true } },
    { text: "Escalar a humano por WhatsApp cuando haya una incidencia abierta.", options: { bullet: true } },
  ], { x: 7.15, y: 2.35, w: 5.2, h: 4.0, fontSize: 15, color: HEX.dk1, paraSpaceAfter: 8, valign: "top" });
  s.addNotes("Cerrar con lo aprendido como arquitecto y con un piloto concreto: 4 semanas con 10 % del tráfico web.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})();
