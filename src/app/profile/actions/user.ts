'use server';

import { UserService } from '@/lib/userService';

export async function updateUserName(userId: string, name: string) {
  try {
    if (!name.trim()) {
      throw new Error('Name cannot be empty');
    }

    if (name.length > 50) {
      throw new Error('Name must be 50 characters or less');
    }

    const updatedUser = await UserService.updateUser(userId, { name: name.trim() });
    
    // Remove revalidatePath calls - session callback will handle fresh data
    
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error updating user name:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update name' 
    };
  }
}