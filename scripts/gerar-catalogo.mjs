// Converte as planilhas de catálogo em JSON para o portal.
// Rode com `node scripts/gerar-catalogo.mjs` sempre que uma planilha mudar.
//
// Cabeçalhos variam entre as planilhas (a antiga tem linha de título, as novas não;
// os campos vêm separados por vírgula numa e por ponto e vírgula nas outras), então
// as colunas são localizadas pelo nome e não pela posição.
// Fora do JSON a pedido: Tipo, Workflow, Troubleshooting e SLA de Resposta.
import { writeFileSync } from 'node:fs'
import { lerPlanilha } from './xlsx.mjs'

// As três planilhas alimentam a mesma aba. O destino é explícito, e não lido da coluna
// "Portfólio", porque é o portal que decide onde o card aparece.
const FONTES = [
  { arquivo: 'Catalogo_Top_10_AXIA.xlsx', destino: 'servicos_ti.json' },
  { arquivo: 'Catalogos_recentes_Gestao_de_Acesso_.xlsx', destino: 'servicos_ti.json' },
  {
    arquivo: 'Catalogo_SAP_10_Solicitacoes_10_Incidentes.xlsx',
    destino: 'servicos_ti.json',
  },
]

const PORTFOLIO = { 'servicos_ti.json': 'Serviços de TI' }

const COLUNAS = {
  servico: /^servi[çc]o$/i,
  atividade: /^atividade$/i,
  descricao: /^descri[çc][ãa]o/i,
  campos: /campos do formul|informa[çc][õo]es que o solicitante/i,
  // Resolução, nunca resposta. `findLastIndex` porque a planilha de Gestão de Acesso
  // repete o par Resposta/Resolução com o mesmo cabeçalho, e vale o segundo — o prazo
  // ampliado, na mesma escala do catálogo SAP. Fixado em lib.check.js.
  sla: /sla.*resolu/i,
}

const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Tipo do campo pelo nome: o que é texto livre vira textarea e o que é data vira date.
// Sem isso todo campo virava input de uma linha, inclusive "justificativa".
const tipoDoCampo = (nome) => {
  const n = nome.toLowerCase()
  if (/^data\b/.test(n)) return 'data'
  if (/justificativa|descrição|motivo|impacto|condição/.test(n)) return 'textarea'
  return 'texto'
}

// "centro de custo, quando aplicável" é um campo só, com uma ressalva colada no fim.
// A ressalva não cabe num rótulo de formulário e some aqui.
const limparCampo = (bruto) =>
  bruto
    .trim()
    .replace(/\.$/, '')
    .replace(/,\s*[^,]*\bquando\b.*$/i, '')
    .trim()

// A planilha nova separa por ponto e vírgula; a antiga, por vírgula. Detectar pelo
// conteúdo evita uma configuração por arquivo — e "print, foto ou vídeo" só sobrevive
// na nova justamente porque lá a vírgula não é separador.
const separarCampos = (bruto) =>
  (bruto.includes(';') ? bruto.split(';') : bruto.split(','))
    .map(limparCampo)
    .filter(Boolean)
    .map((n) => ({ n: maiuscula(n), t: tipoDoCampo(n) }))

// Aba de dados é a que tem coluna "Atividade": descarta "Resumo" e "Orientações".
function abasDeCatalogo(caminho) {
  return lerPlanilha(caminho)
    .map((linhas) => {
      const i = linhas.findIndex((l) => l.some((c) => COLUNAS.atividade.test(c ?? '')))
      return i < 0 ? null : { cabecalho: linhas[i], corpo: linhas.slice(i + 1) }
    })
    .filter(Boolean)
}

const coluna = (cabecalho, regra) => cabecalho.findLastIndex((c) => regra.test(c ?? ''))

const porDestino = new Map()

for (const { arquivo, destino } of FONTES) {
  for (const { cabecalho, corpo } of abasDeCatalogo(`src/assets/${arquivo}`)) {
    const em = Object.fromEntries(
      Object.entries(COLUNAS).map(([k, regra]) => [k, coluna(cabecalho, regra)])
    )

    for (const linha of corpo) {
      const nomeServico = linha[em.servico]
      const nomeAtividade = linha[em.atividade]
      if (!nomeServico || !nomeAtividade) continue

      const servicos = porDestino.get(destino) ?? new Map()
      porDestino.set(destino, servicos)
      if (!servicos.has(nomeServico))
        servicos.set(nomeServico, { nome: nomeServico, atividades: [] })

      servicos.get(nomeServico).atividades.push({
        nome: nomeAtividade,
        descricao: linha[em.descricao] ?? '',
        sla: linha[em.sla] ?? '',
        campos: separarCampos(linha[em.campos] ?? ''),
      })
    }
  }
}

for (const [destino, servicos] of porDestino) {
  const saida = { portfolio: PORTFOLIO[destino], servicos: [...servicos.values()] }
  writeFileSync(`src/assets/${destino}`, JSON.stringify(saida, null, 2) + '\n')

  const atividades = saida.servicos.reduce((n, s) => n + s.atividades.length, 0)
  const campos = saida.servicos.reduce(
    (n, s) => n + s.atividades.reduce((m, a) => m + a.campos.length, 0),
    0
  )
  console.log(
    `ok — ${destino}: ${saida.servicos.length} serviços, ` +
      `${atividades} atividades, ${campos} campos`
  )
}
