import { config } from 'dotenv';
import {
  createUserWithFirstSession,
  handleChatInteraction,
  getUserChatHistory,
  searchUserMessages,
  getUserDashboard,
  updateUserSettings,
} from '../src/lib/services/examples/usage-examples';

// Load environment variables
config({ path: '.env.local' });

async function testDatabaseServices() {
  console.log('🚀 Testing Database Services\n');

  try {
    // Test 1: Create a new user with first session
    console.log('1️⃣ Creating user with first session...');
    const timestamp = Date.now();
    const userResult = await createUserWithFirstSession(
      `test.user.${timestamp}@example.com`,
      `Test User ${timestamp}`
    );

    if (userResult) {
      console.log('✅ User created:', {
        id: userResult.user.id,
        email: userResult.user.email,
        name: userResult.user.name,
      });
      console.log('✅ First session created:', {
        id: userResult.session.id,
        title: userResult.session.title,
      });

      const userId = userResult.user.id;
      const sessionId = userResult.session.id;

      // Test 2: Handle chat interaction
      console.log('\n2️⃣ Adding chat messages...');
      const chatResult = await handleChatInteraction(
        userId,
        sessionId,
        'Hello! I need help with my career path.',
        "Hello! I'd be happy to help you with your career planning. What specific area would you like to focus on?"
      );

      if (chatResult) {
        console.log('✅ Chat interaction created:', {
          userMessage: chatResult.userMessage.content.substring(0, 50) + '...',
          aiMessage: chatResult.aiMessage.content.substring(0, 50) + '...',
        });
      }

      // Test 3: Add more messages
      await handleChatInteraction(
        userId,
        sessionId,
        "I'm interested in transitioning to tech from marketing.",
        "That's a great transition! Many marketing skills transfer well to tech roles like product management, developer relations, or UX. What aspects of tech interest you most?"
      );

      // Test 4: Get user chat history
      console.log('\n3️⃣ Getting user chat history...');
      const historyResult = await getUserChatHistory(userId);

      if (historyResult) {
        console.log('✅ Chat history retrieved:', {
          totalSessions: historyResult.items.length,
          firstSession: {
            title: historyResult.items[0]?.title,
            messageCount: historyResult.items[0]?._count.messages,
            recentMessages: historyResult.items[0]?.recentMessages?.length,
          },
        });
      }

      // Test 5: Search messages
      console.log('\n4️⃣ Searching messages...');
      const searchResult = await searchUserMessages(userId, 'career');

      if (searchResult) {
        console.log('✅ Search results:', {
          totalMatches: searchResult.items.length,
          firstMatch: searchResult.items[0]?.content.substring(0, 50) + '...',
        });
      }

      // Test 6: Get user dashboard
      console.log('\n5️⃣ Getting user dashboard...');
      const dashboardResult = await getUserDashboard(userId);

      if (dashboardResult) {
        console.log('✅ User dashboard:', {
          profile: {
            email: dashboardResult.profile?.email,
            sessionCount: dashboardResult.profile?._count.chatSessions,
          },
          activity: {
            totalMessages: dashboardResult.activity?.messageCount,
            memberSince: dashboardResult.activity?.memberSince.toDateString(),
          },
          recentSessions: dashboardResult.recentSessions?.length,
        });
      }

      // Test 7: Update user settings
      console.log('\n6️⃣ Updating user preferences...');
      const settingsResult = await updateUserSettings(userId, {
        theme: 'DARK',
        emailNotifications: false,
      });

      if (settingsResult) {
        console.log('✅ User settings updated:', {
          theme: settingsResult.theme,
          emailNotifications: settingsResult.emailNotifications,
        });
      }

      console.log('\n🎉 All database services tested successfully!');
      console.log(
        '\n📊 Check Prisma Studio at http://localhost:5555 to view the data'
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testDatabaseServices();
