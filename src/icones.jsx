import { chaveIcone } from './lib'

// Família única: 24x24, sem preenchimento, traço fino (1.4) e pontas arredondadas.
// A escolha do desenho vem de chaveIcone(nome) — ver as regras em lib.js.
const TRACOS = {
  chave: (
    <>
      <circle cx="7.5" cy="15.5" r="3.3" />
      <path d="M9.9 13.1 19.5 3.5M16.5 6.5l2 2M14 9l2 2" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3 5 6v6c0 4.3 3 7.2 7 8.7 4-1.5 7-4.4 7-8.7V6z" />
      <path d="m9.2 12.2 2 2 3.6-3.8" />
    </>
  ),
  rede: (
    <>
      <path d="M2.8 8.6a14 14 0 0 1 18.4 0M5.8 12a9.6 9.6 0 0 1 12.4 0M8.8 15.4a5.4 5.4 0 0 1 6.4 0" />
      <path d="M12 19h.01" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m3.8 8 7.1 5a2 2 0 0 0 2.2 0l7.1-5" />
    </>
  ),
  impressora: (
    <>
      <path d="M7 8.5V3.5h10v5" />
      <path d="M7 17.5H5.5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H17" />
      <rect x="7" y="14.5" width="10" height="6" rx="1.5" />
    </>
  ),
  pulso: <path d="M3 12h3.8l2.4-6.2L13 18.2l2.3-6.2H21" />,
  backup: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
      <path d="M19.5 12c0 1.7-3.4 3-7.5 3s-7.5-1.3-7.5-3" />
    </>
  ),
  servidor: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </>
  ),
  grafico: (
    <>
      <path d="M3.5 20h17" />
      <path d="M6.5 20v-7M12 20V5.5M17.5 20v-4.5" />
    </>
  ),
  cubo: (
    <>
      <path d="M12 3 20 7.2v9.6L12 21l-8-4.2V7.2z" />
      <path d="M4 7.2 12 11.5l8-4.3M12 11.5V21" />
    </>
  ),
  pessoas: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.1 2.7-5.2 6-5.2s6 2.1 6 5.2" />
      <path d="M16.3 5.7a3.2 3.2 0 0 1 0 6.1M17.8 14.6c2 .7 3.4 2.3 3.4 4.4" />
    </>
  ),
  robo: (
    <>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M9.5 13h.01M14.5 13h.01M10 16h4" />
      <path d="M12 8V5" />
      <circle cx="12" cy="3.6" r="1.3" />
      <path d="M2.5 12.5v3M21.5 12.5v3" />
    </>
  ),
  brilho: (
    <>
      <path d="m12 3.5 1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7z" />
      <path d="m18 15 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  janela: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9.2h18M6.5 6.9h.01M9.3 6.9h.01" />
    </>
  ),
  notebook: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M2.5 19h19" />
    </>
  ),
  // periféricos do catálogo "Serviços de TI": sem estes, todos caíam em "notebook"
  monitor: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
      <path d="M12 16.5v3.5M8.5 20h7" />
    </>
  ),
  desktop: (
    <>
      <rect x="5" y="2.8" width="10" height="18.4" rx="2" />
      <path d="M8 6.5h4M10 17.8h.01" />
      <path d="M18 9.5v8" />
    </>
  ),
  headset: (
    <>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="2.5" y="13" width="4" height="6.5" rx="1.8" />
      <rect x="17.5" y="13" width="4" height="6.5" rx="1.8" />
      <path d="M19.5 19.5v.8a2 2 0 0 1-2 2H13" />
    </>
  ),
  mouse: (
    <>
      <rect x="7.5" y="2.5" width="9" height="19" rx="4.5" />
      <path d="M12 6.5v4" />
    </>
  ),
  teclado: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 9.5h.01M9.5 9.5h.01M13 9.5h.01M16.5 9.5h.01M6 12.7h.01M9.5 12.7h.01M13 12.7h.01M16.5 12.7h.01" />
      <path d="M8 15.6h8" />
    </>
  ),
  docking: (
    <>
      <rect x="2.5" y="12" width="19" height="7" rx="2" />
      <path d="M8 12V8.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V12" />
      <path d="M6.5 15.5h4" />
    </>
  ),
  webcam: (
    <>
      <circle cx="12" cy="9.5" r="6" />
      <circle cx="12" cy="9.5" r="2.2" />
      <path d="M12 15.5v3M7.5 21h9" />
    </>
  ),
  telefone: (
    <>
      <rect x="6.5" y="2.8" width="11" height="18.4" rx="2.5" />
      <path d="M10.5 18.2h3" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="12.5" height="12" rx="2.5" />
      <path d="m15.5 10.5 5.5-3v9l-5.5-3z" />
    </>
  ),
  documento: (
    <>
      <path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" />
      <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
    </>
  ),
  fluxo: (
    <>
      <rect x="3" y="4" width="6.5" height="5" rx="1.5" />
      <rect x="14.5" y="15" width="6.5" height="5" rx="1.5" />
      <path d="M6.2 9v6a2 2 0 0 0 2 2h6.3" />
    </>
  ),
  prancheta: (
    <>
      <rect x="8.5" y="2.8" width="7" height="3.4" rx="1.2" />
      <path d="M8.5 4.5h-2a2 2 0 0 0-2 2v12.7a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2" />
      <path d="m8.8 13.2 2.2 2.2 4-4.2" />
    </>
  ),
  camadas: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
      <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
    </>
  ),
  formatura: (
    <>
      <path d="m12 4 10 4.8-10 4.8L2 8.8z" />
      <path d="M6.5 11.2V16c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4.8" />
    </>
  ),
  veiculo: (
    <>
      <path d="M5.5 15.5 7 9.8a2 2 0 0 1 2-1.5h6a2 2 0 0 1 2 1.5l1.5 5.7" />
      <rect x="3.5" y="15.2" width="17" height="4.3" rx="1.8" />
      <path d="M7.5 19.5v1.3M16.5 19.5v1.3" />
    </>
  ),
  carteira: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10.2h18" />
      <path d="M16.5 14.8h1.6" />
    </>
  ),
  pessoa: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6" />
    </>
  ),
  suporte: (
    <>
      <path d="M4.5 14.5v-2.3a7.5 7.5 0 0 1 15 0v2.3" />
      <rect x="2.8" y="12.5" width="4" height="5.5" rx="2" />
      <rect x="17.2" y="12.5" width="4" height="5.5" rx="2" />
      <path d="M19.2 18v.6a2.6 2.6 0 0 1-2.6 2.6H13" />
    </>
  ),
  engrenagem: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 12H2.1M21.9 12h-2.4M6.7 6.7 5 5M19 19l-1.7-1.7M6.7 17.3 5 19M19 5l-1.7 1.7" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </>
  ),
  grade: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="2" />
    </>
  ),
}

// `chave` tem prioridade sobre `nome`: as abas do portal trazem a chave pronta,
// em vez de deduzir o desenho pelo texto do rótulo.
export function IconeServico({
  nome,
  chave,
  className = 'mx-auto h-11 w-11 text-axia-blue',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {TRACOS[chave ?? chaveIcone(nome)] || TRACOS.grade}
    </svg>
  )
}
