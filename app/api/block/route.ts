import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { blockUser, getCompanionIdByClerkId } from '@/db/queries/companions';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companionId, blockedUserId, reason } = body;

    if (!companionId || !blockedUserId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the authenticated user is the companion trying to block
    const userCompanionId = await getCompanionIdByClerkId(userId);

    if (userCompanionId !== companionId) {
      return NextResponse.json(
        { message: 'Unauthorized to block users for this companion' },
        { status: 403 }
      );
    }

    // Block the user
    await blockUser(companionId, blockedUserId, reason);

    return NextResponse.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
