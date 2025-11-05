import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 });
  }
  try {
    const inForm = await req.formData();
    const file = inForm.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const f = new FormData();
    f.append('file', file, (file as any).name || 'upload');

    // optional: pinata metadata
    const meta = JSON.stringify({ name: (file as any).name || 'profile-picture' });
    f.append('pinataMetadata', meta);

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body: f,
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: 'Pinata upload failed', detail: txt }, { status: 500 });
    }
    const data = await res.json();
    // Pinata returns { IpfsHash, PinSize, Timestamp }
    return NextResponse.json({ cid: data.IpfsHash });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
