namespace GerenciadorTarefasEstudos.Models;

public class Disciplina
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }

    public List<Tarefa> Tarefas { get; set; } = new();
}
