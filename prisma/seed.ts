import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      theme: 'LIGHT',
      emailNotifications: true,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create sample chat sessions
  const chatSession1 = await prisma.chatSession.create({
    data: {
      title: 'Career Change Discussion',
      userId: testUser.id,
      messages: {
        create: [
          {
            content:
              "I'm thinking about changing careers from marketing to software development. What should I consider?",
            role: 'USER',
          },
          {
            content:
              "That's an exciting career transition! Here are some key factors to consider when moving from marketing to software development:\n\n1. **Skills Assessment**: Evaluate your current transferable skills like project management, communication, and analytical thinking.\n\n2. **Learning Path**: Consider bootcamps, online courses, or formal education to build technical skills.\n\n3. **Portfolio Development**: Start building projects to demonstrate your coding abilities.\n\n4. **Networking**: Connect with developers and attend tech meetups.\n\n5. **Financial Planning**: Plan for potential income changes during the transition.\n\nWhat specific aspect of software development interests you most?",
            role: 'ASSISTANT',
          },
        ],
      },
    },
  });

  const chatSession2 = await prisma.chatSession.create({
    data: {
      title: 'Interview Preparation',
      userId: testUser.id,
      messages: {
        create: [
          {
            content:
              'I have a job interview next week for a project manager position. Any tips?',
            role: 'USER',
          },
          {
            content:
              "Congratulations on landing the interview! Here are some essential tips for your project manager interview:\n\n**Preparation:**\n- Research the company's projects and methodologies\n- Review common PM frameworks (Agile, Scrum, Waterfall)\n- Prepare STAR method examples of your leadership experience\n\n**Key Topics to Cover:**\n- Conflict resolution scenarios\n- Budget and timeline management\n- Stakeholder communication strategies\n- Risk management approaches\n\n**Questions to Ask:**\n- What project management tools does the team use?\n- What are the biggest challenges facing current projects?\n- How does the company measure project success?\n\nWould you like me to help you practice answers to specific questions?",
            role: 'ASSISTANT',
          },
        ],
      },
    },
  });

  console.log('✅ Created sample chat sessions');
  console.log(`📊 Database seeded with:`);
  console.log(`   - 1 test user`);
  console.log(`   - 2 chat sessions`);
  console.log(`   - 4 messages`);
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
