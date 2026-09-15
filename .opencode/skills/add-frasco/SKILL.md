---
name: add-frasco
description: Agregar la opción de frasco original cerrado a un perfume que ya está en el catálogo (nuevo talle con stock bajo al lado del decant 5ml). Usar cuando el usuario dice "agregar frasco", "frasco cerrado", "vender el frasco", "opción frasco", "frasco original" o quiere vender la botella completa de un perfume del stock.
---

# Agregar frasco cerrado a un perfume del catálogo

Cuando el usuario quiera vender el frasco original (botella cerrada) de un
perfume que YA está en `src/data/perfumes.json`, se suma un talle nuevo
(`90`/`100`ml) junto al decant de 5ml. El decant queda intacto.

## Únicas preguntas al usuario

1. **Precio** (ARS) del frasco.
2. **Mililitros** del frasco (`90` o `100`, lo que diga la caja).

Nada más: el stock del frasco queda SIEMPRE en `1` (última unidad) y el resto
es comportamiento automático (ver abajo). Si el usuario ya pasó precio y ml
en el mensaje, no preguntar nada. Si el perfume todavía NO está en el
catálogo, derivar primero al skill `add-perfume`.

## Pasos

1. **Ubicar el perfume.** Buscar por nombre aproximado en `src/data/perfumes.json`
   y confirmar `id`/`slug` con el usuario si hay ambigüedad (ej. "sublime" →
   `badee-al-oud-sublime`, "mayar" → `mayar` — ojo con `mayar-natural-intense`).

2. **Agregar el talle en `src/data/perfumes.json`.** Editar con la tool `edit`
   (NUNCA con PowerShell, para no romper acentos/UTF-8; el archivo es UTF-8 sin
   BOM, indentación 2 espacios). El talle va DESPUÉS del de 5ml:

   ```json
   "sizes": [
     { "ml": 5, "price": <precio decant>, "stock": <stock actual> },
     { "ml": <ml del frasco>, "price": <precio frasco>, "stock": 1 }
   ]
   ```

   Si ese `ml` ya existe en el perfume, es una actualización (precio/stock),
   no un duplicado.

3. **Invalidar caché.** Incrementar `dataVersion` en `src/site.config.ts` y anotar
   el motivo en el comentario de al lado. Sin esto, los visitantes con el
   catálogo cacheado ven el frasco pero el carrito lo rechaza ("Intentá de nuevo").

4. **Verificar y deployar.**
   - En cada comando bash, refrescar PATH:
     `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
   - `npm test` (unit), `npm run lint` (astro check), `npm run build`.
     No es obligatorio correr e2e; si se corre: matar node en 4321 antes y usar
     `npx playwright test --project=chromium --project=mobile-chrome`.
   - Commit + push a `main` (deploy automático por GitHub Actions). Mensaje:
     `feat: frasco <ml>ml <Name> ($<precio>, stock 1)`. Seguir el deploy con
     `gh run watch <databaseId> --exit-status --interval 5`.

5. **Reportar el resultado:** perfume, ml y precio del frasco, stock (1/última
   unidad) y confirmación de que el decant 5ml no se tocó.

## Lo que ya funciona solo (NO tocar)

- **Selector de la ficha** (`SizeSelector.astro`): renderiza el frasco al lado
  del 5ml con el chip `QUEDA 1 UNIDAD` / `QUEDAN N UNIDADES` (`sizeStockLabel`).
- **Aviso de stock** (`sizeStockMessage`): "¡Última unidad! Queda 1 frasco...".
  La ficha actualiza aviso, barra fija y WhatsApp al cambiar de talle.
- **Agregado rápido** (cards de catálogo/home/quiz): sigue usando el decant 5ml
  (`primarySize`). El frasco solo se compra desde la ficha del producto.
- **Tridente** ("cada 3 decants"): cuenta SOLO talles 5ml (`isDecantSize` en
  `src/utils/stock.ts`). El frasco suma al subtotal pero no completa tridentes.
- **Talle por defecto**: 5ml si hay stock; si el decant se agota, el frasco pasa
  a ser el defecto automáticamente (`ProductDetail.astro`).

## Edge cases

- **Se vende el frasco**: cuando el usuario dice "(perfume) frasco sin stock",
  poner `stock: 0` en ESE talle (el decant no se toca), bump de `dataVersion`,
  tests + build, commit + push. El selector lo muestra deshabilitado.
- **Reposición del frasco**: `stock: 1` (o las unidades que diga), mismo flujo.
- **El usuario después quiere cambiar el estado del decant**: convención de
  AGENTS.md (`en stock` → 10, `poco stock` → 3, `sin stock` → 0) aplicada al
  talle de 5ml, no al frasco.
