# Auditoría UX/UI — ATOMIZA v2 (noviembre 2026)

Segunda pasada sobre el sitio ya actualizado (paquete de bajo riesgo de v1 implementado: portada `/catalogo/` eliminada, ficha con ancla honesta + trust + reseñas, modal con chips simétricos). Cubre lo **no auditado en v1**: blog, quiz completo, notas/familias, legales, 404, menú móvil, carrito (vacío/1/3), modal nuevo, búsqueda con/sin resultados, filtro por casa, ficha sin stock y home en desktop.

- **Método:** Playwright sobre `npm run build` + `preview` en 4321. Viewports: 320×653, 390×844, 768×1024, 1440×900.
- **Capturas:** 58 PNG en `mockups/ux/v2/` (nombres `v2-<pantalla>-<ancho>[-full].png`) + `_measure.json` con tap targets y métricas.
- **Verificaciones:** `npm run build` OK (192 páginas), `npm run lint` OK (0 errores; 10 hints preexistentes). No se modificó ninguna página ni test. Sin commit.

## Corrección respecto de la primera lectura

El drawer de carrito parecía desbordar en 390 (captura inicial cortada). Medido: `drawer {x:0,w:390}`, botón `+` en 316–346 px — la captura estaba tomada a mitad de la animación de apertura. **No es bug**; las capturas de carrito/modal fueron re-tiradas con settle de 700 ms.

---

## Hallazgos nuevos (no repiten los de v1 ya resueltos)

### 1. ALTA — Títulos `display-lg` sin escala móvil/tablet se comen el primer screen en las páginas hub
- **Pantallas:** `/familias/<f>/`, `/notas/<nota>/`, `/notas/`, `/envios/`, `/404/`, `/quiz/`.
- **Evidencia:** `v2-familia-1440.png` — el H1 "PERFUMES ÁRABES DE ORIENTAL VAINILLA EN DECANT" rompe en **6 líneas** y llena el viewport entero de 1440×900; los productos arrancan recién en la segunda pantalla. `v2-nota-vainilla-390-full.png` — hero (foto circular + H1 de 2 líneas + subtítulo + botón "VER CATÁLOGO") ocupa ~1080 px antes de la primera card. `v2-envios-390-full.png` — el H1 a 64 px rompe una palabra por línea ("ENVÍOS / Y / ENTREGA / EN / CÓRDOBA…"). Medido: 64 px en 320/390/768, sin regla mobile (los legales sí la tienen: 36 px).
- **Impacto:** estas páginas entran por SEO/footer; el producto — lo que vende — no se ve hasta hacer scroll.
- **Fix:** aplicar la misma escala que `.legal-title`: `font-size: var(--font-headline-lg-mobile-size)` en ≤640 y `max-width + text-wrap: balance` para que el H1 rompa en 2 líneas como mucho; achicar el hero stack. Bajar la foto circular de 120→72 px en mobile.

### 2. ALTA — Ficha sin stock no avisa arriba, no recupera y no captura
- **Pantalla:** `/producto/club-de-nuit-intense-man/`.
- **Evidencia:** `v2-pdp-sinstock-390.png` — la primera pantalla es 100 % foto + nombre; el chip "SIN STOCK", el botón deshabilitado ("Sin Stock") y el WhatsApp de recuperación aparecen 1–2 pantallas más abajo. `v2-pdp-sinstock-1440.png` — ídem en desktop: ningún indicador en el viewport inicial. Medido: el CTA queda en `disabled` con texto "Sin Stock" y no hay ninguna acción alternativa de recuperación ("avisame cuando reponga"); los relacionados existen (4, todos con stock en este caso) pero lejos.
- **Impacto:** tráfico de búsquedas de "Club de Nuit Intense" (dupe de Aventus, aroma buscado) se pierde sin dejar contacto.
- **Fix:** (a) chip `SIN STOCK` inline junto al brand/H1 desde el primer pixel; (b) botón secundario **"Avisame cuando reponga"** con WhatsApp pre-armado (`Hola! Quiero que me avises cuando reponga {perfume} 5ml`) — implementación concreta de la propuesta v1 #10, ahora con evidencia; (c) bloque "Mirá estas alternativas en stock" subido debajo del CTA, no al pie de página.

