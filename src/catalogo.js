import estrutura from './assets/estrutura_axia.json' with { type: 'json' }

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

const montarAtividade = (a) => ({
  id: a.nome,
  nome: a.nome,
  ofertas: a.ofertas_servico ?? [],
  campos: [
    ...(a.ofertas_servico?.length
      ? [{ n: 'Oferta de Serviço', t: 'select', opcoes: a.ofertas_servico }]
      : []),
    ...CAMPOS_BASE,
  ],
})

export const PORTFOLIOS = estrutura.areas.map((area) => ({
  id: area.nome,
  nome: area.nome,
  servicos: unicosPorNome(area.servicos)
    .map((s) => ({
      id: s.nome,
      nome: s.nome,
      atividades: unicosPorNome(s.atividades).map(montarAtividade).sort(porNome),
    }))
    .sort(porNome),
}))

// Achata o catálogo para a busca do portal.
export const ATIVIDADES = PORTFOLIOS.flatMap((p) =>
  p.servicos.flatMap((s) =>
    s.atividades.map((a) => ({ ...a, portfolio: p, servico: s }))
  )
)
