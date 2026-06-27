import {
  DECK_PASSES,
  GameMode,
  GameDifficultyKey,
  GameWorld,
  GRID_SIZE,
  HAND_SIZE,
  LineSummary,
  PlacementPreview,
  StackTile,
  StandardTileRank,
  TARGET_TOTAL,
  TileRank
} from "./types";

const STANDARD_RANKS: StandardTileRank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K"
];
const SPECIAL_TILES_PER_PASS = 2;
const DEFAULT_BLACKJACK_BONUS = 250;
const DEFAULT_BUST_PENALTY = 50;

export const SHOE_COUNT = DECK_PASSES * (STANDARD_RANKS.length * 4 + SPECIAL_TILES_PER_PASS);
export type WorldDifficultyConfig = {
  blackjackBonus?: number;
  bustPenalty?: number;
  difficulty?: GameDifficultyKey;
  mode?: GameMode;
  openingTiles?: number;
};

const QUAKE_START_INTERVAL_SECONDS = 60;
const QUAKE_INTERVAL_STEP_SECONDS = 5;
const QUAKE_MIN_INTERVAL_SECONDS = 5;
const QUAKE_HOLDING_LIMIT = 5;
const QUAKE_MAX_STACK_HEIGHT = 10;
const QUAKE_ANTE_POINTS = 50;
const QUAKE_SPAWN_BY_DIFFICULTY: Record<GameDifficultyKey, number> = {
  easy: 4,
  hard: 12,
  medium: 6
};

export function calculateMoveCost(_buyIn: number) {
  return 0;
}

export function calculateBlackjackBonus(
  _buyIn: number,
  fixedAmount = DEFAULT_BLACKJACK_BONUS
) {
  return fixedAmount;
}

export function calculateBustPenalty(
  _buyIn: number,
  fixedAmount = DEFAULT_BUST_PENALTY
) {
  return fixedAmount;
}

export function createWorld(
  buyIn: number,
  difficultyConfig: WorldDifficultyConfig = {},
  runId = Date.now()
): GameWorld {
  if (difficultyConfig.mode === "quake") {
    return createQuakeWorld(buyIn, difficultyConfig, runId);
  }

  const deck = buildDeck();
  const seededOpening = seedOpeningBoard(
    deck,
    createEmptyBoard(),
    difficultyConfig.openingTiles ?? 0
  );
  const blackjackBonus = calculateBlackjackBonus(
    buyIn,
    difficultyConfig.blackjackBonus ?? DEFAULT_BLACKJACK_BONUS
  );
  const bustPenalty = calculateBustPenalty(
    buyIn,
    difficultyConfig.bustPenalty ?? DEFAULT_BUST_PENALTY
  );
  const { deck: nextDeck, drawn } = drawTiles(seededOpening.deck, HAND_SIZE);
  const board = seededOpening.board;
  const rowLines = buildRowLines(board);
  const columnLines = buildColumnLines(board);

  return {
    blackjackBonus,
    bankroll: buyIn,
    board,
    buyIn,
    bustPenalty,
    columnLines,
    combo: 0,
    deck: nextDeck,
    difficulty: difficultyConfig.difficulty ?? "easy",
    event: "start",
    eventNonce: 1,
    lastPlacement: null,
    lineBurst: {
      columns: [],
      rows: []
    },
    linesCompleted: 0,
    message: "Place tiles, protect the bankroll, and chase 21s for fixed payouts.",
    mode: "classic",
    moveCost: calculateMoveCost(buyIn),
    payout: buyIn,
    queue: stabilizeQueueForBoard(drawn, board),
    result: null,
    rowLines,
    runId,
    score: 0,
    status: "playing",
    turns: 0
  };
}

