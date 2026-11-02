# Instruções para agentes

## Projeto

- **Jogos de Bolso** é um catálogo de jogos 2D feito com Vite, TypeScript
  estrito e Phaser 3. O jogo de nave disponível é **Rastro Estelar**.
- O catálogo é a tela de entrada. Mantenha a navegação do catálogo em
  `src/main.ts` e a lógica do jogo em `src/game/`.
- Não introduza IA, credenciais, serviços externos ou chamadas de modelo no
  runtime sem um pedido explícito.

## Fonte de contexto compartilhada com o Copilot

Os recursos em `.github/` são a fonte canônica de regras e memória do projeto
e devem ser reutilizados, não copiados:

- Leia `.github/project-memory.md` antes de mudanças de arquitetura, fluxo ou
  gameplay. Atualize-o quando uma decisão durável mudar; não crie uma memória
  paralela para o Codex.
- Siga `.github/copilot-instructions.md` como regras complementares deste
  repositório.
- Para cenas, controles, física, câmera, interface, recursos ou gameplay do
  Phaser, leia e aplique `.github/skills/phaser-game-development/SKILL.md`.
  Esta é a skill compartilhada do projeto; sua localização sob `.github/` é
  intencional para que Copilot e Codex usem o mesmo procedimento.
- O hook `.github/hooks/inject-project-memory.mjs` é específico do Copilot;
  para o Codex, este `AGENTS.md` garante a leitura explícita da mesma memória.

## Convenções de alteração

- Preserve TypeScript estrito; não use `any` para contornar a tipagem.
- Confirme que recursos estáticos existem antes de referenciá-los e mantenha-os
  em `public/`.
- Preserve a identidade visual e de gameplay de Rastro Estelar, incluindo os
  asteroides em perspectiva, feedback de colisão e reinício automático.
- Não altere arquivos do Copilot apenas para adaptá-los ao Codex. Mudanças
  nesses arquivos só devem ocorrer quando a regra, memória ou skill compartilhada
  realmente precisar evoluir.

## Verificação

- Execute `npm run typecheck` para mudanças isoladas de TypeScript/gameplay.
- Execute `npm run build` para alterações de integração, configuração ou build.
- Para alterações de controles ou fluxo, descreva também um caminho curto de
  teste manual no navegador.
