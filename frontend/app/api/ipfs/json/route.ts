import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 });
  }
  try {
    const body = await req.json();
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pinataContent: body })
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: 'Pinata JSON pin failed', detail: txt }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json({ cid: data.IpfsHash });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
