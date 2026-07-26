// node src/lib.check.js
import assert from 'node:assert/strict'
import { ATIVIDADES, PORTFOLIOS, SERVICOS, POR_CHAVE } from './catalogo.js'
import { USUARIOS, GESTOR_DE, ATENDENTES } from './organizacao.js'
import {
  novoProtocolo,
  buscar,
  filtrarServicos,
  filtrarOpcoes,
  responderIA,
  alternarFavorito,
  registrarRecente,
  contarPorStatus,
  deveMostrarTopo,
  prazoPrevisto,
  formatarTamanho,
  atendenteDe,
  tempoRelativo,
  ultimaAtualizacao,
  filtrarChamados,
  ordenarChamados,
  paginar,
  totalPaginas,
  notificacoes,
  naoVisualizadas,
  visualizadas,
  iniciais,
  comInteracao,
  cancelar,
  podeInteragir,
  CANCELADO,
} from './lib.js'

const hoje = new Date('2026-07-24')
assert.equal(novoProtocolo([], hoje), 'TK-2026-00001')
assert.equal(
  novoProtocolo([{ protocolo: 'TK-2026-00001' }, { protocolo: 'TK-2025-00009' }], hoje),
  'TK-2026-00002'
)

// busca ignora acento e caixa, e alcança nome da atividade, serviço, área e ofertas
assert.ok(buscar(ATIVIDADES, 'SEGURANCA').length > 0)
assert.ok(buscar(ATIVIDADES, 'iot').length > 0)
assert.deepEqual(buscar(ATIVIDADES, '   '), [])
const umaOferta = ATIVIDADES.find((a) => a.ofertas.length)
assert.ok(buscar(ATIVIDADES, umaOferta.ofertas[0]).includes(umaOferta))

// todo usuário selecionável tem gestor cadastrado (o campo é somente leitura)
for (const u of USUARIOS) assert.ok(GESTOR_DE[u], u)

// combobox: sem termo devolve tudo, com termo filtra ignorando acento e caixa
assert.deepEqual(filtrarOpcoes(['São Paulo', 'Bahia'], ''), ['São Paulo', 'Bahia'])
assert.deepEqual(filtrarOpcoes(['São Paulo', 'Bahia'], 'sao'), ['São Paulo'])
assert.deepEqual(filtrarOpcoes(['São Paulo', 'Bahia'], 'AHI'), ['Bahia'])
assert.deepEqual(filtrarOpcoes(['São Paulo'], 'xyz'), [])

// assistente: devolve sugestões do catálogo, ou texto de "não encontrei"
const resposta = responderIA('acesso', ATIVIDADES)
assert.ok(resposta.sugestoes.length > 0 && resposta.sugestoes.length <= 4)
assert.ok(resposta.sugestoes.every((s) => s.chave && s.servico && s.portfolio))
const vazia = responderIA('zzzznaoexiste', ATIVIDADES)
assert.deepEqual(vazia.sugestoes, [])
assert.match(vazia.texto, /Não encontrei/)

// favoritos: alterna e não duplica; recentes: entra na frente, sem repetir, com teto
assert.deepEqual(alternarFavorito([], 'a/b'), ['a/b'])
assert.deepEqual(alternarFavorito(['a/b'], 'a/b'), [])
assert.deepEqual(alternarFavorito(['a/b'], 'c/d'), ['c/d', 'a/b'])
assert.deepEqual(registrarRecente(['x', 'y'], 'y'), ['y', 'x'])
assert.deepEqual(registrarRecente(['a', 'b', 'c'], 'd', 3), ['d', 'a', 'b'])

// chaves de favoritos/recentes resolvem para itens do catálogo
const umServico = PORTFOLIOS[0].servicos[0]
assert.equal(POR_CHAVE.get(umServico.chave).tipo, 'servico')
assert.equal(POR_CHAVE.get(umServico.atividades[0].chave).tipo, 'atividade')
assert.equal(POR_CHAVE.get('Área/Serviço/Inexistente'), undefined)
assert.equal(POR_CHAVE.size, SERVICOS.length + ATIVIDADES.length)
// chave globalmente única: é o key do React em busca, favoritos e recentes,
// onde itens de áreas diferentes aparecem na mesma lista.
const chaves = [...SERVICOS, ...ATIVIDADES].map((i) => i.chave)
assert.equal(new Set(chaves).size, chaves.length)

