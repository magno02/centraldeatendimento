import { useState, useEffect, useRef } from 'react'
import logo from './assets/AF_ELETROBRAS_PRIMARIA_LOGO_AXIA_ENERGIA_HORIZONTAL_AZUL_RBG.png'
import logoVertical from './assets/AF_ELETROBRAS_PRIMARIA_LOGO_AXIA_ENERGIA_VERTICAL_AZUL_RBG.png'
import fundoHero from './assets/UHE_Luiz_Gonzaga_Banner.webp'
import {
  GRUPOS,
  ATIVIDADES_VISIVEIS,
  POR_CHAVE,
  grupoDoPortfolio,
} from './catalogo'
import {
  IconeServico,
  IconeGlobo,
  IconeLocal,
  IconeCheckCirculo,
  IconeInfoCirculo,
  IconeMenu,
  IconeX,
} from './icones'
import Login from './Login'
import {
  ATENDENTES,
  EMPRESAS,
  ESTADOS,
  AREAS,
  LOCALIDADES,
  USUARIOS,
  CADASTRO,
} from './organizacao'
import {
  STATUS,
  STATUS_PAINEL,
  CANCELADO,
  novoProtocolo,
  buscar,
  filtrarServicos,
  filtrarOpcoes,
  responderIA,
  alternarFavorito,
  iconeAtividade,
  registrarRecente,
  contarPorStatus,
  artigoDe,
  prazoLegivel,
  emDiasUteis,
  anonimizar,
  doUsuario,
  ofertasDoServico,
  filtrarOfertas,
  chaveOferta,
  registrarAcesso,
  maisAcessadas,
  deveMostrarTopo,
  prazoPrevisto,
  formatarTamanho,
  atendenteDe,
  dataCurta,
  diasUteisAte,
  ultimaAtualizacao,
  filtrarChamados,
  ordenarChamados,
  paginar,
  totalPaginas,
  PERIODOS,
  ORDENS,
  ITENS_POR_PAGINA,
  notificacoes,
  naoVisualizadas,
  visualizadas,
  iniciais,
  podeInteragir,
  comInteracao,
  cancelar,
  concluirAtendimento,
  aguardandoConfirmacao,
  resolver,
  reabrir,
  avaliar,
} from './lib'

const campoNome = (c) => (typeof c === 'string' ? c : c.n)
const campoTipo = (c) => (typeof c === 'string' ? 'texto' : c.t)

const CORES_STATUS = {
  Aberto: 'bg-axia-blue/10 text-axia-blue',
  Andamento: 'bg-axia-warning/15 text-yellow-700',
  Pendente: 'bg-axia-neutral text-axia-grey',
  'Aguardando aprovação': 'bg-axia-sky/30 text-axia-sky2',
  Fechado: 'bg-axia-success/15 text-green-700',
  [CANCELADO]: 'bg-axia-error/10 text-axia-error',
}

export default function App() {
  const [tickets, setTickets] = useState(() =>
    // interacoes garantido: tickets gravados por versões anteriores não tinham o campo.
    // "Suspenso" virou "Pendente": sem isto o ticket antigo perde cor e sai dos filtros.
    JSON.parse(localStorage.getItem('tickets') || '[]').map((t) => ({
      interacoes: [],
      ...t,
      status: t.status === 'Suspenso' ? 'Pendente' : t.status,
    }))
  )
  // view: {tela:'portal'} | {tela:'servico',servico} | {tela:'form',atividade}
  //     | {tela:'ticket',protocolo} | {tela:'tickets',status?}
  const [view, setView] = useState({ tela: 'portal' })
  const [aba, setAba] = useState(GRUPOS[0].id)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  // busca da tela de serviço: separada de `filtro`, que é o filtro de serviços da aba
  const [buscaAtividade, setBuscaAtividade] = useState('')
  const [lidas, setLidas] = useState(() =>
    JSON.parse(localStorage.getItem('notificacoesLidas') || '[]')
  )
  const [saindo, setSaindo] = useState(false)
  // sessão guarda a conta inteira: o portal usa nome/empresa/estado/área em vários
  // pontos, e reler a conta pelo e-mail a cada render não traria nada.
  // try/catch obrigatório: a sessão antiga era a string "ativa", que estoura no parse.
  // Quem estava logado no formato velho cai no login e entra de novo — sem tela branca.
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sessao'))
    } catch {
      return null
    }
  })
  const [secao, setSecao] = useState('Portfólios')
  const [favoritos, setFavoritos] = useState(() =>
    JSON.parse(localStorage.getItem('favoritos') || '[]')
  )
  const [recentes, setRecentes] = useState(() =>
    JSON.parse(localStorage.getItem('recentes') || '[]')
  )
  // contador de aberturas por card de atividade — alimenta "mais acessadas"
  const [acessos, setAcessos] = useState(() =>
    JSON.parse(localStorage.getItem('acessos') || '{}')
  )

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets))
  }, [tickets])

  useEffect(() => {
    localStorage.setItem('notificacoesLidas', JSON.stringify(lidas))
  }, [lidas])

  // troca de tela começa no topo: sem isso, sair de uma lista longa (ou enviar o
  // formulário) abre a próxima já rolada para baixo.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  useEffect(() => {
    localStorage.setItem('favoritos', JSON.stringify(favoritos))
  }, [favoritos])

  useEffect(() => {
    localStorage.setItem('recentes', JSON.stringify(recentes))
  }, [recentes])

  useEffect(() => {
    localStorage.setItem('acessos', JSON.stringify(acessos))
  }, [acessos])

  const favoritar = (chave) => setFavoritos((f) => alternarFavorito(f, chave))

  function abrirServico(servico, portfolio) {
    setRecentes((r) => registrarRecente(r, servico.chave))
    setBuscaAtividade('')
    setView({ tela: 'servico', servico, portfolio })
  }

  function abrirAtividade(atividade) {
    setRecentes((r) => registrarRecente(r, atividade.chave))
    setAcessos((a) => registrarAcesso(a, chaveOferta(atividade, atividade.oferta)))
    setView({ tela: 'form', atividade })
  }

  // tudo que a tela mostra sai daqui; `tickets` (a lista inteira) só é usada para
  // gravar e para numerar o protocolo, que precisa ser único entre todas as contas.
  const meusTickets = doUsuario(tickets, usuario)
  const listaNotificacoes = notificacoes(meusTickets)

  function abrirNotificacao(n) {
    setLidas((ls) => (ls.includes(n.id) ? ls : [...ls, n.id]))
    setView({ tela: 'ticket', protocolo: n.protocolo })
  }

  const atualizar = (protocolo, fn) =>
    setTickets((ts) => ts.map((t) => (t.protocolo === protocolo ? fn(t) : t)))

  function irAoPortal() {
    setBusca('')
    setView({ tela: 'portal' })
  }

  // "Outra pessoa": o solicitante é quem recebe o atendimento, e quem preencheu fica
  // em `abertoPor` — é por ele que a visibilidade dos chamados continua passando.
  function enviar(e, atividade, { anexos, para }) {
    e.preventDefault()
    const f = new FormData(e.target)
    const outra = para === 'Outra pessoa'
    const protocolo = novoProtocolo(tickets)
    const ticket = {
      protocolo,
      atividade: atividade.nome,
      servico: atividade.servico.nome,
      portfolio: atividade.portfolio.nome,
      solicitante: outra ? f.get(nomeTerceiro('Usuário')) : usuario.nome,
      abertoPor: usuario.nome,
      abertoPorEmail: usuario.email,
      responsavel: atendenteDe(protocolo, ATENDENTES),
      anexos,
      status: 'Aberto',
      criadoEm: new Date().toISOString(),
      // FormData vem na ordem do DOM: gravar por ela deixa o detalhe do chamado na
      // mesma sequência em que o formulário perguntou, sem repetir a lista de campos
      // grupo de checkbox manda uma entrada por marcado: junta na mesma linha em
      // vez de repetir o rótulo no detalhe do chamado
      // campo vazio não vira linha: só os opcionais chegam assim, e um rótulo sem
      // resposta no detalhe do chamado parece dado perdido
      dados: [...f.entries()]
        .filter(([k, v]) => !FORA_DOS_DADOS.has(k) && String(v).trim())
        .map(([k, v]) => [ROTULO_DADO[k] ?? k, v])
        .reduce((acc, [k, v]) => {
          const anterior = acc.find(([rotulo]) => rotulo === k)
          if (anterior) anterior[1] += `, ${v}`
          else acc.push([k, v])
          return acc
        }, []),
      interacoes: [
        {
          autor: 'Sistema',
          texto: 'Solicitação registrada e enviada para triagem.',
          em: new Date().toISOString(),
        },
      ],
    }
    setTickets([ticket, ...tickets])
    setView({ tela: 'ticket', protocolo: ticket.protocolo, novo: true })
  }

  function entrar(conta) {
    localStorage.setItem('sessao', JSON.stringify(conta))
    setUsuario(conta)
  }

  function sair() {
    localStorage.removeItem('sessao')
    setUsuario(null)
    setSaindo(false)
    irAoPortal()
  }

  const resultados = buscar(ATIVIDADES_VISIVEIS, busca)
  const grupo = GRUPOS.find((g) => g.id === aba)
  const servicosVisiveis = filtrarServicos(grupo.servicos, filtro)
  // busca em meusTickets, não em tickets: assim um protocolo de outra conta na view
  // (sessão trocada, link antigo) não abre a tela de detalhe.
  const ticketAtual =
    view.tela === 'ticket' &&
    meusTickets.find((t) => t.protocolo === view.protocolo)

  // qual link do header está aceso. "Aprovações" é a mesma tela de chamados, então
  // só o filtro de status separa os dois; telas de detalhe não acendem nenhum.
  const linkAtivo =
    view.tela === 'portal'
      ? 'Portal'
      : view.tela === 'tickets'
        ? view.status === 'Aguardando aprovação'
          ? 'Aprovações'
          : 'Meus chamados'
        : null

  if (!usuario) return <Login onEntrar={entrar} />

  return (
    <div className="min-h-screen bg-axia-bg font-sans text-axia-grey1">
      <Topo
        usuario={usuario}
        ativo={linkAtivo}
        notificacoes={listaNotificacoes}
        novidades={naoVisualizadas(listaNotificacoes, lidas).length}
        onInicio={irAoPortal}
        onNotificacao={abrirNotificacao}
        onVerTodas={() => setView({ tela: 'notificacoes' })}
        onMeusTickets={() => setView({ tela: 'tickets' })}
        onAprovacoes={() =>
          setView({ tela: 'tickets', status: 'Aguardando aprovação' })
        }
        onSair={() => setSaindo(true)}
      />

      {/* fora do <main> de propósito: lá dentro o fundo pararia nos 1440px do
          container, e a faixa precisa ir de ponta a ponta da tela */}
      {view.tela === 'portal' && (
        <Hero
          usuario={usuario}
          busca={busca}
          setBusca={setBusca}
          contagem={contarPorStatus(meusTickets)}
          onIndicador={(status) => setView({ tela: 'tickets', status })}
        />
      )}

      <main className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8">

        {view.tela === 'portal' && busca.trim() && (
          <Secao titulo={`Resultados para "${busca}"`}>
            {resultados.length ? (
              <Grade>
                {resultados.map((a) => (
                  <CardAtividade
                    key={a.chave}
                    atividade={a}
                    rodape={`${a.portfolio.nome} › ${a.servico.nome}`}
                    onClick={() => abrirAtividade(a)}
                  />
                ))}
              </Grade>
            ) : (
              <Vazio>Nenhuma atividade encontrada.</Vazio>
            )}
          </Secao>
        )}

        {view.tela === 'portal' && !busca.trim() && (
          <>
            <Abas
              ativa={secao === 'Portfólios' ? aba : secao}
              onSelect={(id) => {
                setAba(id)
                setSecao('Portfólios')
                setFiltro('')
              }}
              secao={secao}
              onSecao={setSecao}
              qtdFavoritos={favoritos.length}
            />

            {secao === 'Portfólios' && (
              <>
                {/* mt menor no celular: lá "Favoritos/Recentes" ficam numa linha
                    própria logo acima, e 32px abriam um vão no meio da tela */}
                <label className="relative mt-3 block w-full max-w-xl sm:mt-8">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-axia-grey/50">
                    <IconeLupa />
                  </span>
                  <input
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder={`Filtrar serviços em ${grupo.nome}...`}
                    className="w-full rounded-full border border-axia-neutral bg-white py-2.5 pl-11 pr-5 text-sm outline-none focus:border-axia-blue"
                  />
                </label>
                <div className="mb-5 mt-3 flex items-center gap-4">
                  <span className="text-sm text-axia-grey/70">
                    {servicosVisiveis.length} de {grupo.servicos.length} serviço(s)
                  </span>
                  {filtro && (
                    <button
                      onClick={() => setFiltro('')}
                      className="text-sm font-bold text-axia-blue-soft hover:text-axia-blue"
                    >
                      limpar
                    </button>
                  )}
                </div>
                <Grade>
                  {servicosVisiveis.map((s) => (
                    <CardServico
                      key={s.id}
                      servico={s}
                      favorito={favoritos.includes(s.chave)}
                      onFavoritar={() => favoritar(s.chave)}
                      onClick={() => abrirServico(s, s.portfolio)}
                    />
                  ))}
                </Grade>
                {!servicosVisiveis.length && (
                  <Vazio>Nenhum serviço com "{filtro}" nesta aba.</Vazio>
                )}
              </>
            )}

            {secao !== 'Portfólios' && (
              <ListaChaves
                chaves={secao === 'Favoritos' ? favoritos : recentes}
                favoritos={favoritos}
                onFavoritar={favoritar}
                onServico={abrirServico}
                onAtividade={abrirAtividade}
                vazio={
                  secao === 'Favoritos'
                    ? 'Nenhum favorito ainda. Use a estrela nos cards de serviço.'
                    : 'Nada acessado ainda.'
                }
              />
            )}
          </>
        )}

        {view.tela === 'servico' && (
          <>
            <Cabecalho
              // a trilha mostra a aba, não a área: área deixou de ser nível de
              // navegação, e o nome dela não aparece em lugar nenhum do portal
              trilha={[
                { label: 'Portal', onClick: irAoPortal },
                {
                  label: grupoDoPortfolio(view.portfolio.nome),
                  onClick: () => {
                    setAba(grupoDoPortfolio(view.portfolio.nome))
                    irAoPortal()
                  },
                },
                { label: view.servico.nome },
              ]}
              // sem título próprio: o nome do serviço passou para o título da seção
              // de atividades, e repetir os dois seria o mesmo texto duas vezes
              onVoltar={irAoPortal}
              // `extra` e não `acao`: esta tela não tem título, então a busca fica
              // sozinha na coluna da esquerda e o Voltar continua na ponta direita
              extra={
                <label className="relative block w-full sm:w-80">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-axia-grey/50">
                    <IconeLupa />
                  </span>
                  <input
                    value={buscaAtividade}
                    onChange={(e) => setBuscaAtividade(e.target.value)}
                    placeholder={`Buscar em ${view.servico.nome}...`}
                    className="w-full rounded-full border border-axia-neutral bg-white py-2 pl-11 pr-5 text-sm outline-none focus:border-axia-blue"
                  />
                </label>
              }
            />

            {(() => {
              const todas = filtrarOfertas(
                ofertasDoServico(view.servico),
                buscaAtividade
              )
              const topo = maisAcessadas(todas, acessos)
              const chavesTopo = new Set(
                topo.map((t) => chaveOferta(t.atividade, t.oferta))
              )
              // "menos acessadas" é o complemento do topo, e não outra ordenação:
              // assim nenhuma atividade aparece nas duas listas nem some das duas
              const resto = todas.filter(
                (t) => !chavesTopo.has(chaveOferta(t.atividade, t.oferta))
              )
              const abrir = ({ atividade, oferta }) =>
                abrirAtividade({
                  ...atividade,
                  oferta,
                  servico: view.servico,
                  portfolio: view.portfolio,
                })

              // buscando, a divisão mais/menos acessadas não ajuda: o que importa é o
              // resultado, e "mais acessadas" quase sempre viria vazia com um aviso falso
              if (buscaAtividade.trim())
                return (
                  <Secao titulo={`Resultados para "${buscaAtividade}"`}>
                    {todas.length ? (
                      <Grade>
                        {todas.map(({ atividade, oferta }) => (
                          <CardAtividade
                            key={chaveOferta(atividade, oferta)}
                            atividade={{ ...atividade, oferta }}
                            onClick={() => abrir({ atividade, oferta })}
                          />
                        ))}
                      </Grade>
                    ) : (
                      <Vazio>Nenhuma atividade encontrada neste serviço.</Vazio>
                    )}
                  </Secao>
                )

              return (
                <>
                  <SecaoAtividades
                    titulo="Atividades mais acessadas"
                    subtitulo="As atividades que mais são utilizadas pelos colaboradores."
                    subindo
                    itens={topo}
                    aoAbrir={abrir}
                    vazio="Você ainda não acessou nenhuma atividade deste serviço."
                  />
                  <SecaoAtividades
                    titulo="Atividades menos acessadas"
                    subtitulo="Atividades com menor frequência de utilização."
                    subindo={false}
                    itens={resto}
                    aoAbrir={abrir}
                    vazio="Nenhuma outra atividade neste serviço."
                  />
                </>
              )
            })()}
          </>
        )}

        {view.tela === 'form' && (
          <Formulario
            atividade={view.atividade}
            usuario={usuario}
            onSubmit={enviar}
            trilha={[
              { label: 'Portal', onClick: irAoPortal },
              {
                label: grupoDoPortfolio(view.atividade.portfolio.nome),
                onClick: () => {
                  setAba(grupoDoPortfolio(view.atividade.portfolio.nome))
                  irAoPortal()
                },
              },
              {
                label: view.atividade.servico.nome,
                onClick: () =>
                  setView({
                    tela: 'servico',
                    servico: view.atividade.servico,
                    portfolio: view.atividade.portfolio,
                  }),
              },
              // a oferta fecha a trilha: é ela que identifica o formulário agora
              { label: view.atividade.oferta ?? view.atividade.nome },
            ]}
            onVoltar={() =>
              setView(
                busca.trim()
                  ? { tela: 'portal' }
                  : {
                      tela: 'servico',
                      servico: view.atividade.servico,
                      portfolio: view.atividade.portfolio,
                    }
              )
            }
          />
        )}

        {view.tela === 'ticket' &&
          (ticketAtual ? (
            <DetalheTicket
              ticket={ticketAtual}
              novo={view.novo}
              trilha={[
                { label: 'Portal', onClick: irAoPortal },
                { label: 'Meus chamados', onClick: () => setView({ tela: 'tickets' }) },
                { label: ticketAtual.protocolo },
              ]}
              onResponder={(texto) =>
                atualizar(ticketAtual.protocolo, (t) =>
                  comInteracao(t, 'Solicitante', texto)
                )
              }
              onSimularAtendente={() =>
                atualizar(ticketAtual.protocolo, (t) => ({
                  ...comInteracao(
                    t,
                    'Atendente',
                    'Recebemos sua solicitação e já estamos analisando. Retornamos em breve.'
                  ),
                  status: t.status === 'Aberto' ? 'Andamento' : t.status,
                }))
              }
              onSimularConclusao={() =>
                atualizar(ticketAtual.protocolo, concluirAtendimento)
              }
              onResolver={() => atualizar(ticketAtual.protocolo, resolver)}
              onReabrir={() => atualizar(ticketAtual.protocolo, reabrir)}
              onAvaliar={(nota, comentario) =>
                atualizar(ticketAtual.protocolo, (t) => avaliar(t, nota, comentario))
              }
              onCancelar={(motivo) =>
                atualizar(ticketAtual.protocolo, (t) => cancelar(t, motivo))
              }
              onVoltar={() => setView({ tela: 'tickets' })}
            />
          ) : (
            <Vazio>Chamado não encontrado.</Vazio>
          ))}

        {view.tela === 'tickets' && (
          <MeusTickets
            // key força remontagem ao trocar de status vindo do menu: o filtro é
            // useState(statusInicial), que só é lido na primeira renderização —
            // sem isto, "Aprovações" não mudaria nada se já estivéssemos aqui
            key={view.status ?? 'todos'}
            tickets={meusTickets}
            statusInicial={view.status}
            onAbrir={(protocolo) => setView({ tela: 'ticket', protocolo })}
            onVoltar={irAoPortal}
            trilha={[
              { label: 'Portal', onClick: irAoPortal },
              { label: 'Meus chamados' },
            ]}
          />
        )}

        {view.tela === 'notificacoes' && (
          <Notificacoes
            lista={listaNotificacoes}
            lidas={lidas}
            trilha={[
              { label: 'Portal', onClick: irAoPortal },
              { label: 'Notificações' },
            ]}
            onAbrir={abrirNotificacao}
            onMarcarTodas={() => setLidas(listaNotificacoes.map((n) => n.id))}
            onVoltar={irAoPortal}
          />
        )}
      </main>

      <BotaoTopo />
      <ChatIA usuario={usuario} onAtividade={abrirAtividade} />

      <Modal
        aberto={saindo}
        titulo="Encerrar sessão?"
        onFechar={() => setSaindo(false)}
      >
        <p className="text-sm text-axia-grey">
          Você será desconectado do portal. Seus chamados continuam registrados.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setSaindo(false)}
            className="rounded-full border border-axia-neutral px-5 py-2 text-sm font-bold text-axia-grey hover:bg-axia-neutral/50"
          >
            Continuar no portal
          </button>
          <button
            onClick={sair}
            className="rounded-full bg-axia-error px-5 py-2 text-sm font-bold text-white hover:brightness-90"
          >
            Sair
          </button>
        </div>
      </Modal>
    </div>
  )
}

