import type { Resume } from '../types/resume';
import { uid } from './id';
import { nowIso } from './date';
import { defaultDesign } from './factories';

/**
 * A fully populated, deliberately long (~2 page) resume so new users see a
 * finished document immediately and pagination can be verified.
 */
export function sampleResume(): Resume {
  const iso = nowIso();
  return {
    id: uid('res'),
    name: 'Sample — Maya Okonkwo',
    personalInfo: {
      name: 'Maya Okonkwo',
      jobTitle: 'Senior Product Designer',
      email: 'maya.okonkwo@example.com',
      phone: '+1 (415) 555-0182',
      location: 'San Francisco, CA',
      website: 'mayaokonkwo.design',
      linkedin: 'linkedin.com/in/mayaokonkwo',
      links: [{ id: uid('l'), label: 'Dribbble', url: 'dribbble.com/mayao' }],
      photo: null,
    },
    design: { ...defaultDesign(), template: 'meridian', accent: '#3b6ea5' },
    meta: { createdAt: iso, updatedAt: iso, language: 'en' },
    sections: [
      {
        id: uid('sec'),
        kind: 'summary',
        title: 'Profile',
        visible: true,
        content:
          '<p>Product designer with <b>9+ years</b> shipping consumer and B2B software end to end. I pair rigorous user research with a strong systems mindset, and I care as much about the health of a design system as I do about the pixels on screen. Comfortable leading cross-functional teams and mentoring junior designers.</p>',
      },
      {
        id: uid('sec'),
        kind: 'experience',
        title: 'Professional Experience',
        visible: true,
        entries: [
          {
            id: uid('e'),
            title: 'Senior Product Designer',
            company: 'Northwind Labs',
            location: 'San Francisco, CA',
            date: { start: '2021-03', end: '', present: true },
            description:
              '<ul><li>Led the redesign of the core analytics dashboard, lifting weekly active use by <b>34%</b>.</li><li>Built and documented a 60-component design system now used by 4 product teams.</li><li>Ran a quarterly research cadence (interviews + usability tests) that reshaped the onboarding flow.</li><li>Mentored 3 designers; two were promoted within 18 months.</li></ul>',
          },
          {
            id: uid('e'),
            title: 'Product Designer',
            company: 'Cadence Health',
            location: 'Remote',
            date: { start: '2018-06', end: '2021-02', present: false },
            description:
              '<ul><li>Designed a HIPAA-compliant patient messaging experience across web and iOS.</li><li>Introduced an accessibility review step that took the flagship app to WCAG 2.1 AA.</li><li>Partnered with data science to visualise care-gap insights for clinicians.</li></ul>',
          },
          {
            id: uid('e'),
            title: 'UX Designer',
            company: 'BrightBox Studio',
            location: 'Austin, TX',
            date: { start: '2015-08', end: '2018-05', present: false },
            description:
              '<ul><li>Delivered end-to-end design for 12+ client projects across fintech and retail.</li><li>Established the studio’s first shared component library in Figma.</li></ul>',
          },
        ],
      },
      {
        id: uid('sec'),
        kind: 'experience',
        title: 'Selected Projects',
        visible: true,
        entries: [
          {
            id: uid('e'),
            title: 'Open Design Tokens',
            company: 'Personal / OSS',
            location: '',
            date: { start: '2022', end: '', present: true },
            description:
              '<p>An open-source starter kit for design tokens with 1.2k GitHub stars. Wrote the docs and maintain the contributor community.</p>',
          },
        ],
      },
      {
        id: uid('sec'),
        kind: 'education',
        title: 'Education',
        visible: true,
        entries: [
          {
            id: uid('e'),
            degree: 'B.F.A., Interaction Design',
            institution: 'Rhode Island School of Design',
            location: 'Providence, RI',
            date: { start: '2011', end: '2015', present: false },
            description:
              '<p>Graduated with honors. Thesis on tangible interfaces for museum wayfinding.</p>',
          },
        ],
      },
      {
        id: uid('sec'),
        kind: 'skills',
        title: 'Skills',
        visible: true,
        showLevels: true,
        entries: [
          { id: uid('e'), name: 'Figma', level: 5, group: 'Tools' },
          { id: uid('e'), name: 'Prototyping', level: 5, group: 'Tools' },
          { id: uid('e'), name: 'Design Systems', level: 4, group: 'Craft' },
          { id: uid('e'), name: 'User Research', level: 4, group: 'Craft' },
          { id: uid('e'), name: 'HTML / CSS', level: 3, group: 'Technical' },
          { id: uid('e'), name: 'Accessibility', level: 4, group: 'Craft' },
        ],
      },
      {
        id: uid('sec'),
        kind: 'languages',
        title: 'Languages',
        visible: true,
        entries: [
          { id: uid('e'), name: 'English', level: 'Native' },
          { id: uid('e'), name: 'Igbo', level: 'Fluent' },
          { id: uid('e'), name: 'French', level: 'Intermediate' },
        ],
      },
      {
        id: uid('sec'),
        kind: 'certificates',
        title: 'Certificates',
        visible: true,
        entries: [
          {
            id: uid('e'),
            name: 'Certified Professional in Accessibility Core Competencies',
            issuer: 'IAAP',
            date: '2022',
            link: '',
          },
        ],
      },
      {
        id: uid('sec'),
        kind: 'awards',
        title: 'Awards',
        visible: true,
        entries: [
          {
            id: uid('e'),
            title: 'Best in Class — CSS Design Awards',
            issuer: 'CSS Design Awards',
            date: '2020',
            description: 'For the Cadence Health patient portal.',
          },
        ],
      },
      {
        id: uid('sec'),
        kind: 'interests',
        title: 'Interests',
        visible: true,
        entries: [
          {
            id: uid('e'),
            title: 'Ceramics, trail running, generative art',
            description: '',
          },
        ],
      },
    ],
  };
}
