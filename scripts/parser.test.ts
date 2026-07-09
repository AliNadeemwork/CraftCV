import { parseResume } from '../src/utils/import/resumeParser';

let pass = 0, fail = 0;
const check = (name: string, cond: boolean) => {
  if (cond) pass++;
  else { fail++; console.log('FAIL:', name); }
};

// --- English resume --------------------------------------------------------
const en = `Maya Okonkwo
Senior Product Designer
maya.okonkwo@example.com | +1 (415) 555-0182 | San Francisco, CA
linkedin.com/in/mayaokonkwo | mayaokonkwo.design

Profile
Product designer with 9+ years shipping consumer and B2B software end to end.

Professional Experience
Senior Product Designer — Northwind Labs
Mar 2021 - Present
- Led the redesign of the core analytics dashboard, lifting weekly active use by 34%.
- Built and documented a 60-component design system.
Product Designer — Cadence Health
Jun 2018 - Feb 2021
- Designed a HIPAA-compliant patient messaging experience.

Education
B.F.A., Interaction Design — Rhode Island School of Design
2011 - 2015

Skills
Figma, Prototyping, Design Systems, User Research, Accessibility

Languages
English (Native)
French (Intermediate)`;

const r1 = parseResume(en);
check('EN name', r1.resume.personalInfo.name === 'Maya Okonkwo');
check('EN jobTitle', r1.resume.personalInfo.jobTitle === 'Senior Product Designer');
check('EN email', r1.resume.personalInfo.email === 'maya.okonkwo@example.com');
check('EN phone present', /415/.test(r1.resume.personalInfo.phone));
check('EN linkedin', /mayaokonkwo/.test(r1.resume.personalInfo.linkedin));
const exp = r1.resume.sections.find((s) => s.kind === 'experience') as any;
check('EN experience section', !!exp);
check('EN experience 2 entries', exp && exp.entries.length === 2);
check('EN entry1 title', exp && exp.entries[0].title.includes('Senior Product Designer'));
check('EN entry1 company', exp && /Northwind/.test(exp.entries[0].company));
check('EN entry1 present', exp && exp.entries[0].date.present === true);
check('EN entry1 start', exp && exp.entries[0].date.start === '2021-03');
check('EN entry1 bullets', exp && /34%/.test(exp.entries[0].description));
const edu = r1.resume.sections.find((s) => s.kind === 'education') as any;
check('EN education entry', edu && edu.entries.length === 1 && /Rhode Island/.test(edu.entries[0].institution));
const skills = r1.resume.sections.find((s) => s.kind === 'skills') as any;
check('EN skills parsed', skills && skills.entries.length === 5);
const langs = r1.resume.sections.find((s) => s.kind === 'languages') as any;
check('EN languages', langs && langs.entries.length === 2 && langs.entries[0].level === 'Native');

// --- German resume ---------------------------------------------------------
const de = `Lukas Müller
Softwareentwickler
lukas.mueller@example.de | +49 151 2345678 | Berlin

Berufserfahrung
Senior Entwickler — TechWerk GmbH
Jan 2020 - heute
- Aufbau der Microservice-Architektur.
Werkstudent — DataHaus
2018 - 2019

Ausbildung
M.Sc. Informatik — TU Berlin
2016 - 2018

Kenntnisse
TypeScript, React, Node, Docker

Sprachen
Deutsch (Muttersprache)
Englisch (Fließend)`;

const r2 = parseResume(de);
check('DE name', r2.resume.personalInfo.name === 'Lukas Müller');
const deExp = r2.resume.sections.find((s) => s.kind === 'experience') as any;
check('DE Berufserfahrung → experience', !!deExp && deExp.entries.length === 2);
check('DE present (heute)', deExp && deExp.entries[0].date.present === true);
const deEdu = r2.resume.sections.find((s) => s.kind === 'education') as any;
check('DE Ausbildung → education', !!deEdu);
const deSkills = r2.resume.sections.find((s) => s.kind === 'skills') as any;
check('DE Kenntnisse → skills', deSkills && deSkills.entries.length === 4);
const deLang = r2.resume.sections.find((s) => s.kind === 'languages') as any;
check('DE Muttersprache → Native', deLang && deLang.entries[0].level === 'Native');

console.log(`\nparser tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
