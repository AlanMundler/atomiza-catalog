/**
 * Combinaciones de layering curadas a mano (investigación + práctica).
 *
 * Cada combo tiene un ANCLA (la fragancia más densa, va primero y en mayor
 * proporción) y un ACENTO (la más liviana, va arriba). Los slugs apuntan a
 * `perfumes.json`: nombres, precios y stock se leen de ahí, no se duplican acá.
 *
 * Criterio de curación: nota puente compartida + roles complementarios +
 * disponibilidad en stock. `confidence` distingue lo que está respaldado por
 * la comunidad (alta) de lo que es razonamiento por familias y notas (media).
 * No es una regla química: es un punto de partida (ver "qué evitar").
 */
export type LayeringConfidence = 'alta' | 'media';

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
  /** respaldo: comunidad/fuentes vs razonamiento por familias y notas */
  confidence?: LayeringConfidence;
  /** de dónde sale la recomendación (para no vender humo) */
  source?: string;
}

export const layeringCombos: LayeringCombo[] = [
  // ——— Clásicos del stock (curaduría propia) ———
  {
    slug: 'fresco-sobre-madera',
    anchorSlug: 'odyssey-mega-man',
    accentSlug: 'yeah',
    title: 'Fresco sobre madera',
    why: 'El amaderado le da cuerpo al frutal cítrico y lo hace durar; el frutal le saca el peso de oficina. Es el combo más seguro para arrancar.',
    ratio: '2 sprays del amaderado abajo + 1 del frutal arriba',
    occasion: 'Día a día, oficina',
    season: 'Todo el año',
    confidence: 'alta',
    source: 'Curaduría propia sobre la matriz de familias',
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
    confidence: 'alta',
    source: 'Principio "musk lava cualquier dulce" (comunidad de perfumería árabe)',
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
    confidence: 'media',
    source: 'Razonamiento: gourmand + verde (matriz de familias)',
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
    confidence: 'alta',
    source: 'Canon cultural: oud + rosa/floral (Vogue Arabia, ELLE)',
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
    confidence: 'alta',
    source: 'Nota puente verificada (azahar + bergamota + nardos)',
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
    confidence: 'media',
    source: 'Razonamiento: gourmand + frutal (nota puente: pera/casis)',
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
    confidence: 'alta',
    source: 'Layering intra-línea (mismo ADN, distinta intensidad)',
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
    confidence: 'alta',
    source: 'Contraste clásico cuero + vainilla (matriz + comunidad)',
  },

  // ——— Investigación 2026: pares validados por la comunidad ———
  {
    slug: 'pina-sobre-cuero',
    anchorSlug: 'asad-elixir',
    accentSlug: 'qaed-al-fursan',
    title: 'Piña sobre cuero',
    why: 'El ácido frutal de la piña y el azafrán cortan la densidad balsámica del cuero e incienso. Ámbar en la base de ambos los une.',
    ratio: '2 sprays del cuero + 2 de la piña',
    occasion: 'Noche, cita',
    season: 'Otoño e invierno',
    confidence: 'alta',
    source: 'r/fragranceclones: "Asad + Qaed Al Fursan (piña)"',
  },
  {
    slug: 'rosa-con-filo',
    anchorSlug: 'bade-e-al-oud-amethyst',
    accentSlug: 'asad-elixir',
    title: 'Rosa con filo',
    why: 'El oud-rosa dulce abajo y el cuero especiado arriba: la rosa desinfla el cuero y el cuero impide que la rosa empalague. Pachulí en ambos es la costura.',
    ratio: '2 sprays de la rosa + 1 del cuero',
    occasion: 'Noche, ocasión formal',
    season: 'Invierno',
    confidence: 'alta',
    source: 'r/fragranceclones: "Amethyst + Asad" (47 pts)',
  },
  {
    slug: 'fuego-avainillado',
    anchorSlug: 'ameer-al-oudh',
    accentSlug: '9pm',
    title: 'Fuego avainillado',
    why: 'Oud ahumado con azúcar abajo y manzana-canela-lavanda arriba: la lavanda del 9PM suaviza el humo y comparten vainilla y sándalo en la base.',
    ratio: '2 sprays del oud + 2 del 9PM',
    occasion: 'Noche, salidas',
    season: 'Invierno',
    confidence: 'alta',
    source: 'r/fragranceclones: "9PM + Ameer Al Oudh is amazing"',
  },
  {
    slug: 'ambar-citrico',
    anchorSlug: 'baroque-rouge-540',
    accentSlug: '24-carat-white-gold',
    title: 'Ámbar cítrico',
    why: 'El azafrán y la cachemira densos de abajo se ventilan con bergamota, azahar y lavanda arriba. El oud del White Gold dialoga con el ámbar del BR540.',
    ratio: '2 sprays del ámbar + 2 del cítrico',
    occasion: 'Día elegante, oficina premium',
    season: 'Otoño y primavera',
    confidence: 'alta',
    source: 'r/desifemfrag: "Light Blue + BR540"; White Gold es nuestro Light Blue',
  },
  {
    slug: 'coco-ahumado',
    anchorSlug: 'glacier-bold',
    accentSlug: 'ameer-al-oudh',
    title: 'Coco ahumado',
    why: 'El coco y el haba tonka tropicales abajo necesitan el oud azucarado de arriba: le da peso y oscuridad a lo que solo es etéreo. Puente: tonka y azúcar.',
    ratio: '2 sprays del coco + 1 del oud',
    occasion: 'Noche, playa, verano',
    season: 'Primavera y verano',
    confidence: 'alta',
    source: 'Le Beau + By the Fireplace (Le Beau = Glacier Bold)',
  },
  {
    slug: 'pina-y-azafran',
    anchorSlug: 'now-rave',
    accentSlug: 'baroque-rouge-540',
    title: 'Piña y azafrán',
    why: 'El ahumado frutal del Aventus-like y el dulzor ambarado del BR540 comparten almizcle y ámbar: el azafrán le aporta luminosidad al musgo.',
    ratio: '2 sprays de la piña + 1 del ámbar',
    occasion: 'Cita, noche',
    season: 'Otoño e invierno',
    confidence: 'alta',
    source: 'r/fragrance: "Layering Aventus with BR540 works so well"',
  },
  {
    slug: 'azahar-con-pera',
    anchorSlug: 'tonic-malt',
    accentSlug: 'glacier-bella',
    title: 'Azahar con pera',
    why: 'El cacao y el benjuí del elixir aromático quedan más suaves con la pera y la vainilla de arriba. Vainilla y haba tonka son el pegamento.',
    ratio: '2 sprays del cacao + 1 de la pera',
    occasion: 'Noche, invierno',
    season: 'Otoño e invierno',
    confidence: 'media',
    source: 'Razonamiento: fougère + pera avainillada (Le Male Elixir + La Belle)',
  },
  {
    slug: 'almendra-y-ruibarbo',
    anchorSlug: 'luminous-sahara',
    accentSlug: 'delilah',
    title: 'Almendra y ruibarbo',
    why: 'Praliné y almendras acarameladas abajo, con la acidez de ruibarbo y lichi arriba: el ruibarbo corta el dulzor sin matar la cremosidad.',
    ratio: '2 sprays de las almendras + 1 del ruibarbo',
    occasion: 'Día especial, tarde',
    season: 'Primavera',
    confidence: 'alta',
    source: 'Principio Erba Pura/Althaïr + frutal (Delina ≈ Delilah)',
  },
  {
    slug: 'tabaco-tropical',
    anchorSlug: 'hercules',
    accentSlug: 'opulent-dubai',
    title: 'Tabaco tropical',
    why: 'Tabaco, incienso y ládano oscuros abajo con mango y jengibre luminosos arriba: la fruta tropical levanta el tabaco sin edulcorarlo.',
    ratio: '2 sprays del tabaco + 1 del mango',
    occasion: 'Noche, verano',
    season: 'Primavera y verano',
    confidence: 'media',
    source: 'Razonamiento: Herod + frutal tropical (Fragrantica)',
  },
  {
    slug: 'fruta-doble',
    anchorSlug: 'confidential-private-gold',
    accentSlug: 'philos-pura',
    title: 'Fruta doble',
    why: 'Durazno y maracuyá cremosos abajo, naranja y cítricos arriba: el mismo ADN Erba Pura, uno más redondo y otro más chispeante. Puente: almizcle y vainilla.',
    ratio: '2 sprays del durazno + 1 del cítrico',
    occasion: 'Día, verano',
    season: 'Primavera y verano',
    confidence: 'alta',
    source: 'Ambos Erba Pura-like; la comunidad los usa como amplificador frutal',
  },
  {
    slug: 'postre-en-capas',
    anchorSlug: 'the-kingdom-for-women',
    accentSlug: 'yara',
    title: 'Postre en capas',
    why: 'Praliné abajo y orquídea con frutas tropicales arriba: el praliné denso ancla la ligereza de Yara. Sándalo y vainilla en ambas bases.',
    ratio: '1 spray del praliné + 2 del Yara',
    occasion: 'Día goloso, tarde fría',
    season: 'Otoño e invierno',
    confidence: 'alta',
    source: 'willitlayer: "The Kingdom + Yara" 9.3/10',
  },
  {
    slug: 'canela-y-limon',
    anchorSlug: 'qaed-al-fursan-untamed',
    accentSlug: 'dark-door-sport',
    title: 'Canela y limón',
    why: 'Caramelo, canela e incienso abajo, limón y pomelo arriba: los cítricos cortan el caramelo y lo vuelven diurno sin quitarle el filo especiado.',
    ratio: '2 sprays del caramelo + 2 del cítrico',
    occasion: 'Día, primavera',
    season: 'Primavera',
    confidence: 'media',
    source: 'Razonamiento: dulce especiado + cítrico (comunidad árabe)',
  },
  {
    slug: 'miel-acuatica',
    anchorSlug: 'oud-lail-maleki',
    accentSlug: 'mayar-natural-intense',
    title: 'Miel acuática',
    why: 'Miel, caramelo y ámbar abajo con higo, agua de coco y jazmín arriba: lo verde marino ventila la opulencia dulce. Jazmín y sándalo en ambos.',
    ratio: '1 spray de la miel + 2 del acuático',
    occasion: 'Día cálido, tarde',
    season: 'Primavera y verano',
    confidence: 'media',
    source: 'Razonamiento: dulce + acuático (matriz de familias)',
  },
  {
    slug: 'te-y-cardamomo',
    anchorSlug: 'liam',
    accentSlug: 'hawas-kobra',
    title: 'Té y cardamomo',
    why: 'Cardamomo y té negro cremoso abajo, jengibre y té verde arriba: comparten un acorde de té que los une sin solaparse. Ámbar y almizcle en la base.',
    ratio: '2 sprays del té negro + 1 del té verde',
    occasion: 'Oficina, día elegante',
    season: 'Todo el año',
    confidence: 'alta',
    source: 'willitlayer: "Gris Charnel + fresh tea" 9.3',
  },
];
