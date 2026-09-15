---
name: add-perfume
description: Cargar un perfume nuevo al catálogo a partir de su link de Fragrantica (extraer datos y foto .avif, agregarlo al stock en perfumes.json, a inspiradas en inspiraciones.ts y al quiz en quiz.ts). Usar cuando el usuario dice "agregar perfume", "nuevo perfume", "añadir al stock", "meter en el catálogo", "te paso el link de fragrantica" o pasa un enlace de fragrantica.es/.com para sumar un perfume.
---

# Agregar perfume nuevo al catálogo

Cuando el usuario quiera sumar un perfume al stock, va a pasar el link de
Fragrantica (p. ej. `https://www.fragrantica.es/perfume/Maison-Alhambra/Your-Touch-93816.html`).
Workflow completo: extraer la info y la foto, cargarlo en `src/data/perfumes.json`,
en inspiradas (`src/data/inspiraciones.ts`) y en el quiz (`src/utils/quiz.ts`),
invalidar caché, verificar y deployar.

## Preguntas al usuario

1. **Género** (`masculino` | `femenino` | `unisex`) — sirve para los filtros del catálogo.
   NO inferirlo de Fragrantica; el dato del usuario es el que manda.
2. **Precio** (ARS) del decant 5ml. El stock queda SIEMPRE en `10` (en stock), salvo que el
   usuario diga otro estado después (ver AGENTS.md: `en stock` → 10).
3. **Precio aproximado del frasco original** (ARS, opcional) — alimenta el card de anclaje
   ("este perfume cuesta aproximadamente..."). Si no lo da, la entrada va sin `originalPrice`.
4. **Confirmar la inspiración** — se propone el "inspirado en" que indica Fragrantica
   (ej. "Tygar de Bvlgari") y el usuario confirma o corrige. Sin inspiración confirmada
   no hay página `/decants/` (ver Edge cases).

Si el usuario ya pasó algún dato en el mensaje, no preguntarlo de nuevo.

## Pasos

1. **Parsear el link.** De la URL sacar:
   - marca: segmento antes del nombre del perfume (ej. `Maison-Alhambra` → `Maison Alhambra`)
   - slug: nombre del perfume en minúsculas sin el número final (ej. `Baroque-Rouge-540-89849` → `baroque-rouge-540`, `Your-Touch-93816` → `your-touch`)
   - id: el número final del segmento del perfume (ej. `93816`). Si la URL no trae número, extraerlo del HTML (referencias `perfume-thumbs/<id>.avif` o la meta `og:image`).

2. **Traer la página con `webfetch`** en formato `html` (fragrantica.es bloquea
   request directos por Cloudflare; `webfetch` sí funciona; guardar el output en
   tool-output para poder hacer `Select-String`). Extraer:
   - nombre y marca tal cual figuran
   - familias olfativas (para `olfactoryFamily` en español, estilo `"Cítrico Dulce Amaderado"`)
   - notas de salida/corazón/fondo (traducidas al español, con mayúscula inicial, ej. `"Flor de Azahar"`, `"Vainilla Bourbon"`)
   - el "inspirado en": Fragrantica indica el perfume original (ej. "Herod de Parfums de Marly") → va al inicio de la `description` y a `inspiraciones.ts` (paso 5)
   - si la página no se obtiene, reintentar; si falla igual, avisar al usuario y pedir el dato que falte.

3. **Descargar la foto.** Variante fondo claro (blanca), que es la que usa el sitio:
   `https://fimgs.net/mdimg/perfume-thumbs/375x500.<id>.avif`
   → guardar como `public/images/perfumes/<slug>.avif` con `Invoke-WebRequest`
   (fimgs.net NO tiene Cloudflare). Verificar que el archivo arranque con el
   header `ftypavif` (bytes 4..11). Después **recortar los bordes blancos**
   (las fotos de Fragrantica traen márgenes dispares y el frasco se ve chico
   al lado de los otros):
   `node -e "require('sharp')('public/images/perfumes/<slug>.avif').trim({threshold:15}).avif({quality:70,effort:4}).toFile('public/images/perfumes/<slug>.avif')"`
   La presentación en el sitio (fondo blanco, imagen centrada) la maneja el
   CSS de `ProductCard.astro` y `ImageGallery.astro`; no hace falta tocarlo.

4. **Agregar la entrada en `src/data/perfumes.json`.** Editar con la tool `edit`
   (NUNCA con PowerShell, para no romper acentos/UTF-8; el archivo es UTF-8 sin
   BOM, indentación 2 espacios). Seguir la estructura y orden de las entradas
   existentes:

   ```json
   {
     "id": "<slug>",
     "slug": "<slug>",
     "brand": "<marca>",
     "name": "<nombre>",
     "gender": "<genero del usuario>",
     "olfactoryFamily": "<familias en español>",
     "description": "Inspirado en <original> de <casa>.<descripción corta en español, 1-2 frases con las notas clave y para qué momento>",
     "notes": {
       "top": ["..."],
       "heart": ["..."],
       "base": ["..."]
     },
     "images": [
       { "src": "images/perfumes/<slug>.avif", "alt": "<Brand> <Name>" }
     ],
     "sizes": [
       { "ml": 5, "price": <precio>, "stock": 10 }
     ],
     "isBoutiqueExclusive": false,
     "featured": false
   }
   ```

   Si el usuario dio precio del frasco original, agregar `"originalPrice": <precio>`
   (anclaje "cuesta aproximadamente" en la ficha). Chequear que `slug`/`id` no
   exista ya; si existe, es una actualización, no un duplicado.

