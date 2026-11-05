# Auditoría UX/UI — ATOMIZA (noviembre 2026)

Objetivo: mejorar la experiencia y la conversión. Método: auditoría heurística + recorrido real del funnel en 390×844 y 1440×900 (58 capturas en `mockups/ux/`), evidencia externa (Baymard, NN/g, W3C, GA4 docs) y mediciones con Playwright. Los mockups de las 3 propuestas están en `mockups/ux/[m|d]2x-*`.

## Resumen ejecutivo

El sitio está mejor que la media en fundamentos (velocidad, a11y, stock en vivo, quick-add, hub original→dupe) pero **la home y la ficha están ordenadas como manifiesto de marca, no como vidriera**: el producto aparece tarde, la decisión (precio/talle/CTA) está debajo de la foto, y la promo que sube el ticket (tridente) no se entiende ni se ve. Las 3 palancas de mayor impacto son: **PDP con buybox arriba**, **sacar la portada intermedia del catálogo** y **hacer visible/calculable el tridente**.

## Funnel medido (mobile 390×844)

| Paso | Medición | Problema |
|---|---|---|
| Home | hero 542 px; primera card en **y=861** (viewport 844) | El producto arranca justo debajo del pliegue; above-the-fold es 100% texto |
| Home → catálogo | 1 clic | OK |
| `/catalogo/` | **0 productos**, 2 tarjetas de texto | Paso extra: la elección decant/frasco ya existe como tabs en la lista |
| Lista | primera card en **y=501**; toolbar ocupa 442 px; precio de card **12 px**; buscador 31 px | 55% del primer viewport es chrome; el dato de decisión es el más chico |
| Ficha | H1 en y=715; CTA "Agregar" en **y=1661** (2 pantallas); FAB tapaba el H1 (corregido) | No hay decisión en la primera pantalla |
| Carrito → pedido | 3 canales con el mismo peso; textarea crudo; sin selector de entrega | Fricción y ambigüedad en el último paso |

Total home → ficha: **3 clics** (podrían ser 2).

## Hallazgos (severidad y evidencia)

1. **ALTA — Home sin producto above-the-fold.** `mockups/ux/m01-home-viewport.png`; medición y=861. Propuesta A.
2. **ALTA — Portada de catálogo innecesaria.** `m02-catalogo-viewport.png`; 0 cards + 2 links. Propuesta C.
3. **ALTA — PDP abre con foto y no con decisión.** `m06-pdp-decant-viewport.png`; CTA en y=1661. Propuesta B.
4. **ALTA — Tridente invisible/incomprensible.** Promos superpuestas (`m01`), página de reglas sin ejemplo en pesos (`m08`), franja gris en ficha. Propuestas A/B/C.
5. **MEDIA-ALTA — Ancla de precio contradictoria** cuando hay frasco propio: "un frasco ronda $60.000" y acá se vende a $60.000 (`m07`). Propuesta B.
6. **MEDIA — Modal de pedido** con 3 caminos iguales, preview críptico y sin entrega (`m13`).
7. **MEDIA — PLP**: precio 12 px, sin orden, buscador chico (`m03`).
8. **MEDIA — Confianza sólo en la home**: reseñas 5.0 (6) no aparecen en ficha/carrito/modal.
9. **MEDIA-BAJA — Fricciones mobile**: FAB sobre el H1 (corregido), dead space del drawer, hub con chips truncados (`m05`).
10. **BAJA — Consistencia**: borde de card casi blanco vs `--color-outline-variant`; mezcla de radios (chips/quick-add).

**Ya está bien (no romper):** quick-add 44 px visible, carrito validado contra catálogo vivo, chips de stock, cookie banner propio, hub original→dupe, URLs con estado, 0 violaciones axe.

## Propuestas priorizadas

| # | Propuesta | Impacto | Esfuerzo | Riesgo | Métrica |
|---|---|---|---|---|---|
| 1 | PDP con buybox arriba (nombre, talle con precios lado a lado, precio grande, CTA, trust) — Mock B | Alto | M | Medio | PDP→add_to_cart |
| 2 | Eliminar portada: `/catalogo/` → `/catalogo/decants/` (tabs ya existen) — Mock C | Alto | S | Bajo | home→PDP (3→2 clics) |
| 3 | Tridente visible y calculado: tira estática con las 3 escalas, progreso en PLP/PDP, ejemplo en $ — Mocks A/B/C | Alto | M | Bajo | % pedidos ≥3 decants (AOV) |
| 4 | Home merchandizada: hero compacto con precio, carrusel con quick-add, trust line — Mock A | Alto | M | Medio | home→PDP, rebote |
| 5 | Modal "Armar pedido": CTA WhatsApp único, "otros canales" discreto, preview colapsable, chips entrega | Medio-alto | S | Bajo | carrito→envío |
| 6 | Ancla decant↔frasco honesta ($/ml y % del frasco) | Medio | S | Bajo | venta de frasco |
| 7 | Reseñas + trust strip en ficha y carrito | Medio | S | Bajo | 1ª compra desde IG |
| 8 | PLP densa: hero 2 líneas, orden (precio/novedad), precio 16 px | Medio | M | Bajo | PLP→PDP |
| 9 | Quiz con 3 resultados + add directo | Medio | M | Bajo | quiz→add |
| 10 | "Avisame cuando reponga" por WhatsApp pre-armado | Bajo-medio | S | Bajo | recuperación de sin stock |

