import type { CSSProperties } from 'react';
import type { CoverLetter } from '../../types/resume';
import { designMetrics } from '../../utils/design';
import { TEMPLATES } from '../templates/templates';
import { RichText } from './sectionRenderers';

interface Props {
  letter: CoverLetter;
  mode?: 'screen' | 'print';
}

export default function CoverLetterDocument({ letter }: Props) {
  const metrics = designMetrics(letter.design);
  const template = TEMPLATES[letter.design.template];
  const fontPx = template.baseFont * letter.design.fontScale;
  const { width, height } = metrics.page;
  const margin = metrics.marginPx;
  const accent = letter.design.accent;

  const docStyle: CSSProperties = {
    fontFamily: metrics.fontFamily,
    fontSize: fontPx,
    lineHeight: metrics.lineHeight,
    color: '#1a1a1a',
    ['--accent' as string]: accent,
  };

  const line = (t: string, i: number) => <div key={i}>{t}</div>;

  return (
    <div style={docStyle}>
      <div className="flex flex-col items-center" style={{ gap: 24 }}>
        <div
          className="cv-page"
          style={{ width, minHeight: height, padding: margin, boxSizing: 'border-box' }}
        >
          <header style={{ borderBottom: `2px solid ${accent}`, paddingBottom: '0.6em', marginBottom: '1.4em' }}>
            <div style={{ fontSize: '1.7em', fontWeight: 700, color: '#161616' }}>
              {letter.senderName || 'Your Name'}
            </div>
            <div style={{ whiteSpace: 'pre-line', color: '#555', fontSize: '0.88em', marginTop: '0.3em' }}>
              {letter.senderDetails}
            </div>
          </header>

          {letter.date && <div style={{ color: '#555', marginBottom: '1.2em' }}>{letter.date}</div>}

          {(letter.recipientName || letter.recipientDetails) && (
            <div style={{ marginBottom: '1.2em' }}>
              {letter.recipientName && <div style={{ fontWeight: 600 }}>{letter.recipientName}</div>}
              <div style={{ whiteSpace: 'pre-line', color: '#444' }}>
                {letter.recipientDetails.split('\n').map(line)}
              </div>
            </div>
          )}

          {letter.subject && (
            <div style={{ fontWeight: 700, marginBottom: '1em', color: accent }}>{letter.subject}</div>
          )}

          <div className="cv-rich" style={{ textAlign: 'justify' }}>
            <RichText html={letter.body} />
          </div>
        </div>
      </div>
    </div>
  );
}
