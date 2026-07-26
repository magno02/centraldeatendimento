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

// Ícone do serviço por palavra-chave do nome: 196 serviços não comportam escolha
// manual. A ordem importa — a primeira regra que casar vence.
const REGRAS_ICONE = [
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
  [/headset|monitor|tablet|teclado|mouse|tower/, 'notebook'],
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
