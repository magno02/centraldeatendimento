import { useState, useEffect, useRef } from 'react'
import logo from './assets/AF_ELETROBRAS_PRIMARIA_LOGO_AXIA_ENERGIA_HORIZONTAL_AZUL_MARINHO_RGB.png'
import { PORTFOLIOS, ATIVIDADES, POR_CHAVE } from './catalogo'
import { IconeServico } from './icones'
import Login from './Login'
import {
  EMPRESAS,
  ESTADOS,
  AREAS,
  USUARIOS,
  GESTOR_DE,
  ATENDENTES,
} from './organizacao'
import {
  STATUS,
  CANCELADO,
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
} from './lib'

// ponytail: usuário fixo — troque por dados da sessão quando houver login (SSO/AD).
// empresa/estado/area pré-preenchem o formulário ao solicitar para outra pessoa.
const USUARIO = {
  nome: 'João da Silva',
  empresa: 'AXIA Energia',
  estado: 'Pernambuco',
  area: 'Compras e Contratações',
}

const campoNome = (c) => (typeof c === 'string' ? c : c.n)
const campoTipo = (c) => (typeof c === 'string' ? 'texto' : c.t)

const CORES_STATUS = {
  Aberto: 'bg-axia-blue/10 text-axia-blue',
  Andamento: 'bg-axia-warning/15 text-yellow-700',
  Suspenso: 'bg-axia-neutral text-axia-grey',
  Fechado: 'bg-axia-success/15 text-green-700',
  [CANCELADO]: 'bg-axia-error/10 text-axia-error',
}

