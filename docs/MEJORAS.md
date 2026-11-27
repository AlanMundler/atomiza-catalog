# Mejoras propuestas

Qué conviene hacer después de la limpieza de noviembre 2026, ordenado por **impacto / esfuerzo / riesgo**.
Ninguna propuesta cambia rutas indexadas ni la estética aprobada. Cada una trae cómo verificarla.

Contexto medido (build del 27/11/2026, después de la limpieza): 199 páginas, `dist/` ~12,9 MB; HTML 8.466 KB
(markup + 1,25 MB CSS inline); JS/CSS compartido ~107/135 KB; `perfumes.json` 86 KB; quiz 33 KB de JS en una sola página.
Antes de la limpieza el HTML pesaba 9.632 KB: el mayor ahorro ya aplicado fue pasar el consentimiento inline a módulo (−1.167 KB, ver “Hecho”).

---

## Hecho en esta auditoría (no repetir)

| Mejora | Evidencia |
|---|---|
| **Consentimiento inline → módulo** `src/utils/consent.ts` | HTML 9.632 → 8.466 KB (−12,1 %); 0 páginas con GA inline; chunk de 7,9 KB (2,7 KB gzip) cacheado; 7 tests nuevos |
| **`jsonLd()` helper** | 13 bloques JSON-LD unificados, escape `<` garantizado en todos |
| **`image-dims.ts` único** | 2 páginas dejan de duplicar el `as unknown as` y el fallback |
| **Código muerto fuera** | `isBoutiqueExclusive`×76, `CartState.updatedAt`, `PerfumeCatalog`, `roleLabel`, 13 tipos de-exportados |
| **Duplicación fuera** | `normalizeText`/`slugify` únicos (6 sitios), `genderMatches` único, tipo de índice único |
| **CI/CD en un workflow** | 1 build en vez de 3; e2e y deploy consumen el mismo artifact |

---

## Ahora (bajo riesgo, retorno claro)

| # | Mejora | Por qué | Esfuerzo | Riesgo | Verificación |
|---|---|---|---|---|---|
| 2 | **`dataVersion` automático** (hash de `perfumes.json` en prebuild) | Es una tarea manual que, si se olvida, muestra precios viejos a visitantes recurrentes (34 versiones a mano lo demuestran) | M | M | dos builds con y sin cambio de datos: la versión cambia solo cuando cambia el JSON; visitante con caché recibe la nueva |
| 3 | **Budget de performance en CI** | El budget actual solo mira tamaño de chunks aislados; no detecta que una página crezca 40 KB | M | B | job que falla si el HTML de `/`, `/catalogo/decants/` o una ficha supera un umbral acordado |
| 4 | **Bump de actions de artifact** | `upload-artifact@v4`, `download-artifact@v4` y `deploy-pages@v4` ya emiten warning de Node 20 en CI | B | B | correr el workflow y ver 0 warnings de deprecación |

## Después (mayor impacto, requieren diseño o validación visual)

