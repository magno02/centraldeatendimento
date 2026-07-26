export const STATUS = ['Aberto', 'Andamento', 'Suspenso', 'Fechado']
export const CANCELADO = 'Cancelado'

const norm = (s) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// ponytail: sequência derivada dos tickets locais — troque por sequência do backend
// quando os tickets deixarem de viver só no localStorage (dois navegadores colidem).
export function novoProtocolo(tickets, hoje = new Date()) {
  const ano = hoje.getFullYear()
  const seq = tickets.filter((t) => t.protocolo.startsWith(`TK-${ano}-`)).length + 1
  return `TK-${ano}-${String(seq).padStart(5, '0')}`
}

export function buscar(atividades, termo) {
  const t = norm(termo.trim())
  if (!t) return []
  return atividades.filter((a) =>
    norm(
      [a.nome, a.servico.nome, a.portfolio.nome, ...(a.ofertas ?? [])].join(' ')
    ).includes(t)
  )
}

// Busca interna da aba: casa no nome do serviço ou de qualquer atividade dele.
export function filtrarServicos(servicos, termo) {
  const t = norm(termo.trim())
  if (!t) return servicos
  return servicos.filter((s) =>
    norm([s.nome, ...s.atividades.map((a) => a.nome)].join(' ')).includes(t)
  )
}

// Notificação = interação que não partiu do solicitante (atendente ou sistema).
// O id é derivado do protocolo + posição, então é estável entre sessões.
export function notificacoes(tickets) {
  return tickets
    .flatMap((t) =>
      t.interacoes.map((i, idx) => ({
        id: `${t.protocolo}#${idx}`,
        protocolo: t.protocolo,
        atividade: t.atividade,
        status: t.status,
        autor: i.autor,
        texto: i.texto,
        em: i.em,
      }))
    )
    .filter((n) => n.autor !== 'Solicitante')
    .sort((a, b) => b.em.localeCompare(a.em))
}

export function naoVisualizadas(ns, lidas) {
  const vistas = new Set(lidas)
  return ns.filter((n) => !vistas.has(n.id))
}

export function visualizadas(ns, lidas) {
  const vistas = new Set(lidas)
  return ns.filter((n) => vistas.has(n.id))
}

// Iniciais do avatar: ignora conectivos ("da", "de") e usa no máximo duas letras.
export function iniciais(nome) {
  const partes = nome.trim().split(/\s+/)
  const nomes = partes.filter((p) => p.length > 2)
  return (nomes.length ? nomes : partes)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

// Combobox: lista inteira quando não há termo; senão filtra ignorando acento e caixa.
export function filtrarOpcoes(opcoes, termo) {
  const t = norm(termo.trim())
  if (!t) return opcoes
  return opcoes.filter((o) => norm(o).includes(t))
}

// Favoritos e recentes guardam chaves ("Área/Serviço" ou "Área/Serviço/Atividade").
export const alternarFavorito = (favoritos, chave) =>
  favoritos.includes(chave)
    ? favoritos.filter((c) => c !== chave)
    : [chave, ...favoritos]

export const registrarRecente = (recentes, chave, max = 12) =>
  [chave, ...recentes.filter((c) => c !== chave)].slice(0, max)

// ponytail: "IA" é busca no catálogo, não modelo de linguagem — troque esta função
// por chamada à API do assistente quando existir; a UI do chat não muda.
export function responderIA(pergunta, atividades, max = 4) {
  const achados = buscar(atividades, pergunta).slice(0, max)
  if (!achados.length) {
    return {
      texto:
        'Não encontrei nenhum serviço com esses termos. Tente descrever de outro jeito — por exemplo "senha", "acesso", "notebook" ou o nome do sistema.',
      sugestoes: [],
    }
  }
  return {
    texto:
      achados.length === 1
        ? 'Encontrei esta atividade. Clique para abrir o formulário:'
        : `Encontrei ${achados.length} atividades relacionadas. Clique na que resolve seu caso:`,
    sugestoes: achados,
  }
}

export function contarPorStatus(tickets) {
  return Object.fromEntries(
    STATUS.map((s) => [s, tickets.filter((t) => t.status === s).length])
  )
}

// Botão "voltar ao topo": aparece ao subir, some ao descer, e nunca perto do topo.
export const deveMostrarTopo = (y, ultimoY, margem = 300) =>
  y < ultimoY && y > margem

// ponytail: SLA fixo de 3 dias úteis — troque pelo prazo do catálogo/contrato
// quando cada oferta de serviço tiver o seu.
export function prazoPrevisto(criadoEm, diasUteis = 3) {
  const d = new Date(criadoEm)
  let faltam = diasUteis
  while (faltam > 0) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) faltam--
  }
  return d.toISOString()
}

