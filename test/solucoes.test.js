/*
 * test/solucoes.test.js — regressão das fases.
 *
 * Roda no Node (node test/solucoes.test.js), sem navegador e sem framework.
 * Para cada fase existe aqui a solução que o professor tem em mente. O teste
 * confere três coisas:
 *
 *   1. a solução cabe nos espaços que a fase oferece;
 *   2. executada no motor de verdade, ela realmente acende todos os alvos;
 *   3. a quantidade de comandos bate com o limite de 3 estrelas.
 *
 * Se você editar fases.js, rode isto antes de dar a fase por pronta. É o que
 * impede uma fase impossível de chegar na frente da turma.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

// Os arquivos do jogo usam <script> clássico (sem module.exports), então
// carregamos todos num contexto compartilhado, exatamente como o navegador faz.
const contexto = vm.createContext({ console: console, performance: { now: Date.now } });
["config.js", "fases.js", "motor.js", "interpretador.js", "estrelas.js", "codigo.js"].forEach(function (arquivo) {
  const caminho = path.join(__dirname, "..", "js", arquivo);
  vm.runInContext(fs.readFileSync(caminho, "utf8"), contexto, { filename: arquivo });
});

// Declaracoes com const/let ficam no escopo lexico do contexto, e nao viram
// propriedades dele -- por isso lemos cada uma avaliando o nome la dentro.
// (No navegador isso nao e problema: scripts classicos compartilham o mesmo
// escopo global.)
function doContexto(nome) {
  return vm.runInContext(nome, contexto);
}

const FASES = doContexto("FASES");
const Motor = doContexto("Motor");
const Interpretador = doContexto("Interpretador");
const Estrelas = doContexto("Estrelas");
const Codigo = doContexto("Codigo");

const conhecidas = require("./solucoes-conhecidas.js");
const SOLUCOES = conhecidas.SOLUCOES;
const A = conhecidas.A, E = conhecidas.E, D = conhecidas.D, P = conhecidas.P, L = conhecidas.L;

/* Executa um programa até vencer, falhar ou acabar. Mesma lógica do jogo,
 * só que sem animação: aqui os passos acontecem de uma vez. */
function jogar(fase, programa) {
  const estado = Motor.criarEstado(fase);
  const execucao = Interpretador.criarExecucao(programa);

  while (true) {
    const instrucao = Interpretador.proximaInstrucao(execucao);

    if (instrucao.tipo === "fim") {
      return { venceu: false, motivo: "o programa acabou com alvos apagados" };
    }
    if (instrucao.tipo === "erro") {
      return { venceu: false, motivo: instrucao.mensagem };
    }

    const r = Motor.aplicar(estado, instrucao.comando);
    if (!r.ok) {
      return { venceu: false, motivo: r.mensagem + " (comando " + instrucao.comando + " em " + instrucao.area + ")" };
    }

    if (Motor.venceu(estado)) {
      return { venceu: true };
    }
  }
}

let falhas = 0;

FASES.forEach(function (fase) {
  const solucao = SOLUCOES[fase.id];

  try {
    assert.ok(solucao, "fase " + fase.id + " não tem solução cadastrada no teste");

    const programa = {
      principal: solucao.principal || [],
      f1: solucao.f1 || [],
      f2: solucao.f2 || []
    };

    // 1. cabe nos espaços da fase?
    ["principal", "f1", "f2"].forEach(function (area) {
      assert.ok(
        programa[area].length <= fase.espacos[area],
        "fase " + fase.id + ": a solução usa " + programa[area].length +
        " espaços em " + area + ", mas a fase só oferece " + fase.espacos[area]
      );
    });

    // 2. os comandos usados estão disponíveis na paleta?
    ["principal", "f1", "f2"].forEach(function (area) {
      programa[area].forEach(function (c) {
        assert.ok(
          fase.comandosDisponiveis.indexOf(c) >= 0,
          "fase " + fase.id + ": a solução usa " + c + ", que não está na paleta"
        );
      });
    });

    // 3. a solução vence?
    const resultado = jogar(fase, programa);
    assert.ok(resultado.venceu, "fase " + fase.id + " não foi vencida: " + resultado.motivo);

    // 4. vale as três estrelas?
    const usados = Interpretador.contarComandos(programa);
    const estrelas = Estrelas.calcular(fase, usados);
    assert.strictEqual(
      estrelas, 3,
      "fase " + fase.id + ": a solução usa " + usados + " comandos e vale " +
      estrelas + " estrelas; o limite de 3 estrelas é " + fase.estrelas.tres
    );

    // 5. o limite de 2 estrelas tem que ser mais folgado que o de 3.
    assert.ok(
      fase.estrelas.duas >= fase.estrelas.tres,
      "fase " + fase.id + ": o limite de 2 estrelas está menor que o de 3"
    );

    console.log("  ok   fase " + fase.id + " (" + fase.nome + ") — " + usados + " comandos");
  } catch (erro) {
    falhas++;
    console.error("  FALHA " + erro.message);
  }
});