function createQuakeWorld(
  buyIn: number,
  difficultyConfig: WorldDifficultyConfig = {},
  runId = Date.now()
): GameWorld {
  const deck = buildDeck();
  const { board, deck: nextDeck, stacks } = dealInitialQuakeStacks(deck, runId);
  const blackjackBonus = calculateBlackjackBonus(
    buyIn,
    difficultyConfig.blackjackBonus ?? DEFAULT_BLACKJACK_BONUS
  );
  const bustPenalty = calculateBustPenalty(
    buyIn,
    difficultyConfig.bustPenalty ?? DEFAULT_BUST_PENALTY
  );
  const rowLines = buildRowLines(board);
  const columnLines = buildColumnLines(board);

  return {
    blackjackBonus,
    bankroll: buyIn,
    board,
    buyIn,
    bustPenalty,
    columnLines,
    combo: 0,
    deck: nextDeck,
    difficulty: difficultyConfig.difficulty ?? "easy",
    event: "start",
    eventNonce: 1,
    lastPlacement: null,
    lineBurst: {
      columns: [],
      rows: []
    },
    linesCompleted: 0,
    message: "Quake: pick tiles into the tray until they total exactly 21.",
    mode: "quake",
    moveCost: calculateMoveCost(buyIn),
    payout: buyIn,
    quake: {
      holding: [],
      lastCleared: [],
      nextQuakeAt: runId + QUAKE_START_INTERVAL_SECONDS * 1000,
      quakeCount: 0,
      quakeIntervalSeconds: QUAKE_START_INTERVAL_SECONDS,
      selectedTotal: 0,
      stacks
    },
    queue: [],
    result: null,
    rowLines,
    runId,
    score: 0,
    status: "playing",
    turns: 0
  };
}

export function isWildTile(tile: StackTile | null | undefined) {
  return tile?.kind === "wild";
}

export function isSwapTile(tile: StackTile | null | undefined) {
  return tile?.kind === "swap";
}

export function canPlaceAt(world: GameWorld, row: number, col: number) {
  const leadTile = world.queue[0];

  return (
    world.status === "playing" &&
    world.bankroll >= world.moveCost &&
    row >= 0 &&
    row < GRID_SIZE &&
    col >= 0 &&
    col < GRID_SIZE &&
    !isCellLocked(world, row, col) &&
    !world.board[row][col] &&
    Boolean(leadTile) &&
    leadTile?.kind !== "swap"
  );
}

export function canSwapAt(world: GameWorld, row: number, col: number) {
  const leadTile = world.queue[0];

  return (
    world.status === "playing" &&
    world.bankroll >= world.moveCost &&
    row >= 0 &&
    row < GRID_SIZE &&
    col >= 0 &&
    col < GRID_SIZE &&
    !isCellLocked(world, row, col) &&
    Boolean(world.board[row][col]) &&
    leadTile?.kind === "swap"
  );
}

export function getPlayableCells(world: GameWorld) {
  const cells: Array<{ col: number; row: number }> = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (canSwapAt(world, row, col) || canPlaceAt(world, row, col)) {
        cells.push({ col, row });
      }
    }
  }

  return cells;
}

export function previewPlacement(
  world: GameWorld,
  row: number,
  col: number
): PlacementPreview | null {
  const nextTile = world.queue[0];

  if (!nextTile || nextTile.kind !== "standard" || !canPlaceAt(world, row, col)) {
    return null;
  }

  const board = cloneBoard(world.board);
  board[row][col] = nextTile;

  const rowLines = buildRowLines(board);
  const columnLines = buildColumnLines(board);
  const nextRow = rowLines[row];
  const nextColumn = columnLines[col];

  return {
    column: nextColumn,
    row: nextRow,
    wouldBust: nextRow.total > TARGET_TOTAL || nextColumn.total > TARGET_TOTAL,
    wouldLockColumns:
      nextColumn.total === TARGET_TOTAL && world.columnLines[col].total !== TARGET_TOTAL
        ? [col]
        : [],
    wouldLockRows:
      nextRow.total === TARGET_TOTAL && world.rowLines[row].total !== TARGET_TOTAL
        ? [row]
        : []
  };
}

export function createSelectedTile(baseTile: StackTile, rank: StandardTileRank) {
  return {
    id: `${baseTile.id}-${rank}-selected`,
    kind: "standard" as const,
    rank,
    value: getTileValue(rank)
  };
}

