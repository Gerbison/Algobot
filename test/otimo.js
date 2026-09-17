/*
 * test/otimo.js — procura o MENOR programa que resolve uma fase.
 *
 * Uso:
 *   node test/otimo.js 13          uma fase
 *   node test/otimo.js 13 18 19    várias
 *   node test/otimo.js todas       todas (algumas demoram)
 *
 * Por que existe: o teste de soluções só prova que a solução que EU pensei
 * funciona. Não prova que ela é a menor. Se existir um atalho mais curto, a
 * fase difícil vira fácil e o limite de 3 estrelas fica errado. Este script
 * experimenta, em ordem de tamanho, TODOS os programas possíveis com os
 * comandos e espaços da fase, e para no primeiro que vence.
 *
 * Como é força bruta, só é viável até uns 9 comandos no total. Acima disso o
 * script avisa que desistiu e não afirma nada.
 *
 * Para ser rápido, ele não usa motor.js/interpretador.js (que criam objetos a
 * cada passo): reimplementa as mesmas regras de forma enxuta. As regras têm que
 * continuar idênticas às do motor — o teste de soluções serve de conferência,
 * porque toda solução conhecida precisa vencer aqui também.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const contexto = vm.createContext({});
["config.js", "fases.js"].forEach(function (arquivo) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", arquivo), "utf8"), contexto);
});
const FASES = vm.runInContext("FASES", contexto);
const LIMITE_PILHA = vm.runInContext("LIMITE_PILHA", contexto);

// Códigos numéricos dos comandos (mais rápido que comparar strings).
const AV = 0, GE = 1, GD = 2, PU = 3, AC = 4, F1 = 5, F2 = 6;
const NOMES = ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"];
const DX = [0, 1, 0, -1]; // NORTE, LESTE, SUL, OESTE
const DY = [-1, 0, 1, 0];
const DIRECAO = { NORTE: 0, LESTE: 1, SUL: 2, OESTE: 3 };

// Uma solução legítima destas fases nunca passa disto. Programas que passam
// são laços que não vencem.
const MAX_PASSOS = 400;

function prepararFase(fase) {
  const H = fase.grade.length;
  const W = Math.max.apply(null, fase.grade.map(function (l) { return l.length; }));
  const alt = new Int8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < fase.grade[y].length; x++) alt[y * W + x] = fase.grade[y][x];
  }
  const bitAlvo = new Int32Array(W * H).fill(-1);
  fase.alvos.forEach(function (a, i) { bitAlvo[a.y * W + a.x] = i; });
  return {
    W: W, H: H, alt: alt, bitAlvo: bitAlvo,
    todos: (1 << fase.alvos.length) - 1,
    x0: fase.robo.x, y0: fase.robo.y, d0: DIRECAO[fase.robo.direcao]
  };
}

/* Executa e responde só: venceu ou não. Mesmas regras de motor.js. */
function vence(f, areas) {
  let x = f.x0, y = f.y0, d = f.d0, acesos = 0, passos = 0;
  const pilhaArea = new Int8Array(LIMITE_PILHA + 1);
  const pilhaIdx = new Int16Array(LIMITE_PILHA + 1);
  let topo = 0;
  pilhaArea[0] = 0; pilhaIdx[0] = 0;

  while (topo >= 0) {
    const seq = areas[pilhaArea[topo]];
    if (pilhaIdx[topo] >= seq.length) { topo--; continue; }
    const c = seq[pilhaIdx[topo]++];

    if (c === F1 || c === F2) {
      const alvo = c === F1 ? 1 : 2;
      if (areas[alvo].length === 0) continue;
      if (topo + 1 >= LIMITE_PILHA) return false;
      topo++; pilhaArea[topo] = alvo; pilhaIdx[topo] = 0;
      continue;
    }

    if (++passos > MAX_PASSOS) return false;

    if (c === GE) { d = (d + 3) % 4; continue; }
    if (c === GD) { d = (d + 1) % 4; continue; }

    if (c === AC) {
      const b = f.bitAlvo[y * f.W + x];
      if (b < 0) return false;
      acesos |= (1 << b);
      if (acesos === f.todos) return true;
      continue;
    }

    // AVANCAR ou PULAR
    const nx = x + DX[d], ny = y + DY[d];
    if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H) return false;
    const hDest = f.alt[ny * f.W + nx];
    if (hDest === 0) return false;
    const desnivel = hDest - f.alt[y * f.W + x];
    if (c === AV) {
      if (desnivel !== 0) return false;
    } else {
      if (desnivel === 0 || desnivel > 1) return false;
    }
    x = nx; y = ny;
  }
  return false;
}

