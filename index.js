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
const querystring = require('querystring');
const { saveNewUser } = require('./supabaseService');

// تحقق من وجود القيم الضرورية
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('يرجى ضبط GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET في ملف .env');
}

const app = express();
const PORT = process.env.PORT || 3000;

// نظام التسجيل (Logging)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5 * 1024 * 1024 }),
    new winston.transports.File({ filename: 'logs/combined.log', maxsize: 10 * 1024 * 1024 })
  ]
});

let userContent;

// الحماية
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
      connectSrc: ["'self'", "https://suhailsoft.com", "http://localhost:3000"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"]
    }
  }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    logger.warn(`تم تجاوز حد الطلبات من IP: ${req.ip}`);
    res.status(429).json({ error: 'لقد تجاوزت عدد الطلبات المسموح بها، يرجى المحاولة لاحقاً' });
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(flash());

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  name: 'secureSession',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.suhailsoft.com' : undefined
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const callbackURL = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL,
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.phonenumbers.read'],
  state: true,
  passReqToCallback: true,
  accessType: 'offline',
  prompt: 'consent'
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    if (!profile.emails?.[0]?.value) {
      throw new Error('البريد الإلكتروني مطلوب');
    }

    let phoneNumber = 'غير متوفر';
    try {
      const phoneResponse = await axios.get(
        'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (phoneResponse.data.phoneNumbers?.length > 0) {
        phoneNumber = phoneResponse.data.phoneNumbers[0].value;
      }
    } catch (phoneError) {
      logger.error(`خطأ في جلب رقم الهاتف: ${phoneError.message}`);
    }

    userContent = {
      username: profile.displayName || `user-${crypto.randomBytes(4).toString('hex')}`,
      email: profile.emails[0].value,
      password: profile.id,
      phoneNumber: phoneNumber,
      instantToken: crypto.randomBytes(32).toString('hex')
    };

    await saveNewUser(userContent);
    logger.info(`تم تسجيل مستخدم جديد: ${userContent.email}`);
    return done(null, userContent);
  } catch (error) {
    logger.error(`خطأ في حفظ المستخدم: ${error.message}`, {
      stack: error.stack,
      profileId: profile.id
    });
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    logger.warn(`محاولة وصول غير مصرح بها إلى /dashboard من IP: ${req.ip}`);
    req.flash('error', 'يجب تسجيل الدخول أولاً');
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'غير مصرح به' });
  res.json({
    name: req.user.username,
    email: req.user.email,
    phone: req.user.phoneNumber
  });
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.phonenumbers.read'],
    prompt: 'select_account',
    accessType: 'offline'
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureFlash: 'فشل تسجيل الدخول باستخدام جوجل'
  }),
  (req, res) => {
    logger.info(`تم تسجيل الدخول بنجاح للمستخدم: ${req.user?.email}`);
    res.redirect('/dashboard');
  }
);

app.post('/auth/google', (req, res) => {
  res.json(userContent);
});

app.get('/logout', (req, res) => {
  const userEmail = req.user?.email || 'غير معروف';
  req.logout((err) => {
    if (err) {
      logger.error(`خطأ في تسجيل الخروج: ${err.message}`, { stack: err.stack, userEmail });
      return res.redirect('/');
    }

    req.session.destroy((err) => {
      if (err) {
        logger.error(`خطأ في تدمير الجلسة: ${err.message}`, { stack: err.stack, userEmail });
      } else {
        logger.info(`تم تسجيل خروج المستخدم: ${userEmail}`);
      }
      res.clearCookie('secureSession');
      res.redirect('/');
    });
  });
});

app.get('/google74f1db194f961b81.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'google74f1db194f961b81.html'));
});

app.use((req, res, next) => {
  const error = new Error('الصفحة غير موجودة');
  error.status = 404;
  logger.warn(`404 - ${req.method} ${req.path}`);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  logger.error(`${statusCode} - ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'غير مسجل'
  });

  if (req.accepts('html')) {
    res.status(statusCode).sendFile(path.join(__dirname, 'public', statusCode === 404 ? '404.html' : '500.html'));
  } else {
    res.status(statusCode).json({
      error: statusCode === 500 ? 'خطأ في الخادم' : err.message,
      requestId: req.id
    });
  }
});


app.get('/api/redirect-uri', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const redirectUri = isProduction
      ? 'https://suhailsoft.com/auth/google/callback'
      : 'http://localhost:3000/auth/google/callback'; // تأكد من المنفذ

  res.json({ redirectUri });
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies.state;
  const codeVerifier = req.cookies.code_verifier;

  const isProduction = process.env.NODE_ENV === 'production';
  const redirectUri = isProduction
      ? 'https://www.suhailsoft.com/auth/google/callback'
      : 'http://localhost:3000/auth/google/callback'; // تأكد من المنفذ

  // تحقق من state لمنع CSRF
  if (state !== savedState) throw new Error('Invalid state');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    }),
  });
  const tokens = await tokenResponse.json();
  // tokens.access_token, tokens.refresh_token
});

process.on('uncaughtException', (error) => {
  logger.error(`خطأ غير معالج: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`وعد غير معالج: ${reason}`, { stack: reason.stack });
});

app.listen(PORT, () => {
  logger.info(`الخادم يعمل على البيئة ${process.env.NODE_ENV || 'development'}`);
  logger.info(`http://localhost:${PORT}`);
});
