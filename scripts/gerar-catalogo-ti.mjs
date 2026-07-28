// Converte src/assets/Catalogo_Top_10_AXIA.xlsx em src/assets/servicos_ti.json.
// Rode com `node scripts/gerar-catalogo-ti.mjs` sempre que a planilha mudar.
//
// Lê o xlsx direto (é um zip de XML) para não precisar de dependência só por isto.
// Colunas usadas: Portfólio, Serviço, Atividade, Descrição, Campos, SLA de Resolução.
// Workflow e SLA de Resposta ficam de fora a pedido.
import { readFileSync, writeFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'

const ORIGEM = 'src/assets/Catalogo_Top_10_AXIA.xlsx'
const DESTINO = 'src/assets/servicos_ti.json'

// Descompactação em memória, sem shell: o xlsx costuma estar aberto no Excel, e
// ferramentas externas esbarram no lock do arquivo. Ler o buffer sempre funciona.
// Percorre o diretório central do zip (assinatura 0x02014b50) e infla cada entrada.
function abrirZip(caminho) {
  const buf = readFileSync(caminho)
  const fimDiretorio = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  let ponteiro = buf.readUInt32LE(fimDiretorio + 16)
  const arquivos = new Map()

  for (let i = 0; i < buf.readUInt16LE(fimDiretorio + 10); i++) {
    const metodo = buf.readUInt16LE(ponteiro + 10)
    const tamanhoComprimido = buf.readUInt32LE(ponteiro + 20)
    const tamNome = buf.readUInt16LE(ponteiro + 28)
    const tamExtra = buf.readUInt16LE(ponteiro + 30)
    const tamComentario = buf.readUInt16LE(ponteiro + 32)
    const inicioLocal = buf.readUInt32LE(ponteiro + 42)
    const nome = buf.toString('utf8', ponteiro + 46, ponteiro + 46 + tamNome)

    // o cabeçalho local repete os tamanhos de nome/extra, e eles podem diferir
    const dados =
      inicioLocal +
      30 +
      buf.readUInt16LE(inicioLocal + 26) +
      buf.readUInt16LE(inicioLocal + 28)
    const bruto = buf.subarray(dados, dados + tamanhoComprimido)
    arquivos.set(nome, metodo === 0 ? bruto : inflateRawSync(bruto))

    ponteiro += 46 + tamNome + tamExtra + tamComentario
  }
  return arquivos
}

const zip = abrirZip(ORIGEM)

const tag = (nome) =>
  new RegExp(`<(?:\\w+:)?${nome}[^>]*>(.*?)</(?:\\w+:)?${nome}>`, 'gs')

const desescapar = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&amp;/g, '&')

const ler = (p) => zip.get(p).toString('utf8')

// <si> pode ter vários <t> quando a célula tem formatação parcial
const textos = [...ler('xl/sharedStrings.xml').matchAll(tag('si'))].map(([, si]) =>
  desescapar([...si.matchAll(tag('t'))].map((m) => m[1]).join(''))
)

const indice = (ref) =>
  [...ref.replace(/\d/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1

const linhas = []
for (const [, corpo] of ler('xl/worksheets/sheet1.xml').matchAll(tag('row'))) {
  const celulas = []
  for (const m of corpo.matchAll(
    /<(?:\w+:)?c\b([^>]*)>(.*?)<\/(?:\w+:)?c>|<(?:\w+:)?c\b([^>]*)\/>/gs
  )) {
    const attrs = m[1] ?? m[3] ?? ''
    const ref = attrs.match(/r="([A-Z]+\d+)"/)?.[1]
    if (!ref) continue
    const v = (m[2] ?? '').match(/<(?:\w+:)?v>(.*?)<\/(?:\w+:)?v>/s)?.[1]
    celulas[indice(ref)] =
      attrs.includes('t="s"') && v != null ? textos[Number(v)] : desescapar(v ?? '')
  }
  linhas.push(celulas)
}

// linha 1 é o título da planilha, linha 2 são os cabeçalhos
const dados = linhas.slice(2).filter((r) => r[0])

const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Tipo do campo pelo nome: o que é texto livre vira textarea e o que é data vira date.
// Sem isso todo campo virava input de uma linha, inclusive "justificativa".
const tipoDoCampo = (nome) => {
  const n = nome.toLowerCase()
  if (/^data\b/.test(n)) return 'data'
  if (/justificativa|descrição|motivo|impacto|condição/.test(n)) return 'textarea'
  return 'texto'
}

const servicos = new Map()
for (const [, servico, atividade, descricao, , campos, sla] of dados) {
  if (!servicos.has(servico)) servicos.set(servico, { nome: servico, atividades: [] })
  servicos.get(servico).atividades.push({
    nome: atividade,
    descricao,
    sla,
    campos: campos
      .split(',')
      .map((c) => maiuscula(c.trim()))
      .filter(Boolean)
      .map((n) => ({ n, t: tipoDoCampo(n) })),
  })
}

const saida = {
  portfolio: dados[0][0],
  servicos: [...servicos.values()],
}

writeFileSync(DESTINO, JSON.stringify(saida, null, 2) + '\n')

const totalCampos = saida.servicos.reduce(
  (n, s) => n + s.atividades.reduce((m, a) => m + a.campos.length, 0),
  0
)
console.log(
  `ok — ${saida.portfolio}: ${saida.servicos.length} serviços, ` +
    `${saida.servicos.reduce((n, s) => n + s.atividades.length, 0)} atividades, ` +
    `${totalCampos} campos`
)
