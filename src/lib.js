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

export function contarPorStatus(tickets) {
  return Object.fromEntries(
    STATUS.map((s) => [s, tickets.filter((t) => t.status === s).length])
  )
}

// Botão "voltar ao topo": aparece ao subir, some ao descer, e nunca perto do topo.
export const deveMostrarTopo = (y, ultimoY, margem = 300) =>
  y < ultimoY && y > margem

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
