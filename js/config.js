/*
 * config.js — constantes globais do jogo.
 *
 * Este e o unico arquivo que voce precisa abrir para trocar o nome do jogo,
 * as cores ou as velocidades de execucao.
 */

// Troque aqui para renomear o jogo em toda a interface.
const NOME_JOGO = "AlgoBot";
const VERSAO = "1.0";

// Quantas chamadas de sub-rotina podem ficar empilhadas ao mesmo tempo.
// Ao estourar esse limite assumimos que o aluno escreveu um laco infinito.
const LIMITE_PILHA = 200;

// Rede de seguranca extra: mesmo sem recursao, um programa pode rodar para
// sempre se o robo ficar andando em circulo. Cortamos a execucao aqui.
const MAX_PASSOS = 5000;

// Milissegundos por passo de execucao, por nivel de velocidade.
const VELOCIDADES = {
  lento: 700,
  normal: 320,
  rapido: 120
};

// Nomes bonitos dos comandos, usados nos botoes e nas mensagens.
const ROTULOS_COMANDO = {
  AVANCAR: "AVANÇAR",
  GIRAR_ESQ: "GIRAR ESQ",
  GIRAR_DIR: "GIRAR DIR",
  PULAR: "PULAR",
  ACENDER: "ACENDER",
  F1: "F1",
  F2: "F2"
};

// Simbolo desenhado dentro do botao de cada comando.
const ICONES_COMANDO = {
  AVANCAR: "↑",
  GIRAR_ESQ: "↺",
  GIRAR_DIR: "↻",
  PULAR: "⇧",
  ACENDER: "✹",
  F1: "F1",
  F2: "F2"
};

// Paleta do tabuleiro. Tudo e desenhado no Canvas com estas cores.
const CORES = {
  fundo: "#0f1622",
  topoNormal: "#3d5a80",
  topoNormalClaro: "#5b7fa8",
  faceEsquerda: "#25384f",
  faceDireita: "#1b2a3c",
  contorno: "#16202e",
  alvoApagado: "#8a6d2f",
  alvoApagadoTopo: "#c9a227",
  alvoAceso: "#ffd447",
  alvoAcesoBrilho: "#fff3b0",
  robo: "#e63946",
  roboEscuro: "#a52834",
  roboVisor: "#a8dadc"
};

// Deslocamento em pixels de cada casa na projecao isometrica.
const LARGURA_TILE = 56; // largura total do losango
const ALTURA_TILE = 28;  // altura total do losango (metade da largura = isometrico 2:1)
const ALTURA_NIVEL = 18; // quantos pixels cada nivel de altura sobe na tela

// As quatro direcoes, na ordem horaria. Girar a direita e andar +1 nesta lista.
const DIRECOES = ["NORTE", "LESTE", "SUL", "OESTE"];

// Quanto cada direcao soma em x e y na grade. y cresce para o SUL.
const VETOR_DIRECAO = {
  NORTE: { dx: 0, dy: -1 },
  LESTE: { dx: 1, dy: 0 },
  SUL: { dx: 0, dy: 1 },
  OESTE: { dx: -1, dy: 0 }
};
