// ISCED-F 2013 fields of education and training

export interface IscedDetailedField {
  code: string;
  label: string;
}

export interface IscedNarrowField {
  code: string;
  label: string;
  detailed: IscedDetailedField[];
}

export interface IscedBroadField {
  code: string;
  label: string;
  narrow: IscedNarrowField[];
}

const d = (code: string, label: string): IscedDetailedField => ({ code, label });

export const iscedBroadFields: IscedBroadField[] = [
  {
    code: '00',
    label: 'Generic programmes and qualifications',
    narrow: [
      { code: '000', label: 'Generic programmes and qualifications not further defined', detailed: [d('0000', 'Generic programmes and qualifications not further defined')] },
      { code: '001', label: 'Basic programmes and qualifications', detailed: [d('0011', 'Basic programmes and qualifications')] },
      { code: '002', label: 'Literacy and numeracy', detailed: [d('0021', 'Literacy and numeracy')] },
      { code: '003', label: 'Personal skills and development', detailed: [d('0031', 'Personal skills and development')] },
      { code: '009', label: 'Generic programmes and qualifications not elsewhere classified', detailed: [d('0099', 'Generic programmes and qualifications not elsewhere classified')] },
    ],
  },
  {
    code: '01',
    label: 'Education',
    narrow: [
      {
        code: '011', label: 'Education', detailed: [
          d('0110', 'Education not further defined'),
          d('0111', 'Education science'),
          d('0112', 'Training for pre-school teachers'),
          d('0113', 'Teacher training without subject specialisation'),
          d('0114', 'Teacher training with subject specialisation'),
          d('0119', 'Education not elsewhere classified'),
        ],
      },
      { code: '018', label: 'Inter-disciplinary programmes and qualifications involving education', detailed: [d('0188', 'Inter-disciplinary programmes and qualifications involving education')] },
    ],
  },
  {
    code: '02',
    label: 'Arts and humanities',
    narrow: [
      { code: '020', label: 'Arts and humanities not further defined', detailed: [d('0200', 'Arts and humanities not further defined')] },
      {
        code: '021', label: 'Arts', detailed: [
          d('0210', 'Arts not further defined'),
          d('0211', 'Audio-visual techniques and media production'),
          d('0212', 'Fashion, interior and industrial design'),
          d('0213', 'Fine arts'),
          d('0214', 'Handicrafts'),
          d('0215', 'Music and performing arts'),
          d('0219', 'Arts not elsewhere classified'),
        ],
      },
      {
        code: '022', label: 'Humanities (except languages)', detailed: [
          d('0220', 'Humanities (except languages) not further defined'),
          d('0221', 'Religion and theology'),
          d('0222', 'History and archaeology'),
          d('0223', 'Philosophy and ethics'),
          d('0229', 'Humanities (except languages) not elsewhere classified'),
        ],
      },
      {
        code: '023', label: 'Languages', detailed: [
          d('0230', 'Languages not further defined'),
          d('0231', 'Language acquisition'),
          d('0232', 'Literature and linguistics'),
          d('0239', 'Languages not elsewhere classified'),
        ],
      },
      { code: '028', label: 'Inter-disciplinary programmes and qualifications involving arts and humanities', detailed: [d('0288', 'Inter-disciplinary programmes and qualifications involving arts and humanities')] },
      { code: '029', label: 'Arts and humanities not elsewhere classified', detailed: [d('0299', 'Arts and humanities not elsewhere classified')] },
    ],
  },
  {
    code: '03',
    label: 'Social sciences, journalism and information',
    narrow: [
      { code: '030', label: 'Social sciences, journalism and information not further defined', detailed: [d('0300', 'Social sciences, journalism and information not further defined')] },
      {
        code: '031', label: 'Social and behavioural sciences', detailed: [
          d('0310', 'Social and behavioural studies not further defined'),
          d('0311', 'Economics'),
          d('0312', 'Political sciences and civics'),
          d('0313', 'Psychology'),
          d('0314', 'Sociology and cultural studies'),
          d('0319', 'Social and behavioural sciences not elsewhere classified'),
        ],
      },
      {
        code: '032', label: 'Journalism and information', detailed: [
          d('0320', 'Journalism and reporting not further defined'),
          d('0321', 'Journalism and reporting'),
          d('0322', 'Library, information and archival studies'),
          d('0329', 'Journalism and reporting not elsewhere classified'),
        ],
      },
      { code: '038', label: 'Inter-disciplinary programmes and qualifications involving social sciences, journalism and information', detailed: [d('0388', 'Inter-disciplinary programmes and qualifications involving social sciences, journalism and information')] },
      { code: '039', label: 'Social sciences, journalism and information not elsewhere classified', detailed: [d('0399', 'Social sciences, journalism and information not elsewhere classified')] },
    ],
  },
  {
    code: '04',
    label: 'Business, administration and law',
    narrow: [
      { code: '040', label: 'Business, administration and law not further defined', detailed: [d('0400', 'Business, administration and law not further defined')] },
      {
        code: '041', label: 'Business and administration', detailed: [
          d('0410', 'Business and administration not further defined'),
          d('0411', 'Accounting and taxation'),
          d('0412', 'Finance, banking and insurance'),
          d('0413', 'Management and administration'),
          d('0414', 'Marketing and advertising'),
          d('0415', 'Secretarial and office work'),
          d('0416', 'Wholesale and retail sales'),
          d('0417', 'Work skills'),
          d('0419', 'Business and administration not elsewhere classified'),
        ],
      },
      { code: '042', label: 'Law', detailed: [d('0421', 'Law')] },
      { code: '048', label: 'Inter-disciplinary programmes and qualifications involving business, administration and law', detailed: [d('0488', 'Inter-disciplinary programmes and qualifications involving business, administration and law')] },
      { code: '049', label: 'Business, administration and law not elsewhere classified', detailed: [d('0499', 'Business, administration and law not elsewhere classified')] },
    ],
  },
  {
    code: '05',
    label: 'Natural sciences, mathematics and statistics',
    narrow: [
      { code: '050', label: 'Natural sciences, mathematics and statistics not further defined', detailed: [d('0500', 'Natural sciences, mathematics and statistics not further defined')] },
      {
        code: '051', label: 'Biological and related sciences', detailed: [
          d('0510', 'Biology and related sciences not further defined'),
          d('0511', 'Biology'),
          d('0512', 'Biochemistry'),
          d('0519', 'Biology and related sciences not elsewhere classified'),
        ],
      },
      {
        code: '052', label: 'Environment', detailed: [
          d('0520', 'Environment not further defined'),
          d('0521', 'Environmental sciences'),
          d('0522', 'Natural environments and wildlife'),
          d('0529', 'Environment not elsewhere classified'),
        ],
      },
      {
        code: '053', label: 'Physical sciences', detailed: [
          d('0530', 'Physical sciences not further defined'),
          d('0531', 'Chemistry'),
          d('0532', 'Earth sciences'),
          d('0533', 'Physics'),
          d('0539', 'Physical sciences not elsewhere classified'),
        ],
      },
      {
        code: '054', label: 'Mathematics and statistics', detailed: [
          d('0540', 'Mathematics and statistics not further defined'),
          d('0541', 'Mathematics'),
          d('0542', 'Statistics'),
          d('0549', 'Mathematics and statistics not elsewhere classified'),
        ],
      },
      { code: '058', label: 'Inter-disciplinary programmes and qualifications involving natural sciences, mathematics and statistics', detailed: [d('0588', 'Inter-disciplinary programmes and qualifications involving natural sciences, mathematics and statistics')] },
      { code: '059', label: 'Natural sciences, mathematics and statistics not elsewhere classified', detailed: [d('0599', 'Natural sciences, mathematics and statistics not elsewhere classified')] },
    ],
  },
  {
    code: '06',
    label: 'Information and Communication Technologies (ICTs)',
    narrow: [
      {
        code: '061', label: 'Information and Communication Technologies (ICTs)', detailed: [
          d('0610', 'Information and Communication Technologies (ICTs) not further defined'),
          d('0611', 'Computer use'),
          d('0612', 'Database and network design and administration'),
          d('0613', 'Software and applications development and analysis'),
          d('0619', 'Information and Communication Technologies (ICTs) not elsewhere classified'),
        ],
      },
      { code: '068', label: 'Inter-disciplinary programmes and qualifications involving Information and Communication Technologies (ICTs)', detailed: [d('0688', 'Inter-disciplinary programmes and qualifications involving Information and Communication Technologies (ICTs)')] },
    ],
  },
  {
    code: '07',
    label: 'Engineering, manufacturing and construction',
    narrow: [
      { code: '070', label: 'Engineering, manufacturing and construction not further defined', detailed: [d('0700', 'Engineering, manufacturing and construction not further defined')] },
      {
        code: '071', label: 'Engineering and engineering trades', detailed: [
          d('0710', 'Engineering and engineering trades not further defined'),
          d('0711', 'Chemical engineering and processes'),
          d('0712', 'Environmental protection technology'),
          d('0713', 'Electricity and energy'),
          d('0714', 'Electronics and automation'),
          d('0715', 'Mechanics and metal trades'),
          d('0716', 'Motor vehicles, ships and aircraft'),
          d('0719', 'Engineering and engineering trades not elsewhere classified'),
        ],
      },
      {
        code: '072', label: 'Manufacturing and processing', detailed: [
          d('0720', 'Manufacturing and processing not further defined'),
          d('0721', 'Food processing'),
          d('0722', 'Materials (glass, paper, plastic and wood)'),
          d('0723', 'Textiles (clothes, footwear and leather)'),
          d('0724', 'Mining and extraction'),
          d('0729', 'Manufacturing and processing not elsewhere classified'),
        ],
      },
      {
        code: '073', label: 'Architecture and construction', detailed: [
          d('0730', 'Architecture and construction not further defined'),
          d('0731', 'Architecture and town planning'),
          d('0732', 'Building and civil engineering'),
          d('0739', 'Architecture and construction not elsewhere classified'),
        ],
      },
      { code: '078', label: 'Inter-disciplinary programmes and qualifications involving engineering, manufacturing and construction', detailed: [d('0788', 'Inter-disciplinary programmes and qualifications involving engineering, manufacturing and construction')] },
      { code: '079', label: 'Engineering, manufacturing and construction not elsewhere classified', detailed: [d('0799', 'Engineering, manufacturing and construction not elsewhere classified')] },
    ],
  },
  {
    code: '08',
    label: 'Agriculture, forestry, fisheries and veterinary',
    narrow: [
      { code: '080', label: 'Agriculture, forestry, fisheries and veterinary not further defined', detailed: [d('0800', 'Agriculture, forestry, fisheries and veterinary not further defined')] },
      {
        code: '081', label: 'Agriculture', detailed: [
          d('0810', 'Agriculture not further defined'),
          d('0811', 'Crop and livestock production'),
          d('0812', 'Horticulture'),
          d('0819', 'Agriculture not elsewhere classified'),
        ],
      },
      { code: '082', label: 'Forestry', detailed: [d('0821', 'Forestry')] },
      { code: '083', label: 'Fisheries', detailed: [d('0831', 'Fisheries')] },
      { code: '084', label: 'Veterinary', detailed: [d('0841', 'Veterinary')] },
      { code: '088', label: 'Inter-disciplinary programmes and qualifications involving agriculture, forestry, fisheries and veterinary', detailed: [d('0888', 'Inter-disciplinary programmes and qualifications involving agriculture, forestry, fisheries and veterinary')] },
      { code: '089', label: 'Agriculture, forestry, fisheries and veterinary not elsewhere classified', detailed: [d('0899', 'Agriculture, forestry, fisheries and veterinary not elsewhere classified')] },
    ],
  },
  {
    code: '09',
    label: 'Health and welfare',
    narrow: [
      { code: '090', label: 'Health and welfare not further defined', detailed: [d('0900', 'Health and welfare not further defined')] },
      {
        code: '091', label: 'Health', detailed: [
          d('0910', 'Health not further defined'),
          d('0911', 'Dental studies'),
          d('0912', 'Medicine'),
          d('0913', 'Nursing and midwifery'),
          d('0914', 'Medical diagnostic and treatment technology'),
          d('0915', 'Therapy and rehabilitation'),
          d('0916', 'Pharmacy'),
          d('0917', 'Traditional and complementary medicine and therapy'),
          d('0919', 'Health not elsewhere classified'),
        ],
      },
      {
        code: '092', label: 'Welfare', detailed: [
          d('0920', 'Welfare not further defined'),
          d('0921', 'Care of elderly and of disabled adults'),
          d('0922', 'Child care and youth services'),
          d('0923', 'Social work and counselling'),
          d('0929', 'Welfare not elsewhere classified'),
        ],
      },
      { code: '098', label: 'Inter-disciplinary programmes and qualifications involving health and welfare', detailed: [d('0988', 'Inter-disciplinary programmes and qualifications involving health and welfare')] },
      { code: '099', label: 'Health and welfare not elsewhere classified', detailed: [d('0999', 'Health and welfare not elsewhere classified')] },
    ],
  },
  {
    code: '10',
    label: 'Services',
    narrow: [
      { code: '100', label: 'Services not further defined', detailed: [d('1000', 'Services not further defined')] },
      {
        code: '101', label: 'Personal services', detailed: [
          d('1010', 'Personal services not further defined'),
          d('1011', 'Domestic services'),
          d('1012', 'Hair and beauty services'),
          d('1013', 'Hotel, restaurants and catering'),
          d('1014', 'Sports'),
          d('1015', 'Travel, tourism and leisure'),
          d('1019', 'Personal services not elsewhere classified'),
        ],
      },
      {
        code: '102', label: 'Hygiene and occupational health services', detailed: [
          d('1020', 'Hygiene and occupational health services not further defined'),
          d('1021', 'Community sanitation'),
          d('1022', 'Occupational health and safety'),
          d('1029', 'Hygiene and occupational health services not elsewhere classified'),
        ],
      },
      {
        code: '103', label: 'Security services', detailed: [
          d('1030', 'Security services not further defined'),
          d('1031', 'Military and defence'),
          d('1032', 'Protection of persons and property'),
          d('1039', 'Security services not elsewhere classified'),
        ],
      },
      { code: '104', label: 'Transport services', detailed: [d('1041', 'Transport services')] },
      { code: '108', label: 'Inter-disciplinary programmes and qualifications involving services', detailed: [d('1088', 'Inter-disciplinary programmes and qualifications involving services')] },
      { code: '109', label: 'Services not elsewhere classified', detailed: [d('1099', 'Services not elsewhere classified')] },
    ],
  },
];

export function getIscedBroad(code?: string) {
  return iscedBroadFields.find(b => b.code === code);
}

export function getIscedNarrow(broadCode?: string, narrowCode?: string) {
  return getIscedBroad(broadCode)?.narrow.find(n => n.code === narrowCode);
}

export function getIscedDetailed(broadCode?: string, narrowCode?: string, detailedCode?: string) {
  return getIscedNarrow(broadCode, narrowCode)?.detailed.find(x => x.code === detailedCode);
}

/** Human-readable label like "0613 – Software and applications development and analysis" */
export function formatIscedEntry(code?: string, label?: string) {
  if (!code) return '';
  return `${code} – ${label ?? ''}`.trim();
}
