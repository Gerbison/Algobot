/*
 * test/solucoes-conhecidas.js — a solução pretendida de cada fase.
 *
 * Usada por solucoes.test.js (a fase tem solução e as estrelas batem) e por
 * render.test.js (percorre cada passo dessas soluções conferindo a ordem de
 * desenho do robô). Ao criar uma fase nova, acrescente a solução aqui.
 */

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
  12: { principal: ["F1"], f1: ["F2", "F2", D, "F1"], f2: [A, A, A, L] },

  // ---- intermediário ----
  13: { principal: ["F1"], f1: [P, D, P, L, E, "F1"] },
  14: { principal: ["F1", "F1", "F1", E, "F2", "F2", "F2"], f1: [A, A, L], f2: [P, L] },
  15: { principal: [A, A, E, "F1"], f1: [A, A, L, "F1"] },
  16: { principal: ["F1"], f1: [E, A, D, A, A, D, A, E, L, "F1"] },
  17: { principal: ["F2"], f1: [A, A, L], f2: ["F1", D, "F1", E, "F2"] },

  // ---- difícil ----
  18: { principal: ["F1"], f1: [A, A, P, L, D, "F1"] },
  19: { principal: ["F1"], f1: ["F2", "F2", D, "F1"], f2: [P, P, P, L] },
  20: { principal: ["F1"], f1: [A, E, "F2", L, D, D, "F2", E, A, "F1"], f2: [A, A, A] },
  21: { principal: ["F1"], f1: [A, A, L, D, "F2"], f2: [P, L, E, "F1"] },
  22: { principal: ["F1"], f1: [A, E, "F2", "F2", D, A, "F1"], f2: [A, A, L, D, D, A, A] }
};

module.exports = { SOLUCOES: SOLUCOES, A: A, E: E, D: D, P: P, L: L };
