// Dados de demonstração das unidades. Substitua pelos dados reais.
export type Unit = {
  city: string
  address: string
  phone: string
}

export type StateUnits = {
  uf: string
  name: string
  units: Unit[]
}

export const unitsByState: StateUnits[] = [
  {
    uf: 'SP',
    name: 'São Paulo',
    units: [
      {
        city: 'São Paulo',
        address: 'Av. Paulista, 1200 — Bela Vista',
        phone: '(11) 4000-0001',
      },
      {
        city: 'Campinas',
        address: 'Av. Norte-Sul, 850 — Cambuí',
        phone: '(19) 4000-0002',
      },
      {
        city: 'Ribeirão Preto',
        address: 'R. General Osório, 340 — Centro',
        phone: '(16) 4000-0003',
      },
    ],
  },
  {
    uf: 'MG',
    name: 'Minas Gerais',
    units: [
      {
        city: 'Belo Horizonte',
        address: 'Av. Afonso Pena, 2100 — Funcionários',
        phone: '(31) 4000-0004',
      },
      {
        city: 'Uberlândia',
        address: 'Av. Rondon Pacheco, 990 — Tibery',
        phone: '(34) 4000-0005',
      },
    ],
  },
  {
    uf: 'PR',
    name: 'Paraná',
    units: [
      {
        city: 'Curitiba',
        address: 'R. XV de Novembro, 700 — Centro',
        phone: '(41) 4000-0006',
      },
      {
        city: 'Londrina',
        address: 'Av. Higienópolis, 450 — Centro',
        phone: '(43) 4000-0007',
      },
    ],
  },
  {
    uf: 'RS',
    name: 'Rio Grande do Sul',
    units: [
      {
        city: 'Porto Alegre',
        address: 'Av. Ipiranga, 6300 — Partenon',
        phone: '(51) 4000-0008',
      },
    ],
  },
  {
    uf: 'SC',
    name: 'Santa Catarina',
    units: [
      {
        city: 'Florianópolis',
        address: 'Av. Beira Mar Norte, 210 — Centro',
        phone: '(48) 4000-0009',
      },
      {
        city: 'Joinville',
        address: 'R. das Palmeiras, 120 — América',
        phone: '(47) 4000-0010',
      },
    ],
  },
  {
    uf: 'GO',
    name: 'Goiás',
    units: [
      {
        city: 'Goiânia',
        address: 'Av. T-63, 1500 — Setor Bueno',
        phone: '(62) 4000-0011',
      },
    ],
  },
  {
    uf: 'BA',
    name: 'Bahia',
    units: [
      {
        city: 'Salvador',
        address: 'Av. Tancredo Neves, 620 — Caminho das Árvores',
        phone: '(71) 4000-0012',
      },
    ],
  },
  {
    uf: 'DF',
    name: 'Distrito Federal',
    units: [
      {
        city: 'Brasília',
        address: 'SCS Quadra 2, Bloco C — Asa Sul',
        phone: '(61) 4000-0013',
      },
    ],
  },
  {
    uf: 'MT',
    name: 'Mato Grosso',
    units: [
      {
        city: 'Cuiabá',
        address: 'Av. Historiador Rubens de Mendonça, 1800',
        phone: '(65) 4000-0014',
      },
    ],
  },
  {
    uf: 'PE',
    name: 'Pernambuco',
    units: [
      {
        city: 'Recife',
        address: 'Av. Conde da Boa Vista, 500 — Boa Vista',
        phone: '(81) 4000-0015',
      },
    ],
  },
]

export const activeUFs = unitsByState.map((s) => s.uf)

export function findState(uf: string) {
  return unitsByState.find((s) => s.uf === uf)
}
