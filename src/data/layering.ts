/**
 * Combinaciones de layering curadas a mano (auditoría + investigación).
 *
 * Cada combo tiene un ANCLA (la fragancia más densa, va primero y en mayor
 * proporción) y un ACENTO (la más liviana, va arriba). Los slugs apuntan a
 * `perfumes.json`: nombres, precios y stock se leen de ahí, no se duplican acá.
 *
 * Criterio de curación: nota puente compartida + roles complementarios +
 * disponibilidad en stock. No es una regla química: es un punto de partida
 * (ver la sección "qué evitar" de la página).
 */
export interface LayeringCombo {
  /** id estable para anclas (#combo-slug) */
  slug: string;
  /** perfume que va primero: el más denso */
  anchorSlug: string;
  /** perfume que va arriba: el más liviano */
  accentSlug: string;
  title: string;
  /** por qué funciona, en criollo y sin promesas exageradas */
  why: string;
  ratio: string;
  occasion: string;
  season: string;
}

export const layeringCombos: LayeringCombo[] = [
  {
    slug: 'fresco-sobre-madera',
    anchorSlug: 'odyssey-mega-man',
    accentSlug: 'yeah',
    title: 'Fresco sobre madera',
    why: 'El amaderado le da cuerpo al frutal cítrico y lo hace durar; el frutal le saca el peso de oficina. Es el combo más seguro para arrancar.',
    ratio: '2 sprays del amaderado abajo + 1 del frutal arriba',
    occasion: 'Día a día, oficina',
    season: 'Todo el año',
  },
  {
    slug: 'limpio-con-caracter',
    anchorSlug: 'reflection',
    accentSlug: 'hayaati-gold-elixir',
    title: 'Limpio con carácter',
    why: 'El almizcle floral limpia el dulzor de cuero y azafrán. Queda un aroma prolijo de día, con un fondo cálido que se nota de cerca.',
    ratio: '2 sprays del almizcle + 1 del dulce especiado',
    occasion: 'Trabajo, salidas tempranas',
    season: 'Otoño y primavera',
  },
  {
    slug: 'dulce-con-filo',
    anchorSlug: 'angham',
    accentSlug: 'hawas-tropical',
    title: 'Dulce con filo',
    why: 'El verde mentolado corta el azúcar de la vainilla y la vuelve usable de día. Si te gustan los gourmands pero te empalagan, empezá por acá.',
    ratio: '2 sprays de la vainilla + 1 del verde',
    occasion: 'Tarde, salidas informales',
    season: 'Primavera y verano',
  },
  {
    slug: 'oud-luminoso',
    anchorSlug: 'ameer-al-oudh',
    accentSlug: 'mayar',
    title: 'Oud luminoso',
    why: 'El oud ahumado se domestica con el floral frutal: queda oscuro pero con luz. La combinación árabe clásica, en dosis chica.',
    ratio: '3 sprays del oud + 1 del floral',
    occasion: 'Noche, ocasiones especiales',
    season: 'Otoño e invierno',
  },
  {
    slug: 'femenino-en-capas',
    anchorSlug: 'emaan',
    accentSlug: 'l-intrude',
    title: 'Femenino en capas',
    why: 'Dos florales que comparten azahar y bergamota: uno más chipre y otro más limpio. Se leen como un solo perfume más redondo.',
    ratio: '1 spray de cada uno, sobre crema neutra',
    occasion: 'Todo el día',
    season: 'Primavera y verano',
  },
  {
    slug: 'dulce-de-invierno',
    anchorSlug: 'the-kingdom-for-women',
    accentSlug: 'mayar',
    title: 'Dulce de invierno',
    why: 'Praliné y vainilla abajo, frutal arriba: el dulce se vuelve más aireado y menos pesado en ambientes cerrados.',
    ratio: '2 sprays del gourmand + 1 del frutal',
    occasion: 'Salidas de noche',
    season: 'Otoño e invierno',
  },
  {
    slug: 'subi-el-volumen',
    anchorSlug: 'salvo',
    accentSlug: 'salvo-intense',
    title: 'Subí el volumen',
    why: 'Son el mismo ADN en dos intensidades: el oriental fougère abajo y el aromático arriba estiran la estela sin cambiar el aroma. Ideal para probar qué tan fuerte te gusta.',
    ratio: '1 spray de cada uno',
    occasion: 'Día largo, después del trabajo',
    season: 'Todo el año',
  },
  {
    slug: 'noche-de-cuero',
    anchorSlug: 'asad-elixir',
    accentSlug: 'yara',
    title: 'Noche de cuero',
    why: 'Cuero e incienso con una vainilla floral arriba: contraste dulce y ahumado, de los que se recuerdan. Ojo con la dosis: los dos son potentes.',
    ratio: '2 sprays del cuero + 1 de la vainilla',
    occasion: 'Noche, invierno',
    season: 'Otoño e invierno',
  },
];
