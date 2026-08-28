/*
 * motor.js — as regras do jogo, sem nada de tela.
 *
 * Este arquivo só sabe responder "o robô pode fazer isso?" e "o que muda no
 * tabuleiro se ele fizer?". Não desenha, não mexe no DOM, não conhece o
 * interpretador. É de propósito: assim dá para conferir a regra lendo só aqui.
 */

const Motor = (function () {

  /* Cria o estado inicial de uma fase. O estado é o único objeto que muda
   * durante a execução — render.js só lê dele. */
  function criarEstado(fase) {
    return {
      fase: fase,
      // Chaves "x,y" das casas que precisam ser acesas.
      alvos: new Set(fase.alvos.map(function (a) { return a.x + "," + a.y; })),
      // Chaves "x,y" das casas já acesas.
      acesos: new Set(),
      robo: {
        x: fase.robo.x,
        y: fase.robo.y,
        direcao: fase.robo.direcao
      }
    };
  }

  function chave(x, y) {
    return x + "," + y;
  }

  /* Altura da casa (x, y). Devolve 0 se a casa não existe (buraco ou fora). */
  function altura(estado, x, y) {
    const linha = estado.fase.grade[y];
    if (!linha) return 0;
    return linha[x] || 0;
  }

  function existe(estado, x, y) {
    return altura(estado, x, y) > 0;
  }

  /* Coordenada da casa para onde o robô está olhando. */
  function frente(estado) {
    const v = VETOR_DIRECAO[estado.robo.direcao];
    return { x: estado.robo.x + v.dx, y: estado.robo.y + v.dy };
  }

  function alturaAtual(estado) {
    return altura(estado, estado.robo.x, estado.robo.y);
  }

  function ehAlvo(estado, x, y) {
    return estado.alvos.has(chave(x, y));
  }

  function estaAceso(estado, x, y) {
    return estado.acesos.has(chave(x, y));
  }

  function venceu(estado) {
    // Vitória quando todo alvo está aceso.
    let todos = true;
    estado.alvos.forEach(function (k) {
      if (!estado.acesos.has(k)) todos = false;
    });
    return todos;
  }

  /* Gira o robô. passo = +1 (direita) ou -1 (esquerda). */
  function girar(estado, passo) {
    const i = DIRECOES.indexOf(estado.robo.direcao);
    // O +4 evita índice negativo ao girar à esquerda a partir de NORTE.
    estado.robo.direcao = DIRECOES[(i + passo + 4) % 4];
  }

  /*
   * Executa um comando simples (nunca F1/F2 — quem trata chamada de sub-rotina
   * é o interpretador). Devolve:
   *   { ok: true,  animacao: "mover" | "girar" | "acender" }
   *   { ok: false, mensagem: "..." }
   * Em caso de erro o estado NÃO é alterado: o robô fica exatamente onde falhou.
   */
  function aplicar(estado, comando) {
    if (comando === "GIRAR_ESQ") {
      girar(estado, -1);
      return { ok: true, animacao: "girar" };
    }

    if (comando === "GIRAR_DIR") {
      girar(estado, 1);
      return { ok: true, animacao: "girar" };
    }

    if (comando === "ACENDER") {
      const x = estado.robo.x;
      const y = estado.robo.y;
      if (!ehAlvo(estado, x, y)) {
        return { ok: false, mensagem: "Esta casa não é um alvo. O robô só acende as casas amarelas." };
      }
      estado.acesos.add(chave(x, y));
      return { ok: true, animacao: "acender" };
    }

    if (comando === "AVANCAR" || comando === "PULAR") {
      const destino = frente(estado);
      const alturaDestino = altura(estado, destino.x, destino.y);

      if (alturaDestino === 0) {
        return { ok: false, mensagem: "Não há chão à frente. O robô quase caiu do tabuleiro." };
      }

      const desnivel = alturaDestino - alturaAtual(estado);

      if (comando === "AVANCAR") {
        if (desnivel !== 0) {
          return { ok: false, mensagem: "Há um degrau à frente. AVANÇAR só serve para casas da mesma altura — use PULAR." };
        }
      } else {
        // PULAR: sobe no máximo 1 nível; para descer, qualquer profundidade vale.
        if (desnivel === 0) {
          return { ok: false, mensagem: "Não há degrau aqui. Para andar no plano, use AVANÇAR." };
        }
        if (desnivel > 1) {
          return { ok: false, mensagem: "O degrau é alto demais. O robô só sobe um nível por vez." };
        }
      }

      estado.robo.x = destino.x;
      estado.robo.y = destino.y;
      return { ok: true, animacao: "mover" };
    }

    return { ok: false, mensagem: "Comando desconhecido: " + comando };
  }

  return {
    criarEstado: criarEstado,
    altura: altura,
    existe: existe,
    frente: frente,
    alturaAtual: alturaAtual,
    ehAlvo: ehAlvo,
    estaAceso: estaAceso,
    venceu: venceu,
    aplicar: aplicar,
    chave: chave
  };
})();
