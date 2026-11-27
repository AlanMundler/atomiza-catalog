# Mejoras propuestas

Qué conviene hacer después de la limpieza de noviembre 2026, ordenado por **impacto / esfuerzo / riesgo**.
Ninguna propuesta cambia rutas indexadas ni la estética aprobada. Cada una trae cómo verificarla.

Contexto medido (build del 27/11/2026, después de la limpieza): 199 páginas, `dist/` ~12,1 MB; HTML 7.611 KB
(markup 6,7 MB + 434 KB de CSS inline); CSS compartido 139 KB; JS 109 KB; `perfumes.json` 86 KB;
quiz 33 KB de JS en una sola página; 235 tests unitarios y 59 e2e.
Punto de partida: el HTML pesaba 9.632 KB y la home bajaba 86 KB de catálogo solo para sortear cards.

---

## Hecho en esta auditoría (no repetir)

| Mejora | Evidencia |
|---|---|
| **Consentimiento inline → módulo** `src/utils/consent.ts` | −1.167 KB de HTML; 0 páginas con GA inline; chunk de 7,7 KB (2,7 KB gzip) cacheado; 7 tests |
| **Card con una sola fuente de verdad** | pool SSR de 12 `ProductCard` y `initHomeRandom` moviendo nodos: `homeCardHtml` eliminado; la home ya no descarga el catálogo (86 KB menos) |
| **`list-controller.ts` compartido** | catálogo y hub: −114 líneas en los `<script>`, una sola máquina de estado; 4 tests unitarios + 2 e2e nuevos del hub |
| **CSS de card y FAQ en `global.css`** | −812 KB de CSS inline (se repetía en ~77 páginas); ahora viaja en el asset compartido (139 KB, +4 KB minificado) |
| **`jsonLd()` helper** | 13 bloques JSON-LD unificados, escape `<` garantizado |
| **`image-dims.ts` único** | 2 páginas dejan de duplicar el `as unknown as` y el fallback |
| **Código muerto fuera** | `isBoutiqueExclusive`×76, `CartState.updatedAt`, `PerfumeCatalog`, `roleLabel`, 13 tipos de-exportados |
| **Duplicación fuera** | `normalizeText`/`slugify` únicos (6 sitios), `genderMatches` único, tipo de índice único |
| **CI/CD en un workflow** | 1 build en vez de 3; e2e y deploy consumen el mismo artifact |

Resultado global: **HTML 9.632 → 7.611 KB (−21 %)** con más tests (216 → 235) y la misma cobertura e2e.

---

## Ahora (bajo riesgo, retorno claro)

| # | Mejora | Por qué | Esfuerzo | Riesgo | Verificación |
|---|---|---|---|---|---|
| 1 | **`dataVersion` automático** (hash de `perfumes.json` en prebuild) | Es una tarea manual que, si se olvida, muestra precios viejos a visitantes recurrentes (34 versiones a mano lo demuestran) | M | M | dos builds con y sin cambio de datos: la versión cambia solo cuando cambia el JSON |
| 2 | **Budget de performance en CI** | El budget actual solo mira chunks aislados; no detecta que una página crezca 40 KB | M | B | job que falla si el HTML de `/`, `/catalogo/decants/` o una ficha supera un umbral acordado |
| 3 | **Bump de actions de artifact** | `upload-artifact@v4`, `download-artifact@v4` y `deploy-pages@v4` emiten warning de Node 20 en CI | B | B | correr el workflow y ver 0 warnings de deprecación |

## Después (mayor impacto, requieren diseño o validación visual)

| # | Mejora | Por qué | Esfuerzo | Riesgo |
|---|---|---|---|---|
| 4 | **Adelgazar el quiz** | 33 KB de JS para 5 preguntas: `quiz-profiles.ts` (76 perfiles) + tablas de keywords viajan siempre | M | M |
| 5 | **Carrito sin HTML por strings** | `cart-ui.ts` arma el drawer concatenando strings y escapando campo por campo; un `<template>` + `textContent` elimina el vector de escape manual | M | M (e2e del drawer) |
| 6 | **Modelo de datos más chico** | `id` ≡ `slug` en el 100% de los registros; `CartItem.size` guarda `price/stock` que nunca se confían (se re-resuelven); `inspiraciones.ts` copia marca/nombre/familia del perfume | A | A (migración de `localStorage` + textos visibles) |
| 7 | **Un solo vocabulario de género** | Conviven `masculino|femenino|unisex`, `GenderFilter` con `all` y el quiz con `para-el|para-ella|indistinto` (el quiz ya delega el filtro en `catalogo.genderMatches`) | M | B |
| 8 | **Afinar el pool de la home** | El pool SSR de 12 es fijo por build: 64 perfumes no pueden aparecer hasta el próximo deploy. Opciones sin volver al HTML en JS: pool más grande (cuesta ~2 KB por card), rotación determinística por deploy, o curar con `featured` y convertir la home en "selección" en vez de azar | B | B |

---

## Detalle de las pendientes de mayor impacto

### 1. `dataVersion` automático

En `scripts/copy-perfumes.mjs` (o un script nuevo en `prebuild`): calcular `sha256` de `perfumes.json`,
tomar 8 chars y escribir `public/data/version.json` (`{ "version": "a1b2c3d4" }`). `perfumes-client.ts` compara
la versión del fetch contra la guardada; si difiere, refresca. El `dataVersion` de `site.config.ts` y su
changelog de 34 líneas se pueden retirar cuando la migración esté probada (mantener la clave de caché
`perfumes-data` para no vaciar carritos).

### 2. Quiz: 33 KB al pedo hasta que se juega

`quiz-profiles.ts` y las tablas de keywords se envían en el bundle de la página. Dos caminos:
mover los perfiles al catálogo (`perfumes.json` ya se descarga on-demand) o cargarlos con `import()`
recién al responder la última pregunta. Medir con `npm run size` + DevTools (bytes de la página `/quiz/`).

### 3. Carrito: de strings a `<template>`

`cart-ui.ts` construye el drawer concatenando HTML y escapando campo por campo. Un `<template>` en
`CartDrawer.astro` + clonado + `textContent` elimina el escape manual y el riesgo de olvidarlo.
Verificación: e2e del drawer + test unitario del render con datos con `<` y comillas.

---

## Lo que NO conviene hacer

- **No** volver a generar las cards de la home por JS (`homeCardHtml`): duplicaba markup y obligaba a bajar el
  catálogo completo para sortear 4 cards.
- **No** mover más CSS de componentes a `global.css` sin medir: la ganancia existe cuando el componente se repite
  en decenas de páginas (card, FAQ); en un componente de una sola página agrega peso a todas.
- **No** convertir `layering.ts`, `quiz-profiles.ts`, `notas.ts`, `guias.ts` ni `resenas.ts` a JSON: son
  contenido editorial con tipos; JSON pierde autocompletado y validación.
- **No** agregar un framework de islas (React/Vue) para el carrito: el costo de hidratación supera la ganancia.
- **No** paginar el catálogo con scroll infinito: hoy el HTML completo es lo que indexa Google.
- **No** tocar `trailingSlash`, redirects, claves de `localStorage` ni los slugs derivados.
