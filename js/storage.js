/*
 * storage.js — onde o progresso é guardado.
 *
 * Toda a Entrega 1 grava só no localStorage do navegador da máquina do aluno.
 * O resto do jogo NUNCA fala com localStorage diretamente: fala com este
 * objeto. É essa costura que permite, na Entrega 2, colocar a nuvem por baixo
 * (salvar local primeiro, tentar sincronizar depois) sem tocar em mais nada.
 *
 * O que guardamos, e só isso:
 *   nome         o apelido que o aluno digitou
 *   faseMaxima   maior fase liberada
 *   fases        { id: { estrelas, comandos } }
 *   ultimaSessao data ISO da última vez que jogou
 *
 * Nenhum e-mail, nenhum dado pessoal, nenhuma requisição de rede.
 */

const Storage = (function () {

  const CHAVE = "algobot.progresso.v1";

  function progressoVazio() {
    return {
      nome: "",
      faseMaxima: 1,
      fases: {},
      ultimaSessao: null
    };
  }

  function carregarProgresso() {
    try {
      const cru = window.localStorage.getItem(CHAVE);
      if (!cru) return progressoVazio();
      const dados = JSON.parse(cru);
      // Mistura com o padrão para o jogo não quebrar se um campo faltar
      // (por exemplo, um save antigo de uma versão anterior).
      return {
        nome: dados.nome || "",
        faseMaxima: dados.faseMaxima || 1,
        fases: dados.fases || {},
        ultimaSessao: dados.ultimaSessao || null
      };
    } catch (e) {
      // localStorage pode estar bloqueado (aba anônima, política do PC da
      // escola). O jogo continua funcionando, só não lembra do progresso.
      console.warn("Não foi possível ler o progresso salvo:", e);
      return progressoVazio();
    }
  }

  function salvarProgresso(progresso) {
    progresso.ultimaSessao = new Date().toISOString();
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(progresso));
      return true;
    } catch (e) {
      console.warn("Não foi possível salvar o progresso:", e);
      return false;
    }
  }

  /*
   * Registra o resultado de uma fase concluída.
   * Só melhora o registro: se o aluno refizer a fase com um resultado pior,
   * mantemos o melhor. Devolve o progresso atualizado.
   */
  function registrarConclusao(progresso, idFase, estrelas, comandos) {
    const anterior = progresso.fases[idFase];

    if (!anterior || estrelas > anterior.estrelas) {
      progresso.fases[idFase] = { estrelas: estrelas, comandos: comandos };
    } else if (estrelas === anterior.estrelas && comandos < anterior.comandos) {
      progresso.fases[idFase] = { estrelas: estrelas, comandos: comandos };
    }

    if (idFase + 1 > progresso.faseMaxima) {
      progresso.faseMaxima = idFase + 1;
    }

    salvarProgresso(progresso);
    return progresso;
  }

  function apagarTudo() {
    try {
      window.localStorage.removeItem(CHAVE);
    } catch (e) {
      console.warn("Não foi possível apagar o progresso:", e);
    }
  }

  return {
    carregarProgresso: carregarProgresso,
    salvarProgresso: salvarProgresso,
    registrarConclusao: registrarConclusao,
    apagarTudo: apagarTudo,
    progressoVazio: progressoVazio
  };
})();