/* --------------------------------------------------------------------------
 * Testes do código de conclusão: o que sai tem que voltar.
 * ------------------------------------------------------------------------ */

try {
  const progresso = { nome: "Maria Silva", faseMaxima: 5, fases: {} };
  progresso.fases[1] = { estrelas: 3, comandos: 3 };
  progresso.fases[2] = { estrelas: 2, comandos: 8 };
  progresso.fases[4] = { estrelas: 1, comandos: 20 };

  const codigo = Estrelas.gerarCodigo(progresso, FASES);
  const lido = Estrelas.decodificarCodigo(codigo);

  assert.ok(lido.valido, "o código gerado não foi aceito na volta");
  assert.strictEqual(lido.estrelas[0], 3, "fase 1 deveria voltar com 3 estrelas");
  assert.strictEqual(lido.estrelas[1], 2, "fase 2 deveria voltar com 2 estrelas");
  assert.strictEqual(lido.estrelas[2], 0, "fase 3 deveria voltar com 0 estrelas");
  assert.strictEqual(lido.estrelas[3], 1, "fase 4 deveria voltar com 1 estrela");

  assert.ok(Estrelas.conferirNome(codigo, "maria silva"), "o nome deveria bater ignorando maiúsculas");
  assert.ok(!Estrelas.conferirNome(codigo, "João"), "outro nome não deveria bater");
  assert.ok(!Estrelas.decodificarCodigo("XYZ-1-2").valido, "código de formato errado deveria ser recusado");

  console.log("  ok   código de conclusão (" + codigo + ")");
} catch (erro) {
  falhas++;
  console.error("  FALHA " + erro.message);
}

/* --------------------------------------------------------------------------
 * Teste do limite de pilha: um laço infinito precisa parar, não travar.
 * ------------------------------------------------------------------------ */

try {
  const fase = FASES[9]; // "Girando para sempre", tem F1
  const programa = { principal: ["F1"], f1: ["F1"], f2: [] };
  const resultado = jogar(fase, programa);

  assert.ok(!resultado.venceu, "um F1 que só chama F1 não deveria vencer");
  assert.ok(
    /laço infinito/.test(resultado.motivo),
    "o laço infinito deveria ser detectado, mas a mensagem foi: " + resultado.motivo
  );

  console.log("  ok   laço infinito é detectado em vez de travar");
} catch (erro) {
  falhas++;
  console.error("  FALHA " + erro.message);
}

/* --------------------------------------------------------------------------
 * Revisão em TypeScript: o texto e o código mostrados ao concluir a fase.
 * ------------------------------------------------------------------------ */

function testarCodigo(titulo, fn) {
  try {
    fn();
    console.log("  ok   " + titulo);
  } catch (erro) {
    falhas++;
    console.error("  FALHA " + titulo + ": " + erro.message);
  }
}

testarCodigo("sequência direta não inventa alternativa", function () {
  const analise = Codigo.analisar({ principal: [A, A, L], f1: [], f2: [] });
  assert.ok(/sequência direta/.test(analise.explicacao), "deveria falar em sequência direta");
  assert.strictEqual(analise.codigoAlternativa, null, "não há o que simplificar aqui");
});

testarCodigo("F1 chamada N vezes vira sugestão de for", function () {
  const analise = Codigo.analisar({ principal: ["F1", "F1", "F1"], f1: [A, A, L], f2: [] });
  assert.ok(/função/.test(analise.explicacao), "deveria explicar o conceito de função");
  assert.ok(/for \(let i = 0; i < 3; i\+\+\)/.test(analise.codigoAlternativa),
    "o for deveria repetir 3 vezes; veio: " + analise.codigoAlternativa);
  assert.ok(/f1\(\);/.test(analise.codigoAlternativa), "o corpo do for deveria chamar f1()");
});

testarCodigo("repetição na mão sugere extrair função + for", function () {
  const analise = Codigo.analisar({ principal: [A, A, L, A, A, L, A, A, L], f1: [], f2: [] });
  assert.ok(/três vezes/.test(analise.explicacao), "deveria dizer que o trecho aparece três vezes");
  assert.ok(/function trecho\(\): void/.test(analise.codigoAlternativa), "deveria propor extrair uma função");
  assert.ok(/i < 3;/.test(analise.codigoAlternativa), "o for deveria ser de 3 voltas");
});

