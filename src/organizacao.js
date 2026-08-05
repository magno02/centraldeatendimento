// ponytail: listas estáticas para os comboboxes de "solicitar para outra pessoa".
// Troque por consulta ao AD/RH quando a API existir — o formato (array de strings)
// é o que os <datalist> consomem.

export const EMPRESAS = [
  'AXIA Energia',
  'AXIA Geração',
  'AXIA Transmissão',
  'AXIA Serviços',
  'CSC AXIA',
  'Eletrobras',
  'Furnas',
  'Chesf',
  'Eletronorte',
  'Eletronuclear',
]

export const ESTADOS = [
  'Acre',
  'Alagoas',
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondônia',
  'Roraima',
  'Santa Catarina',
  'São Paulo',
  'Sergipe',
  'Tocantins',
]

// Onde a pessoa trabalha, um degrau abaixo do estado: é o que o atendimento usa
// para saber onde entregar o equipamento ou a quem acionar no local.
// ponytail: nomes de exemplo. Substitua pela lista real de unidades quando ela vier
// do cadastro — o "Detalhes adicionais do local" do formulário cobre o que faltar.
export const LOCALIDADES = [
  'Unidade dos Aflitos — Recife/PE',
  'Sede Recife — Ilha do Leite/PE',
  'Centro Administrativo Boa Viagem — Recife/PE',
  'UHE Luiz Gonzaga — Petrolândia/PE',
  'UHE Paulo Afonso — Paulo Afonso/BA',
  'UHE Xingó — Canindé de São Francisco/SE',
  'Subestação Bongi — Recife/PE',
  'Subestação Suape — Ipojuca/PE',
  'Escritório Salvador — Salvador/BA',
  'Escritório Fortaleza — Fortaleza/CE',
  'Escritório Brasília — Brasília/DF',
  'Escritório Rio de Janeiro — Rio de Janeiro/RJ',
  'Home office',
]

export const AREAS = [
  'Comercial',
  'Compras e Contratações',
  'Financeiro',
  'Jurídico e Compliance',
  'Manutenção',
  'Operação',
  'Recursos Humanos',
  'Regulatório',
  'Segurança do Trabalho',
  'Suprimentos',
  'Tecnologia da Informação',
]

export const USUARIOS = [
  'Ana Beatriz Rocha',
  'Bruno Carvalho Lima',
  'Camila Duarte Nunes',
  'Diego Ferreira Alves',
  'Eduarda Martins Pinto',
  'Felipe Andrade Souza',
  'Gabriela Teixeira Ramos',
  'Henrique Barbosa Melo',
  'Isabela Cardoso Freitas',
  'João da Silva',
  'Karina Oliveira Santos',
  'Lucas Moreira Prado',
  'Mariana Lopes Vieira',
  'Rafael Gomes Tavares',
]

// ponytail: fila de atendimento fake — a atribuição real vem do backend.
export const ATENDENTES = [
  'Tiago Almeida — Suporte N1',
  'Renata Coelho — Suporte N2',
  'Vinícius Braga — Sustentação',
  'Larissa Fontes — Acessos',
  'Otávio Menezes — Infraestrutura',
  'Juliana Peixoto — Aplicações',
]

