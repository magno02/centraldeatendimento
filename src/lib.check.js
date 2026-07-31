// node src/lib.check.js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ATIVIDADES,
  ATIVIDADES_VISIVEIS,
  PORTFOLIOS,
  SERVICOS,
  POR_CHAVE,
  GRUPOS,
} from './catalogo.js'
import { USUARIOS, GESTOR_DE, ATENDENTES } from './organizacao.js'
import {
  novoProtocolo,
  buscar,
  filtrarServicos,
  filtrarOpcoes,
  responderIA,
  chaveIcone,
  iconeAtividade,
  CHAVES_ICONE,
  artigoDe,
  prazoLegivel,
  validarLogin,
  CONTAS,
  alternarFavorito,
  registrarRecente,
  contarPorStatus,
  doUsuario,
  ofertasDoServico,
  filtrarOfertas,
  buscarConversa,
  chaveOferta,
  registrarAcesso,
  maisAcessadas,
  deveMostrarTopo,
  prazoPrevisto,
  formatarTamanho,
  atendenteDe,
  tempoRelativo,
  dataCurta,
  diasUteisAte,
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
  concluirAtendimento,
  aguardandoConfirmacao,
  resolver,
  reabrir,
  avaliar,
  CANCELADO,
  STATUS,
  STATUS_PAINEL,
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

// login simulado: devolve a conta (ignorando caixa/espaço no e-mail) ou null
for (const conta of CONTAS) {
  assert.equal(validarLogin(conta.email, conta.senha), conta)
  assert.equal(validarLogin(` ${conta.email.toUpperCase()} `, conta.senha), conta)
  assert.equal(validarLogin(conta.email, 'errada'), null)
  // cada conta entra com o próprio perfil, não com o do vizinho
  assert.ok(conta.nome && conta.empresa && conta.estado && conta.area)
}
assert.equal(validarLogin('joao.silva', 'axia@2026'), null) // precisa do domínio
assert.equal(validarLogin('', ''), null)
assert.equal(new Set(CONTAS.map((c) => c.email)).size, CONTAS.length) // sem e-mail repetido

// ícones: toda regra devolve chave existente e os exemplos batem com o esperado
assert.equal(chaveIcone('Reset de senha'), 'senha')
assert.equal(chaveIcone('Cibersegurança de TI'), 'escudo')
assert.equal(chaveIcone('Correio Eletrônico'), 'email')
assert.equal(chaveIcone('Infraestrutura SAP'), 'servidor') // infraestrutura vence SAP
assert.equal(chaveIcone('Adobe Photoshop'), 'janela') // nome de software cai no padrão
assert.equal(chaveIcone('Operação SIEM'), 'escudo')
assert.equal(chaveIcone('Serviços de Configuração DNS'), 'rede')
for (const s of SERVICOS) assert.ok(CHAVES_ICONE.includes(chaveIcone(s.nome)), s.nome)
// serviços da planilha também: eles não estão em SERVICOS
for (const g of GRUPOS)
  for (const s of g.servicos)
    assert.ok(CHAVES_ICONE.includes(chaveIcone(s.nome)), s.nome)

// atividade tem ícone próprio: o card usava o nome do serviço e as 20 do SAP
// saíam todas com o mesmo desenho
{
  const sap = ATIVIDADES_VISIVEIS.filter((a) => a.servico.nome === 'SAP')
  const chaves = sap.map((a) => iconeAtividade(a.nome, a.servico.nome).chave)
  for (const c of chaves) assert.ok(CHAVES_ICONE.includes(c), c)
  assert.ok(new Set(chaves).size >= sap.length - 4, [...new Set(chaves)].join())
  assert.deepEqual(iconeAtividade('Reportar lentidão no SAP', 'SAP'), {
    chave: 'velocimetro',
    selo: null, // atividade com desenho próprio não ganha selo
  })
  // ícone composto: a regra manda o selo e o verbo "Solicitar" não sobrepõe
  assert.deepEqual(iconeAtividade('Solicitar revogação de acesso SAP', 'SAP'), {
    chave: 'cadeado',
    selo: 'x',
  })
  // atividade genérica sem palavra-chave herda o ícone do serviço
  assert.equal(iconeAtividade('Solicitar análise', 'Backup e Restore').chave, 'backup')

  // mesmo objeto, verbos diferentes: o selo é o que separa os três cards
  const impressora = ['Solicitar', 'Trocar', 'Devolver'].map(
    (v) => iconeAtividade(`${v} Impressora`, 'Impressora').selo
  )
  assert.deepEqual(impressora, ['mais', 'troca', 'devolucao'])
  for (const c of ATIVIDADES_VISIVEIS.map((a) => iconeAtividade(a.nome, a.servico.nome)))
    assert.ok(CHAVES_ICONE.includes(c.chave), c.chave)
}

// data curta da lista de chamados: hora só nos últimos dois dias
{
  const agora = new Date('2026-07-24T15:00:00')
  assert.match(dataCurta('2026-07-24T10:24:00', agora), /^Hoje, \d{2}:\d{2}$/)
  assert.match(dataCurta('2026-07-23T09:15:00', agora), /^Ontem, \d{2}:\d{2}$/)
  assert.equal(dataCurta('2026-07-14T09:15:00', agora), '14/07/2026')
  // 23:59 de ontem ainda é "Ontem", e não "há 15 horas": o corte é por dia civil
  assert.match(dataCurta('2026-07-23T23:59:00', agora), /^Ontem/)
}

// prazo em dias úteis: fim de semana não conta
{
  const sexta = new Date('2026-07-24T09:00:00') // 24/07/2026 é sexta
  assert.equal(diasUteisAte('2026-07-24T18:00:00', sexta), 0) // vence hoje
  assert.equal(diasUteisAte('2026-07-23T18:00:00', sexta), -1) // vencido
  assert.equal(diasUteisAte('2026-07-27T09:00:00', sexta), 1) // segunda: pula o fim de semana
  assert.equal(diasUteisAte('2026-07-29T09:00:00', sexta), 3)
}

// SLA legível: horas para prazos curtos, dias úteis acima de 12h (8h = 1 dia útil)
assert.equal(prazoLegivel('4h'), '4 horas')
assert.equal(prazoLegivel('8h'), '8 horas')
assert.equal(prazoLegivel('12h'), '12 horas')
assert.equal(prazoLegivel('16h'), '2 dias úteis')
assert.equal(prazoLegivel('24h'), '3 dias úteis')
assert.equal(prazoLegivel('40h'), '5 dias úteis')
assert.equal(prazoLegivel('13h'), '2 dias úteis') // primeiro degrau acima de 12h
assert.equal(prazoLegivel('Sem SLA definido'), 'Sem SLA definido') // sem número, passa direto
assert.equal(prazoLegivel('Não identificado'), 'Não identificado')
// todo SLA do catálogo precisa virar texto, nunca "undefined" ou "NaN"
for (const g of GRUPOS)
  for (const s of g.servicos)
    for (const a of s.atividades)
      if (a.sla) assert.doesNotMatch(prazoLegivel(a.sla), /NaN|undefined/, a.nome)

// artigo do placeholder: gênero pelo substantivo-núcleo, que é a primeira palavra
assert.equal(artigoDe('Gestor'), 'o')
assert.equal(artigoDe('Matrícula'), 'a')
assert.equal(artigoDe('Centro de custo'), 'o') // núcleo é "centro", não "custo"
assert.equal(artigoDe('Data necessária'), 'a')
assert.equal(artigoDe('Conexão'), 'a') // -ão feminino
assert.equal(artigoDe('Padrão de idioma'), 'o') // -ão masculino
assert.equal(artigoDe('Conexões'), 'as')
assert.equal(artigoDe('Softwares necessários'), 'os')
assert.equal(artigoDe('Unidade'), 'a')
assert.equal(artigoDe('Sistema operacional'), 'o') // exceção: -a masculino
assert.equal(artigoDe('Fonte e cabos'), 'a') // exceção: -e feminino
// nenhum rótulo do catálogo pode ficar sem artigo
for (const g of GRUPOS)
  for (const s of g.servicos)
    for (const a of s.atividades)
      for (const c of a.campos) {
        const rotulo = typeof c === 'string' ? c : c.n
        assert.match(artigoDe(rotulo), /^(o|a|os|as)$/, rotulo)
      }

// os periféricos do catálogo de TI têm ícone próprio, e não o genérico de notebook
assert.equal(chaveIcone('Monitor'), 'monitor')
assert.equal(chaveIcone('Mouse'), 'mouse')
assert.equal(chaveIcone('Teclado'), 'teclado')
assert.equal(chaveIcone('Headset'), 'headset')
assert.equal(chaveIcone('Webcam'), 'webcam')
assert.equal(chaveIcone('Docking Station'), 'docking')
assert.equal(chaveIcone('Desktop'), 'desktop')
assert.equal(chaveIcone('Monitoramento de ativos'), 'pulso') // não confundir com Monitor

// toda chave precisa de um desenho em icones.jsx, senão o ícone cai no fallback
// silenciosamente. Lido como texto porque o arquivo é JSX e não importa aqui.
const desenhos = readFileSync(new URL('./icones.jsx', import.meta.url), 'utf8')
for (const chave of CHAVES_ICONE)
  assert.ok(
    new RegExp(`^\\s{2}${chave}:`, 'm').test(desenhos),
    `sem desenho para o ícone "${chave}"`
  )

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
const umServico = GRUPOS[0].servicos[0]
assert.equal(POR_CHAVE.get(umServico.chave).tipo, 'servico')
assert.equal(POR_CHAVE.get(umServico.atividades[0].chave).tipo, 'atividade')
assert.equal(POR_CHAVE.get('Área/Serviço/Inexistente'), undefined)
// só o que está em alguma aba: resolver uma chave de área fora do portal levaria
// a uma tela sem caminho de volta
const SERVICOS_EM_ABA = GRUPOS.flatMap((g) => g.servicos)
assert.equal(
  POR_CHAVE.size,
  SERVICOS_EM_ABA.length + ATIVIDADES_VISIVEIS.length
)
// chave globalmente única: é o key do React em busca, favoritos e recentes,
// onde itens de áreas diferentes aparecem na mesma lista.
const chaves = [...SERVICOS_EM_ABA, ...ATIVIDADES_VISIVEIS].map((i) => i.chave)
assert.equal(new Set(chaves).size, chaves.length)

// as três abas do portal, e as removidas que não podem voltar por nenhum caminho
const nomesAbas = GRUPOS.map((g) => g.nome)
assert.deepEqual(nomesAbas, ['Serviços de TI', 'Segurança', 'Dados e Automação'])
assert.ok(!nomesAbas.includes('Suporte e Infraestrutura'))
assert.ok(!nomesAbas.includes('Sistemas Corporativos')) // virou parte de Serviços de TI

// os itens de configuração da planilha Top 10 que sobraram como card próprio: os
// periféricos viraram opção do combo em "Periféricos" e o Desktop saiu do portal,
// os dois pelo SERVICOS_FORA do gerador.
const HARDWARE = ['Notebook', 'Monitor', 'Impressora', 'Celular Corporativo']

// catálogo de planilha: atividade é o card, com descrição, SLA e campos próprios
{
  const ti = GRUPOS.find((g) => g.nome === 'Serviços de TI')
  const daPlanilha = ti.servicos.filter(
    (s) =>
      ['SAP', 'Gestão de Acesso', 'Periféricos'].includes(s.nome) ||
      HARDWARE.includes(s.nome)
  )

  // 4 de hardware + Periféricos + Gestão de Acesso + SAP
  assert.equal(ti.servicos.length, 7)
  assert.equal(ti.servicos.length, daPlanilha.length)

  // Periféricos não vem de planilha: é o combo que diz qual equipamento é
  {
    const p = ti.servicos.find((s) => s.nome === 'Periféricos')
    assert.equal(p.atividades.length, 3)
    for (const a of p.atividades) {
      const combo = a.campos.find((c) => c.n === 'Periférico')
      assert.equal(combo.t, 'combo')
      assert.equal(combo.opcoes.length, 7)
      assert.ok(a.campos.some((c) => c.n === 'Descrição da Solicitação'), a.nome)
    }
    // os cards que viraram opção do combo não podem ter sobrado no portal
    for (const nome of ['Mouse', 'Teclado', 'Webcam', 'Headset', 'Docking Station'])
      assert.ok(!ti.servicos.some((s) => s.nome === nome), nome)
  }
  // solicitar / trocar / devolver, mais o que o atividadesExtras do gerador acrescenta
  const EXTRAS = { 'Celular Corporativo': 1, Monitor: 2, Impressora: 2 }
  for (const s of ti.servicos.filter((s) => HARDWARE.includes(s.nome)))
    assert.equal(s.atividades.length, 3 + (EXTRAS[s.nome] ?? 0), s.nome)

  // o combo de motivo é o que separa "Problemas com" de "Trocar", que herda o resto
  {
    const problemas = ti.servicos
      .find((s) => s.nome === 'Celular Corporativo')
      .atividades.find((a) => a.nome === 'Problemas com Celular Corporativo')
    const motivo = problemas.campos.find((c) => c.n === 'Motivo')
    assert.equal(motivo.t, 'combo')
    assert.equal(motivo.opcoes.length, 11)
    assert.equal(motivo.opcoes.at(-1), 'Outro')
  }

  // Gestão de Acesso só pode ter o que veio da planilha: 10 atividades, e nenhuma
  // com a assinatura do estrutura_axia (ofertas + campo "Oferta de Serviço").
  assert.ok(!ti.servicos.some((s) => s.nome === 'Desktop'))

  const acesso = ti.servicos.find((s) => s.nome === 'Gestão de Acesso')
  assert.equal(acesso.atividades.length, 10)

  // Ambiente é marcação múltipla, e os três campos abaixo saíram do formulário
  for (const a of acesso.atividades) {
    const ambiente = a.campos.find((c) => c.n === 'Ambiente')
    if (ambiente)
      assert.deepEqual(ambiente, {
        n: 'Ambiente',
        t: 'checkbox',
        opcoes: ['Desenvolvimento', 'Homologação', 'Produção'],
      })
    assert.ok(
      !a.campos.some((c) => /perfil ou funcionalidade|vigência|centro de custo/i.test(c.n)),
      a.nome
    )
    // Sistema é lista fechada nas dez, inclusive onde a planilha chama de
    // "Sistema afetado" — que é o mesmo campo com outro rótulo
    const sistema = a.campos.find((c) => /^sistema/i.test(c.n))
    assert.equal(sistema.t, 'combo', a.nome)
    assert.equal(sistema.opcoes.length, 10, a.nome)
    assert.equal(sistema.opcoes[0], 'SAP ECC / S/4HANA', a.nome)
  }

  // prazo por localidade: as cinco de Monitor e as três de Notebook, para os cards
  // ficarem iguais na fileira. Nenhum outro serviço tem, senão o card muda sozinho.
  {
    const COM_PRAZO = ['Monitor', 'Notebook']
    // só os dias: as notas de texto são conferidas logo abaixo
    const diasDe = (n) => {
      const { prazos } = ATIVIDADES_VISIVEIS.find((a) => a.nome === n)
      return { recife: prazos.recife, demais: prazos.demais }
    }
    assert.deepEqual(diasDe('Solicitar Monitor'), { recife: 3, demais: 20 })
    assert.deepEqual(diasDe('Trocar Monitor'), { recife: 2, demais: 10 })
    assert.deepEqual(diasDe('Devolver Monitor'), { recife: 2, demais: 7 })
    assert.deepEqual(diasDe('Empréstimo do Monitor'), { recife: 3, demais: 20 })
    assert.deepEqual(diasDe('Mau Funcionamento do Monitor'), { recife: 2, demais: 10 })
    assert.deepEqual(diasDe('Solicitar Notebook'), { recife: 3, demais: 20 })
    assert.deepEqual(diasDe('Trocar Notebook'), { recife: 2, demais: 10 })
    assert.deepEqual(diasDe('Devolver Notebook'), { recife: 2, demais: 7 })

    for (const a of ATIVIDADES_VISIVEIS) {
      assert.equal(!!a.prazos, COM_PRAZO.includes(a.servico.nome), a.chave)
      // as duas notas do modal: sem uma delas ele abriria pela metade
      if (a.prazos) {
        assert.ok(a.prazos.porqueRecife?.length > 40, a.nome)
        assert.ok(a.prazos.porqueDemais?.length > 40, a.nome)
      }
    }
  }
  for (const a of acesso.atividades) {
    assert.deepEqual(a.ofertas, [], a.nome)
    assert.ok(!a.campos.some((c) => c.n === 'Oferta de Serviço'), a.nome)
    assert.ok(a.chave.startsWith('Serviços de TI/Gestão de Acesso/'), a.chave)
  }

  for (const s of daPlanilha) {
    for (const a of s.atividades) {
      assert.ok(a.descricao, a.nome)
      assert.ok(a.sla, a.nome)
      assert.ok(a.campos.length, a.nome)
      assert.deepEqual(a.ofertas, []) // sem oferta: o card já é a atividade
      // campo sem nome viraria label vazia no formulário
      for (const c of a.campos) assert.ok(c.n?.trim(), `${a.nome}: campo sem nome`)
    }
  }
}

// SLA do catálogo sai da coluna "SLA de Resolução", nunca da de resposta. Na planilha
// de Gestão de Acesso o par Resposta/Resolução vem duplicado e vale o segundo, o prazo
// ampliado — se o gerador voltar a ler a coluna errada, estes valores caem.
{
  const ti = GRUPOS.find((g) => g.nome === 'Serviços de TI')
  const acesso = ti.servicos.find((s) => s.nome === 'Gestão de Acesso')
  const sla = (nome) => acesso.atividades.find((a) => a.nome === nome).sla
  assert.equal(sla('Solicitar novo acesso'), '32h úteis') // 1º par: 16h, resposta: 8h
  assert.equal(sla('Redefinir senha'), '4h úteis') // 1º par: 2h, resposta: 2h

  const sap = ti.servicos.find((s) => s.nome === 'SAP')
  const slaSap = (nome) => sap.atividades.find((a) => a.nome === nome).sla
  assert.equal(slaSap('Reportar indisponibilidade do SAP'), '8h') // resposta: 30 min
  assert.equal(slaSap('Solicitar criação de usuário SAP'), '32h úteis') // resposta: 8h úteis
}

// A aba de TI é 100% planilha: nada do estrutura_axia entra nela, e os sistemas
// corporativos de lá (Benner, Salesforce, SIP, V360, Intranet) não têm mais card.
{
  const ti = GRUPOS.find((g) => g.nome === 'Serviços de TI')
  // ordem da aba é alfabética, sem card fixado na frente
  const nomes = ti.servicos.map((s) => s.nome)
  assert.deepEqual(nomes, [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')))
  for (const s of ti.servicos) {
    const atividades = s.atividades.map((a) => a.nome)
    assert.equal(new Set(atividades).size, atividades.length, s.nome)
    assert.ok(s.chave.startsWith('Serviços de TI/'), s.chave)
  }

  // SAP só pode ter o que veio da planilha: 20 atividades. Nenhuma pode ter vindo do
  // estrutura_axia, onde a atividade traz "Oferta de Serviço" e ofertas — era assim
  // que os cards antigos de SAP eram montados.
  const sap = ti.servicos.find((s) => s.nome === 'SAP')
  assert.equal(sap.atividades.length, 20)
  for (const a of sap.atividades) {
    assert.deepEqual(a.ofertas, [], a.nome)
    assert.ok(!a.campos.some((c) => c.n === 'Oferta de Serviço'), a.nome)
    assert.ok(a.chave.startsWith('Serviços de TI/SAP/'), a.chave)
  }

  // as áreas de sistema corporativo saíram do portal por completo
  const areas = GRUPOS.flatMap((g) => g.servicos.map((s) => s.portfolio.nome))
  for (const fora of [
    'SAP',
    'Sistemas Corporativos',
    'VID > Benner',
    'VID > Salesforce',
    'Salesforce',
    'VID > SIP',
    'CSC > Sustentação de Aplicações',
  ])
    assert.ok(!areas.includes(fora), fora)
  // e nenhuma chave delas resolve mais: um favorito antigo não pode reabrir o card.
  // "VID > Governança" fica de fora da lista — essa área continua na aba de Dados.
  for (const prefixo of [
    'SAP/',
    'Sistemas Corporativos/',
    'VID > Benner/',
    'VID > Salesforce/',
    'VID > SIP/',
    'Salesforce/',
    'CSC > Sustentação de Aplicações/',
  ])
    assert.equal([...POR_CHAVE.keys()].filter((k) => k.startsWith(prefixo)).length, 0)
}

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
  Pendente: 0,
  'Aguardando aprovação': 0,
  Fechado: 1,
})

// os indicadores do portal são um recorte do STATUS, nunca um status inventado
assert.ok(STATUS_PAINEL.every((s) => STATUS.includes(s)))
assert.ok(!STATUS_PAINEL.includes('Aberto'))
// o painel é 2x2 no celular e 1x4 no desktop: um número ímpar deixaria a última
// fila com um indicador solto, e a régua de divisórias do App.jsx é por índice
assert.equal(STATUS_PAINEL.length, 4)

// cada oferta vira um card; atividade sem oferta continua sendo um card só
{
  const servico = {
    atividades: [
      { id: 'A', ofertas: ['Conceder', 'Revogar'] },
      { id: 'B', ofertas: [] },
    ],
  }
  const cards = ofertasDoServico(servico)
  assert.equal(cards.length, 3)
  assert.deepEqual(
    cards.map((c) => c.oferta),
    ['Conceder', 'Revogar', null]
  )
  // o formulário precisa da atividade junto para saber quais campos montar
  assert.equal(cards[0].atividade.id, 'A')

  // nenhum serviço do catálogo real pode gerar zero cards: sumiria da tela
  for (const s of SERVICOS) assert.ok(ofertasDoServico(s).length, s.nome)
}

// Busca do chat: a saudação promete entender frase, então as frases dela e os pedidos
// mais comuns têm que devolver a atividade certa em primeiro lugar. `buscar`, que casa
// a frase inteira como substring, devolvia zero para todas estas.
{
  const primeira = (p) => buscarConversa(ATIVIDADES_VISIVEIS, p)[0]?.nome
  assert.equal(primeira('resetar senha do SAP'), 'Redefinir senha SAP')
  assert.equal(primeira('preciso de um monitor novo'), 'Trocar Monitor')
  // teclado virou opção do combo de "Periférico" e a busca acha por ela
  assert.equal(primeira('meu teclado quebrou'), 'Trocar Periférico')
  // sem verbo na frase os três empatam: basta cair no serviço certo
  assert.match(primeira('preciso de um mouse'), /Periférico/)
  assert.equal(primeira('SAP está lento'), 'Reportar lentidão no SAP')
  assert.equal(primeira('minha conta está bloqueada'), 'Conta bloqueada indevidamente')
  assert.equal(primeira('quero devolver o notebook'), 'Devolver Notebook')
  assert.match(primeira('solicitar acesso à rede'), /rede/i)
  // só palavra vazia ou radical curto: melhor não sugerir do que despejar o catálogo
  assert.deepEqual(buscarConversa(ATIVIDADES_VISIVEIS, 'oi'), [])
  assert.deepEqual(buscarConversa(ATIVIDADES_VISIVEIS, 'por favor'), [])
  assert.deepEqual(buscarConversa(ATIVIDADES_VISIVEIS, 'xyzabc'), [])
}

// busca dentro do serviço: casa na oferta, no nome e na descrição da atividade
{
  const cards = [
    { atividade: { nome: 'Gestão de acessos', descricao: 'Perfis do sistema' }, oferta: 'Conceder acesso' },
    { atividade: { nome: 'Gestão de acessos', descricao: 'Perfis do sistema' }, oferta: 'Revogar acesso' },
    { atividade: { nome: 'Redefinir senha', descricao: 'Quando o usuário não recupera' }, oferta: null },
  ]
  assert.equal(filtrarOfertas(cards, '').length, 3) // sem termo, lista inteira
  assert.equal(filtrarOfertas(cards, '   ').length, 3) // só espaço também
  assert.equal(filtrarOfertas(cards, 'revogar').length, 1) // casa na oferta
  assert.equal(filtrarOfertas(cards, 'senha').length, 1) // casa no nome da atividade
  assert.equal(filtrarOfertas(cards, 'perfis').length, 2) // casa na descrição
  assert.equal(filtrarOfertas(cards, 'GESTAO').length, 2) // ignora acento e caixa
  assert.equal(filtrarOfertas(cards, 'inexistente').length, 0)
  // card sem oferta não pode estourar por causa do null
  assert.equal(filtrarOfertas([cards[2]], 'redefinir').length, 1)
}

// mais acessadas: frequência por card, e não por atividade
{
  const a1 = { chave: 'Area/Serv/Ativ', nome: 'Ativ' }
  const cards = [
    { atividade: a1, oferta: 'Instalar' },
    { atividade: a1, oferta: 'Configurar' },
    { atividade: a1, oferta: 'Atualizar' },
  ]
  // duas ofertas da mesma atividade não podem compartilhar contador
  assert.notEqual(chaveOferta(a1, 'Instalar'), chaveOferta(a1, 'Configurar'))
  assert.equal(chaveOferta(a1, null), a1.chave) // sem oferta, a chave é a da atividade

  let acessos = {}
  acessos = registrarAcesso(acessos, chaveOferta(a1, 'Configurar'))
  acessos = registrarAcesso(acessos, chaveOferta(a1, 'Configurar'))
  acessos = registrarAcesso(acessos, chaveOferta(a1, 'Instalar'))

  const top = maisAcessadas(cards, acessos)
  assert.deepEqual(
    top.map((t) => [t.oferta, t.acessos]),
    [
      ['Configurar', 2],
      ['Instalar', 1],
    ]
  ) // ordenado por frequência, e "Atualizar" (zero) fora
  assert.deepEqual(maisAcessadas(cards, {}), []) // sem acesso, lista vazia -> aviso na tela
  assert.equal(maisAcessadas(cards, acessos, 1).length, 1) // respeita o teto

  // registrarAcesso não muda o mapa recebido
  const antes = { x: 1 }
  registrarAcesso(antes, 'x')
  assert.deepEqual(antes, { x: 1 })
}

// visibilidade: cada conta vê só o que abriu
const [joao, valeria] = CONTAS
const doJoao = { protocolo: 'A', abertoPor: joao.nome, abertoPorEmail: joao.email }
const daValeria = {
  protocolo: 'B',
  abertoPor: valeria.nome,
  abertoPorEmail: valeria.email,
}
const antigo = { protocolo: 'C', abertoPor: joao.nome } // gravado antes das contas
const todos = [doJoao, daValeria, antigo]

assert.deepEqual(doUsuario(todos, joao), [doJoao, antigo]) // e-mail + reserva pelo nome
assert.deepEqual(doUsuario(todos, valeria), [daValeria])
assert.deepEqual(doUsuario(todos, null), []) // sem sessão, nada vaza
// homônimo com e-mail diferente não herda o ticket de quem tem e-mail gravado
assert.deepEqual(doUsuario([doJoao], { ...joao, email: 'outro@axia.com.br' }), [])

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
assert.equal(podeInteragir({ status: 'Pendente' }), true)
assert.equal(podeInteragir({ status: 'Aguardando aprovação' }), true)

// conclusão do atendente -> confirmação do solicitante -> pesquisa
const c0 = { protocolo: 'TK-2026-00002', status: 'Andamento', interacoes: [] }
assert.equal(aguardandoConfirmacao(c0), false)

const c1 = concluirAtendimento(c0)
assert.equal(aguardandoConfirmacao(c1), true)
assert.equal(c1.interacoes.at(-1).conclusao, true)
assert.deepEqual(c0.interacoes, []) // imutável

// mensagem posterior derruba a pergunta sem precisar limpar nada
assert.equal(aguardandoConfirmacao(comInteracao(c1, 'Solicitante', 'e o anexo?')), false)

const fechado = resolver(c1)
assert.equal(fechado.status, 'Fechado')
assert.equal(podeInteragir(fechado), false)
assert.equal(aguardandoConfirmacao(fechado), false)
assert.equal(resolver(fechado), fechado) // sem pergunta aberta: nada muda
assert.equal(reabrir(fechado), fechado)

const ajuda = reabrir(c1)
assert.equal(ajuda.status, 'Andamento')
assert.equal(aguardandoConfirmacao(ajuda), false)
assert.equal(ajuda.interacoes.at(-1).autor, 'Solicitante')

const avaliado = avaliar(fechado, 5, '  ótimo atendimento  ')
assert.equal(avaliado.avaliacao.nota, 5)
assert.equal(avaliado.avaliacao.comentario, 'ótimo atendimento')
assert.equal(fechado.avaliacao, undefined) // imutável
assert.equal(avaliar(fechado, 3).avaliacao.comentario, '')

// conclusão não vira notificação duplicada nem some da lista: é do atendente
assert.equal(notificacoes([c1]).length, 1)

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