testarCodigo("recursão é explicada e vira while", function () {
  const analise = Codigo.analisar({ principal: ["F1"], f1: [A, L, "F1"], f2: [] });
  assert.ok(/recursão/.test(analise.explicacao), "deveria nomear recursão");
  assert.ok(/while \(/.test(analise.codigoAlternativa), "a alternativa deveria usar while");
  assert.ok(!/f1\(\)/.test(analise.codigoAlternativa),
    "o while não pode chamar f1 de novo, senão continua recursivo: " + analise.codigoAlternativa);
});

testarCodigo("recursão mútua é reconhecida (fase 21)", function () {
  const s = SOLUCOES[21];
  const analise = Codigo.analisar({ principal: s.principal, f1: s.f1, f2: s.f2 });
  assert.ok(/recursão mútua/.test(analise.explicacao),
    "deveria nomear recursão mútua; veio: " + analise.explicacao);
  assert.ok(/while \(/.test(analise.codigoAlternativa), "a alternativa deveria usar while");
  assert.ok(!/f1\(\)|f2\(\)/.test(analise.codigoAlternativa),
    "o while não pode chamar as funções de novo, senão continua recursivo:\n" + analise.codigoAlternativa);
  // o corpo do while precisa ter os comandos das duas funções, na ordem
  const corpo = analise.codigoAlternativa;
  assert.ok(corpo.indexOf("avancar();") < corpo.indexOf("pular();"),
    "a F1 (plano) roda antes da F2 (degrau):\n" + corpo);
});

testarCodigo("TypeScript gerado tem uma função por área usada", function () {
  const ts = Codigo.gerarTypeScript({ principal: ["F1", "F2"], f1: [A, L], f2: [P] });
  assert.ok(/function principal\(\): void \{/.test(ts), "faltou a principal");
  assert.ok(/function f1\(\): void \{/.test(ts), "faltou a f1");
  assert.ok(/function f2\(\): void \{/.test(ts), "faltou a f2");
  assert.ok(/avancar\(\);/.test(ts), "AVANCAR deveria virar avancar()");
  assert.ok(/acender\(\);/.test(ts), "ACENDER deveria virar acender()");
  assert.ok(/pular\(\);/.test(ts), "PULAR deveria virar pular()");

  // área vazia não pode virar função vazia
  const soPrincipal = Codigo.gerarTypeScript({ principal: [A, L], f1: [], f2: [] });
  assert.ok(!/function f1/.test(soPrincipal), "F1 vazia não deveria aparecer no código");
});

testarCodigo("todas as soluções geram revisão sem quebrar", function () {
  FASES.forEach(function (fase) {
    const s = SOLUCOES[fase.id];
    const programa = { principal: s.principal || [], f1: s.f1 || [], f2: s.f2 || [] };

    const analise = Codigo.analisar(programa);
    assert.ok(analise.explicacao && analise.explicacao.length > 20,
      "fase " + fase.id + ": explicação vazia ou curta demais");

    const ts = Codigo.gerarTypeScript(programa);
    assert.ok(/function principal/.test(ts), "fase " + fase.id + ": TypeScript sem principal");

    // nenhum comando pode escapar sem tradução
    assert.ok(!/undefined/.test(ts), "fase " + fase.id + ": comando sem tradução no TypeScript");
  });
});

/* --------------------------------------------------------------------------
 * Guia dos comandos: todo comando que aparece em alguma fase precisa ter
 * cartão, texto e exemplo. Senão o aluno vê um botão sem explicação.
 * ------------------------------------------------------------------------ */

testarCodigo("toda fase tem dica, e as listas de dicas não estão vazias", function () {
  FASES.forEach(function (fase) {
    const lista = fase.dicas || (fase.dica ? [fase.dica] : []);
    assert.ok(lista.length > 0, "fase " + fase.id + " está sem dica");
    lista.forEach(function (d, i) {
      assert.ok(typeof d === "string" && d.trim().length > 15,
        "fase " + fase.id + ", dica " + (i + 1) + ": vazia ou curta demais");
    });
    assert.ok(!(fase.dica && fase.dicas),
      "fase " + fase.id + " tem 'dica' e 'dicas' ao mesmo tempo; o jogo só mostraria 'dicas'");
  });
});

testarCodigo("todo comando das fases tem explicação no guia", function () {
  // guia.js só toca no DOM ao montar; carregar os dados funciona no Node.
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "guia.js"), "utf8"), contexto);
  const Guia = doContexto("Guia");

  const usados = new Set();
  FASES.forEach(function (f) { f.comandosDisponiveis.forEach(function (c) { usados.add(c); }); });

  usados.forEach(function (cmd) {
    const dados = Guia.CONTEUDO[cmd];
    assert.ok(dados, cmd + " aparece numa fase mas não tem cartão no guia");
    assert.ok(Guia.ORDEM.indexOf(cmd) >= 0, cmd + " tem cartão mas não está em Guia.ORDEM, então nunca é mostrado");
    assert.ok(dados.texto && dados.texto.length > 20, cmd + ": explicação vazia ou curta demais");
    const temExemplo = (dados.antes && dados.depois) || dados.exemploF1;
    assert.ok(temExemplo, cmd + ": cartão sem exemplo");
  });
});

console.log("");
if (falhas > 0) {
  console.error(falhas + " teste(s) falharam.");
  process.exit(1);
}
console.log("Tudo certo.");
