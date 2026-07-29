export const STATUS = [
  'Aberto',
  'Andamento',
  'Pendente',
  'Aguardando aprovação',
  'Fechado',
]
export const CANCELADO = 'Cancelado'

// Indicadores do portal: subconjunto do STATUS. "Aberto" fica só no acompanhamento,
// onde a lista completa importa para filtrar.
export const STATUS_PAINEL = [
  'Andamento',
  'Pendente',
  'Aguardando aprovação',
  'Fechado',
]

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

// O chat recebe frase ("resetar senha do SAP"), não palavra-chave, e o catálogo é
// escrito em linguagem de TI. Estas duas tabelas fazem a ponte. A busca do portal
// continua com `buscar`, que casa a frase inteira — lá quem digita já sabe o termo.
// ponytail: listas escritas à mão. Cobrem os exemplos da saudação e os pedidos mais
// comuns; palavra nova que errar entra aqui.
const IRRELEVANTES = new Set(
  `a o as os um uma uns umas de do da dos das em no na nos nas para pra por com que
   e ou meu minha meus minhas eu me mim nao ao aos preciso precisava queria quero
   gostaria favor solicitar solicito pedir peco pedido ajuda esta estao estou ser
   fazer tem ter sobre onde como qual quais isso esse essa aqui
   novo nova novos novas outro outra`.split(/\s+/)
)

const SINONIMOS = {
  resetar: 'redefinir',
  resetei: 'redefinir',
  reset: 'redefinir',
  trocaram: 'trocar',
  quebrou: 'defeito',
  quebrado: 'defeito',
  quebrada: 'defeito',
  estragou: 'defeito',
  parou: 'defeito',
  travou: 'lentidao',
  travando: 'lentidao',
  lento: 'lentidao',
  devagar: 'lentidao',
  // radical comum: casa tanto com "conta bloqueada" quanto com "desbloquear usuário"
  bloqueou: 'bloque',
  bloqueado: 'bloque',
  bloqueada: 'bloque',
  desbloquear: 'bloque',
  liberar: 'acesso',
  liberacao: 'acesso',
  entrar: 'acesso',
  logar: 'acesso',
  login: 'acesso',
  wifi: 'rede',
  internet: 'rede',
  vpn: 'rede',
  ia: 'inteligencia', // "IA" tem 2 letras e seria descartado pelo piso abaixo
}

// Corta a terminação para "acessar" casar com "acesso" e "teclado" com "teclados".
// Só de 6 letras para cima: abaixo disso o toco fica curto e casa com qualquer coisa.
const raiz = (t) => (t.length >= 6 ? t.slice(0, -2) : t)

// Uma pergunta em frase vira lista de radicais, e cada atividade é pontuada por
// quantos deles aparecem nela. Sem isto "resetar senha do SAP" não achava nada: a
// frase toda não é substring de nenhum nome do catálogo.
export function buscarConversa(atividades, pergunta) {
  const termos = [
    ...new Set(
      norm(pergunta)
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean)
        .filter((p) => !IRRELEVANTES.has(p))
        .map((p) => SINONIMOS[p] ?? p)
        .map(raiz)
        // piso de 3 letras: radical curto vira substring de qualquer palavra —
        // "oi" casava com "apoio" e devolvia o catálogo inteiro
        .filter((t) => t.length >= 3)
    ),
  ]
  if (!termos.length) return []

  return atividades
    .map((a) => {
      // três faixas de peso: o nome da atividade é o sinal mais forte, a oferta vem
      // depois, e serviço/portfólio/descrição valem pouco — casar "acesso" no nome de
      // uma oferta não pode empatar com casar no nome da atividade
      const nome = norm(a.nome)
      const ofertas = norm((a.ofertas ?? []).join(' '))
      const resto = norm([a.servico.nome, a.portfolio.nome, a.descricao ?? ''].join(' '))
      const pontos = termos.reduce(
        (n, t) =>
          n + (nome.includes(t) ? 3 : ofertas.includes(t) ? 2 : resto.includes(t) ? 1 : 0),
        0
      )
      return { atividade: a, pontos }
    })
    .filter((x) => x.pontos > 0)
    // empate desfeito pelo nome mais curto: parte do catálogo usa a descrição do
    // serviço como nome da atividade, e essas frases longas casam por acidente
    .sort((x, y) => y.pontos - x.pontos || x.atividade.nome.length - y.atividade.nome.length)
    .map((x) => x.atividade)
}