export function placeQueueTile(
  world: GameWorld,
  row: number,
  col: number,
  resolvedTile?: StackTile
): GameWorld {
  if (!canPlaceAt(world, row, col)) {
    return world;
  }

  const leadTile = world.queue[0];
  const nextTile =
    resolvedTile?.kind === "standard"
      ? resolvedTile
      : leadTile?.kind === "standard"
        ? leadTile
        : null;

  if (!nextTile) {
    return world;
  }

  const board = cloneBoard(world.board);
  board[row][col] = nextTile;
  return resolveTurn(world, board, row, col, nextTile, "place");
}

export function swapBoardTile(
  world: GameWorld,
  row: number,
  col: number,
  resolvedTile: StackTile
): GameWorld {
  if (!canSwapAt(world, row, col) || resolvedTile.kind !== "standard") {
    return world;
  }

  const board = cloneBoard(world.board);
  board[row][col] = resolvedTile;
  return resolveTurn(world, board, row, col, resolvedTile, "swap");
}

export function formatLineValue(line: LineSummary) {
  if (line.total === TARGET_TOTAL) {
    return "21";
  }

  return String(line.total);
}

export function getDeckCountLabel(world: GameWorld) {
  return world.deck.length + world.queue.length;
}

export function rankLabel(rank: TileRank) {
  return rank;
}

export function canSelectQuakeTile(world: GameWorld, row: number, col: number) {
  return (
    world.mode === "quake" &&
    world.status === "playing" &&
    row >= 0 &&
    row < GRID_SIZE &&
    col >= 0 &&
    col < GRID_SIZE &&
    Boolean(world.quake?.stacks[row]?.[col]?.length)
  );
}

export function selectQuakeTile(world: GameWorld, row: number, col: number): GameWorld {
  if (!canSelectQuakeTile(world, row, col) || !world.quake) {
    return world;
  }

  const stack = world.quake.stacks[row][col];
  const tile = stack[stack.length - 1];

  if (!tile) {
    return world;
  }

  const stacks = cloneQuakeStacks(world.quake.stacks);
  stacks[row][col] = stacks[row][col].slice(0, -1);
  const board = boardFromStacks(stacks);
  const holding = [...world.quake.holding, tile];
  const selectedTotal = evaluateHand(holding);
  const eventNonce = world.eventNonce + 1;
  const baseWorld: GameWorld = {
    ...world,
    board,
    columnLines: buildColumnLines(board),
    event: selectedTotal === TARGET_TOTAL ? "lock" : "place",
    eventNonce,
    lastPlacement: { col, row },
    lineBurst: { columns: [], rows: [] },
    message: `Holding total ${selectedTotal}.`,
    quake: {
      ...world.quake,
      holding,
      lastCleared: [],
      selectedTotal,
      stacks
    },
    rowLines: buildRowLines(board),
    turns: world.turns + 1
  };

  if (selectedTotal === TARGET_TOTAL) {
    const tileMultiplier = Math.min(Math.max(holding.length, 2), QUAKE_HOLDING_LIMIT);
    const reward = QUAKE_ANTE_POINTS * tileMultiplier;
    const clearedWorld: GameWorld = {
      ...baseWorld,
      combo: baseWorld.combo + 1,
      linesCompleted: baseWorld.linesCompleted + 1,
      message: `21 hit with ${holding.length} tiles. x${tileMultiplier} for +${reward}.`,
      quake: {
        ...baseWorld.quake!,
        holding: [],
        lastCleared: holding,
        selectedTotal: 0
      },
      score: baseWorld.score + reward
    };

    if (isQuakeBoardCleared(stacks)) {
      return finishQuakeWorld(
        {
          ...clearedWorld,
          message: "21 hit and the board is clear. You beat Quake."
        },
        "board-sealed"
      );
    }

    return clearedWorld;
  }

  if (selectedTotal > TARGET_TOTAL) {
    return finishQuakeWorld(
      {
        ...baseWorld,
        event: "bust",
        message: `Holding total ${selectedTotal}. Bust. Quake run over.`
      },
      "bust"
    );
  }

  if (holding.length >= QUAKE_HOLDING_LIMIT) {
    return finishQuakeWorld(
      {
        ...baseWorld,
        message: `Holding filled at ${selectedTotal}. Quake run over.`
      },
      "bust"
    );
  }

  if (isQuakeBoardCleared(stacks)) {
    return finishQuakeWorld(
      {
        ...baseWorld,
        message: "Board cleared. You beat Quake."
      },
      "board-sealed"
    );
  }

  return baseWorld;
}

