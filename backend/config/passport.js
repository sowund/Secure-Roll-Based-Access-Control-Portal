const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      // Update last login
      user.lastLogin = new Date();
      user.loginCount += 1;
      await user.save();
      return done(null, user);
    }

    // Check if email already exists (local account)
    user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.authProvider = 'google';
      user.isEmailVerified = true;
      user.avatar = profile.photos[0]?.value || user.avatar;
      user.lastLogin = new Date();
      user.loginCount += 1;
      await user.save();
      return done(null, user);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails[0].value.toLowerCase(),
      name: profile.displayName,
      avatar: profile.photos[0]?.value || '',
      authProvider: 'google',
      isEmailVerified: true,
      role: 'viewer', // Default role for new Google users
      lastLogin: new Date(),
      loginCount: 1
    });

    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-jwt-secret-key'
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId);
    if (!user) return done(null, false);
    if (!user.isActive) return done(null, false, { message: 'Account is deactivated' });
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Session serialization
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