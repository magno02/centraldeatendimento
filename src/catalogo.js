import estrutura from './assets/estrutura_axia.json' with { type: 'json' }
import TI from './assets/servicos_ti.json' with { type: 'json' }

// Catálogo vem do JSON: areas > servicos > atividades > ofertas_servico.
// O nome é único dentro do pai, então serve de id/chave — o dedupe abaixo garante
// isso mesmo se o JSON voltar a ter repetições.
const unicosPorNome = (itens = []) => [
  ...new Map(itens.map((i) => [i.nome, i])).values(),
]

const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR')

const CAMPOS_BASE = [
  { n: 'Descrição da necessidade', t: 'textarea' },
  { n: 'Urgência', t: 'select', opcoes: ['Baixa', 'Média', 'Alta'] },
]

const montarAtividade = (a, chaveServico) => ({
  id: a.nome,
  nome: a.nome,
  chave: `${chaveServico}/${a.nome}`,
  ofertas: a.ofertas_servico ?? [],
  campos: [
    ...(a.ofertas_servico?.length
      ? [{ n: 'Oferta de Serviço', t: 'combo', opcoes: a.ofertas_servico }]
      : []),
    ...CAMPOS_BASE,
  ],
})

export const PORTFOLIOS = estrutura.areas.map((area) => ({
  id: area.nome,
  nome: area.nome,
  servicos: unicosPorNome(area.servicos)
    .map((s) => {
      const chave = `${area.nome}/${s.nome}`
      return {
        id: s.nome,
        nome: s.nome,
        chave,
        atividades: unicosPorNome(s.atividades)
          .map((a) => montarAtividade(a, chave))
          .sort(porNome),
      }
    })
    .sort(porNome),
}))

// Achata o catálogo para a busca do portal.
export const ATIVIDADES = PORTFOLIOS.flatMap((p) =>
  p.servicos.flatMap((s) =>
    s.atividades.map((a) => ({ ...a, portfolio: p, servico: s }))
  )
)

export const SERVICOS = PORTFOLIOS.flatMap((p) =>
  p.servicos.map((s) => ({ ...s, portfolio: p }))
)

// "Serviços de TI" vem da planilha (scripts/gerar-catalogo-ti.mjs), com atividade,
// descrição, SLA e campos próprios de formulário — não do estrutura_axia.json.
// Aqui a atividade já É o card: não há oferta de serviço neste portfólio.
const AREA_TI = {
  id: TI.portfolio,
  nome: TI.portfolio,
  servicos: TI.servicos
    .map((s) => {
      const chave = `${TI.portfolio}/${s.nome}`
      return {
        id: s.nome,
        nome: s.nome,
        chave,
        atividades: s.atividades.map((a) => ({
          id: a.nome,
          nome: a.nome,
          chave: `${chave}/${a.nome}`,
          descricao: a.descricao,
          sla: a.sla,
          ofertas: [],
          campos: a.campos,
        })),
      }
    })
    .sort(porNome),
}

// Abas do portal. As áreas do estrutura_axia.json são granulares demais para virar
// aba sozinhas ("VID > SIP" tem 1 serviço), então esta tabela agrupa. Renomear uma
// aba ou remanejar uma área é editar só aqui.
// Área que não aparece em nenhum grupo fica fora do portal — foi assim que
// "Suporte e Infraestrutura" e "Segurança" saíram, junto com as áreas delas.
// ponytail: agrupamento fixo no código. Quando o catálogo tiver o campo de área-pai,
// troque por leitura do JSON e apague esta tabela.
const GRUPOS_AREAS = [
  { nome: AREA_TI.nome, icone: 'grade', areas: [AREA_TI.nome] },
  {
    nome: 'Sistemas Corporativos',
    icone: 'janela',
    areas: [
      'SAP',
      'VID > Benner',
      'VID > Salesforce',
      'Salesforce',
      'CSC > Sustentação de Aplicações',
      'VID > SIP',
    ],
  },
  {
    nome: 'Dados e Automação',
    icone: 'backup',
    areas: [
      'COE de Hiperautomação',
      'COE de IA',
      'CSC > Operação Analytics',
      'VID > Governança',
    ],
  },
]

const grupoDaArea = new Map(
  GRUPOS_AREAS.flatMap((g) => g.areas.map((a) => [a, g.nome]))
)

const TODAS_AREAS = [AREA_TI, ...PORTFOLIOS]

// Cada aba já vem com os serviços das suas áreas achatados e ordenados: o portal
// mostra serviço, não área, então a origem só sobrevive em `servico.portfolio`.
export const GRUPOS = GRUPOS_AREAS.map((g) => ({
  id: g.nome,
  nome: g.nome,
  icone: g.icone,
  servicos: TODAS_AREAS.filter((p) => grupoDaArea.get(p.nome) === g.nome)
    .flatMap((p) => p.servicos.map((s) => ({ ...s, portfolio: p })))
    .sort(porNome),
}))

export const grupoDoPortfolio = (nomeArea) => grupoDaArea.get(nomeArea) ?? GRUPOS[0].id

// Só o que está numa aba entra na busca e no resolvedor de favoritos: exibir um
// resultado que não existe em aba nenhuma levaria a uma tela sem volta.
const SERVICOS_VISIVEIS = GRUPOS.flatMap((g) => g.servicos)

export const ATIVIDADES_VISIVEIS = SERVICOS_VISIVEIS.flatMap((s) =>
  s.atividades.map((a) => ({ ...a, portfolio: s.portfolio, servico: s }))
)

// chave -> item, para resolver favoritos e recentes guardados no localStorage.
export const POR_CHAVE = new Map([
  ...SERVICOS_VISIVEIS.map((s) => [s.chave, { tipo: 'servico', item: s }]),
  ...ATIVIDADES_VISIVEIS.map((a) => [a.chave, { tipo: 'atividade', item: a }]),
])