// iniciais do avatar
assert.equal(iniciais('João da Silva'), 'JS')
assert.equal(iniciais('Ana'), 'A')
assert.equal(iniciais('  maria helena de souza '), 'MH')

// notificações: interações de atendente/sistema, mais novas primeiro, id estável
const ticketNotif = {
  protocolo: 'TK-2026-00007',
  atividade: 'Reset de senha',
  status: 'Andamento',
  interacoes: [
    { autor: 'Sistema', texto: 'Registrada.', em: '2026-07-20T10:00:00.000Z' },
    { autor: 'Solicitante', texto: 'Urgente.', em: '2026-07-21T10:00:00.000Z' },
    { autor: 'Atendente', texto: 'Em análise.', em: '2026-07-22T10:00:00.000Z' },
  ],
}
const ns = notificacoes([ticketNotif])
assert.equal(ns.length, 2) // a fala do solicitante não gera notificação
assert.equal(ns[0].autor, 'Atendente') // ordem decrescente por data
assert.deepEqual(
  ns.map((n) => n.id),
  ['TK-2026-00007#2', 'TK-2026-00007#0']
)
assert.equal(naoVisualizadas(ns, []).length, 2)
assert.equal(naoVisualizadas(ns, ['TK-2026-00007#2']).length, 1)
assert.equal(visualizadas(ns, ['TK-2026-00007#2'])[0].id, 'TK-2026-00007#2')
assert.equal(
  naoVisualizadas(ns, ns.map((n) => n.id)).length + visualizadas(ns, []).length,
  0
)

// prazo previsto: 3 dias úteis, pulando fim de semana
assert.equal(
  prazoPrevisto('2026-07-20T12:00:00.000Z').slice(0, 10), // segunda
  '2026-07-23'
)
assert.equal(
  prazoPrevisto('2026-07-23T12:00:00.000Z').slice(0, 10), // quinta -> terça
  '2026-07-28'
)

// lista de chamados: filtros combinam e ordenação respeita a escolha
const chamados = [
  {
    protocolo: 'TK-2026-00001',
    atividade: 'Reset de senha',
    servico: 'Acessos',
    status: 'Aberto',
    criadoEm: '2026-07-01T10:00:00.000Z',
    dados: [['Descrição da necessidade', 'Não consigo entrar no SAP']],
    interacoes: [{ autor: 'Sistema', texto: 'ok', em: '2026-07-01T10:00:00.000Z' }],
  },
  {
    protocolo: 'TK-2026-00002',
    atividade: 'Nova caixa postal',
    servico: 'Correio',
    status: 'Fechado',
    criadoEm: '2026-07-20T10:00:00.000Z',
    dados: [['Descrição da necessidade', 'Caixa compartilhada']],
    interacoes: [],
  },
]
const agora = new Date('2026-07-25T10:00:00.000Z')
assert.equal(filtrarChamados(chamados, {}, agora).length, 2)
assert.equal(filtrarChamados(chamados, { status: 'Aberto' }, agora).length, 1)
assert.equal(filtrarChamados(chamados, { servico: 'Correio' }, agora).length, 1)
assert.equal(filtrarChamados(chamados, { dias: 7 }, agora).length, 1) // só o de 20/07
assert.equal(filtrarChamados(chamados, { termo: 'SAP' }, agora).length, 1) // busca na descrição
assert.equal(filtrarChamados(chamados, { termo: '00002' }, agora).length, 1) // e no protocolo
assert.equal(
  filtrarChamados(chamados, { termo: 'SAP', status: 'Fechado' }, agora).length,
  0 // filtros se somam
)
assert.equal(ordenarChamados(chamados, 'Mais recentes')[0].protocolo, 'TK-2026-00002')
assert.equal(ordenarChamados(chamados, 'Mais antigos')[0].protocolo, 'TK-2026-00001')
assert.deepEqual(chamados.map((c) => c.protocolo), [
  'TK-2026-00001',
  'TK-2026-00002',
]) // ordenar não muta

// paginação
const dez = Array.from({ length: 23 }, (_, i) => i + 1)
assert.equal(totalPaginas(23, 10), 3)
assert.equal(totalPaginas(0, 10), 1) // lista vazia ainda é "página 1 de 1"
assert.deepEqual(paginar(dez, 1, 10)[0], 1)
assert.equal(paginar(dez, 3, 10).length, 3) // última página parcial
assert.deepEqual(paginar(dez, 99, 10), paginar(dez, 3, 10)) // página além do fim
assert.deepEqual(paginar(dez, 0, 10), paginar(dez, 1, 10)) // e antes do início
assert.deepEqual(paginar([], 1, 10), [])