// ponytail: "IA" é busca no catálogo, não modelo de linguagem — troque esta função
// por chamada à API do assistente quando existir; a UI do chat não muda.
export function responderIA(pergunta, atividades, max = 4) {
  const achados = buscarConversa(atividades, pergunta).slice(0, max)
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

// Visibilidade: cada pessoa enxerga só o que ela mesma abriu. O e-mail é o critério,
// por ser único — dois cadastros podem repetir o nome. Tickets gravados antes das
// contas não têm e-mail, então caem no nome como reserva.
// ponytail: filtro no cliente, todos os tickets continuam no localStorage do navegador.
// Não é controle de acesso — quando houver backend, quem filtra é a API.
export const doUsuario = (tickets, usuario) =>
  usuario
    ? tickets.filter((t) =>
        t.abertoPorEmail
          ? t.abertoPorEmail === usuario.email
          : t.abertoPor === usuario.nome
      )
    : []

// Identidade de um card de atividade. A chave da atividade não basta: um mesmo
// "Gestão de softwares" rende os cards Configurar/Instalar/Atualizar, e contar
// acesso por atividade misturaria os três num número só.
export const chaveOferta = (atividade, oferta) =>
  oferta ? `${atividade.chave}#${oferta}` : atividade.chave

// Frequência, não recência: `recentes` responde "o que abri por último", este mapa
// responde "o que abro mais". São perguntas diferentes e precisam de dados diferentes.
export const registrarAcesso = (acessos, chave) => ({
  ...acessos,
  [chave]: (acessos[chave] ?? 0) + 1,
})

// Nunca inventa item: quem tem zero acesso fica de fora, e a tela mostra o aviso.
export function maisAcessadas(cards, acessos, max = 10) {
  return cards
    .map((c) => ({ ...c, acessos: acessos[chaveOferta(c.atividade, c.oferta)] ?? 0 }))
    .filter((c) => c.acessos > 0)
    .sort((a, b) => b.acessos - a.acessos)
    .slice(0, max)
}

// Ao abrir um serviço, cada oferta vira um card próprio — a escolha que antes era
// um select dentro do formulário. Atividade sem oferta cadastrada entra como card único.
export const ofertasDoServico = (servico) =>
  servico.atividades.flatMap((a) =>
    a.ofertas?.length
      ? a.ofertas.map((oferta) => ({ atividade: a, oferta }))
      : [{ atividade: a, oferta: null }]
  )

// Busca dentro do serviço aberto. Casa no texto que o card mostra (a oferta, quando
// existe) e também no nome e na descrição da atividade, que o card não exibe inteiros.
export function filtrarOfertas(cards, termo) {
  const t = norm(termo.trim())
  if (!t) return cards
  return cards.filter(({ atividade, oferta }) =>
    norm(
      [oferta ?? '', atividade.nome, atividade.descricao ?? ''].join(' ')
    ).includes(t)
  )
}

// A planilha traz o SLA em horas úteis ("16h"), mas quem abre o chamado pensa em
// dias: "16 horas" é lido como 16 horas corridas, e não como dois expedientes.
// Abaixo de 12h a hora ainda é a unidade natural ("resolvo hoje"); acima disso,
// converte a 8 horas úteis por dia. Texto sem número ("Sem SLA definido") passa direto.
export function prazoLegivel(sla) {
  const horas = Number(String(sla ?? '').match(/(\d+)\s*h/i)?.[1])
  if (!horas) return sla
  if (horas <= 12) return `${horas} horas`
  const dias = Math.ceil(horas / 8)
  return `${dias} ${dias === 1 ? 'dia útil' : 'dias úteis'}`
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

// "Hoje, 10:24" / "Ontem, 09:15" / "14/05/2026": na lista de chamados o horário só
// importa nos últimos dois dias; antes disso a data seca basta.
export function dataCurta(iso, agora = new Date()) {
  const d = new Date(iso)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dia = 86400000
  const soData = (x) => new Date(x).setHours(0, 0, 0, 0)
  const diferenca = (soData(agora) - soData(d)) / dia
  if (diferenca === 0) return `Hoje, ${hora}`
  if (diferenca === 1) return `Ontem, ${hora}`
  return d.toLocaleDateString('pt-BR')
}

// Dias úteis restantes até o prazo. Negativo quando já venceu, 0 quando é hoje.
// Conta em dias úteis porque o SLA do catálogo também é em horas úteis.
export function diasUteisAte(iso, agora = new Date()) {
  const alvo = new Date(iso)
  alvo.setHours(0, 0, 0, 0)
  const hoje = new Date(agora)
  hoje.setHours(0, 0, 0, 0)
  if (alvo <= hoje) return alvo < hoje ? -1 : 0

  let dias = 0
  const cursor = new Date(hoje)
  while (cursor < alvo) {
    cursor.setDate(cursor.getDate() + 1)
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) dias++
  }
  return dias
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

// Artigo do placeholder ("Informe o gestor", "Informe a matrícula"). O gênero sai do
// substantivo-núcleo, que é a primeira palavra do rótulo — "Centro de custo" é o
// centro, não o custo.
// ponytail: heurística por terminação com lista de exceções. Cobre os 79 rótulos do
// catálogo; rótulo novo que a regra errar entra em EXCECOES_ARTIGO.
const EXCECOES_ARTIGO = {
  sistema: 'o', // termina em -a mas é masculino
  problema: 'o',
  dia: 'o',
  mapa: 'o',
  fonte: 'a', // termina em -e mas é feminino
  rede: 'a',
  chave: 'a',
  imagem: 'a',
}

export function artigoDe(rotulo) {
  const nucleo = rotulo.trim().split(/\s+/)[0].toLowerCase()
  if (EXCECOES_ARTIGO[nucleo]) return EXCECOES_ARTIGO[nucleo]

  // plural primeiro: o -s final esconde a terminação que define o gênero
  if (/(ões|ãs)$/.test(nucleo)) return 'as'
  if (/s$/.test(nucleo)) return /as$/.test(nucleo) ? 'as' : 'os'

  // -ão só é feminino nas terminações -ção/-são/-xão (conexão, condição)
  if (/(a|ção|são|xão|dade|agem|ice|ude|ez|tude)$/.test(nucleo)) return 'a'
  return 'o'
}

// Ícone do serviço por palavra-chave do nome: 196 serviços não comportam escolha
// manual. A ordem importa — a primeira regra que casar vence.
const REGRAS_ICONE = [
  // Periféricos primeiro: os nomes do catálogo de TI ("Monitor", "Mouse", "Teclado")
  // casavam com regras genéricas mais abaixo e todos viravam o ícone de notebook.
  [/webcam|c[âa]mera/, 'webcam'],
  [/headset|fone de ouvido/, 'headset'],
  [/docking|dock station/, 'docking'],
  [/\bmouse\b/, 'mouse'],
  [/teclado/, 'teclado'],
  [/\bmonitor(es)?\b/, 'monitor'], // "monitoramento" continua caindo em pulso
  [/desktop|torre|gabinete|workstation/, 'desktop'],
  [/senha|acesso|permiss|perfil|credencial|login|autentic/, 'chave'],
  [/ciberseguran|seguranca da informacao|vulnerab|antiv|firewall|phishing/, 'escudo'],
  [/rede|wi-?fi|internet|vpn|conectividade|conexao|link de dados/, 'rede'],
  [/e-?mail|correio|caixa postal|outlook|exchange|distribuicao/, 'email'],
  [/impress|scanner|digitaliza/, 'impressora'],
  [/monitora|alarme|telemetr|observab|disponibilidade/, 'pulso'],
  [/backup|restaur|recuperacao|retencao/, 'backup'],
  [/servidor|datacenter|infraestrutura|hospedagem|nuvem|cloud|storage/, 'servidor'],
  [/dashboard|analytics|indicador|relatorio|bi\b|dados|extracao/, 'grafico'],
  [/\bsap\b/, 'cubo'],
  [/salesforce|\bcrm\b|cliente/, 'pessoas'],
  [/rpa|automacao|hiperautomacao|robo|bot\b/, 'robo'],
  [/\bia\b|inteligencia artificial|copilot|assistente/, 'brilho'],
  [/software|aplicativo|licenc|instalacao de programa|pacote office/, 'janela'],
  [/notebook|computador|desktop|equipamento|hardware|periferico|maquina/, 'notebook'],
  [/telefon|ramal|celular|voz|telefonia/, 'telefone'],
  [/videoconferencia|teams|reuniao|conferencia/, 'video'],
  [/documento|contrato|nota fiscal|assinatura|arquivo|certificado/, 'documento'],
  [/processo|fluxo|workflow|esteira|integracao|\bapi\b|interface/, 'fluxo'],
  [/governanca|politica|norma|comite|auditoria|conformidade|regulariza/, 'prancheta'],
  [/portfolio|projeto|demanda|melhoria|desenvolvimento|evolutivo|sustentacao/, 'camadas'],
  [/treinamento|capacitacao|aprendizagem|educacao|onboarding/, 'formatura'],
  [/viagem|transporte|frota|veiculo|deslocamento/, 'veiculo'],
  [/financeiro|pagamento|fatura|custo|orcamento|cobranca|tesouraria/, 'carteira'],
  [/usuario|colaborador|cadastro|pessoa|\brh\b|recursos humanos/, 'pessoa'],
  [/suporte|atendimento|duvida|incidente|chamado|help ?desk/, 'suporte'],
  [/manutencao|reparo|conserto|obra|facilities|predial/, 'engrenagem'],
  [/plantao|escala|agenda|calendario|prazo/, 'calendario'],
  // termos que aparecem no catálogo da AXIA e não caem nas regras genéricas acima
  [/sso|entra id|conta de|privilegio|administrador local|cyberark|identity/, 'chave'],
  [/siem|ameaca|\bdlp\b|trend micro|qualys|proofpoint|agente de seguranca|risco/, 'escudo'],
  [/dns|dhcp|proxy|porta usb|\brdp\b|\bssh\b|remota/, 'rede'],
  [/sql|banco de dados|pgadmin|mysql|oracle/, 'backup'],
  [/remetente/, 'email'],
  [/planilha|excel|\bword\b|power ?point|formulario|data room|cnpj|cpf/, 'documento'],
  [/servicenow|portal de servico|\bsla\b|\bola\b|item de configuracao|regras de negocio/, 'prancheta'],
  [/tablet|tower/, 'notebook'], // headset/monitor/teclado/mouse têm ícone próprio agora
  [/linha corporativa/, 'telefone'],
  [/marca|rebranding/, 'brilho'],
  [/sistema|aplicacao|plataforma|plugin|benner|pipeline|empreendimento|oportunidade|necessidade/, 'camadas'],
  [/microsoft 365|onedrive|sharepoint|onenote|intranet|teams|colaborativo/, 'janela'],
]

export const CHAVES_ICONE = [...new Set(REGRAS_ICONE.map(([, c]) => c)), 'grade']

// Padrão é "janela" (aplicativo): a maior parte do catálogo sem palavra-chave são
// nomes de software — 7 Zip, Autocad, Python, Photoshop.
export function chaveIcone(nome) {
  const n = norm(nome)
  for (const [regra, chave] of REGRAS_ICONE) if (regra.test(n)) return chave
  return 'janela'
}

// ponytail: contas simuladas com senha em claro — trocar por SSO/AD (Entra ID).
// Não é segurança: qualquer um lê isto no bundle. Serve só para demonstrar o fluxo.
// empresa/estado/area pré-preenchem o formulário ao solicitar para outra pessoa.
export const CONTAS = [
  {
    email: 'joao.silva@axia.com.br',
    senha: 'axia@2026',
    nome: 'João da Silva',
    empresa: 'AXIA Energia',
    estado: 'Pernambuco',
    area: 'Compras e Contratações',
  },
  {
    email: 'valeria@axia.com.br',
    senha: 'axia@2026',
    nome: 'Valéria',
    empresa: 'AXIA Energia',
    estado: 'Pernambuco',
    area: 'Tecnologia da Informação',
  },
  {
    email: 'livia@axia.com.br',
    senha: 'axia@2026',
    nome: 'Lívia',
    empresa: 'AXIA Energia',
    estado: 'Pernambuco',
    area: 'Tecnologia da Informação',
  },
  {
    email: 'gestao@axia.com.br',
    senha: 'axia@2026',
    nome: 'Gestão',
    empresa: 'AXIA Energia',
    estado: 'Pernambuco',
    area: 'Tecnologia da Informação',
  },
]

// Devolve a conta (para virar a sessão) ou null — o e-mail ignora caixa e espaços.
export const validarLogin = (usuario, senha) =>
  CONTAS.find(
    (c) => c.email === usuario.trim().toLowerCase() && c.senha === senha
  ) ?? null

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

export function comInteracao(ticket, autor, texto, em = new Date(), extras = {}) {
  return {
    ...ticket,
    interacoes: [
      ...ticket.interacoes,
      { autor, texto, em: em.toISOString(), ...extras },
    ],
  }
}

// Resposta definitiva do atendente. A marca fica na interação e não no ticket:
// qualquer mensagem posterior já derruba a pergunta "foi resolvida?" sozinha.
export const TEXTO_CONCLUSAO =
  'Concluímos o atendimento da sua solicitação. Verifique se está tudo certo do seu lado.'

export const concluirAtendimento = (ticket, em = new Date()) =>
  comInteracao(ticket, 'Atendente', TEXTO_CONCLUSAO, em, { conclusao: true })

export const aguardandoConfirmacao = (t) =>
  podeInteragir(t) && !!t.interacoes.at(-1)?.conclusao

export function resolver(ticket, em = new Date()) {
  if (!aguardandoConfirmacao(ticket)) return ticket
  return {
    ...comInteracao(ticket, 'Solicitante', 'Solicitação confirmada como resolvida.', em),
    status: 'Fechado',
  }
}

export function reabrir(ticket, em = new Date()) {
  if (!aguardandoConfirmacao(ticket)) return ticket
  return {
    ...comInteracao(
      ticket,
      'Solicitante',
      'A solicitação ainda não foi resolvida — preciso de mais ajuda.',
      em
    ),
    status: 'Andamento',
  }
}

// Pesquisa de satisfação: uma avaliação por chamado, gravada no próprio ticket.
export const avaliar = (ticket, nota, comentario = '', em = new Date()) => ({
  ...ticket,
  avaliacao: { nota, comentario: comentario.trim(), em: em.toISOString() },
})

export function cancelar(ticket, motivo, em = new Date()) {
  if (!podeInteragir(ticket)) return ticket
  return {
    ...comInteracao(ticket, 'Solicitante', `Solicitação cancelada. Motivo: ${motivo}`, em),
    status: CANCELADO,
  }
}
