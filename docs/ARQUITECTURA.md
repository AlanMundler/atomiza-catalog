# Arquitectura y guía de edición

Este documento es el mapa del proyecto para una persona que tiene que tocarlo sin haberlo escrito.
Responde tres preguntas: **dónde está cada cosa**, **cómo se conecta** y **qué hacer para cambiar X**.

> Convención del repo: todo el texto de marca/negocio vive en `src/site.config.ts`; los datos del catálogo en
> `src/data/perfumes.json`; el resto del código no hardcodea nombre, teléfono, redes ni claves de storage.

---

## 1. Qué es

Sitio **estático** (Astro 7, sin backend ni base de datos) para vender decants de 5 ml y frascos cerrados.
El “carrito” es `localStorage` + un pedido que se envía armado por WhatsApp/Instagram.
Se publica solo en GitHub Pages: `git push origin main` → CI → Deploy.

Rutas públicas principales:

| Ruta | Página | Archivo |
|---|---|---|
| `/` | Home (hero, destacados aleatorios, reseñas, FAQ) | `src/pages/index.astro` |
| `/catalogo/decants/` | Catálogo de decants (filtro por género + búsqueda) | `src/pages/catalogo/decants/index.astro` + `components/catalog/CatalogView.astro` |
| `/catalogo/frascos/` | Catálogo de frascos cerrados (mismo componente) | `src/pages/catalogo/frascos/index.astro` |
| `/producto/<slug>/` | Ficha de producto | `src/pages/producto/[slug].astro` |
| `/decants/` | Hub “por aroma famoso” (chips por casa + búsqueda) | `src/pages/decants/index.astro` |
| `/decants/<slug>/` | Landing por inspiración (ej. `aventus-creed`) | `src/pages/decants/[slug].astro` |
| `/familias/<familia>/` | Listado por familia olfativa | `src/pages/familias/[familia].astro` |
| `/notas/` y `/notas/<nota>/` | Índice y listado por nota | `src/pages/notas/…` |
| `/layering/` | Combinador de 2 perfumes + 22 combos curados | `src/pages/layering/index.astro` |
| `/quiz/` | Quiz de 5 preguntas → recomendación | `src/pages/quiz.astro` |
| `/tridentes/` | Explicación del descuento “3 decants” | `src/pages/tridentes.astro` |
| `/blog/` y `/blog/<slug>/` | Guías | `src/pages/blog/…` + `src/data/guias.ts` |
| `/envios/`, `/terminos/`, `/privacidad/` | Información y legales | `src/pages/*.astro` |
| `/robots.txt` | Generado | `src/pages/robots.txt.ts` |

Redirecciones deliberadas (no borrar): `/catalogo` → `/catalogo/decants/` y
`/decants/sauvage-elixir-dior` → `/decants/bottled-absolu-hugo-boss/` (ver `astro.config.mjs`).

---

## 2. Cómo se arma el sitio

```
npm run build
  └─ prebuild (package.json)                     ← genera insumos antes de Astro
      1. generate-og-images.mjs    → public/og/<slug>.jpg        (og:image por perfume)
      2. generate-default-og.mjs   → public/og-image.jpg         (og genérico)
      3. generate-og-pages.mjs     → public/og/og-<pagina>.jpg   (og de secciones)
      4. copy-perfumes.mjs         → public/data/perfumes.json   (payload del cliente)
      5. image-dims.mjs            → src/data/image-dims.json    (width/height anti-CLS)
  └─ astro build                                 → dist/ (199 páginas)
  └─ npm run size                                → budget de JS/CSS/fuente
```

- `public/og/` y `public/data/` son **generados** (gitignored). No editarlos a mano.
- `src/data/image-dims.json` sí se versiona: cambia cuando se agregan imágenes (re-correr `node scripts/image-dims.mjs`).
- El cliente pide `data/perfumes.json` on-demand y lo cachea en `localStorage['perfumes-data']`.
  La caché se invalida con `site.dataVersion` (`src/site.config.ts`): **subir el número cuando cambie el catálogo publicado**
  (stock, precio, perfume nuevo, imagen). Si olvidás subirlo, un visitante recurrente puede ver precios viejos.