export function triggerQuake(world: GameWorld, now = Date.now()): GameWorld {
  if (world.mode !== "quake" || world.status !== "playing" || !world.quake) {
    return world;
  }

  const quakeCount = world.quake.quakeCount + 1;
  const quakeIntervalSeconds = Math.max(
    QUAKE_MIN_INTERVAL_SECONDS,
    QUAKE_START_INTERVAL_SECONDS - quakeCount * QUAKE_INTERVAL_STEP_SECONDS
  );
  const { board, deck, spawned, stacks } = spawnQuakeTiles(
    world.quake.stacks,
    world.deck,
    now + quakeCount,
    world.difficulty
  );
  const maxStackHeight = getMaxQuakeStackHeight(stacks);

  const nextWorld: GameWorld = {
    ...world,
    board,
    columnLines: buildColumnLines(board),
    deck,
    event: "place",
    eventNonce: world.eventNonce + 1,
    lastPlacement: null,
    lineBurst: { columns: [], rows: [] },
    message: `Quake wave ${quakeCount}. ${spawned} new tiles rise from the board.`,
    quake: {
      ...world.quake,
      nextQuakeAt: now + quakeIntervalSeconds * 1000,
      quakeCount,
      quakeIntervalSeconds,
      stacks
    },
    rowLines: buildRowLines(board)
  };

  if (maxStackHeight >= QUAKE_MAX_STACK_HEIGHT) {
    return finishQuakeWorld(
      {
        ...nextWorld,
        message: `A stack reached ${QUAKE_MAX_STACK_HEIGHT} tiles. Quake run over.`
      },
      "bust"
    );
  }

  return nextWorld;
}

function resolveTurn(
  world: GameWorld,
  board: GameWorld["board"],
  row: number,
  col: number,
  tile: StackTile,
  action: "place" | "swap"
): GameWorld {
  const rowLines = buildRowLines(board, world.rowLines);
  const columnLines = buildColumnLines(board, world.columnLines);
  const hitRows = rowLines
    .filter((line) => line.total === TARGET_TOTAL && world.rowLines[line.index].total !== TARGET_TOTAL)
    .map((line) => line.index);
  const hitColumns = columnLines
    .filter(
      (line) =>
        line.total === TARGET_TOTAL && world.columnLines[line.index].total !== TARGET_TOTAL
    )
    .map((line) => line.index);
  const bustRows = rowLines
    .filter((line) => line.total > TARGET_TOTAL && world.rowLines[line.index].total <= TARGET_TOTAL)
    .map((line) => line.index);
  const bustColumns = columnLines
    .filter(
      (line) =>
        line.total > TARGET_TOTAL && world.columnLines[line.index].total <= TARGET_TOTAL
    )
    .map((line) => line.index);
  const blackjackCount = hitRows.length + hitColumns.length;
  const bustCount = bustRows.length + bustColumns.length;
  const blackjackBonus = world.blackjackBonus;
  const bustPenalty = world.bustPenalty;
  const reward = blackjackCount * blackjackBonus;
  const penalty = bustCount * bustPenalty;
  const bankroll = Math.max(0, world.bankroll - world.moveCost + reward - penalty);
  const nextCombo = blackjackCount ? world.combo + 1 : 0;
  const { deck, queue } = advanceQueue(world, board);
  const event = bustCount ? "bust" : blackjackCount ? "lock" : "place";
  const lineBurst = bustCount
    ? {
        columns: bustColumns,
        rows: bustRows
      }
    : {
        columns: hitColumns,
        rows: hitRows
      };
  const nextWorldBase: GameWorld = {
    ...world,
    bankroll,
    board,
    columnLines,
    combo: nextCombo,
    deck,
    event,
    eventNonce: world.eventNonce + 1,
    lastPlacement: { col, row },
    lineBurst,
    linesCompleted: world.linesCompleted + blackjackCount,
    message: formatTurnMessage(
      tile,
      action,
      row,
      col,
      bankroll,
      blackjackCount,
      bustCount,
      blackjackBonus,
      bustPenalty
    ),
    payout: bankroll,
    queue,
    result: null,
    rowLines,
    score: bankroll - world.buyIn,
    turns: world.turns + 1
  };

  if (bustCount > 0 || bankroll <= 0) {
    return finishWorld(nextWorldBase, "bust", bustRows[0], bustColumns[0]);
  }

  if (!nextWorldBase.queue.length) {
    return finishWorld(nextWorldBase, "board-sealed", bustRows[0], bustColumns[0]);
  }

  const playableCells = getPlayableCells(nextWorldBase);

  if (!playableCells.length) {
    return finishWorld(nextWorldBase, "board-sealed", bustRows[0], bustColumns[0]);
  }

  return nextWorldBase;
}

