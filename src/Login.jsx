import { useState } from 'react'
import logo from './assets/AF_ELETROBRAS_PRIMARIA_LOGO_AXIA_ENERGIA_HORIZONTAL_AZUL_MARINHO_RGB.png'
import { validarLogin } from './lib'
import { PORTFOLIOS, SERVICOS } from './catalogo'

export default function Login({ onEntrar }) {
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [esqueceu, setEsqueceu] = useState(false)

  function entrar(e) {
    e.preventDefault()
    const f = new FormData(e.target)
    if (validarLogin(f.get('usuario'), f.get('senha'))) return onEntrar()
    setErro('Usuário ou senha inválidos. Verifique os dados e tente novamente.')
  }

  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-2">
      {/* brilho radial no canto superior direito, como no protótipo */}
      <aside className="relative hidden flex-col justify-center overflow-hidden border-r-2 border-axia-blue bg-axia-purple p-14 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(23,38,200,0.55),transparent_65%)]"
        />

        {/* bloco único, centrado na vertical e alinhado à esquerda */}
        <div className="relative flex flex-col items-start">
          {/* shrink-0 + object-contain: no flex-column a imagem era achatada na altura */}
          {/* versão azul-marinho: o card do logo é a própria cor do painel e some.
              -ml-16 compensa a margem interna do PNG e alinha o texto do logo ao título */}
          <img
            src={logo}
            alt="AXIA Energia"
            className="-ml-16 h-32 w-auto shrink-0 object-contain"
          />

          <h2 className="mt-2 max-w-lg text-5xl font-medium leading-[1.15]">
            Tudo o que você precisa, em um só lugar.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-axia-sky">
            Abra solicitações, acompanhe seus chamados e converse com a equipe
            responsável — tudo no mesmo portal.
          </p>

          <dl className="mt-10 flex gap-10">
            <div className="border-l-2 border-axia-blue pl-4">
              <dt className="text-2xl font-bold">{PORTFOLIOS.length}</dt>
              <dd className="text-sm text-axia-sky">áreas atendidas</dd>
            </div>
            <div className="border-l-2 border-axia-blue pl-4">
              <dt className="text-2xl font-bold">{SERVICOS.length}</dt>
              <dd className="text-sm text-axia-sky">serviços disponíveis</dd>
            </div>
          </dl>
        </div>

        <div className="absolute bottom-14 left-14">
          <p className="text-sm font-bold">
            O novo vem com <span className="text-axia-amarelo">energia</span>.
          </p>
          <p className="mt-1 text-xs text-axia-sky">
            © {new Date().getFullYear()} AXIA Energia ·{' '}
            <span className="underline">Uso interno</span>
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-axia-bg px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-axia-purple">Portal de serviços</h1>
          <p className="mt-2 text-sm text-axia-grey">
            Entre com sua conta corporativa para continuar.
          </p>

          <form onSubmit={entrar} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-axia-purple">
                E-mail corporativo
              </span>
              <input
                name="usuario"
                required
                autoFocus
                type="email"
                autoComplete="username"
                placeholder="nome.sobrenome@axia.com.br"
                onChange={() => setErro('')}
                className="w-full rounded-chip border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-axia-blue"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-axia-purple">
                Senha
              </span>
              <span className="relative block">
                <input
                  name="senha"
                  required
                  type={verSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  onChange={() => setErro('')}
                  className="w-full rounded-chip border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-axia-blue"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  title={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-axia-grey/60 hover:text-axia-blue"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {!verSenha && <path d="m4 20 16-16" />}
                  </svg>
                </button>
              </span>
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEsqueceu(true)}
                className="text-sm font-bold text-axia-blue-soft hover:text-axia-blue"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {erro && (
              <p
                role="alert"
                className="rounded-chip border border-axia-error/40 bg-axia-error/10 px-4 py-3 text-sm text-axia-error"
              >
                {erro}
              </p>
            )}

            {esqueceu && (
              <p className="rounded-chip border border-axia-blue/30 bg-axia-blue/5 px-4 py-3 text-sm text-axia-grey">
                A redefinição de senha é feita pelo Service Desk: ramal 4000 ou
                atendimento@axia.com.br.
              </p>
            )}

            <button className="w-full rounded-full bg-axia-blue py-3 text-sm font-bold text-white hover:bg-axia-blue2">
              Entrar
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-axia-grey/60">
            Protótipo de demonstração — acesso com credencial de teste.
          </p>
        </div>
      </main>
    </div>
  )
}
