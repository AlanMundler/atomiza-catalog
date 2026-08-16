import type { Perfume } from '@/data/types';

export type Gender = 'para-el' | 'para-ella' | 'indistinto';
export type Style =
  | 'citrico-fresco'
  | 'floral'
  | 'dulce-vainilla'
  | 'ambarado-especiado'
  | 'amaderado'
  | 'tabaco-cuero'
  | 'frutal';
export type Occasion = 'trabajo' | 'noche' | 'especiales' | 'todo-el-dia';
export type Intensity = 'sutil' | 'notoria' | 'intensa';
export type Weather = 'calor' | 'frio' | 'todo-el-ano';

export interface QuizAnswers {
  gender: Gender;
  style: Style;
  occasion: Occasion;
  intensity: Intensity;
  weather: Weather;
}

export interface QuizOption {
  value: string;
  label: string;
  hint?: string;
}

export interface QuizQuestion {
  id: keyof QuizAnswers;
  title: string;
  options: QuizOption[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'gender',
    title: '¿Para quién es el perfume?',
    options: [
      { value: 'para-el', label: 'Para él', hint: 'Masculino o unisex' },
      { value: 'para-ella', label: 'Para ella', hint: 'Femenino o unisex' },
      { value: 'indistinto', label: 'Me da igual', hint: 'Mostrame lo que haya' },
    ],
  },
  {
    id: 'style',
    title: '¿Qué familia de aromas te llama más?',
    options: [
      { value: 'citrico-fresco', label: 'Cítrico y fresco', hint: 'Veraniego, para el día' },
      { value: 'floral', label: 'Floral', hint: 'Rosa, jazmín, peonía' },
      { value: 'dulce-vainilla', label: 'Dulce y gourmand', hint: 'Vainilla, praliné, coco' },
      { value: 'ambarado-especiado', label: 'Ámbar y especiado', hint: 'Canela, cardamomo, resinas' },
      { value: 'amaderado', label: 'Amaderado', hint: 'Sándalo, cedro, oud' },
      { value: 'tabaco-cuero', label: 'Tabaco y cuero', hint: 'Ahumado, con carácter' },
      { value: 'frutal', label: 'Frutal y tropical', hint: 'Piña, mango, durazno' },
    ],
  },
  {
    id: 'occasion',
    title: '¿Cuándo lo vas a usar?',
    options: [
      { value: 'trabajo', label: 'Trabajo o diario' },
      { value: 'noche', label: 'Salidas de noche' },
      { value: 'especiales', label: 'Ocasiones especiales' },
      { value: 'todo-el-dia', label: 'Todo el día' },
    ],
  },
  {
    id: 'intensity',
    title: '¿Cómo preferís la estela?',
    options: [
      { value: 'sutil', label: 'Sutil', hint: 'Cerca de la piel' },
      { value: 'notoria', label: 'Notoria', hint: 'Que se note' },
      { value: 'intensa', label: 'Intensa', hint: 'Que llame la atención' },
    ],
  },
  {
    id: 'weather',
    title: '¿En qué clima lo vas a usar más?',
    options: [
      { value: 'calor', label: 'Calor', hint: 'Primavera y verano' },
      { value: 'frio', label: 'Frío', hint: 'Otoño e invierno' },
      { value: 'todo-el-ano', label: 'Todo el año' },
    ],
  },
];

interface PerfumeProfile {
  styles: Style[];
  occasions: Occasion[];
  intensity: Intensity;
  weather: Weather[];
}

