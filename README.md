# ΛTOMIZΛ — Catálogo de decants y frascos

Tienda estática de perfumes construida con **Astro**: 76 perfumes (decants de 5 ml y, en 24 de ellos, frascos cerrados de 90/100 ml) que generan 199 páginas estáticas. Pensada para ser copiada y adaptada a cualquier emprendimiento.

## Comandos

| Comando | Acción |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo (`localhost:4321`) |
| `npm run build` | Compila el sitio estático a `dist/` |
| `npm run preview` | Previsualiza el build |
| `npm test` | Tests unitarios (Vitest, 233 tests) |
| `npm run test:e2e` | Tests e2e (Playwright, Chromium) |
| `npm run test:coverage` | Tests con cobertura |
| `npm run lint` | `astro check` (typecheck) |
| `npm run size` | Presupuesto de peso: CSS 100 KB, JS 50 KB, fuente 40 KB |

## Stock manual

El stock se edita a mano en `src/data/perfumes.json`, campo `stock` de cada talle (`sizes`). Cada perfume tiene su talle de 5 ml y, si aplica, un frasco de 90/100 ml con stock independiente.

Tres estados (ver `src/utils/stock.ts` y `src/components/ui/Chip.astro`):

- **EN STOCK** (verde): `stock >= 5`
- **POCO STOCK** (amarillo): `stock` entre 1 y 4
- **SIN STOCK** (gris): `stock = 0`

Convención: `en stock` → 10, `poco stock` → 3, `sin stock` → 0.

## Cómo reutilizarla en otro negocio

La carpeta es autocontenida. Para levantar el mismo sitio con otra marca:

1. **Editar `src/site.config.ts`** — ahí vive todo lo específico del negocio:
   - `name` (nombre de la marca), `namePlain`, `tagline`, `description`
   - `instagramHandle` / `instagramUrl`
   - `whatsappNumber` / `whatsappUrl` / `phoneDisplay`
   - `storage` (claves de localStorage del carrito y del catálogo)
   - No tocar `basePath`: sale solo de `import.meta.env.BASE_URL`.
2. **Editar los datos en `src/data/`**:
   - `perfumes.json` — catálogo: nombre, marca, género, familia olfativa, notas, precios, stock por talle e imágenes.
   - `quiz-profiles.ts`, `inspiraciones.ts`, `layering.ts`, `notas.ts`, `guias.ts`, `resenas.ts` — perfiles del quiz, landings por inspiración, combos, notas, guías del blog y reseñas.
3. **Reemplazar imágenes** en `public/` (favicon, og-image) y las de productos en `public/images/perfumes/` (los `src` del JSON son relativos a `images/perfumes/`).
4. **Texto legal** (`src/pages/terminos.astro` y `src/pages/privacidad.astro`) — ya toman marca y contactos del config; ajustá el contenido si hace falta.
5. **Desplegar en GitHub Pages**: `BASE_PATH=/tu-repo/ SITE_URL=https://tuusuario.github.io npm run build` y subir `dist`. El workflow `.github/workflows/ci.yml` ya hace build y deploy automático con las variables del repo.

El código restante no tiene ningún string de la marca: todo sale de `site.config.ts`.

## Documentación

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — mapa del código y guía de edición.
- [`docs/MEJORAS.md`](docs/MEJORAS.md) — mejoras pendientes y deuda técnica.
- Guía de reutilización: la sección de arriba, [Cómo reutilizarla en otro negocio](#cómo-reutilizarla-en-otro-negocio).
- Convenciones para agentes: [`AGENTS.md`](AGENTS.md).

## Despliegue

Push a `main` → GitHub Actions (`.github/workflows/ci.yml`) → GitHub Pages en `https://<user>.github.io/<repo>/`. El workflow corre `build` (test, lint, build, size), después `e2e` y recién ahí deploya. Los pull requests corren `build` + `e2e` y no deployan. Si usás un dominio propio o un base path distinto, configurá las variables `BASE_PATH` y `SITE_URL` del repo.