### 3. ALTA — El FAB de WhatsApp tapa los CTAs del quiz (mismo bug de v1, página distinta)
- **Pantallas:** `/quiz/` pasos con CTA abajo y resultado.
- **Evidencia:** `v2-quiz-resultado-390-full.png` — el FAB se superpone el borde derecho del **"AGREGAR AL CARRITO"** (el CTA primario del quiz); `v2-quiz-reinicio-390.png` — tapa la esquina de "CONTINUAR"; `v2-quiz-p2-390.png` — solapa la opción "ÁMBAR Y ESPECIADO". En la ficha esto se corrigió reservando padding (`body:has([data-sticky-buy])`); el quiz no tiene esa regla.
- **Fix:** `@media (max-width:1023px) body:has(.quiz-page) .whatsapp-fab { bottom: 112px }` u ocultar el FAB en `/quiz/` (el paso final ya tiene su propio CTA de WhatsApp).

### 4. MEDIA-ALTA — El blog es una puerta de sentido único: no lleva al catálogo
- **Pantallas:** `/blog/` y `/blog/<slug>/`.
- **Evidencia:** `v2-blogpost-390-full.png` — en todo el post, el único CTA es "PEDIR RECOMENDACIÓN POR WHATSAPP" al final (luego de FAQ). `v2-blogpost-relacionados-390.png` — los chips "Probá estos aromas en decant" van al hub `/decants/` y no muestran precio ni foto; nunca hay un link directo a `/producto/…` ni a `/catalogo/decants/`. `v2-blog-1440-full.png` — el índice tampoco tiene CTA a catálogo (solo WhatsApp al pie). La jerarquía de lectura está bien (breadcrumb, "GUÍA · 5 MIN", body 720 px medido), pero **no existe el próximo paso obvio** para el 80 % de lectores que prefiere comprar a chatear.
- **Fix:** (a) en el índice, segundo CTA "Ver catálogo" junto al de WhatsApp; (b) en el post, convertir los chips relacionados en mini-cards (foto + precio desde) con deep-link a la ficha o, mínimo, un `Ver catálogo` sticky al final del primer section; (c) cierre del post con "Otra guía" (hoy termina en callejón: después del CTA solo queda el footer).

### 5. MEDIA — Búsqueda sin resultados: copy tú + callejón sin salida comercial
- **Pantalla:** `/catalogo/decants/?search=zzzqqqq`.
- **Evidencia:** `v2-busqueda-vacia-390.png` — "NO SE ENCONTRARON PERFUMES / **Intenta** ajustar los filtros o la búsqueda" (tuteo inconsistente con todo el resto del sitio; el hub de decants usa el voseo correcto y un título mejor: "No encontramos ese aroma"). Única salida: "VER TODO EL CATÁLOGO". El usuario que buscó "solana" (no está) es un lead warm y no tiene forma de decirlo.
- **Fix:** copiar la estructura del empty state del hub + botón "Limpiar búsqueda" + link "¿Buscás algo que no está? Pedilo por WhatsApp →" (mensaje pre-armado con el query) y "Hacé el quiz".

### 6. MEDIA — Anillo de fricción en la nota: CTA "Ver catálogo" arriba de su propio catálogo
- **Pantalla:** `/notas/<nota>/`.
- **Evidencia:** `v2-nota-vainilla-390-full.png` — botón primario "VER CATÁLOGO" sobre una grilla que ya es una lista de decants (40+ cards): empuja los productos y propone irse a una lista más genérica. Además, los decants **SIN STOCK aparecen intercalados** en la grilla (se ven chips grises a mitad de lista) y no hay orden por disponibilidad.
- **Fix:** sacar el CTA del hero (dejar solo el grid + "Ver todo el catálogo" ghost al pie, como en familias) y ordenar `perfumesConNota` por estado de stock (en stock → poco → sin stock).