CI/CD (`.github/workflows/ci.yml`, un solo workflow): job `build` (`test` + `lint` + `build` + size) publica `dist` como artifact;
job `e2e` baja ese artifact y corre Playwright chromium; job `deploy` (solo en `main`) publica el mismo `dist` en Pages y avisa a IndexNow.
Los pull requests corren `build` + `e2e` y no deployan.
Baseline actual: **233 tests unitarios**, **57 e2e (+1 skip)**, **199 páginas**, **axe 0 violaciones**.

---

## 3. Mapa de `src/`

### Componentes

| Grupo | Archivos | Para qué |
|---|---|---|
| `ui/` | `Button`, `Chip`, `Drawer`, `Modal`, `Faq`, `Input`, `SliderNav` | piezas visuales reutilizables (sin lógica de negocio) |
| `layout/` | `Header`, `Footer`, `Consent`, `CookieBanner` | cascarón: nav, pie, consentimiento y carga de trackers |
| `catalog/` | `CatalogView`, `Filters`, `Search`, `ProductCard`, `ProductGrid`, `CatalogModeSwitch` | catálogo con filtro/búsqueda y cards |
| `product/` | `ProductDetail`, `SizeSelector`, `ImageGallery` | ficha: talle, stock, galería, CTAs |
| `cart/` | `CartDrawer`, `OrderModal`, `TridenteModal` | carrito, formulario de pedido y modal del tridente |

`src/layouts/Layout.astro` envuelve todas las páginas: SEO/OG, JSON-LD de negocio, header/footer,
drawer de carrito, modal de pedido, cookie banner y FAB de WhatsApp.

### Utilidades (`src/utils/`)

| Archivo | Responsabilidad |
|---|---|
| `cart.ts` | estado del carrito en `localStorage`, alta/baja/cantidades, validación de datos corruptos |
| `formatters.ts` | `formatPrice`, `escapeHtml`, resolución de items contra el catálogo vivo, totales, texto del pedido, link de WhatsApp |
| `cart-ui.ts` | HTML del drawer (items, totales, estado vacío, toast) |
| `stock.ts` | `getStockStatus` / etiquetas / `DECANT_ML` / talle primario |
| `catalogo.ts` | normalización de filtros, `cardMatches`, modo decants/frascos, texto de resultados, búsqueda difusa |
| `hub.ts` | buscador del hub “por aroma”, casas y contadores |
| `search-page.ts` | mecánica compartida de las páginas con búsqueda (URL, fuzzy, visibilidad, contadores) |
| `perfumes-client.ts` | fetch del catálogo + caché en `localStorage` validada por `dataVersion` |
| `related.ts` | “Podría interesarte” (score por familia/notas/género) |
| `layering.ts` | roles, afinidad y combos disponibles de layering |
| `quiz.ts` / `quiz-card.ts` | preguntas, scoring de recomendación y card del resultado |
| `trident.ts` / `tridente-live.ts` | reglas del descuento “3 decants” y progreso en el carrito |
| `quick-add.ts` | delegación del botón `+` de las cards |
| `slider.ts` | carrusel accesible (dots, teclado, swipe) |
| `size-selector.ts` | sincroniza la clase del talle elegido |
| `body-scroll.ts` | libera el `overflow` del body al cerrar drawer/modal |
| `view-transitions.ts` | ciclo de vida `astro:page-load` con `ClientRouter` (evita listeners duplicados) |
| `analytics-client.ts` | eventos GA4/Meta/TikTok (solo con consentimiento) |
| `home-random.ts` | sorteo de las cards de la home |

### Datos (`src/data/`)

