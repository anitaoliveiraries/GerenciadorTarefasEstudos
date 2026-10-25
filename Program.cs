using GerenciadorTarefasEstudos.Data;
using GerenciadorTarefasEstudos.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=gerenciador.db"));

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

// Página inicial
app.MapGet("/", () => Results.Redirect("/swagger"));

// DISCIPLINAS: CRUD
app.MapGet("/api/disciplinas", async (AppDbContext db) =>
    await db.Disciplinas.AsNoTracking().ToListAsync());

app.MapGet("/api/disciplinas/{id:int}", async (int id, AppDbContext db) =>
{
    var disciplina = await db.Disciplinas.AsNoTracking()
        .Include(d => d.Tarefas)
        .FirstOrDefaultAsync(d => d.Id == id);

    return disciplina is null ? Results.NotFound() : Results.Ok(disciplina);
});

app.MapPost("/api/disciplinas", async (Disciplina disciplina, AppDbContext db) =>
{
    disciplina.Id = 0;
    db.Disciplinas.Add(disciplina);
    await db.SaveChangesAsync();
    return Results.Created($"/api/disciplinas/{disciplina.Id}", disciplina);
});

app.MapPut("/api/disciplinas/{id:int}", async (int id, Disciplina dados, AppDbContext db) =>
{
    var disciplina = await db.Disciplinas.FindAsync(id);
    if (disciplina is null) return Results.NotFound();

    disciplina.Nome = dados.Nome;
    disciplina.Descricao = dados.Descricao;
    await db.SaveChangesAsync();
    return Results.Ok(disciplina);
});

app.MapDelete("/api/disciplinas/{id:int}", async (int id, AppDbContext db) =>
{
    var disciplina = await db.Disciplinas.FindAsync(id);
    if (disciplina is null) return Results.NotFound();

    var possuiTarefas = await db.Tarefas.AnyAsync(t => t.DisciplinaId == id);
    if (possuiTarefas)
        return Results.Conflict("Não é possível excluir uma disciplina que possui tarefas. Exclua ou transfira as tarefas primeiro.");

    db.Disciplinas.Remove(disciplina);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// TAREFAS: CRUD
app.MapGet("/api/tarefas", async (AppDbContext db) =>
    await db.Tarefas.AsNoTracking().Include(t => t.Disciplina).ToListAsync());

app.MapGet("/api/tarefas/pendentes", async (AppDbContext db) =>
    await db.Tarefas.AsNoTracking()
        .Include(t => t.Disciplina)
        .Where(t => !t.Concluida)
        .OrderBy(t => t.DataPrazo)
        .ToListAsync());

app.MapGet("/api/tarefas/atrasadas", async (AppDbContext db) =>
    await db.Tarefas.AsNoTracking()
        .Include(t => t.Disciplina)
        .Where(t => !t.Concluida && t.DataPrazo < DateTime.Now)
        .OrderBy(t => t.DataPrazo)
        .ToListAsync());

app.MapGet("/api/tarefas/{id:int}", async (int id, AppDbContext db) =>
{
    var tarefa = await db.Tarefas.AsNoTracking()
        .Include(t => t.Disciplina)
        .Include(t => t.SessoesEstudo)
        .FirstOrDefaultAsync(t => t.Id == id);

    return tarefa is null ? Results.NotFound() : Results.Ok(tarefa);
});

app.MapPost("/api/tarefas", async (Tarefa tarefa, AppDbContext db) =>
{
    var disciplinaExiste = await db.Disciplinas.AnyAsync(d => d.Id == tarefa.DisciplinaId);
    if (!disciplinaExiste)
        return Results.BadRequest("Informe um DisciplinaId existente.");

    tarefa.Id = 0;
    tarefa.Disciplina = null;
    tarefa.SessoesEstudo = new();
    db.Tarefas.Add(tarefa);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tarefas/{tarefa.Id}", tarefa);
});

app.MapPut("/api/tarefas/{id:int}", async (int id, Tarefa dados, AppDbContext db) =>
{
    var tarefa = await db.Tarefas.FindAsync(id);
    if (tarefa is null) return Results.NotFound();

    var disciplinaExiste = await db.Disciplinas.AnyAsync(d => d.Id == dados.DisciplinaId);
    if (!disciplinaExiste)
        return Results.BadRequest("Informe um DisciplinaId existente.");

    tarefa.Titulo = dados.Titulo;
    tarefa.Descricao = dados.Descricao;
    tarefa.DataPrazo = dados.DataPrazo;
    tarefa.Concluida = dados.Concluida;
    tarefa.DisciplinaId = dados.DisciplinaId;

    await db.SaveChangesAsync();
    return Results.Ok(tarefa);
});

app.MapDelete("/api/tarefas/{id:int}", async (int id, AppDbContext db) =>
{
    var tarefa = await db.Tarefas.FindAsync(id);
    if (tarefa is null) return Results.NotFound();

    db.Tarefas.Remove(tarefa);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// Marcar uma tarefa como concluída ou pendente
app.MapPatch("/api/tarefas/{id:int}/concluida", async (int id, bool concluida, AppDbContext db) =>
{
    var tarefa = await db.Tarefas.FindAsync(id);
    if (tarefa is null) return Results.NotFound();

    tarefa.Concluida = concluida;
    await db.SaveChangesAsync();
    return Results.Ok(tarefa);
});

// SESSÕES DE ESTUDO
app.MapGet("/api/sessoes-estudo", async (AppDbContext db) =>
    await db.SessoesEstudo.AsNoTracking().Include(s => s.Tarefa).ToListAsync());

app.MapPost("/api/sessoes-estudo", async (SessaoEstudo sessao, AppDbContext db) =>
{
    if (sessao.DuracaoMinutos <= 0)
        return Results.BadRequest("A duração deve ser maior que zero.");

    var tarefaExiste = await db.Tarefas.AnyAsync(t => t.Id == sessao.TarefaId);
    if (!tarefaExiste)
        return Results.BadRequest("Informe um TarefaId existente.");

    sessao.Id = 0;
    sessao.Tarefa = null;
    db.SessoesEstudo.Add(sessao);
    await db.SaveChangesAsync();
    return Results.Created($"/api/sessoes-estudo/{sessao.Id}", sessao);
});

app.MapDelete("/api/sessoes-estudo/{id:int}", async (int id, AppDbContext db) =>
{
    var sessao = await db.SessoesEstudo.FindAsync(id);
    if (sessao is null) return Results.NotFound();

    db.SessoesEstudo.Remove(sessao);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// RELATÓRIO: total de minutos estudados por tarefa
app.MapGet("/api/relatorios/tempo-estudo", async (AppDbContext db) =>
    await db.Tarefas.AsNoTracking()
        .Select(t => new
        {
            Tarefa = t.Titulo,
            Disciplina = t.Disciplina!.Nome,
            TotalMinutos = t.SessoesEstudo.Sum(s => (int?)s.DuracaoMinutos) ?? 0
        })
        .ToListAsync());

app.Run();
