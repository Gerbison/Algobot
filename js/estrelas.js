/*
 * estrelas.js — pontuação e código de conclusão.
 *
 * Duas coisas moram aqui:
 *   1) quantas estrelas a solução do aluno vale;
 *   2) o código curto (ALG-XXXX-XXXX) que o aluno me entrega quando jogou
 *      sem internet.
 *
 * Sobre o código: ele carrega as ESTRELAS de cada fase, em ordem, e um
 * resumo (hash) do nome digitado. O nome NÃO volta a partir do código —
 * ele é curto demais para isso. O que o painel do professor consegue fazer
 * é conferir se um nome que ele já tem na lista bate com o código, o que
 * resolve o problema real: impedir que um aluno passe o código do colega.
 */

const Estrelas = (function () {

  /* Alfabeto base32 sem I, L, O e U — para o aluno não confundir 1/I, 0/O
   * ao ditar o código em voz alta ou escrever no papel. */
  const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  function calcular(fase, quantidadeComandos) {
    if (quantidadeComandos <= fase.estrelas.tres) return 3;
    if (quantidadeComandos <= fase.estrelas.duas) return 2;
    return 1;
  }

  /* Hash FNV-1a de 32 bits. Não é criptografia — é só para amarrar o código
   * ao nome. Determinístico e igual no jogo e no painel do professor. */
  function hashNome(nome) {
    const limpo = String(nome || "").trim().toUpperCase();
    let h = 0x811c9dc5;
    for (let i = 0; i < limpo.length; i++) {
      h = h ^ limpo.charCodeAt(i);
      // multiplicação por 16777619 em 32 bits, sem estourar o Number
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function bitsParaBase32(bits) {
    let saida = "";
    // completa a última fatia com zeros para fechar múltiplo de 5 bits
    while (bits.length % 5 !== 0) bits += "0";
    for (let i = 0; i < bits.length; i += 5) {
      saida += ALFABETO[parseInt(bits.slice(i, i + 5), 2)];
    }
    return saida;
  }

  function base32ParaBits(texto) {
    let bits = "";
    for (let i = 0; i < texto.length; i++) {
      const v = ALFABETO.indexOf(texto[i]);
      if (v < 0) return null;
      bits += v.toString(2).padStart(5, "0");
    }
    return bits;
  }

  /*
   * Monta o código. progresso.fases é { "1": {estrelas, comandos}, ... }.
   * Cada fase vira 2 bits (0 a 3 estrelas), na ordem de FASES.
   */
  function gerarCodigo(progresso, listaFases) {
    let bits = "";
    listaFases.forEach(function (f) {
      const registro = progresso.fases[f.id];
      const e = registro ? registro.estrelas : 0;
      bits += (e & 3).toString(2).padStart(2, "0");
    });

    const corpo = bitsParaBase32(bits);

    // 20 bits do hash do nome = 4 caracteres base32
    const assinatura = bitsParaBase32(
      (hashNome(progresso.nome) & 0xfffff).toString(2).padStart(20, "0")
    );

    return "ALG-" + corpo + "-" + assinatura;
  }

  /*
   * Lê um código. Devolve:
   *   { valido: true, estrelas: [3,2,0,...], assinatura: "XXXX" }
   *   { valido: false, motivo: "..." }
   *
   * Atenção: por causa do preenchimento com zeros, o código pode devolver
   * até duas fases a mais do que existiam quando foi gerado, sempre com
   * 0 estrelas. O painel do professor deve cortar a lista no total de fases
   * que ele conhece.
   */
  function decodificarCodigo(codigo) {
    const partes = String(codigo || "").trim().toUpperCase().split("-");
    if (partes.length !== 3 || partes[0] !== "ALG") {
      return { valido: false, motivo: "O código deve ter o formato ALG-XXXX-XXXX." };
    }

    const bits = base32ParaBits(partes[1]);
    if (bits === null) {
      return { valido: false, motivo: "O código tem letras que não existem no formato." };
    }

    const estrelas = [];
    for (let i = 0; i + 2 <= bits.length; i += 2) {
      estrelas.push(parseInt(bits.slice(i, i + 2), 2));
    }

    return { valido: true, estrelas: estrelas, assinatura: partes[2] };
  }

  /* Confere se o código foi gerado por alguém que digitou este nome. */
  function conferirNome(codigo, nome) {
    const lido = decodificarCodigo(codigo);
    if (!lido.valido) return false;
    const esperada = bitsParaBase32(
      (hashNome(nome) & 0xfffff).toString(2).padStart(20, "0")
    );
    return lido.assinatura === esperada;
  }

  return {
    calcular: calcular,
    gerarCodigo: gerarCodigo,
    decodificarCodigo: decodificarCodigo,
    conferirNome: conferirNome,
    hashNome: hashNome
  };
})();
