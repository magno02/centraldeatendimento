// node src/lib.check.js
import assert from 'node:assert/strict'
import { ATIVIDADES, PORTFOLIOS } from './catalogo.js'
import {
  novoProtocolo,
  buscar,
  filtrarServicos,
  contarPorStatus,
  deveMostrarTopo,
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

// todo select tem opções; toda atividade tem o dropdown de Oferta de Serviço
for (const a of ATIVIDADES) {
  for (const c of a.campos)
    if (typeof c === 'object' && c.t === 'select') assert.ok(c.opcoes?.length, a.nome)
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
