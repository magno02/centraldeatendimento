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

// Gestor imediato não é escolhido: vem do cadastro do usuário selecionado.
export const GESTOR_DE = {
  'Ana Beatriz Rocha': 'Fernanda Ribeiro Costa',
  'Bruno Carvalho Lima': 'Marcelo Antunes Reis',
  'Camila Duarte Nunes': 'Adriana Prado Machado',
  'Diego Ferreira Alves': 'Ricardo Salles Monteiro',
  'Eduarda Martins Pinto': 'Fernanda Ribeiro Costa',
  'Felipe Andrade Souza': 'Carlos Eduardo Bastos',
  'Gabriela Teixeira Ramos': 'Patrícia Nogueira Faria',
  'Henrique Barbosa Melo': 'Marcelo Antunes Reis',
  'Isabela Cardoso Freitas': 'Adriana Prado Machado',
  'João da Silva': 'Carlos Eduardo Bastos',
  'Karina Oliveira Santos': 'Ricardo Salles Monteiro',
  'Lucas Moreira Prado': 'Patrícia Nogueira Faria',
  'Mariana Lopes Vieira': 'Fernanda Ribeiro Costa',
  'Rafael Gomes Tavares': 'Carlos Eduardo Bastos',
}
