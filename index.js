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
const { saveNewUser } = require('./supabaseService');

// =============================================
//  إعداد نظام التسجيل (Logging)
// =============================================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
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
      maxsize: 5 * 1024 * 1024 // 5MB
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024 // 10MB
    })
  ]
});

// =============================================
//  تهيئة التطبيق والإعدادات الأساسية
// =============================================
const app = express();
const PORT = process.env.PORT || 3001;

// إعدادات الأمان
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
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  }
}));

// تحديد معدل الطلبات
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    logger.warn(`تم تجاوز حد الطلبات من IP: ${req.ip}`);
    res.status(429).json({
      error: 'لقد تجاوزت عدد الطلبات المسموح بها، يرجى المحاولة لاحقاً'
    });
  }
});
app.use(limiter);

// =============================================
//  إعدادات الجلسة والمسار
// =============================================
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
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

// =============================================
//  إعداد Passport و Google OAuth
// =============================================
app.use(passport.initialize());
app.use(passport.session());

const callbackURL = process.env.NODE_ENV === 'production'
  ? 'https://suhailsoft.com/api/auth/callback/google'
  : 'http://localhost:3000/api/auth/callback/google';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL,
  scope: ['profile', 'email'],
  state: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const userContent = {
      username: profile.displayName,
      email: profile.emails?.[0]?.value,
      googleId: profile.id,
      phoneNumber: '',
      instantToken: crypto.randomBytes(32).toString('hex')
    };
    
   // await saveNewUser(userContent);
    logger.info(`تم تسجيل مستخدم جديد: ${userContent.email}`);
    return done(null, profile);
  } catch (error) {
    logger.error(`خطأ في حفظ المستخدم: ${error.message}`, {
      stack: error.stack,
      profileId: profile.id
    });
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// =============================================
//  مسارات التطبيق (Routes)
// =============================================
app.use((req, res, next) => {
  req.id = uuidv4();
  logger.http(`طلب ${req.method} ${req.path}`, {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureFlash: true 
  }),
  (req, res) => {
    logger.info(`تم تسجيل الدخول بنجاح للمستخدم: ${req.user?.emails?.[0]?.value}`);
    res.redirect('/dashboard.html');
  }
);


app.get('/api/auth/callback/google',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureFlash: true 
  }),
  (req, res) => {
    logger.info(`تم تسجيل الدخول بنجاح للمستخدم: ${req.user?.emails?.[0]?.value}`);
    res.redirect('/dashboard.html');
  }
);

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    logger.warn(`محاولة وصول غير مصرح بها إلى /dashboard من IP: ${req.ip}`);
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/logout', (req, res) => {
  const userEmail = req.user?.emails?.[0]?.value || 'غير معروف';
  
  req.logout((err) => {
    if (err) {
      logger.error(`خطأ في تسجيل الخروج: ${err.message}`, {
        stack: err.stack,
        userEmail: userEmail
      });
      return res.redirect('/');
    }
    
    req.session.destroy((err) => {
      if (err) {
        logger.error(`خطأ في تدمير الجلسة: ${err.message}`, {
          stack: err.stack,
          userEmail: userEmail
        });
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

// =============================================
//  معالجة الأخطاء
// =============================================
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

    res.status(statusCode).sendFile(path.join(__dirname, 'public', 'error.html'));
  } else {
    res.status(statusCode).json({
      error: statusCode === 500 ? 'خطأ في الخادم' : err.message,
      requestId: req.id
    });
  }
});

// =============================================
//  بدء الخادم
// =============================================
process.on('uncaughtException', (error) => {
  logger.error(`خطأ غير معالج: ${error.message}`, {
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`وعد غير معالج: ${reason}`, {
    stack: reason.stack
  });
});

app.listen(PORT, () => {
  logger.info(`الخادم يعمل على البيئة ${process.env.NODE_ENV || 'development'}`);
  logger.info(`http://localhost:${PORT}`);
});