import { useState, useEffect, useRef } from 'react'
import logo from './assets/AF_ELETROBRAS_PRIMARIA_LOGO_AXIA_ENERGIA_VERTICAL_AZUL_MARINHO_RGB.png'
import { PORTFOLIOS, ATIVIDADES } from './catalogo'
import {
  STATUS,
  CANCELADO,
  novoProtocolo,
  buscar,
  filtrarServicos,
  contarPorStatus,
  deveMostrarTopo,
  notificacoes,
  naoVisualizadas,
  visualizadas,
  iniciais,
  podeInteragir,
  comInteracao,
  cancelar,
} from './lib'

// ponytail: usuário fixo — troque por dados da sessão quando houver login (SSO/AD).
const USUARIO = { nome: 'João da Silva' }

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

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets))
  }, [tickets])

  useEffect(() => {
    localStorage.setItem('notificacoesLidas', JSON.stringify(lidas))
  }, [lidas])

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

  function enviar(e, atividade) {
    e.preventDefault()
    const f = new FormData(e.target)
    const ticket = {
      protocolo: novoProtocolo(tickets),
      atividade: atividade.nome,
      servico: atividade.servico.nome,
      portfolio: atividade.portfolio.nome,
      solicitante: f.get('__solicitante').trim(),
      status: 'Aberto',
      criadoEm: new Date().toISOString(),
      dados: atividade.campos.map((c) => [campoNome(c), f.get(campoNome(c))]),
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

  const resultados = buscar(ATIVIDADES, busca)
  const portfolio = PORTFOLIOS.find((p) => p.id === aba)
  const servicosVisiveis = filtrarServicos(portfolio.servicos, filtro)
  const ticketAtual =
    view.tela === 'ticket' && tickets.find((t) => t.protocolo === view.protocolo)

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
        onNotificacao={abrirNotificacao}
        onVerTodas={() => setView({ tela: 'notificacoes' })}
        onMeusTickets={() => setView({ tela: 'tickets' })}
        onSair={() => setSaindo(true)}
      />

      <main className="mx-auto max-w-[1440px] px-8 pb-20">
        <Indicadores
          contagem={contarPorStatus(tickets)}
          onIndicador={(status) => setView({ tela: 'tickets', status })}
        />

        {view.tela === 'portal' && busca.trim() && (
          <Secao titulo={`Resultados para "${busca}"`}>
            {resultados.length ? (
              <Grade>
                {resultados.map((a) => (
                  <CardAtividade
                    key={`${a.servico.id}-${a.id}`}
                    atividade={a}
                    rodape={`${a.portfolio.nome} › ${a.servico.nome}`}
                    onClick={() => setView({ tela: 'form', atividade: a })}
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
            <Abas itens={PORTFOLIOS} ativa={aba} onSelect={setAba} />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder={`Filtrar serviços em ${portfolio.nome}...`}
              className="w-full max-w-sm rounded-full border border-axia-neutral bg-white px-5 py-2.5 text-sm outline-none focus:border-axia-blue"
            />
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
                <button
                  key={s.id}
                  onClick={() => setView({ tela: 'servico', servico: s, portfolio })}
                  className="rounded-card border border-axia-neutral bg-white p-10 text-center transition hover:border-axia-blue hover:shadow-lg hover:shadow-axia-blue/5"
                >
                  <Icone />
                  <div className="mt-6 text-xl font-bold text-axia-purple">{s.nome}</div>
                  <div className="mt-2 text-base text-axia-grey/70">
                    {s.atividades.length} atividade(s)
                  </div>
                </button>
              ))}
            </Grade>
            {!servicosVisiveis.length && (
              <Vazio>Nenhum serviço com "{filtro}" nesta área.</Vazio>
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
                  onClick={() =>
                    setView({
                      tela: 'form',
                      atividade: {
                        ...a,
                        servico: view.servico,
                        portfolio: view.portfolio,
                      },
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
              { label: view.atividade.nome },
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
                { label: 'Meus tickets', onClick: () => setView({ tela: 'tickets' }) },
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
            <Vazio>Ticket não encontrado.</Vazio>
          ))}

        {view.tela === 'tickets' && (
          <MeusTickets
            tickets={tickets}
            statusInicial={view.status}
            onAbrir={(protocolo) => setView({ tela: 'ticket', protocolo })}
            trilha={[
              { label: 'Portal', onClick: irAoPortal },
              { label: 'Meus tickets' },
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

      <Modal
        aberto={saindo}
        titulo="Encerrar sessão?"
        onFechar={() => setSaindo(false)}
      >
        <p className="text-sm text-axia-grey">
          Você será desconectado do portal. Seus tickets continuam registrados.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setSaindo(false)}
            className="rounded-full border border-axia-neutral px-5 py-2 text-sm font-bold text-axia-grey hover:bg-axia-neutral/50"
          >
            Continuar no portal
          </button>
          <button
            // ponytail: sem login real, sair só recarrega — troque pelo logout do SSO.
            onClick={() => window.location.reload()}
            className="rounded-full bg-axia-error px-5 py-2 text-sm font-bold text-white hover:brightness-90"
          >
            Sair
          </button>
        </div>
      </Modal>
    </div>
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
      className={`fixed bottom-8 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-axia-blue text-xl font-bold text-white shadow-lg shadow-axia-purple/25 transition duration-200 hover:bg-axia-blue2 ${
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
  onNotificacao,
  onVerTodas,
  onMeusTickets,
  onSair,
}) {
  return (
    <header className="bg-axia-purple text-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-4 px-8 py-4">
        <img src={logo} alt="AXIA Energia" className="h-14 w-auto shrink-0" />

        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">Como podemos ajudar?</h1>
          <p className="text-xs text-axia-sky">
            Encontre o serviço ou atividade que você precisa.
          </p>
        </div>

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
          <button
            onClick={onMeusTickets}
            className="rounded-full border border-white/40 px-5 py-2 text-sm font-medium hover:bg-white/10"
          >
            Meus tickets
          </button>

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
        Meus tickets
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

// Cards de acompanhamento: fora do header, centralizados acima das abas.
function Indicadores({ contagem, onIndicador }) {
  return (
    <div className="pt-8">
      <h2 className="text-center text-xl font-bold text-axia-purple">Meus tickets</h2>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {STATUS.map((s) => (
          <button
            key={s}
            onClick={() => onIndicador(s)}
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
  )
}

function Abas({ itens, ativa, onSelect }) {
  return (
    // linha azul colada nas abas: mesma div, borda inferior logo abaixo dos botões
    <div className="mb-8 flex flex-wrap gap-2 border-b-2 border-axia-blue pt-6">
      {itens.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`rounded-t-chip px-5 py-2.5 text-sm font-bold transition ${
            ativa === p.id
              ? 'bg-axia-blue text-white'
              : 'bg-axia-neutral text-axia-grey hover:bg-axia-sky/40'
          }`}
        >
          {p.nome}
        </button>
      ))}
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
    <div className="flex flex-wrap items-start justify-between gap-4 py-8">
      <div>
        <Trilha itens={trilha} />
        <h2 className="mt-5 text-3xl font-bold text-axia-purple">{titulo}</h2>
        {subtitulo && <p className="mt-1.5 text-base text-axia-grey">{subtitulo}</p>}
        {extra}
      </div>
      <button
        onClick={onVoltar}
        className="shrink-0 rounded-full border border-axia-blue px-6 py-1.5 text-sm font-bold text-axia-blue hover:bg-axia-blue hover:text-white"
      >
        Voltar
      </button>
    </div>
  )
}

// auto-fit com teto de 440px: é a largura que o card tem quando cabem 3 por linha,
// então 1 ou 2 cards ficam desse mesmo tamanho em vez de esticar pela linha toda.
const Grade = ({ children }) => (
  <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(360px,440px))]">
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

function CardAtividade({ atividade, rodape, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex h-full flex-col rounded-card border border-axia-neutral bg-white p-8 text-left transition hover:border-axia-blue hover:shadow-lg hover:shadow-axia-blue/5"
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
  )
}

function Formulario({ atividade, onSubmit, trilha, onVoltar }) {
  return (
    <>
      <Cabecalho
        trilha={trilha}
        titulo={atividade.nome}
        subtitulo={atividade.descricao}
        onVoltar={onVoltar}
      />
      <form
        onSubmit={(e) => onSubmit(e, atividade)}
        className="max-w-2xl space-y-4 rounded-card border border-axia-neutral bg-white p-7"
      >
        <Campo label="Solicitante" nome="__solicitante" tipo="texto" />
        {atividade.campos.map((c) => (
          <Campo
            key={campoNome(c)}
            label={campoNome(c)}
            nome={campoNome(c)}
            tipo={campoTipo(c)}
            opcoes={c.opcoes}
          />
        ))}
        <button className="rounded-full bg-axia-blue px-7 py-2.5 text-sm font-bold text-white hover:bg-axia-blue2">
          Enviar solicitação
        </button>
      </form>
    </>
  )
}

const inputBase =
  'w-full rounded-chip border border-axia-neutral bg-axia-offwhite/60 px-4 py-2.5 text-sm outline-none focus:border-axia-blue focus:bg-white'

function Campo({ label, nome, tipo, opcoes }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-axia-purple">{label}</span>
      {tipo === 'textarea' ? (
        <textarea name={nome} required rows={4} className={inputBase} />
      ) : tipo === 'select' ? (
        <select name={nome} required defaultValue="" className={inputBase}>
          <option value="" disabled>
            Selecione...
          </option>
          {opcoes.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          name={nome}
          required
          type={tipo === 'date' ? 'date' : 'text'}
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
        subtitulo={`${ticket.portfolio} › ${ticket.servico}`}
        onVoltar={onVoltar}
        extra={
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-bold text-axia-blue">
              {ticket.protocolo}
            </span>
            <Badge status={ticket.status} />
            <span className="text-xs text-axia-grey/70">
              aberto em {new Date(ticket.criadoEm).toLocaleString('pt-BR')}
            </span>
          </div>
        }
      />

      {novo && (
        <div className="mb-6 rounded-card border border-axia-success/40 bg-axia-success/10 p-5">
          <p className="font-bold text-green-800">Solicitação registrada</p>
          <p className="mt-1 text-sm text-green-900">
            Guarde o protocolo <strong>{ticket.protocolo}</strong> para acompanhar o
            atendimento.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-card border border-axia-neutral bg-white p-6 lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-axia-grey/70">
            O que foi solicitado
          </h3>
          <dl className="mt-4 space-y-2 text-sm">
            <Linha rotulo="Solicitante" valor={ticket.solicitante} />
            {ticket.dados.map(([k, v]) => (
              <Linha key={k} rotulo={k} valor={v} />
            ))}
          </dl>
          {aberto && (
            <button
              onClick={() => setConfirmando(true)}
              className="mt-6 w-full rounded-full border border-axia-error px-5 py-2 text-sm font-bold text-axia-error hover:bg-axia-error hover:text-white"
            >
              Cancelar solicitação
            </button>
          )}
        </section>

        <section className="rounded-card border border-axia-neutral bg-white p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-axia-grey/70">
              Interações
            </h3>
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

          <ol className="mt-4 space-y-4">
            {ticket.interacoes.map((i, idx) => (
              <li
                key={idx}
                className={`rounded-chip p-4 text-sm ${
                  i.autor === 'Atendente'
                    ? 'bg-axia-blue/5 border-l-4 border-axia-blue'
                    : i.autor === 'Sistema'
                      ? 'bg-axia-neutral/50 text-axia-grey'
                      : 'bg-axia-offwhite border-l-4 border-axia-sky'
                }`}
              >
                <div className="flex justify-between gap-3 text-xs text-axia-grey/70">
                  <span className="font-bold text-axia-purple">{i.autor}</span>
                  <span>{new Date(i.em).toLocaleString('pt-BR')}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap">{i.texto}</p>
              </li>
            ))}
          </ol>

          {aberto ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onResponder(new FormData(e.target).get('texto').trim())
                e.target.reset()
              }}
              className="mt-6 space-y-3"
            >
              <textarea
                name="texto"
                required
                rows={3}
                placeholder="Escreva uma mensagem para o atendente..."
                className={inputBase}
              />
              <button className="rounded-full bg-axia-blue px-6 py-2 text-sm font-bold text-white hover:bg-axia-blue2">
                Enviar mensagem
              </button>
            </form>
          ) : (
            <p className="mt-6 rounded-chip bg-axia-neutral/50 p-4 text-sm text-axia-grey">
              Ticket {ticket.status.toLowerCase()} — não aceita novas interações.
            </p>
          )}
        </section>
      </div>

      <Modal
        aberto={confirmando}
        titulo="Cancelar solicitação?"
        onFechar={() => setConfirmando(false)}
      >
        <p className="text-sm text-axia-grey">
          O ticket <strong className="font-mono">{ticket.protocolo}</strong> será
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
      className="w-full max-w-lg rounded-card p-0 backdrop:bg-axia-purple/60 open:m-auto"
    >
      <div className="p-7">
        <h3 className="text-lg font-bold text-axia-purple">{titulo}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
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
        subtitulo="Atualizações do atendimento nos seus tickets."
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

function MeusTickets({ tickets, statusInicial, trilha, onAbrir, onVoltar }) {
  const [filtro, setFiltro] = useState(statusInicial || 'Todos')
  const visiveis =
    filtro === 'Todos' ? tickets : tickets.filter((t) => t.status === filtro)

  return (
    <>
      <Cabecalho
        trilha={trilha}
        titulo="Meus tickets"
        subtitulo="Acompanhe, converse com o atendente ou cancele suas solicitações."
        onVoltar={onVoltar}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {['Todos', ...STATUS, CANCELADO].map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${
              filtro === s
                ? 'bg-axia-blue text-white'
                : 'border border-axia-neutral bg-white text-axia-grey'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {visiveis.map((t) => (
          <li key={t.protocolo}>
            <button
              onClick={() => onAbrir(t.protocolo)}
              className="flex w-full flex-wrap items-center gap-4 rounded-card border border-axia-neutral bg-white p-5 text-left transition hover:border-axia-blue hover:shadow-lg hover:shadow-axia-blue/5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold text-axia-blue">
                  {t.protocolo}
                </p>
                <p className="text-sm font-bold text-axia-purple">{t.atividade}</p>
                <p className="mt-0.5 text-xs text-axia-grey/70">
                  {t.portfolio} › {t.servico} · {t.solicitante} ·{' '}
                  {new Date(t.criadoEm).toLocaleString('pt-BR')} ·{' '}
                  {t.interacoes.length} interação(ões)
                </p>
              </div>
              <Badge status={t.status} />
              <span className="text-sm font-bold text-axia-blue">Ver →</span>
            </button>
          </li>
        ))}
        {!visiveis.length && <Vazio>Nenhum ticket neste status.</Vazio>}
      </ul>
    </>
  )
}