### 7. MEDIA — Modal "Armar pedido" esconde el resumen del pedido
- **Pantalla:** modal nuevo (390/1440/320).
- **Evidencia:** `v2-modal-390.png`, `v2-modal-390-preview.png` — para revisar qué estás pidiendo hay que abrir "Ver el mensaje del pedido" (texto crudo). Nada muestra "3 decants · $20.000 − $2.000 = $18.000" en el paso de decisión. En 390 el CTA "ENVIAR POR WHATSAPP" queda cortado al borde inferior sin pista de scroll (`v2-modal-320.png` ídem). El formulario pide nombre + contacto **cuando el canal ya es WhatsApp** (2 campos antes del primer mensaje).
- **Fix:** (a) línea resumen legible arriba de "Entrega" (2 renglones, no el textarea); (b) sticky-bottom del CTA dentro del modal; (c) evaluar un solo campo opcional (el número ya identifica al cliente en el chat).
- Lo que quedó **bien** en la v2 del modal: chips 2×2 simétricos y anchos idénticos incluso en 320, un solo primario, stepper honesto ("Enviar", no "Envío"), validación con foco en el campo faltante (`v2-modal-390-error.png`).

### 8. MEDIA — Tap targets <44 px en las pantallas nuevas (medido)
- **Evidencia** (`_measure.json`): carrito — stepper `30×38`, eliminar `36×36`, "Vaciar" `92×32`, nudge tridente `38 h`; quiz resultado — "VER INSPIRACIÓN…" y "VER DETALLE" `19 h`; footer global — nav links `35 h`, legales `30 h`; modal — secundarios `38 h`.
- **Fix:** stepper a 44×44 (el drawer tiene aire horizontal de sobra en 390), eliminar a 44, links del footer con `min-height:44` + padding, links del quiz con `padding-block:12px`. El "Vaciar" puede quedar chico si se lo considera destructivo, pero hoy está al lado de un título grande y es el único affordance.

### 9. MEDIA — El menú móvil no ofrece Guías ni Notas (descubrimiento)
- **Evidencia:** `v2-menu-movil-390.png` + `Header.astro` — el drawer tiene Inicio / Catálogo / Tridente / Quiz; `/blog/` y `/notas/` solo se alcanzan por footer o home. Vaciando el drawer sobra espacio muerto abajo de los sociales.
- **Fix:** agregar "Guías y consejos" y "Buscá por nota" como links secundarios (label más chico, mismo stack) — el drawer aguanta 2 entradas más sin scroll.

### 10. MEDIA-BAJA — Carrito con 1 decant: espacio muerto donde iría la sugerencia de tridente
- **Evidencia:** `v2-carrito-1-390.png` — el nudge "Te faltan 2 para −$2.000 →" empuja al catálogo (sale del funnel), y quedan ~450 px de drawer vacío bajo "ARMAR PEDIDO". Con 3 items el resumen ya no cabe con sugerencias, pero con 1–2 es la ubicación de mayor intención de compra del sitio.
- **Fix:** 2 mini-cards quick-add horizontales ("Completá tu tridente") reutilizando el componente del carrusel de home; el tap a catálogo queda como link secundario del nudge.

### 11. BAJA — Detalles de consistencia y estado
- **`order-summary-note` a 10 px** ("El total final se confirma…", "Un perfume quedó sin stock…"): ilegible; subir a 12–13 px.
- **Error del modal en bloque rojo sólido** (`v2-modal-390-error.png`): rompe el sistema negro+dorado y su contraste rojo-sobre-rojo es límite; usar borde izquierdo `--color-error` sobre `surface-container-high` como el resto de los avisos (stock).
- **Familias: breadcrumb "Aromas ›" apunta a `/decants/`** (`[familia].astro:25`), pero el usuario llega a familias desde home/notas — el mapa mental "Aromas = inspiraciones" no coincide; renombrar a "Decants" o linkear al catálogo.
- **Envíos:** las 3 cards usan borde `--color-on-surface` (blanco puro) en vez de `--color-outline-variant` (`v2-envios-1440-full.png`) — mismo problema de borde del hallazgo v1 #10, aquí en página nueva. Y no hay estimación de costo/tiempo de Uber (información escondida que genera chat innecesario).
- **Términos:** "Última actualización: agosto de 2026" pero las modalidades de entrega/pago del pedido (Retiro/Uber, Efectivo/Transferencia) se definieron en noviembre; desactualizado.
- **404:** el tercer ghost "DESCUBRÍ TU PERFUME" sin borde ni fondo se lee como texto, no como botón (`v2-404-390.png`).
- **Quiz vacío (sin stock):** el heading sigue diciendo "TU RECOMENDACIÓN" sobre un mensaje de "no encontramos nada" (`v2-quiz-resultado-sinmatch-390.png`); renombrar el heading a "Tu resultado" o condicionarlo.

