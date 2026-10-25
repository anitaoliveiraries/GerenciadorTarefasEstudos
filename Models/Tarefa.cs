namespace GerenciadorTarefasEstudos.Models;

public class Tarefa
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public DateTime DataPrazo { get; set; }
    public bool Concluida { get; set; }

    public int DisciplinaId { get; set; }
    public Disciplina? Disciplina { get; set; }

    public List<SessaoEstudo> SessoesEstudo { get; set; } = new();
}