export default function App() {
  const [tickets, setTickets] = useState(() =>
    // interacoes garantido: tickets gravados por versões anteriores não tinham o campo.
    JSON.parse(localStorage.getItem('tickets') || '[]').map((t) => ({
      interacoes: [],
      ...t,
    }))
  )
  // view: {tela:'portal'} | {tela:'servico',servico} | {tela:'form',atividade}
  //     | {tela:'ticket',protocolo} | {tela:'tickets',status?}
  const [view, setView] = useState({ tela: 'portal' })
  const [aba, setAba] = useState(PORTFOLIOS[0].id)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const [lidas, setLidas] = useState(() =>
    JSON.parse(localStorage.getItem('notificacoesLidas') || '[]')
  )
  const [saindo, setSaindo] = useState(false)
  const [logado, setLogado] = useState(
    () => localStorage.getItem('sessao') === 'ativa'
  )
  const [secao, setSecao] = useState('Portfólios')
  const [favoritos, setFavoritos] = useState(() =>
    JSON.parse(localStorage.getItem('favoritos') || '[]')
  )
  const [recentes, setRecentes] = useState(() =>
    JSON.parse(localStorage.getItem('recentes') || '[]')
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

  const favoritar = (chave) => setFavoritos((f) => alternarFavorito(f, chave))

  function abrirServico(servico, portfolio) {
    setRecentes((r) => registrarRecente(r, servico.chave))
    setView({ tela: 'servico', servico, portfolio })
  }

  function abrirAtividade(atividade) {
    setRecentes((r) => registrarRecente(r, atividade.chave))
    setView({ tela: 'form', atividade })
  }

  const listaNotificacoes = notificacoes(tickets)

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

  function enviar(e, atividade, { para, anexos }) {
    e.preventDefault()
    const f = new FormData(e.target)
    const paraOutra = para === 'Outra pessoa'
    const camposOrigem = ['Empresa', 'Estado', 'Área']
    const camposTerceiro = ['Usuário', 'Gestor imediato']
    const ticket = {
      protocolo: novoProtocolo(tickets),
      atividade: atividade.nome,
      servico: atividade.servico.nome,
      portfolio: atividade.portfolio.nome,
      solicitante: paraOutra ? f.get('Usuário') : USUARIO.nome,
      abertoPor: USUARIO.nome,
      responsavel: atendenteDe(novoProtocolo(tickets), ATENDENTES),
      anexos,
      status: 'Aberto',
      criadoEm: new Date().toISOString(),
      dados: [
        ['Solicitado para', para],
        // origem só existe no formulário quando é para outra pessoa
        ...(paraOutra
          ? [...camposOrigem, ...camposTerceiro].map((n) => [n, f.get(n)])
          : []),
        ...atividade.campos.map((c) => [campoNome(c), f.get(campoNome(c))]),
      ],
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

  function entrar() {
    localStorage.setItem('sessao', 'ativa')
    setLogado(true)
  }

  function sair() {
    localStorage.removeItem('sessao')
    setLogado(false)
    setSaindo(false)
    irAoPortal()
  }

  const resultados = buscar(ATIVIDADES, busca)
  const portfolio = PORTFOLIOS.find((p) => p.id === aba)
  const servicosVisiveis = filtrarServicos(portfolio.servicos, filtro)
  const ticketAtual =
    view.tela === 'ticket' && tickets.find((t) => t.protocolo === view.protocolo)

  if (!logado) return <Login onEntrar={entrar} />

  return (
    <div className="min-h-screen bg-axia-bg font-sans text-axia-grey1">
      <Topo
        busca={busca}
        setBusca={(v) => {
          setBusca(v)
          setView({ tela: 'portal' })
        }}
        usuario={USUARIO}
        notificacoes={listaNotificacoes}
        novidades={naoVisualizadas(listaNotificacoes, lidas).length}
        onInicio={irAoPortal}
        onNotificacao={abrirNotificacao}
        onVerTodas={() => setView({ tela: 'notificacoes' })}
        onMeusTickets={() => setView({ tela: 'tickets' })}
        onSair={() => setSaindo(true)}
      />

      <main className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8">
        {view.tela === 'portal' && (
          <Indicadores
            usuario={USUARIO}
            contagem={contarPorStatus(tickets)}
            onIndicador={(status) => setView({ tela: 'tickets', status })}
            onVerTodos={() => setView({ tela: 'tickets' })}
          />
        )}

        {view.tela === 'portal' && busca.trim() && (
          <Secao titulo={`Resultados para "${busca}"`}>
            {resultados.length ? (
              <Grade>
                {resultados.map((a) => (
                  <CardAtividade
                    key={a.chave}
                    atividade={a}
                    rodape={`${a.portfolio.nome} › ${a.servico.nome}`}
                    favorito={favoritos.includes(a.chave)}
                    onFavoritar={() => favoritar(a.chave)}
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
            <AbasTopo ativa={secao} onSelect={setSecao} qtdFavoritos={favoritos.length} />

            {secao === 'Portfólios' && (
              <>
                <Chips itens={PORTFOLIOS} ativa={aba} onSelect={setAba} />
                <label className="relative block w-full max-w-xl">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-axia-grey/50">
                    <IconeLupa />
                  </span>
                  <input
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder={`Filtrar serviços em ${portfolio.nome}...`}
                    className="w-full rounded-full border border-axia-neutral bg-white py-2.5 pl-11 pr-5 text-sm outline-none focus:border-axia-blue"
                  />
                </label>
                <div className="mb-5 mt-3 flex items-center gap-4">
                  <span className="text-sm text-axia-grey/70">
                    {servicosVisiveis.length} de {portfolio.servicos.length} serviço(s)
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
                      onClick={() => abrirServico(s, portfolio)}
                    />
                  ))}
                </Grade>
                {!servicosVisiveis.length && (
                  <Vazio>Nenhum serviço com "{filtro}" nesta área.</Vazio>
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
                    ? 'Nenhum favorito ainda. Use a estrela nos cards de serviço ou atividade.'
                    : 'Nada acessado ainda.'
                }
              />
            )}
          </>
        )}

        {view.tela === 'servico' && (
          <>
            <Cabecalho
              trilha={[
                { label: 'Portal', onClick: irAoPortal },
                {
                  label: view.portfolio.nome,
                  onClick: () => {
                    setAba(view.portfolio.id)
                    irAoPortal()
                  },
                },
                { label: view.servico.nome },
              ]}
              titulo={view.servico.nome}
              subtitulo={view.servico.descricao}
              onVoltar={irAoPortal}
            />
            <Grade>
              {view.servico.atividades.map((a) => (
                <CardAtividade
                  key={a.id}
                  atividade={a}
                  favorito={favoritos.includes(a.chave)}
                  onFavoritar={() => favoritar(a.chave)}
                  onClick={() =>
                    abrirAtividade({
                      ...a,
                      servico: view.servico,
                      portfolio: view.portfolio,
                    })
                  }
                />
              ))}
            </Grade>
          </>
        )}

        {view.tela === 'form' && (
          <Formulario
            atividade={view.atividade}
            usuario={USUARIO}
            onSubmit={enviar}
            trilha={[
              { label: 'Portal', onClick: irAoPortal },
              {
                label: view.atividade.portfolio.nome,
                onClick: () => {
                  setAba(view.atividade.portfolio.id)
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
              // sem o nome da atividade: ele já é o título dentro do formulário,
              // e na coluna de 768px o breadcrumb quebrava em duas linhas
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
            tickets={tickets}
            statusInicial={view.status}
            onAbrir={(protocolo) => setView({ tela: 'ticket', protocolo })}
            onNova={irAoPortal}
            trilha={[
              { label: 'Portal', onClick: irAoPortal },
              { label: 'Meus chamados' },
            ]}
            onVoltar={irAoPortal}
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
      <ChatIA usuario={USUARIO} onAtividade={abrirAtividade} />

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
function ChatIA({ usuario, onAtividade }) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState([
    {
      de: 'ia',
      texto: `Olá, ${usuario.nome.split(' ')[0]}! Bem-vindo(a) ao portal de serviços da AXIA. Me diga o que você precisa — por exemplo "resetar senha do SAP" ou "solicitar acesso à rede" — que eu encontro o serviço e já abro o formulário para você.`,
    },
  ])
  const fim = useRef(null)

  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [mensagens, aberto])

  function perguntar(e) {
    e.preventDefault()
    const pergunta = new FormData(e.target).get('pergunta').trim()
    if (!pergunta) return
    const { texto, sugestoes } = responderIA(pergunta, ATIVIDADES)
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
        onClick={() => setAberto((v) => !v)}
        title={aberto ? 'Fechar chat' : 'Falar com nossa IA Electra'}
        aria-label={aberto ? 'Fechar assistente Electra' : 'Abrir assistente Electra'}
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
              <p className="font-bold leading-tight">Electra</p>
              <p className="text-xs text-axia-sky">Assistente do portal</p>
            </div>
            <button
              onClick={() => setAberto(false)}
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
                      setAberto(false)
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
  busca,
  setBusca,
  usuario,
  notificacoes,
  novidades,
  onInicio,
  onNotificacao,
  onVerTodas,
  onMeusTickets,
  onSair,
}) {
  return (
    <header className="bg-axia-purple text-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4 sm:px-8 sm:py-6">
        {/* logo + título levam ao portal */}
        <button
          onClick={onInicio}
          className="flex min-w-0 cursor-pointer items-center gap-6 text-left"
        >
          <img
            src={logo}
            alt="AXIA Energia"
            className="h-14 w-auto shrink-0 object-contain sm:h-20"
          />
          <span className="min-w-0">
            <span className="block text-lg font-bold leading-tight sm:text-xl">
              Como podemos ajudar?
            </span>
            <span className="hidden text-xs text-axia-sky sm:block">
              Encontre o serviço ou atividade que você precisa.
            </span>
          </span>
        </button>

        <label className="relative mx-auto w-full max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-axia-grey/60"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar serviço ou atividade..."
            className="w-full rounded-full bg-white py-2.5 pl-12 pr-5 text-sm text-axia-grey1 outline-none placeholder:text-axia-grey/60 focus:ring-2 focus:ring-axia-blue"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-5">
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
            classeBotao="relative rounded-full p-2 hover:bg-white/10"
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

          <span className="h-8 w-px bg-white/25" aria-hidden="true" />

          <Popover
            largura="w-64"
            classeBotao="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 hover:bg-white/10"
            rotulo={
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-axia-blue text-sm font-bold text-white">
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

// Popover do header: fecha ao clicar fora ou com Esc. children é função que recebe fechar().
function Popover({ rotulo, classeBotao, largura = 'w-96', children, ...props }) {
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
            className={`absolute right-0 top-full z-50 mt-3 overflow-hidden rounded-card border border-axia-neutral bg-white text-axia-grey1 shadow-xl ${largura}`}
          >
            {children(() => setAberto(false))}
          </div>
        </>
      )}
    </div>
  )
}

function MenuUsuario({ usuario, onMeusTickets, onSair }) {
  return (
    <div className="p-2">
      <div className="px-3 py-2">
        <p className="text-sm font-bold text-axia-purple">{usuario.nome}</p>
      </div>
      <hr className="my-1 border-axia-neutral" />
      <button
        onClick={onMeusTickets}
        className="w-full rounded-chip px-3 py-2.5 text-left text-sm hover:bg-axia-blue/5 hover:text-axia-blue"
      >
        Meus chamados
      </button>
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

// Saudação à esquerda, acompanhamento à direita — clicar num cartão filtra a lista.
function Indicadores({ usuario, contagem, onIndicador, onVerTodos }) {
  return (
    <section className="flex flex-wrap items-center gap-x-10 gap-y-6 pt-8">
      <div className="min-w-64 flex-1">
        <h2 className="text-2xl font-bold text-axia-purple">
          Olá, {usuario.nome.split(' ')[0]}!
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-axia-grey">
          Aqui você encontra tudo o que precisa de forma rápida e acompanha seus
          chamados.
        </p>
      </div>

      {/* w-fit: o bloco tem a largura dos cards, então título e "Ver todos" alinham com eles */}
      <div className="ml-auto w-fit max-w-full">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-axia-purple">Meus chamados</h3>
          <button
            onClick={onVerTodos}
            className="text-sm font-bold text-axia-blue-soft hover:text-axia-blue"
          >
            Ver todos →
          </button>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          {STATUS.map((s) => (
            <button
              key={s}
              onClick={() => onIndicador(s)}
              title={`Ver chamados com status ${s}`}
              className="w-24 rounded-chip border border-axia-neutral bg-white px-2 py-2 text-center transition hover:border-axia-blue hover:shadow-md hover:shadow-axia-blue/5"
            >
              <div className="text-2xl font-bold leading-none text-axia-purple">
                {contagem[s]}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wide text-axia-grey/70">
                {s}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}


const SECOES = [
  { nome: 'Portfólios', icone: IconeGrade },
  { nome: 'Favoritos', icone: IconeEstrela },
  { nome: 'Recentes', icone: IconeRelogio },
]

function AbasTopo({ ativa, onSelect, qtdFavoritos }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-300 pt-14">
      {SECOES.map(({ nome, icone: Ic }) => (
        <button
          key={nome}
          onClick={() => onSelect(nome)}
          className={`flex items-center gap-2 rounded-t-chip px-6 py-3 text-sm font-bold transition ${
            ativa === nome
              ? 'bg-axia-blue text-white'
              : 'bg-slate-200/70 text-axia-sky2 hover:bg-slate-300/70'
          }`}
        >
          <Ic />
          {nome}
          {nome === 'Favoritos' && qtdFavoritos > 0 && ` (${qtdFavoritos})`}
        </button>
      ))}
    </div>
  )
}

// Portfólios como chips, com a linha azul fechando o bloco.
function Chips({ itens, ativa, onSelect }) {
  return (
    <div className="mb-8 border-b-2 border-axia-blue pb-4 pt-4">
      <div className="flex flex-wrap gap-2">
        {itens.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold transition ${
              ativa === p.id
                ? 'border-axia-blue bg-axia-blue/10 text-axia-blue'
                : 'border-slate-300/70 bg-slate-200/70 text-axia-sky2 hover:bg-slate-300/70'
            }`}
          >
            {p.nome}
            {ativa === p.id && <span aria-hidden="true">›</span>}
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

function Cabecalho({ trilha, titulo, subtitulo, onVoltar, extra, acao }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 py-8">
      <div>
        <Trilha itens={trilha} />
        {titulo && (
          <h2 className="mt-5 text-3xl font-bold text-axia-purple">{titulo}</h2>
        )}
        {subtitulo && <p className="mt-1.5 text-base text-axia-grey">{subtitulo}</p>}
        {extra}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {acao}
        <button
          onClick={onVoltar}
          className="rounded-full border border-axia-blue px-6 py-1.5 text-sm font-bold text-axia-blue hover:bg-axia-blue hover:text-white"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

// auto-fit com teto de 440px: é a largura que o card tem quando cabem 3 por linha,
// então 1 ou 2 cards ficam desse mesmo tamanho em vez de esticar pela linha toda.
const Grade = ({ children }) => (
  // min(100%,360px): sem isso a coluna nunca desce de 360px e estoura a tela do celular
  <div className="grid items-stretch gap-6 grid-cols-[repeat(auto-fit,minmax(min(100%,360px),440px))]">
    {children}
  </div>
)

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

const Icone = () => (
  <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-axia-blue" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".9" />
    <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".45" />
    <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".45" />
    <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".9" />
  </svg>
)

// function (não const) porque SECOES referencia esses ícones antes deste ponto do arquivo.
function IconeGrade() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".6" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".6" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  )
}

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

function IconeRelogio() {
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

// Estrela de favoritar; fica sobre o card, como irmã do botão (não aninhada nele).
function Estrela({ ativo, onClick, rotulo }) {
  return (
    <button
      onClick={onClick}
      title={ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-label={`${ativo ? 'Remover de' : 'Adicionar a'} favoritos: ${rotulo}`}
      aria-pressed={ativo}
      className={`absolute right-4 top-4 z-10 rounded-full p-1.5 transition ${
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
        className="flex h-full min-h-60 w-full flex-col items-center justify-center rounded-card border border-axia-neutral bg-white p-10 text-center transition hover:border-axia-blue hover:shadow-lg hover:shadow-axia-blue/5"
      >
        <IconeServico nome={servico.nome} />
        <div className="mt-6 text-xl font-bold text-axia-purple">{servico.nome}</div>
        <div className="mt-2 text-base text-axia-grey/70">
          {servico.atividades.length} atividade(s)
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
              favorito={favoritos.includes(item.chave)}
              onFavoritar={() => onFavoritar(item.chave)}
              onClick={() => onAtividade(item)}
            />
          )
        )}
      </Grade>
    </div>
  )
}

function CardAtividade({ atividade, rodape, favorito, onFavoritar, onClick }) {
  return (
    <div className="relative h-full">
      {onFavoritar && (
        <Estrela ativo={favorito} onClick={onFavoritar} rotulo={atividade.nome} />
      )}
      <button
        onClick={onClick}
        className="flex h-full min-h-60 w-full flex-col rounded-card border border-axia-neutral bg-white p-8 pr-14 text-left transition hover:border-axia-blue hover:shadow-lg hover:shadow-axia-blue/5"
      >
        <h3 className="text-2xl font-bold leading-snug text-axia-purple">
          {atividade.nome}
        </h3>
        {atividade.ofertas?.length > 1 && (
          <p className="mt-3 text-base leading-relaxed text-axia-grey">
            {atividade.ofertas.length} ofertas de serviço disponíveis
          </p>
        )}
        {atividade.ofertas?.length === 1 && (
          <p className="mt-3 text-base leading-relaxed text-axia-grey">
            {atividade.ofertas[0]}
          </p>
        )}
        {rodape && <p className="mt-3 text-sm text-axia-grey/60">{rodape}</p>}
        <span className="mt-auto pt-6 text-base font-bold text-axia-blue">
          Acessar Formulário →
        </span>
      </button>
    </div>
  )
}

const PLACEHOLDERS = {
  'Descrição da necessidade':
    'Descreva o que precisa, com contexto, sistema envolvido e prazo desejado',
  'Oferta de Serviço': 'Selecione a oferta de serviço',
  Urgência: 'Selecione o nível de urgência',
}

function Formulario({ atividade, usuario, onSubmit, trilha, onVoltar }) {
  const [para, setPara] = useState('Eu mesmo(a)')
  const [anexos, setAnexos] = useState([])
  const [usuarioAlvo, setUsuarioAlvo] = useState('')
  const seusDados = useRef(null)
  const outraPessoa = para === 'Outra pessoa'

  return (
    <>
      {/* TESTE de layout: cabeçalho e formulário na mesma coluna centralizada.
          Para voltar ao anterior: remova esta div e devolva `max-w-3xl` ao <form>. */}
      <div className="mx-auto max-w-3xl">
      <Cabecalho trilha={trilha} onVoltar={onVoltar} />

      <form
        onSubmit={(e) => onSubmit(e, atividade, { para, anexos })}
        // campo inválido dentro do bloco recolhido: abre para o usuário poder corrigir
        onInvalid={() => seusDados.current && (seusDados.current.open = true)}
        className="space-y-6 rounded-card border border-axia-neutral bg-white p-5 sm:p-8"
      >
        <div className="space-y-4 border-b border-axia-neutral pb-6">
          <div>
            <h2 className="text-2xl font-bold leading-snug text-axia-purple">
              {atividade.nome}
            </h2>
            <p className="mt-1 text-sm text-axia-grey/70">
              {atividade.servico.nome}
            </p>
          </div>

          <p className="text-base leading-relaxed text-axia-grey">
            Use este formulário para registrar esta solicitação. Ao enviar, você
            recebe um número de protocolo para acompanhar o atendimento em "Meus
            chamados".
          </p>

          <div className="rounded-chip bg-axia-bg p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-axia-purple">
              Instruções
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-axia-grey">
              <li>
                • Informe se a solicitação é para você ou para outra pessoa — nesse
                caso, identifique empresa, estado, área, usuário e gestor imediato.
              </li>
              <li>
                • Escolha a oferta de serviço que corresponde ao que você precisa;
                ela define a fila de atendimento.
              </li>
              <li>
                • Descreva a necessidade com o máximo de contexto: sistema, tela,
                mensagem de erro, data em que começou.
              </li>
              <li>
                • Anexe evidências quando houver (prints, planilhas, e-mails) — isso
                costuma reduzir o tempo de atendimento.
              </li>
              <li>
                • Solicitações incompletas voltam para você antes de irem à fila.
              </li>
            </ul>
          </div>

          <p className="text-sm text-axia-grey">
            Campos marcados com <Obrigatorio /> são de preenchimento obrigatório.
          </p>
        </div>

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

        {outraPessoa && (
          <div className="space-y-4 rounded-chip border border-axia-blue bg-white p-5">
            <p className="text-sm font-bold text-axia-purple">
              Dados de quem vai receber o atendimento
            </p>
            <CamposOrigem usuario={usuario} />
            <Campo
              label="Usuário"
              nome="Usuário"
              tipo="combo"
              opcoes={USUARIOS}
              placeholder="Digite o nome do usuário"
              onChange={setUsuarioAlvo}
            />
            {/* gestor não é escolhido: vem do cadastro do usuário selecionado */}
            <div>
              <span className="mb-1.5 block text-sm font-bold text-axia-purple">
                Gestor imediato <Obrigatorio />
              </span>
              <input
                name="Gestor imediato"
                value={GESTOR_DE[usuarioAlvo] || ''}
                readOnly
                required
                placeholder="Selecione o usuário para carregar o gestor"
                className={`${inputBase} cursor-not-allowed text-axia-grey/80`}
              />
            </div>
          </div>
        )}

        {/* Bloco "Seus dados" (dropdown recolhido no modo "Eu mesmo(a)") desativado
            a pedido: não fazia sentido pedir empresa/estado/área de quem já está logado.
            Para reativar, troque o `{outraPessoa && (` acima por `{outraPessoa ? (`,
            feche com `) : (` e devolva este bloco — o `onInvalid` do <form> e o ref
            `seusDados` continuam prontos para abri-lo quando houver campo inválido.

          <details ref={seusDados} className="group rounded-chip border border-axia-blue">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-bold text-axia-purple [&::-webkit-details-marker]:hidden">
              Seus dados
              <span className="ml-auto text-axia-blue transition group-open:rotate-180">
                <Chevron />
              </span>
            </summary>
            <div className="space-y-4 border-t border-axia-neutral p-5">
              <CamposOrigem usuario={usuario} />
            </div>
          </details>
        */}

        {atividade.campos.map((c) => (
          <Campo
            key={campoNome(c)}
            label={campoNome(c)}
            nome={campoNome(c)}
            tipo={campoTipo(c)}
            opcoes={c.opcoes}
            placeholder={PLACEHOLDERS[campoNome(c)]}
          />
        ))}

        <Anexos arquivos={anexos} onChange={setAnexos} />

        <button className="rounded-full bg-axia-blue px-7 py-2.5 text-sm font-bold text-white hover:bg-axia-blue2">
          Enviar solicitação
        </button>
      </form>
      </div>
    </>
  )
}

// Empresa/Estado/Área: mesmos campos nos dois modos, pré-preenchidos com a sessão.
function CamposOrigem({ usuario }) {
  return (
    <>
      <Campo
        label="Empresa"
        nome="Empresa"
        tipo="combo"
        opcoes={EMPRESAS}
        inicial={usuario.empresa}
        placeholder="Digite para filtrar a empresa"
      />
      <Campo
        label="Estado"
        nome="Estado"
        tipo="combo"
        opcoes={ESTADOS}
        inicial={usuario.estado}
        placeholder="Digite para filtrar o estado"
      />
      <Campo
        label="Área"
        nome="Área"
        tipo="combo"
        opcoes={AREAS}
        inicial={usuario.area}
        placeholder="Digite para filtrar a área"
      />
    </>
  )
}

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

const inputBase =
  'w-full rounded-chip border border-axia-neutral bg-slate-100/70 px-4 py-2.5 text-sm outline-none focus:border-axia-blue focus:bg-white'

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
      !obrigatorio || opcoes.includes(valor) ? '' : 'Escolha uma opção da lista.'
    )
  }, [valor, opcoes, obrigatorio])

  // só reporta valor que existe na lista — quem depende disso (gestor) usa o cadastro
  const atualizar = (v) => {
    setValor(v)
    onChange?.(opcoes.includes(v) ? v : '')
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
        className={`${classeInput} pr-10`}
      />
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

function Campo({ label, nome, tipo, opcoes, placeholder, inicial, onChange }) {
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
          placeholder={placeholder}
          inicial={inicial}
          onChange={onChange}
        />
      </div>
    )
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-axia-purple">
        {label} <Obrigatorio />
      </span>
      {tipo === 'textarea' ? (
        <textarea
          name={nome}
          required
          rows={4}
          placeholder={placeholder || `Informe ${label.toLowerCase()}`}
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
          required
          type={tipo === 'date' ? 'date' : 'text'}
          placeholder={placeholder || `Informe ${label.toLowerCase()}`}
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
  onCancelar,
  onVoltar,
}) {
  const [confirmando, setConfirmando] = useState(false)
  const aberto = podeInteragir(ticket)

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
        <section className="rounded-card border border-axia-neutral bg-white p-6 lg:col-span-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-axia-purple">Atividade do chamado</h3>
            {aberto && (
              // ponytail: sem backend não há atendente de verdade — troque este botão
              // por polling/websocket da fila de atendimento quando a API existir.
              <button
                onClick={onSimularAtendente}
                className="text-xs text-axia-grey/60 underline"
              >
                simular resposta do atendente
              </button>
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

          {aberto ? (
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
          ) : (
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
              {ticket.dados
                .filter(([k]) => !['Descrição da necessidade', 'Anexos'].includes(k))
                .map(([k, v]) => (
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

          <section className="rounded-card border border-axia-neutral bg-white p-6">
            <h3 className="font-bold text-axia-purple">Descrição da necessidade</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-axia-grey">
              {Object.fromEntries(ticket.dados)['Descrição da necessidade'] || '—'}
            </p>
          </section>

          <Bloco titulo={`Anexos (${ticket.anexos?.length || 0})`}>
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
  <div className="flex items-center gap-3 rounded-card border border-axia-neutral bg-white px-5 py-4">
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
const Bloco = ({ titulo, children }) => (
  <details open className="group rounded-card border border-axia-neutral bg-white">
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
    <dd className="font-medium text-axia-grey1">{valor}</dd>
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
              className={`w-full rounded-card border bg-white p-5 text-left transition hover:border-axia-blue hover:shadow-lg hover:shadow-axia-blue/5 ${
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

// tarja lateral do card: mesma leitura de cor do badge de status
const BORDAS_STATUS = {
  Aberto: 'border-l-axia-blue hover:border-l-axia-blue',
  Andamento: 'border-l-axia-warning hover:border-l-axia-warning',
  Suspenso: 'border-l-axia-sky hover:border-l-axia-sky',
  Fechado: 'border-l-axia-success hover:border-l-axia-success',
  [CANCELADO]: 'border-l-axia-error hover:border-l-axia-error',
}

const ESTATISTICAS = [
  { status: 'Aberto', titulo: 'Em aberto', nota: 'Requerem atenção', cor: 'bg-axia-blue/10 text-axia-blue' },
  { status: 'Andamento', titulo: 'Em andamento', nota: 'Em acompanhamento', cor: 'bg-axia-success/15 text-green-700' },
  { status: 'Suspenso', titulo: 'Suspensos', nota: 'Aguardando retorno', cor: 'bg-axia-warning/20 text-yellow-700' },
  { status: 'Fechado', titulo: 'Concluídos', nota: 'Finalizados', cor: 'bg-axia-purple/10 text-axia-purple' },
  { status: CANCELADO, titulo: 'Cancelados', nota: 'Encerrados', cor: 'bg-axia-error/10 text-axia-error' },
]

function MeusTickets({ tickets, statusInicial, trilha, onAbrir, onVoltar, onNova }) {
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
  // Suspenso só entra nos cartões quando existe — o modelo previa quatro
  const estatisticas = ESTATISTICAS.filter(
    (e) => e.status !== 'Suspenso' || tickets.some((t) => t.status === 'Suspenso')
  )

  return (
    <>
      <Cabecalho
        trilha={trilha}
        titulo="Meus chamados"
        subtitulo="Acompanhe o andamento das suas solicitações e interaja com a equipe responsável."
        onVoltar={onVoltar}
      />

      <div className="mb-4 flex justify-end">
        <button
          onClick={onNova}
          className="flex items-center gap-2 rounded-full bg-axia-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-axia-blue2"
        >
          <span className="text-lg leading-none">+</span> Nova solicitação
        </button>
      </div>

      <div className="mb-6 grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {estatisticas.map((e) => (
          <button
            key={e.status}
            onClick={() => setStatus(status === e.status ? 'Todos' : e.status)}
            className={`flex items-center gap-4 rounded-card border bg-white px-5 py-4 text-left transition hover:shadow-md ${
              status === e.status ? 'border-axia-blue' : 'border-axia-neutral'
            }`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-chip ${e.cor}`}
            >
              <IconeStatus />
            </span>
            <div>
              <p className="text-sm text-axia-grey/80">{e.titulo}</p>
              <p className="text-2xl font-bold text-axia-purple">
                {tickets.filter((t) => t.status === e.status).length}
              </p>
              <p className="text-xs text-axia-grey/60">{e.nota}</p>
            </div>
          </button>
        ))}
      </div>

      {/* busca e filtros separados: a busca é uma ação (Enter/botão), os filtros valem na hora */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setTermoAplicado(termo)
        }}
        className="mb-5 flex flex-wrap items-end gap-3 rounded-card border border-axia-neutral bg-white p-4"
      >
        <CampoFiltro rotulo="Buscar chamado" largura="min-w-64 flex-1" escuro>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-axia-grey/50">
            <IconeLupa />
          </span>
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Pesquise pelo nº do chamado"
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-axia-blue"
          />
        </CampoFiltro>
        <button className="shrink-0 rounded-full border border-axia-blue px-8 py-2.5 text-sm font-bold text-axia-blue hover:bg-axia-blue hover:text-white">
          Pesquisar
        </button>
      </form>

      <div className="mb-5 flex flex-wrap items-end gap-4">
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
          className="ml-auto rounded-full border border-axia-neutral bg-white px-6 py-2.5 text-sm font-bold text-axia-grey hover:bg-slate-100"
        >
          Limpar filtros
        </button>
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
  const prazo = new Date(prazoPrevisto(chamado.criadoEm))
  const hoje = new Date().toDateString() === prazo.toDateString()
  const vencido = prazo < new Date() && !hoje
  const encerrado = !podeInteragir(chamado)

  return (
    // colunas fixas no desktop para tudo alinhar entre as linhas; empilha no mobile
    <button
      onClick={onAbrir}
      className={`flex w-full flex-wrap items-center gap-6 rounded-card border border-l-4 border-axia-neutral bg-white p-6 text-left transition hover:border-axia-blue hover:shadow-lg hover:shadow-axia-blue/5 lg:grid lg:grid-cols-[minmax(0,1fr)_130px_220px_130px_120px_20px] lg:gap-10 ${BORDAS_STATUS[chamado.status]}`}
    >
      <div className="min-w-0">
        <p className="font-mono text-sm font-bold tracking-wide text-axia-blue">
          {chamado.protocolo}
        </p>
        <p className="mt-1 truncate font-bold text-axia-purple">{chamado.atividade}</p>
        <p className="mt-0.5 truncate text-xs text-axia-grey/60">{chamado.servico}</p>
      </div>

      <div>
        <Badge status={chamado.status} />
      </div>

      <Coluna rotulo="Responsável">
        {chamado.responsavel || atendenteDe(chamado.protocolo, ATENDENTES)}
      </Coluna>
      <Coluna rotulo="Atualização">{tempoRelativo(ultimaAtualizacao(chamado))}</Coluna>
      <Coluna rotulo="Prazo">
        <span
          className={
            encerrado ? '' : hoje || vencido ? 'font-bold text-axia-error' : ''
          }
        >
          {encerrado ? '—' : hoje ? 'Hoje' : prazo.toLocaleDateString('pt-BR')}
        </span>
      </Coluna>

      <span className="justify-self-end text-axia-grey/50">
        <ChevronDireita />
      </span>
    </button>
  )
}

const Coluna = ({ rotulo, children }) => (
  <div className="min-w-0">
    <p className="text-xs text-axia-grey/60">{rotulo}</p>
    <p className="mt-0.5 truncate text-sm text-axia-grey1">{children}</p>
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