// Perfiles curados leyendo la familia, las notas y la descripcion de cada
// perfume en perfumes.json. Los perfumes nuevos que no esten aca caen al
// scorer por keywords (abajo).
const PROFILES: Record<string, PerfumeProfile> = {
  'luminous-sahara': { styles: ['dulce-vainilla', 'ambarado-especiado'], occasions: ['noche', 'todo-el-dia'], intensity: 'notoria', weather: ['frio'] },
  hercules: { styles: ['tabaco-cuero', 'ambarado-especiado'], occasions: ['noche', 'especiales'], intensity: 'intensa', weather: ['frio'] },
  'dark-door-sport': { styles: ['citrico-fresco'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'sutil', weather: ['calor'] },
  'jorge-di-profumo': { styles: ['citrico-fresco', 'ambarado-especiado'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['todo-el-ano'] },
  'your-touch': { styles: ['dulce-vainilla', 'ambarado-especiado'], occasions: ['noche', 'todo-el-dia'], intensity: 'notoria', weather: ['frio'] },
  'glacier-ultra': { styles: ['dulce-vainilla', 'ambarado-especiado'], occasions: ['noche'], intensity: 'intensa', weather: ['frio'] },
  'perseus-exclusif': { styles: ['dulce-vainilla', 'amaderado'], occasions: ['noche', 'especiales'], intensity: 'notoria', weather: ['frio'] },
  'tonic-malt': { styles: ['ambarado-especiado', 'dulce-vainilla'], occasions: ['noche', 'todo-el-dia'], intensity: 'intensa', weather: ['frio'] },
  'salvo-intense': { styles: ['citrico-fresco', 'ambarado-especiado'], occasions: ['trabajo', 'todo-el-dia', 'noche'], intensity: 'intensa', weather: ['todo-el-ano'] },
  'glacier-bold': { styles: ['dulce-vainilla', 'frutal'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  'your-touch-intense': { styles: ['dulce-vainilla'], occasions: ['noche'], intensity: 'intensa', weather: ['frio'] },
  yeah: { styles: ['citrico-fresco', 'frutal'], occasions: ['trabajo', 'todo-el-dia', 'noche'], intensity: 'notoria', weather: ['todo-el-ano'] },
  'rouat-ajial': { styles: ['ambarado-especiado', 'amaderado'], occasions: ['todo-el-dia', 'noche'], intensity: 'intensa', weather: ['todo-el-ano'] },
  'now-rave': { styles: ['frutal', 'citrico-fresco'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  'qaed-al-fursan-untamed': { styles: ['ambarado-especiado', 'dulce-vainilla'], occasions: ['noche'], intensity: 'intensa', weather: ['frio'] },
  '24-carat-white-gold': { styles: ['citrico-fresco', 'amaderado'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  'hayaati-black': { styles: ['frutal', 'dulce-vainilla'], occasions: ['todo-el-dia', 'noche'], intensity: 'notoria', weather: ['todo-el-ano'] },
  'hayaati-al-maleky': { styles: ['ambarado-especiado'], occasions: ['noche'], intensity: 'intensa', weather: ['frio'] },
  'opulent-dubai': { styles: ['frutal', 'citrico-fresco'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'intensa', weather: ['calor'] },
  'hawas-ice': { styles: ['frutal', 'citrico-fresco'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  'hawas-black': { styles: ['frutal', 'citrico-fresco'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  'ameer-al-oudh': { styles: ['dulce-vainilla', 'amaderado', 'tabaco-cuero'], occasions: ['noche', 'especiales'], intensity: 'intensa', weather: ['frio'] },
  liam: { styles: ['amaderado', 'ambarado-especiado'], occasions: ['todo-el-dia', 'noche', 'especiales'], intensity: 'notoria', weather: ['todo-el-ano'] },
  'baroque-rouge-540': { styles: ['floral', 'ambarado-especiado'], occasions: ['noche', 'especiales'], intensity: 'intensa', weather: ['frio'] },
  'glacier-bella': { styles: ['dulce-vainilla', 'frutal'], occasions: ['todo-el-dia', 'noche'], intensity: 'notoria', weather: ['frio'] },
  delilah: { styles: ['floral', 'frutal'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  mayar: { styles: ['floral', 'frutal'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  angham: { styles: ['dulce-vainilla', 'ambarado-especiado'], occasions: ['todo-el-dia', 'noche'], intensity: 'notoria', weather: ['frio'] },
  'badee-al-oud-sublime': { styles: ['frutal', 'floral'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'notoria', weather: ['calor'] },
  'hayaati-florence': { styles: ['floral', 'citrico-fresco', 'dulce-vainilla'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'sutil', weather: ['calor'] },
  'confidential-private-gold': { styles: ['frutal', 'dulce-vainilla'], occasions: ['trabajo', 'todo-el-dia'], intensity: 'intensa', weather: ['calor'] },
  'oud-lail-maleki': { styles: ['dulce-vainilla', 'ambarado-especiado', 'floral'], occasions: ['noche', 'especiales'], intensity: 'intensa', weather: ['frio'] },
};

const STYLE_KEYWORDS: Record<Style, string[]> = {
  'citrico-fresco': ['citrico', 'bergamota', 'limon', 'lima', 'pomelo', 'toronja', 'menta', 'jengibre', 'fresco', 'acuatico', 'aromatico', 'verde', 'marino', 'ozonico', 'eucalipto'],
  floral: ['floral', 'rosa', 'jazmin', 'peonia', 'iris', 'ylang', 'gardenia', 'narciso', 'violeta', 'lila', 'muguete', 'tuberosa', 'azahar', 'orquidea', 'flor'],
  'dulce-vainilla': ['vainilla', 'caramelo', 'praline', 'almendra', 'azucar', 'miel', 'tonka', 'dulce', 'coco', 'tofe', 'cremoso', 'gourmand', 'avainillad', 'atalcad', 'acaramelad', 'benjui', 'cacao'],
  'ambarado-especiado': ['ambar', 'azafran', 'canela', 'cardamomo', 'pimienta', 'incienso', 'especiado', 'clavo', 'especia', 'nuez', 'ladano', 'calido', 'resina', 'elemi', 'ambarino'],
  amaderado: ['cedro', 'sandal', 'vetiver', 'oud', 'pachuli', 'gaiac', 'madera', 'maderas', 'maderoso', 'mirra', 'abedul', 'musgo', 'ambar gris', 'sahumerio'],
  'tabaco-cuero': ['tabaco', 'cuero', 'ron', 'whisky', 'balsamico', 'ahumad', 'ladano'],
  frutal: ['frutal', 'pina', 'mango', 'durazno', 'pera', 'lichi', 'frambuesa', 'manzana', 'ciruela', 'tropical', 'maracuya', 'grosella', 'casis', 'frutas', 'sandia', 'dulce', 'radiante', 'vibrante', 'coco'],
};

const OCCASION_KEYWORDS: Partial<Record<Occasion, string[]>> = {
  trabajo: ['fresco', 'aromatico', 'limpieza', 'limpio', 'verde', 'sutil', 'atemporal', 'versatil', 'elegante', 'cotidiano', 'diario', 'suave'],
  noche: ['noche', 'potente', 'seductor', 'intenso', 'poderoso', 'adictivo', 'opulento', 'proyeccion', 'magnetico', 'envolvente', 'profundo', 'calido'],
  especiales: ['opulento', 'exclusivo', 'especial', 'elegante', 'lujoso', 'lujo', 'atemporal'],
  'todo-el-dia': ['todo el dia', 'dia a dia', 'diario', 'versatil', 'atemporal'],
};

const INTENSITY_KEYWORDS: Record<Intensity, string[]> = {
  sutil: ['sutil', 'suave', 'ligero', 'delicado', 'tenue', 'limpieza', 'limpio'],
  notoria: ['equilibrado', 'medio', 'moderado'],
  intensa: ['intenso', 'potente', 'poderoso', 'estela', 'duracion', 'proyeccion', 'vibrante', 'magnetico', 'adictivo', 'rendimiento', 'radiante', 'envolvente', 'gran'],
};

const WEATHER_KEYWORDS: Partial<Record<Weather, string[]>> = {
  calor: ['fresco', 'citrico', 'acuatico', 'tropical', 'veraniego', 'luminoso', 'verde', 'marino', 'frutal', 'primavera', 'verano'],
  frio: ['calido', 'ambar', 'especiado', 'cuero', 'tabaco', 'oud', 'incienso', 'dulce', 'ahumad', 'invernal', 'cremoso', 'profundo', 'opulento', 'invierno', 'otono'],
  'todo-el-ano': ['todo el ano', 'cualquier estacion', 'todo terreno', 'versatil', 'atemporal'],
};

const STYLE_WEIGHT = 4;
const OCCASION_WEIGHT = 2;
const INTENSITY_WEIGHT = 2;
const WEATHER_WEIGHT = 1;
const GENDER_WEIGHT = 1;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function countMatches(text: string, keywords: string[] | undefined): number {
  if (!keywords) return 0;
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) count += 1;
  }
  return count;
}

function primaryText(perfume: Perfume): string {
  return normalize(`${perfume.olfactoryFamily} ${perfume.description}`);
}

function notesText(perfume: Perfume): string {
  return normalize([...perfume.notes.top, ...perfume.notes.heart, ...perfume.notes.base].join(' '));
}

function primarySize(perfume: Perfume) {
  return perfume.sizes.find((size) => size.ml === 5) ?? perfume.sizes[0];
}

function genderMatches(perfume: Perfume, choice: Gender): boolean {
  if (choice === 'indistinto') return true;
  const target = choice === 'para-el' ? 'masculino' : 'femenino';
  return perfume.gender === target || perfume.gender === 'unisex';
}

function profileScore(perfume: Perfume, profile: PerfumeProfile, answers: QuizAnswers): number {
  let score = 0;
  for (const style of profile.styles) {
    if (style === answers.style) score += STYLE_WEIGHT;
  }
  for (const occasion of profile.occasions) {
    if (occasion === answers.occasion) score += OCCASION_WEIGHT;
  }
  if (profile.intensity === answers.intensity) score += INTENSITY_WEIGHT;
  for (const weather of profile.weather) {
    if (weather === answers.weather) score += WEATHER_WEIGHT;
  }
  const target = answers.gender === 'para-el' ? 'masculino' : 'femenino';
  if (answers.gender !== 'indistinto' && perfume.gender === target) score += GENDER_WEIGHT;
  return score;
}

// El estilo se puntúa también por las notas, pero con la mitad de peso que
// la familia y la descripción: que una nota contenga vainilla o coco no
// convierte al perfume en "dulce y avainillado". Ocasión, intensidad y clima
// solo miran familia + descripción.
function keywordScore(perfume: Perfume, answers: QuizAnswers): number {
  const primary = primaryText(perfume);
  const notes = notesText(perfume);
  return (
    countMatches(primary, STYLE_KEYWORDS[answers.style]) * STYLE_WEIGHT +
    countMatches(notes, STYLE_KEYWORDS[answers.style]) * Math.ceil(STYLE_WEIGHT / 2) +
    countMatches(primary, OCCASION_KEYWORDS[answers.occasion]) * OCCASION_WEIGHT +
    countMatches(primary, INTENSITY_KEYWORDS[answers.intensity]) * INTENSITY_WEIGHT +
    countMatches(primary, WEATHER_KEYWORDS[answers.weather]) * WEATHER_WEIGHT
  );
}

function score(perfume: Perfume, answers: QuizAnswers): number {
  const profile = PROFILES[perfume.id];
  return profile ? profileScore(perfume, profile, answers) : keywordScore(perfume, answers);
}

// Devuelve la unica recomendacion para las respuestas dadas.
export function recommendPerfumes(answers: QuizAnswers, perfumes: Perfume[]): Perfume[] {
  return perfumes
    .filter((perfume) => {
      const size = primarySize(perfume);
      if (!size || size.stock <= 0) return false;
      if (!genderMatches(perfume, answers.gender)) return false;
      return true;
    })
    .sort((a, b) => {
      const diff = score(b, answers) - score(a, answers);
      if (diff !== 0) return diff;
      if (Number(b.featured) !== Number(a.featured)) return Number(b.featured) - Number(a.featured);
      const priceDiff = primarySize(a)!.price - primarySize(b)!.price;
      if (priceDiff !== 0) return priceDiff;
      return a.name.localeCompare(b.name, 'es');
    })
    .slice(0, 1);
}

const STYLE_PHRASE: Record<Style, string> = {
  'citrico-fresco': 'algo cítrico y fresco',
  floral: 'algo floral',
  'dulce-vainilla': 'algo dulce y avainillado',
  'ambarado-especiado': 'algo ámbar y especiado',
  amaderado: 'algo amaderado',
  'tabaco-cuero': 'algo de tabaco y cuero',
  frutal: 'algo frutal y vibrante',
};

const OCCASION_PHRASE: Record<Occasion, string> = {
  trabajo: 'para el día a día',
  noche: 'para salir de noche',
  especiales: 'para ocasiones especiales',
  'todo-el-dia': 'para usar a diario',
};

export function recommendationReason(answers: QuizAnswers): string {
  return `Elegimos este porque buscabas ${STYLE_PHRASE[answers.style]} ${OCCASION_PHRASE[answers.occasion]}.`;
}
