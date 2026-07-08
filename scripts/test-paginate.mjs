// Minimal runtime check of the pagination algorithm (mirrors src/utils/paginate.ts).
function paginate(blocks, pageHeight) {
  const n = blocks.length;
  if (n === 0) return [[]];
  const units = [];
  let i = 0;
  while (i < n) {
    let j = i;
    while (blocks[j].keepWithNext && j + 1 < n) j++;
    const u = [];
    for (let k = i; k <= j; k++) u.push(k);
    units.push(u);
    i = j + 1;
  }
  const pages = [];
  let cur = [], curH = 0;
  for (const unit of units) {
    const leading = blocks[unit[0]].spacingBefore ?? 0;
    let internal = 0;
    unit.forEach((idx, k) => {
      internal += blocks[idx].height;
      if (k > 0) internal += blocks[idx].spacingBefore ?? 0;
    });
    const need = (cur.length === 0 ? 0 : leading) + internal;
    if (cur.length > 0 && curH + need > pageHeight) { pages.push(cur); cur = []; curH = 0; }
    cur.push(...unit);
    curH += (cur.length === unit.length ? internal : need);
  }
  if (cur.length) pages.push(cur);
  return pages;
}

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('FAIL:', name); } };

// 1. Everything fits on one page.
check('single page', paginate([{height:100},{height:100,spacingBefore:10}], 1000).length === 1);

// 2. Overflow splits into two pages.
const p2 = paginate([{height:600},{height:600,spacingBefore:20}], 1000);
check('two pages on overflow', p2.length === 2 && p2[0].length === 1 && p2[1].length === 1);

// 3. keepWithNext heading never ends a page alone.
const blocks = [
  { height: 700 },                              // 0 fills most of page
  { height: 40, keepWithNext: true, spacingBefore: 20 }, // 1 heading
  { height: 400, spacingBefore: 5 },            // 2 entry — won't fit with heading
];
const p3 = paginate(blocks, 1000);
// heading (1) must be on the same page as entry (2)
const pageOf = (idx) => p3.findIndex((pg) => pg.includes(idx));
check('heading stays with entry', pageOf(1) === pageOf(2));
check('heading pushed to page 2', pageOf(1) === 1);

// 4. Oversized single block gets its own page but does not crash.
const p4 = paginate([{height:200},{height:5000,spacingBefore:10}], 1000);
check('oversized block isolated', p4.length === 2);

console.log(`\npaginate tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
