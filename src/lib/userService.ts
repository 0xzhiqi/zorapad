import { prisma } from './prisma';

export class UserService {
  static async findOrCreateUser(walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();
    
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          name: `User ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
        }
      });
    }

    return user;
  }

  static async updateUser(id: string, data: Partial<{ name: string; email: string; image: string }>) {
    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });
  }

  static async getUserByWallet(walletAddress: string) {
    return await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    });
  }
}