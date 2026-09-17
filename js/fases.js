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
 *   nivel               "básico", "intermediário" ou "difícil" (aparece na tela)
 *   dica                texto mostrado quando o aluno pede uma dica
 *   dicas               (opcional, no lugar de "dica") lista de dicas em ordem,
 *                       da mais leve para a mais direta. O aluno vê uma de cada
 *                       vez e pede a próxima se precisar. Nunca entregue a
 *                       solução pronta na última.
 */

const FASES = [
  {
    id: 1,
    nome: "Primeiros passos",
    conceito: "sequência",
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
    nivel: "básico",
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
  },

  /* ======================================================================
   * INTERMEDIÁRIO (13 a 17)
   * Mesmos comandos, ideias novas: PULAR que desce, duas funções em
   * sequência, preparar antes de repetir, desvio e função dentro de função.
   * ==================================================================== */

  {
    id: 13,
    nome: "Sobe e desce",
    conceito: "laço com alturas",
    nivel: "intermediário",
    grade: [
      [1, 2, 0, 0],
      [0, 3, 4, 0],
      [0, 0, 3, 2],
      [0, 0, 0, 1]
    ],
    alvos: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 6, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1"],
    estrelas: { duas: 9, tres: 7 },
    dicas: [
      "Olhe só um degrau: de uma casa amarela até a próxima, o robô faz sempre os mesmos movimentos.",
      "O caminho sobe e depois desce. PULAR serve para os dois."
    ]
  },

  {
    id: 14,
    nome: "Duas etapas",
    conceito: "duas funções em sequência",
    nivel: "intermediário",
    grade: [
      [0, 0, 0, 0, 0, 0, 4],
      [0, 0, 0, 0, 0, 0, 3],
      [0, 0, 0, 0, 0, 0, 2],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    alvos: [
      { x: 2, y: 3 }, { x: 4, y: 3 }, { x: 6, y: 3 },
      { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 }
    ],
    robo: { x: 0, y: 3, direcao: "LESTE" },
    espacos: { principal: 7, f1: 4, f2: 4 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 14, tres: 12 },
    dicas: [
      "O caminho tem duas partes, cada uma com o seu próprio ritmo: uma no chão e uma na escada.",
      "Nada obriga uma função a chamar a outra. Cada parte pode ter a sua."
    ]
  },

  {
    id: 15,
    nome: "Preparar e repetir",
    conceito: "preparação antes do laço",
    nivel: "intermediário",
    grade: [
      [1, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0]
    ],
    alvos: [{ x: 2, y: 2 }, { x: 4, y: 2 }, { x: 6, y: 2 }],
    robo: { x: 0, y: 0, direcao: "SUL" },
    espacos: { principal: 4, f1: 4, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1"],
    estrelas: { duas: 10, tres: 8 },
    dicas: [
      "O robô começa longe da fileira amarela, e virado para o lado errado.",
      "A repetição só funciona com o robô no lugar certo. O que precisa acontecer antes dela?"
    ]
  },

  {
    id: 16,
    nome: "Desvio",
    conceito: "reuso com desvio",
    nivel: "intermediário",
    grade: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 3, 1, 3, 1, 3, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ],
    alvos: [{ x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }],
    robo: { x: 0, y: 1, direcao: "LESTE" },
    espacos: { principal: 3, f1: 10, f2: 0 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1"],
    estrelas: { duas: 13, tres: 11 },
    dicas: [
      "Os blocos altos são muros: o robô só sobe um nível por vez, então precisa dar a volta.",
      "Todos os desvios são iguais. Resolva o primeiro muro e veja onde o robô termina."
    ]
  },

  {
    id: 17,
    nome: "Zigue-zague",
    conceito: "função dentro de função",
    nivel: "intermediário",
    grade: [
      [1, 1, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 1, 1]
    ],
    alvos: [
      { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 4, y: 2 },
      { x: 4, y: 4 }, { x: 6, y: 4 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 5, f2: 5 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 11, tres: 9 },
    dicas: [
      "Todo trecho reto tem o mesmo tamanho e termina numa casa amarela. Só o giro muda de lado.",
      "Junte dois trechos seguidos, um virando para cada lado: isso se repete igualzinho."
    ]
  },

  /* ======================================================================
   * DIFÍCIL (18 a 22)
   * Poucos espaços, e a repetição fica escondida: é preciso enxergar o
   * padrão antes de programar. As dicas vão da mais leve para a mais direta.
   * ==================================================================== */

  {
    id: 18,
    nome: "Torre em espiral",
    conceito: "laço com alturas",
    nivel: "difícil",
    grade: [
      [1, 1, 1, 2],
      [4, 0, 0, 2],
      [4, 0, 0, 2],
      [4, 3, 3, 3]
    ],
    alvos: [
      { x: 3, y: 0 }, { x: 3, y: 3 },
      { x: 0, y: 3 }, { x: 0, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 6, f2: 3 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 9, tres: 7 },
    dicas: [
      "Os quatro lados parecem diferentes, mas o robô pode fazer exatamente a mesma coisa em todos.",
      "Repare no último degrau, lá do alto até o começo. PULAR também desce — de qualquer altura."
    ]
  },

  {
    id: 19,
    nome: "Picos e vales",
    conceito: "repetição dentro da repetição",
    nivel: "difícil",
    grade: [
      [1, 2, 3, 4, 3, 2, 1],
      [2, 0, 0, 0, 0, 0, 2],
      [3, 0, 0, 0, 0, 0, 3],
      [4, 0, 0, 0, 0, 0, 4],
      [3, 0, 0, 0, 0, 0, 3],
      [2, 0, 0, 0, 0, 0, 2],
      [1, 2, 3, 4, 3, 2, 1]
    ],
    alvos: [
      { x: 3, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 3 }, { x: 6, y: 6 },
      { x: 3, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 3 }, { x: 0, y: 0 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 4, f2: 4 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 11, tres: 9 },
    dicas: [
      "Com tão poucos espaços, vai ser preciso achar uma repetição dentro de outra repetição.",
      "Em cada lado há duas casas amarelas. O caminho até a primeira é diferente do caminho até a segunda?"
    ]
  },

  {
    id: 20,
    nome: "Pente",
    conceito: "ida e volta",
    nivel: "difícil",
    grade: [
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    alvos: [{ x: 1, y: 0 }, { x: 3, y: 0 }, { x: 5, y: 0 }],
    robo: { x: 0, y: 3, direcao: "LESTE" },
    espacos: { principal: 2, f1: 10, f2: 3 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 16, tres: 14 },
    dicas: [
      "Cada dente do pente é um beco sem saída: entrar, acender e sair pelo mesmo caminho.",
      "Para sair por onde entrou, o robô precisa ficar de costas.",
      "A entrada e a saída de um dente têm um pedaço igual."
    ]
  },

  {
    id: 21,
    nome: "Revezamento",
    conceito: "funções que se chamam",
    nivel: "difícil",
    grade: [
      [1, 1, 1, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 0, 0],
      [0, 0, 0, 0, 3, 3, 3],
      [0, 0, 0, 0, 0, 0, 4]
    ],
    alvos: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 4, y: 1 },
      { x: 4, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 3 }
    ],
    robo: { x: 0, y: 0, direcao: "LESTE" },
    espacos: { principal: 2, f1: 5, f2: 5 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 12, tres: 10 },
    dicas: [
      "O caminho alterna dois tipos de trecho: um no plano e outro com degrau.",
      "A repetição inteira não cabe numa função só. Mas uma função pode passar a vez para a outra."
    ]
  },

  {
    id: 22,
    nome: "Dois lados",
    conceito: "reuso inteligente",
    nivel: "difícil",
    grade: [
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0]
    ],
    alvos: [
      { x: 1, y: 0 }, { x: 1, y: 4 },
      { x: 3, y: 0 }, { x: 3, y: 4 },
      { x: 5, y: 0 }, { x: 5, y: 4 }
    ],
    robo: { x: 0, y: 2, direcao: "LESTE" },
    espacos: { principal: 2, f1: 7, f2: 7 },
    comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"],
    estrelas: { duas: 18, tres: 15 },
    dicas: [
      "Em cada cruzamento há um dente para cima e um para baixo.",
      "Quando o robô volta de um dente e chega ao cruzamento, para onde ele fica olhando?",
      "Se visitar um dente é igual dos dois lados, isso só precisa ser escrito uma vez."
    ]
  }
];