function finishWorld(
  world: GameWorld,
  reason: "board-sealed" | "bust",
  bustedRow?: number,
  bustedColumn?: number
): GameWorld {
  return {
    ...world,
    event: reason === "bust" ? "bust" : world.event === "place" ? "clear" : world.event,
    message:
      reason === "bust"
        ? "Bust. The run is over."
        : "Grid sealed. Bank the remaining bankroll.",
    payout: world.bankroll,
    result: {
      bankroll: world.bankroll,
      bustedColumn,
      bustedRow,
      linesCompleted: world.linesCompleted,
      payout: world.bankroll,
      placedTiles: world.turns,
      reason,
      runId: world.runId,
      score: world.score,
      turns: world.turns
    },
    status: reason === "bust" ? "bust" : "cleared"
  };
}

function finishQuakeWorld(
  world: GameWorld,
  reason: "board-sealed" | "bust"
): GameWorld {
  const placedTiles = world.quake?.holding.length ?? 0;

  return {
    ...world,
    event: reason === "bust" ? "bust" : "clear",
    eventNonce: world.eventNonce + 1,
    payout: world.bankroll,
    result: {
      bankroll: world.bankroll,
      linesCompleted: world.linesCompleted,
      payout: world.bankroll,
      placedTiles,
      reason,
      runId: world.runId,
      score: world.score,
      turns: world.turns
    },
    status: reason === "bust" ? "bust" : "cleared"
  };
}

function advanceQueue(world: GameWorld, board: GameWorld["board"]) {
  const remainingQueue = world.queue.slice(1);
  const { deck, drawn } = drawTiles(world.deck, HAND_SIZE - remainingQueue.length);
  const queue = stabilizeQueueForBoard([...remainingQueue, ...drawn], board);

  return {
    deck,
    queue
  };
}

function stabilizeQueueForBoard(queue: StackTile[], board: GameWorld["board"]) {
  if (hasPlacedTiles(board) || queue.length < 2 || queue[0]?.kind !== "swap") {
    return queue;
  }

  const nextLeadIndex = queue.findIndex((tile) => tile.kind !== "swap");

  if (nextLeadIndex <= 0) {
    return queue;
  }

  return [...queue.slice(nextLeadIndex), ...queue.slice(0, nextLeadIndex)];
}

function hasPlacedTiles(board: GameWorld["board"]) {
  return board.some((row) => row.some(Boolean));
}

function isCellLocked(world: GameWorld, row: number, col: number) {
  return world.rowLines[row]?.status === "locked" || world.columnLines[col]?.status === "locked";
}

function buildDeck() {
  const deck: StackTile[] = [];

  for (let pass = 0; pass < DECK_PASSES; pass += 1) {
    for (let suitCopy = 0; suitCopy < 4; suitCopy += 1) {
      for (const rank of STANDARD_RANKS) {
        deck.push({
          id: `${pass}-${suitCopy}-${rank}-${deck.length}`,
          kind: "standard",
          rank,
          value: getTileValue(rank)
        });
      }
    }

    deck.push({
      id: `wild-${pass}-${deck.length}`,
      kind: "wild",
      rank: "W",
      value: 0
    });
    deck.push({
      id: `swap-${pass}-${deck.length}`,
      kind: "swap",
      rank: "S",
      value: 0
    });
  }

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = deck[index];

    deck[index] = deck[swapIndex];
    deck[swapIndex] = current;
  }

  return deck;
}

