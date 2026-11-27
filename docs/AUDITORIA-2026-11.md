# Auditoría de código — noviembre 2026

Auditoría completa de código muerto, código sin sentido, legibilidad y performance, con la limpieza aplicada.
Este documento es el registro de **qué se encontró, qué se cambió, qué se dejó pendiente y cómo verificarlo**.
El mapa del código para editar día a día está en [`ARQUITECTURA.md`](ARQUITECTURA.md); las propuestas a futuro,
en [`MEJORAS.md`](MEJORAS.md).

---

## 1. Método

1. **Inventario read-only en paralelo**: `src/` completo (108 archivos), artefactos fuera de `src/`
   (scripts, `public/`, deps, configs, CI, docs) y una revisión arquitectónica.
2. **Medición de performance** sobre el build real (201 archivos HTML, JS/CSS de `dist/_astro`, payloads inline).
3. **Gate de revisión** antes de tocar código: se aprobaron las eliminaciones una por una y se descartaron
   dos falsos positivos (ver §8).
4. **Tres lanes de escritura con archivos disjuntos** + validación completa (unit, lint, build, size, e2e) y
   **segundo gate** sobre los diffs.
5. **Refactor de performance** (consentimiento inline → módulo) con **tercer gate** centrado en riesgo legal.

Todo lo afirmado abajo se verificó con comandos; no hay estimaciones sin medir.

---

## 2. Números antes / después

| Métrica | Antes | Después |
|---|---|---|
| Tests unitarios | 216 | **235** (+19) |
| Páginas construidas | 199 | 199 |
| E2E (chromium) | 57 + 1 skip | **59 + 1 skip** |
| `astro check` | 0 errors / 11 hints | 0 errors / 5 hints |
| HTML total (201 archivos) | 9.632 KB | **7.611 KB (−21,0 %)** |
| Script de consentimiento inline | 6,0 KB × 199 páginas = 1.204 KB | **0** (módulo de 7,7 KB / 2,7 KB gzip, cacheado) |
| CSS inline repetido (card + FAQ) | 1.247 KB | **434 KB** |
| `perfumes.json` | 89,1 KB | **86,3 KB** |
| Builds por push en CI | 3 (+2× test/lint) | **1** (+1 e2e, +1 deploy del mismo artifact) |
| Scripts huérfanos | 3 | 0 |
| Documentos de arquitectura | 0 | 1 (+ mejoras + este reporte) |

---

## 3. Código muerto eliminado

| Qué | Dónde | Por qué estaba muerto | Evidencia |
|---|---|---|---|
| `isBoutiqueExclusive` (76 entradas) | `perfumes.json`, `types.ts` | 0 lectores en producción; solo aparecía en fixtures de tests | grep en `src/` = 0 tras la limpieza |
| `CartState.updatedAt` | `types.ts`, `utils/cart.ts` (7 escrituras) | Se reescribía en cada lectura y **nunca se leía**: metadato con apariencia de funcionalidad | grep `updatedAt` en `src/` = 0 |
| `PerfumeCatalog` | `types.ts` | Interfaz sin ningún uso (ni tests) | grep = 0 |
| `roleLabel()` | `utils/layering.ts` | Solo la llamaba su propio test; ninguna página la usaba | grep = 0 |
| 13 tipos de-exportados | `analytics-client`, `catalogo`, `formatters`, `hub`, `guias`, `quiz`, `data/layering` | `export` sin importadores externos (ruido de API) | grep de cada símbolo fuera de su archivo |
| 3 scripts de verificación one-off | `scripts/*-verify.mjs` | No estaban wireados a nada, apuntaban a puertos fijos e importaban `playwright` (paquete no declarado) | 0 referencias en `package.json`/CI |
| `scripts-virales.md`, `dev-server.log` | raíz | Doc superada / log scratch | — |
| Import muerto `SearchIndexEntry` | `CatalogView.astro` | El typecheck lo marcaba como hint | hint eliminado |
| Ramas inalcanzables | `astro.config.mjs` (sitemap), `slider.ts` (dots por JS) | `trailingSlash: 'always'` ⇒ nunca hay URL sin `/`; `SliderNav` siempre renderiza dots | 0 URLs sin barra en `sitemap-0.xml`; 1 solo markup con dots |
| Integración SecurePrivacy dormida | `consent.ts` (antes inline) | `secureprivacyScriptId: ''`: los listeners `sp_spab_unblock`/`sp_unblock_*`/`sp_consent` no se ejecutaban nunca | ahora se instalan **solo si** el ID está configurado |

**Campos que se conservaron a propósito** (tienen lector real): `featured` (desempate del quiz), `originalPrice`
(anclaje de precio en la ficha), `gender`, `olfactoryFamily`, `notes`, `sizes`, `slug`, `id`.

