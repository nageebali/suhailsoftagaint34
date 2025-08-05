require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { saveNewUser } = require('./supabaseService');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
//  إعدادات الأمان الأساسية
// =============================================

// استخدام helmet لحماية التطبيق
app.use(helmet());

// تحديد معدل الطلبات للحد من الهجمات
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // حد لكل IP
});
app.use(limiter);

// =============================================
//  إعدادات الجلسة والمسار
// =============================================

// تعيين مجلد static
app.use(express.static(path.join(__dirname, 'public')));

// إعداد الجلسة مع خيارات آمنة للإنتاج
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS فقط في الإنتاج
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    sameSite: 'lax'
  }
}));

// تهيئة Passport
app.use(passport.initialize());
app.use(passport.session());

// =============================================
//  إعداد استراتيجية Google OAuth
// =============================================

const callbackURL = process.env.NODE_ENV === 'production'
  ? 'https://suhailsoft.com/auth/google/callback'
  : 'http://localhost:3000/auth/google/callback';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const userContent = {
      username: profile.displayName,
      email: profile.emails?.[0]?.value,
      googleId: profile.id,
      phoneNumber: '', // يجب جعل هذا ديناميكيًا
      instantToken: generateRandomToken() // إنشاء توكن عشوائي
    };
    
    await saveNewUser(userContent);
    return done(null, profile);
  } catch (error) {
    console.error('Error saving user:', error);
    return done(error, null);
  }
}));

// توليد توكن عشوائي
function generateRandomToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// =============================================
//  Serialize/Deserialize User
// =============================================

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// =============================================
//  تعريف المسارات (Routes)
// =============================================

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// بدء عملية المصادقة مع Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// مسار رد الاتصال بعد المصادقة
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard.html');
  }
);

// لوحة التحكم (محمية)
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// تسجيل الخروج
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.redirect('/');
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

// صفحة التحقق من Google Search Console
app.get('/google74f1db194f961b81.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'google74f1db194f961b81.html'));
});

// =============================================
//  معالجة الأخطاء
// =============================================

// معالجة الأخطاء الغير معالجة
process.on('uncaughtException', (err) => {
  console.error('حدث خطأ غير معالج:', err);
});

// معالجة 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// معالجة أخطاء الخادم
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('حدث خطأ في الخادم!');
});

// =============================================
//  بدء الخادم
// =============================================

app.listen(PORT, () => {
  console.log(`الخادم يعمل على ${process.env.NODE_ENV === 'production' ? 'https://suhailsoft.com' : `http://localhost:${PORT}`}`);
});