// O que o formulário carrega sozinho ao escolher alguém da lista: nenhum destes é
// digitado pelo solicitante, porque o dado é do RH. Um mapa só, e não um por campo:
// todos são consultados juntos e sairiam do mesmo lugar numa API de verdade.
//
// O CPF nunca aparece inteiro na tela — o formulário mostra as duas pontas e esconde
// o miolo, o bastante para conferir a pessoa sem expor o documento de terceiro.
// `localidade` precisa existir em LOCALIDADES, senão o combo recusa o valor.
//
// ponytail: cadastro de exemplo, com CPFs inválidos de propósito. Trocar por consulta
// ao RH/AD quando a API existir — o formulário já espera receber o registro pronto.
export const CADASTRO = {
  'Ana Beatriz Rocha': {
    gestor: 'Fernanda Ribeiro Costa',
    cpf: '111.222.333-44',
    contato: 'Ramal 4102',
    cargo: 'Analista de Suprimentos Pleno',
    localidade: 'Sede Recife — Ilha do Leite/PE',
  },
  'Bruno Carvalho Lima': {
    gestor: 'Marcelo Antunes Reis',
    cpf: '222.333.444-55',
    contato: 'Ramal 4218',
    cargo: 'Técnico de Manutenção Sênior',
    localidade: 'UHE Luiz Gonzaga — Petrolândia/PE',
  },
  'Camila Duarte Nunes': {
    gestor: 'Adriana Prado Machado',
    cpf: '333.444.555-66',
    contato: '(81) 99612-4407',
    cargo: 'Advogada Sênior',
    localidade: 'Unidade dos Aflitos — Recife/PE',
  },
  'Diego Ferreira Alves': {
    gestor: 'Ricardo Salles Monteiro',
    cpf: '444.555.666-77',
    contato: 'Ramal 4530',
    cargo: 'Engenheiro Eletricista',
    localidade: 'Subestação Bongi — Recife/PE',
  },
  'Eduarda Martins Pinto': {
    gestor: 'Fernanda Ribeiro Costa',
    cpf: '555.666.777-88',
    contato: 'Ramal 4115',
    cargo: 'Analista de Contratos Júnior',
    localidade: 'Sede Recife — Ilha do Leite/PE',
  },
  'Felipe Andrade Souza': {
    gestor: 'Carlos Eduardo Bastos',
    cpf: '666.777.888-99',
    contato: 'Ramal 4703',
    cargo: 'Analista de Infraestrutura Pleno',
    localidade: 'Centro Administrativo Boa Viagem — Recife/PE',
  },
  'Gabriela Teixeira Ramos': {
    gestor: 'Patrícia Nogueira Faria',
    cpf: '777.888.999-00',
    contato: '(71) 99845-2210',
    cargo: 'Especialista em Regulação',
    localidade: 'Escritório Salvador — Salvador/BA',
  },
  'Henrique Barbosa Melo': {
    gestor: 'Marcelo Antunes Reis',
    cpf: '888.999.000-11',
    contato: 'Ramal 4322',
    cargo: 'Operador de Subestação',
    localidade: 'Subestação Suape — Ipojuca/PE',
  },
  'Isabela Cardoso Freitas': {
    gestor: 'Adriana Prado Machado',
    cpf: '999.000.111-22',
    contato: 'Ramal 4188',
    cargo: 'Analista de Compliance Sênior',
    localidade: 'Unidade dos Aflitos — Recife/PE',
  },
  'João da Silva': {
    gestor: 'Carlos Eduardo Bastos',
    cpf: '123.456.789-00',
    contato: 'Ramal 4001',
    cargo: 'Comprador Pleno',
    localidade: 'Sede Recife — Ilha do Leite/PE',
  },
  'Karina Oliveira Santos': {
    gestor: 'Ricardo Salles Monteiro',
    cpf: '234.567.890-11',
    contato: '(75) 99730-1188',
    cargo: 'Engenheira de Segurança do Trabalho',
    localidade: 'UHE Paulo Afonso — Paulo Afonso/BA',
  },
  'Lucas Moreira Prado': {
    gestor: 'Patrícia Nogueira Faria',
    cpf: '345.678.901-22',
    contato: 'Ramal 4610',
    cargo: 'Analista Financeiro Pleno',
    localidade: 'Escritório Brasília — Brasília/DF',
  },
  'Mariana Lopes Vieira': {
    gestor: 'Fernanda Ribeiro Costa',
    cpf: '456.789.012-33',
    contato: 'Ramal 4140',
    cargo: 'Analista de Recursos Humanos',
    localidade: 'Home office',
  },
  'Rafael Gomes Tavares': {
    gestor: 'Carlos Eduardo Bastos',
    cpf: '567.890.123-44',
    contato: '(79) 99502-6633',
    cargo: 'Técnico de Operação',
    localidade: 'UHE Xingó — Canindé de São Francisco/SE',
  },
}
