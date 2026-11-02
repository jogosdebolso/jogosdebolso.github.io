# Jogos de Bolso

Base para desenvolver um jogo 2D com TypeScript, Phaser e Vite. A IA ajuda
durante o desenvolvimento; não há integração com modelos de IA no jogo.
Ao abrir o projeto, a página inicial apresenta o catálogo: um protótipo jogável
e uma lista de jogos futuros.

## Requisitos

- Node.js 20 ou superior
- npm

## Começar

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite e selecione **Jogar agora** no catálogo.
Na tela de início, selecione **Começar missão** ou pressione Enter/Espaço.
Pilote a nave por trás com **WASD** ou as **setas**, atravesse o campo de
asteroides que surgem no horizonte em várias direções e enfrente naves inimigas.
Segure **Espaço** para atirar: os disparos seguem pontos de fuga além da tela e
destroem inimigos e asteroides. Você tem três vidas; após perdê-las, use
**Jogar novamente** (ou Enter/Espaço) na tela de game over. Cada fase inclui
setores e ondas de inimigos próprios que culminam em um chefe; derrotá-lo libera
a próxima fase. A campanha percorre quatro ambientes: Cinturão de Órion,
Nebulosa Carmesim, Abismo de Titã e Coroa Solar. O botão **Catálogo** retorna à
página inicial.
O protótipo também pode ser aberto diretamente pela rota
`#/jogos/rastro-estelar`, que pode ser compartilhada ou recarregada.
Use **Galeria de naves** no catálogo ou abra `#/naves` para ver a Pulsar, nave
do jogador, e comparar os cinco modelos de inimigos: Cometa, Vanguarda, Vespa,
Espectro e Bastião. A seleção na galeria é apenas demonstrativa e não altera
as naves da partida.

## Comandos

```bash
npm run dev        # servidor de desenvolvimento
npm run typecheck  # verifica os tipos TypeScript
npm run build      # verifica os tipos e gera dist/
npm run preview    # visualiza a build localmente
```

## Estrutura

```text
src/
  game/
    config.ts
    rastro-estelar/
      RastroEstelarScene.ts
      game.json
      gameConfig.ts
      levelConfig.ts
      levels/
        level-1.json
        level-2.json
        level-3.json
        level-4.json
      constants.ts
      types.ts
      components/
        PlayerShip.ts
        ShipTextures.ts
        SpaceBackground.ts
    scenes/
  main.ts
  style.css
index.html
vite.config.ts
```

O jogo **Rastro Estelar** fica isolado em `src/game/rastro-estelar/`. Parâmetros
globais de jogador, trajetórias, armas e colisões estão em `game.json`;
`levels/level-N.json` contém cenário, formações iniciais, variantes e marcos,
ondas e chefe da fase. `levelConfig.ts` valida esses dados e `components/`
reúne os elementos visuais. Os demais jogos simples usam `src/game/scenes/`.
Coloque recursos estáticos, como imagens e áudio, em `public/`.

Cada jogo é importado somente quando sua rota é aberta. Isso mantém o catálogo
e os outros jogos isolados de falhas de compilação e atualizações HMR de uma
cena inativa; erros ao carregar ou atualizar o jogo ativo aparecem na própria
rota, com opção para tentar novamente.

## Assistente de IA

As personalizações compartilhadas do projeto ficam em `.github/`:

- `copilot-instructions.md`: regras permanentes para o assistente.
- `project-memory.md`: decisões e arquitetura resumidas, carregadas no início
  das sessões pelo hook em `.github/hooks/`.
- `skills/phaser-game-development/SKILL.md`: fluxo especializado para tarefas
  de gameplay com Phaser.
