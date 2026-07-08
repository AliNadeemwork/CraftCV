export interface Measured {
  height: number;
  keepWithNext?: boolean;
  spacingBefore?: number;
}

/**
 * Distribute measured blocks across pages of `pageHeight`, keeping
 * `keepWithNext` chains together (so a section heading never ends a page alone)
 * and never splitting an individual block. Returns arrays of block indices.
 */
export function paginate(blocks: Measured[], pageHeight: number): number[][] {
  const n = blocks.length;
  if (n === 0) return [[]];

  // Group keepWithNext chains into atomic units.
  const units: number[][] = [];
  let i = 0;
  while (i < n) {
    let j = i;
    while (blocks[j].keepWithNext && j + 1 < n) j++;
    units.push(range(i, j));
    i = j + 1;
  }

  const pages: number[][] = [];
  let cur: number[] = [];
  let curH = 0;

  for (const unit of units) {
    const leading = blocks[unit[0]].spacingBefore ?? 0;
    let internal = 0;
    unit.forEach((idx, k) => {
      internal += blocks[idx].height;
      if (k > 0) internal += blocks[idx].spacingBefore ?? 0;
    });

    const need = (cur.length === 0 ? 0 : leading) + internal;

    if (cur.length > 0 && curH + need > pageHeight) {
      pages.push(cur);
      cur = [];
      curH = 0;
    }
    // Place (possibly on a fresh page). Oversized units overflow their own page.
    const placeNeed = (cur.length === 0 ? 0 : leading) + internal;
    cur.push(...unit);
    curH += placeNeed;
  }
  if (cur.length) pages.push(cur);
  return pages.length ? pages : [[]];
}

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let k = a; k <= b; k++) out.push(k);
  return out;
}