### 12. Home desktop (1440): no sabíamos si aprovechaba el ancho — no lo hace
- **Evidencia:** `v2-home-1440.png` — first product card en **y=838** (viewport 900): above-the-fold otra vez 100 % texto (el problema v1 #1 replicado en desktop). `v2-home-1440-full.png` — la banda "BUSCÁ POR EL AROMA FAMOSO QUE TE GUSTA" queda desbalanceada: H2 partido ("…QUE TE / GUSTA") a la izquierda y CTA flotando al extremo derecho con ~500 px de vacío en el medio; el carrusel "DECANTS EN STOCK" muestra 4 cards dentro de 1200 px dejando aire lateral muerto y sin usar el ancho para más productos o contenido (en desktop el quick-add apenas se justifica).
- **Relación con v1:** esto **reemplaza/amplía la propuesta v1 #4** (home merchandizada, pensada en mobile): el mock A debe definirse para desktop primero (hero en 2 columnas texto+fotos, banda aroma con grid 3-4 cards inline) y adaptarse a mobile.

---

## Nuevas propuestas priorizadas

| # | Propuesta | Impacto | Esfuerzo | Riesgo | Métrica | Reemplaza a |
|---|---|---|---|---|---|---|
| N1 | Escala tipográfica mobile/tablet para H1 de hub/notas/familias/envios/legales (una regla global en `display-lg` + `text-wrap:balance`) | Alto | Bajo | Bajo | scroll a 1ª card en notas/familias; rebote | — |
| N2 | Recuperación sin stock: chip SIN STOCK junto al H1 + "Avisame cuando reponga" (WA pre-armado) + alternativas subidas | Alto | Medio | Bajo | sin-stock PV → leads WA / venta relacionada | Implementa v1 #10 con evidencia nueva |
| N3 | Anti-solape del FAB en quiz y cualquier página con CTA fijo inferior | Alto | Bajo | Bajo | quiz → add_to_cart | Extiende fix v1 del FAB |
| N4 | Blog que vende: CTA catálogo en índice y posts, relacionados como mini-cards con precio, CTA intermedio y "siguiente guía" | Alto | Medio | Bajo | blog → PDP (hoy ~0 rutas directas) | — |
| N5 | Empty-state de búsqueda con salida comercial (WA con query + quiz + limpiar) y copy voseo | Medio | Bajo | Bajo | % searches vacías que rebotan | — |
| N6 | Carrito como vidriera: mini-cards "completá tu tridente" con quick-add + resumen legible en el modal + sticky CTA | Alto | Medio | Bajo | AOV; carrito → begin_checkout | Amplía v1 #3 (tridente) a la pantalla de mayor intención |
| N7 | Paso 44px global en targets medidos: stepper/eliminar del carrito, footer, links del quiz | Medio | Bajo | Bajo | errores de tap; cumplimiento W3C 2.5.8 | Concreteiza v1 #9 en pantallas nuevas |
| N8 | Menú móvil con Guías + Por nota | Medio | Bajo | Bajo | tráfico a blog/notas desde mobile | — |
| N9 | Notas/familias: orden por stock + quitar CTA "Ver catálogo" del hero de nota | Medio | Bajo | Bajo | notas → PDP | — |
| N10 | Envíos con dato concreto: rango de costo/tiempo Uber + zona explícita; bordes de card al token del sistema | Bajo | Bajo | Bajo | consultas WA "cuánto sale el envío" | — |

## Revisión de copy (actual → propuesto → por qué)

| # | Pantalla | Actual | Propuesto | Por qué |
|---|---|---|---|---|
| 1 | Catálogo, sin resultados | "Intenta ajustar los filtros o la búsqueda" | "Probá con otro nombre o acortá la búsqueda" | Tuteo en un sitio 100 % voseo; además sugiere una acción concreta. |
| 2 | Carrito vacío | "Agrega decants desde el catálogo" | "Todavía no elegiste ningún decant" | Mismo tuteo; "Agrega" es instrucción en frío de un estado vacío; el subtexto debe describir, no mandar. |
| 3 | Carrito (header del drawer vs mensaje) | Título "TU PEDIDO" vs "Tu carrito está vacío" y error "Tu carrito está vacío…" | Unificar en "Tu pedido" | El sitio ya decidió "pedido" (CTA "Armar pedido"); "carrito" es otro dialecto del mismo concepto. |
| 4 | Catálogo sin resultados | "NO SE ENCONTRARON PERFUMES" | "No encontramos ese aroma" (igual que el hub) | Gritar en 3 líneas de caps es pesado; el hub ya tiene la versión buena, duplicarla. |
| 5 | Ficha sin stock | Botón "Sin Stock" (deshabilitado) | Chip "SIN STOCK" + botón "Avisame cuando reponga" | Un botón deshabilitado es un callejón; convertir el no en captura de contacto. |
| 6 | Ficha | "Consultar por WhatsApp" (coexistiendo con el aviso de sin stock sin contexto) | "Preguntar disponibilidad por WhatsApp" | Dice exactamente qué va a pasar; refuerza la recuperación. |
| 7 | Quiz, estado vacío | Heading "Tu recomendación" + "No encontramos nada con esas respuestas." | Heading "Tu resultado" + "Con esas respuestas no tenemos nada en stock ahora. Volvé en unos días o mirá el catálogo." | El heading promete algo que el estado niega; "ahora" abre la puerta del reingreso. |
| 8 | Quiz | "Cinco preguntas cortas y te dejamos una sola recomendación" | "Cinco preguntas, una sola recomendación: la que más te calza de lo que hay en stock." | "Elegida de lo que tenemos en stock" suena a limitación; reformular como curaduría. |
| 9 | Notas | "Probalo sobre tu piel" (meta description: "Probalos" ok) / botón "Ver catálogo" sobre su propia grilla | Quitar el botón o → "Ver todos los decants" al pie | "Ver catálogo" cuando ya estás viendo 39 decants es ambiguo (¿otro catálogo?). |
| 10 | Términos | "Última actualización: agosto de 2026" | "Noviembre de 2026" + cláusula corta de entrega/pago (Retiro/Uber; Efectivo/Transferencia) | El flujo del pedido cambió en noviembre; el texto legal quedó atrás. |
| 11 | 404 | Ghost "Descubrí tu perfume" sin marco | `btn--secondary` o link subrayado con arrow | No se lee como acción. |
| 12 | Home/trust | "Sale de un frasco original y sellado" conviviendo con descripciones "Inspirado en Aventus de Creed" | "Sale de un frasco {marca} original y sellado" | "Originales" es ambiguo entre "no falsificado" y "el de marca famosa"; el dupe hub lo resuelve hoy mal con "original→dupe". Nombrar la casa elimina la lectura errónea. |
| 13 | Búsqueda sin resultados (nuevo CTA) | — | "¿Buscás uno que no está? Pedilo por WhatsApp →" | Convierte el fallo de búsqueda en lead. |

## Qué quedó bien en esta pasada (no romper)

- Modal v2: chips de entrega/pago simétricos incluso en 320, un solo CTA primario, preview colapsable, validación con foco y error claro (salvo el color del bloque).
- Quiz: radios accesibles con flechas, progreso persistente, reinicio limpia respuestas correctamente (verificado), copy de motivo ("Elegimos este porque buscabas…").
- Hub `/decants/` filtrado por casa: contador dinámico ("3 AROMAS DE CREED"), chip activo visible al entrar con `?casa=`, barra sticky compacta.
- Post del blog: legibilidad notable (línea de 720 px medida, jerarquías claras, tiempo de lectura presente, breadcrumbs).
- Barra de tridente en el carrito ("1 tridente: −$2.000 en tu pedido" en verde) — el mejor piece de feedback del sitio.

## Backlog sugerido (orden)

1. **Semana 1:** N1 (una regla CSS) + N3 (FAB quiz) + copy #1/#2/#4 (3 strings).
2. **Semana 2:** N2 (sin stock) + N5 (empty search) — ambos abren canales de captura nuevos.
3. **Semana 3–4:** N6 (carrito vidriera + resumen modal) + N4 (blog), midiendo AOV y blog→PDP.
4. **Después:** N7, N8, N9, N10.