/*
 * Cortes que não perdem nenhuma solução mínima:
 *  - toda área com comandos precisa ser alcançável a partir da PRINCIPAL
 *    (senão, apagá-la dá um programa menor que faz o mesmo);
 *  - toda chamada precisa apontar para área não vazia (chamar área vazia não
 *    faz nada; apagar a chamada dá um programa menor igual);
 *  - precisa haver pelo menos um ACENDER.
 * Como procuramos em ordem crescente de tamanho, o primeiro achado é mínimo.
 */
function alcancavel(areas) {
  const visto = [true, false, false];
  const fila = [0];
  while (fila.length) {
    const a = fila.pop();
    areas[a].forEach(function (c) {
      const alvo = c === F1 ? 1 : c === F2 ? 2 : -1;
      if (alvo > 0 && !visto[alvo]) { visto[alvo] = true; fila.push(alvo); }
    });
  }
  return (areas[1].length === 0 || visto[1]) && (areas[2].length === 0 || visto[2]);
}

function buscar(fase, limiteTotal) {
  const f = prepararFase(fase);
  const disponiveis = fase.comandosDisponiveis.map(function (n) { return NOMES.indexOf(n); });
  let testados = 0;

  for (let n = 1; n <= limiteTotal; n++) {
    for (let p = 1; p <= Math.min(n, fase.espacos.principal); p++) {
      for (let a1 = 0; a1 <= Math.min(n - p, fase.espacos.f1); a1++) {
        const a2 = n - p - a1;
        if (a2 > fase.espacos.f2) continue;

        // Chamar área vazia é inútil: nem oferecemos o símbolo.
        const alfabeto = disponiveis.filter(function (c) {
          return !(c === F1 && a1 === 0) && !(c === F2 && a2 === 0);
        });
        const k = alfabeto.length;
        const tamanhos = [p, a1, a2];
        const cont = new Array(n).fill(0);

        while (true) {
          // Monta as três áreas a partir do contador
          const areas = [[], [], []];
          let i = 0, temAcender = false;
          for (let a = 0; a < 3; a++) {
            for (let j = 0; j < tamanhos[a]; j++) {
              const c = alfabeto[cont[i++]];
              if (c === AC) temAcender = true;
              areas[a].push(c);
            }
          }

          if (temAcender && alcancavel(areas)) {
            testados++;
            if (vence(f, areas)) {
              return { tamanho: n, programa: areas, testados: testados };
            }
          }

          // incrementa o contador em base k
          let pos = n - 1;
          while (pos >= 0 && ++cont[pos] === k) { cont[pos] = 0; pos--; }
          if (pos < 0) break;
        }
      }
    }
  }
  return { tamanho: null, testados: testados };
}

function formatar(areas) {
  const rotulo = ["PRINCIPAL", "F1", "F2"];
  return areas.map(function (a, i) {
    return a.length ? "    " + rotulo[i] + ": " + a.map(function (c) { return NOMES[c]; }).join(", ") : null;
  }).filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ main -- */

const args = process.argv.slice(2);
const ids = (args.length === 0 || args[0] === "todas")
  ? FASES.map(function (f) { return f.id; })
  : args.map(Number);

// Acima deste total a busca leva tempo demais: não afirmamos nada.
const TETO = Number(process.env.TETO || 9);

ids.forEach(function (id) {
  const fase = FASES.find(function (f) { return f.id === id; });
  if (!fase) { console.log("fase " + id + ": não existe"); return; }

  const limite = Math.min(fase.estrelas.tres, TETO);
  const t0 = Date.now();
  const r = buscar(fase, limite);
  const seg = ((Date.now() - t0) / 1000).toFixed(1);

  if (r.tamanho !== null) {
    const marca = r.tamanho < fase.estrelas.tres ? "  <<< MENOR QUE O LIMITE DE 3 ESTRELAS" : "";
    console.log("fase " + id + " (" + fase.nome + "): mínimo = " + r.tamanho +
                " comandos [3 estrelas até " + fase.estrelas.tres + "]" + marca +
                "  (" + r.testados + " programas, " + seg + "s)");
    console.log(formatar(r.programa));
  } else if (limite < fase.estrelas.tres) {
    console.log("fase " + id + " (" + fase.nome + "): nenhuma solução com até " + limite +
                " comandos; o limite de 3 estrelas é " + fase.estrelas.tres +
                " e ficou fora do alcance da busca (" + seg + "s)");
  } else {
    console.log("fase " + id + " (" + fase.nome + "): nenhuma solução com até " + limite +
                " comandos (" + r.testados + " programas, " + seg + "s)");
  }
});
