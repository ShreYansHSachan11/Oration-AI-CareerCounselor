import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        theme: true,
        emailNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        theme: z.enum(['LIGHT', 'DARK']).optional(),
        emailNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.theme && { theme: input.theme }),
          ...(input.emailNotifications !== undefined && {
            emailNotifications: input.emailNotifications,
          }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          theme: true,
          emailNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),
});
