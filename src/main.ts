import type Phaser from "phaser";
import "./style.css";

const catalog = document.querySelector<HTMLElement>("#catalog");
const gameView = document.querySelector<HTMLElement>("#game-view");
const gameContainer = document.querySelector<HTMLElement>("#game-container");
const gameError = document.querySelector<HTMLElement>("#game-error");
const gameErrorMessage = document.querySelector<HTMLElement>("#game-error-message");
const retryGameButton = document.querySelector<HTMLButtonElement>("#retry-game");
const playButtons = document.querySelectorAll<HTMLButtonElement>("[data-game-id]");
const backButton = document.querySelector<HTMLButtonElement>("#back-to-catalog");
const gameTitle = document.querySelector<HTMLElement>("#game-header-title");
const gameHint = document.querySelector<HTMLElement>("#game-header-hint");

type GameId = "rastro-estelar" | "bosque-das-lanternas" | "salto-das-nuvens";
type GameEntry = {
  title: string;
  hint: string;
  modulePath: string;
  loadScene: () => Promise<Phaser.Types.Scenes.SceneType>;
};

const games: Record<GameId, GameEntry> = {
  "rastro-estelar": {
    title: "Rastro Estelar",
    hint: "WASD/setas para mover · Espaço para atirar",
    modulePath: "/src/game/rastro-estelar/",
    loadScene: async () =>
      (await import("./game/rastro-estelar/RastroEstelarScene")).RastroEstelarScene,
  },
  "bosque-das-lanternas": {
    title: "Bosque das Lanternas",
    hint: "WASD ou setas para explorar",
    modulePath: "/src/game/bosque-das-lanternas/ForestScene",
    loadScene: async () =>
      (await import("./game/bosque-das-lanternas/ForestScene")).ForestScene,
  },
  "salto-das-nuvens": {
    title: "Salto das Nuvens",
    hint: "A/D ou setas para mover, W, ↑ ou Espaço para pular",
    modulePath: "/src/game/platform/",
    loadScene: async () =>
      (await import("./game/platform/PlatformScene")).PlatformScene,
  },
};

const legacyGameIds: Record<string, GameId> = {
  "passeio-azul": "rastro-estelar",
};

if (
  !catalog ||
  !gameView ||
  !gameContainer ||
  !gameError ||
  !gameErrorMessage ||
  !retryGameButton ||
  !playButtons.length ||
  !backButton ||
  !gameTitle ||
  !gameHint
) {
  throw new Error("Não foi possível inicializar a navegação do catálogo.");
}

const catalogElement = catalog;
const gameViewElement = gameView;
const gameContainerElement = gameContainer;
const gameErrorElement = gameError;
const gameErrorMessageElement = gameErrorMessage;
const retryGameButtonElement = retryGameButton;
const backButtonElement = backButton;
const gameTitleElement = gameTitle;
const gameHintElement = gameHint;
let game: Phaser.Game | undefined;
let activeGameId: GameId | undefined;
let loadingGameId: GameId | undefined;
let loadGeneration = 0;

function isGameId(value: string): value is GameId {
  return value in games;
}

