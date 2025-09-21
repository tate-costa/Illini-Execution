
import { put, head } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { USERS } from '@/lib/constants';
import type { UserData } from '@/lib/types';

const initialUserData: Omit<UserData, 'userName'> = { routines: {}, submissions: [] };

// GET /api/data/{userId}
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const blobName = `${userId}.json`;
  
  try {
    const blobInfo = await head(blobName);
    const response = await fetch(blobInfo.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch blob content. Status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    if (error.status === 404 || error.message.includes('404')) {
      // Blob not found, so create initial data for this user
      try {
        const userName = USERS.find(u => u.id === userId)?.name || 'Unknown User';
        const newUserData: UserData = { ...initialUserData, userName };
        
        await put(blobName, JSON.stringify(newUserData), {
          access: 'public',
          contentType: 'application/json',
        });
        
        // Return the newly created data
        return NextResponse.json(newUserData);
      } catch (creationError) {
        console.error("Failed to create initial user data blob:", creationError);
        return new NextResponse('Internal Server Error while creating data', { status: 500 });
      }
    }
    console.error("Error in GET /api/data/[userId]:", error);
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
    console.error("Error in POST /api/data/[userId]:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
