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

// --- Real-world structure: company header + multiple roles, 2-digit dates ---
const multi = `Ali Nadeem
work.alinadeem@gmail.com  +49 163 3776130  Koblenz, Germany

WORK EXPERIENCE
Shispare
Project Manager   May 25 – Jul 25
- Led cross-functional teams of developers and AI engineers.
- Owned end-to-end project execution.
Associate Project Manager   Jul 24 – Apr 25
- Coordinated a 15+ member Scrum team.
Apprentice Project Manager   Jan 24 – Jun 24
- Supported software and AI-related projects.
National University of Computer and Emerging Sciences
Teaching Assistant - Computer Networks   Jan 24 – May 24
- Assisted in mentoring 50+ students.
Teaching Assistant - Calculus and Analytical Geometry   Aug 23 – Dec 23
- Supported instruction in calculus.

EDUCATION
Masters in Web and Data Science   Oct 25 – Present
Universität Koblenz
- Relevant coursework: Machine Learning, Data Science.
Bachelors of Science in Computer Science   Aug 20 – May 24
National University of Computer and Emerging Sciences
- Relevant coursework: OOP, Data Structures.`;

const rm = parseResume(multi);
check('multi name', rm.resume.personalInfo.name === 'Ali Nadeem');
check('multi location', /Koblenz/.test(rm.resume.personalInfo.location));
const wexp = rm.resume.sections.find((s) => s.kind === 'experience') as any;
check('multi work section exists', !!wexp);
check('multi 5 role entries (not collapsed)', wexp && wexp.entries.length === 5);
check('multi role1 title', wexp && wexp.entries[0].title === 'Project Manager');
check('multi role1 company Shispare', wexp && wexp.entries[0].company === 'Shispare');
check('multi 2-digit start date', wexp && wexp.entries[0].date.start === '2025-05');
check('multi role2 carries Shispare', wexp && wexp.entries[1].company === 'Shispare');
check('multi role3 carries Shispare', wexp && wexp.entries[2].company === 'Shispare');
check('multi role4 company switches', wexp && /National University/.test(wexp.entries[3].company));
check('multi role5 carries National University', wexp && /National University/.test(wexp.entries[4].company));
check('multi role1 bullets kept', wexp && /Led cross-functional/.test(wexp.entries[0].description));
const medu = rm.resume.sections.find((s) => s.kind === 'education') as any;
check('multi education 2 entries', medu && medu.entries.length === 2);
check('multi edu1 degree', medu && /Masters in Web/.test(medu.entries[0].degree));
check('multi edu1 institution', medu && /Universität Koblenz/.test(medu.entries[0].institution));
check('multi edu1 present', medu && medu.entries[0].date.present === true);

console.log(`\nparser tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