---

## 4. Duplicación eliminada

| Duplicado | Copias | Solución |
|---|---|---|
| Normalización de texto (minúsculas + sin acentos) | 6 | `src/utils/text.ts` → `normalizeText()` |
| Slug de familias/casas | 2 | `src/utils/text.ts` → `slugify()`, **byte-idéntico** (42 slugs comparados, 0 diferencias) |
| `genderMatches` | 2 (firmas distintas) | una sola en `utils/catalogo.ts`; el quiz mapea `para-el/para-ella/indistinto` |
| CSS de card y FAQ inlineado | card 5,6 KB y FAQ 4,8 KB en ~77 páginas | movido a `src/styles/global.css`: −812 KB de HTML, un solo asset cacheado |
| Tipo de índice `{id,text}` | 2 | `SearchIndexEntry` en `search-page.ts`, reusado por `hub.ts` |
| Lectura de `image-dims.json` + fallback + doble cast | 2 páginas | `src/data/image-dims.ts` → `dimsFor()` / `hasDims()` |
| Serialización JSON-LD | 13 | `src/utils/jsonld.ts` → `jsonLd()` (escape `<` garantizado) |
| `.slice()` redundante tras `.filter()` | 1 | eliminado |
| Changelog manual de `dataVersion` | 34 versiones | se dejó como está (ver `MEJORAS.md`, automatización propuesta) |
| Cableado de búsqueda catálogo↔hub | ~395 líneas en 2 scripts | `src/utils/list-controller.ts` + config por página: −114 líneas en los `<script>`, una sola máquina de estado, 4 tests unitarios y 2 e2e nuevos |
| Card de producto | SSR en `ProductCard` + string `homeCardHtml()` | pool SSR de 12 cards y `initHomeRandom` moviendo nodos: `homeCardHtml` eliminado y la home deja de descargar 86 KB de catálogo |

Duplicaciones/pendientes **no aplicados** (documentados en `MEJORAS.md`): CSS de card/FAQ repetido por página
(~370 KB de HTML), bundle del quiz (33 KB) y modelo de datos (`id`≡`slug`, snapshot en `CartItem.size`).

---

## 5. Código sin sentido corregido

- **`LayerinAffinityOptions`** (typo en un tipo de API) → `LayeringAffinityOptions`.
- **Consentimiento en 130 líneas de JS inline sin tipos**, repetido en 199 páginas, con comentarios y
  compatibilidad de un proveedor desactivado → `src/utils/consent.ts`, tipado, testeado (7 casos) y bundleado.
- **Config del consentimiento en `<div hidden>` dentro de `<head>`** (cerraba el head antes de tiempo y movía
  estilos al body): reemplazado por `<script type="application/json">`, válido en head. Verificado: 0 `<link>`/`<style>`
  después de `</head>`.
- **`readState` con `localStorage` fuera del try/catch** y guard de inicialización marcado antes del éxito:
  en modo privado dejaba el sitio sin banner ni analytics y bloqueaba reintentos. Ahora es fail-closed y reintentable.
- **CI con 3 builds y 2 corridas de test/lint por push** → un workflow `build → e2e → deploy` que comparte artifact.
- **`size-check.mjs` pasaba si no encontraba archivos** (un build roto no rompía el budget) → ahora falla con exit 1.
- **Documentación mentirosa**: README decía `src/public` (no existe), “todas las tallas son de 5 ml” (hay frascos de
  90/100 ml), `copy-perfumes.mjs` decía “32KB” (son 91 KB), `guiones-reels` decía “37 decants” (son 76).
  Todo corregido; `CLAUDE.md` pasó a ser un puntero a `AGENTS.md` para no mantener dos copias.
- **Card duplicada**: el markup de la card existía en `ProductCard.astro` (SSR) y como string en `homeCardHtml()`,
  con `is:global` solo para sostener la copia. Hoy la home renderiza un pool SSR de 12 cards y `initHomeRandom`
  **mueve nodos**; `homeCardHtml` ya no existe y la home no descarga el catálogo (86 KB menos por visita).
- **Cableado duplicado de listas**: catálogo y hub repetían URL→estado→DOM, guardas anti-view-transition y
  contadores. Hoy comparten `src/utils/list-controller.ts`; los scripts de página son configuración.

---

## 6. Documentación para editar el código

- [`ARQUITECTURA.md`](ARQUITECTURA.md): mapa de rutas, componentes, utilidades y datos; pipeline de build; flujo de
  una compra; **10 recetas** (agregar perfume/frasco, cambiar stock/precio, agregar inspiración, combo de layering,
  página, marca, estilos, descuento del tridente, formulario de pedido) y 8 reglas de oro de lo que no se toca.
