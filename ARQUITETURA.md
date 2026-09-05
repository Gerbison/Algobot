# AlgoBot — Arquitetura (Entrega 1)

Este documento explica **o que foi construído e por quê**. Se você voltar aqui
daqui a seis meses, comece por ele.

## O que é

Um jogo de lógica de programação do gênero "robô em grade": o aluno monta uma
fila de comandos, aperta *Executar*, e o robô percorre um tabuleiro isométrico
tentando acender todas as casas-alvo. O objetivo pedagógico é fazer o aluno
descobrir sozinho **sub-rotina** e **reuso de código** — não porque alguém
explicou, mas porque a fase não cabe na área PRINCIPAL.

Obra original inspirada no gênero. Nenhuma arte, som, nome ou fase de jogo
existente foi usada; todo o visual é desenhado por código no Canvas.

## Restrições que moldaram tudo

- **Abre com duplo clique** (`file://`), sem servidor. Por isso: nenhum
  `import`/`export`, nenhum `fetch()`, nenhum `npm`. Só `<script src>` clássico
  e dados embutidos em objetos JavaScript.
- **Sem build step e sem framework.** HTML, CSS e JS puro.
- **Zero rede.** Nenhuma requisição externa, nenhum rastreamento, nenhuma
  propaganda. O jogo funciona com o cabo de rede arrancado.
- **PC de escola.** 1366x768, mouse ruim. Daí os slots e botões grandes e o
  fato de *clicar* funcionar tão bem quanto *arrastar*.

## Os arquivos

```
index.html          estrutura da tela e a ordem dos <script>
css/estilo.css      todo o visual da interface (o tabuleiro é Canvas, não CSS)
js/config.js        constantes: nome do jogo, cores, velocidades, limites
js/fases.js         as 12 fases  ← é aqui que o professor mexe
js/motor.js         as regras do jogo (mover, girar, pular, acender)
js/interpretador.js decide qual comando vem a seguir; pilha de chamadas F1/F2
js/estrelas.js      pontuação e código de conclusão
js/codigo.js        traduz a solução para TypeScript e comenta o que o aluno fez
js/storage.js       fachada de persistência (hoje só localStorage)
js/render.js        desenho isométrico no Canvas
js/ui.js            a cola: DOM, arrastar/clicar, execução animada, janelas
test/solucoes.test.js  regressão das fases, roda no Node sem navegador
```

A ordem dos `<script>` em `index.html` importa: `config.js` primeiro (todo mundo
usa suas constantes), `ui.js` por último.

## Como os dados fluem

```
clique ou arraste do aluno
        ↓
programa = { principal: [...], f1: [...], f2: [...] }     (ui.js)
        ↓
Interpretador.proximaInstrucao()  → "o próximo é AVANÇAR, slot 3 da F1"
        ↓
Motor.aplicar(estado, comando)    → muda estado.robo / estado.acesos
        ↓
Render.desenhar(estado, visual)   → pinta o Canvas (60 fps, requestAnimationFrame)
        ↓
Motor.venceu(estado) === true
        ↓
Estrelas.calcular()  →  Storage.registrarConclusao()  →  localStorage
```

Cada camada só conhece a de baixo. `motor.js` não sabe que existe tela;
`render.js` não sabe que existe aluno; `interpretador.js` não sabe o que
os comandos fazem. Isso é o que torna o teste em Node possível: ele
importa motor + interpretador e joga as fases sem navegador nenhum.

## As três decisões que valem explicação

### 1. A pilha de chamadas é feita à mão

`F1` e `F2` podem chamar a si mesmas. Se o interpretador usasse recursão de
verdade do JavaScript, um laço infinito do aluno estouraria a pilha do
navegador e travaria a aba — na frente da turma.

Então `interpretador.js` mantém a pilha num array comum:

```javascript
pilha = [ { area: "principal", indice: 4 }, { area: "f1", indice: 2 } ]
```

Quando ela passa de `LIMITE_PILHA` (200), a execução para com a mensagem
"O robô se perdeu em um laço infinito". Existe ainda um segundo freio,
`MAX_PASSOS` (5000), para o caso de o robô andar em círculo sem recursão.

