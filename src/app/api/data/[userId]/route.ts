
import { put, head } from '@vercel/blob';
import { NextResponse } from 'next/server';

// GET /api/data/{userId}
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const blobName = `${userId}.json`;
  
  try {
    const blobInfo = await head(blobName);
    
    // Vercel's Blob storage doesn't have a direct 'get' in the Node SDK yet for public URLs
    // We fetch from the public URL provided by `head`.
    const response = await fetch(blobInfo.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch blob content. Status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    if (error.status === 404) {
      return new NextResponse('User data not found', { status: 404 });
    }
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/data/{userId}
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const blobName = `${userId}.json`;
  const body = await request.json();

  try {
    const blob = await put(blobName, JSON.stringify(body), {
      access: 'public',
      contentType: 'application/json',
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
