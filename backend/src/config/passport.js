import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import User from '../models/User.js';

const configurePassport = () => {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL,
        scope: ['user.read'],
        tenant: process.env.MICROSOFT_TENANT_ID || 'common',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ microsoftId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Create new user if doesn't exist
          user = await User.create({
            microsoftId: profile.id,
            email: profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName,
            name: profile.displayName,
            avatar: null, // Microsoft doesn't provide avatar in basic scope
            role: 'developer', // Default role
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