// Assistente flutuante: responde buscando no catálogo e sugere a atividade certa.
const saudacao = (usuario) => [
  {
    de: 'ia',
    texto: `Olá, ${usuario.nome.split(' ')[0]}! Bem-vindo(a) ao portal de serviços da AXIA. Me diga o que você precisa — por exemplo "resetar senha do SAP" ou "solicitar acesso à rede" — que eu encontro o serviço e já abro o formulário para você.`,
  },
]

function ChatIA({ usuario, onAtividade }) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState(() => saudacao(usuario))
  const fim = useRef(null)

  // sair do chat descarta a conversa: a próxima abertura começa na saudação
  function fechar() {
    setAberto(false)
    setMensagens(saudacao(usuario))
  }

  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [mensagens, aberto])

  function perguntar(e) {
    e.preventDefault()
    const pergunta = new FormData(e.target).get('pergunta').trim()
    if (!pergunta) return
    const { texto, sugestoes } = responderIA(pergunta, ATIVIDADES_VISIVEIS)
    setMensagens((ms) => [
      ...ms,
      { de: 'eu', texto: pergunta },
      { de: 'ia', texto, sugestoes },
    ])
    e.target.reset()
  }

  return (
    <>
      <button
        onClick={() => (aberto ? fechar() : setAberto(true))}
        title={aberto ? 'Fechar chat' : 'Falar com nossa IA Eletra'}
        aria-label={aberto ? 'Fechar assistente Eletra' : 'Abrir assistente Eletra'}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-axia-blue text-white shadow-lg shadow-axia-purple/30 transition hover:bg-axia-blue2"
      >
        {aberto ? <span className="text-xl leading-none">×</span> : <IconeBrilho />}
      </button>

      {aberto && (
        // altura fixa (limitada pela viewport) para o histórico ter espaço próprio
        <section className="fixed bottom-28 right-4 z-40 flex h-[min(38rem,calc(100vh-10rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-card border border-axia-neutral bg-white shadow-2xl sm:right-8">
          <header className="flex items-center gap-3 border-b border-axia-neutral bg-axia-purple px-5 py-4 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <IconeBrilho />
            </span>
            <div>
              <p className="font-bold leading-tight">Eletra</p>
              <p className="text-xs text-axia-sky">Assistente do portal</p>
            </div>
            <button
              onClick={fechar}
              aria-label="Fechar"
              className="ml-auto rounded-full p-1 text-xl leading-none hover:bg-white/10"
            >
              ×
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {mensagens.map((m, i) => (
              <div key={i}>
                <p
                  className={`rounded-chip px-4 py-2.5 text-sm leading-relaxed ${
                    m.de === 'eu'
                      ? 'ml-8 bg-axia-blue text-white'
                      : 'mr-4 bg-axia-bg text-axia-grey1'
                  }`}
                >
                  {m.texto}
                </p>
                {m.sugestoes?.map((s) => (
                  <button
                    key={s.chave}
                    onClick={() => {
                      fechar()
                      onAtividade(s)
                    }}
                    className="mr-4 mt-2 block w-full rounded-chip border border-axia-neutral px-4 py-2.5 text-left text-sm transition hover:border-axia-blue hover:bg-axia-blue/5"
                  >
                    <span className="block font-bold text-axia-purple">{s.nome}</span>
                    <span className="block text-xs text-axia-grey/70">
                      {s.portfolio.nome} › {s.servico.nome}
                    </span>
                  </button>
                ))}
              </div>
            ))}
            <div ref={fim} />
          </div>

          <form
            onSubmit={perguntar}
            className="flex items-center gap-2 border-t border-axia-neutral p-3"
          >
            <input
              name="pergunta"
              autoComplete="off"
              placeholder="Pergunte sobre os serviços..."
              className="min-w-0 flex-1 rounded-full border border-axia-neutral bg-slate-100/70 px-4 py-2.5 text-sm outline-none focus:border-axia-blue focus:bg-white"
            />
            <button
              aria-label="Enviar"
              className="shrink-0 rounded-full bg-axia-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-axia-blue2"
            >
              Enviar
            </button>
          </form>

          <p className="border-t border-axia-neutral px-5 py-2 text-[11px] text-axia-grey/60">
            As respostas vêm do catálogo de serviços. Confira antes de abrir o chamado.
          </p>
        </section>
      )}
    </>
  )
}

function IconeBrilho() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6L12 3.5Z" />
      <path d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  )
}

function BotaoTopo() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    let ultimoY = window.scrollY
    const onScroll = () => {
      setVisivel(deveMostrarTopo(window.scrollY, ultimoY))
      ultimoY = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao topo"
      className={`fixed bottom-28 right-10 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold text-axia-blue shadow-lg shadow-axia-purple/20 ring-1 ring-axia-neutral transition duration-200 hover:bg-axia-bg ${
        visivel ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      ↑
    </button>
  )
}

// Barra única: logo à esquerda, título, busca no centro e "Meus tickets" à direita.
function Topo({
  usuario,
  ativo,
  notificacoes,
  novidades,
  onInicio,
  onNotificacao,
  onVerTodas,
  onMeusTickets,
  onAprovacoes,
  onSair,
}) {
  return (
    <header className="border-b border-axia-neutral bg-white text-axia-purple">
      {/* barra fina: só logo e conta. A busca saiu daqui — quem busca é o hero do
          portal. No celular são três blocos: hambúrguer à esquerda, logo no meio e
          notificações à direita. */}
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-2 sm:px-8">
        {/* só no celular: na barra larga os mesmos destinos estão no <nav>. O
            sm:hidden vai no invólucro, não no botão: o <div relative> do Popover
            continuaria ocupando um item do flex e comendo um gap à esquerda */}
        <div className="sm:hidden">
          <Popover
            ancorado
            largura="w-64"
            aria-label="Abrir menu"
            classeBotao="shrink-0 rounded-full p-2 text-axia-grey hover:bg-axia-bg hover:text-axia-blue"
            rotulo={<IconeMenu className="h-6 w-6" />}
          >
            {(fechar) => (
              <MenuUsuario
                usuario={usuario}
                onInicio={() => {
                  fechar()
                  onInicio()
                }}
                onMeusTickets={() => {
                  fechar()
                  onMeusTickets()
                }}
                onAprovacoes={() => {
                  fechar()
                  onAprovacoes()
                }}
                onSair={() => {
                  fechar()
                  onSair()
                }}
              />
            )}
          </Popover>
        </div>

        {/* mx-auto centra o logo entre o hambúrguer e o sino, que têm larguras
            parecidas; no sm: ele volta a encostar na borda esquerda */}
        {/* no celular entra a versão vertical da marca, sem o "Portal de Serviços"
            ao lado: entre o ☰ e o sino não sobra largura para logo deitado mais
            texto, e a vertical ocupa o espaço em altura, que aí existe */}
        <button
          onClick={onInicio}
          className="mx-auto flex min-w-0 shrink-0 cursor-pointer items-center gap-3 sm:mx-0"
          aria-label="Ir para o portal"
        >
          <img
            src={logoVertical}
            alt="AXIA Energia"
            className="h-20 w-auto shrink-0 object-contain sm:hidden"
          />
          <img
            src={logo}
            alt="AXIA Energia"
            className="hidden h-12 w-auto shrink-0 object-contain sm:block"
          />
          <span className="hidden text-[13px] font-semibold uppercase tracking-wide text-axia-blue sm:block">
            Portal de Serviços
          </span>
        </button>

        {/* oculto no celular: três links + logo + conta não cabem numa barra fina.
            Lá os mesmos destinos estão no menu hambúrguer. */}
        <nav className="mx-auto hidden items-center gap-2 sm:flex">
          {[
            { rotulo: 'Portal', onClick: onInicio },
            { rotulo: 'Meus chamados', onClick: onMeusTickets },
            { rotulo: 'Aprovações', onClick: onAprovacoes },
          ].map(({ rotulo, onClick }) => (
            <button
              key={rotulo}
              onClick={onClick}
              aria-current={ativo === rotulo ? 'page' : undefined}
              // borda transparente nos inativos: sem ela o item saltaria 2px ao ativar
              className={`border-b-2 px-4 py-1.5 text-sm font-bold transition ${
                ativo === rotulo
                  ? 'border-axia-blue text-axia-blue'
                  : 'border-transparent text-axia-grey hover:text-axia-blue'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </nav>

        {/* sem ml-auto: quem empurra agora é o mx-auto do nav, senão as duas
            margens automáticas brigam e o menu volta a encostar no logo */}
        <div className="flex shrink-0 items-center gap-4">
          <Popover
            rotulo={
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 15Z" />
                  <path d="M10 20a2 2 0 0 0 4 0" />
                </svg>
                {novidades > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-axia-error px-1 text-[11px] font-bold text-white">
                    {novidades}
                  </span>
                )}
              </>
            }
            aria-label={`Notificações: ${novidades} sem visualizar`}
            classeBotao="relative rounded-full p-2 text-axia-grey hover:bg-axia-bg hover:text-axia-blue"
          >
            {(fechar) => (
              <PainelNotificacoes
                notificacoes={notificacoes}
                onAbrir={(n) => {
                  fechar()
                  onNotificacao(n)
                }}
                onVerTodas={() => {
                  fechar()
                  onVerTodas()
                }}
              />
            )}
          </Popover>

          <span
            className="hidden h-6 w-px bg-axia-neutral sm:block"
            aria-hidden="true"
          />

          {/* o perfil só aparece na barra larga: no celular ele é a última seção
              do menu hambúrguer, para o sino ficar sozinho nesta ponta */}
          <Popover
            largura="sm:w-64"
            classeBotao="hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-axia-bg sm:flex"
            rotulo={
              <>
                {/* invertido junto com o header: no fundo branco quem colore é o avatar */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-axia-blue text-xs font-bold text-white">
                  {iniciais(usuario.nome)}
                </span>
                <span className="text-sm font-bold">{usuario.nome}</span>
                <Chevron />
              </>
            }
          >
            {(fechar) => (
              <MenuUsuario
                usuario={usuario}
                onMeusTickets={() => {
                  fechar()
                  onMeusTickets()
                }}
                onAprovacoes={() => {
                  fechar()
                  onAprovacoes()
                }}
                onSair={() => {
                  fechar()
                  onSair()
                }}
              />
            )}
          </Popover>
        </div>
      </div>
    </header>
  )
}

const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// Posição do painel no celular. O padrão é folha no rodapé: ancorado no gatilho, um
// painel largo sempre vazava da tela. `ancorado` volta ao dropdown preso ao botão e
// só serve para gatilho encostado na margem esquerda, como o hambúrguer — daí o
// left-0, que no sm: cede lugar ao right-0 de sempre.
const PAINEL_FOLHA =
  'fixed inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-b-none sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-3 sm:max-h-none sm:overflow-hidden sm:rounded-b-card'
const PAINEL_ANCORADO =
  'absolute left-0 top-full mt-2 max-w-[calc(100vw-2rem)] overflow-hidden sm:left-auto sm:right-0 sm:mt-3'

// Popover do header: fecha ao clicar fora ou com Esc. children é função que recebe fechar().
// `largura` vem com o prefixo sm: porque no celular a folha ocupa a tela inteira.
function Popover({
  rotulo,
  classeBotao,
  largura = 'sm:w-96',
  ancorado = false,
  children,
  ...props
}) {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (!aberto) return
    const onKey = (e) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className={classeBotao}
        {...props}
      >
        {rotulo}
      </button>
      {aberto && (
        <>
          <button
            onClick={() => setAberto(false)}
            aria-label="Fechar"
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            className={`z-50 rounded-card border border-axia-neutral bg-white text-axia-grey1 shadow-xl ${
              ancorado ? PAINEL_ANCORADO : PAINEL_FOLHA
            } ${largura}`}
          >
            {children(() => setAberto(false))}
          </div>
        </>
      )}
    </div>
  )
}