**Não há eliminação de chamada de cauda de propósito.** Ela deixaria o laço
recursivo rodar para sempre sem nunca estourar a pilha — e aí o freio de
segurança não freia nada. O preço é que uma solução recursiva legítima gasta um
nível de pilha por repetição; com limite 200 sobra folga de sobra para as fases
que existem.

### 2. A vitória interrompe o programa

Assim que o último alvo acende, a fase termina — o robô não precisa chegar ao
fim da lista de comandos. Isso não é um detalhe: nas fases 9, 10 e 12 a `F1`
chama a si mesma e o programa **nunca terminaria sozinho**. É a vitória que
serve de condição de parada do laço, e é exatamente essa a ideia que se quer
ensinar ali.

### 3. Projeção isométrica

A conversão está comentada em `render.js`, mas o resumo é:

```
telaX = (x - y) * (LARGURA_TILE / 2)
telaY = (x + y) * (ALTURA_TILE / 2) - altura * ALTURA_NIVEL
```

A ordem de desenho é o pulo do gato: a profundidade é `x + y`, e um laço com
`y` por fora e `x` por dentro já pinta de trás para frente. O robô é desenhado
**no meio** do laço, quando se chega à casa dele — não no fim — para que uma
casa alta na frente realmente o esconda.

O enquadramento (`Render.enquadrar`) mede o tabuleiro inteiro e calcula
deslocamento e escala para ele caber no canvas. Por isso uma fase 8x8 e uma 4x4
aparecem ambas centralizadas e do tamanho certo, sem número mágico nenhum.

### 3b. Girar a câmera

O aluno pode girar o tabuleiro (botões ↺ ↻ ou teclas Q e E) para ver o que uma
casa alta está escondendo. Em vez de escrever quatro projeções, giramos as
**coordenadas** em torno do centro do tabuleiro e aplicamos sempre a mesma
projeção:

```
p' = centro + R(θ) · (p - centro)
```

Duas consequências de fazer assim: θ pode ser um valor qualquer, então o giro
fica animado só interpolando θ; e, como o giro é em torno do centro, o
tabuleiro nunca escapa da tela.

Isso obrigou a mudar a ordem de desenho. Com as coordenadas giradas, a
profundidade `x + y` não segue mais a ordem das linhas da matriz, então o
laço aninhado deixou de bastar: agora montamos a lista de tudo que vai ser
desenhado (casas **e** o robô) e ordenamos por profundidade a cada quadro.
São no máximo 64 casas; ordenar isso 60 vezes por segundo não custa nada, e é
muito mais fácil de conferir do que deduzir o laço certo para cada ângulo.

`Render.enquadrar` mede a **união das quatro orientações**, não só a atual. Se
medisse só a atual, um tabuleiro não quadrado (a fase 9 é 8x4) mudaria de
escala no meio do giro e a imagem ficaria "respirando".

**A câmera é puramente visual.** O motor continua raciocinando em NORTE/SUL/
LESTE/OESTE do tabuleiro; nenhum comando muda de efeito porque a vista girou.
O visor do robô gira junto com a câmera — o vetor da direção é girado pelo
mesmo θ antes de ser projetado —, então o que o aluno vê continua batendo com
o que vai acontecer.

### 4. A revisão em TypeScript

Ao vencer, `codigo.js` traduz a solução do aluno para TypeScript e escreve uma
frase sobre o que ele fez. A análise é deliberadamente rasa — quatro casos, na
ordem em que são testados:

1. **alguma sub-rotina chama a si mesma** → é recursão; a alternativa mostra o
   mesmo laço escrito com `while`;
2. **a PRINCIPAL é um bloco repetido do início ao fim** → vira um `for`. Se o
   bloco repetido já for uma chamada de sub-rotina, só falta o laço; se o aluno
   repetiu os comandos na mão, a sugestão extrai uma função **e** usa o laço;
3. **usou sub-rotina, sem repetição exata** → explica o que é uma função, sem
   sugerir alternativa;
4. **sequência direta** → diz que não há o que encurtar.

Duas decisões que valem registrar:

