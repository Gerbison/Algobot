/*
 * codigo.js — traduz a solução do aluno para TypeScript e comenta o que ele fez.
 *
 * É o "retorno" que aparece ao concluir uma fase. Três partes, nesta ordem:
 *   1. uma frase explicando, em termos de programação, o que ele acabou de fazer;
 *   2. a solução dele escrita em TypeScript;
 *   3. quando existe, um jeito mais simples de escrever a mesma coisa.
 *
 * Regra que vale para a parte 3: a alternativa fala de COMO ESCREVER, nunca de
 * qual é a resposta da fase. A graça do jogo é o aluno descobrir o caminho; o
 * que este arquivo ensina é a forma de expressar o caminho em código.
 *
 * Este arquivo não conhece o motor nem a tela — recebe o programa e devolve
 * texto. Por isso dá para testá-lo no Node junto com o resto.
 */

const Codigo = (function () {

  /* Cada comando do jogo vira uma chamada de função em TypeScript. */
  const FUNCAO = {
    AVANCAR: "avancar",
    GIRAR_ESQ: "girarEsquerda",
    GIRAR_DIR: "girarDireita",
    PULAR: "pular",
    ACENDER: "acender",
    F1: "f1",
    F2: "f2"
  };

  function comandosDe(programa, area) {
    return (programa[area] || []).filter(Boolean);
  }

  function indentar(linhas, nivel) {
    const espacos = "  ".repeat(nivel);
    return linhas.map(function (l) { return espacos + l; });
  }

  function chamadas(lista, nivel) {
    return indentar(lista.map(function (c) { return FUNCAO[c] + "();"; }), nivel);
  }

  function bloco(nome, comentario, corpoLinhas) {
    return ["// " + comentario, "function " + nome + "(): void {"]
      .concat(corpoLinhas)
      .concat(["}"]);
  }

  /*
   * Descobre se uma lista é um mesmo bloco repetido do começo ao fim.
   * ["F1","F1","F1"]                  -> bloco ["F1"], 3 vezes
   * ["AVANCAR","ACENDER","AVANCAR","ACENDER"] -> bloco de 2, 2 vezes
   * Devolve null quando não há repetição exata.
   *
   * Só interessa a repetição que cobre a lista INTEIRA: é a que vira um "for"
   * limpo. Repetição parcial existiria em muitos casos e a sugestão ficaria
   * confusa mais do que útil.
   */
  function repeticao(lista) {
    if (lista.length < 2) return null;

    for (let p = 1; p <= lista.length / 2; p++) {
      if (lista.length % p !== 0) continue;

      let combina = true;
      for (let i = p; i < lista.length; i++) {
        if (lista[i] !== lista[i - p]) { combina = false; break; }
      }
      if (combina) {
        return { bloco: lista.slice(0, p), vezes: lista.length / p };
      }
    }
    return null;
  }

  /* ------------------------------------------------- o código do aluno -- */

  function gerarTypeScript(programa) {
    const principal = comandosDe(programa, "principal");
    const f1 = comandosDe(programa, "f1");
    const f2 = comandosDe(programa, "f2");

    let linhas = [];

    if (f2.length) {
      linhas = linhas.concat(bloco("f2", "F2 — a sub-rotina menor que você montou", chamadas(f2, 1)), [""]);
    }
    if (f1.length) {
      linhas = linhas.concat(bloco("f1", "F1 — a sub-rotina que você montou", chamadas(f1, 1)), [""]);
    }

    linhas = linhas.concat(bloco("principal", "PRINCIPAL — por onde o robô começa", chamadas(principal, 1)));

    return linhas.join("\n");
  }

  /* ------------------------------------------------------- a explicação -- */

  function vezesPorExtenso(n) {
    const nomes = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito"];
    return nomes[n] || String(n);
  }

  /*
   * Devolve { explicacao, tituloAlternativa, textoAlternativa, codigoAlternativa }.
   * Os campos da alternativa vêm null quando não há nada a sugerir.
   */
  function analisar(programa) {
    const principal = comandosDe(programa, "principal");
    const f1 = comandosDe(programa, "f1");
    const f2 = comandosDe(programa, "f2");

    const usouSubrotina = f1.length > 0 || f2.length > 0;
    const f1Recursiva = f1.indexOf("F1") >= 0;
    const f2Recursiva = f2.indexOf("F2") >= 0;

    /* --- caso 1: recursão. A função se chama e vira um laço. --- */
    if (f1Recursiva || f2Recursiva) {
      const area = f1Recursiva ? f1 : f2;
      const nome = f1Recursiva ? "F1" : "F2";
      // corpo do laço = tudo menos a chamada recursiva
      const corpo = area.filter(function (c) { return c !== (f1Recursiva ? "F1" : "F2"); });

      return {
        explicacao:
          "Sua " + nome + " chama a si mesma. Isso se chama recursão: a função " +
          "reinicia do começo toda vez que chega no fim, e só para quando a fase " +
          "termina. Foi assim que você fez um laço sem ter um comando de laço.",
        tituloAlternativa: "O mesmo laço, do jeito mais comum em TypeScript",
        textoAlternativa:
          "Recursão funciona, mas fora deste jogo quase sempre se escreve isso " +
          "com while, que deixa a condição de parada visível no código:",
        codigoAlternativa: [
          "function principal(): void {",
          "  while (aindaFaltaAlvo()) {"
        ]
          .concat(indentar(corpo.map(function (c) { return FUNCAO[c] + "();"; }), 2))
          .concat(["  }", "}"])
          .join("\n")
      };
    }

    /* --- caso 2: a PRINCIPAL é um bloco repetido. Vira um for. --- */
    const rep = repeticao(principal);
    if (rep && rep.vezes >= 2) {
      const soChamadas = rep.bloco.every(function (c) { return c === "F1" || c === "F2"; });

      // 2a. o bloco repetido já é uma chamada de sub-rotina: só falta o for.
      if (soChamadas) {
        return {
          explicacao:
            "Você guardou o trecho que se repete dentro de " +
            (usouSubrotina ? "uma sub-rotina" : "F1") +
            " e chamou ela " + vezesPorExtenso(rep.vezes) + " vezes. " +
            "Em TypeScript isso é exatamente o que se chama de função: um pedaço " +
            "de código com nome, escrito uma vez e reaproveitado.",
          tituloAlternativa: "Um jeito mais curto de repetir",
          textoAlternativa:
            "Repetir a chamada " + vezesPorExtenso(rep.vezes) +
            " vezes funciona, mas quando o número cresce dá trabalho. Um laço for " +
            "diz a mesma coisa numa linha:",
          codigoAlternativa: [
            "function principal(): void {",
            "  for (let i = 0; i < " + rep.vezes + "; i++) {"
          ]
            .concat(indentar(rep.bloco.map(function (c) { return FUNCAO[c] + "();"; }), 2))
            .concat(["  }", "}"])
            .join("\n")
        };
      }

      // 2b. o aluno repetiu os comandos na mão, sem sub-rotina nenhuma.
      return {
        explicacao:
          "Você resolveu escrevendo os comandos um atrás do outro. Repare numa " +
          "coisa: o mesmo trecho de " + rep.bloco.length + " comando" +
          (rep.bloco.length > 1 ? "s" : "") + " aparece " +
          vezesPorExtenso(rep.vezes) + " vezes seguidas.",
        tituloAlternativa: "Dá para escrever isso uma vez só",
        textoAlternativa:
          "Em TypeScript, um trecho que se repete vira uma função com nome, e a " +
          "repetição vira um for. É a mesma ideia do F1 do jogo:",
        codigoAlternativa: [
          "function trecho(): void {"
        ]
          .concat(indentar(rep.bloco.map(function (c) { return FUNCAO[c] + "();"; }), 1))
          .concat([
            "}",
            "",
            "function principal(): void {",
            "  for (let i = 0; i < " + rep.vezes + "; i++) {",
            "    trecho();",
            "  }",
            "}"
          ])
          .join("\n")
      };
    }

    /* --- caso 3: usou sub-rotina, mas sem repetição exata na PRINCIPAL. --- */
    if (usouSubrotina) {
      return {
        explicacao:
          "Você separou parte da solução em uma sub-rotina e chamou ela de dentro " +
          "da PRINCIPAL. É assim que funciona uma função em TypeScript: o código " +
          "fica escrito num lugar só e você o aciona pelo nome, quantas vezes " +
          "precisar.",
        tituloAlternativa: null,
        textoAlternativa: null,
        codigoAlternativa: null
      };
    }

    /* --- caso 4: sequência direta, sem repetição. Nada a simplificar. --- */
    return {
      explicacao:
        "Você resolveu com uma sequência direta: um comando depois do outro, na " +
        "ordem exata em que o robô precisa executá-los. É o tipo mais básico de " +
        "programa, e todo o resto é construído em cima disso.",
      tituloAlternativa: null,
      textoAlternativa:
        "Aqui não há trecho repetido, então não há o que encurtar — a sequência " +
        "já é a forma mais simples.",
      codigoAlternativa: null
    };
  }

  return {
    gerarTypeScript: gerarTypeScript,
    analisar: analisar,
    repeticao: repeticao
  };
})();
