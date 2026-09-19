/*
 * test/render.test.js — ordem de desenho e pulo do robô.
 *
 * Roda no Node (node test/render.test.js), sem navegador. Percorre CADA passo
 * das soluções conhecidas das 22 fases, nas 4 posições de câmera, em 21
 * instantes de cada passo, e confere as regras de Render.ordemDeDesenho:
 *
 *   1. o robô é pintado depois das casas do passo (origem e destino) sobre as
 *      quais ele está — nunca "atravessa o chão" em que pisa ou vai pisar;
 *   2. o robô é pintado ANTES de toda casa que está inteira à frente dele e
 *      se cruza com ele na tela — a parede na frente continua escondendo;
 *   3. o plano B (regras em conflito) nunca é usado;
 *
 * e as regras de Render.interpolar:
 *
 *   4. passo no plano: altura constante, sem pulo;
 *   5. passo com mudança de nível: a altura sobe ACIMA da maior das duas
 *      casas em algum ponto do trajeto (é um arco, não uma rampa), e começa e
 *      termina exatamente na altura das casas.
 *
 * O que este teste NÃO vê é o resultado em pixels. Isso foi conferido no
 * navegador ao escrever a correção (ver ARQUITETURA.md, seção 8).
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const contexto = vm.createContext({ console: console, performance: { now: Date.now } });
["config.js", "fases.js", "motor.js", "interpretador.js", "render.js"].forEach(function (arquivo) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", arquivo), "utf8"), contexto, { filename: arquivo });
});
function doContexto(nome) { return vm.runInContext(nome, contexto); }

const FASES = doContexto("FASES");
const Motor = doContexto("Motor");
const Interpretador = doContexto("Interpretador");
const Render = doContexto("Render");
const SOLUCOES = require("./solucoes-conhecidas.js").SOLUCOES;

/* Todos os passos de movimento de uma solução, na ordem em que o jogo executa. */
function passos(fase) {
  const s = SOLUCOES[fase.id];
  const programa = { principal: s.principal || [], f1: s.f1 || [], f2: s.f2 || [] };
  const estado = Motor.criarEstado(fase);
  const execucao = Interpretador.criarExecucao(programa);
  const lista = [];
  while (true) {
    const ins = Interpretador.proximaInstrucao(execucao);
    if (ins.tipo !== "comando") break;
    const de = { x: estado.robo.x, y: estado.robo.y, altura: Motor.alturaAtual(estado) };
    const r = Motor.aplicar(estado, ins.comando);
    if (!r.ok) break;
    if (r.animacao === "mover") {
      lista.push({
        de: de,
        para: { x: estado.robo.x, y: estado.robo.y, altura: Motor.alturaAtual(estado) },
        direcao: estado.robo.direcao
      });
    }
    if (Motor.venceu(estado)) break;
  }
  return lista;
}

/* Mesma geometria de render.js, refeita aqui de propósito: o teste confere
 * a regra, não repete o código. */
function centro(fase) {
  let largura = 0;
  fase.grade.forEach(function (l) { largura = Math.max(largura, l.length); });
  return { x: (largura - 1) / 2, y: (fase.grade.length - 1) / 2 };
}
function girar(x, y, ang, c) {
  const dx = x - c.x, dy = y - c.y;
  return { x: c.x + dx * Math.cos(ang) - dy * Math.sin(ang), y: c.y + dx * Math.sin(ang) + dy * Math.cos(ang) };
}

let falhas = 0;
let verificacoes = 0;
const planoBAntes = Render.vezesPlanoB();

function ok(condicao, mensagem) {
  verificacoes++;
  if (!condicao) {
    falhas++;
    if (falhas <= 15) console.error("  FALHA " + mensagem);
  }
}

