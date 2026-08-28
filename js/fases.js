/*
 * fases.js — as fases do jogo.
 *
 * Este é o arquivo que o professor edita para criar fases novas.
 * Veja MANUAL.md para um passo a passo comentado.
 *
 * Campos de cada fase:
 *   id                  número sequencial, único
 *   nome                aparece no topo da tela
 *   conceito            selo pedagógico ("sequência", "sub-rotina", ...)
 *   grade               matriz [linha y][coluna x]. 0 = buraco (não existe),
 *                       1 a 4 = altura da casa. y cresce para o SUL.
 *   alvos               lista de {x, y} que precisam ser acesas
 *   robo                {x, y, direcao} posição inicial
 *   espacos             quantos slots cada área tem. 0 esconde a área.
 *   comandosDisponiveis quais botões aparecem na paleta
 *   estrelas            {duas: N, tres: M} máximo de comandos para 2 e 3 estrelas
 *   dica                texto mostrado quando o aluno pede uma dica
 */

const FASES = [
  {
    id: 1,
    nome: "Primeiros passos",
    conceito: "sequência",
    grade: [
      [1, 1, 1, 0],
      [1, 1, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    alvos: [{ x: 2, y: 0 }],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 8, f1: 0, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER"],
    estrelas: { duas: 5, tres: 3 },
    dica: "O robô já está olhando para a casa amarela. Avance até ela e acenda."
  },

  {
    id: 2,
    nome: "Virando a esquina",
    conceito: "sequência",
    grade: [
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0]
    ],
    alvos: [{ x: 2, y: 2 }],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 10, f1: 0, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER"],
    estrelas: { duas: 8, tres: 6 },
    dica: "Girar não faz o robô sair do lugar: ele só muda para onde olha."
  },

  {
    id: 3,
    nome: "Dois alvos",
    conceito: "sequência",
    grade: [
      [1, 1, 1, 1],
      [0, 0, 0, 1],
      [1, 1, 1, 1],
      [0, 0, 0, 0]
    ],
    alvos: [{ x: 3, y: 0 }, { x: 0, y: 2 }],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 14, f1: 0, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER"],
    estrelas: { duas: 14, tres: 12 },
    dica: "Acenda o primeiro alvo antes de descer. Depois desça e volte pela fileira de baixo."
  },

  {
    id: 4,
    nome: "Degraus",
    conceito: "alturas",
    grade: [
      [1, 2, 3, 3],
      [0, 0, 0, 3],
      [0, 0, 0, 2],
      [0, 0, 0, 1]
    ],
    alvos: [{ x: 3, y: 3 }],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 10, f1: 0, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER"],
    estrelas: { duas: 10, tres: 8 },
    dica: "AVANÇAR só funciona entre casas da mesma altura. Para mudar de nível, use PULAR."
  },

  {
    id: 5,
    nome: "Não cabe tudo",
    conceito: "sub-rotina",
    grade: [
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ],
    alvos: [{ x: 2, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 }],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 4, f1: 4, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1"],
    estrelas: { duas: 8, tres: 6 },
    dica: "A área PRINCIPAL tem só 4 espaços. Guarde o trecho que se repete dentro de F1 e chame F1 várias vezes."
  },

  {
    id: 6,
    nome: "Dando a volta",
    conceito: "sub-rotina",
    grade: [
      [1, 1, 1, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1]
    ],
    alvos: [
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 3 },
      { x: 0, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 5, f1: 6, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1"],
    estrelas: { duas: 12, tres: 9 },
    dica: "Os quatro lados do quadrado são iguais: andar até o canto, acender e girar. Isso cabe em F1."
  },

  {
    id: 7,
    nome: "Escada diagonal",
    conceito: "reuso de sub-rotina",
    grade: [
      [1, 1, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 1]
    ],
    alvos: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
      { x: 5, y: 5 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 6, f1: 6, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1"],
    estrelas: { duas: 13, tres: 10 },
    dica: "Um degrau da escada é: avançar, virar, avançar, acender e virar de volta. Repita cinco vezes."
  },

  {
    id: 8,
    nome: "Volta com degraus",
    conceito: "reuso de sub-rotina",
    grade: [
      [1, 2, 1, 2, 1],
      [2, 0, 0, 0, 2],
      [1, 0, 0, 0, 1],
      [2, 0, 0, 0, 2],
      [1, 2, 1, 2, 1]
    ],
    alvos: [
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 0, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 5, f1: 7, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1"],
    estrelas: { duas: 13, tres: 10 },
    dica: "Todas as casas da borda alternam de altura, então todo passo aqui é um PULAR."
  },

  {
    id: 9,
    nome: "Sem fim",
    conceito: "laço (recursão)",
    grade: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    alvos: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
      { x: 7, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 4, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1"],
    estrelas: { duas: 6, tres: 4 },
    dica: "F1 pode chamar F1. Se o último comando de F1 for o próprio F1, ela se repete sozinha."
  },

  {
    id: 10,
    nome: "Girando para sempre",
    conceito: "laço (recursão)",
    grade: [
      [1, 1, 1, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1]
    ],
    alvos: [
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 3 },
      { x: 0, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 6, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1"],
    estrelas: { duas: 9, tres: 7 },
    dica: "É o mesmo quadrado da fase 6, mas agora F1 chama a si mesma no fim. A PRINCIPAL só dá a partida."
  },

  {
    id: 11,
    nome: "Duas ferramentas",
    conceito: "F1 e F2",
    grade: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    alvos: [
      { x: 2, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 },
      { x: 6, y: 2 }, { x: 6, y: 4 }, { x: 6, y: 6 },
      { x: 4, y: 6 }, { x: 2, y: 6 }, { x: 0, y: 6 },
      { x: 0, y: 4 }, { x: 0, y: 2 }, { x: 0, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 5, f1: 5, f2: 4 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 14, tres: 11 },
    dica: "F2 guarda o trecho menor (andar duas casas e acender). F1 usa F2 três vezes e vira a esquina."
  },

  {
    id: 12,
    nome: "Uma chama a outra",
    conceito: "F1 e F2",
    grade: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    alvos: [
      { x: 3, y: 0 }, { x: 6, y: 0 },
      { x: 6, y: 3 }, { x: 6, y: 6 },
      { x: 3, y: 6 }, { x: 0, y: 6 },
      { x: 0, y: 3 }, { x: 0, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 5, f2: 5 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 12, tres: 9 },
    dica: "Agora os alvos estão de três em três. Deixe F1 chamar F2 duas vezes, virar a esquina e chamar a si mesma."
  }
];
