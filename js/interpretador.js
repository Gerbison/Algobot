/*
 * interpretador.js — decide qual comando executar a seguir.
 *
 * Por que isto não é só um "for" na lista de comandos:
 * F1 e F2 podem chamar umas às outras e a si mesmas. Isso é recursão, e
 * recursão precisa de uma PILHA DE CHAMADAS. Se a gente usasse recursão de
 * verdade do JavaScript, um laço infinito do aluno estouraria a pilha do
 * navegador e travaria a aba. Então mantemos a pilha à mão, num array, e
 * cortamos a execução quando ela passa de LIMITE_PILHA.
 *
 * Cada quadro (frame) da pilha guarda em que área estamos e em qual comando
 * daquela área paramos:
 *     { area: "principal" | "f1" | "f2", indice: 0 }
 *
 * O interpretador NÃO mexe no tabuleiro. Ele só diz "o próximo comando é
 * AVANÇAR, que está no slot 3 da F1". Quem aplica no tabuleiro é o motor.
 */

const Interpretador = (function () {

  /*
   * programa = { principal: [...], f1: [...], f2: [...] }
   * Cada lista tem null nos espaços vazios (o aluno pode deixar buracos).
   */
  function criarExecucao(programa) {
    return {
      programa: programa,
      pilha: [{ area: "principal", indice: 0 }],
      passos: 0
    };
  }

  /*
   * Devolve o que fazer a seguir:
   *   { tipo: "comando", comando, area, indice }  — execute este comando
   *   { tipo: "fim" }                             — o programa acabou
   *   { tipo: "erro", mensagem }                  — laço infinito / longo demais
   *
   * O laço interno existe porque nem todo avanço na pilha produz um comando:
   * pular slots vazios e voltar de uma sub-rotina que terminou não consomem
   * um passo visível na tela.
   */
  function proximaInstrucao(exec) {
    while (true) {
      if (exec.pilha.length === 0) {
        return { tipo: "fim" };
      }

      const topo = exec.pilha[exec.pilha.length - 1];
      const sequencia = exec.programa[topo.area] || [];

      // Chegou ao fim desta área: volta para quem a chamou.
      if (topo.indice >= sequencia.length) {
        exec.pilha.pop();
        continue;
      }

      const comando = sequencia[topo.indice];
      const indiceAtual = topo.indice;
      topo.indice++;

      // Slot vazio: o aluno deixou um buraco no meio. Simplesmente ignoramos.
      if (!comando) {
        continue;
      }

      if (comando === "F1" || comando === "F2") {
        const area = comando.toLowerCase();

        // Chamar uma sub-rotina vazia não faz nada — evita empilhar à toa.
        const corpo = exec.programa[area] || [];
        const temAlgo = corpo.some(function (c) { return !!c; });
        if (!temAlgo) {
          continue;
        }

        if (exec.pilha.length >= LIMITE_PILHA) {
          return {
            tipo: "erro",
            mensagem: "O robô se perdeu em um laço infinito.",
            area: topo.area,
            indice: indiceAtual
          };
        }

        exec.pilha.push({ area: area, indice: 0 });
        continue;
      }

      exec.passos++;
      if (exec.passos > MAX_PASSOS) {
        return {
          tipo: "erro",
          mensagem: "O robô se perdeu em um laço infinito.",
          area: topo.area,
          indice: indiceAtual
        };
      }

      return {
        tipo: "comando",
        comando: comando,
        area: topo.area,
        indice: indiceAtual
      };
    }
  }

  /* Quantos comandos o aluno escreveu ao todo (é isso que vale estrela,
   * não quantas vezes eles foram executados). */
  function contarComandos(programa) {
    let total = 0;
    ["principal", "f1", "f2"].forEach(function (area) {
      (programa[area] || []).forEach(function (c) {
        if (c) total++;
      });
    });
    return total;
  }

  return {
    criarExecucao: criarExecucao,
    proximaInstrucao: proximaInstrucao,
    contarComandos: contarComandos
  };
})();
