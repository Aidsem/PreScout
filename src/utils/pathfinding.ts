/**
 * A* pathfinding on a 2D grid.
 * `true` cells are blocked.
 */
export function findPath(
  grid: boolean[][],
  start: [number, number],
  end: [number, number],
  options?: { diagonal?: boolean }
): [number, number][] {
  const rows = grid.length;
  if (rows === 0 || grid[0].length === 0) {
    return [];
  }
  const cols = grid[0].length;
  const diagonal = options?.diagonal ?? false;

  const walkable = (row: number, col: number): boolean =>
    row >= 0 && row < rows && col >= 0 && col < cols && !grid[row][col];

  const resolvedStart = nearestWalkable(grid, start);
  const resolvedEnd = nearestWalkable(grid, end);
  if (!resolvedStart || !resolvedEnd) {
    return [];
  }

  const directions: [number, number, number][] = diagonal
    ? [
        [-1, 0, 1],
        [1, 0, 1],
        [0, -1, 1],
        [0, 1, 1],
        [-1, -1, 1.414],
        [-1, 1, 1.414],
        [1, -1, 1.414],
        [1, 1, 1.414],
      ]
    : [
        [-1, 0, 1],
        [1, 0, 1],
        [0, -1, 1],
        [0, 1, 1],
      ];

  const hash = ([r, c]: [number, number]) => `${r},${c}`;
  const openSet: { node: [number, number]; f: number }[] = [];
  const gScore: Record<string, number> = {};
  const cameFrom: Record<string, [number, number]> = {};

  const startHash = hash(resolvedStart);
  const endHash = hash(resolvedEnd);
  gScore[startHash] = 0;
  openSet.push({ node: resolvedStart, f: heuristic(resolvedStart, resolvedEnd) });

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentHash = hash(current.node);

    if (currentHash === endHash) {
      const path: [number, number][] = [];
      let cursor: [number, number] | undefined = current.node;
      while (cursor) {
        path.push(cursor);
        cursor = cameFrom[hash(cursor)];
      }
      path.reverse();
      return path;
    }

    for (const [dr, dc, cost] of directions) {
      const neighbor: [number, number] = [current.node[0] + dr, current.node[1] + dc];
      if (!walkable(neighbor[0], neighbor[1])) continue;

      const neighborHash = hash(neighbor);
      const tentativeG = (gScore[currentHash] ?? Infinity) + cost;
      if (tentativeG < (gScore[neighborHash] ?? Infinity)) {
        cameFrom[neighborHash] = current.node;
        gScore[neighborHash] = tentativeG;
        const f = tentativeG + heuristic(neighbor, resolvedEnd);
        if (!openSet.some((item) => hash(item.node) === neighborHash)) {
          openSet.push({ node: neighbor, f });
        }
      }
    }
  }

  return [];
}

export function nearestWalkable(
  grid: boolean[][],
  cell: [number, number]
): [number, number] | null {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return null;

  const [sr, sc] = cell;
  const clamped: [number, number] = [
    Math.max(0, Math.min(rows - 1, sr)),
    Math.max(0, Math.min(cols - 1, sc)),
  ];
  if (!grid[clamped[0]][clamped[1]]) return clamped;

  const maxR = Math.max(rows, cols);
  for (let radius = 1; radius < maxR; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
        const r = clamped[0] + dr;
        const c = clamped[1] + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols && !grid[r][c]) {
          return [r, c];
        }
      }
    }
  }
  return null;
}

function heuristic(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}