assert.equal(ultimaAtualizacao(chamados[0]), '2026-07-01T10:00:00.000Z')
assert.equal(ultimaAtualizacao(chamados[1]), '2026-07-20T10:00:00.000Z') // sem interação, cai na criação
assert.equal(tempoRelativo('2026-07-25T09:00:00.000Z', agora), 'há 1 h')
assert.equal(tempoRelativo('2026-07-23T10:00:00.000Z', agora), 'há 2 dias')

// atendente: sempre da lista e estável para o mesmo protocolo
assert.ok(ATENDENTES.includes(atendenteDe('TK-2026-00003', ATENDENTES)))
assert.equal(
  atendenteDe('TK-2026-00003', ATENDENTES),
  atendenteDe('TK-2026-00003', ATENDENTES)
)

// tamanho de anexo
assert.equal(formatarTamanho(0), '')
assert.equal(formatarTamanho(512), '512 B')
assert.equal(formatarTamanho(131072), '128 KB')
assert.equal(formatarTamanho(5 * 1024 * 1024), '5.0 MB')

// botão voltar ao topo: subindo mostra, descendo esconde, perto do topo nunca
assert.equal(deveMostrarTopo(800, 900), true)
assert.equal(deveMostrarTopo(900, 800), false)
assert.equal(deveMostrarTopo(120, 400), false) // subiu, mas já está perto do topo
assert.equal(deveMostrarTopo(500, 500), false) // parado

// filtro interno da aba: nome do serviço e nome de atividade, termo vazio devolve tudo
const area = PORTFOLIOS.find((p) => p.servicos.length > 5)
assert.equal(filtrarServicos(area.servicos, '  ').length, area.servicos.length)
const alvo = area.servicos[0]
assert.ok(filtrarServicos(area.servicos, alvo.nome).includes(alvo))
assert.ok(filtrarServicos(area.servicos, alvo.atividades[0].nome).includes(alvo))
assert.deepEqual(filtrarServicos(area.servicos, 'zzzznaoexiste'), [])

assert.deepEqual(contarPorStatus([{ status: 'Aberto' }, { status: 'Fechado' }]), {
  Aberto: 1,
  Andamento: 0,
  Suspenso: 0,
  Fechado: 1,
})

// interações e cancelamento
const t0 = { protocolo: 'TK-2026-00001', status: 'Aberto', interacoes: [] }
const t1 = comInteracao(t0, 'Atendente', 'Em análise.')
assert.equal(t1.interacoes.length, 1)
assert.deepEqual(t0.interacoes, []) // imutável

const t2 = cancelar(t1, 'Pedido em duplicidade')
assert.equal(t2.status, CANCELADO)
assert.match(t2.interacoes.at(-1).texto, /duplicidade/)
assert.equal(podeInteragir(t2), false)
assert.equal(cancelar(t2, 'de novo'), t2) // já cancelado: nada muda
assert.equal(podeInteragir({ status: 'Fechado' }), false)
assert.equal(podeInteragir({ status: 'Suspenso' }), true)

// todo select/combo tem opções; toda atividade tem o campo de Oferta de Serviço
for (const a of ATIVIDADES) {
  for (const c of a.campos)
    if (typeof c === 'object' && ['select', 'combo'].includes(c.t))
      assert.ok(c.opcoes?.length, a.nome)
  const oferta = a.campos.find((c) => c.n === 'Oferta de Serviço')
  assert.deepEqual(oferta.opcoes, a.ofertas, a.nome)
}

// sem cards duplicados: serviço único na área, atividade única no serviço
for (const p of PORTFOLIOS) {
  const servicos = p.servicos.map((s) => s.nome)
  assert.equal(new Set(servicos).size, servicos.length, p.nome)
  for (const s of p.servicos) {
    const ats = s.atividades.map((a) => a.nome)
    assert.equal(new Set(ats).size, ats.length, `${p.nome} / ${s.nome}`)
  }
}

console.log(
  `ok — ${PORTFOLIOS.length} áreas, ` +
    `${PORTFOLIOS.reduce((n, p) => n + p.servicos.length, 0)} serviços, ` +
    `${ATIVIDADES.length} atividades`
)
