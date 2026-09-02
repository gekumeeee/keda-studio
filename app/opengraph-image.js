import { ImageResponse } from 'next/og';
import { promises as fs } from 'fs';
import path from 'path';
import { SITE_DESCRIPTION } from '@/lib/site';

// The card that shows when kedaagency.com is pasted into WhatsApp, LinkedIn,
// Facebook, Slack or X. Without one, a shared link renders as bare text —
// which for a design studio is the worst possible first impression, and
// WhatsApp is how most of this audience passes a link around.
//
// Generated rather than a checked-in PNG so it stays in step with the brand
// (colours come from the same palette as globals.css) and there's no binary
// to re-export by hand. Next caches the result, so it isn't re-rendered per
// request.

export const alt = 'KEDA — Brand & Creative Agency, Cairo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same accents the brand blocks use, in the same order as the marquee.
const ACCENTS = ['#E5195E', '#2547F0', '#F26722', '#22C7A9', '#C7F04A'];

export default async function OpengraphImage() {
  // Satori (what ImageResponse renders with) needs real font data — it has
  // no system fonts to fall back on. These same files already ship for the
  // PDF export, so this adds no new asset.
  //
  // Cairo rather than Bricolage Grotesque, which is the display face
  // everywhere else: the Bricolage files here are VARIABLE fonts, and
  // Satori can't parse those — it fails with a bare "Cannot read properties
  // of undefined (reading '256')" from inside its font parser. Cairo is
  // static, is the project's other brand font (it sets all the Arabic type),
  // and covers both scripts, so the card stays on-brand.
  const [bold, extraBold] = await Promise.all([
    fs.readFile(path.join(process.cwd(), 'public/fonts/Cairo-Bold.ttf')),
    fs.readFile(path.join(process.cwd(), 'public/fonts/Cairo-ExtraBold.ttf')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0D0D0D',
          padding: '72px 80px',
          fontFamily: 'Cairo',
        }}
      >
        <div style={{ display: 'flex' }}>
          {ACCENTS.map((color) => (
            <div
              key={color}
              style={{
                width: 56,
                height: 12,
                background: color,
                marginRight: 10,
                borderRadius: 999,
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: '#F2EFE6',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Brands that feel</span>
            <span style={{ color: '#C7F04A' }}>distinct.</span>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 26,
              fontWeight: 700,
              color: 'rgba(242,239,230,0.66)',
              maxWidth: 760,
              lineHeight: 1.4,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            fontWeight: 700,
            color: '#F2EFE6',
          }}
        >
          <span style={{ letterSpacing: '0.18em' }}>KEDA AGENCY</span>
          <span style={{ color: 'rgba(242,239,230,0.55)' }}>kedaagency.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Cairo', data: bold, weight: 700, style: 'normal' },
        { name: 'Cairo', data: extraBold, weight: 800, style: 'normal' },
      ],
    }
  );
}
