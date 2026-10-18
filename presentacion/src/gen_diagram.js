// Genera el diagrama C4 nivel 2 (contenedores) de UFit Coach como SVG + PNG.
const fs = require("fs");
const sharp = require("sharp");

const OUT = process.argv[2];
const W = 1400, H = 840;
const C = { person: "08427B", container: "1168BD", db: "1168BD", ext: "6B6B6B", line: "444444" };

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let svg = [];
const text = (x, y, lines, { size = 14, color = "FFFFFF", weight = "normal", anchor = "middle", lh = 1.3 } = {}) => {
  const ts = lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * lh}">${esc(l)}</tspan>`).join("");
  svg.push(`<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" fill="#${color}" font-weight="${weight}" text-anchor="${anchor}">${ts}</text>`);
};
const box = (x, y, w, h, fill, title, tech, desc, { rx = 10, descSize = 12 } = {}) => {
  svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#${fill}" stroke="#0B4884" stroke-width="1"/>`);
  text(x + w / 2, y + 24, [title], { size: 16, weight: "bold" });
  text(x + w / 2, y + 43, [tech], { size: 12, color: "DCE8F5" });
  if (desc) text(x + w / 2, y + 64, desc, { size: descSize });
};
const arrow = (x1, y1, x2, y2, label, { lx, ly, anchor = "middle" } = {}) => {
  svg.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#${C.line}" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#arr)"/>`);
  if (label) {
    const mx = lx ?? (x1 + x2) / 2, my = ly ?? (y1 + y2) / 2;
    const lines = Array.isArray(label) ? label : [label];
    const wBox = Math.max(...lines.map((l) => l.length)) * 6.6 + 12, hBox = lines.length * 15 + 6;
    const bx = anchor === "start" ? mx - 6 : mx - wBox / 2;
    svg.push(`<rect x="${bx}" y="${my - 13}" width="${wBox}" height="${hBox}" rx="4" fill="#FFFFFF" fill-opacity="0.92"/>`);
    text(mx, my, lines, { size: 12, color: "222222", anchor, lh: 1.25 });
  }
};

