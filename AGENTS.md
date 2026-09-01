## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Configuración del emprendimiento (importante)

Todo lo específico de la marca (nombre, tagline, Instagram, WhatsApp, teléfono, textos de pedido y claves de localStorage) vive en **`src/site.config.ts`**. No hay strings de marca en el resto del código.

Al agregar o modificar cualquier texto visible, uso de redes/WhatsApp o clave de storage, sacarlo de `site.config.ts` (no hardcodear). El base path se resuelve con `import.meta.env.BASE_URL` (definido por `BASE_PATH` en `astro.config.mjs`); las imágenes internas usan el helper `assetUrl()` y rutas relativas (`images/perfumes/...`).

Para reutilizar el proyecto en otro emprendimiento, ver `README.md`.

## Stock manual (importante)

El stock se maneja **manualmente** editando `src/data/perfumes.json`, campo `stock` de la talla de cada perfume (todas las tallas son de 5 ml).

Los tres estados preconfigurados (etiquetas en `src/utils/stock.ts`; colores en `src/styles/global.css` con las variables `--color-status-*`, aplicadas por `src/components/ui/Chip.astro`):

- **EN STOCK** (verde `#8dba7d`): `stock >= 5`
- **POCO STOCK** (amarillo `#c5a059`): `stock` entre 1 y 4
- **SIN STOCK** (gris `#8a8a8a`): `stock = 0`

### Convención con el usuario

Cuando el usuario dice **"(perfume) esta en (estado)"**, por ejemplo "qaed-al-fursan-untamed esta en poco stock", cambiar el `stock` de ese perfume en `perfumes.json` al rango del estado pedido:

- `en stock` → `stock: 10`
- `poco stock` → `stock: 3`
- `sin stock` → `stock: 0`

Luego correr tests (`npm test`), `npm run lint` (`astro check`), `npm run build` y hacer commit + push (deploy automático a GitHub Pages).

## Decisiones del usuario (no proponer de nuevo)

- **Páginas por barrio no van.** El usuario rechazó la idea de armar landing pages por barrio (`/barrios/...`). Retirarla de cualquier plan futuro. El SEO local se cubre con la ficha de Google Business, no con páginas por barrio.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
