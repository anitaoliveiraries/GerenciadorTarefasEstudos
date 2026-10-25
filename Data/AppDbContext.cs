using GerenciadorTarefasEstudos.Models;
using Microsoft.EntityFrameworkCore;

namespace GerenciadorTarefasEstudos.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Disciplina> Disciplinas => Set<Disciplina>();
    public DbSet<Tarefa> Tarefas => Set<Tarefa>();
    public DbSet<SessaoEstudo> SessoesEstudo => Set<SessaoEstudo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Disciplina>()
            .HasMany(d => d.Tarefas)
            .WithOne(t => t.Disciplina)
            .HasForeignKey(t => t.DisciplinaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Tarefa>()
            .HasMany(t => t.SessoesEstudo)
            .WithOne(s => s.Tarefa)
            .HasForeignKey(s => s.TarefaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