function getGameIdFromRoute(): GameId | undefined {
  const match = window.location.hash.match(/^#\/jogos\/([^/]+)$/);
  const routeId = match?.[1];

  if (!routeId) {
    return undefined;
  }
  if (isGameId(routeId)) {
    return routeId;
  }
  return legacyGameIds[routeId];
}

function getGameIdFromModulePath(modulePath: string): GameId | undefined {
  return (Object.entries(games) as [GameId, GameEntry][]).find(([, entry]) =>
    modulePath.includes(entry.modulePath),
  )?.[0];
}

function destroyActiveGame(): void {
  game?.destroy(true);
  game = undefined;
  activeGameId = undefined;
  gameContainerElement.querySelectorAll("canvas").forEach((canvas) => canvas.remove());
}

function showGameError(message: string): void {
  gameErrorMessageElement.textContent = message;
  gameErrorElement.hidden = false;
}

function clearGameError(): void {
  gameErrorElement.hidden = true;
  gameErrorMessageElement.textContent = "";
}

function reportGameRuntimeError(modulePath: string, message: string): void {
  const failedGameId = getGameIdFromModulePath(modulePath);
  if (!failedGameId || getGameIdFromRoute() !== failedGameId) {
    return;
  }

  loadGeneration += 1;
  loadingGameId = undefined;
  destroyActiveGame();
  showGameError(message);
}

function handleRuntimeError(event: ErrorEvent): void {
  const source = event.filename || event.error?.stack || "";
  reportGameRuntimeError(source, event.message);
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  const source = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
  reportGameRuntimeError(source, source);
}

async function loadGame(gameId: GameId, entry: GameEntry): Promise<void> {
  const generation = ++loadGeneration;
  loadingGameId = gameId;

  try {
    const [PhaserModule, gameConfig, scene] = await Promise.all([
      import("phaser"),
      import("./game/config"),
      entry.loadScene(),
    ]);
    if (generation !== loadGeneration || getGameIdFromRoute() !== gameId) {
      return;
    }

    game = new PhaserModule.default.Game({
      ...gameConfig.createGameConfig(scene),
      parent: gameContainerElement,
    });
    activeGameId = gameId;
  } catch (error) {
    console.error(`Não foi possível carregar ${entry.title}.`, error);
    if (generation === loadGeneration && getGameIdFromRoute() === gameId) {
      showGameError(
        error instanceof Error ? error.message : "Erro inesperado ao carregar o jogo.",
      );
    }
  } finally {
    if (generation === loadGeneration) {
      loadingGameId = undefined;
    }
  }
}

function renderRoute(): void {
  const gameId = getGameIdFromRoute();
  if (gameId && window.location.hash === "#/jogos/passeio-azul") {
    window.history.replaceState(window.history.state, "", `#/jogos/${gameId}`);
  }
  const selectedGame = gameId ? games[gameId] : undefined;

  catalogElement.hidden = Boolean(selectedGame);
  gameViewElement.hidden = !selectedGame;
  document.title = selectedGame
    ? `${selectedGame.title} — Jogos de Bolso`
    : "Jogos de Bolso — catálogo";

  if (selectedGame && gameId) {
    gameTitleElement.textContent = selectedGame.title;
    gameHintElement.textContent = selectedGame.hint;
    if (activeGameId === gameId && game) {
      return;
    }
    if (loadingGameId === gameId) {
      return;
    }

    destroyActiveGame();
    clearGameError();
    void loadGame(gameId, selectedGame);
    return;
  }

  loadGeneration += 1;
  loadingGameId = undefined;
  destroyActiveGame();
}

playButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const gameId = button.dataset.gameId;
    if (!gameId || !isGameId(gameId)) {
      return;
    }

    window.history.pushState({ route: "game" }, "", `#/jogos/${gameId}`);
    renderRoute();
  });
});

backButtonElement.addEventListener("click", () => {
  if (window.history.state?.route === "game") {
    window.history.back();
  } else {
    window.history.replaceState({ route: "catalog" }, "", "#/");
    renderRoute();
  }
  document.querySelector<HTMLButtonElement>("[data-game-id]")?.focus();
});

retryGameButtonElement.addEventListener("click", () => {
  loadingGameId = undefined;
  clearGameError();
  renderRoute();
});

window.addEventListener("hashchange", renderRoute);
window.addEventListener("error", handleRuntimeError);
window.addEventListener("unhandledrejection", handleUnhandledRejection);
renderRoute();

if (import.meta.hot) {
  import.meta.hot.on("vite:error", ({ err }) => {
    const failedGameId = getGameIdFromModulePath(err.id ?? err.loc?.file ?? "");
    if (failedGameId && getGameIdFromRoute() === failedGameId) {
      loadGeneration += 1;
      loadingGameId = undefined;
      destroyActiveGame();
      showGameError(err.message);
    }
  });

  import.meta.hot.on("vite:afterUpdate", ({ updates }) => {
    const currentGameId = getGameIdFromRoute();
    const updatedGameId = updates
      .map((update) =>
        getGameIdFromModulePath(`${update.path} ${update.acceptedPath}`),
      )
      .find((updatedId) => updatedId === currentGameId);
    if (!updatedGameId) {
      return;
    }

    window.location.reload();
  });

  import.meta.hot.dispose(() => {
    loadGeneration += 1;
    destroyActiveGame();
    window.removeEventListener("error", handleRuntimeError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  });
}