- [`MEJORAS.md`](MEJORAS.md): 3 pendientes de bajo riesgo + 5 estructurales, con impacto/esfuerzo/riesgo y verificación.
- `README.md` y `AGENTS.md` actualizados (comandos, tamaños, stock por talle, `dataVersion`).
- Comentarios en español en los módulos nuevos (`text.ts`, `jsonld.ts`, `image-dims.ts`, `consent.ts`, `list-controller.ts`).

---

## 7. Artefactos, dependencias y CI

- **0 assets huérfanos**: 76 imágenes de perfumes ↔ 76 perfumes (1:1), 57 imágenes de originales ↔ 65 referencias,
  iconos/fuentes/favicon/og todos usados.
- **0 dependencias sobrantes** (`astro`, `@astrojs/check`, `@astrojs/sitemap`, `@playwright/test`,
  `@vitest/coverage-v8`, `jsdom`, `sharp`, `typescript`, `vitest`).
- **CI unificado** (`.github/workflows/ci.yml`): `build` corre test, lint, build y size, y publica `dist`;
  `e2e` baja ese artifact y corre Playwright; `deploy` (solo `main`) publica el mismo artifact y avisa a IndexNow.
  Un push = 1 build. Los PR corren build + e2e sin deploy.
- `checkout`/`setup-node` subieron a `@v5` (elimina el warning de Node 20 en esos dos). Quedan warnings de
  `upload-artifact@v4`/`download-artifact@v4`/`deploy-pages@v4`: bump pendiente en `MEJORAS.md`.

---

## 8. Falsos positivos descartados (para no repetir el análisis)

- **`src/test/e2e/test.ts` no es basura**: es el fixture de Playwright que bloquea trackers, importado por los 10 specs.
- **`buildHubCountTextWithCasa` no está muerto**: lo usa `decants/index.astro`.
- **Los 6 bloques JSON-LD “sin escape” que reportó el primer gate sí escapaban** (`.replace(/</g,'\\u003c')`
  al final del bloque): no había bug; el helper igual centraliza el patrón.
- **`astro dev --background|stop|status|logs` sí existe** en Astro 7 (`npx astro dev --help`): la receta de
  `AGENTS.md` era correcta.
- **El job `deploy` sí necesita `checkout` + `setup-node`**: corre `scripts/indexnow.mjs` con Node.

---

## 9. Qué NO se tocó (guardrails respetados)

- Rutas y slugs indexados; redirects de `/catalogo` y de la landing vieja de Sauvage.
- Claves de `localStorage` (`atomiza-cart`, `perfumes-data`, `atomiza-consent`, `atomiza-order-form`).
- JSON-LD y sus campos (`Product`, `Store`, `BreadcrumbList`, `FAQPage`).
- Copy y estética aprobadas; todo el texto de marca sigue en `src/site.config.ts`.
- Contenido editorial (`layering.ts`, `quiz-profiles.ts`, `notas.ts`, `guias.ts`, `resenas.ts`).
- `dataVersion` no se subió: quitar un campo que nadie lee en el cliente no cambia lo visible. Sigue en `34`.

---

## 10. Deuda pendiente (priorizada en `MEJORAS.md`)

1. **`dataVersion` automático** por hash del catálogo en `prebuild` (hoy es manual y puede servir precios viejos).
2. **Bundle del quiz** (33 KB para 5 preguntas).
3. Modelo de datos: `id` ≡ `slug`, snapshot inerte en `CartItem.size`, campos copiados en `inspiraciones.ts`.
4. **Pool de la home**: 12 es fijo por build; opciones medidas en `MEJORAS.md` (ampliar, rotar por deploy o curar con `featured`).

Ninguna es urgente; todas tienen su criterio de verificación en `MEJORAS.md`.

---

## 11. Cómo verificar el estado actual

```bash
npm test          # 235 tests
npm run lint      # astro check: 0 errors
npm run build     # 199 páginas
npm run size      # 38 OK, 0 fallas
npm run test:e2e  # 59 passed, 1 skipped (chromium; necesita el build)
```

Chequeos puntuales de la limpieza:

```bash
# no queda código muerto conocido
grep -r "isBoutiqueExclusive\|updatedAt\|roleLabel\|PerfumeCatalog" src/ || echo "limpio"
# un solo helper de texto y un solo jsonLd
grep -rn "function normalizeText\|function slugify" src/utils/text.ts
grep -rn "function jsonLd" src/utils/jsonld.ts
# el consentimiento ya no viaja inline
grep -rl "let analyticsLoaded" dist || echo "sin inline"
```
