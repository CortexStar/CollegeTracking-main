export interface TopicReading {
  session: string;
  title: string;
  reading: string;
}

export interface Lecture {
  number: string;
  title: string;
}

export interface AssignedProblem {
  section: string;
  problems: string;
  page: string;
  solution?: {
    fileName: string;
    fileUrl: string;
  };
}

export interface ProblemSet {
  id: string;
  title: string;
  topics: TopicReading[];
  lectures: Lecture[];
  problems: AssignedProblem[];
}

export const problemSets: ProblemSet[] = [
  {
    id: "unit-1",
    title: "Unit 1",
    topics: [
      {
        session: "1",
        title: "The geometry of linear equations",
        reading: "1.1 – 2.1",
      },
      {
        session: "2",
        title: "Elimination with matrices",
        reading: "2.2 – 2.3",
      },
      {
        session: "3",
        title: "Matrix operations and inverses",
        reading: "2.4 – 2.5",
      },
    ],
    lectures: [
      {
        number: "1",
        title: "The geometry of linear equations",
      },
      {
        number: "2",
        title: "Elimination with matrices",
      },
      {
        number: "3",
        title: "Multiplication and inverse matrices",
      },
    ],
    problems: [
      {
        section: "1.2",
        problems: "23, 28",
        page: "21",
      },
      {
        section: "1.3",
        problems: "4, 13",
        page: "30",
      },
      {
        section: "2.1",
        problems: "29, 30",
        page: "43",
      },
      {
        section: "2.2",
        problems: "20, 32",
        page: "55",
      },
      {
        section: "2.3",
        problems: "22, 29",
        page: "64",
      },
      {
        section: "2.4",
        problems: "32, 36",
        page: "76",
      },
      {
        section: "2.5",
        problems: "7",
        page: "89",
      },
    ],
  },
  {
    id: "unit-2",
    title: "Unit 2",
    topics: [
      {
        session: "4",
        title: "LU and LDU factorization",
        reading: "2.6",
      },
      {
        session: "5",
        title: "Transposes and permutations",
        reading: "2.7",
      },
      {
        session: "6",
        title: "Vector spaces and subspaces",
        reading: "3.1",
      },
    ],
    lectures: [
      {
        number: "4",
        title: "Factorization into A = LU",
      },
      {
        number: "5",
        title: "Transposes, permutations, spaces ℝⁿ",
      },
      {
        number: "6",
        title: "Column space and nullspace",
      },
    ],
    problems: [
      {
        section: "2.5",
        problems: "24, 40",
        page: "89",
      },
      {
        section: "2.6",
        problems: "13, 18, 25, 26",
        page: "107",
      },
      {
        section: "2.7",
        problems: "13, 36, 40",
        page: "120",
      },
      {
        section: "3.1",
        problems: "18, 23, 30, 32",
        page: "132",
      },
    ],
  },
  {
    id: "unit-3",
    title: "Unit 3",
    topics: [
      {
        session: "7",
        title: "The nullspace: Solving A x = 0",
        reading: "3.2",
      },
      {
        session: "8",
        title: "Rectangular P A = LU and A x = b",
        reading: "3.3 – 3.4",
      },
      {
        session: "9",
        title: "Row reduced echelon form",
        reading: "3.3 – 3.4",
      },
    ],
    lectures: [
      {
        number: "7",
        title: "Solving A x = 0: pivot variables, special solutions",
      },
      {
        number: "8",
        title: "Solving A x = b: row reduced form R",
      },
      {
        number: "9",
        title: "Independence, basis, and dimension",
      },
    ],
    problems: [
      {
        section: "3.2",
        problems: "18, 24, 36, 37",
        page: "144",
      },
      {
        section: "3.3",
        problems: "19, 25, 27, 28",
        page: "155",
      },
      {
        section: "3.4",
        problems: "13, 25, 28, 35, 36",
        page: "168",
      },
    ],
  },
  {
    id: "unit-4",
    title: "Unit 4",
    topics: [
      {
        session: "10",
        title: "Basis and dimension",
        reading: "3.5",
      },
      {
        session: "11",
        title: "The four fundamental subspaces",
        reading: "3.6",
      },
    ],
    lectures: [
      {
        number: "9",
        title: "Independence, basis, and dimension",
      },
      {
        number: "10",
        title: "The four fundamental subspaces",
      },
    ],
    problems: [
      {
        section: "3.5",
        problems: "2, 20, 37, 41, 44",
        page: "184",
      },
      {
        section: "3.6",
        problems: "11, 24, 28 (challenge), 30, 31",
        page: "195",
      },
    ],
  },
  {
    id: "unit-5",
    title: "Unit 5",
    topics: [
      {
        session: "13",
        title: "Graphs and networks",
        reading: "8.2",
      },
      {
        session: "14",
        title: "Orthogonality",
        reading: "4.1",
      },
      {
        session: "15",
        title: "Projections and subspaces",
        reading: "4.2",
      },
    ],
    lectures: [
      {
        number: "12",
        title: "Graphs, networks, incidence matrices",
      },
      {
        number: "14",
        title: "Orthogonality",
      },
      {
        number: "15",
        title: "Projections onto subspaces",
      },
    ],
    problems: [
      {
        section: "4.1",
        problems: "7, 9, 31 (MATLAB check), 32, 33",
        page: "206",
      },
      {
        section: "4.2",
        problems: "13, 16, 17, 30, 31, 34",
        page: "218",
      },
      {
        section: "8.2",
        problems: "13 (MATLAB), 17",
        page: "428",
      },
    ],
  },
  {
    id: "unit-6",
    title: "Unit 6",
    topics: [
      {
        session: "16",
        title: "Least squares approximations",
        reading: "4.3",
      },
      {
        session: "17",
        title: "Gram‑Schmidt and A = QR",
        reading: "4.4",
      },
      {
        session: "18",
        title: "Properties of determinants",
        reading: "5.1",
      },
    ],
    lectures: [
      {
        number: "16",
        title: "Least squares approximations",
      },
      {
        number: "17",
        title: "Gram‑Schmidt and A = QR",
      },
      {
        number: "18",
        title: "Properties of determinants",
      },
    ],
    problems: [
      {
        section: "4.3",
        problems: "4, 7, 9, 26, 29",
        page: "230",
      },
      {
        section: "4.4",
        problems: "10, 18, 35, 36",
        page: "244",
      },
      {
        section: "5.1",
        problems: "10, 18, 31, 32",
        page: "255",
      },
    ],
  },
  {
    id: "unit-7",
    title: "Unit 7",
    topics: [
      {
        session: "19",
        title: "Formulas for determinants",
        reading: "5.2",
      },
      {
        session: "20",
        title: "Applications of determinants",
        reading: "5.3",
      },
      {
        session: "21",
        title: "Eigenvalues and eigenvectors",
        reading: "6.1",
      },
      {
        session: "22",
        title: "Diagonalization",
        reading: "6.2",
      },
    ],
    lectures: [
      {
        number: "19",
        title: "Formulas for determinants",
      },
      {
        number: "20",
        title: "Applications of determinants",
      },
      {
        number: "21",
        title: "Eigenvalues and eigenvectors",
      },
      {
        number: "22",
        title: "Diagonalization",
      },
    ],
    problems: [
      {
        section: "5.2",
        problems: "16, 32, 33",
        page: "269",
      },
      {
        section: "5.3",
        problems: "8, 28, 40, 41",
        page: "282",
      },
      {
        section: "6.1",
        problems: "19, 29",
        page: "298",
      },
      {
        section: "6.2",
        problems: "6, 16, 37",
        page: "312",
      },
    ],
  },
  {
    id: "unit-8",
    title: "Unit 8",
    topics: [
      {
        session: "23",
        title: "Markov matrices",
        reading: "8.3",
      },
      {
        session: "26",
        title: "Differential equations",
        reading: "6.3",
      },
      {
        session: "27",
        title: "Symmetric matrices",
        reading: "6.4",
      },
    ],
    lectures: [
      {
        number: "23",
        title: "Differential equations and e^{At}",
      },
      {
        number: "24",
        title: "Markov matrices; Fourier series",
      },
      {
        number: "25",
        title: "Symmetric matrices and positive definiteness",
      },
    ],
    problems: [
      {
        section: "6.3",
        problems: "14, 24, 28, 29, 30",
        page: "330",
      },
      {
        section: "6.4",
        problems: "7, 10, 23, 28, 30",
        page: "342",
      },
      {
        section: "8.3",
        problems: "9, 12, 16 (challenge)",
        page: "438",
      },
    ],
  },
  {
    id: "unit-9",
    title: "Unit 9",
    topics: [
      {
        session: "28",
        title: "Positive definite matrices",
        reading: "6.5",
      },
      {
        session: "29",
        title: "Matrices in engineering",
        reading: "8.1",
      },
      {
        session: "30",
        title: "Similar matrices",
        reading: "6.6",
      },
      {
        session: "31",
        title: "Singular value decomposition",
        reading: "6.7",
      },
    ],
    lectures: [
      {
        number: "27",
        title: "Positive definite matrices and minima",
      },
      {
        number: "28",
        title: "Similar matrices and Jordan form",
      },
      {
        number: "29",
        title: "Singular value decomposition",
      },
    ],
    problems: [
      {
        section: "6.5",
        problems: "25, 26, 27, 29, 32, 33, 34, 35",
        page: "355",
      },
      {
        section: "8.1",
        problems: "3, 5, 7, 10, 11 (last two challenge)",
        page: "419",
      },
      {
        section: "6.6",
        problems: "12, 14, 20, 22, 23, 24",
        page: "368",
      },
      {
        section: "6.7",
        problems: "4, 11, 17",
        page: "375",
      },
    ],
  },
  {
    id: "unit-10",
    title: "Unit 10",
    topics: [
      {
        session: "30",
        title: "Similar matrices",
        reading: "6.6",
      },
      {
        session: "31",
        title: "Singular value decomposition",
        reading: "6.7",
      },
      {
        session: "32",
        title: "Fourier series, FFT, complex matrices",
        reading: "8.5 & 10.2–10.3",
      },
    ],
    lectures: [
      {
        number: "28",
        title: "Similar matrices and Jordan form",
      },
      {
        number: "29",
        title: "Singular value decomposition",
      },
      {
        number: "24",
        title: "Markov matrices; Fourier series",
      },
    ],
    problems: [
      {
        section: "6.6",
        problems: "12, 14, 20, 22, 23, 24",
        page: "368",
      },
      {
        section: "6.7",
        problems: "4, 11, 17",
        page: "375",
      },
      {
        section: "8.5",
        problems: "4, 5, 12, 13 (last two challenge)",
        page: "458",
      },
    ],
  },
];
