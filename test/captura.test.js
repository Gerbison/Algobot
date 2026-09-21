/*
 * test/captura.test.js — o link "mailto:" do botão Enviar por e-mail.
 *
 * Roda no Node (node test/captura.test.js), sem navegador. Confere só a
 * parte pura de captura.js — Captura.linkEmail() — que não toca no DOM.
 * O resto (gerar a imagem, baixar o arquivo, abrir o link) só dá para ver
 * de verdade num navegador; isso foi conferido manualmente ao escrever o
 * botão (ver ARQUITETURA.md, seção "Enviar por e-mail").
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const contexto = vm.createContext({ console: console });
["config.js", "fases.js", "captura.js"].forEach(function (arquivo) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", arquivo), "utf8"), contexto, { filename: arquivo });
});
function doContexto(nome) { return vm.runInContext(nome, contexto); }

const FASES = doContexto("FASES");
const Captura = doContexto("Captura");
const fase = FASES[0];

let falhas = 0;
function testar(titulo, fn) {
  try {
    fn();
    console.log("  ok   " + titulo);
  } catch (erro) {
    falhas++;
    console.error("  FALHA " + titulo + ": " + erro.message);
  }
}

testar("o link começa com mailto: e o destinatário exato", function () {
  const link = Captura.linkEmail("professor@escola.edu.es.gov.br", fase, "Maria", null, "a.png");
  assert.strictEqual(
    link.indexOf("mailto:professor@escola.edu.es.gov.br?"), 0,
    "o destinatário não pode ir codificado (nada de %40 no meio do endereço); veio: " + link
  );
});

testar("assunto e corpo citam a fase, o aluno e o arquivo baixado", function () {
  const link = Captura.linkEmail("p@x.com", fase, "Maria Luíza", null, "algobot-fase-01-maria.png");
  const texto = decodeURIComponent(link);
  assert.ok(texto.indexOf("Fase " + fase.id) >= 0, "faltou o número da fase");
  assert.ok(texto.indexOf("Maria Luíza") >= 0, "faltou o nome do aluno");
  assert.ok(texto.indexOf("algobot-fase-01-maria.png") >= 0, "faltou o nome do arquivo baixado — sem isso o aluno não sabe o que anexar");
});

testar("sem nome de aluno não quebra o link", function () {
  const link = Captura.linkEmail("p@x.com", fase, "", null, "a.png");
  assert.strictEqual(link.indexOf("mailto:"), 0);
});

testar("com resultado, o corpo mostra as estrelas e os comandos usados", function () {
  const link = Captura.linkEmail("p@x.com", fase, "Ana", { estrelas: 2, usados: 8 }, "a.png");
  const texto = decodeURIComponent(link);
  assert.ok(texto.indexOf("★★☆") >= 0, "deveria mostrar 2 estrelas preenchidas e 1 vazia; corpo: " + texto);
  assert.ok(texto.indexOf("8 comandos") >= 0, "deveria citar 8 comandos");
});

testar("sem resultado, o corpo diz que ainda está em andamento", function () {
  const link = Captura.linkEmail("p@x.com", fase, "Ana", null, "a.png");
  assert.ok(/andamento/i.test(decodeURIComponent(link)));
});

testar("1 comando usa singular, não 'comandos'", function () {
  const link = Captura.linkEmail("p@x.com", fase, "Ana", { estrelas: 3, usados: 1 }, "a.png");
  const texto = decodeURIComponent(link);
  assert.ok(texto.indexOf("1 comando)") >= 0, "esperava '1 comando)', veio: " + texto);
});

console.log("");
if (falhas > 0) {
  console.error(falhas + " falha(s).");
  process.exit(1);
}
console.log("Tudo certo.");