5. **Sumarlo a inspiradas.** En `src/data/inspiraciones.ts`, agregar una entrada
   (esto genera la página `/decants/<slug>/` y el link "Ver inspiración" en el
   resultado del quiz):

   ```ts
   {
     perfumeSlug: '<slug>',
     perfumeBrand: '<marca>',
     perfumeName: '<nombre>',
     original: '<original>',
     casa: '<casa>',
     slug: '<original-en-minusculas-con-guiones>',
     familia: '<olfactoryFamily exacto de perfumes.json>',
   },
   ```

   El `slug` de la inspiración debe ser único (ej. `tygar-bvlgari`, `acqua-di-gioia`).
   Si el perfume es original sin inspiración (ej. `hawas-fire`, `oud-lail-maleki`,
   `rouat-ajial`), NO lleva entrada a propósito: no hay página `/decants/` para
   ellos y el quiz simplemente omite ese link.

6. **Sumarlo al quiz.** En `src/utils/quiz.ts`, agregar una línea en el objeto
   `PROFILES` keyed por `perfume.id`, siguiendo el criterio de los perfiles ya
   curados (comentario de arriba del objeto). Inferir de notas/familia/descripción:
   - `styles`: mapear notas clave con `STYLE_KEYWORDS` (cítrico → `citrico-fresco`,
     rosa/jazmín → `floral`, vainilla/tonka/coco → `dulce-vainilla`, ámbar/azafrán/canela → `ambarado-especiado`,
     sándalo/cedro/oud → `amaderado`, tabaco/cuero/ron → `tabaco-cuero`, piña/mango/durazno → `frutal`)
   - `occasions`: carácter (dulce/cremoso de noche → `noche`; fresco/atemporal → `trabajo`/`todo-el-dia`; opulento/exclusivo → `especiales`)
   - `intensity`: por las palabras del texto (`potente`/`estela`/`duracion` → `intensa`; `sutil`/`suave` → `sutil`; si no → `notoria`)
   - `weather`: clima que combina (`calor` si es cítrico/acuático/tropical; `frio` si es ámbar/vainilla/especiado/oud; `todo-el-ano` si es neutro)
   Al final, decirle al usuario qué perfil se asignó para que pueda ajustarlo.

7. **Lo que ya es automático (NO tocar, solo verificar).**
   - **Familias** (`src/data/familias.ts`): se derivan de `perfumes.json`.
   - **Notas** (`src/data/notas.ts`): `perfumesConNota` matchea por keywords.
   - **Azar de la home** (`src/utils/home-random.ts`): el pool sale del catálogo con stock.
   - **Podría interesarte** (`src/utils/related.ts`): ranking por familia/notas/género/stock.
   - Verificación con script o tests: el perfume nuevo debe aparecer en su familia,
     en sus notas y con perfil de quiz.

8. **Invalidar caché.** Incrementar `dataVersion` en `src/site.config.ts` (`'12'` → `'13'`,
   etc.) y anotar el motivo en el comentario de al lado. Sin esto, los visitantes
   con el catálogo cacheado en localStorage no ven el perfume nuevo (y un talle
   nuevo les falla al agregar al carrito).

9. **Verificar y deployar.**
   - En cada comando bash, refrescar PATH:
     `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
   - `npm test` (unit), `npm run lint` (astro check), `npm run build` (og + páginas, el
     conteo sube con cada perfume/inspiración nueva).
     No es obligatorio correr e2e; si se corre: matar node en 4321 antes y usar
     `npx playwright test --project=chromium --project=mobile-chrome`.
   - Commit + push a `main` (deploy automático por GitHub Actions). Mensaje:
     `content: agregado <Name> (<Brand>)`. Seguir el deploy con
     `gh run watch <databaseId> --exit-status --interval 5`.

10. **Reportar el resultado:** perfume, marca, género, precio, stock (10/en stock),
    id de Fragrantica, inspiración + slug de `/decants/`, anclaje de precio si lo hay,
    y el perfil de quiz asignado.

## Edge cases

- **Sin página Fragrantica** (como `rouat-ajial`): no se puede extraer nada;
  preguntar al usuario por la imagen y completar los datos a mano.
- **Foto que no baja** (o header inválido): avisar y probar la variante `dark-375x500.<id>.avif`
  o pedir la imagen al usuario.
- **Slug existente**: actualizar la entrada en vez de duplicarla.
- **Acordes/notas**: traducir los nombres al español con la grafía del resto del catálogo.
- **El usuario después quiere vender el frasco cerrado**: deriva al skill `add-frasco`
  (solo pide precio y ml; el decant 5ml queda intacto).