function getTileValue(rank: StandardTileRank) {
  if (rank === "A") {
    return 1;
  }

  if (rank === "10" || rank === "J" || rank === "Q" || rank === "K") {
    return 10;
  }

  return Number(rank);
}

function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null as StackTile | null)
  );
}

function cloneBoard(board: GameWorld["board"]) {
  return board.map((row) => [...row]);
}

function seedOpeningBoard(deck: StackTile[], board: GameWorld["board"], count: number) {
  if (!count) {
    return {
      board,
      deck
    };
  }

  const nextBoard = cloneBoard(board);
  const nextDeck = [...deck];
  const openCells = shuffleCells(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
      col: index % GRID_SIZE,
      row: Math.floor(index / GRID_SIZE)
    }))
  );
  let placed = 0;

  while (placed < count && openCells.length) {
    const cellIndex = openCells.findIndex((cell) =>
      nextDeck.some(
        (tile) =>
          tile.kind === "standard" &&
          canSeedTileAt(nextBoard, cell.row, cell.col, tile)
      )
    );

    if (cellIndex < 0) {
      break;
    }

    const [cell] = openCells.splice(cellIndex, 1);
    const tileIndex = nextDeck.findIndex(
      (tile) =>
        tile.kind === "standard" &&
        canSeedTileAt(nextBoard, cell.row, cell.col, tile)
    );

    if (tileIndex < 0) {
      continue;
    }

    nextBoard[cell.row][cell.col] = {
      ...nextDeck[tileIndex],
      id: `${nextDeck[tileIndex].id}-seeded`,
      seeded: true
    };
    nextDeck.splice(tileIndex, 1);
    placed += 1;
  }

  return {
    board: nextBoard,
    deck: nextDeck
  };
}

function canSeedTileAt(
  board: GameWorld["board"],
  row: number,
  col: number,
  tile: StackTile
) {
  if (tile.kind !== "standard" || board[row][col]) {
    return false;
  }

  const candidateBoard = cloneBoard(board);
  candidateBoard[row][col] = tile;
  const nextRow = buildRowLines(candidateBoard)[row];
  const nextColumn = buildColumnLines(candidateBoard)[col];

  return nextRow.total < TARGET_TOTAL && nextColumn.total < TARGET_TOTAL;
}

function shuffleCells(cells: Array<{ col: number; row: number }>) {
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = cells[index];

    cells[index] = cells[swapIndex];
    cells[swapIndex] = current;
  }

  return cells;
}

function drawTiles(deck: StackTile[], count: number) {
  if (!count) {
    return {
      deck,
      drawn: [] as StackTile[]
    };
  }

  return {
    deck: deck.slice(count),
    drawn: deck.slice(0, count)
  };
}

function dealInitialQuakeStacks(deck: StackTile[], seed: number) {
  const nextDeck = deck.length >= GRID_SIZE * GRID_SIZE ? [...deck] : buildDeck();
  const stacks = createEmptyStacks();

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const { deck: next, tile } = drawStandardTile(nextDeck, seed, row, col, 0);
      nextDeck.splice(0, nextDeck.length, ...next);
      stacks[row][col] = [tile];
    }
  }

  return {
    board: boardFromStacks(stacks),
    deck: nextDeck,
    stacks
  };
}

function spawnQuakeTiles(
  stacks: StackTile[][][],
  deck: StackTile[],
  seed: number,
  difficulty: GameDifficultyKey
) {
  const nextDeck = deck.length >= GRID_SIZE * GRID_SIZE ? [...deck] : buildDeck();
  const nextStacks = cloneQuakeStacks(stacks);
  const spawnCount = QUAKE_SPAWN_BY_DIFFICULTY[difficulty] ?? QUAKE_SPAWN_BY_DIFFICULTY.easy;

  for (let index = 0; index < spawnCount; index += 1) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    const { deck: next, tile } = drawStandardTile(
      nextDeck,
      seed,
      row,
      col,
      nextStacks[row][col].length
    );

    nextDeck.splice(0, nextDeck.length, ...next);
    if (nextStacks[row][col].length) {
      nextStacks[row][col] = [tile, ...nextStacks[row][col]];
    } else {
      nextStacks[row][col] = [tile];
    }
  }

  return {
    board: boardFromStacks(nextStacks),
    deck: nextDeck,
    spawned: spawnCount,
    stacks: nextStacks
  };
}

