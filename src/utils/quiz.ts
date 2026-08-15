import type { Perfume } from '@/data/types';

export interface QuizAnswers {
  gender: 'para-el' | 'para-ella' | 'indistinto';
  occasion: 'trabajo' | 'noche' | 'especiales' | 'todo-el-dia';
  style: 'citrico-fresco' | 'floral' | 'dulce-vainilla' | 'ambarado-especiado' | 'amaderado' | 'tabaco-cuero';
  intensity: 'sutil' | 'notoria' | 'intensa';
  weather: 'calor' | 'frio' | 'todo-el-ano';
  budget: 'hasta-6000' | 'mas-6000' | 'no-importa';
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
      { value: 'indistinto', label: 'Me da igual', hint: 'Cualquiera sirve' },
    ],
  },
  {
    id: 'style',
    title: '¿Qué estilo de aroma te atrae más?',
    options: [
      { value: 'citrico-fresco', label: 'Cítrico y fresco', hint: 'Energizante, veraniego' },
      { value: 'floral', label: 'Floral', hint: 'Delicado y romántico' },
      { value: 'dulce-vainilla', label: 'Dulce y gourmand', hint: 'Vainilla, caramelo' },
      { value: 'ambarado-especiado', label: 'Ámbar y especiado', hint: 'Cálido, envolvente' },
      { value: 'amaderado', label: 'Amaderado', hint: 'Sobrio y elegante' },
      { value: 'tabaco-cuero', label: 'Tabaco y cuero', hint: 'Oscuro e intenso' },
    ],
  },
  {
    id: 'occasion',
    title: '¿En qué ocasión lo vas a usar más?',
    options: [
      { value: 'trabajo', label: 'Trabajo o diario' },
      { value: 'noche', label: 'Salidas de noche' },
      { value: 'especiales', label: 'Ocasiones especiales' },
      { value: 'todo-el-dia', label: 'Todo el día' },
    ],
  },
  {
    id: 'intensity',
    title: '¿Qué intensidad de estela preferís?',
    options: [
      { value: 'sutil', label: 'Sutil', hint: 'Que no moleste' },
      { value: 'notoria', label: 'Notoria', hint: 'Se nota sin abrumar' },
      { value: 'intensa', label: 'Intensa', hint: 'Que deje huella' },
    ],
  },
  {
    id: 'weather',
    title: '¿En qué clima lo vas a usar?',
    options: [
      { value: 'calor', label: 'Calor', hint: 'Primavera y verano' },
      { value: 'frio', label: 'Frío', hint: 'Otoño e invierno' },
      { value: 'todo-el-ano', label: 'Todo el año' },
    ],
  },
  {
    id: 'budget',
    title: '¿Cuál es tu presupuesto?',
    options: [
      { value: 'hasta-6000', label: 'Hasta $6.000' },
      { value: 'mas-6000', label: 'Más de $6.000', hint: 'Puedo pagar más' },
      { value: 'no-importa', label: 'No importa' },
    ],
  },
];

const STYLE_KEYWORDS: Record<QuizAnswers['style'], string[]> = {
  'citrico-fresco': [
    'bergamota', 'limon', 'lima', 'pomelo', 'toronja', 'citrico', 'azahar', 'neroli',
    'menta', 'eucalipto', 'verde', 'fresco', 'acuatico', 'ozonico', 'marino', 'pera',
  ],
  floral: ['jazmin', 'rosa', 'azahar', 'peonia', 'iris', 'ylang', 'gardenia', 'floral', 'narciso', 'violeta', 'lila', 'muguet', 'tuberosa', 'flor'],
  'dulce-vainilla': [
    'vainilla', 'caramelo', 'praline', 'almendra', 'azucar', 'miel', 'tonka', 'dulce',
    'chocolate', 'coco', 'malvavisco', 'algodon', 'toffe', 'cremoso', 'gourmand',
  ],
  'ambarado-especiado': ['ambar', 'ambarino', 'azafran', 'canela', 'cardamomo', 'pimienta', 'incienso', 'especiado', 'benju', 'clavo', 'especias', 'nuez'],
  amaderado: ['cedro', 'sandal', 'vetiver', 'oud', 'oak', 'pachuli', 'gaiac', 'madera', 'maderas', 'maderoso', 'sahumerio', 'mirra', 'ambar gris'],
  'tabaco-cuero': ['tabaco', 'cuero', 'ron', 'whisky', 'balsamico', 'oscur'],
};

