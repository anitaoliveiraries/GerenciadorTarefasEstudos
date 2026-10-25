namespace GerenciadorTarefasEstudos.Models;

public class SessaoEstudo
{
    public int Id { get; set; }
    public DateTime Data { get; set; }
    public int DuracaoMinutos { get; set; }

    public int TarefaId { get; set; }
    public Tarefa? Tarefa { get; set; }
}
