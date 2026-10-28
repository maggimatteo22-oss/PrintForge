import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fallbackHtml } from '@/lib/indexHtml';

export const dynamic = 'force-dynamic';

export async function GET() {
  let html = '';
  try {
    const filePath = path.join(process.cwd(), 'public', 'index.html');
    if (fs.existsSync(filePath)) {
      html = fs.readFileSync(filePath, 'utf-8');
    } else {
      html = fallbackHtml;
    }
  } catch (err) {
    console.error('Error reading public/index.html:', err);
    html = fallbackHtml;
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
