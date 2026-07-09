import { reconstructPage, type RawItem } from '../src/utils/import/reconstruct';
import { parseResume } from '../src/utils/import/resumeParser';

let pass = 0, fail = 0;
const check = (name: string, cond: boolean) => { if (cond) pass++; else { fail++; console.log('FAIL:', name); } };

// Synthetic page mimicking the "•-glyph-on-its-own-baseline + right-margin
// location" layout, with a company header and two roles + wrapped bullets.
const W = 595;
const it = (x: number, y: number, w: number, s: string): RawItem => ({ x, y, w, s });
const items: RawItem[] = [
  it(28, 563, 60, 'Shispare'),
  it(39, 546, 90, 'Project Manager'), it(503, 546, 55, 'May 25 – Jul 25'),
  it(57, 534, 0, '•'), it(57, 534, 300, 'Led cross-functional teams to deliver AI solutions,'), it(496, 534, 60, 'Karachi Pakistan'),
  it(57, 521, 320, 'including theft detection and production-ready chatbots.'),
  it(57, 508, 0, '•'), it(57, 508, 300, 'Owned end-to-end project execution across initiatives,'),
  it(57, 495, 280, 'aligning implementation with business objectives.'),
  it(39, 470, 120, 'Associate Project Manager'), it(505, 470, 55, 'Jul 24 – Apr 25'),
  it(57, 458, 0, '•'), it(57, 458, 300, 'Coordinated a 15+ member Scrum team,'), it(496, 458, 60, 'Karachi, Pakistan'),
  it(57, 445, 260, 'including chatbots and detection systems.'),
];

const outLines = reconstructPage(items, W);
const joined = outLines.join('\n');

check('wrapped bullet 1 joined', /Led cross-functional teams to deliver AI solutions, including theft detection and production-ready chatbots\./.test(joined));
check('wrapped bullet 2 joined', /Owned end-to-end project execution across initiatives, aligning implementation with business objectives\./.test(joined));
check('location captured as marker', /LOC:Karachi Pakistan/.test(joined));
check('company header preserved', outLines.some((l) => l === 'Shispare'));
check('title keeps date inline', outLines.some((l) => /Project Manager\s+May 25 – Jul 25/.test(l)));

// Full parse of the reconstructed text.
const r = parseResume('WORK EXPERIENCE\n' + joined);
const w = r.resume.sections.find((s) => s.kind === 'experience') as any;
check('two roles parsed', w && w.entries.length === 2);
check('role1 company carried', w && w.entries[0].company === 'Shispare' && w.entries[1].company === 'Shispare');
check('role1 location from margin', w && /Karachi/.test(w.entries[0].location));
check('role1 date 2-digit expanded', w && w.entries[0].date.start === '2025-05');
check('bullets survive parse', w && /theft detection/.test(w.entries[0].description));

// LOC markers must never appear in a non-entry section's content.
const r2 = parseResume('SKILLS\nPython, SQL\n' + 'LOC:Somewhere');
const sk = r2.resume.sections.find((s) => s.kind === 'skills') as any;
check('LOC not leaked into skills', sk && !sk.entries.some((e: any) => /LOC:/.test(e.name)));

console.log(`\nreconstruct tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
