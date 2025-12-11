/**
 * THE RAIL EXCHANGE™ — Open Graph Image Generator
 * 
 * Generates the social sharing preview image dynamically.
 * Uses the hero background with headline and badge only.
 * No search bar or map button for clean mobile link preview.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'The Rail Exchange - #1 Rail Industry Marketplace';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.therailexchange.com/hero-rail.jpg"
          alt=""
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        
        {/* Dark Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.3))',
          }}
        />
        
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#0A1A2F',
              padding: '12px 24px',
              borderRadius: '50px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#FF6B35',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="white"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '0.5px',
              }}
            >
              #1 Rail Industry Marketplace
            </span>
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#FF6B35',
                borderRadius: '50%',
              }}
            />
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '24px',
              maxWidth: '900px',
              textAlign: 'center',
              width: '100%',
            }}
          >
            Buy, Sell & Connect in the{' '}
            <span style={{ color: '#FF6B35' }}>Rail Industry</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '700px',
              lineHeight: 1.5,
              textAlign: 'center',
              width: '100%',
            }}
          >
            The premium marketplace for rail equipment, materials, services, and
            verified contractors.
          </p>

          {/* Logo/Brand at bottom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '50px',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              The Rail
            </span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#FF6B35',
                marginLeft: '8px',
              }}
            >
              Exchange™
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
