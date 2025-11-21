import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy (Email/Password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: 'Please use social login' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth2 Strategy - Temporarily disabled due to type conflicts
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID || '',
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
//       callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
//     },
//     async (_accessToken, _refreshToken, profile, done) => {
//       try {
//         const email = profile.emails?.[0]?.value;
//         
//         if (!email) {
//           return done(new Error('No email found in Google profile'));
//         }

//         let user = await prisma.user.findUnique({ where: { email } });

//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               email,
//               name: profile.displayName || 'Google User',
//               authProvider: 'google',
//               passwordHash: null,
//             },
//           });
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error as Error);
//       }
//     }
//   )
// );

// Facebook Strategy - Temporarily disabled due to type conflicts
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID || '',
//       clientSecret: process.env.FACEBOOK_APP_SECRET || '',
//       callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback',
//       profileFields: ['id', 'emails', 'name', 'displayName'],
//     },
//     async (_accessToken, _refreshToken, profile, done) => {
//       try {
//         const email = profile.emails?.[0]?.value;
//         
//         if (!email) {
//           return done(new Error('No email found in Facebook profile'));
//         }

//         let user = await prisma.user.findUnique({ where: { email } });

//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               email,
//               name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}` || 'Facebook User',
//               authProvider: 'facebook',
//               passwordHash: null,
//             },
//           });
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error as Error);
//       }
//     }
//   )
// );

export default passport;