// Um menu só, aberto por dois gatilhos: o avatar na barra larga e o hambúrguer no
// celular. "Portal" e "Aprovações" ficam sm:hidden porque na barra larga eles já
// estão no <nav> — no celular o <nav> não existe e é por aqui que se chega.
// `onInicio` só é passado pelo hambúrguer; sem ele o item some.
function MenuUsuario({ usuario, onInicio, onMeusTickets, onAprovacoes, onSair }) {
  return (
    <div className="p-2">
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-axia-blue text-xs font-bold text-white">
          {iniciais(usuario.nome)}
        </span>
        <p className="min-w-0 truncate text-sm font-bold text-axia-purple">
          {usuario.nome}
        </p>
      </div>
      <hr className="my-1 border-axia-neutral" />
      {onInicio && (
        <button
          onClick={onInicio}
          className="w-full rounded-chip px-3 py-2.5 text-left text-sm hover:bg-axia-blue/5 hover:text-axia-blue sm:hidden"
        >
          Portal
        </button>
      )}
      <button
        onClick={onMeusTickets}
        className="w-full rounded-chip px-3 py-2.5 text-left text-sm hover:bg-axia-blue/5 hover:text-axia-blue"
      >
        Meus chamados
      </button>
      <button
        onClick={onAprovacoes}
        className="w-full rounded-chip px-3 py-2.5 text-left text-sm hover:bg-axia-blue/5 hover:text-axia-blue sm:hidden"
      >
        Aprovações
      </button>
      <hr className="my-1 border-axia-neutral" />
      <button
        onClick={onSair}
        className="w-full rounded-chip px-3 py-2.5 text-left text-sm font-bold text-axia-error hover:bg-axia-error/10"
      >
        Sair
      </button>
    </div>
  )
}

