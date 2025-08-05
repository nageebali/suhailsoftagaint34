require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();
const PORT =   process.env.PORT||3001;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
const {saveNewUser} = require('./supabaseService');

const callbackURL = process.env.NODE_ENV === 'production' 
  ? 'https://suhailsoft.com/api/auth/callback/google' 
  : 'http://localhost:3000/api/auth/callback/google';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL // يتغير تلقائيًا حسب البيئة
}, (token, refreshToken, profile, done) => { 

 let userContent ={ username:profile.displayName, password:'password', phoneNumber:'9677772683833', instantToken:'nageebali' } ;

      

        
   try {
         saveNewUser(userContent);
       console.log('profile:',profile);

   } catch (error) {
    console.log('error:',error);

   }     
 
  return done(null, profile);

}));

// تكوين Passport مع Google
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://suhailsoft.com/api/auth/callback/google"
// },
// (accessToken, refreshToken, profile, done) => {
//     // هنا يمكنك حفظ بيانات المستخدم في قاعدة البيانات
//     return done(null, profile);
// }));

// Serialize/Deserialize User
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
app.get('/', (req, res) => {

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email','phone'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // بعد تسجيل الدخول الناجح
        res.redirect( '/');
    }
);
app.get('/api/auth/callback/google',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
      // بعد تسجيل الدخول الناجح
      res.redirect( '/dashboard.html');
  }
);

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    res.send(`<h1>مرحباً ${req.user.displayName}</h1><a href="/logout">تسجيل الخروج</a>`);
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.listen(PORT, () => {
//  let userContent ={ username:'profile.displayName', password:'password', phoneNumber:'9677772683033', instantToken:'nageebali' } ;

      

        
        
  //saveNewUser(userContent);

    console.log(`الخادم يعمل على http://localhost:${PORT}`);
});

app.get('/google74f1db194f961b81.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','google74f1db194f961b81.html'));
  });

  process.on('uncaughtException', (err) => {
    console.error('حدث خطأ غير معالج:', err);
    // لا توقف العملية هنا إذا كنت تريد استمرار التشغيل
  });