FASES.forEach(function (fase) {
  const c = centro(fase);
  const lista = passos(fase);

  for (let quartos = 0; quartos < 4; quartos++) {
    const ang = quartos * Math.PI / 2;

    lista.forEach(function (p, np) {
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const visual = i === 20
          ? Render.parado(p.para.x, p.para.y, p.para.altura, p.direcao)
          : Render.interpolar(p.de, p.para, t, p.direcao);
        const itens = Render.ordemDeDesenho(fase, visual, ang);
        const k = itens.findIndex(function (it) { return it.tipo === "robo"; });
        const onde = "fase " + fase.id + ", câmera " + (quartos * 90) + "°, passo " + (np + 1) +
          " (" + p.de.x + "," + p.de.y + ")->(" + p.para.x + "," + p.para.y + "), t=" + t;

        const gR = girar(visual.x, visual.y, ang, c);
        const R = 0.3;

        itens.forEach(function (it, idx) {
          if (it.tipo !== "casa") return;
          const doPasso = (it.x === visual.origem.x && it.y === visual.origem.y) ||
                          (it.x === visual.destino.x && it.y === visual.destino.y);

          // regra 1
          if (doPasso && visual.altura >= it.altura - 0.001) {
            ok(idx < k, onde + ": casa do passo (" + it.x + "," + it.y + ") pintada POR CIMA do robô que está sobre ela");
          }

          // regra 2: casa inteira à frente, cruzando o robô na tela
          if (!doPasso) {
            const g = girar(it.x, it.y, ang, c);
            const aFrente = g.x - 0.5 >= gR.x + R - 0.001 || g.y - 0.5 >= gR.y + R - 0.001;
            const atras = g.x + 0.5 <= gR.x - R + 0.001 || g.y + 0.5 <= gR.y - R + 0.001;
            const cruza = Math.abs((g.x - g.y) - (gR.x - gR.y)) < 1.5;
            if (aFrente && !atras && cruza) {
              ok(idx > k, onde + ": parede (" + it.x + "," + it.y + ") na frente do robô foi pintada ATRÁS dele");
            }
          }
        });
      }
    });
  }
});

// regra 3
ok(Render.vezesPlanoB() === planoBAntes,
   "a ordem de desenho caiu no plano B " + (Render.vezesPlanoB() - planoBAntes) + " vez(es)");

// regras 4 e 5: o pulo
FASES.forEach(function (fase) {
  passos(fase).forEach(function (p) {
    const inicio = Render.interpolar(p.de, p.para, 0, p.direcao).altura;
    const fim = Render.interpolar(p.de, p.para, 1, p.direcao).altura;
    const onde = "fase " + fase.id + " (" + p.de.x + "," + p.de.y + ")h" + p.de.altura +
                 "->(" + p.para.x + "," + p.para.y + ")h" + p.para.altura;

    ok(Math.abs(inicio - p.de.altura) < 1e-9, onde + ": o passo não começa na altura da origem");
    ok(Math.abs(fim - p.para.altura) < 1e-9, onde + ": o passo não termina na altura do destino");

    if (p.de.altura === p.para.altura) {
      for (let i = 0; i <= 10; i++) {
        ok(Math.abs(Render.interpolar(p.de, p.para, i / 10, p.direcao).altura - p.de.altura) < 1e-9,
           onde + ": passo no plano não pode ter pulo");
      }
    } else {
      // O ponto mais alto do trajeto passa da casa mais alta: é um arco, não
      // uma rampa. (Numa queda grande o topo do arco vem antes do meio.)
      let pico = -Infinity;
      for (let i = 0; i <= 100; i++) {
        pico = Math.max(pico, Render.interpolar(p.de, p.para, i / 100, p.direcao).altura);
      }
      ok(pico > Math.max(p.de.altura, p.para.altura) + 0.1,
         onde + ": mudança de nível sem arco (ponto mais alto " + pico.toFixed(2) + ")");
    }
  });
});

console.log("  " + verificacoes + " verificações em todos os passos das " + FASES.length +
            " fases, nas 4 posições de câmera");
console.log("");
if (falhas > 0) {
  console.error(falhas + " falha(s).");
  process.exit(1);
}
console.log("Tudo certo.");