function PainelNotificacoes({ notificacoes, onAbrir, onVerTodas }) {
  return (
    <div>
      <div className="border-b border-axia-neutral px-5 py-3">
        <p className="text-sm font-bold text-axia-purple">Notificações</p>
      </div>
      {notificacoes.length ? (
        <ul className="max-h-96 overflow-y-auto">
          {notificacoes.slice(0, 5).map((n) => (
            <li key={n.id}>
              <button
                onClick={() => onAbrir(n)}
                className="w-full border-b border-axia-neutral/60 px-5 py-3 text-left hover:bg-axia-blue/5"
              >
                <ItemNotificacao n={n} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-axia-grey/60">
          Nenhuma notificação.
        </p>
      )}
      <div className="p-3">
        <button
          onClick={onVerTodas}
          className="w-full rounded-full bg-axia-blue px-5 py-2 text-sm font-bold text-white hover:bg-axia-blue2"
        >
          Ver todas
        </button>
      </div>
    </div>
  )
}

function ItemNotificacao({ n, naoVista }) {
  return (
    <>
      <div className="flex items-center gap-2">
        {naoVista && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-axia-blue" aria-hidden="true" />
        )}
        <span className="font-mono text-xs font-bold text-axia-blue">{n.protocolo}</span>
        <span className="ml-auto text-[11px] text-axia-grey/60">
          {new Date(n.em).toLocaleString('pt-BR')}
        </span>
      </div>
      <p className="mt-1 text-sm font-bold text-axia-purple">{n.atividade}</p>
      <p className="mt-0.5 text-sm text-axia-grey">
        <span className="font-medium">{n.autor}:</span> {n.texto}
      </p>
    </>
  )
}

// Faixa de destaque: fundo, busca e os contadores de chamado.

function Hero({ usuario, busca, setBusca, contagem, onIndicador }) {
  return (
    // o fundo ocupa a largura toda; só o conteúdo interno respeita os 1440px
    <section
      className="relative mb-12 overflow-hidden bg-axia-purple bg-cover bg-center py-12 text-white"
      style={{ backgroundImage: `url(${fundoHero})` }}
    >
      {/* véu só do lado do texto: escurece a esquerda e some à direita, onde a foto
          precisa aparecer. Sem ele o branco some sobre as partes claras da imagem. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-axia-purple/85 via-axia-purple/45 to-transparent"
      />

      {/* mesma caixa do <main>: centraliza e só então aplica o padding, senão o texto
          do hero fica ~30px fora do eixo das abas e dos cards de baixo */}
      <div className="relative mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-10 gap-y-8 px-4 sm:px-8">
        <div className="min-w-64 flex-1">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Olá, {usuario.nome.split(' ')[0]}!
          </h2>
          <p className="mt-1 text-lg text-white/85">Como podemos te ajudar hoje?</p>

          <label className="relative mt-6 block w-full max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-axia-grey/50">
              <IconeLupa />
            </span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar serviço ou atividade..."
              className="w-full rounded-full bg-white py-3 pl-12 pr-5 text-sm text-axia-grey1 outline-none placeholder:text-axia-grey/60 focus:ring-2 focus:ring-white/60"
            />
          </label>
        </div>

        {/* Painel translúcido único, com divisórias no lugar de cards soltos.
            overflow-hidden é o que faz o divide-x respeitar o arredondamento.
            No celular vira 2x2: em linha, "AGUARDANDO" não deixa a coluna encolher
            (min-width auto do flex) e o quarto indicador saía da tela. O grid do
            Tailwind usa minmax(0,1fr), que encolhe. */}
        <div className="grid w-full shrink-0 grid-cols-2 overflow-hidden rounded-card border border-white/20 bg-white/5 backdrop-blur-[2px] sm:flex sm:w-auto">
          {STATUS_PAINEL.map((s, i) => (
            <button
              key={s}
              onClick={() => onIndicador(s)}
              title={`Ver chamados com status ${s}`}
              // divisória por posição: 2x2 no celular precisa de linha em cima na
              // segunda fila e de linha à esquerda só na coluna da direita; em
              // linha única (sm) volta a ser só a borda esquerda de quem não é o 1º
              className={`flex flex-1 flex-col items-center gap-1 border-white/25 px-3 py-3.5 text-center transition hover:bg-white/10 sm:w-24 sm:flex-none ${
                [
                  '',
                  'border-l',
                  'border-t sm:border-t-0 sm:border-l',
                  'border-l border-t sm:border-t-0',
                ][i] ?? 'border-l'
              }`}
            >
              <span className="text-2xl font-bold leading-none">{contagem[s]}</span>
              {/* min-h reserva a segunda linha de "Aguardando aprovação" para os
                  números continuarem no mesmo eixo */}
              <span className="flex min-h-7 items-start justify-center text-[10px] uppercase leading-tight tracking-wide text-white/85">
                {s}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}


// Abas em pílula: a ativa é preenchida de azul, as outras ficam brancas com contorno.
const PILULA =
  'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition'

// ponytail: categorias de mentira, só para mostrar o modal. Não abrem nada — quando
// virarem portfólios de verdade, elas entram em GRUPOS_AREAS e esta lista sai.
const MAIS_CATEGORIAS = [
  'Recursos Humanos',
  'Financeiro',
  'Suprimentos',
  'Jurídico e Compliance',
  'Facilities',
  'Comercial',
  'Engenharia',
  'Manutenção',
  'Meio Ambiente',
  'Segurança do Trabalho',
  'Comunicação',
  'Regulatório',
]

function Abas({ ativa, onSelect, secao, onSecao, qtdFavoritos }) {
  return (
    // rolagem lateral a partir do sm: numa linha só as pílulas mantêm a leitura de
    // barra de navegação. No celular elas quebram em linhas — rolagem sem barra
    // visível só escondia metade da última pílula na borda da tela.
    <div className="flex flex-wrap items-center gap-2 py-1 sm:flex-nowrap sm:overflow-x-auto sm:[scrollbar-width:none]">
      {GRUPOS.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`${PILULA} ${
            ativa === g.id
              ? 'bg-axia-blue text-white shadow-card'
              : 'border border-axia-neutral bg-white text-axia-purple hover:border-axia-blue hover:text-axia-blue'
          }`}
        >
          <IconeServico chave={g.icone} className="h-4 w-4" />
          {g.nome}
        </button>
      ))}

      {/* lista suspensa ancorada no botão, não modal centralizado */}
      <Popover
        largura="sm:w-72"
        classeBotao={`${PILULA} text-axia-grey/70 hover:text-axia-blue`}
        rotulo={
          <>
            Mais categorias
            <Chevron />
          </>
        }
      >
        {() => (
          <div className="p-2">
            <p className="px-3 pb-2 pt-1 text-xs text-axia-grey/60">
              Áreas ainda sem catálogo publicado.
            </p>
            {/* <li> e não <button>: sem clique morto, e o teclado não para em item
                que não leva a lugar nenhum */}
            <ul className="max-h-72 overflow-y-auto">
              {MAIS_CATEGORIAS.map((c) => (
                <li
                  key={c}
                  className="flex items-center justify-between gap-3 rounded-chip px-3 py-2 text-sm text-axia-grey/70"
                >
                  {c}
                  <span className="shrink-0 rounded-full bg-axia-neutral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-axia-grey/70">
                    em breve
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Popover>

      {/* favoritos e recentes são recortes do catálogo, não um grupo de serviços:
          ficam separados do bloco de abas, à direita. No celular o ml-auto os
          empurrava para o meio da linha quebrada — lá eles tomam a linha inteira
          e começam na mesma margem da barra de filtro logo abaixo. */}
      <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto sm:pl-6">
        {[
          { nome: 'Favoritos', icone: IconeEstrela },
          { nome: 'Recentes', icone: IconeRelogio },
        ].map(({ nome, icone: Ic }) => (
          <button
            key={nome}
            onClick={() => onSecao(nome)}
            className={`${PILULA} ${
              secao === nome
                ? 'bg-axia-blue/10 text-axia-blue'
                : 'text-axia-grey/70 hover:text-axia-blue'
            }`}
          >
            <Ic />
            {nome}
            {nome === 'Favoritos' && qtdFavoritos > 0 && ` (${qtdFavoritos})`}
          </button>
        ))}
      </div>
    </div>
  )
}

// trilha: [{ label, onClick? }] — o último item é a página atual, sem link.
function Trilha({ itens }) {
  return (
    <nav aria-label="Você está em" className="flex flex-wrap items-center gap-2 text-sm">
      {itens.map((i, idx) => (
        <span key={i.label} className="flex items-center gap-2">
          {idx > 0 && <span className="text-axia-sky">›</span>}
          {i.onClick ? (
            <button
              onClick={i.onClick}
              className="font-bold text-axia-blue-soft hover:text-axia-blue"
            >
              {i.label}
            </button>
          ) : (
            <span className="font-bold text-axia-grey">{i.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

function Cabecalho({ trilha, titulo, subtitulo, onVoltar, extra }) {
  return (
    <div className="py-8">
      {/* a trilha fica fora da linha abaixo: dentro dela o items-center centraria
          a ação no conjunto trilha+texto, e o botão subia acima do título */}
      <Trilha itens={trilha} />
      <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {titulo && (
            <h2 className="text-3xl font-bold text-axia-purple">{titulo}</h2>
          )}
          {subtitulo && <p className="mt-1.5 text-base text-axia-grey">{subtitulo}</p>}
          {extra}
        </div>
        {/* telas que não passam onVoltar não mostram o botão: no formulário e no
            detalhe do chamado a volta já existe na trilha */}
        {onVoltar && (
          <button
            onClick={onVoltar}
            className="shrink-0 rounded-full border border-axia-blue px-6 py-1.5 text-sm font-bold text-axia-blue hover:bg-axia-blue hover:text-white"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  )
}


// Teto de 320px em vez de 1fr: sem ele, um card sozinho esticava pela linha inteira.
// O piso de 300px é o que limita a 4 colunas nos ~1376px úteis — com 240px entravam 5.
const Grade = ({ children }) => (
  // min(100%,300px): sem isso a coluna nunca desce de 300px e estoura a tela do celular
  // justify-center no celular: a coluna para em 320px e sobrava um vão só do lado
  // direito, com o card colado na margem esquerda
  <div className="grid items-stretch justify-center gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,300px),320px))] sm:justify-start">
    {children}
  </div>
)

function IconeTendencia({ subindo }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {subindo ? (
        <>
          <path d="m3 16 5.5-5.5 3.5 3.5L21 6" />
          <path d="M15.5 6H21v5.5" />
        </>
      ) : (
        <>
          <path d="m3 8 5.5 5.5L12 10l9 8" />
          <path d="M15.5 18H21v-5.5" />
        </>
      )}
    </svg>
  )
}

// Sem "ver todas": a tela do serviço mostra o catálogo inteiro, e quem procura algo
// específico usa a busca do cabeçalho.
function SecaoAtividades({ titulo, subtitulo, subindo, itens, aoAbrir, vazio }) {
  return (
    // sem padding no topo: o respiro antes do título vem do `pb` do cabeçalho na
    // primeira seção e do `pb` da seção anterior na segunda — somar os dois abria
    // um vão grande logo abaixo da busca, que nesta tela é a única coisa no cabeçalho
    <section className="pb-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-axia-blue">
          <IconeTendencia subindo={subindo} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-axia-purple">{titulo}</h2>
          <p className="mt-0.5 text-sm text-axia-grey/70">{subtitulo}</p>
        </div>
      </div>

      {itens.length ? (
        <Grade>
          {itens.map(({ atividade, oferta }) => (
            <CardAtividade
              key={chaveOferta(atividade, oferta)}
              atividade={{ ...atividade, oferta }}
              onClick={() => aoAbrir({ atividade, oferta })}
            />
          ))}
        </Grade>
      ) : (
        <Vazio>{vazio}</Vazio>
      )}
    </section>
  )
}

const Secao = ({ titulo, children }) => (
  <section className="py-8">
    <h2 className="mb-5 text-2xl font-bold text-axia-purple">{titulo}</h2>
    {children}
  </section>
)

const Vazio = ({ children }) => (
  <p className="py-12 text-center text-sm text-axia-grey/60">{children}</p>
)

const Badge = ({ status }) => (
  <span
    className={`rounded-full px-3 py-1 text-xs font-bold ${CORES_STATUS[status]}`}
  >
    {status}
  </span>
)

// function (não const): Abas referencia estes ícones antes deste ponto do arquivo.
function IconeEstrela({ preenchida }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={preenchida ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8L12 3.5Z" />
    </svg>
  )
}

function IconeInfo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

function IconeRelogio({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

function IconeSeta() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

// Estrela de favoritar; fica sobre o card, como irmã do botão (não aninhada nele).
// `posicao` existe porque o card de serviço sobrepõe a estrela ao conteúdo, enquanto
// o de atividade a coloca em fluxo, ao lado do botão "sobre".
function Estrela({ ativo, onClick, rotulo, posicao = 'absolute right-4 top-4 z-10' }) {
  return (
    <button
      onClick={onClick}
      title={ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-label={`${ativo ? 'Remover de' : 'Adicionar a'} favoritos: ${rotulo}`}
      aria-pressed={ativo}
      className={`${posicao} rounded-full p-1.5 transition ${
        ativo
          ? 'text-axia-warning'
          : 'text-axia-grey/35 hover:bg-axia-blue/5 hover:text-axia-blue'
      }`}
    >
      <IconeEstrela preenchida={ativo} />
    </button>
  )
}

function CardServico({ servico, favorito, onFavoritar, onClick }) {
  return (
    // altura igual em todos os cards: min-h fixa o piso, h-full estica na linha
    <div className="relative h-full">
      <Estrela ativo={favorito} onClick={onFavoritar} rotulo={servico.nome} />
      <button
        onClick={onClick}
        className="flex h-full min-h-32 w-full flex-col items-center justify-center rounded-card border border-axia-neutral bg-white p-5 text-center shadow-card transition hover:border-axia-blue hover:shadow-card-hover"
      >
        <IconeServico nome={servico.nome} />
        <div className="mt-4 text-base font-bold leading-snug text-axia-purple">
          {servico.nome}
        </div>
      </button>
    </div>
  )
}

// Favoritos e recentes vêm como chaves; o que não existe mais no catálogo é ignorado.
function ListaChaves({
  chaves,
  favoritos,
  onFavoritar,
  onServico,
  onAtividade,
  vazio,
}) {
  const itens = chaves.map((c) => POR_CHAVE.get(c)).filter(Boolean)
  if (!itens.length) return <Vazio>{vazio}</Vazio>

  return (
    <div className="pt-8">
      <Grade>
        {itens.map(({ tipo, item }) =>
          tipo === 'servico' ? (
            <CardServico
              key={item.chave}
              servico={item}
              favorito={favoritos.includes(item.chave)}
              onFavoritar={() => onFavoritar(item.chave)}
              onClick={() => onServico(item, item.portfolio)}
            />
          ) : (
            <CardAtividade
              key={item.chave}
              atividade={item}
              rodape={`${item.portfolio.nome} › ${item.servico.nome}`}
              onClick={() => onAtividade(item)}
            />
          )
        )}
      </Grade>
    </div>
  )
}

function CardAtividade({ atividade, rodape, onClick }) {
  const titulo = atividade.oferta ?? atividade.nome
  // id estável para o aria-describedby ligar o ícone ao texto da dica
  const idDica = `dica-${atividade.chave}${atividade.oferta ?? ''}`.replace(
    /\W+/g,
    '-'
  )

  // linha de contexto de quem não tem descrição própria (ofertas do catálogo antigo)
  const contexto = atividade.oferta
    ? atividade.nome
    : atividade.ofertas?.length === 1
      ? atividade.ofertas[0]
      : atividade.ofertas?.length > 1
        ? `${atividade.ofertas.length} ofertas de serviço disponíveis`
        : null

  // after:inset-0 estica a área clicável deste botão por cima do card inteiro: o
  // card fica clicável sem virar um segundo elemento interativo, que duplicaria o
  // alvo para leitor de tela e teclado. Fora do JSX porque os dois rodapés (prazo
  // único e prazo por localidade) terminam na mesma seta.
  const seta = (
    <button
      onClick={onClick}
      title="Acessar formulário"
      aria-label={`Acessar formulário: ${titulo}`}
      className="ml-auto flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-axia-blue/10 text-axia-blue transition after:absolute after:inset-0 after:content-[''] hover:bg-axia-blue hover:text-white"
    >
      <IconeSeta />
    </button>
  )

  return (
    // div e não button: o card tem ações próprias dentro (favoritar, "sobre" e
    // acessar), e botão dentro de botão é HTML inválido
    <div className="relative flex h-full min-h-48 flex-col rounded-card border border-axia-neutral bg-white p-5 shadow-card transition hover:border-axia-blue hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-chip bg-axia-blue/10">
          <IconeServico
            {...iconeAtividade(atividade.nome, atividade.servico?.nome)}
            className="h-9 w-9 text-axia-blue"
          />
        </span>

        {/* min-h de duas linhas: sem ele "Trocar Monitor" (uma linha) subia a
            divisória e o bloco de prazo em relação a "Empréstimo do Monitor"
            (duas), e os cards da mesma fileira ficavam desalinhados entre si */}
        <h3 className="min-h-[2.75rem] flex-1 pt-1 text-base font-semibold leading-snug text-axia-purple">
          {titulo}
        </h3>

        {/* sem estrela aqui: favoritar passou a existir só no card de serviço.
            A descrição vem em tooltip no hover; focus-within faz o teclado ver
            também, já que "passar o cursor" não existe para quem navega por Tab. */}
        {atividade.descricao && (
          <span
            tabIndex={0}
            aria-describedby={idDica}
            // z-10 mantém o ícone acima da área clicável esticada do botão da seta,
            // senão o card inteiro cobriria ele e o tooltip não abriria
            className="group/info relative z-10 shrink-0 rounded-full p-1 text-axia-grey/50 outline-none transition hover:text-axia-blue focus-visible:text-axia-blue"
          >
            <IconeInfo />
            {/* à direita do ícone (left-full), fora da área do card: abrindo para
                baixo ele cobria a descrição e o prazo, que é o conteúdo do card */}
            <span
              id={idDica}
              role="tooltip"
              className="pointer-events-none absolute left-full top-0 z-20 ml-3 w-64 rounded-lg border border-axia-neutral bg-white px-3 py-2 text-left text-xs font-normal leading-relaxed text-axia-blue opacity-0 shadow-lg transition group-hover/info:opacity-100 group-focus-within/info:opacity-100"
            >
              {atividade.descricao}
            </span>
          </span>
        )}
      </div>

      {contexto && (
        <p className="mt-3 text-sm leading-relaxed text-axia-grey">{contexto}</p>
      )}
      {rodape && <p className="mt-2 text-xs text-axia-grey/60">{rodape}</p>}

      {/* rodapé: prazo à esquerda e a seta de abrir à direita. A divisória só
          aparece com prazo — sem ele sobraria uma linha sem conteúdo abaixo.
          Atividade com prazo por localidade troca a linha única pelas duas
          localidades; o resto do card não muda. */}
      {atividade.prazos ? (
        // dois níveis por causa do mt-auto: ele prende o rodapé no fim do card e
        // não deixa reservar espaço acima da divisória. O pt de fora abre esse
        // espaço; a borda e o pt de dentro afastam o "Prazo previsto" da linha.
        <div className="mt-auto pt-5">
          <div className="border-t border-axia-neutral/70 pt-4">
            <p className="text-sm font-bold text-axia-blue">Prazo previsto</p>
            <dl className="mt-3 space-y-3">
              {[
                [IconeLocal, 'Recife', atividade.prazos.recife],
                [IconeGlobo, 'Demais localidades', atividade.prazos.demais],
              ].map(([Ic, local, dias]) => (
                <div key={local} className="flex items-center gap-3">
                  <Ic className="h-6 w-6 shrink-0 text-axia-blue" />
                  <div className="min-w-0">
                    <dt className="text-xs text-axia-grey/70">{local}</dt>
                    <dd className="text-[15px] font-semibold text-axia-purple">
                      Até {emDiasUteis(dias)}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-end justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-xs text-axia-grey/70">
                <IconeRelogio className="h-4 w-4 shrink-0" />
                Consulte detalhes ao abrir a solicitação.
              </span>
              {seta}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`mt-auto flex items-end justify-between gap-3 ${
            atividade.sla ? 'border-t border-axia-neutral/70 pt-3' : ''
          }`}
        >
          {atividade.sla && (
            // relógio fora do texto e centrado nas duas linhas: inline com o rótulo
            // ele ficava pequeno e preso na primeira linha
            <div className="flex min-w-0 items-center gap-3">
              <IconeRelogio className="h-6 w-6 shrink-0 text-axia-blue" />
              <span className="min-w-0">
                <span className="block text-xs text-axia-grey/70">
                  Prazo de atendimento
                </span>
                <span className="block text-[15px] font-semibold text-axia-purple">
                  {prazoLegivel(atividade.sla)}
                </span>
              </span>
            </div>
          )}
          {seta}
        </div>
      )}

    </div>
  )
}

const PLACEHOLDERS = {
  'Descrição da necessidade':
    'Descreva o que precisa, com contexto, sistema envolvido e prazo desejado',
  'Oferta de Serviço': 'Selecione a oferta de serviço',
  Urgência: 'Selecione o nível de urgência',
  'E-mail de recuperação de senha': 'nome.sobrenome@axia.com.br',
  'URL do sistema': 'https://sistema.axia.com.br',
}

// Fica no bloco de quem solicita para outra pessoa, e não na grade dos campos da
// atividade: descreve o vínculo de quem vai receber o acesso, então some quando o
// pedido é para si mesmo.
const CAMPO_DO_TERCEIRO = 'Tipo de usuário'

// Campo de evidência/anexo vira a área de upload, não um input de texto.
const ehAnexo = (nome) => /anexo|evid[êe]ncia/i.test(nome)

// Solicitar para outra pessoa. O `name` vai prefixado para nunca colidir com um
// campo do catálogo de mesmo rótulo — "Área" e "Usuário" são nomes que se repetem.
const nomeTerceiro = (label) => `solicitante:${label}`

// Rótulo gravado no ticket: o prefixo sai e o sufixo entra, para o detalhe não
// mostrar "Área" duas vezes quando a atividade também pedir uma.
const ROTULO_DADO = {
  [nomeTerceiro('Empresa')]: 'Empresa do solicitante',
  [nomeTerceiro('Estado')]: 'Estado do solicitante',
  [nomeTerceiro('Área')]: 'Área do solicitante',
  [nomeTerceiro('Gestor imediato')]: 'Gestor imediato',
  [nomeTerceiro('Localidade')]: 'Localidade do solicitante',
  [nomeTerceiro('Detalhes adicionais do local')]: 'Detalhes adicionais do local',
  [nomeTerceiro('CPF')]: 'CPF do solicitante',
  [nomeTerceiro('Contato/Ramal')]: 'Contato/Ramal do solicitante',
  [nomeTerceiro('Cargo/Função')]: 'Cargo/Função do solicitante',
}

// Fora do detalhe: o radio é controle de tela, o usuário escolhido vira o
// solicitante do chamado e os arquivos têm bloco próprio.
const FORA_DOS_DADOS = new Set(['__para', 'anexos', nomeTerceiro('Usuário')])

// Sem pré-preenchimento pela conta logada: quem abre o chamado quase nunca está na
// mesma empresa, estado e área de quem vai receber o atendimento, e o valor herdado
// passava despercebido e ia errado para o ticket.
const CAMPOS_TERCEIRO = [
  { label: 'Empresa', opcoes: EMPRESAS },
  { label: 'Estado', opcoes: ESTADOS },
  { label: 'Área', opcoes: AREAS },
]

// Vêm prontos do cadastro quando o nome sai da lista, e são digitados quando o nome
// foi escrito à mão. `chave` aponta para o registro em CADASTRO; `dica` é o texto do
// campo ainda travado, antes de haver usuário escolhido.
const CAMPOS_DO_CADASTRO = [
  {
    label: 'Gestor imediato',
    chave: 'gestor',
    placeholder: 'Informe o nome do gestor imediato',
    dica: 'Selecione o usuário para carregar o gestor',
  },
  {
    label: 'CPF',
    chave: 'cpf',
    mascarar: true,
    placeholder: '000.000.000-00',
    dica: 'Selecione o usuário para carregar o CPF',
  },
  {
    label: 'Contato/Ramal',
    chave: 'contato',
    placeholder: 'Digite o nº de contato',
    dica: 'Selecione o usuário para carregar o contato',
  },
  {
    label: 'Cargo/Função',
    chave: 'cargo',
    placeholder: 'Ex.: Analista de Suprimentos',
    dica: 'Selecione o usuário para carregar o cargo',
  },
  {
    label: 'Localidade',
    chave: 'localidade',
    opcoes: LOCALIDADES,
    placeholder: 'Digite para filtrar a localidade',
    dica: 'Selecione o usuário para carregar a localidade',
  },
]

// Campo que o solicitante não preenche: o valor é do RH e a tela só exibe.
const CampoTravado = ({ label, nome, valor, dica }) => (
  <div>
    <span className="mb-1.5 block text-sm font-bold text-axia-purple">
      {label} <Obrigatorio />
    </span>
    <input
      name={nome}
      value={valor}
      readOnly
      required
      placeholder={dica}
      className={inputTravado}
    />
  </div>
)

// Quem recebe o atendimento nunca é pedido em texto livre: em "Eu mesmo(a)" já está
// logado, em "Outra pessoa" vem do bloco de solicitante acima. Nomes exatos, não
// regex: "Usuários" (a lista de quem entra num grupo) é outro campo e continua.
const CAMPOS_DO_SOLICITANTE = new Set([
  'Usuário',
  'Nome do usuário',
  'Usuário beneficiário',
  'Usuário responsável',
  'Gestor',
  'Matrícula',
  'Cargo',
  'Área',
  'Unidade',
])

function Formulario({ atividade, usuario, onSubmit, trilha, onVoltar }) {
  const [anexos, setAnexos] = useState([])
  const [para, setPara] = useState('Eu mesmo(a)')
  const [alvo, setAlvo] = useState('')
  const [prazoAberto, setPrazoAberto] = useState(false)
  const outraPessoa = para === 'Outra pessoa'

  // nome digitado que não está no cadastro: não há registro para carregar e os cinco
  // campos passam a ser preenchidos à mão. Com o campo de usuário ainda vazio segue
  // valendo a dica de escolhê-lo primeiro, em vez de já abrir pedindo digitação.
  const cadastro = CADASTRO[alvo]
  const semCadastro = Boolean(alvo) && !cadastro

  const visiveis = atividade.campos.filter(
    (c) =>
      !(atividade.oferta && campoNome(c) === 'Oferta de Serviço') &&
      !CAMPOS_DO_SOLICITANTE.has(campoNome(c))
  )

  // Textos longos vão para o fim: como cada um ocupa a linha inteira, no meio da
  // lista eles quebram o empacotamento e deixam buracos na grade de 3 colunas.
  // `sort` é estável, então a ordem da planilha se mantém dentro de cada bloco.
  const campos = visiveis
    .filter((c) => !ehAnexo(campoNome(c)) && campoNome(c) !== CAMPO_DO_TERCEIRO)
    .sort(
      (a, b) =>
        (campoTipo(a) === 'textarea' ? 1 : 0) - (campoTipo(b) === 'textarea' ? 1 : 0)
    )

  const tipoDeUsuario = visiveis.find((c) => campoNome(c) === CAMPO_DO_TERCEIRO)

  return (
    <>
      <Cabecalho trilha={trilha} onVoltar={onVoltar} />

      <form
        onSubmit={(e) => onSubmit(e, atividade, { anexos, para })}
        className="space-y-6 overflow-hidden rounded-card border border-axia-neutral bg-white p-5 shadow-card sm:p-8"
      >
        {/* Cabeçalho no formato do print: ícone, nome, descrição e prazo numa faixa,
            e a aba "Solicitação" fechando o bloco — tudo no azul da marca.
            O overflow-hidden do <form> apara a faixa nos cantos arredondados: sem ele
            ela passava por cima do raio e o canto superior ficava quadrado. */}
        <div className="-mx-5 -mt-5 border-b border-axia-neutral bg-white px-5 pt-5 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
          {/* empilhado no celular: em linha, o chip de 56px mais o gap tiravam um
              quarto da largura do cartão e a descrição quebrava de duas em duas
              palavras. Do sm: para cima continua ícone à esquerda do texto. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            {/* mesmo chip do card de atividade: no branco puro o ícone se perdia
                e o disco do selo de verbo ficava invisível */}
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-chip bg-axia-blue/10">
              <IconeServico
                {...iconeAtividade(atividade.nome, atividade.servico.nome)}
                className="h-9 w-9 text-axia-blue"
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-snug text-axia-purple">
                {atividade.oferta ?? atividade.nome}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-axia-grey">
                {atividade.descricao ??
                  'Use este formulário para registrar esta solicitação. Ao enviar, você recebe um número de protocolo para acompanhar o atendimento em "Meus chamados".'}
              </p>
              {/* com prazo por localidade o SLA único da planilha some: manter os
                  dois deixaria um "Tempo de atendimento: 2 dias úteis" logo acima
                  das notas que explicam Recife e as demais localidades */}
              {atividade.prazos ? (
                <>
                  <p className="mt-2 text-sm font-bold text-axia-purple">
                    Prazo previsto:{' '}
                    <span className="text-axia-blue">
                      Recife até {emDiasUteis(atividade.prazos.recife)} · demais
                      localidades até {emDiasUteis(atividade.prazos.demais)}
                    </span>
                  </p>
                  {/* o porquê da diferença sai do topo e vai para o modal: como
                      texto corrido ele empurrava o formulário para baixo da dobra */}
                  {atividade.prazos.porqueRecife && (
                    <button
                      type="button"
                      onClick={() => setPrazoAberto(true)}
                      // items-start + text-left: quando o rótulo quebra em duas
                      // linhas, o items-center deslocava o ícone para o meio delas
                      className="mt-2 flex cursor-pointer items-start gap-2 text-left text-sm text-axia-blue transition hover:underline"
                    >
                      <IconeInfoCirculo className="mt-0.5 h-4 w-4 shrink-0" />
                      Como os prazos são calculados?
                    </button>
                  )}
                </>
              ) : (
                atividade.sla && (
                  <p className="mt-2 text-sm font-bold text-axia-purple">
                    Tempo de atendimento da solicitação:{' '}
                    <span className="text-axia-blue">
                      {prazoLegivel(atividade.sla)}
                    </span>
                  </p>
                )
              )}

            </div>
          </div>

          {/* aba contornada no mesmo cinza do card, rente à esquerda: os -mx cancelam
              o padding lateral da faixa, e a borda de baixo some para ela se fundir
              com o corpo do formulário */}
          <div className="-mx-5 mt-8 flex sm:-mx-8">
            <span className="-mb-px rounded-tr-lg border border-l-0 border-b-white border-axia-neutral px-6 py-2 text-sm font-bold text-axia-purple">
              Solicitação
            </span>
          </div>
        </div>

        <p className="text-sm text-axia-grey">
          Campos marcados com <Obrigatorio /> são de preenchimento obrigatório.
        </p>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-axia-purple">
            Solicitante <Obrigatorio />
          </legend>
          <div className="flex flex-wrap gap-3">
            {['Eu mesmo(a)', 'Outra pessoa'].map((op) => (
              <label
                key={op}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition ${
                  para === op
                    ? 'border-axia-blue bg-axia-blue/10 text-axia-blue'
                    : 'border-slate-300 bg-slate-100 text-axia-sky2 hover:bg-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="__para"
                  value={op}
                  checked={para === op}
                  onChange={() => setPara(op)}
                  className="accent-axia-blue"
                />
                {op}
              </label>
            ))}
          </div>
        </fieldset>

        {/* a oferta veio do card: campo escondido em vez de select, para o ticket
            continuar gravando "Oferta de Serviço" sem pedir de novo ao usuário */}
        {atividade.oferta && (
          <input type="hidden" name="Oferta de Serviço" value={atividade.oferta} />
        )}

        {/* Pedindo para outra pessoa são duas perguntas diferentes na mesma tela —
            quem é a pessoa e o que ela precisa —, e sem separação elas viram uma
            grade só de treze campos. Para si mesmo há uma pergunta só, então o
            título não aparece: rotular a única seção da tela é ruído. */}
        {outraPessoa && (
          <SecaoCampos
            titulo="Dados do usuário"
            subtitulo="Informe os dados de quem vai receber o atendimento."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* abre o bloco: é o vínculo de quem vai receber o atendimento, então
                  vem antes de onde essa pessoa está. Linha inteira para não deixar
                  buraco de duas colunas. */}
              {tipoDeUsuario && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Campo
                    label={CAMPO_DO_TERCEIRO}
                    nome={CAMPO_DO_TERCEIRO}
                    tipo="radio"
                    opcoes={tipoDeUsuario.opcoes}
                  />
                </div>
              )}
              {CAMPOS_TERCEIRO.map((c) => (
                <Campo
                  key={c.label}
                  label={c.label}
                  nome={nomeTerceiro(c.label)}
                  tipo="combo"
                  opcoes={c.opcoes}
                  placeholder={`Digite para filtrar ${artigoDe(c.label)} ${c.label.toLowerCase()}`}
                />
              ))}
              <Campo
                label="Usuário"
                nome={nomeTerceiro('Usuário')}
                tipo="combo"
                livre
                opcoes={USUARIOS}
                placeholder="Selecione da lista ou digite o nome"
                onChange={setAlvo}
              />
              {/* Nome escolhido da lista traz os cinco prontos do cadastro e travados
                  — são dados do RH, não do solicitante. Nome digitado à mão não tem
                  registro para consultar, e aí os cinco abrem para digitação. */}
              {CAMPOS_DO_CADASTRO.map((c) =>
                semCadastro ? (
                  <Campo
                    key={c.label}
                    label={c.label}
                    nome={nomeTerceiro(c.label)}
                    tipo={c.opcoes ? 'combo' : undefined}
                    opcoes={c.opcoes}
                    placeholder={c.placeholder}
                  />
                ) : (
                  <CampoTravado
                    key={c.label}
                    label={c.label}
                    nome={nomeTerceiro(c.label)}
                    dica={c.dica}
                    valor={
                      c.mascarar
                        ? anonimizar(cadastro?.[c.chave] ?? '')
                        : (cadastro?.[c.chave] ?? '')
                    }
                  />
                )
              )}
              {/* a lista de localidades fecha o que o atendimento consegue
                  roteirizar; este campo cobre o que ela não prevê, e por isso é
                  opcional e sempre digitado */}
              <Campo
                label="Detalhes adicionais do local"
                nome={nomeTerceiro('Detalhes adicionais do local')}
                opcional
                placeholder="Ex.: bloco B, 3º andar, ao lado da recepção"
              />
            </div>
          </SecaoCampos>
        )}

        <SecaoCampos
          titulo={outraPessoa ? 'Dados da solicitação' : null}
          subtitulo="Informe os detalhes do que está sendo solicitado."
        >
          {/* três por linha; o textarea ocupa a linha inteira, porque texto longo numa
              coluna de um terço vira uma caixa estreita e alta */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campos.map((c) => (
              <div
                key={campoNome(c)}
                className={
                  campoTipo(c) === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''
                }
              >
                <Campo
                  label={campoNome(c)}
                  nome={campoNome(c)}
                  tipo={campoTipo(c)}
                  opcoes={c.opcoes}
                  placeholder={PLACEHOLDERS[campoNome(c)]}
                />
              </div>
            ))}
          </div>
        </SecaoCampos>

        {/* uma área de upload em todo formulário: os campos de anexo da planilha
            já foram filtrados acima, então nunca sai em duplicidade */}
        <Anexos arquivos={anexos} onChange={setAnexos} />

        <button className="rounded-full bg-axia-blue px-7 py-2.5 text-sm font-bold text-white hover:bg-axia-blue2">
          Enviar solicitação
        </button>
      </form>

      {/* fora do <form>: dentro dele o Esc do <dialog> fecharia o modal e o botão
          de fechar contaria como submit */}
      <Modal
        aberto={prazoAberto}
        titulo="Prazo previsto"
        onFechar={() => setPrazoAberto(false)}
      >
        <div className="space-y-5">
          {[
            [
              IconeCheckCirculo,
              'text-axia-blue',
              'Por que o prazo é menor em Recife?',
              atividade.prazos?.porqueRecife,
            ],
            [
              IconeInfoCirculo,
              'text-amber-500',
              'Por que o prazo é maior nas demais localidades?',
              atividade.prazos?.porqueDemais,
            ],
          ].map(([Ic, cor, pergunta, resposta]) => (
            <div key={pergunta}>
              <h4 className="flex items-center gap-2 text-sm font-bold text-axia-blue">
                <Ic className={`h-5 w-5 shrink-0 ${cor}`} />
                {pergunta}
              </h4>
              <p className="mt-2 pl-7 text-sm leading-relaxed text-axia-grey">
                {resposta}
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPrazoAberto(false)}
            className="rounded-full bg-axia-blue px-7 py-2.5 text-sm font-bold text-white hover:bg-axia-blue2"
          >
            Entendi
          </button>
        </div>
      </Modal>
    </>
  )
}

// Faixa de título do formulário — nada a ver com a `Secao` do portal, que é o
// cabeçalho grande de uma tela. Sem `titulo` some e só entrega os campos, para o
// formulário de "Eu mesmo(a)" continuar sendo uma grade única, sem cabeçalho.
const SecaoCampos = ({ titulo, subtitulo, children }) =>
  titulo ? (
    // folga embaixo, e não em cima: assim ela cai entre o último campo de uma seção
    // e o título da seguinte, sem empurrar o primeiro título para longe do
    // "Solicitante". Padding e não margem porque o space-y-6 do <form> tem
    // especificidade maior e um mt- aqui seria ignorado.
    <fieldset className="pb-4">
      {/* sem régua atravessando o formulário: a barrinha à esquerda já marca onde a
          seção começa, e o espaço acima faz o resto da separação */}
      <legend className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-axia-blue">
        <span className="h-4 w-1 rounded-full bg-axia-blue" aria-hidden="true" />
        {titulo}
      </legend>
      {/* alinhado ao texto do título, não à barrinha: o recuo é a largura dela mais
          o gap */}
      <p className="mb-4 mt-1.5 pl-[14px] text-sm text-axia-grey">{subtitulo}</p>
      {children}
    </fieldset>
  ) : (
    children
  )

const Obrigatorio = () => (
  <span className="font-bold text-axia-error" title="Campo obrigatório">
    *
  </span>
)

// ponytail: sem backend, só os nomes dos arquivos são guardados no ticket.
// Troque por upload real (multipart / URL assinada) quando houver API.
function Anexos({ arquivos, onChange }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-axia-purple">
        Anexos <span className="font-normal text-axia-grey/70">(opcional)</span>
      </span>
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-chip border-2 border-dashed border-axia-neutral bg-axia-bg px-4 py-8 text-center transition hover:border-axia-blue hover:bg-axia-blue/5">
        <span className="text-sm font-bold text-axia-blue">
          Clique para selecionar arquivos
        </span>
        <span className="text-xs text-axia-grey/70">
          Prints, planilhas, e-mails ou documentos — vários arquivos por vez
        </span>
        <input
          type="file"
          name="anexos"
          multiple
          onChange={(e) =>
            onChange([...e.target.files].map((f) => ({ nome: f.name, tamanho: f.size })))
          }
          className="hidden"
        />
      </label>
      {arquivos.length > 0 && (
        <ul className="mt-3 space-y-1">
          {arquivos.map((a) => (
            <li
              key={a.nome}
              className="flex items-center gap-3 rounded-chip bg-axia-neutral/40 px-4 py-2 text-sm"
            >
              <span className="truncate">{a.nome}</span>
              <span className="shrink-0 text-xs text-axia-grey/70">
                {formatarTamanho(a.tamanho)}
              </span>
              <button
                type="button"
                onClick={() => onChange(arquivos.filter((x) => x.nome !== a.nome))}
                className="ml-auto shrink-0 text-xs font-bold text-axia-error"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Fundo branco e borda um tom mais escura, como o inputFiltro abaixo: o cinza de
// preenchimento que estava aqui lia como campo desabilitado, ainda mais ao lado do
// "Gestor imediato", que é travado de verdade.
const inputBase =
  'w-full rounded-chip border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-axia-blue'

// Campo preenchido pelo cadastro, não pelo solicitante. Escrito por extenso, e não
// como `${inputBase} bg-slate-100`: as duas classes de fundo têm a mesma
// especificidade e quem ganha é a ordem no CSS gerado, não a do atributo — o
// bg-white do inputBase vencia e o campo saía branco como os demais.
const inputTravado =
  'w-full cursor-not-allowed rounded-chip border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm text-axia-grey/80 outline-none'

// mesma base, mas em pílula e com borda um tom mais escura — só na faixa de
// filtros de "Meus chamados", onde os campos ficam soltos sobre o fundo da página
const inputFiltro =
  'w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-axia-blue'

const idLista = (nome) => `lista-${nome.replace(/\W+/g, '-')}`

// Combobox próprio: abre com a lista completa, filtra ao digitar, teclado e visual
// iguais aos demais dropdowns do portal (o <datalist> nativo herdava o estilo do SO).
function Combobox({
  nome,
  opcoes,
  placeholder,
  inicial = '',
  onChange,
  obrigatorio = true,
  // aceita nome fora da lista: quem entra hoje pode não estar no cadastro ainda.
  // Sem isto o campo recusa o que foi digitado e o formulário não envia.
  livre = false,
  classeInput = inputBase,
}) {
  // opção única: já vem escolhida, não há o que decidir
  const [valor, setValor] = useState(inicial || (opcoes.length === 1 ? opcoes[0] : ''))
  const [aberto, setAberto] = useState(false)
  const [destaque, setDestaque] = useState(0)
  const inputRef = useRef(null)
  const filtradas = filtrarOpcoes(opcoes, valor)

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      livre || !obrigatorio || opcoes.includes(valor) ? '' : 'Escolha uma opção da lista.'
    )
  }, [valor, opcoes, obrigatorio, livre])

  // no modo livre reporta o que foi digitado; no fechado, só o que existe na lista —
  // quem depende disso (gestor) precisa saber se o nome veio do cadastro ou não
  const atualizar = (v) => {
    setValor(v)
    onChange?.(livre || opcoes.includes(v) ? v : '')
  }

  const escolher = (o) => {
    atualizar(o)
    setAberto(false)
  }

  function aoTeclar(e) {
    if (e.key === 'Escape') return setAberto(false)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setAberto(true)
      const n = filtradas.length
      if (n) {
        setDestaque((d) => (e.key === 'ArrowDown' ? (d + 1) % n : (d - 1 + n) % n))
      }
    }
    if (e.key === 'Enter' && aberto && filtradas[destaque]) {
      e.preventDefault()
      escolher(filtradas[destaque])
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={idLista(nome)}
        name={nome}
        value={valor}
        required={obrigatorio}
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto}
        placeholder={placeholder}
        onChange={(e) => {
          atualizar(e.target.value)
          setAberto(true)
          setDestaque(0)
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={aoTeclar}
        // com o "limpar" à mostra, o texto precisa parar antes de dois ícones
        className={`${classeInput} ${valor ? 'pr-16' : 'pr-10'}`}
      />
      {/* só com algo escolhido: um X permanente num campo vazio não limpa nada e
          ainda rouba espaço do texto. O foco volta ao input, que reabre a lista —
          quem limpou quase sempre quer escolher outra coisa. */}
      {valor && (
        <button
          type="button"
          aria-label="Limpar seleção"
          title="Limpar seleção"
          onClick={() => {
            atualizar('')
            inputRef.current?.focus()
          }}
          className="absolute right-9 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-axia-grey/60 transition hover:bg-axia-neutral hover:text-axia-purple"
        >
          <IconeX className="h-4 w-4" />
        </button>
      )}
      <SetaCampo />

      {aberto && (
        <>
          <button
            type="button"
            aria-label="Fechar lista"
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          {/* wrapper com overflow-hidden: sem ele a barra de rolagem quadra o canto direito */}
          <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-chip border border-axia-neutral bg-white shadow-xl">
            <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
              {filtradas.length ? (
                filtradas.map((o, i) => (
                  <li key={o}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={o === valor}
                      onMouseEnter={() => setDestaque(i)}
                      onClick={() => escolher(o)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition ${
                        i === destaque
                          ? 'bg-axia-blue/10 font-bold text-axia-blue'
                          : 'text-axia-grey1 hover:bg-slate-100'
                      }`}
                    >
                      {o}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-axia-grey/60">
                  Nenhuma opção encontrada.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

// Lista suspensa de marcar vários. O painel do Popover desmonta ao fechar, então
// quem leva os valores para o FormData são os inputs escondidos aqui fora — um por
// marcado, que o `enviar` junta numa linha só no detalhe do chamado.
function ListaMarcavel({ nome, opcoes, placeholder }) {
  const [marcados, setMarcados] = useState([])
  const alternar = (o) =>
    setMarcados((m) => (m.includes(o) ? m.filter((x) => x !== o) : [...m, o]))

  return (
    <>
      <Popover
        type="button"
        largura="sm:w-full"
        classeBotao={`${inputBase} flex cursor-pointer items-center justify-between gap-2 text-left`}
        rotulo={
          <>
            <span className={`truncate ${marcados.length ? '' : 'text-axia-grey/50'}`}>
              {marcados.join(', ') || placeholder}
            </span>
            <Chevron />
          </>
        }
      >
        {() => (
          <ul className="max-h-60 overflow-y-auto p-1">
            {opcoes.map((o) => (
              <li key={o}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-chip px-3 py-2 text-sm hover:bg-axia-blue/5">
                  <input
                    type="checkbox"
                    checked={marcados.includes(o)}
                    onChange={() => alternar(o)}
                    className="h-4 w-4 rounded border-axia-neutral accent-axia-blue"
                  />
                  {o}
                </label>
              </li>
            ))}
          </ul>
        )}
      </Popover>
      {marcados.map((o) => (
        <input key={o} type="hidden" name={nome} value={o} />
      ))}
    </>
  )
}

function Campo({
  label,
  nome,
  tipo,
  opcoes,
  placeholder,
  inicial,
  onChange,
  opcional,
  livre,
}) {
  // "Informe o gestor" / "Informe a matrícula": o artigo vem do gênero do rótulo
  const dica = `Informe ${artigoDe(label)} ${label.toLowerCase()}`
  // o formulário é obrigatório por padrão; só quem passa `opcional` escapa
  const marca = opcional ? (
    <span className="font-normal text-axia-grey/70">(opcional)</span>
  ) : (
    <Obrigatorio />
  )

  if (tipo === 'combo') {
    return (
      <div>
        <label
          htmlFor={idLista(nome)}
          className="mb-1.5 block text-sm font-bold text-axia-purple"
        >
          {label} <Obrigatorio />
        </label>
        <Combobox
          nome={nome}
          opcoes={opcoes}
          // "Selecione o motivo": sem isto o combo do catálogo abria vazio e sem
          // dica do que escolher
          placeholder={placeholder ?? `Selecione ${artigoDe(label)} ${label.toLowerCase()}`}
          inicial={inicial}
          onChange={onChange}
          livre={livre}
        />
      </div>
    )
  }

  // escolha única entre poucas opções: o radio nu, sem a pílula de "Solicitante" —
  // ali ela marca a troca de contexto do formulário inteiro, aqui é só mais um campo
  if (tipo === 'radio') {
    return (
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-axia-purple">
          {label} <Obrigatorio />
        </legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {opcoes.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 text-sm text-axia-grey"
            >
              <input
                type="radio"
                name={nome}
                value={o}
                required
                className="h-4 w-4 accent-axia-blue"
              />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  // marcação múltipla — e sempre opcional: o grupo não tem "nenhuma" para exigir
  if (tipo === 'checkbox') {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-bold text-axia-purple">
          {label} <span className="font-normal text-axia-grey/70">(opcional)</span>
        </span>
        <ListaMarcavel
          nome={nome}
          opcoes={opcoes}
          placeholder={placeholder ?? `Selecione ${artigoDe(label)} ${label.toLowerCase()}`}
        />
      </div>
    )
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-axia-purple">
        {label} {marca}
      </span>
      {tipo === 'textarea' ? (
        <textarea
          name={nome}
          required={!opcional}
          rows={4}
          placeholder={placeholder || dica}
          className={inputBase}
        />
      ) : tipo === 'select' ? (
        <span className="relative block">
          {/* opção única já vem escolhida; seta igual à do combobox */}
          <select
            name={nome}
            required
            defaultValue={opcoes.length === 1 ? opcoes[0] : ''}
            className={`${inputBase} cursor-pointer appearance-none pr-10`}
          >
            {opcoes.length > 1 && (
              <option value="" disabled>
                {placeholder || 'Selecione...'}
              </option>
            )}
            {opcoes.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <SetaCampo />
        </span>
      ) : (
        <input
          name={nome}
          required={!opcional}
          type="text"
          placeholder={placeholder || dica}
          className={inputBase}
        />
      )}
    </label>
  )
}

function DetalheTicket({
  ticket,
  novo,
  trilha,
  onResponder,
  onSimularAtendente,
  onSimularConclusao,
  onResolver,
  onReabrir,
  onAvaliar,
  onCancelar,
  onVoltar,
}) {
  const [confirmando, setConfirmando] = useState(false)
  const aberto = podeInteragir(ticket)
  const aguardando = aguardandoConfirmacao(ticket)
  const concluido = ticket.status === 'Fechado'
  // pesquisa só em chamado concluído: cancelado não teve atendimento a avaliar
  const pesquisaPendente = concluido && !ticket.avaliacao

  return (
    <>
      <Cabecalho
        trilha={trilha}
        titulo={ticket.atividade}
        onVoltar={onVoltar}
        extra={
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-bold text-axia-blue">
              {ticket.protocolo}
            </span>
            <Badge status={ticket.status} />
            <span className="text-xs text-axia-grey/70">
              Solicitado em {new Date(ticket.criadoEm).toLocaleString('pt-BR')}
            </span>
          </div>
        }
      />

      {novo && (
        <div className="mb-6 flex items-start gap-3 rounded-card border border-axia-success/40 bg-axia-success/10 p-5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-axia-success text-white">
            <IconeCheck />
          </span>
          <div>
            <p className="font-bold text-green-800">Solicitação registrada</p>
            <p className="mt-1 text-sm text-green-900">
              Seu chamado foi enviado para triagem e será analisado pela equipe
              responsável.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Resumo icone={<IconePessoa />} rotulo="Solicitante">
          <p className="font-bold text-axia-purple">{ticket.solicitante}</p>
        </Resumo>
        <Resumo icone={<IconeEquipe />} rotulo="Responsável">
          <p className="font-bold text-axia-purple">
            {ticket.responsavel || atendenteDe(ticket.protocolo, ATENDENTES)}
          </p>
        </Resumo>
        <Resumo icone={<IconeCalendario />} rotulo="Prazo previsto">
          <p className="font-bold text-axia-purple">
            {new Date(prazoPrevisto(ticket.criadoEm)).toLocaleDateString('pt-BR')}
          </p>
        </Resumo>
        <Resumo icone={<IconeStatus />} rotulo="Status">
          <Badge status={ticket.status} />
        </Resumo>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-card border border-axia-neutral bg-white shadow-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-axia-purple">Atividade do chamado</h3>
            {aberto && (
              // ponytail: sem backend não há atendente de verdade — troque estes botões
              // por polling/websocket da fila de atendimento quando a API existir.
              <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
                <button
                  onClick={onSimularAtendente}
                  className="text-xs text-axia-grey/60 underline"
                >
                  simular resposta do atendente
                </button>
                {!aguardando && (
                  <button
                    onClick={onSimularConclusao}
                    className="text-xs text-axia-grey/60 underline"
                  >
                    simular resposta definitiva
                  </button>
                )}
              </div>
            )}
          </div>

          {/* passo final só quando o chamado encerra — em andamento ele não agrega */}
          <ol className="mt-5">
            {ticket.interacoes.map((i, idx) => (
              <PassoAtividade
                key={idx}
                autor={i.autor}
                texto={i.texto}
                em={i.em}
                ultimo={aberto && idx === ticket.interacoes.length - 1}
              />
            ))}
            {!aberto && (
              <PassoAtividade
                autor="Fim"
                status={ticket.status}
                texto={
                  ticket.status === CANCELADO
                    ? 'Chamado cancelado pelo solicitante.'
                    : 'Chamado concluído.'
                }
                ultimo
              />
            )}
          </ol>

          {/* resposta definitiva do atendente: quem confirma o encerramento é o
              solicitante, e o "sim" já fecha o chamado e abre a pesquisa */}
          {aguardando && (
            <div className="mt-6 rounded-chip border border-axia-blue/40 bg-axia-blue/5 p-5">
              <p className="font-bold text-axia-purple">A solicitação foi resolvida?</p>
              <p className="mt-1 text-sm text-axia-grey">
                Confirmando, o chamado é concluído e você avalia o atendimento.
              </p>
              {/* grid de 2 no celular: em flex-wrap o "não" caía sozinho numa
                  segunda linha e a dupla perdia o ar de par de opções */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={onResolver}
                  className="rounded-full bg-axia-blue px-4 py-2 text-sm font-bold text-white hover:bg-axia-blue2 sm:px-7"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={onReabrir}
                  className="rounded-full border border-axia-neutral bg-white px-4 py-2 text-sm font-bold text-axia-grey hover:bg-axia-neutral/50 sm:px-7"
                >
                  Não, ainda preciso de ajuda
                </button>
              </div>
            </div>
          )}

          {/* com a pergunta aberta a resposta é o próprio "sim"/"não": a caixa de
              mensagem só volta se o solicitante disser que ainda precisa de ajuda */}
          {aberto && !aguardando && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onResponder(new FormData(e.target).get('texto').trim())
                e.target.reset()
              }}
              className="mt-6 flex items-end gap-3 rounded-chip border border-axia-neutral bg-slate-100/70 p-2 focus-within:border-axia-blue focus-within:bg-white"
            >
              <textarea
                name="texto"
                required
                rows={2}
                placeholder="Escreva uma mensagem para o atendente..."
                className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button className="mb-1 shrink-0 rounded-full bg-axia-blue px-6 py-2 text-sm font-bold text-white hover:bg-axia-blue2">
                Enviar
              </button>
            </form>
          )}

          {/* a pesquisa entra no lugar da caixa de mensagem: é o último passo do
              atendimento, e responder ali mantém tudo na mesma coluna */}
          {pesquisaPendente && (
            <div className="mt-6 rounded-chip border border-axia-neutral bg-white p-5">
              <PesquisaSatisfacao onEnviar={onAvaliar} />
            </div>
          )}

          {!aberto && !pesquisaPendente && (
            <p className="mt-6 rounded-chip bg-axia-neutral/50 p-4 text-sm text-axia-grey">
              Chamado {ticket.status.toLowerCase()} — não aceita novas interações.
            </p>
          )}
        </section>

        <div className="space-y-6 lg:col-span-2">
          <Bloco titulo="Detalhes da solicitação">
            <dl className="space-y-2 text-sm">
              <Linha rotulo="Área" valor={ticket.portfolio} />
              <Linha rotulo="Serviço" valor={ticket.servico} />
              {ticket.abertoPor && ticket.abertoPor !== ticket.solicitante && (
                <Linha rotulo="Aberto por" valor={ticket.abertoPor} />
              )}
              {/* sem filtro: os campos saem na ordem em que o formulário perguntou,
                  e a descrição é mais uma linha — não tem mais bloco só dela */}
              {ticket.dados.map(([k, v]) => (
                <Linha key={k} rotulo={k} valor={v} />
              ))}
              <Linha
                rotulo="Criado em"
                valor={new Date(ticket.criadoEm).toLocaleString('pt-BR')}
              />
            </dl>
            {aberto && (
              <button
                onClick={() => setConfirmando(true)}
                className="mt-5 w-full rounded-full border border-axia-error px-5 py-2 text-sm font-bold text-axia-error hover:bg-axia-error hover:text-white"
              >
                Cancelar solicitação
              </button>
            )}
          </Bloco>

          <Bloco titulo={`Anexos (${ticket.anexos?.length || 0})`} aberto={!concluido}>
            {ticket.anexos?.length ? (
              <ul className="space-y-2">
                {ticket.anexos.map((a) => (
                  <ItemAnexo key={a.nome ?? a} anexo={a} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-axia-grey/60">
                Nenhum arquivo foi anexado a esta solicitação.
              </p>
            )}
          </Bloco>

          {/* fecha a coluna: num chamado concluído é a informação nova da tela */}
          {ticket.avaliacao && (
            <Bloco titulo="Avaliação do atendimento">
              <div className="flex items-center gap-3">
                <Carinha
                  nota={NOTA_DE[ticket.avaliacao.nota]}
                  className="h-11 w-11 shrink-0"
                />
                <div>
                  <p className="font-bold text-axia-purple">
                    {NOTA_DE[ticket.avaliacao.nota].rotulo}
                  </p>
                  <p className="text-xs text-axia-grey/70">
                    Nota {ticket.avaliacao.nota} de 5
                  </p>
                </div>
              </div>
              {ticket.avaliacao.comentario && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-axia-grey">
                  {ticket.avaliacao.comentario}
                </p>
              )}
            </Bloco>
          )}
        </div>
      </div>

      <Modal
        aberto={confirmando}
        titulo="Cancelar solicitação?"
        onFechar={() => setConfirmando(false)}
      >
        <p className="text-sm text-axia-grey">
          O chamado <strong className="font-mono">{ticket.protocolo}</strong> será
          cancelado e não poderá ser reaberto. Informe o motivo:
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onCancelar(new FormData(e.target).get('motivo').trim())
            setConfirmando(false)
          }}
          className="mt-4 space-y-4"
        >
          <textarea
            name="motivo"
            required
            rows={3}
            placeholder="Motivo do cancelamento"
            className={inputBase}
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-full border border-axia-neutral px-5 py-2 text-sm font-bold text-axia-grey hover:bg-axia-neutral/50"
            >
              Manter solicitação
            </button>
            <button className="rounded-full bg-axia-error px-5 py-2 text-sm font-bold text-white hover:brightness-90">
              Confirmar cancelamento
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// Uma SVG só para as cinco notas: muda a cor do círculo, a curva da boca e as
// sobrancelhas. Emoji ficava com o desenho de cada sistema operacional.
const NOTAS = [
  {
    n: 1,
    rotulo: 'Muito insatisfeito',
    cor: '#f59a95',
    boca: 'M15.5 33.5q8.5-8 17 0',
    // duas retas inclinadas para o centro — o "V" da cara fechada
    sobrancelhas: 'M11.5 11l7 4M36.5 11l-7 4',
  },
  { n: 2, rotulo: 'Insatisfeito', cor: '#eeb287', boca: 'M16 32q8-6 16 0' },
  { n: 3, rotulo: 'Neutro', cor: '#f7d46b', boca: 'M16 30.5h16' },
  { n: 4, rotulo: 'Satisfeito', cor: '#a3dc9b', boca: 'M16 28.5q8 6 16 0' },
  // mesma curva do "satisfeito", só mais larga e funda: a boca preenchida saía
  // como uma mancha escura no lugar do sorriso
  { n: 5, rotulo: 'Muito satisfeito', cor: '#68cd7c', boca: 'M14 27.5q10 9.5 20 0' },
]

const NOTA_DE = Object.fromEntries(NOTAS.map((o) => [o.n, o]))

function Carinha({ nota, className = 'h-12 w-12' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill={nota.cor} />
      <g stroke="#3a3f46" strokeWidth="2.6" strokeLinecap="round" fill="none">
        {nota.sobrancelhas && <path d={nota.sobrancelhas} />}
        <ellipse cx="17" cy="21" rx="2.4" ry="3.1" fill="#3a3f46" stroke="none" />
        <ellipse cx="31" cy="21" rx="2.4" ry="3.1" fill="#3a3f46" stroke="none" />
        <path d={nota.boca} />
      </g>
    </svg>
  )
}

const MAX_COMENTARIO = 500

function PesquisaSatisfacao({ onEnviar }) {
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onEnviar(nota, comentario)
      }}
      // largura presa: dentro da coluna do chat as carinhas se espalhariam
      className="mx-auto max-w-xl"
    >
      <div className="text-center">
        {/* balão: o canto inferior esquerdo reto faz a ponta apontar para o texto */}
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl rounded-bl-md bg-axia-blue text-white">
          <IconeEstrela preenchida />
        </span>
        <h3 className="mt-4 text-xl font-bold text-axia-purple">
          Como foi sua experiência?
        </h3>
        <p className="mt-1 text-sm text-axia-grey">
          Sua opinião é muito importante para melhorarmos nosso atendimento.
        </p>
      </div>

      {/* colunas iguais: em flex a largura de cada botão vinha do rótulo, e as
          carinhas ficavam com espaçamento irregular entre si */}
      <div className="mt-6 grid grid-cols-5 gap-1 sm:gap-2">
        {NOTAS.map((o) => (
          <button
            key={o.n}
            type="button"
            aria-pressed={nota === o.n}
            onClick={() => setNota(o.n)}
            className={`group flex flex-col items-center gap-1.5 rounded-chip px-1 py-2 transition ${
              nota === o.n ? 'bg-axia-blue/10' : 'hover:bg-slate-100'
            }`}
          >
            <span
              className={`block rounded-full transition ${
                nota === o.n
                  ? 'scale-110 ring-2 ring-axia-blue ring-offset-2'
                  : 'group-hover:scale-105'
              }`}
            >
              <Carinha nota={o} />
            </span>
            {/* rótulo e número acompanham a seleção: só a cor muda, o peso é fixo */}
            <span
              className={`text-center text-[11px] font-bold leading-tight sm:text-xs ${
                nota === o.n ? 'text-axia-blue' : 'text-axia-grey'
              }`}
            >
              {o.rotulo}
            </span>
          </button>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="mb-1.5 block text-sm font-bold text-axia-purple">
          Comentário <span className="font-normal text-axia-grey/70">(opcional)</span>
        </span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={MAX_COMENTARIO}
          rows={3}
          placeholder="Conte-nos mais sobre sua experiência..."
          className={inputBase}
        />
        <span className="mt-1 block text-right text-xs text-axia-grey/50">
          {comentario.length}/{MAX_COMENTARIO}
        </span>
      </label>

      <button
        disabled={!nota}
        className="mt-4 w-full rounded-full bg-axia-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-axia-blue2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Enviar avaliação
      </button>
    </form>
  )
}

// <dialog> nativo: backdrop, Esc e foco preso vêm de graça.
function Modal({ aberto, titulo, onFechar, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      onClick={(e) => e.target === ref.current && onFechar()}
      className="w-[calc(100%-2rem)] max-w-lg rounded-card p-0 backdrop:bg-axia-purple/60 open:m-auto"
    >
      <div className="p-7">
        <h3 className="text-lg font-bold text-axia-purple">{titulo}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  )
}

// Cartão de resumo do topo (Solicitante, Responsável, Prazo, Status).
const Resumo = ({ icone, rotulo, children }) => (
  <div className="flex items-center gap-3 rounded-card border border-axia-neutral bg-white shadow-card px-5 py-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-axia-blue/10 text-axia-blue">
      {icone}
    </span>
    <div className="min-w-0">
      <p className="text-xs text-axia-grey/70">{rotulo}</p>
      <div className="mt-0.5 truncate text-sm">{children}</div>
    </div>
  </div>
)

// Bloco recolhível da coluna direita: <details> nativo, aberto por padrão.
// `aberto` só define o estado inicial — depois quem manda é o clique do usuário.
const Bloco = ({ titulo, aberto = true, children }) => (
  <details
    open={aberto}
    className="group rounded-card border border-axia-neutral bg-white shadow-card"
  >
    <summary className="flex cursor-pointer list-none items-center gap-2 p-6 font-bold text-axia-purple [&::-webkit-details-marker]:hidden">
      {titulo}
      <span className="ml-auto text-axia-grey/60 transition group-open:rotate-180">
        <Chevron />
      </span>
    </summary>
    <div className="px-6 pb-6">{children}</div>
  </details>
)

const ESTILO_PASSO = {
  Sistema: { cor: 'bg-axia-success text-white', icone: <IconeCheck />, titulo: 'Solicitação criada' },
  Atendente: { cor: 'bg-axia-blue text-white', icone: <IconeBalao />, titulo: 'Atendimento' },
  Solicitante: { cor: 'bg-axia-sky text-white', icone: <IconePessoa />, titulo: 'Sua mensagem' },
}

function PassoAtividade({ autor, texto, em, ultimo, status }) {
  const fim = autor === 'Fim'
  const concluido = status === 'Fechado'
  const cancelado = status === CANCELADO
  const estilo = fim
    ? {
        cor: concluido
          ? 'bg-axia-success text-white'
          : cancelado
            ? 'bg-axia-error text-white'
            : 'border border-axia-neutral bg-white text-axia-grey/40',
        icone: <IconeCheck />,
        titulo: cancelado ? 'Cancelado' : 'Concluído',
      }
    : ESTILO_PASSO[autor] || ESTILO_PASSO.Solicitante

  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${estilo.cor}`}
        >
          {estilo.icone}
        </span>
        {!ultimo && <span className="w-px flex-1 bg-axia-neutral" />}
      </div>
      <div className={ultimo ? 'pb-1' : 'pb-6'}>
        <p
          className={`font-bold ${fim && !concluido && !cancelado ? 'text-axia-grey/50' : 'text-axia-purple'}`}
        >
          {estilo.titulo}
        </p>
        {em && (
          <p className="mt-0.5 text-xs text-axia-grey/60">
            {new Date(em).toLocaleString('pt-BR')}
          </p>
        )}
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-axia-grey">{texto}</p>
      </div>
    </li>
  )
}

// Anexo: nome truncado com tooltip nativo (title) e ações de ver/baixar.
// ponytail: sem backend não há arquivo para servir — os botões avisam isso.
function ItemAnexo({ anexo }) {
  const { nome, tamanho } = typeof anexo === 'string' ? { nome: anexo } : anexo
  const semArquivo = () =>
    alert(`"${nome}" ainda não pode ser aberto: o upload real depende do backend.`)

  return (
    <li className="group flex items-center gap-3 rounded-chip px-1 py-1 text-sm hover:bg-axia-blue/5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-chip bg-axia-blue/10 text-axia-blue">
        <IconeArquivo />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate" title={nome}>
          {nome}
        </span>
        {tamanho && (
          <span className="text-xs text-axia-grey/70">{formatarTamanho(tamanho)}</span>
        )}
      </span>
      <span className="flex shrink-0 gap-1">
        <button
          onClick={semArquivo}
          title={`Visualizar ${nome}`}
          aria-label={`Visualizar ${nome}`}
          className="rounded-full p-1.5 text-axia-grey/60 hover:bg-white hover:text-axia-blue"
        >
          <IconeOlho />
        </button>
        <button
          onClick={semArquivo}
          title={`Baixar ${nome}`}
          aria-label={`Baixar ${nome}`}
          className="rounded-full p-1.5 text-axia-grey/60 hover:bg-white hover:text-axia-blue"
        >
          <IconeDownload />
        </button>
      </span>
    </li>
  )
}

function IconeOlho() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconeDownload() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 4v10m0 0 4-4m-4 4-4-4" />
      <path d="M4.5 17.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1" />
    </svg>
  )
}

function IconeCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

function IconePessoa() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  )
}

function IconeEquipe() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.5c2 .7 3.5 2.3 3.5 4.5" />
    </svg>
  )
}

function IconeCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </svg>
  )
}

function IconeStatus() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12h8" />
    </svg>
  )
}

function IconeBalao() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.1A7.5 7.5 0 1 1 20 12Z" />
    </svg>
  )
}

function IconeArquivo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8l-4.5-4.5Z" />
      <path d="M14 3.5V8h4.5" />
    </svg>
  )
}

const Linha = ({ rotulo, valor }) => (
  <div className="flex gap-3 border-b border-axia-neutral/70 pb-2 last:border-0">
    <dt className="w-36 shrink-0 text-axia-grey/70">{rotulo}</dt>
    {/* pre-wrap: a descrição da necessidade agora é uma linha daqui e pode ter
        quebras de parágrafo */}
    <dd className="min-w-0 whitespace-pre-wrap break-words font-medium text-axia-grey1">
      {valor}
    </dd>
  </div>
)

const FILTROS_NOTIF = ['Todas', 'Não visualizadas', 'Visualizadas']

function Notificacoes({ lista, lidas, trilha, onAbrir, onMarcarTodas, onVoltar }) {
  const [filtro, setFiltro] = useState('Todas')
  const vistas = new Set(lidas)
  const visiveis =
    filtro === 'Todas'
      ? lista
      : filtro === 'Visualizadas'
        ? visualizadas(lista, lidas)
        : naoVisualizadas(lista, lidas)

  return (
    <>
      <Cabecalho
        trilha={trilha}
        titulo="Notificações"
        subtitulo="Atualizações do atendimento nos seus chamados."
        onVoltar={onVoltar}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTROS_NOTIF.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${
              filtro === f
                ? 'bg-axia-blue text-white'
                : 'border border-axia-neutral bg-white text-axia-grey'
            }`}
          >
            {f}
            {f === 'Não visualizadas' &&
              ` (${naoVisualizadas(lista, lidas).length})`}
          </button>
        ))}
        {naoVisualizadas(lista, lidas).length > 0 && (
          <button
            onClick={onMarcarTodas}
            className="ml-auto text-sm font-bold text-axia-blue-soft hover:text-axia-blue"
          >
            marcar todas como visualizadas
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {visiveis.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => onAbrir(n)}
              className={`w-full rounded-card border bg-white p-5 text-left shadow-card transition hover:border-axia-blue hover:shadow-card-hover ${
                vistas.has(n.id) ? 'border-axia-neutral' : 'border-axia-blue/40'
              }`}
            >
              <ItemNotificacao n={n} naoVista={!vistas.has(n.id)} />
            </button>
          </li>
        ))}
        {!visiveis.length && <Vazio>Nenhuma notificação neste filtro.</Vazio>}
      </ul>
    </>
  )
}

const ESTATISTICAS = [
  { status: 'Aberto', titulo: 'Em aberto', nota: 'Aguardando atendimento', cor: 'bg-axia-blue/10 text-axia-blue' },
  { status: 'Andamento', titulo: 'Em andamento', nota: 'Em acompanhamento', cor: 'bg-axia-success/15 text-green-700' },
  { status: 'Pendente', titulo: 'Pendentes', nota: 'Aguardando retorno', cor: 'bg-axia-warning/20 text-yellow-700' },
  { status: 'Aguardando aprovação', titulo: 'Aguardando aprovação', nota: 'Em aprovação', cor: 'bg-axia-sky/30 text-axia-sky2' },
  { status: 'Fechado', titulo: 'Concluídos', nota: 'Finalizados', cor: 'bg-axia-purple/10 text-axia-purple' },
  { status: CANCELADO, titulo: 'Cancelados', nota: 'Encerrados', cor: 'bg-axia-error/10 text-axia-error' },
]

function MeusTickets({ tickets, statusInicial, trilha, onAbrir, onVoltar }) {
  const [termo, setTermo] = useState('')
  // texto só entra no filtro ao clicar em Pesquisar (ou Enter); os seletores valem na hora
  const [termoAplicado, setTermoAplicado] = useState('')
  const [status, setStatus] = useState(statusInicial || 'Todos')
  const [servico, setServico] = useState('Todos')
  const [periodo, setPeriodo] = useState('Todo o período')
  const [ordem, setOrdem] = useState(ORDENS[0])
  const [reset, setReset] = useState(0) // remonta o combobox ao limpar
  const [porPagina, setPorPagina] = useState(ITENS_POR_PAGINA[0])
  const [pagina, setPagina] = useState(1)

  function limpar() {
    setTermo('')
    setTermoAplicado('')
    setStatus('Todos')
    setServico('Todos')
    setPeriodo('Todo o período')
    setOrdem(ORDENS[0])
    setReset((n) => n + 1)
    setPagina(1)
  }

  const servicos = [...new Set(tickets.map((t) => t.servico))].sort()
  const visiveis = ordenarChamados(
    filtrarChamados(tickets, {
      termo: termoAplicado,
      status,
      servico,
      dias: PERIODOS[periodo],
    }),
    ordem
  )

  // página derivada (e não corrigida por efeito): filtrar pode encurtar a lista
  const paginas = totalPaginas(visiveis.length, porPagina)
  const paginaAtual = Math.min(pagina, paginas)
  const daPagina = paginar(visiveis, paginaAtual, porPagina)
  const primeiro = visiveis.length ? (paginaAtual - 1) * porPagina + 1 : 0
  const ultimo = (paginaAtual - 1) * porPagina + daPagina.length

  return (
    <>
      <Cabecalho
        trilha={trilha}
        titulo="Meus chamados"
        subtitulo="Acompanhe o andamento das suas solicitações e interaja com a equipe responsável."
        onVoltar={onVoltar}
      />

      {/* 190px é o menor card que ainda cabe "Aguardando aprovação" em duas linhas:
          os seis entram numa fileira a partir de ~1200px e quebram sozinhos abaixo disso */}
      <div className="mb-6 grid gap-3 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        {ESTATISTICAS.map((e) => (
          <button
            key={e.status}
            onClick={() => setStatus(status === e.status ? 'Todos' : e.status)}
            className={`flex flex-col rounded-card border bg-white px-4 pb-3 pt-3.5 text-left shadow-card transition hover:shadow-card-hover ${
              status === e.status ? 'border-axia-blue' : 'border-axia-neutral'
            }`}
          >
            {/* duas linhas reservadas no título: sem isso o card de rótulo curto
                fica mais baixo e o número sai do eixo dos vizinhos */}
            <p className="min-h-[2.2rem] text-sm font-bold leading-tight text-axia-purple">
              {e.titulo}
            </p>

            <span className="mt-1 flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${e.cor}`}
              >
                <IconeStatus />
              </span>
              <span className="text-3xl font-bold leading-none text-axia-purple">
                {tickets.filter((t) => t.status === e.status).length}
              </span>
            </span>

            {/* mt-auto: com alturas iguais na fileira, a nota encosta no pé do card */}
            <span className="mt-auto pt-2 text-xs leading-tight text-axia-grey/60">
              {e.nota}
            </span>
          </button>
        ))}
      </div>

      {/* busca e filtros no mesmo painel; a busca continua sendo uma ação
          (Enter ou botão) e os seletores valem na hora */}
      <div className="mb-6 rounded-card border border-axia-neutral bg-white p-5 shadow-card">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setTermoAplicado(termo)
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <CampoFiltro rotulo="Buscar chamado" largura="min-w-64 flex-1" escuro>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-axia-grey/50">
              <IconeLupa />
            </span>
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Pesquise por nº do chamado, serviço ou palavra-chave"
              className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-axia-blue"
            />
          </CampoFiltro>
          <button className="shrink-0 rounded-full border border-axia-blue px-8 py-2.5 text-sm font-bold text-axia-blue hover:bg-axia-blue hover:text-white">
            Pesquisar
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-end gap-4">
        <CampoFiltro rotulo="Status">
          <Seletor
            valor={status}
            onChange={setStatus}
            opcoes={['Todos', ...STATUS, CANCELADO]}
          />
        </CampoFiltro>

        {/* serviço é a lista mais longa: combobox com busca, como no formulário */}
        <CampoFiltro rotulo="Serviço" largura="w-72">
          <Combobox
            key={reset}
            nome="filtro-servico"
            opcoes={['Todos', ...servicos]}
            inicial="Todos"
            obrigatorio={false}
            placeholder="Todos"
            classeInput={`${inputFiltro} font-bold text-axia-purple`}
            onChange={(v) => setServico(v || 'Todos')}
          />
        </CampoFiltro>

        <CampoFiltro rotulo="Período">
          <Seletor
            valor={periodo}
            onChange={setPeriodo}
            opcoes={Object.keys(PERIODOS)}
          />
        </CampoFiltro>

        <CampoFiltro rotulo="Ordenar por">
          <Seletor valor={ordem} onChange={setOrdem} opcoes={ORDENS} />
        </CampoFiltro>

          <button
            type="button"
            onClick={limpar}
            className="ml-auto rounded-full px-4 py-2.5 text-sm font-bold text-axia-grey/70 transition hover:text-axia-blue"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* cabeçalho de colunas: o mesmo template do grid da linha, para as duas
          grades ficarem alinhadas. Só no desktop, onde a linha vira tabela. */}
      <div className="hidden px-6 pb-2 text-[11px] font-bold uppercase tracking-wide text-axia-grey/60 lg:grid lg:grid-cols-[minmax(0,1fr)_180px_180px_170px_150px_20px] lg:gap-8">
        <span>Chamado</span>
        <span>Serviço</span>
        <span>Status</span>
        <span>Última atualização</span>
        <span>Prazo estimado</span>
        <span />
      </div>

      <ul className="space-y-3">
        {daPagina.map((t) => (
          <li key={t.protocolo}>
            <LinhaChamado chamado={t} onAbrir={() => onAbrir(t.protocolo)} />
          </li>
        ))}
        {!visiveis.length && <Vazio>Nenhum chamado com esses filtros.</Vazio>}
      </ul>

      {visiveis.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-axia-grey/70">
            Mostrando {primeiro}–{ultimo} de {visiveis.length} chamado(s)
            {visiveis.length !== tickets.length && ` (${tickets.length} no total)`}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-axia-grey/70">
              Itens por página
              <span className="relative">
                <select
                  value={porPagina}
                  onChange={(e) => {
                    setPorPagina(Number(e.target.value))
                    setPagina(1)
                  }}
                  className="cursor-pointer appearance-none rounded-full border border-axia-neutral bg-white py-2 pl-4 pr-10 text-sm font-bold text-axia-purple outline-none focus:border-axia-blue"
                >
                  {ITENS_POR_PAGINA.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                <SetaCampo />
              </span>
            </label>

            <div className="flex items-center gap-2">
              <BotaoPagina
                rotulo="Página anterior"
                desabilitado={paginaAtual === 1}
                onClick={() => setPagina(paginaAtual - 1)}
              >
                <span className="rotate-180">
                  <ChevronDireita />
                </span>
              </BotaoPagina>
              <span className="min-w-24 text-center text-sm font-bold text-axia-purple">
                {paginaAtual} de {paginas}
              </span>
              <BotaoPagina
                rotulo="Próxima página"
                desabilitado={paginaAtual === paginas}
                onClick={() => setPagina(paginaAtual + 1)}
              >
                <ChevronDireita />
              </BotaoPagina>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

const CampoFiltro = ({ rotulo, largura = 'w-52', escuro, children }) => (
  <label className={`block ${largura}`}>
    <span
      className={`mb-1.5 block text-xs font-bold uppercase tracking-wide ${
        escuro ? 'text-axia-sky2' : 'text-axia-grey/70'
      }`}
    >
      {rotulo}
    </span>
    <span className="relative block">{children}</span>
  </label>
)

// appearance-none + nosso Chevron: a seta nativa do SO destoava do combobox
const Seletor = ({ valor, onChange, opcoes }) => (
  <>
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputFiltro} cursor-pointer appearance-none truncate pr-10 font-bold text-axia-purple`}
    >
      {opcoes.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
    <SetaCampo />
  </>
)

const SetaCampo = () => (
  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-axia-grey/60">
    <Chevron />
  </span>
)

function LinhaChamado({ chamado, onAbrir }) {
  const prazo = prazoPrevisto(chamado.criadoEm)
  const restam = diasUteisAte(prazo)
  const encerrado = !podeInteragir(chamado)
  const atualizadoEm = ultimaAtualizacao(chamado)
  const autor =
    chamado.interacoes?.at(-1)?.autor ||
    chamado.responsavel ||
    atendenteDe(chamado.protocolo, ATENDENTES)

  // texto do prazo: encerrado não tem prazo a cumprir, e vencido precisa saltar
  const prazoTexto = encerrado
    ? '—'
    : restam < 0
      ? 'Vencido'
      : restam === 0
        ? 'Vence hoje'
        : `${restam} ${restam === 1 ? 'dia útil' : 'dias úteis'}`

  return (
    // colunas fixas no desktop para tudo alinhar entre as linhas; no celular vira
    // grade de 2 com o protocolo ocupando a linha inteira — em flex-wrap os campos
    // encavalavam e cada card quebrava num ponto diferente
    <button
      onClick={onAbrir}
      className="grid w-full grid-cols-2 items-start gap-x-4 gap-y-4 rounded-card border border-axia-neutral bg-white p-5 text-left shadow-card transition hover:border-axia-blue hover:shadow-card-hover lg:grid-cols-[minmax(0,1fr)_180px_180px_170px_150px_20px] lg:items-center lg:gap-8"
    >
      <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-chip bg-axia-blue/10">
          <IconeServico nome={chamado.servico} className="h-5 w-5 text-axia-blue" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-mono text-sm font-bold tracking-wide text-axia-purple">
            {chamado.protocolo}
          </span>
          <span className="mt-0.5 block truncate text-sm text-axia-grey/70">
            {chamado.atividade}
          </span>
        </span>
      </div>

      <Coluna rotulo="Serviço">
        <span className="block truncate font-bold text-axia-purple">
          {chamado.servico}
        </span>
        <span className="mt-0.5 block truncate text-xs text-axia-grey/60">
          {chamado.portfolio}
        </span>
      </Coluna>

      <Coluna rotulo="Status">
        <Badge status={chamado.status} />
      </Coluna>

      <Coluna rotulo="Última atualização">
        <span className="block truncate font-bold text-axia-purple">
          {dataCurta(atualizadoEm)}
        </span>
        <span className="mt-0.5 block truncate text-xs text-axia-grey/60">
          por {autor}
        </span>
      </Coluna>

      <Coluna rotulo="Prazo estimado">
        <span
          className={`block truncate font-bold ${
            !encerrado && restam <= 0 ? 'text-axia-error' : 'text-axia-purple'
          }`}
        >
          {prazoTexto}
        </span>
        {!encerrado && (
          <span className="mt-0.5 block truncate text-xs text-axia-grey/60">
            {new Date(prazo).toLocaleDateString('pt-BR')}
          </span>
        )}
      </Coluna>

      {/* no celular o card inteiro é o alvo do toque: a seta sozinha só criava
          uma última linha torta */}
      <span className="hidden justify-self-end text-axia-grey/50 lg:block">
        <ChevronDireita />
      </span>
    </button>
  )
}

// O rótulo só aparece no celular: no desktop quem nomeia a coluna é o cabeçalho
// da tabela, e repetir em cada linha viraria ruído.
const Coluna = ({ rotulo, children }) => (
  <div className="min-w-0">
    <p className="text-xs text-axia-grey/60 lg:hidden">{rotulo}</p>
    <div className="mt-0.5 text-sm lg:mt-0">{children}</div>
  </div>
)

const BotaoPagina = ({ rotulo, desabilitado, onClick, children }) => (
  <button
    onClick={onClick}
    disabled={desabilitado}
    aria-label={rotulo}
    title={rotulo}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-axia-neutral bg-white text-axia-purple transition hover:border-axia-blue hover:text-axia-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-axia-neutral disabled:hover:text-axia-purple"
  >
    {children}
  </button>
)

function ChevronDireita() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function IconeLupa() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
