# Gerenciador de Tarefas e Estudos

## Identificação do projeto
- **Curso:** [Ciência da Computação]
- **Turma:** [Noite]
- **Integrantes:** [Anita de Oliveira Ries; Sergio Rodrigo de Souza Filho]

## Resumo
O Gerenciador de Tarefas e Estudos é uma API desenvolvida em C# para auxiliar na organização de disciplinas, atividades acadêmicas e sessões de estudo. O sistema permite cadastrar e acompanhar tarefas, controlar prazos, identificar atividades pendentes ou atrasadas e registrar o tempo dedicado a cada tarefa. Os dados são armazenados em SQLite, com acesso realizado por meio do Entity Framework Core.

## Funcionalidades
- Cadastro, consulta, alteração e exclusão de disciplinas.
- Cadastro, consulta, alteração e exclusão de tarefas.
- Associação de tarefas a disciplinas.
- Consulta de tarefas pendentes e atrasadas.
- Marcação de tarefas como concluídas ou pendentes.
- Registro e consulta de sessões de estudo.
- Relatório do tempo total estudado por tarefa.

## Descrição das funcionalidades
### Disciplinas
Permite organizar as matérias cursadas. Uma disciplina pode estar relacionada a várias tarefas.

### Tarefas
Permite registrar título, descrição, prazo, status de conclusão e disciplina relacionada. A API oferece operações para cadastrar, consultar, editar e excluir tarefas.

### Sessões de estudo
Registra a data e a duração de uma sessão associada a uma tarefa. Os registros podem ser utilizados para calcular o tempo total estudado em cada tarefa.

### Consultas e relatório
A API permite listar tarefas pendentes, identificar tarefas atrasadas e consultar o total de minutos registrados por tarefa.

## Tecnologias utilizadas
- C#
- .NET 8 Minimal API
- Entity Framework Core
- SQLite
- Swagger / OpenAPI
- Git e GitHub

## Como executar
1. Instale o SDK do .NET 8.
2. Abra um terminal na pasta do projeto.
3. Execute `dotnet restore`.
4. Execute `dotnet run`.
5. Abra no navegador o endereço local indicado no terminal, acrescentando `/swagger` se necessário.

O banco `gerenciador.db` é criado automaticamente na primeira execução.

## Exemplos de uso
Use o Swagger para testar os endpoints. Para cadastrar uma disciplina, envie um JSON como:

```json
{
  "nome": "Desenvolvimento de Software",
  "descricao": "Projeto final da disciplina"
}
```

Depois, utilize o `id` retornado para cadastrar uma tarefa em `/api/tarefas`:

```json
{
  "titulo": "Implementar o CRUD de tarefas",
  "descricao": "Criar e testar os endpoints",
  "dataPrazo": "2026-10-30T23:59:00",
  "concluida": false,
  "disciplinaId": 1
}
```

Para registrar uma sessão de estudo em `/api/sessoes-estudo`:

```json
{
  "data": "2026-10-25T14:00:00",
  "duracaoMinutos": 40,
  "tarefaId": 1
}
```

## Repositório
Adicione aqui o link do repositório GitHub do projeto.

## Uso de IA
- **Ferramenta utilizada:** ChatGPT.
- **Forma de uso:** auxílio no planejamento da estrutura, elaboração inicial da documentação README e apoio na implementação do código.
- **Revisões da equipe:** Realizamos posteriormente os testes de inserção, consulta e exclusão das tarefas e disciplinas, como forma de validar o funcionamento do programa.
