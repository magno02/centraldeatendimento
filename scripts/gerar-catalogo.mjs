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

// Tipo do campo pelo nome: o que é texto livre vira textarea. Sem isso todo campo
// virava input de uma linha, inclusive "justificativa".
const tipoDoCampo = (nome) =>
  /justificativa|descrição|motivo|impacto|condição/.test(nome.toLowerCase())
    ? 'textarea'
    : 'texto'

// "centro de custo, quando aplicável" é um campo só, com uma ressalva colada no fim.
// A ressalva não cabe num rótulo de formulário e some aqui.
const limparCampo = (bruto) =>
  bruto
    .trim()
    .replace(/\.$/, '')
    .replace(/,\s*[^,]*\bquando\b.*$/i, '')
    .trim()

// Serviço da planilha que não entra no portal. Os periféricos viraram opção do
// combo do serviço "Periféricos" (SERVICOS_EXTRAS), então saem como card próprio.
const SERVICOS_FORA = [
  /^desktop$/i,
  /^mouse$/i,
  /^teclado$/i,
  /^webcam$/i,
  /^headset$/i,
  /^dock(ing)? station$/i,
]

// Campos que a planilha traz mas o formulário não pede. Todo campo de data sai do
// catálogo inteiro; o resto é por atividade ou por serviço, com a chave em minúsculas.
const CAMPOS_FORA = [/^data\b/i]
const CAMPOS_FORA_DE = {
  'solicitar celular corporativo': /^(centro de custo|linha|aplicativos)$/i,
  'solicitar monitor':
    /^(centro de custo|quantidade|tamanho|conex[ãa]o|equipamento de destino)$/i,
}
const CAMPOS_FORA_DO_SERVICO = {
  'gestão de acesso': /^(perfil ou funcionalidade|vig[êe]ncia|centro de custo)$/i,
}

// Campo que troca de tipo no portal: a planilha traz "Ambiente" como texto livre e
// o formulário precisa dos três ambientes marcáveis juntos.
const CAMPOS_TROCADOS = {
  'gestão de acesso': {
    ambiente: {
      t: 'checkbox',
      opcoes: ['Desenvolvimento', 'Homologação', 'Produção'],
    },
  },
}

const chave = (s) => s.trim().toLowerCase()

// Nome pedido pelo negócio no lugar do que veio da planilha — vale para o card e
// para o título do formulário, que são o mesmo texto.
const ATIVIDADES_RENOMEADAS = { 'solicitar impressora': 'Configurar Impressora' }

// Rótulo pedido pelo negócio no lugar do que veio da planilha.
const CAMPOS_RENOMEADOS = [[/^justificativa$/i, 'Descrição da Solicitação']]
const renomear = (n) => CAMPOS_RENOMEADOS.find(([r]) => r.test(n))?.[1] ?? n

const campoRemovido = (nome, atividade, servico) =>
  CAMPOS_FORA.some((r) => r.test(nome)) ||
  CAMPOS_FORA_DE[chave(atividade)]?.test(nome) ||
  CAMPOS_FORA_DO_SERVICO[chave(servico)]?.test(nome)

// A planilha nova separa por ponto e vírgula; a antiga, por vírgula. Detectar pelo
// conteúdo evita uma configuração por arquivo — e "print, foto ou vídeo" só sobrevive
// na nova justamente porque lá a vírgula não é separador.
const separarCampos = (bruto, atividade, servico) =>
  (bruto.includes(';') ? bruto.split(';') : bruto.split(','))
    .map(limparCampo)
    .filter((n) => n && !campoRemovido(n, atividade, servico))
    .map(renomear)
    .map((n) => ({
      n: maiuscula(n),
      t: tipoDoCampo(n),
      ...CAMPOS_TROCADOS[chave(servico)]?.[chave(n)],
    }))

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
      const daPlanilha = linha[em.atividade]
      if (!nomeServico || !daPlanilha) continue
      if (SERVICOS_FORA.some((r) => r.test(nomeServico.trim()))) continue
      const nomeAtividade = ATIVIDADES_RENOMEADAS[chave(daPlanilha)] ?? daPlanilha

      const servicos = porDestino.get(destino) ?? new Map()
      porDestino.set(destino, servicos)
      if (!servicos.has(nomeServico))
        servicos.set(nomeServico, { nome: nomeServico, atividades: [] })

      servicos.get(nomeServico).atividades.push({
        nome: nomeAtividade,
        descricao: linha[em.descricao] ?? '',
        sla: linha[em.sla] ?? '',
        campos: separarCampos(linha[em.campos] ?? '', nomeAtividade, nomeServico),
      })
    }
  }
}

