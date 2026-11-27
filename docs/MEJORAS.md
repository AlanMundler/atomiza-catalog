# Mejoras propuestas

Qué conviene hacer después de la limpieza de noviembre 2026, ordenado por **impacto / esfuerzo / riesgo**.
Ninguna propuesta cambia rutas indexadas ni la estética aprobada. Cada una trae cómo verificarla.

Contexto medido (build del 27/11/2026): 199 páginas, `dist/` 14,1 MB; HTML 9,63 MB
(6,74 MB markup + 1,65 MB JS inline + 1,25 MB CSS inline); JS/CSS compartido 106/135 KB;
`perfumes.json` 91 KB; quiz 33 KB de JS en una sola página.

---

## Ahora (bajo riesgo, retorno claro)

| # | Mejora | Por qué | Esfuerzo | Riesgo | Verificación |
|---|---|---|---|---|---|
| 1 | **Consentimiento inline → módulo** (`initConsent()` en TS, IDs por `data-*`) | Hoy el mismo script de 6,0 KB sin minificar se repite en 199 páginas = **1,2 MB de HTML**; además son ~45 líneas de compatibilidad con SecurePrivacy que está desactivado (`secureprivacyScriptId: ''`) | M | M | build: 0 `<script is:inline>` de consentimiento, HTML −~1 MB; e2e y manual: banner en 1ª visita, no en revisit, cero beacons antes de aceptar |
| 2 | **`jsonLd()` helper con escape siempre** | 6 bloques JSON-LD no escapan `<` (bug latente si un texto de dato contiene `<`); 13 copias del mismo idiom | B | Nulo | contar 0 `JSON.stringify` sueltos en `<script type="application/ld+json">`; build + validador de rich results |
| 3 | **`dataVersion` automático** (hash de `perfumes.json` en prebuild) | Es una tarea manual que, si se olvida, muestra precios viejos a visitantes recurrentes (34 versiones a mano lo demuestran) | M | M | dos builds con y sin cambio de datos: la versión cambia solo cuando cambia el JSON; visitante con caché recibe la nueva |
| 4 | **`getImageDims()` único** | `image-dims.json` se lee en 2 páginas con el mismo `as unknown as` y el mismo fallback | B | Nulo | `grep "as unknown as Record<string, ImageDims>"` = 0 |
| 5 | **Budget de performance en CI** | El budget actual solo mira tamaño de chunks aislados; no detecta que una página crezca 40 KB | M | B | job que falla si el HTML de `/`, `/catalogo/decants/` o una ficha supera un umbral acordado |

## Después (mayor impacto, requieren diseño o validación visual)

| # | Mejora | Por qué | Esfuerzo | Riesgo |
|---|---|---|---|---|
| 6 | **Un solo controlador de listados** (`list-controller.ts`) para catálogo y hub | ~395 líneas de cableado casi idénticas (`readUrlState`/`applyFilters`/`popstate`/guarda anti-VT); estimado −300/350 líneas y una sola máquina de estado testeable | M | M (e2e cubre el filtrado) |
| 7 | **Card con una sola fuente de verdad** | `ProductCard.astro` (SSR) y `homeCardHtml()` (string JS) duplican markup y clases; el `is:global` existe solo por la copia. Reordenar nodos SSR en `initHomeRandom` y borrar `homeCardHtml` | M | M (tests de home-random + validación visual) |
| 8 | **Consolidar CSS repetido** (grillas, chips, hero) | `.faq-list` 4,8 KB ×77 páginas y `.product-card` 5,4 KB ×65: mismo CSS scopeado repetido; grillas 2/3/4 columnas copiadas en 6+ archivos | M | B (medir con Coverage + screenshots) |
| 9 | **Adelgazar el quiz** | 33 KB de JS para 5 preguntas: `quiz-profiles.ts` (76 perfiles) + tablas de keywords viajan siempre | M | M |
| 10 | **Carrito sin HTML por strings** | `cart-ui.ts` arma el drawer concatenando strings y escapando campo por campo; un `<template>` + `textContent` elimina el vector de escape manual | M | M (e2e del drawer) |
| 11 | **Modelo de datos más chico** | `id` ≡ `slug` en el 100% de los registros; `CartItem.size` guarda `price/stock` que nunca se confían (se re-resuelven); `inspiraciones.ts` copia marca/nombre/familia del perfume | A | A (migración de `localStorage` + textos visibles) |
| 12 | **Un solo vocabulario de género** | Hoy conviven `masculino|femenino|unisex`, `GenderFilter` con `all` y el quiz con `para-el|para-ella|indistinto` | M | B |

