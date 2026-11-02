# Instruções do projeto

- Leia [project-memory.md](./project-memory.md) antes de alterar a arquitetura ou o fluxo do jogo.
- Use TypeScript estrito e siga a estrutura existente em `src/game`.
- Mantenha o catálogo como página inicial; jogos disponíveis devem ser iniciados a partir dele, e jogos futuros devem estar identificados como indisponíveis.
- Não adicione integração com modelos de IA ao runtime sem solicitação explícita.
- Para mudanças, execute `npm run typecheck` ou `npm run build`, conforme o escopo.
- Para cenas, controles, física, câmera ou recursos do Phaser, consulte a skill [phaser-game-development](./skills/phaser-game-development/SKILL.md).