const OCCASION_KEYWORDS: Partial<Record<QuizAnswers['occasion'], string[]>> = {
  trabajo: ['citrico', 'fresco', 'limpio', 'verde', 'suave', 'sutil', 'algodon', 'lavanda', 'salvia', 'tenue', 'cotidiano'],
  noche: ['ambar', 'ambarino', 'especiado', 'cuero', 'tabaco', 'oud', 'azafran', 'vainilla', 'dulce', 'poderoso', 'nocturno', 'seductor', 'misterioso'],
  especiales: ['ambar', 'ambarino', 'especiado', 'cuero', 'tabaco', 'azafran', 'incienso', 'poderoso', 'lujoso', 'lujo', 'elegante', 'exclusivo', 'raro'],
};

const INTENSITY_KEYWORDS: Record<QuizAnswers['intensity'], string[]> = {
  sutil: ['sutil', 'suave', 'ligero', 'fresco', 'verde', 'limpio', 'sabonoso', 'delicado', 'tenue'],
  notoria: ['equilibrado', 'medio', 'moderado'],
  intensa: ['intenso', 'poderoso', 'estela', 'duradero', 'longevo', 'fuerte', 'vibrante', 'envolvente', 'abrumador', 'fijacion'],
};

const WEATHER_KEYWORDS: Partial<Record<QuizAnswers['weather'], string[]>> = {
  calor: ['citrico', 'fresco', 'acuatico', 'verde', 'floral', 'menta', 'ozonico', 'marino', 'luminoso', 'refrescante', 'veraniego'],
  frio: ['ambar', 'ambarino', 'vainilla', 'especiado', 'cuero', 'tabaco', 'oud', 'canela', 'incienso', 'dulce', 'madera', 'maderas', 'calido', 'invernal'],
};

const STYLE_WEIGHT = 3;

function matches(text: string, keywords: string[] | undefined): number {
  if (!keywords) return 0;
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) count += 1;
  }
  return count;
}

function perfumeText(perfume: Perfume): string {
  const notes = [...perfume.notes.top, ...perfume.notes.heart, ...perfume.notes.base];
  return `${perfume.olfactoryFamily} ${perfume.description} ${notes.join(' ')}`.toLowerCase();
}

function primarySize(perfume: Perfume) {
  return perfume.sizes.find((size) => size.ml === 5) ?? perfume.sizes[0];
}

function genderMatches(perfume: Perfume, choice: QuizAnswers['gender']): boolean {
  if (choice === 'indistinto') return true;
  const target = choice === 'para-el' ? 'masculino' : 'femenino';
  return perfume.gender === target || perfume.gender === 'unisex';
}

function score(perfume: Perfume, answers: QuizAnswers): number {
  const text = perfumeText(perfume);
  return (
    matches(text, STYLE_KEYWORDS[answers.style]) * STYLE_WEIGHT +
    matches(text, OCCASION_KEYWORDS[answers.occasion]) +
    matches(text, INTENSITY_KEYWORDS[answers.intensity]) +
    matches(text, WEATHER_KEYWORDS[answers.weather])
  );
}

// ponytail: mapeo por keywords heurístico. Si la precisión importa, migrar a
// campos estructurados (intensidad/ocasión/clima) en perfumes.json.
export function recommendPerfumes(answers: QuizAnswers, perfumes: Perfume[]): Perfume[] {
  return perfumes
    .filter((perfume) => {
      const size = primarySize(perfume);
      if (!size || size.stock <= 0) return false;
      if (!genderMatches(perfume, answers.gender)) return false;
      if (answers.budget === 'hasta-6000' && size.price > 6000) return false;
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
    .slice(0, 3);
}
