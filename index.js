require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const flash = require('connect-flash');
const axios = require('axios');
const { saveNewUser } = require('./supabaseService');

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ 
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ) 
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error', 
      maxsize: 5 * 1024 * 1024 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log', 
      maxsize: 10 * 1024 * 1024 
    })
  ]
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://cdn.socket.io"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
      connectSrc: ["'self'", "https://www.suhailsoft.com", "http://localhost:3000", "https://oauth2.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://accounts.google.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Too many requests, please try again later' 
    });
  }
});

app.use(limiter);

// Static files and middleware
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'secureSession',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.suhailsoft.com' : undefined
  },
  store: process.env.NODE_ENV === 'production' ? 
    new (require('connect-pg-simple')(session))({
      conString: process.env.DATABASE_URL
    }) : undefined
};

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
const callbackURL = process.env.NODE_ENV === 'production' ?
  'https://www.suhailsoft.com/auth/google/callback' :
  'http://localhost:3000/auth/google/callback';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL,
  scope: ['profile', 'email'],
  state: true,
  passReqToCallback: true,
  accessType: 'offline',
  prompt: 'consent'
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    if (!profile.emails?.[0]?.value) {
      throw new Error('Email is required');
    }

    const userData = {
      username: profile.displayName || `user-${crypto.randomBytes(4).toString('hex')}`,
      email: profile.emails[0].value,
      googleId: profile.id,
      instantToken: crypto.randomBytes(32).toString('hex')
    };

    await saveNewUser(userData);
    logger.info(`New user registered: ${userData.email}`);
    return done(null, userData);
  } catch (error) {
    logger.error(`Error saving user: ${error.message}`, {
      stack: error.stack,
      profileId: profile.id
    });
    return done(error, null);
  }
}));

// Serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/user', ensureAuthenticated, (req, res) => {
  res.json({
    name: req.user.username,
    email: req.user.email,
    googleId: req.user.googleId
  });
});

// Auth routes
app.get('/auth/google',
  (req, res, next) => {
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(64).toString('hex');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Store code verifier in session
    req.session.codeVerifier = codeVerifier;
    
    // Add PKCE parameters to the authorization request
    req.session.state = crypto.randomBytes(32).toString('hex');
    
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      accessType: 'offline',
      state: req.session.state,
      codeChallengeMethod: 'S256',
      codeChallenge: codeChallenge
    })(req, res, next);
  }
);

app.get('/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      failureRedirect: '/login',
      failureFlash: 'Failed to authenticate with Google',
      session: true
    }, (err, user, info) => {
      if (err) {
        logger.error(`Authentication error: ${err.message}`);
        return next(err);
      }
      if (!user) {
        req.flash('error', info.message || 'Authentication failed');
        return res.redirect('/login');
      }
      
      req.logIn(user, (err) => {
        if (err) {
          logger.error(`Login error: ${err.message}`);
          return next(err);
        }
        logger.info(`User logged in: ${user.email}`);
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  }
);

app.get('/logout', (req, res) => {
  const userEmail = req.user?.email || 'unknown';
  req.logout((err) => {
    if (err) {
      logger.error(`Logout error: ${err.message}`, { stack: err.stack });
      return res.redirect('/');
    }
    
    req.session.destroy((err) => {
      if (err) {
        logger.error(`Session destruction error: ${err.message}`);
      }
      res.clearCookie('secureSession');
      logger.info(`User logged out: ${userEmail}`);
      res.redirect('/');
    });
  });
});

// Verification file for Google
app.get('/google74f1db194f961b81.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'google74f1db194f961b81.html'));
});

// API endpoint for frontend to get redirect URI
app.get('/api/redirect-uri', (req, res) => {
  res.json({ 
    redirectUri: callbackURL 
  });
});

// Serve PWA files
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'service-worker.js'));
});

// Serve Socket.IO client
app.get('/socket.io/socket.io.js', (req, res) => {
  res.redirect('https://cdn.socket.io/4.5.4/socket.io.min.js');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  logger.error(`${statusCode} - ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.email || 'guest'
  });

  if (req.accepts('html')) {
    res.status(statusCode).sendFile(path.join(__dirname, 'public', 'error.html'));
  } else {
    res.status(statusCode).json({
      error: statusCode === 500 ? 'Server error' : err.message,
      status: statusCode
    });
  }
});

// Helper middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  
  logger.warn(`Unauthorized access attempt to ${req.path} from IP: ${req.ip}`);
  req.flash('error', 'Please login first');
  res.redirect('/login');
}

// Process handlers
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}`, { reason: reason.stack });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`Listening on port ${PORT}`);
});