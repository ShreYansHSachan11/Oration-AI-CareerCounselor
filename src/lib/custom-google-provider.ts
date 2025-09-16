import GoogleProvider from 'next-auth/providers/google';

export const customGoogleProvider = GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  httpOptions: {
    timeout: 20000, // 20 seconds timeout
  },
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code",
      scope: "openid email profile"
    }
  },
  // Custom profile handler with error handling
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
});