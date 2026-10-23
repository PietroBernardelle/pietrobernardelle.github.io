// Profile, resume, teaching, and service facts.
// Publications live in content/papers.bib; blog notes in content/blog/.

export const site = {
  name: 'Pietro Bernardelle',
  shortName: 'Pietro Bernardelle',
  role: 'PhD candidate in Computer Science',
  institution: 'University of Queensland',
  focus: 'Large language models',
  institutionUrl: 'https://www.uq.edu.au/',
  location: 'Brisbane, Australia',
  office: 'Room 622, Building 78, The University of Queensland',
  email: 'p.bernardelle@uq.edu.au',
  scholar: 'https://scholar.google.com/citations?user=Sq0ZZhYAAAAJ',
  github: 'https://github.com/PietroBernardelle',
  linkedin: 'https://www.linkedin.com/in/pietro-bernardelle',
  orcid: 'https://orcid.org/0009-0003-3657-9229',
  telegram: 'https://t.me/pietro_bernardelle',
  portrait: '/images/pb_pic.jpg',
  // The old address (PietroBernardelleCV__UQ_.pdf) also serves the current CV, for existing links.
  cv: '/assets/pdf/PietroBernardelleCV.pdf',
  description:
    'Pietro Bernardelle is a Computer Science PhD candidate at The University of Queensland, working on the intersection of large language models (LLMs) and social science.',
} as const;

// Profile links in the right rail, top to bottom.
export const elsewhere = [
  { label: 'Scholar', href: site.scholar, icon: 'scholar' },
  { label: 'ORCID', href: site.orcid, icon: 'orcid' },
  { label: 'LinkedIn', href: site.linkedin, icon: 'linkedin' },
] as const;

export const profileFacts = [
  { label: 'Field', value: 'Computer Science' },
  { label: 'Focus', value: 'Bias and representations in LLMs' },
  { label: 'Office', value: 'Room 622, Building 78, UQ, Brisbane' },
] as const;

export const supervisors = [
  { name: 'Prof. Gianluca Demartini', href: 'https://www.gianlucademartini.net/' },
  { name: 'Dr. Joel Mackenzie', href: 'https://jmmackenzie.io/' },
  { name: 'Dr. Kevin Roitero', href: 'https://kevinroitero.com/' },
] as const;

/** A role held alongside a degree (tutoring, research assistance, an internship). */
export type TimelineRole = {
  period: string;
  title: string;
  place: string;
  detail?: string;
};

export type TimelineItem = {
  /** Shown as written, e.g. "Sep 2021 – Dec 2024"; "Present" marks the current one. */
  period: string;
  title: string;
  place: string;
  detail?: string;
  /** An award or honour, shown with a small "Distinction" label. */
  distinction?: string;
  /** Roles held during this degree, shown indented beneath it (newest first). */
  roles?: TimelineRole[];
};

// Degrees, newest first, with the roles held during each. Dates from the CV
// (public/assets/pdf/).
export const timeline: TimelineItem[] = [
  {
    period: 'Jul 2024 – Present',
    title: 'PhD, Artificial Intelligence',
    place: 'The University of Queensland',
    roles: [
      {
        period: 'Feb 2025 – Nov 2025',
        title: 'Academic Tutor',
        place: 'UQ School of EECS',
        detail: 'Data Mining (INFS4203), Information Retrieval and Web Search (INFS7410), Data Analysis at Scale (DATA7201)',
      },
    ],
  },
  {
    period: 'Feb 2023 – Jul 2024',
    title: 'M.Sc. in Engineering Science (Management)',
    place: 'The University of Queensland',
    // Non-breaking spaces keep the dot with "Excellence" and "Semester 1, 2024" together.
    distinction: "Dean's Commendation for Academic Excellence\u00a0· Semester\u00a01,\u00a02024",
    roles: [
      {
        period: 'Nov 2023 – Jan 2024',
        title: 'Research Assistant',
        place: 'UQ School of EECS',
        detail: 'Graph-based reinforcement learning for pair selection',
      },
      {
        period: 'Aug 2023 – Nov 2023',
        title: 'Research Intern',
        place: 'CIRES',
        detail: 'Graph-based reinforcement learning for pair selection',
      },
    ],
  },
  { period: 'Sep 2021 – Dec 2024', title: 'M.Sc. in Computer Science and Engineering', place: 'Politecnico di Milano' },
  { period: 'Sep 2018 – Jul 2021', title: 'B.Sc. in Engineering of Computing Systems', place: 'Politecnico di Milano' },
];

export const teaching = {
  role: 'Academic Tutor, UQ School of EECS',
  year: '2025',
  courses: [
    { code: 'INFS4203', name: 'Data Mining', href: 'https://programs-courses.uq.edu.au/course.html?course_code=INFS4203' },
    { code: 'INFS7410', name: 'Information Retrieval and Web Search', href: 'https://programs-courses.uq.edu.au/course.html?course_code=INFS7410' },
    { code: 'DATA7201', name: 'Data Analysis at Scale', href: 'https://programs-courses.uq.edu.au/course.html?course_code=DATA7201' },
  ],
} as const;

export type ServiceItem = {
  name: string;
  acronym?: string;
  href: string;
  years: number[];
  note?: string;
};

export const services: { category: string; items: ServiceItem[] }[] = [
  {
    category: 'Reviewer for journals',
    items: [
      { name: 'Information Processing & Management', acronym: 'IP&M', href: 'https://www.sciencedirect.com/journal/information-processing-and-management', years: [2026] },
      { name: 'Computers in Human Behavior Reports', acronym: 'CHBR', href: 'https://www.sciencedirect.com/journal/computers-in-human-behavior-reports', years: [2026] },
      {
        name: 'ACM Transactions on Intelligent Systems and Technology',
        acronym: 'TIST',
        href: 'https://dl.acm.org/journal/tist',
        years: [2025],
        note: 'Special Issue on Risks and Unintended Harms of Generative AI Systems.',
      },
      { name: 'Journal of Information Technology & Politics', href: 'https://www.tandfonline.com/journals/witp20', years: [2025] },
    ],
  },
  {
    category: 'Program committee member',
    items: [
      // Most recent first. Add a year to `years` when you serve again.
      { name: 'International AAAI Conference on Web and Social Media', acronym: 'ICWSM', href: 'https://www.icwsm.org/2027/', years: [2027] },
      { name: 'European Conference on Information Retrieval', acronym: 'ECIR', href: 'https://www.ecir2027.co.uk/', years: [2026, 2027], note: 'Short paper track.' },
      { name: 'International ACM Conference on Knowledge and Information Management', acronym: 'CIKM', href: 'https://cikm2026.diag.uniroma1.it/', years: [2026] },
      { name: 'ACM Web Science Conference', acronym: 'WebSci', href: 'https://websci26.org/', years: [2026] },
    ],
  },
];
