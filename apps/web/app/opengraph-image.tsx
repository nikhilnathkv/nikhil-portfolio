import { ImageResponse } from 'next/og';

import { SITE } from '@/lib/site';

// Site-wide default social preview. A deliberate, on-brand dark card.
export const alt = 'Nikhil Nath — AI/ML Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0a0b0d',
        color: '#e9ebee',
        padding: '80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 24,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: '#4cc2ff',
        }}
      >
        AI / ML Engineer
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 110, fontWeight: 600, lineHeight: 1.05 }}>{SITE.name}</div>
        <div style={{ marginTop: 24, fontSize: 34, color: '#9aa1ab' }}>
          GenAI · Agentic AI · ML Systems
        </div>
      </div>
    </div>,
    { ...size },
  );
}