function drawStandardTile(deck: StackTile[], seed: number, row: number, col: number, level: number) {
  const nextDeck = [...deck];
  let tile = nextDeck.shift();

  while (tile && tile.kind !== "standard") {
    tile = nextDeck.shift();
  }

  if (!tile) {
    const freshDeck = buildDeck().filter((candidate) => candidate.kind === "standard");
    tile = freshDeck[0];
    nextDeck.push(...freshDeck.slice(1));
  }

  return {
    deck: nextDeck,
    tile: {
      ...tile,
      id: `${tile.id}-quake-${seed}-${row}-${col}-${level}`,
      value: tile.rank === "A" ? 1 : tile.value
    }
  };
}

function createEmptyStacks() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => [] as StackTile[])
  );
}

function cloneQuakeStacks(stacks: StackTile[][][]) {
  return stacks.map((row) => row.map((stack) => [...stack]));
}

function boardFromStacks(stacks: StackTile[][][]) {
  return stacks.map((row) => row.map((stack) => stack[stack.length - 1] ?? null));
}

function isQuakeBoardCleared(stacks: StackTile[][][]) {
  return stacks.every((row) => row.every((stack) => stack.length === 0));
}

function getMaxQuakeStackHeight(stacks: StackTile[][][]) {
  return stacks.reduce(
    (maxRow, row) => Math.max(maxRow, ...row.map((stack) => stack.length)),
    0
  );
}

function buildRowLines(board: GameWorld["board"], previousLines?: LineSummary[]) {
  return board.map((cards, index) => createLineSummary(cards, index, previousLines?.[index]));
}

function buildColumnLines(board: GameWorld["board"], previousLines?: LineSummary[]) {
  return Array.from({ length: GRID_SIZE }, (_, index) =>
    createLineSummary(
      board.map((row) => row[index]),
      index,
      previousLines?.[index]
    )
  );
}

function createLineSummary(
  cards: Array<StackTile | null>,
  index: number,
  previousLine?: LineSummary
): LineSummary {
  const placedCards = cards.filter(Boolean) as StackTile[];
  const total = evaluateHand(placedCards);
  const locked = previousLine?.status === "locked" || total === TARGET_TOTAL;

  return {
    cards: placedCards,
    index,
    isSoft: hasSoftAce(placedCards),
    status: locked ? "locked" : "open",
    total
  };
}

function evaluateHand(cards: StackTile[]) {
  let total = cards.reduce((sum, tile) => sum + tile.value, 0);
  let aceCount = cards.filter((tile) => tile.rank === "A").length;

  while (aceCount > 0 && total + 10 <= TARGET_TOTAL) {
    total += 10;
    aceCount -= 1;
  }

  return total;
}

function hasSoftAce(cards: StackTile[]) {
  let total = cards.reduce((sum, tile) => sum + tile.value, 0);
  let aceCount = cards.filter((tile) => tile.rank === "A").length;

  while (aceCount > 0) {
    if (total + 10 <= TARGET_TOTAL) {
      return true;
    }

    aceCount -= 1;
  }

  return false;
}

function formatTurnMessage(
  tile: StackTile,
  action: "place" | "swap",
  row: number,
  col: number,
  bankroll: number,
  blackjackCount: number,
  bustCount: number,
  blackjackBonus: number,
  bustPenalty: number
) {
  const moveLabel = action === "swap" ? `Swap set to ${tile.rank}` : `${tile.rank} placed`;
  const resultParts = [`${moveLabel} at row ${row + 1}, column ${col + 1}.`, `Bank ${bankroll}.`];

  if (blackjackCount) {
    resultParts.unshift(`${blackjackCount} x 21 pays ${blackjackBonus} chips.`);
  }

  if (bustCount) {
    resultParts.unshift(`${bustCount} bust penalty ${bustPenalty} chips.`);
  }

  return resultParts.join(" ");
}