// Atendente do chamado: escolha determinística pelo protocolo, para o mesmo
// chamado mostrar sempre o mesmo responsável entre sessões.
export function atendenteDe(protocolo, atendentes) {
  const soma = [...protocolo].reduce((n, c) => n + c.charCodeAt(0), 0)
  return atendentes[soma % atendentes.length]
}

export function formatarTamanho(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const ultimaAtualizacao = (t) => t.interacoes?.at(-1)?.em || t.criadoEm

export function tempoRelativo(iso, agora = new Date()) {
  const min = Math.round((agora - new Date(iso)) / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const horas = Math.round(min / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias < 30) return `há ${dias} dia${dias > 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export const PERIODOS = {
  'Últimos 7 dias': 7,
  'Últimos 30 dias': 30,
  'Últimos 90 dias': 90,
  'Todo o período': null,
}

export const ORDENS = ['Mais recentes', 'Mais antigos', 'Prazo mais próximo']

export function filtrarChamados(
  tickets,
  { termo = '', status = 'Todos', servico = 'Todos', dias = null } = {},
  agora = new Date()
) {
  const t = norm(termo.trim())
  const limite = dias ? agora.getTime() - dias * 86400000 : null
  return tickets.filter((c) => {
    if (status !== 'Todos' && c.status !== status) return false
    if (servico !== 'Todos' && c.servico !== servico) return false
    if (limite && new Date(c.criadoEm).getTime() < limite) return false
    if (!t) return true
    const texto = [c.protocolo, c.atividade, c.servico, ...c.dados.map(([, v]) => v)]
    return norm(texto.join(' ')).includes(t)
  })
}

export function ordenarChamados(lista, ordem) {
  const copia = [...lista]
  if (ordem === 'Mais antigos') {
    return copia.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
  }
  if (ordem === 'Prazo mais próximo') {
    return copia.sort((a, b) =>
      prazoPrevisto(a.criadoEm).localeCompare(prazoPrevisto(b.criadoEm))
    )
  }
  return copia.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
}

export const ITENS_POR_PAGINA = [10, 25, 50, 100]

export const totalPaginas = (total, porPagina) =>
  Math.max(1, Math.ceil(total / porPagina))

// Página fora do intervalo é presa nos limites: filtrar pode encurtar a lista
// enquanto o usuário está numa página que deixou de existir.
export function paginar(lista, pagina, porPagina) {
  const p = Math.min(Math.max(1, pagina), totalPaginas(lista.length, porPagina))
  const inicio = (p - 1) * porPagina
  return lista.slice(inicio, inicio + porPagina)
}

export const podeInteragir = (t) => t.status !== 'Fechado' && t.status !== CANCELADO

export function comInteracao(ticket, autor, texto, em = new Date()) {
  return {
    ...ticket,
    interacoes: [
      ...ticket.interacoes,
      { autor, texto, em: em.toISOString() },
    ],
  }
}

export function cancelar(ticket, motivo, em = new Date()) {
  if (!podeInteragir(ticket)) return ticket
  return {
    ...comInteracao(ticket, 'Solicitante', `Solicitação cancelada. Motivo: ${motivo}`, em),
    status: CANCELADO,
  }
}
