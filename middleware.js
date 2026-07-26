// Senha do site inteiro, aplicada na borda da Vercel antes de qualquer arquivo ser
// servido — inclusive /assets/estrutura_axia.json, que é o motivo de isto existir.
// Não roda em `npm run dev`: middleware é coisa da Vercel, o local segue aberto.
//
// ponytail: senha única compartilhada, sem logout e sem registro de quem entrou.
// Troque por autenticação de verdade (SSO/AD) quando o portal tiver backend.

// tudo, menos as rotas internas da própria Vercel
export const config = { matcher: '/((?!_vercel).*)' }

const USUARIO = 'axia'

export default function middleware(request) {
  const senha = process.env.SITE_SENHA

  // sem variável configurada, nega: um fallback silencioso deixaria o site aberto
  // achando que está protegido, que é pior do que a porta trancada por engano.
  if (!senha) {
    return new Response(
      'SITE_SENHA não configurada em Settings → Environment Variables.',
      { status: 500 }
    )
  }

  if (request.headers.get('authorization') === `Basic ${btoa(`${USUARIO}:${senha}`)}`) {
    return // credencial confere: segue para o site
  }

  return new Response('Acesso restrito.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="AXIA - prototipo"' },
  })
}
