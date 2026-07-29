// Leitor de .xlsx sem dependência: o arquivo é um zip de XML, e ler o buffer em
// memória evita o lock do Excel quando a planilha está aberta.
import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'

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

const indice = (ref) =>
  [...ref.replace(/\d/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1

// Devolve uma lista de abas, cada uma como array de linhas (arrays de string).
export function lerPlanilha(caminho) {
  const zip = abrirZip(caminho)
  const ler = (p) => zip.get(p).toString('utf8')

  // <si> pode ter vários <t> quando a célula tem formatação parcial
  const textos = zip.has('xl/sharedStrings.xml')
    ? [...ler('xl/sharedStrings.xml').matchAll(tag('si'))].map(([, si]) =>
        desescapar([...si.matchAll(tag('t'))].map((m) => m[1]).join(''))
      )
    : []

  return [...zip.keys()]
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort()
    .map((caminhoAba) => {
      const linhas = []
      for (const [, corpo] of ler(caminhoAba).matchAll(tag('row'))) {
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
      return linhas
    })
}