// Atividade que não tem linha na planilha: reaproveita o formulário de "Trocar" e
// troca o Motivo de texto livre por lista fechada. Quando a planilha passar a trazer
// a atividade, apague este bloco — ela chega pronta pelo caminho normal.
const MOTIVOS_CELULAR = [
  'Aparelho não liga',
  'Tela quebrada',
  'Bateria com defeito',
  'Problema de carregamento',
  'Sem sinal',
  'Problema com chip/SIM',
  'Internet móvel não funciona',
  'Aplicativo corporativo com erro',
  'Bloqueio de acesso',
  'Perda ou roubo',
  'Outro',
]

// "Aparelho não liga" veio do pedido; o resto cobre as falhas comuns de monitor.
const DEFEITOS_MONITOR = [
  'Aparelho não liga',
  'Sem imagem ou sem sinal',
  'Tela quebrada ou trincada',
  'Manchas ou pixels queimados',
  'Imagem piscando ou tremendo',
  'Cores distorcidas',
  'Falha no cabo ou conector',
  'Botões não respondem',
  'Outro',
]

const ATIVIDADES_EXTRAS = [
  {
    servico: 'Celular Corporativo',
    copiaDe: 'Trocar Celular Corporativo',
    nome: 'Problemas com Celular Corporativo',
    descricao:
      'Reportar falha no celular corporativo em uso — aparelho, bateria, ' +
      'conectividade, aplicativo ou perda do equipamento.',
    troca: { Motivo: { t: 'combo', opcoes: MOTIVOS_CELULAR } },
  },
  {
    servico: 'Monitor',
    copiaDe: 'Solicitar Monitor',
    nome: 'Empréstimo do Monitor',
    descricao:
      'Cessão temporária de monitor para uso em atividade específica, ' +
      'com devolução prevista.',
    // o Motivo abaixo é o texto aberto do formulário: com os dois, o solicitante
    // preencheria a mesma coisa duas vezes
    exclui: /^descri[çc][ãa]o da solicita[çc][ãa]o$/i,
    inclui: [
      { n: 'Matrícula do Principal usuário do equipamento', t: 'texto' },
      { n: 'Motivo', t: 'textarea' },
    ],
  },
  {
    servico: 'Monitor',
    copiaDe: 'Trocar Monitor',
    nome: 'Mau Funcionamento do Monitor',
    descricao:
      'Reportar falha no monitor em uso — imagem, energia, conexão ou defeito físico.',
    troca: { Defeito: { t: 'combo', opcoes: DEFEITOS_MONITOR } },
  },
  {
    servico: 'Impressora',
    copiaDe: 'Configurar Impressora',
    nome: 'Trocar Tonner',
    descricao: 'Substituição de toner ou cartucho da impressora.',
    inclui: [{ n: 'Serial do Equipamento', t: 'texto' }],
  },
  {
    servico: 'Impressora',
    copiaDe: 'Configurar Impressora',
    nome: 'Remanejar Impressora',
    descricao: 'Mudança de impressora para outra sala, andar ou unidade.',
    inclui: [{ n: 'Serial do Equipamento', t: 'texto' }],
  },
]

// Serviço que não vem de planilha nenhuma: um card só para os periféricos, com o
// item escolhido no combo em vez de um card por equipamento.
const PERIFERICOS = [
  'Mouse',
  'Teclado',
  'Webcam',
  'Headset',
  'Microfone',
  'Dock Station',
  'Apresentador Laser',
]

const SERVICOS_EXTRAS = {
  'servicos_ti.json': [
    {
      nome: 'Periféricos',
      atividades: [
        ['Solicitar Periférico', 'Disponibilização de periférico para composição ou adequação do posto de trabalho.'],
        ['Trocar Periférico', 'Substituição de periférico por defeito, avaria ou obsolescência.'],
        ['Devolver Periférico', 'Devolução de periférico por desligamento, substituição ou reorganização do posto de trabalho.'],
      ].map(([nome, descricao]) => ({
        nome,
        descricao,
        sla: '16h',
        campos: [
          { n: 'Periférico', t: 'combo', opcoes: PERIFERICOS },
          { n: 'Descrição da Solicitação', t: 'textarea' },
        ],
      })),
    },
  ],
}

function atividadesExtras(servicos) {
  for (const e of ATIVIDADES_EXTRAS) {
    const servico = servicos.get(e.servico)
    const base = servico?.atividades.find((a) => a.nome === e.copiaDe)
    if (!base) continue

    servico.atividades.push({
      ...base,
      nome: e.nome,
      descricao: e.descricao,
      campos: [
        ...base.campos
          .filter((c) => !e.exclui?.test(c.n))
          .map((c) => (e.troca?.[c.n] ? { n: c.n, ...e.troca[c.n] } : c)),
        ...(e.inclui ?? []),
      ],
    })
  }
}

for (const [destino, servicos] of porDestino) {
  atividadesExtras(servicos)
  for (const s of SERVICOS_EXTRAS[destino] ?? []) servicos.set(s.nome, s)

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