- **Só a repetição que cobre a lista inteira conta** (`Codigo.repeticao`).
  Repetição parcial existiria em quase todo programa e a sugestão viraria
  ruído. Melhor não sugerir nada do que sugerir algo confuso.
- **A alternativa fala de como escrever, nunca de qual é a resposta.** A graça
  do jogo é o aluno achar o caminho; o que este arquivo ensina é a forma de
  expressar o caminho em código. Se algum dia alguém quiser mostrar a solução
  ótima aqui, saiba que isso mata o valor pedagógico das fases 5 e 6.

`codigo.js` não conhece o motor nem o DOM: recebe o programa, devolve texto.
Por isso os quatro casos são testados no Node, sem navegador. O realce de
sintaxe (que é HTML) mora em `ui.js`, junto com o escape — o gerador continua
produzindo texto puro.

## O código de conclusão

Formato: `ALG-XXXXX-XXXX`.

- O **primeiro bloco** carrega as estrelas de cada fase, 2 bits por fase, em
  base32.
- O **segundo bloco** é um resumo (hash FNV-1a) do nome digitado.

O alfabeto base32 não tem `I`, `L`, `O` nem `U`, para o aluno não confundir
`1`/`I` e `0`/`O` ao ditar o código em voz alta.

**O nome não volta a partir do código** — ele é curto demais para isso. O que o
painel do professor consegue fazer é *conferir* se um nome que ele já tem na
lista de chamada bate com o código, o que resolve o problema real: impedir que
um aluno entregue o código do colega. A função `Estrelas.conferirNome()` já
está pronta para a Entrega 3.

**Pegadinha conhecida:** o preenchimento com zeros no fim pode fazer o código
devolver até duas fases a mais do que existiam, sempre com 0 estrelas. O painel
do professor precisa cortar a lista no total de fases que ele conhece.

## Onde isso pode te morder depois

- **`Storage` é a única costura para a Entrega 2.** Se algum código novo chamar
  `localStorage` diretamente, a sincronização com a nuvem vai ter que ser
  reescrita em vários lugares. Mantenha tudo passando por `storage.js`.
- **Estrela conta comandos escritos, não executados.** Uma fase pode ser
  vencida com 4 comandos que rodam 200 vezes. É de propósito — é o que premia
  o reuso —, mas não confunda com "eficiência de execução" ao explicar em aula.
- **`fase.espacos` é o que força o aprendizado.** Se você aumentar a PRINCIPAL
  das fases 5 e 6 "para o aluno não sofrer", elas deixam de ensinar sub-rotina,
  porque a solução em linha reta volta a caber.
- **Os limites de estrela são conferidos pelo teste.** `test/solucoes.test.js`
  guarda a solução pretendida de cada fase e falha se ela não valer 3 estrelas.
  Se você mudar um tabuleiro sem mudar a solução do teste, o teste acusa.
- **Nomes de identificadores em português com acento** existem em textos, mas
  não em nomes de variáveis. Evite criar novos com acento: alguns editores e
  ferramentas antigas ainda tropeçam.

## O que ficou de fora, de propósito

- **Som.** Nada de áudio na Entrega 1 — laboratório de escola com 30 máquinas
  tocando bipe é insuportável.
- **Desfazer/refazer.** O aluno limpa e refaz; a fila é curta.
- **Reordenar comandos arrastando de um slot para outro.** Hoje se arrasta da
  paleta para o slot, e clique remove. Reordenação interna adicionaria uma
  camada de estado de arraste que não paga o custo agora.
- **Editor de fases na tela.** Fase nova se cria editando `fases.js`. Ver
  `MANUAL.md`.
- **Qualquer coisa de rede.** Login, nuvem e painel do professor são as
  Entregas 2 e 3.

## Testes

```bash
node test/solucoes.test.js
```

Para cada uma das 12 fases o teste confere que a solução pretendida (a) cabe
nos espaços oferecidos, (b) só usa comandos que estão na paleta daquela fase,
(c) realmente vence quando executada no motor de verdade e (d) vale as três
estrelas. Também testa ida e volta do código de conclusão e a detecção de laço
infinito.

Rode isso **sempre** depois de mexer em `fases.js`. É o que impede uma fase
impossível de chegar na frente da turma.
