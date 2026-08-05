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

// Serviço vindo de planilha (scripts/gerar-catalogo.mjs), com atividade, descrição,
// SLA e campos próprios de formulário — não do estrutura_axia.json. Aqui a atividade
// já É o card: não há oferta de serviço.
const servicoDaPlanilha = (s, portfolio) => {
  const chave = `${portfolio}/${s.nome}`
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
      prazos: a.prazos,
      ofertas: [],
      campos: a.campos,
    })),
  }
}

const AREA_TI = {
  id: TI.portfolio,
  nome: TI.portfolio,
  servicos: TI.servicos.map((s) => servicoDaPlanilha(s, TI.portfolio)).sort(porNome),
}

// Abas do portal. As áreas do estrutura_axia.json são granulares demais para virar
// aba sozinhas ("VID > SIP" tem 1 serviço), então esta tabela agrupa. Renomear uma
// aba ou remanejar uma área é editar só aqui.
// Área que não aparece em nenhum grupo fica fora do portal — é assim que
// "Suporte e Infraestrutura" e os sistemas corporativos do estrutura_axia (Benner,
// Salesforce, SIP, V360, Intranet) continuam de fora, junto com as áreas deles.
// ponytail: agrupamento fixo no código. Quando o catálogo tiver o campo de área-pai,
// troque por leitura do JSON e apague esta tabela.
const GRUPOS_AREAS = [
  { nome: AREA_TI.nome, icone: 'grade', areas: [AREA_TI.nome] },
  // sem área: a aba é só o card de "Gestão de Acesso", que vem da planilha de TI
  { nome: 'Segurança', icone: 'escudo', areas: [] },
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

// "Gestão de Acesso" abre a aba de Segurança em vez da de TI: conceder e revogar
// acesso é decisão de segurança. Ele é o único card da aba — os serviços das áreas
// de Cibersegurança e Segurança da Informação ficam fora do portal por ora, do
// mesmo jeito que Benner, SIP e V360, e por isso o grupo abaixo não lista área
// nenhuma. Publicá-los é devolver os nomes das áreas ao `areas` do grupo.
const GESTAO_DE_ACESSO = 'Gestão de Acesso'

// Cada aba já vem com os serviços das suas áreas achatados e ordenados: o portal
// mostra serviço, não área, então a origem só sobrevive em `servico.portfolio`.
export const GRUPOS = GRUPOS_AREAS.map((g) => {
  const daArea = TODAS_AREAS.filter((p) => grupoDaArea.get(p.nome) === g.nome).flatMap(
    (p) => p.servicos.map((s) => ({ ...s, portfolio: p }))
  )

  const servicos =
    g.nome === 'Segurança'
      ? AREA_TI.servicos
          .filter((s) => s.nome === GESTAO_DE_ACESSO)
          .map((s) => ({ ...s, portfolio: AREA_TI }))
      : daArea.filter((s) => s.nome !== GESTAO_DE_ACESSO)

  return { id: g.nome, nome: g.nome, icone: g.icone, servicos: servicos.sort(porNome) }
})

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