## Mockups

- **A — Home v2** (`m20-uxa-home-v2-viewport.png`): tira tridente con las 3 escalas, hero corto con `$6.000` protagonista, 2 CTAs (lista / quiz), trust (5.0 Google · originales · entrega), carrusel con quick-add y bloque tridente con cálculo real.
- **B — PDP v2** (`m21-uxb-pdp-buybox-viewport.png`, `m22`, `m23`): buybox primero, selector como comparación de valor (5 ml $6.000 / 100 ml $60.000 con stock), ancla en % ("es el 10% del precio del frasco"), CTA + trust, galería después, "¿decant o frasco?", tridente en vivo con 4 sugerencias, reseñas.
- **C — Catálogo unificado + builder** (`m24-uxc-catalogo-builder-viewport.png`, `m25`): entra directo a la grilla (portada muere), hero en 2 líneas con regla ("71 en stock · desde $6.000 · 3 = $2.000 menos"), barra sticky de progreso de tridente ("2 de 3 · te falta 1").

## Evidencia externa (y lo que NO hay que prometer)

- **Sólido:** precio por unidad ($/ml) — 81% de los sitios no lo muestra y es la comparación que hace el usuario (Baymard 2026); acordeón vertical > tabs (27% ignora tabs); política de devolución visible en la PDP (60% la busca); reviews con foto y respuesta a negativas; tolerancia a typos en búsqueda (69% de sitios falla); targets ≥48 dp (W3C 2.5.8 / Apple HIG); LCP de la imagen principal.
- **Débil / no prometer:** "sticky CTA = +X%": win-rate real 12–27% en pools de tests → implementar como A/B, no como verdad; cifras de click-to-WhatsApp (45–60%) son de vendors y se contradicen → vender el mecanismo (menos pasos), no el número; "quiz mejora conversión" sólo evidencia de vendedores de quizzes; "choice overload" tiene efecto medio ≈ 0 (meta-análisis) → no recortar catálogo, mejorar facilitación; multiplicadores de UGC son de vendors.

## Medición (GA4)

Ya existen: `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `click_to_whatsapp`, `search`, `quiz_start/step/complete`, `generate_lead`. Faltan para cerrar el funnel: `purchase` (confirmación manual o import del CRM) y `add_shipping_info` (cuando se acuerda entrega en el chat). Sin esos dos, la conversión real se lee como 0.

## Orden sugerido (30 días)

1. Semana 1: #2 (portada) + #6 (ancla) + #5 (modal) + #7 (reseñas en ficha) — bajo riesgo, medible.
2. Semana 2-3: #1 (PDP buybox) con A/B contra la ficha actual.
3. Semana 3-4: #3 (tridente en PLP/PDP) y #4 (home) — las dos que más mueven ticket y entrada.
4. Después: #8, #9, #10.

## Quick wins ya aplicados (verificados)

- Tira de promos: nunca más de 1 visible a la vez (80 muestras cada 50 ms → 0 solapamientos).
- FAB de WhatsApp: 0 intersecciones con H1/CTA/precio en 3 fichas × 320/390/1440.
- Buscador: 44 px y 16 px de fuente en catálogo y hub (antes 31 px / 13 px).

## Implementado el 2026-11-05 (paquete de bajo riesgo, commit `67d03c7` + siguiente)

| Propuesta | Estado | Evidencia |
|---|---|---|
| #2 Eliminar portada de catálogo | ✅ `/catalogo/` redirige a `/catalogo/decants/` (sitemap excluye el redirect); home→ficha en **2 clics** | Playwright: `/` → `/catalogo/decants/` (73 cards) → `/producto/24-carat-white-gold/` |
| #6 Ancla decant↔frasco honesta | ✅ con frasco: "5 ml = {x}% del frasco" + $/ml de ambos; sin frasco: ancla de mercado; sin datos: no muestra | glacier-bella: "5 ml = 5%…", "$1.200/ml vs $600/ml"; luminous-sahara: ancla de mercado; ajwad: sin ancla |
| #5 Modal "Armar pedido" | ✅ 1 CTA primario, preview colapsable, **entrega simétrica (Retiro / Uber)** y **pago (Efectivo / Transferencia)**, ambos en el mensaje | modal: title "Armar pedido", 1 `.btn--primary`, chips 2×2 de ancho idéntico (228.5/228.5 px a 1440; 0.0 px de diferencia a 320), `details` cerrado |
| #7 Reseñas + trust en la ficha | ✅ trust strip 3 ítems + 2 reseñas reales + link a Google | 3 `.trust-item`, 2 `.product-review`, link `g.page/r/…` |

Pendiente de aprobación: #1 buybox PDP, #3 tridente en PLP/PDP, #4 home merchandizada, #8 PLP densa, #9 quiz 3 resultados, #10 aviso de reposición.