---

## Detalle de las tres que más mueven la aguja

### 1. Consentimiento como módulo

Estado actual: `Consent.astro` usa `is:inline` + `define:vars`, así que Astro no puede bundlearlo ni minificarlo;
el bloque viaja completo en las 199 páginas. Además escucha eventos de SecurePrivacy que ya no existen.

Propuesta:
1. `src/utils/consent.ts` con `initConsent(options: { consentKey, gaId, metaPixelId, tiktokPixelId, securePrivacy: boolean })`.
   El módulo lee `localStorage`, define `window.__hasConsent`, instala los loaders (GA/Meta/TikTok), escucha el
   evento del banner propio (`sp_cookie_banner_save`) y, **solo si `securePrivacy` es true**, los eventos `sp_*`.
2. Los IDs se pasan por `data-*` en un `<div hidden data-consent-config>` renderizado por `Consent.astro`
   (evita `define:vars` y deja el script como módulo con hash, cacheado entre páginas).
3. Un único entry: `initConsent(...)` y después `initAnalytics()` en el mismo módulo, para que el orden
   “estado de consentimiento → listeners de analytics” sea explícito y no dependa del orden de `<script>`.
4. Tests unitarios nuevos: decisión guardada, default denegado, evento de aceptar/rechazar, no cargar trackers sin consentimiento.

Riesgo principal: el script inline corre antes que un módulo (timing). Mitigación: los trackers solo se cargan
por acción del usuario o por estado ya guardado; no hay beacons en el HTML inicial. Verificar con DevTools
(Network sin requests a google-analytics/facebook/tiktok antes del click) y con los e2e actuales, que ya
bloquean esos dominios (`src/test/e2e/test.ts`).

### 2. `jsonLd()` siempre escapado

```ts
// src/utils/jsonld.ts
/** Serializa datos para <script type="application/ld+json"> escapando `<` para
 *  que un `</script>` dentro de un texto de dato no pueda cerrar el bloque. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
```

Reemplaza los 13 sitios. Arregla de paso los 6 que hoy no escapan (`Layout.astro:70,115`,
`blog/[slug].astro:28`, `decants/[slug].astro:56`, `index.astro:70`, `layering/index.astro:277,282,293`).

### 3. `dataVersion` automático

En `scripts/copy-perfumes.mjs` (o un script nuevo en `prebuild`): calcular `sha256` de `perfumes.json`,
tomar 8 chars y escribir `public/data/version.json` (`{ "version": "a1b2c3d4" }`). `perfumes-client.ts` compara
la versión del fetch contra la guardada; si difiere, refresca. El `dataVersion` de `site.config.ts` y su
changelog de 34 líneas se pueden retirar cuando la migración esté probada (mantener la clave de caché
`perfumes-data` para no vaciar carritos).

---

## Lo que NO conviene hacer

- **No** convertir `layering.ts`, `quiz-profiles.ts`, `notas.ts`, `guias.ts` ni `resenas.ts` a JSON: son
  contenido editorial con tipos; JSON pierde autocompletado y validación.
- **No** agregar un framework de islas (React/Vue) para el carrito: el costo de hidratación supera la ganancia.
- **No** paginar el catálogo con scroll infinito: hoy el HTML completo es lo que indexa Google; si se pagina,
  mantener una primera página server-rendered con todos los perfumes.
- **No** tocar `trailingSlash`, redirects, claves de `localStorage` ni los slugs derivados.