// Encabezado y bandas (estilo diagrama del curso: Clientes | Plataforma | External)
svg.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`);
svg.push(`<rect x="0" y="0" width="${W}" height="44" fill="#E8590C"/>`);
text(24, 29, ["UFit Coach — Diagrama de Contenedores (C4 Nivel 2)"], { size: 20, weight: "bold", anchor: "start" });
svg.push(`<rect x="0" y="44" width="230" height="${H - 44}" fill="#DCEAFB"/>`);
svg.push(`<rect x="230" y="44" width="680" height="${H - 44}" fill="#F3F3F3"/>`);
svg.push(`<rect x="910" y="44" width="${W - 910}" height="${H - 44}" fill="#FDE8EA"/>`);
text(14, 68, ["Clientes"], { size: 14, color: "555555", anchor: "start" });
text(250, 68, ["Sistema UFit Coach (local / Google Cloud Run)"], { size: 14, color: "555555", anchor: "start" });
text(930, 68, ["Sistemas externos"], { size: 14, color: "555555", anchor: "start" });
svg.push(`<rect x="250" y="80" width="640" height="${H - 100}" rx="8" fill="none" stroke="#888888" stroke-width="1.2" stroke-dasharray="8 5"/>`);

// Persona
svg.push(`<circle cx="115" cy="150" r="26" fill="#${C.person}"/>`);
svg.push(`<rect x="25" y="180" width="180" height="96" rx="14" fill="#${C.person}"/>`);
text(115, 206, ["Cliente UFit"], { size: 16, weight: "bold" });
text(115, 225, ["[Persona]"], { size: 12, color: "DCE8F5" });
text(115, 245, ["Consulta pedidos,", "devoluciones y tallas"], { size: 12 });

// Contenedores propios
box(290, 120, 340, 120, C.container, "Frontend Web", "[Container: Next.js 16 + React]",
  ["Login, chat por sesiones,", "historial y feedback 👍/👎"]);
box(290, 330, 360, 270, C.container, "API Agente Coach", "[Container: Python · FastAPI · LangChain]",
  ["1. Guardrails de entrada (8 capas)", "2. Hooks pre/post agente y modelo", "3. Agente create_agent + prompt v1",
   "4. Tools: retrieve_documents,", "    rastrear_pedido, calcular_reembolso", "5. Skills: solicitud_devolucion,",
   "    cambio_de_talla", "6. Cliente MCP (allowlist lectura)", "7. Callbacks de tracing (LangSmith)"], { descSize: 13 });
// BD como cilindro simple
const dbx = 290, dby = 690, dbw = 360, dbh = 110;
svg.push(`<path d="M${dbx} ${dby + 12} a${dbw / 2} 12 0 0 0 ${dbw} 0 v${dbh - 24} a${dbw / 2} 12 0 0 1 -${dbw} 0 z" fill="#${C.db}" stroke="#0B4884"/>`);
svg.push(`<ellipse cx="${dbx + dbw / 2}" cy="${dby + 12}" rx="${dbw / 2}" ry="12" fill="#2B7FD1" stroke="#0B4884"/>`);
text(dbx + dbw / 2, dby + 46, ["BD History & Feedback"], { size: 16, weight: "bold" });
text(dbx + dbw / 2, dby + 64, ["[Container: PostgreSQL · tabla history]"], { size: 12, color: "DCE8F5" });
text(dbx + dbw / 2, dby + 84, ["Q/A, tokens, contextos, trace_id, is_ok"], { size: 12 });

// Sistemas externos
const ext = [
  ["Firebase Authentication", "[Sistema externo · Google]", "Identidad del cliente (email/password)"],
  ["OpenAI API", "[Sistema externo · LLM]", "gpt-4o-mini + text-embedding-3-small"],
  ["Qdrant Cloud", "[Sistema externo · Vector DB]", "Colección ufit_postventa_kb (políticas)"],
  ["Groq", "[Sistema externo · Guardrails LLM]", "Prompt Guard 2 + gpt-oss-safeguard"],
  ["Neon Postgres (MCP)", "[Sistema externo · BD comercial]", "ufit_productos, ufit_pedidos, clientes"],
  ["API Paquetería", "[Sistema externo · mock envios.json]", "Estafeta / FedEx / DHL: estado de guías"],
  ["LangSmith", "[Sistema externo · Observabilidad]", "Traces, tokens, costo, feedback, evals"],
];
const ey = (i) => 90 + i * 104;
ext.forEach(([t, tech, d], i) => {
  const y = ey(i);
  svg.push(`<rect x="940" y="${y}" width="430" height="84" rx="10" fill="#${C.ext}" stroke="#4A4A4A"/>`);
  text(1155, y + 24, [t], { size: 16, weight: "bold" });
  text(1155, y + 43, [tech], { size: 12, color: "E6E6E6" });
  text(1155, y + 63, [d], { size: 12 });
});
const ec = (i) => ey(i) + 42;

// Relaciones
arrow(205, 228, 290, 200, ["Usa", "(HTTPS)"], { lx: 247, ly: 248 });
arrow(630, 150, 940, ec(0), "Inicia sesión (Firebase SDK)", { lx: 785, ly: 120 });
arrow(470, 240, 470, 330, ["POST /api/chat · /api/feedback", "GET /api/history (JSON/HTTPS)"], { lx: 482, ly: 278, anchor: "start" });
const srcY = [370, 410, 450, 490, 530, 570];
const labels = [
  "LLM + embeddings (HTTPS)",
  "similarity_search (k=4)",
  "Clasifica input (capas 7-8)",
  "MCP streamable HTTP · run_sql",
  "rastrear_pedido (mock)",
  "Traces + user_score",
];
// Ruteo ortogonal: los codos ascendentes van de izquierda a derecha y los
// descendentes de derecha a izquierda, así ninguna línea cruza a otra.
const xv = [870, 890, 905, 920, 895, 870];
srcY.forEach((y, i) => {
  const ty = ec(i + 1);
  svg.push(`<polyline points="650,${y} ${xv[i]},${y} ${xv[i]},${ty} 940,${ty}" fill="none" stroke="#${C.line}" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#arr)"/>`);
  const lw = labels[i].length * 6.6 + 12;
  svg.push(`<rect x="656" y="${y - 22}" width="${lw}" height="19" rx="4" fill="#FFFFFF" fill-opacity="0.92"/>`);
  text(662, y - 8, [labels[i]], { size: 12, color: "222222", anchor: "start" });
});
arrow(470, 600, 470, 690, ["Lee/escribe historial", "y feedback (SQLAlchemy)"], { lx: 482, ly: 636, anchor: "start" });

const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#${C.line}"/></marker></defs>
${svg.join("\n")}
</svg>`;
fs.writeFileSync(`${OUT}.svg`, doc);
sharp(Buffer.from(doc), { density: 144 }).png().toFile(`${OUT}.png`).then(() => console.log("ok", OUT));
