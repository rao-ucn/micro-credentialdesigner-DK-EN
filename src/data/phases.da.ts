import { Phase } from '@/types/course';

export const phasesDa: Phase[] = [
  {
    id: 'phase1',
    number: 1,
    title: 'Kursustype',
    items: [
      {
        id: '1.2',
        title: 'Vælg kursustype',
        fields: [
          {
            name: 'selectedCourseType',
            label: 'Valgt kursustype',
            type: 'select',
            required: false,
            options: ['standalone', 'micro-credential'],
            helpText: 'Den valgte kursustype for dette design',
          },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    title: 'Projektklassifikation og partnere',
    items: [
      {
        id: '2.1',
        title: 'Projektklassifikation',
        description: 'Definér klassifikationen af din aktivitet',
        fields: [
          {
            name: 'projectClassification',
            label: 'Projektklassifikation',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    title: 'Læringsmål og målgruppe',
    subPhases: [
      { id: '3a', label: 'Arbejdsmarkedets behov', itemIds: ['3.1'] },
      { id: '3b', label: 'Målgruppe', itemIds: ['3.4'] },
      { id: '3c', label: 'Læringsformål og -mål', itemIds: ['3.5'], metatext: 'Læringsformål og -mål definerer retningen og formålet med micro-credentialen. De tydeliggør, hvad den lærende forventes at opnå, og hvorfor disse formål er vigtige i forhold til det identificerede behov på arbejdsmarkedet. Dette tema understøtter udviklere i at formulere formål, der er sammenhængende, relevante og i overensstemmelse med de forventede læringsmål. Hvert punkt i dette tema guider udvikleren gennem en struktureret refleksionsproces, der sikrer, at valgene er gennemsigtige og forankret i dokumenterede behov.' },
      { id: '3d', label: 'Definér evaluering', itemIds: ['3.10'], mcOnly: true },
    ],
    items: [
      {
        id: '3.1',
        title: 'Arbejdsmarkedets behov',
        fields: [
          {
            name: 'marketNeedsData',
            label: 'Arbejdsmarkedets behov',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '3.4',
        title: 'Identificér primære lærende',
        fields: [
          {
            name: 'targetAudience',
            label: 'Målgruppe',
            type: 'textarea',
            required: true,
            helpText: 'Beskriv de primære lærende (demografi, baggrund, forudsætninger)',
          },
          {
            name: 'prerequisites',
            label: 'Forudsætninger',
            type: 'textarea',
            required: false,
          },
        ],
      },
      {
        id: '3.5',
        title: 'Tværfaglige eller tværsektorielle perspektiver',
        fields: [
          {
            name: 'interdisciplinaryData',
            label: 'Tværfaglige perspektiver',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '3.10',
        title: 'Definér evaluering',
        mcOnly: true,
        fields: [
          {
            name: 'defineAssessmentData',
            label: 'Definér evaluering',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    title: 'Indhold og læringsaktiviteter',
    subPhases: [
      { id: '4a', label: 'Emner og færdigheder', itemIds: ['4.1'] },
      { id: '4b', label: 'Constructive alignment', itemIds: ['4.3'] },
      { id: '4c', label: 'Multimodale læringsressourcer', itemIds: ['4.4'] },
      { id: '4d', label: 'Supplerende læringsovervejelser', itemIds: ['4.5'] },
      { id: '4e', label: 'Opfølgning på ordliste', itemIds: ['4.11'] },
    ],
    items: [
      {
        id: '4.1',
        title: 'Emner og temaer',
        fields: [
          {
            name: 'topicsData',
            label: 'Emner og temaer',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '4.3',
        title: 'Sikr constructive alignment',
        fields: [
          {
            name: 'alignmentStrategy',
            label: 'Strategi for constructive alignment',
            type: 'textarea',
            required: true,
            helpText: 'Hvordan stemmer læringsaktiviteter, evalueringer og læringsmål overens?',
          },
        ],
      },
      {
        id: '4.4',
        title: 'Brug multimodale læringsressourcer',
        fields: [
          {
            name: 'multimodalResources',
            label: 'Multimodale ressourcer',
            type: 'textarea',
            required: true,
            helpText: 'Angiv forskellige typer ressourcer: videoer, tekster, podcasts, simulationer osv.',
          },
        ],
      },
      {
        id: '4.5',
        title: 'Supplerende læringsovervejelser',
        fields: [
          {
            name: 'supplementaryData',
            label: 'Supplerende overvejelser',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '4.11',
        title: 'Sikr inklusion af ordliste',
        fields: [
          {
            name: 'glossaryIncluded',
            label: 'Ordliste inkluderet',
            type: 'checkbox',
            required: true,
          },
          {
            name: 'keyTerms',
            label: 'Nøglebegreber (eksempel)',
            type: 'textarea',
            required: false,
            helpText: 'Angiv vigtige begreber, der skal indgå i ordlisten',
          },
        ],
      },
    ],
  },
  {
    id: 'phase5',
    number: 5,
    title: 'Evalueringsdesign og læringsprocesser',
    subPhases: [
      { id: '5a', label: 'Udvikl læringsaktiviteter', itemIds: ['5.1'] },
      { id: '5b', label: 'Design evaluering', itemIds: ['5.5'], mcOnly: true },
    ],
    items: [
      {
        id: '5.1',
        title: 'Udvikl læringsaktiviteter',
        fields: [
          {
            name: 'learningActivitiesData',
            label: 'Læringsaktiviteter',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '5.5',
        title: 'Design evaluering',
        mcOnly: true,
        fields: [
          {
            name: 'designAssessmentData',
            label: 'Design evaluering',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
    ],
  },
  {
    id: 'phase6',
    number: 6,
    title: 'Levering, metadata og evaluering',
    subPhases: [
      { id: '6a', label: 'Tekniske krav og tilgængelighed', itemIds: ['6.1'] },
      { id: '6b', label: 'ECTS-metadata', itemIds: ['6.3'] },
      { id: '6c', label: 'EQF-metadata', itemIds: ['6.4'] },
      { id: '6d', label: 'Kvalitetssikring af metadata', itemIds: ['6.5'], metatext: 'Dette afsnit fokuserer på afsluttende kvalitetssikringsmetadata for micro-credentialen. Her bekræfter du centrale forhold, der understøtter gennemsigtighed, genbrug, anerkendelse og langsigtet bæredygtighed på tværs af alliancen. Oplysningerne, der indsamles, ændrer ikke det faglige design af micro-credentialen, men tydeliggør, hvordan den kan deles, forvaltes og forstås ud over den umiddelbare kursuskontekst.' },
      { id: '6e', label: 'Imødekommelse af de lærendes behov', itemIds: ['6.8'], metatext: 'Dette afsnit fokuserer på, hvordan de lærende forventes at arbejde med micro-credentialen i praksis. Formålet er at beskrive fleksibilitet, tempo og måder, hvorpå de lærende kan tilrettelægge deres læring i forhold til egne behov, begrænsninger og tidligere erfaring.\n\nDette er ikke en beskrivelse af, hvad micro-credentialen handler om, men af hvordan de lærende kan engagere sig i den.' },
      { id: '6f', label: 'Evalueringsplan', itemIds: ['6.10'], metatext: 'Dette trin fokuserer på, hvordan micro-credentialen vil blive gennemgået og kvalitetssikret over tid. Du bedes beskrive, hvordan levering af læring og indhold vil blive gennemgået, og hvordan evalueringspraksis vil blive kalibreret og overvåget.\n\nBegge tekstfelter nedenfor skal udfyldes, før du kan markere dette trin som fuldført.' },
    ],
    items: [
      {
        id: '6.1',
        title: 'Adressér tekniske krav og platformskompatibilitet',
        fields: [
          {
            name: 'technicalRequirements',
            label: 'Tekniske krav',
            type: 'textarea',
            required: true,
            helpText: 'Hardware, software, internethastighed osv.',
          },
          {
            name: 'platformsUsed',
            label: 'Læringsplatforme',
            type: 'text',
            required: true,
            helpText: 'LMS og andre platforme',
          },
        ],
      },
      {
        id: '6.2',
        title: 'Sikr at formatet understøtter tilgængelighed, engagement og skalerbarhed',
        fields: [],
      },
      {
        id: '6.3',
        title: 'Sikr at standalone-kurser har standardiserede metadata for ECTS-niveau',
        fields: [
          {
            name: 'ectsCredits',
            label: 'ECTS-point',
            type: 'ects',
            required: true,
            helpText: 'Skal være hele eller halve point (fx 1,0, 1,5, 2,0). Minimum 1,0 for MC.',
            validation: {
              min: 0,
              max: 60,
            },
          },
          {
            name: 'ectsJustification',
            label: 'ECTS-begrundelse',
            type: 'textarea',
            required: true,
            helpText: 'Forklar beregningen af arbejdsbyrde (1 ECTS = 25-30 timer)',
          },
        ],
      },
      {
        id: '6.4',
        title: 'Sikr at kurser har standardiserede metadata for EQF-niveau',
        fields: [
          {
            name: 'eqfLevelData',
            label: 'EQF-niveaudata',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '6.5',
        title: 'Genbrug af læringsindhold inden for alliancen',
        fields: [
          {
            name: 'contentReuseData',
            label: 'Genbrug af indhold',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '6.8',
        title: 'Imødekommelse af de lærendes behov',
        fields: [
          {
            name: 'meetingLearnerNeedsData',
            label: 'Imødekommelse af de lærendes behov',
            type: 'text',
            required: true,
            helpText: 'Dette felt bruger en tilpasset komponent',
          },
        ],
      },
      {
        id: '6.10',
        title: 'Planlæg evaluering',
        fields: [
          {
            name: 'evaluationPlan',
            label: 'Kursusevalueringsplan',
            type: 'textarea',
            required: true,
            helpText: 'Hvordan vil selve kurset blive evalueret og forbedret?',
          },
          {
            name: 'feedbackMechanisms',
            label: 'Feedbackmekanismer',
            type: 'textarea',
            required: true,
            helpText: 'Hvordan indsamles feedback fra de lærende?',
          },
        ],
      },
    ],
  },
];
