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
["config.js", "fases.js", "motor.js", "interpretador.js", "estrelas.js"].forEach(function (arquivo) {
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

const A = "AVANCAR";
const E = "GIRAR_ESQ";
const D = "GIRAR_DIR";
const P = "PULAR";
const L = "ACENDER";

/* As soluções pretendidas, na ordem das fases. */
const SOLUCOES = {
  1: { principal: [A, A, L] },
  2: { principal: [A, A, D, A, A, L] },
  3: { principal: [A, A, A, L, D, A, A, D, A, A, A, L] },
  4: { principal: [P, P, A, D, A, P, P, L] },
  5: { principal: ["F1", "F1", "F1"], f1: [A, A, L] },
  6: { principal: ["F1", "F1", "F1", "F1"], f1: [A, A, A, L, D] },
  7: { principal: ["F1", "F1", "F1", "F1", "F1"], f1: [A, D, A, L, E] },
  8: { principal: ["F1", "F1", "F1", "F1"], f1: [P, P, P, P, L, D] },
  9: { principal: ["F1"], f1: [A, L, "F1"] },
  10: { principal: ["F1"], f1: [A, A, A, L, D, "F1"] },
  11: { principal: ["F1", "F1", "F1", "F1"], f1: ["F2", "F2", "F2", D], f2: [A, A, L] },
  12: { principal: ["F1"], f1: ["F2", "F2", D, "F1"], f2: [A, A, A, L] }
};

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

console.log("");
if (falhas > 0) {
  console.error(falhas + " teste(s) falharam.");
  process.exit(1);
}
console.log("Tudo certo.");
