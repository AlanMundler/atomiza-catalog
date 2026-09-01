export interface GuiaSection {
  heading: string;
  body: string[];
}

export interface GuiaFaq {
  question: string;
  answer: string;
}

export interface Guia {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  mins: number;
  intro: string;
  sections: GuiaSection[];
  faq: GuiaFaq[];
  related: { original: string; slug: string }[];
}

// Guías con keyword data: cada una caza una búsqueda real ("cuánto dura un
// decant", "perfume para regalar", "perfume para el calor") y enlaza a las
// landing "huele a X" y a WhatsApp.
export const guias: Guia[] = [
  {
    slug: 'cuanto-dura-un-decant-de-5ml',
    title: 'Cuánto dura un decant de 5ml',
    description:
      'Cuántos días rinde un decant de 5ml según cuántas aplicaciones saques. El cálculo real y cómo estirarlo sin desperdiciar.',
    category: 'Guía',
    date: '2026-09-01',
    mins: 4,
    intro:
      'La pregunta que surje antes de comprar un decant es si rinde. La respuesta corta: entre 30 y 45 días de uso diario. El número exacto depende de un solo dato, cuántas pulverizaciones le sacás a cada mililitro.',
    sections: [
      {
        heading: 'El cálculo: aplicaciones por mililitro',
        body: [
          'Un perfume se usa con 5 a 8 pulverizaciones por aplicación según la intensidad que quieras. Con 5ml tenés entre 40 y 60 aplicaciones en total. Si lo usás todos los días, son 40 a 60 días de fragancia.',
          'En la práctica la cuenta baja un poco: 30 a 45 días es el número honesto para uso diario, porque los primeros días de prueba uno suele reaplicarse más de la cuenta.',
        ],
      },
      {
        heading: 'Dónde aplicarlo para que rinda más',
        body: [
          'Aplicá en puntos de pulso: muñecas, cuello y detrás de las orejas. No te frotes las muñecas entre sí: ese gesto rompe la molécula del perfume y hace que dure menos horas.',
          'Sobre la piel recién hidratada o después de la ducha la fragancia se sostiene más horas que sobre la piel seca. Sobre la ropa dura bastante, aunque algunos aceites manchan las telas claras.',
        ],
      },
      {
        heading: 'Cuándo ir por el frasco completo',
        body: [
          'La idea del decant es probar antes de comprometerte con el frasco entero. Si a los 10 días seguís enganchado al aroma, ese es el momento del full size.',
          'En nuestra tienda de Córdoba, si te copó el decant, coordinás el frasco completo por WhatsApp. Probalo sin presión: para eso existe el formato chico.',
        ],
      },
    ],
    faq: [
      {
        question: '¿Cuántos días dura un decant de 5ml?',
        answer:
          'Entre 30 y 45 días de uso diario, según cuántas pulverizaciones le saques. El cálculo base: 5ml rinden entre 40 y 60 aplicaciones.',
      },
      {
        question: '¿Puedo probar varios decants antes de comprar el frasco?',
        answer:
          'Ese es el punto del decant. Pedí el que te llame la atención, probalo unos días y si te copa coordinás el frasco por WhatsApp. Todas las fragancias del catálogo vienen en decant de 5ml.',
      },
      {
        question: '¿Cuánto dura un perfume abierto?',
        answer:
          'Un decant de 5ml bien cerrado y lejos de la luz y el calor dura meses sin que el aroma se degrade. Como se consume en 30 a 45 días, nunca llega a estropearse.',
      },
    ],
    related: [],
  },
  {
    slug: 'que-perfume-regalarle-a-un-hombre',
    title: 'Qué perfume regalarle a un hombre',
    description:
      'Regalar perfume sin que le caiga feo se logra apuntando a notas seguras y regalando primero un decant de prueba.',
    category: 'Guía',
    date: '2026-09-01',
    mins: 5,
    intro:
      'Regalar perfume tiene un riesgo: si el aroma no le gusta, quedó un frasco sin uso y vos con la decepción. La salida no es adivinar mejor, es cambiar el formato: regalar la prueba antes que el veredicto.',
    sections: [
      {
        heading: 'Las 3 familias seguras para regalar a un hombre',
        body: [
          'Aromáticas (lavanda, notas frescas y amaderadas): lo más difícil de rechazar. Sauvage y Acqua di Giò Profumo entran acá.',
          'Oriental especiada (canela, vainilla, tabaco): si la persona ya usa perfume y le atraen los aromas densos, Stronger With You y Le Male Elixir van bien.',
          'Amaderada aromática (bergamota, pimienta, maderas): la zona intermedia, que funciona para casi cualquiera. Aventus y Gris Charnel son referencias claras.',
        ],
      },
      {
        heading: 'El truco: regalale el decant primero',
        body: [
          'En lugar de arriesgar el frasco completo, regalale 2 o 3 decants de 5ml de familias distintas. Como es una probadita, el regalo se vuelve experiencia y él elige el que más siente como propio.',
          'Después el frasco sale solo: ya sabés cuál lo hizo poner cara de enganchado. Es regalo a prueba de error.',
        ],
      },
      {
        heading: 'Regalar en Córdoba con entrega en mano',
        body: [
          'Coordinamos la entrega en mano dentro de Córdoba capital o el envío por Uber. Si el regalo es para alguien de la ciudad, te lo dejamos a vos o directo a esa persona con una dedicatoria.',
        ],
      },
    ],
    faq: [
      {
        question: '¿Qué perfume masculino regalo sin miedo?',
        answer:
          'Uno de familia aromática o amaderada aromática. Referencias seguras: Sauvage, Acqua di Giò Profumo o Aventus. Igual lo más seguro sigue siendo regalar primero un decant de prueba.',
      },
      {
        question: '¿Entregás el perfume directo a la persona?',
        answer:
          'Sí, coordinamos la entrega en mano o el envío por Uber dentro de Córdoba capital. Podés comprar vos y que lo reciba la otra persona.',
      },
      {
        question: '¿Cuánto cuesta regalar un decant?',
        answer:
          'Un decant de 5ml va desde $6.000. Dos o tres decants de familias distintas siguen saliendo mucho menos que un frasco lleno, y el acierto está casi garantizado.',
      },
    ],
    related: [
      { original: 'Sauvage', slug: 'sauvage-dior' },
      { original: 'Acqua di Giò Profumo', slug: 'acqua-di-gio-profumo' },
      { original: 'Stronger With You', slug: 'stronger-with-you' },
      { original: 'Aventus', slug: 'aventus-creed' },
    ],
  },
  {
    slug: 'perfumes-para-el-calor-de-cordoba',
    title: 'Perfumes que aguantan el calor de Córdoba',
    description:
      'El calor del verano cambia cómo se comporta un perfume. Qué notas elegir y cómo aplicarlas para que duren más horas.',
    category: 'Guía',
    date: '2026-09-01',
    mins: 4,
    intro:
      'Con 35 grados a la sombra, el perfume se comporta distinto: las notas dulces se vuelven pesadas, los frescos se evaporan rápido y algunos aromas se empachan. La elección de notas importa tanto como el frasco.',
    sections: [
      {
        heading: 'Qué notas bancan el calor',
        body: [
          'Las aromáticas frescas y cítricas son la apuesta del verano: bergamota, lavanda, notas marinas. En nuestras inspiraciones, Invictus y Invictus Aqua representan esa línea.',
          'Las amaderadas lavadas y las fougère frescas (lavanda con maderas livianas) también funcionan. Evitá los gourmand muy dulces y los oud pesados: con calor se vuelven invasivos.',
        ],
      },
      {
        heading: 'Cómo aplicarlo para que dure',
        body: [
          'En verano la piel suda y el perfume se evapora antes. Aplicá sobre piel limpia e hidratada, en puntos de pulso, y reponé con un mini decant a la tarde: por eso el formato chico es tan práctico.',
          'Guardalo lejos de la luz directa y el calor del auto: el sol y la temperatura alta degradan el aroma mucho más rápido que el uso normal.',
        ],
      },
      {
        heading: 'Probar antes de elegir',
        body: [
          'Cada piel reacciona distinto al calor: lo que en uno dura seis horas, en otro se va en dos. Probar en decant unos días es la manera de saber cómo se porta una fragancia en tu piel cordobesa antes de comprar el frasco.',
        ],
      },
    ],
    faq: [
      {
        question: '¿Qué perfume dura más con el calor?',
        answer:
          'Las fragancias amaderadas lavadas y las fougère frescas suelen rendir más en calor que las muy dulces o los oud pesados. Aplicar sobre piel hidratada y reponer a la tarde también suma horas.',
      },
      {
        question: '¿El calor arruina el perfume?',
        answer:
          'La exposición prolongada al sol y al calor degrada el aroma. Guardá los frascos y decants en un lugar fresco, sin luz directa.',
      },
    ],
    related: [
      { original: 'Invictus', slug: 'invictus-paco-rabanne' },
      { original: 'Invictus Aqua', slug: 'invictus-aqua' },
      { original: 'Dior Homme Sport', slug: 'dior-homme-sport' },
    ],
  },
  {
    slug: 'como-elegir-tu-primer-perfume-de-autor',
    title: 'Cómo elegir tu primer perfume árabe de autor',
    description:
      'Primera vez con perfumes árabes: cómo orientarte entre familias olfativas y qué decants pedir para descubrir tu estilo.',
    category: 'Guía',
    date: '2026-09-01',
    mins: 6,
    intro:
      'El mundo de los perfumes árabes es enorme y puede marear: cientos de casas, familias, notas y precios. Para la primera vez, lo inteligente no es comprar el primer frasco lindo en vidriera sino probar un puñado de direcciones distintas en decant.',
    sections: [
      {
        heading: 'Empezá por la familia, no por el nombre',
        body: [
          'Lo que define si un perfume te queda bien sos las notas, no la marca. Las familias principales son cinco: aromática, floral, oriental, amaderada y fougère. Cada una tiene un humor distinto.',
          'Para la primera compra elegí un decant de cada extremo: un fresquito (aromática), un dulce (oriental/vanilla) y un elegante (amaderada). Con tres probás el mapa completo de tus gustos.',
        ],
      },
      {
        heading: 'Las notas clave que conviene conocer',
        body: [
          'Vainilla: dulce, cálido, muy fácil de enganchar. Bergamota y cítricos: frescura que abre bien el día. Lavanda: limpio y clásico. Maderas y oud: profundo, con carácter, no para todos por eso se prueba en decant.',
          'Oud y tabaco no son para el primer día. Si te tiran, probalos en decant y con paciencia: son aromas que se aprenden.',
        ],
      },
      {
        heading: 'El plan de pruebas',
        body: [
          'Probalo en decant, en tu piel, un día entero. Aplicá en la muñeca por la mañana y viví las horas: cómo empieza, cómo evoluciona, cuánto dura. El olor en chapa (papel) es el perfume, el olor en tu piel es el tuyo.',
          'Anotá dos o tres impresiones por prueba. A la semana ya vas a tener una dirección clara y comprás el frasco con confianza.',
        ],
      },
    ],
    faq: [
      {
        question: '¿Estos perfumes son originales?',
        answer:
          'Sí, son fragancias árabes originales de casas como Maison Alhambra, Lattafa y Rasasi. Lo que compartimos en nuestra tienda es que varias están inspiradas en el ADN de perfumes de nicho famosos, y por eso las vendemos en decant.',
      },
      {
        question: '¿Cuál es el primer perfume árabe que conviene probar?',
        answer:
          'Los de familia aromática o oriental vainilla son los más fáciles de disfrutar al principio. Sauvage, Acqua di Giò Profumo y Stronger With You son buenas puertas de entrada.',
      },
    ],
    related: [
      { original: 'Baccarat Rouge 540', slug: 'baccarat-rouge-540' },
      { original: 'Delina', slug: 'delina' },
      { original: 'Stronger With You Intensely', slug: 'stronger-with-you-intensely' },
    ],
  },
];

/** Prefiero una fecha legible para la guía. */
export function formatGuiaDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}