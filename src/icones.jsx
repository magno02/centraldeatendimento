import {
  ArrowUUpLeft,
  ArrowsClockwise,
  Browser,
  CalendarDots,
  ChartBar,
  Check,
  Clock,
  ClipboardText,
  Cube,
  Database,
  Desktop,
  DeviceMobile,
  Devices,
  Drop,
  Envelope,
  FileText,
  FlowArrow,
  Gauge,
  Gear,
  Globe,
  GraduationCap,
  HardDrives,
  Headset,
  Key,
  Keyboard,
  Laptop,
  Lifebuoy,
  LinkBreak,
  LockKey,
  LockKeyOpen,
  MapPin,
  Monitor,
  Mouse,
  Password,
  PencilSimple,
  Plus,
  Plugs,
  Printer,
  Pulse,
  Robot,
  Shield,
  Sparkle,
  SquaresFour,
  Stack,
  Truck,
  User,
  UserGear,
  UsersThree,
  VideoCamera,
  Wallet,
  Warning,
  Webcam,
  WifiHigh,
  X,
} from '@phosphor-icons/react'
import { chaveIcone } from './lib'

// Família única: Phosphor. Mudar PESO ('fill' | 'duotone' | 'bold' | 'regular')
// troca o visual de todos os ícones do portal de uma vez.
// Só contorno, sem preenchimento. Phosphor não tem "medium": a escala é
// thin < light < regular < bold.
const PESO = 'regular'

// A escolha do desenho vem de chaveIcone(nome)/iconeAtividade — regras em lib.js.
const ICONES = {
  webcam: Webcam,
  headset: Headset,
  docking: Plugs,
  mouse: Mouse,
  perifericos: Devices, // conjunto de equipamentos, não um mouse específico
  teclado: Keyboard,
  monitor: Monitor,
  desktop: Desktop,
  alerta: Warning,
  velocimetro: Gauge,
  pessoaEngrenagem: UserGear,
  cadeado: LockKey,
  cadeadoAberto: LockKeyOpen,
  senha: Password,
  prancheta: ClipboardText, // governança, políticas, ServiceNow
  pessoas: UsersThree,
  servidor: HardDrives,
  fluxo: FlowArrow,
  elo: LinkBreak,
  engrenagem: Gear,
  janela: Browser,
  documento: FileText,
  chave: Key,
  escudo: Shield,
  rede: WifiHigh,
  email: Envelope,
  impressora: Printer,
  tinta: Drop,
  pulso: Pulse,
  backup: Database,
  grafico: ChartBar,
  cubo: Cube,
  robo: Robot,
  brilho: Sparkle,
  notebook: Laptop,
  telefone: DeviceMobile,
  video: VideoCamera,
  camadas: Stack,
  formatura: GraduationCap,
  veiculo: Truck,
  carteira: Wallet,
  pessoa: User,
  suporte: Lifebuoy,
  calendario: CalendarDots,
  grade: SquaresFour,
}

// Selo do canto. Serve para o verbo ("Solicitar/Trocar/Devolver Impressora" usam
// o mesmo objeto) e para compor o que o Phosphor não tem como glifo único:
// cadeado+x (revogar), documento+check (liberar), engrenagem+x (falha em job).
const SELOS = {
  mais: Plus,
  troca: ArrowsClockwise,
  devolucao: ArrowUUpLeft,
  x: X,
  check: Check,
  lapis: PencilSimple,
  globo: Globe,
  alerta: Warning,
  cadeado: LockKey,
  prazo: Clock, // empréstimo: o equipamento volta
  engrenagem: Gear,
  local: MapPin,
}

// `chave` tem prioridade sobre `nome`: as abas do portal trazem a chave pronta,
// em vez de deduzir o desenho pelo texto do rótulo.
export function IconeServico({
  nome,
  chave,
  selo,
  className = 'mx-auto h-11 w-11 text-axia-blue',
}) {
  const Icone = ICONES[chave ?? chaveIcone(nome)] ?? ICONES.grade
  const Selo = SELOS[selo]

  if (!Selo) return <Icone weight={PESO} className={className} />

  // disco branco atrás do selo para ele não se misturar ao traço do objeto
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <Icone weight={PESO} className="h-full w-full" />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-1/2 w-1/2 items-center justify-center rounded-full bg-white">
        <Selo weight="bold" className="h-3/4 w-3/4" />
      </span>
    </span>
  )
}