| Archivo | Contenido | ¿Se edita a mano? |
|---|---|---|
| `perfumes.json` | catálogo: marca, nombre, género, familia, notas, descripción, imágenes, talles con precio y stock | **sí** (stock y precios) |
| `types.ts` | tipos del dominio (`Perfume`, `PerfumeSize`, `CartItem`, …) | solo si cambia el schema |
| `familias.ts` | familias olfativas derivadas del catálogo | no (deriva) |
| `notas.ts` | notas olfativas + textos + imagen de cada nota | sí (contenido) |
| `inspiraciones.ts` | relación perfume ↔ perfume original famoso (casa + imagen) | sí (contenido) |
| `layering.ts` | combos curados de layering | sí (contenido) |
| `quiz-profiles.ts` | 76 perfiles aromáticos para el quiz | sí (contenido) |
| `guias.ts` | artículos del blog | sí (contenido) |
| `resenas.ts` | reseñas reales de Google + rating agregado | sí (contenido) |
| `image-dims.json` | ancho/alto de cada avif (generado) | no |

`site.config.ts` es la única fuente de marca: nombre, tagline, redes, WhatsApp, píxeles, moneda,
localización, copy del hero, opciones de entrega/pago, `storage` (claves de localStorage) y `dataVersion`.

---

## 4. Flujo de datos de una compra

1. **Catálogo (SSR)**: las páginas importan `perfumes.json` en build y renderizan cards/fichas.
2. **Carrito**: `ProductDetail`/`quick-add` llaman `addToCart()` → `localStorage['atomiza-cart']`.
   El drawer (`CartDrawer`) re-resuelve cada item contra el catálogo vivo: **el precio que se cobra es siempre
   el del catálogo actual**, nunca el guardado. Items discontinuados o sin stock se muestran como no disponibles.
3. **Tridente**: con 3 decants se aplica el descuento automático (`trident.ts`).
4. **Pedido**: `OrderModal` junta nombre + contacto + entrega + pago y arma el texto con `generateOrderText()`;
   el botón abre WhatsApp (o Instagram / copiar). No hay pasarela de pago ni servidor.
5. **Analytics**: `analytics-client.ts` escucha eventos (`cart:add`, `analytics:view_item`, …) y solo envía
   si `window.__hasConsent('analytics'|'ads')` es true. El consentimiento se guarda en `localStorage['atomiza-consent']`.

---

## 5. Recetas

### Agregar un perfume (decant)
1. Copiar la foto a `public/images/perfumes/<slug>.avif`.
2. Agregar el objeto en `src/data/perfumes.json` (copiar uno existente y cambiar `id`, `slug`, `brand`, `name`,
   `gender`, `olfactoryFamily`, `description`, `notes`, `images`, `sizes` con `ml: 5`).
3. `node scripts/image-dims.mjs` (para que la card tenga width/height).
4. Subir `dataVersion` en `src/site.config.ts`.
5. `npm test && npm run lint && npm run build`, revisar `/producto/<slug>/` y `/catalogo/decants/`.

### Agregar un frasco cerrado
En el mismo perfume, agregar a `sizes` una entrada `{ "ml": 100, "price": <ARS>, "stock": <n> }`.
Si querés mostrar el precio “tachado” de referencia, cargar `originalPrice` en el perfume.
El orden de `sizes` importa: la ficha selecciona el primer talle con stock.

### Cambiar stock
Editar `stock` del talle en `perfumes.json` y subir `dataVersion`.
Estados (`src/utils/stock.ts`): `>= 5` EN STOCK · `1-4` POCO STOCK · `0` SIN STOCK.
Convención pedida por el dueño: “en stock” → 10, “poco stock” → 3, “sin stock” → 0.

### Cambiar un precio
Editar `price` del talle y subir `dataVersion`. Si el precio del frasco cambia y la ficha usa `originalPrice`,
revisar que el anclaje siga teniendo sentido.

### Agregar una inspiración (hub `/decants/`)
Agregar en `src/data/inspiraciones.ts` la relación `{ perfumeSlug, original, casa, slug, originalImageId }`
y la imagen en `public/images/originales/`. Correr `image-dims.mjs` y subir `dataVersion`.

