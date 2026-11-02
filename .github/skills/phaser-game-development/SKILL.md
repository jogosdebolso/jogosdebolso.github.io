---
name: phaser-game-development
description: "Use when building or changing this project's Phaser game: scenes, player controls, physics, cameras, game UI, assets, or gameplay. Follow the project architecture and verify TypeScript."
---

# Desenvolvimento de jogos com Phaser

Use este fluxo para implementar ou alterar funcionalidades de gameplay neste
projeto TypeScript com Phaser 3.

## Antes de alterar

1. Leia `../../project-memory.md` e inspecione a cena, configuração e tipos
   relacionados à funcionalidade.
2. Preserve o catálogo como entrada do site e mantenha o código de gameplay
   dentro de `src/game/`.
3. Prefira APIs e tipos Phaser existentes; não use `any` para contornar tipos.
4. Preserve a identidade de **Rastro Estelar** como jogo espacial de nave em
   visão traseira; obstáculos distantes devem surgir no horizonte e crescer ao
   se aproximar.
5. Ao alterar colisões, preserve o contador de três vidas, o feedback visual
   de impacto, o reinício com vidas restantes e a tela de game over; evite
   disparar o efeito mais de uma vez por colisão.

## Implementação

1. Coloque cenas simples em `src/game/scenes/`; jogos maiores ficam em uma
   pasta própria `src/game/<jogo>/` (cena, componentes, texturas e um JSON de
   fase/configuração, como em `src/game/platform/`). Registre a cena em
   `src/main.ts`/`src/game/config.ts` quando necessário.
2. Separe lógica de jogo da navegação do catálogo em `src/main.ts`.
3. Considere redimensionamento, limites da tela, limpeza de listeners/objetos e
   acessibilidade quando alterar controles ou interface.
4. Coloque imagens, áudio e outros arquivos estáticos em `public/`; não invente
   caminhos de recursos sem verificar que existem.
5. Não adicione serviços ou chamadas de IA ao runtime sem pedido explícito.

## Verificação

1. Execute `npm run typecheck` para mudanças isoladas de gameplay.
2. Execute `npm run build` para mudanças que afetam a integração ou a build.
3. Se a mudança alterar controles ou fluxo do jogo, descreva o caminho manual
   para testar no navegador.