| # | Mejora | Por qué | Esfuerzo | Riesgo |
|---|---|---|---|---|
| 5 | **Un solo controlador de listados** (`list-controller.ts`) para catálogo y hub | ~395 líneas de cableado casi idénticas (`readUrlState`/`applyFilters`/`popstate`/guarda anti-VT); estimado −300/350 líneas y una sola máquina de estado testeable | M | M (e2e cubre el filtrado) |
| 6 | **Card con una sola fuente de verdad** | `ProductCard.astro` (SSR) y `homeCardHtml()` (string JS) duplican markup y clases; el `is:global` existe solo por la copia. Reordenar nodos SSR en `initHomeRandom` y borrar `homeCardHtml` | M | M (tests de home-random + validación visual) |
| 7 | **Consolidar CSS repetido** (grillas, chips, hero) | `.faq-list` 4,8 KB ×77 páginas y `.product-card` 5,4 KB ×65: mismo CSS scopeado repetido; grillas 2/3/4 columnas copiadas en 6+ archivos | M | B (medir con Coverage + screenshots) |
| 8 | **Adelgazar el quiz** | 33 KB de JS para 5 preguntas: `quiz-profiles.ts` (76 perfiles) + tablas de keywords viajan siempre | M | M |
| 9 | **Carrito sin HTML por strings** | `cart-ui.ts` arma el drawer concatenando strings y escapando campo por campo; un `<template>` + `textContent` elimina el vector de escape manual | M | M (e2e del drawer) |
| 10 | **Modelo de datos más chico** | `id` ≡ `slug` en el 100% de los registros; `CartItem.size` guarda `price/stock` que nunca se confían (se re-resuelven); `inspiraciones.ts` copia marca/nombre/familia del perfume | A | A (migración de `localStorage` + textos visibles) |
| 11 | **Un solo vocabulario de género** | Hoy conviven `masculino|femenino|unisex`, `GenderFilter` con `all` y el quiz con `para-el|para-ella|indistinto` (el quiz ya delega el filtro en `catalogo.genderMatches`, falta unificar el vocabulario) | M | B |

---

## Detalle de las pendientes de mayor impacto

### 1. `dataVersion` automático

En `scripts/copy-perfumes.mjs` (o un script nuevo en `prebuild`): calcular `sha256` de `perfumes.json`,
tomar 8 chars y escribir `public/data/version.json` (`{ "version": "a1b2c3d4" }`). `perfumes-client.ts` compara
la versión del fetch contra la guardada; si difiere, refresca. El `dataVersion` de `site.config.ts` y su
changelog de 34 líneas se pueden retirar cuando la migración esté probada (mantener la clave de caché
`perfumes-data` para no vaciar carritos).

### 2. `list-controller.ts` (catálogo y hub)

Hoy `CatalogView.astro` y `decants/index.astro` repiten el mismo cableado: leer URL (`search` + filtro propio),
aplicar visibilidad, actualizar contador/empty-state, marcar el chip activo y escuchar `popstate` con guarda
anti-view-transition. La propuesta es un controlador con config declarativa:

```ts
createListController({
  rootSelector: '[data-catalog-page]',
  cardSelector: '.product-card',
  isVisible: (card, { filter, search, fuzzyIds }) => boolean,
  readFilters: (url) => ({ filter: url.searchParams.get('filter') ?? 'all' }),
  writeFilters: (filter) => ({ filter: filter === 'all' ? null : filter }),
  countText: (visible, { filter, search }) => string,
  emptyGridSelector, emptySelector, countSelector,
});
```

El criterio de negocio (`cardMatches` / `hubSearchMatches`) queda en cada página; el controlador solo orquesta.
Estimado: −300/350 líneas y una sola máquina de estado testeable (hoy los e2e cubren el comportamiento).

### 3. Una sola fuente de verdad para la card

`ProductCard.astro` renderiza el markup en build y `homeCardHtml()` lo vuelve a escribir como string para el
sorteo de la home; el `is:global` del componente existe solo para que la copia JS se vea igual. En
`initHomeRandom` se pueden **reordenar los nodos SSR existentes** (mapear `picks[i].id` al `[data-perfume-id]`
correspondiente y moverlo) en lugar de re-renderizar `innerHTML`: el markup queda con un único dueño y
desaparece `homeCardHtml`.

---

## Lo que NO conviene hacer

- **No** convertir `layering.ts`, `quiz-profiles.ts`, `notas.ts`, `guias.ts` ni `resenas.ts` a JSON: son
  contenido editorial con tipos; JSON pierde autocompletado y validación.
- **No** agregar un framework de islas (React/Vue) para el carrito: el costo de hidratación supera la ganancia.
- **No** paginar el catálogo con scroll infinito: hoy el HTML completo es lo que indexa Google; si se pagina,
  mantener una primera página server-rendered con todos los perfumes.
- **No** tocar `trailingSlash`, redirects, claves de `localStorage` ni los slugs derivados.