### Agregar un combo de layering
Agregar en `src/data/layering.ts` el par de slugs + `confidence` + por qué funciona. La página calcula
disponibilidad y precio con `utils/layering.ts`.

### Agregar una página
Crear `src/pages/<ruta>.astro` con `Layout` (title, description, ogImage) y contenido. Si lleva cards,
reusar `ProductCard`/`ProductGrid`; si lleva búsqueda, reusar `search-page.ts`.
No hace falta tocar el menú salvo que quieras que aparezca en `Header`/`Footer`.

### Cambiar textos de marca / redes / WhatsApp
Solo `src/site.config.ts`. Para copy de una página, el archivo de esa página.

### Cambiar colores, tipografía o espaciados
Tokens en `src/styles/global.css` (`--color-*`, `--font-*`, `--spacing-*`, `--border-radius`, `--shadow-*`,
`--transition-*`). Los componentes consumen variables; evitá colores literales nuevos.
Los tres estados de stock usan `--color-status-*`.

### Cambiar el descuento “3 decants”
`src/utils/trident.ts` (`TRIDENT_COUNT`, `TRIDENT_DISCOUNT`) **y** `TRIDENTES_LINES` en
`scripts/generate-og-pages.mjs` (la imagen social repite el texto), **y** el copy de `/tridentes/`.

### Cambiar el formulario de pedido
Opciones en `site.config.ts` (`delivery`, `payment`); formato del mensaje en `utils/formatters.ts`
(`generateOrderText`); campos y validación en `components/cart/OrderModal.astro`.

---

## 6. Reglas de oro (no romper)

1. **Rutas y slugs son load-bearing**: están en el sitemap y en Google. No renombrar slugs ni cambiar
   `slugify`/`hubCasaSlug` si el resultado deja de ser byte-idéntico.
2. **Claves de `localStorage`** (`site.storage.*`): renombrarlas vacía carritos y borra consentimiento.
3. **JSON-LD** (`Product`, `Store`, `BreadcrumbList`, `FAQPage`): es lo que habilita rich results. Si se centraliza
   el helper, conservar el escape `\u003c` dentro de `<script>`.
4. **`dataVersion`**: es la única invalidación de caché del catálogo. Subir siempre que cambien datos publicados.
5. **`is:global` de `ProductCard`** y los atributos `data-perfume-id` / `data-quick-add`: los usan el sorteo de la home,
   el quick-add y el analytics. Si se cambia el markup, conservarlos.
6. **`trailingSlash: 'always'`** y el filtro del sitemap: no “simplificar” sin revisar URLs canónicas.
7. **`devToolbar: { enabled: false }`**: activarlo inyecta HTML que rompe los e2e.
8. **Guardas anti-duplicado de `view-transitions.ts`** (`__vtlGen`, `isPageActive`): son la razón por la que los
   listeners no se duplican al navegar con `ClientRouter`.

---

## 7. Tests y verificación

| Comando | Qué valida |
|---|---|
| `npm test` | 233 tests unitarios (Vitest + jsdom) |
| `npm run lint` | `astro check` (TypeScript en `.ts` y `.astro`) |
| `npm run build` | 199 páginas estáticas |
| `npm run size` | budget de JS/CSS/fuente |
| `npm run test:e2e` | Playwright: carrito, checkout, catálogo, quiz, layering, slider, SEO |
| `npm run test:coverage` | cobertura |

Los e2e corren contra `npm run preview` con el build real (`playwright.config.ts`), bloqueando trackers.

---

## 8. Deuda conocida y mejoras propuestas

Ver [`docs/MEJORAS.md`](MEJORAS.md) (priorizado por impacto/esfuerzo/riesgo) y el reporte de la auditoría
[`docs/AUDITORIA-2026-11.md`](AUDITORIA-2026-11.md).
Resumen de lo estructural pendiente: cableado de búsqueda duplicado entre catálogo y hub, card con doble
fuente de verdad (SSR vs string JS), `dataVersion` manual, CSS repetido entre páginas y bundle del quiz.
