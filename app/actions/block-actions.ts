'use server';

import { auth } from '@clerk/nextjs/server';
import {
  blockUser,
  unblockUser,
  getCompanionIdByClerkId,
  companionExists,
} from '@/db/queries/companions';
import { revalidatePath } from 'next/cache';

export async function blockUserAction(
  companionId: number,
  blockedUserId: string,
  reason?: string
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if companion exists
    const exists = await companionExists(companionId);
    if (!exists) {
      throw new Error('Companion not found');
    }

    // Verify that the authenticated user is the companion trying to block
    const userCompanionId = await getCompanionIdByClerkId(userId);

    if (userCompanionId !== companionId) {
      throw new Error('Unauthorized to block users for this companion');
    }

    // Prevent blocking yourself
    if (userId === blockedUserId) {
      throw new Error('You cannot block yourself');
    }

    await blockUser(companionId, blockedUserId, reason);
    revalidatePath('/block');

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function unblockUserAction(
  companionId: number,
  blockedUserId: string
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if companion exists
    const exists = await companionExists(companionId);
    if (!exists) {
      throw new Error('Companion not found');
    }

    // Verify that the authenticated user is the companion trying to unblock
    const userCompanionId = await getCompanionIdByClerkId(userId);

    if (userCompanionId !== companionId) {
      throw new Error('Unauthorized to unblock users for this companion');
    }

    await unblockUser(companionId, blockedUserId);
    revalidatePath('/block');

    return { success: true };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
