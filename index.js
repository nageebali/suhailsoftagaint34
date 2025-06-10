// //googlestiudio 
// //AIzaSyDPMNlDVWUDmd1BwOyIz1yQswpUyY3Xagw
// const express = require('express');
// const { Client, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode');
// const bodyParser = require('body-parser');
// const path = require('path');
// const { generateKey } = require('crypto');
// const uuid = require('uuid');
// const { createClient } = require('@supabase/supabase-js');



// const bcrypt = require('bcrypt');


// require('dotenv').config();

// const supabase =createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY);

// async function testConnection() {
//     try {
//       const { data, error } = await supabase
//         .from('usersT')
//         .select('*')
//         .limit(100);
      
//       if (error) throw error;
//       console.log('✅ تم الاتصال بنجاح:', data);
//       return true;
//     } catch (err) {
//       console.error('❌ فشل الاتصال:', err.message);
//       return false;
//     }
//   }
  
//   testConnection();

// //   function  CREATETABL(){
// //   //  -- جدول المستخدمين
// //   SQL="CREATE TABLE IF NOT EXISTS usersT (    id SERIAL PRIMARY KEY,    username TEXT NOT NULL,    password TEXT NOT NULL,    phoneNumber TEXT NOT NULL UNIQUE,    instanstoken TEXT NOT NULL UNIQUE,    is_verified BOOLEAN DEFAULT FALSE,    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

// // //-- جدول جلسات واتساب
// // SQL="CREATE TABLE IF NOT EXISTS whatsapp_sessions (    id TEXT PRIMARY KEY,    status TEXT,    qr_code TEXT,    last_activity TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, client_data JSONB);"

// // SQL="CREATE TABLE IF NOT EXISTS messages (    idSERIAL PRIMARY KEY,    session_id TEXT REFERENCES whatsapp_sessions(id) ON DELETE CASCADE, phonenumber TEXT,    message_text TEXT,    direction TEXT,    status TEXT,    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

// // SQL="CREATE TABLE IF NOT EXISTS customers (    idSERIAL PRIMARY KEY,    whatsapp_number TEXT UNIQUE NOT NULL,    customer_name TEXT,    customer_id TEXT UNIQUE,    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

 

// // SQL="CREATE TABLE IF NOT EXISTS tbwhatsapp_numbers (    id SERIAL PRIMARY KEY,    sessionId VARCHAR(255),    number VARCHAR(255),    name TEXT,    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    UNIQUE (sessionId, number));"


// // SQL="CREATE INDEX IF NOT EXISTS idx_number ON tbwhatsapp_numbers(number);"
// // SQL="CREATE INDEX IF NOT EXISTS idx_session ON tbwhatsapp_numbers(sessionId);"

// //   }

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'public')));


// // استخدم dotenv لتحميل متغيرات البيئة

// // Initialize Supabase Client

// // Store active clients
// const activeClients = new Map();

// // نظام المصادقة
// app.post('/register/', async (req, res) => {
//   try {
//     // Destructure with consistent naming
//     const { username, password, phoneNumber } = req.body; // Note camelCase

//     // Input validation
//     if (!phoneNumber) {
//       return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
//     }
//     if (!username || !password) {
//       return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
//     }

//     // Check if phone exists - using correct variable name
//     const { data: existingUser, error: userError } = await supabase
//       .from('usersT')
//       .select('phoneNumber')
//       .eq('phoneNumber', phoneNumber) // ✅ Correct variable
//       .single();

//     if (existingUser) {
//       return res.status(400).json({ error: 'رقم الهاتف مسجل مسبقاً' });
//     }

//     // Rest of your registration logic...
//     const instantToken = uuid.v4();
    
//     const { data: newUser, error: insertError } = await supabase
//       .from('usersT')
//       .insert({
//       username,
//         password,
//         phoneNumber, // Consistent naming
//         instantToken
//       })
//       .select(           );
       
//     if (insertError) throw insertError;

//     return res.status(201).json({
//       success: true,
//       user: newUser[0]
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     return res.status(500).json({
//       success: false,
//       message: "حدث خطأ أثناء التسجيل",
//       error: error.message
//     });
//   }
// });

// app.post('/api/login', async (req, res) => {
//   const { password, phoneNumber } = req.body;
  
//   if (!password || !phoneNumber) {
//     return res.status(400).json({ error: 'Phone number and password are required' });
//   }

//   try {
//     // First find user by phone number only
//     const { data: user, error: findError } = await supabase
//       .from('usersT')
//       .select() // store hashed passwords, not plain text
//       .eq('phoneNumber', phoneNumber)
//       .eq('password', password)
//       .single();

//     if (findError || !user) {
//       // Generic error message to prevent user enumeration
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Compare hashed password with input password
//     // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
//     // if (!isPasswordValid) {
//     //   return res.status(401).json({ error: 'Invalid credentials' });
//     // }

//     // Create a safe user object without sensitive data
//     const safeUser = {
//       id: user.id,
//       username: user.username,
//        password:user.password,
//       phoneNumber: user.phonenumber, // Consistent naming
//       instantToken:user.instantToken

//       // Consider issuing a new session token instead of returning instantToken
//     };

//     return res.json(safeUser);
//   } catch (err) {
//     console.error('Database error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });
// // API to create a new session
// app.post('/add/:sessionId/', async (req, res) => {

//   var sessionId= req.params.sessionId;
//   const instantToken=req.body.instanstoken;
  

//  // const instantToken = req.headers.authorization?.split(' ')[1];

// //  Get user_id from token
//   const { data: user, error: userError } = await supabase
//     .from('usersT')
//     .select('id')
//     // .eq('instantToken', instantToken)
//     .eq('instantToken', instantToken)
//     .single();

//   if (userError || !user) {
//     return res.status(401).json({ error: 'غير مصرح به' });
//   }
//   sessionId=user.id;
//   if (activeClients.has(sessionId)) {
//     return res.status(400).json({ error: 'Session already exists' });
//   }

//   try {
//     // Create a new WhatsApp client
//     const client = new Client({
//   authStrategy: new LocalAuth({
//     dataPath: '/tmp/wwebjs_auth', // المسار الوحيد القابل للكتابة في Lambda
//     puppeteer: {
//       args: [
//         '--disable-gpu',
//         '--single-process',
//         '--no-zygote',
//         '--no-sandbox'
//       ]
//     }
//   })
// });
//     // Store QR code in database when generated
//   // In your /add/:sessionId/ endpoint
// client.on('qr', async (qrCode) => {  // Changed parameter name from qr to qrCode
//   try {
//       const qrImage = await qrcode.toDataURL(qrCode);
      
//       const { error } = await supabase
//           .from('whatsapp_sessions')
//           .upsert({
//               id: sessionId,
//               status: 'QR_GENERATED',
//               qr_code: qrImage,  // Store the image URL instead of raw QR
//               last_activity: new Date().toISOString()
//           });

//       if (error) throw error;
//       console.log(`QR code updated for session ${sessionId}`);
//   } catch (err) {
//       console.error('QR code save error:', err);
//   }
// });
//     // Update status when ready
//     client.on('ready', async () => {
//       console.log(`[${sessionId}] Client is ready`);
//       activeClients.set(sessionId, client);
    
//       try {
//         // Add initial delay
//         await new Promise(resolve => setTimeout(resolve, 2000));
    
//       //  const contacts = await getAllWhatsAppNumbers(client, sessionId);
//        // const result = await saveNumbersToDatabase(contacts, sessionId);
    
//         await supabase
//           .from('whatsapp_sessions')
//           .update({
//             status: 'READY',
//             last_activity: new Date().toISOString(),
//             contacts_count: result.count
//           })
//           .eq('id', sessionId);
    
//       } catch (error) {
//         console.error(`[${sessionId}] Startup sequence failed:`, error);
//       }
//     });
//     // Handle incoming messages
//     client.on('message', async (msg) => {
//       if (msg.fromMe) return;
      
//       await supabase
//         .from('messages')
//         .insert({
//           session_id: sessionId,
//           phonenumber: msg.from,
//           message_text: msg.body,
//           direction: 'INCOMING',
//           status: 'RECEIVED',
//           user_id: user.id
//         });
//     });

//     // Handle authentication failure
//     client.on('auth_failure', () => {
//       console.log(`Authentication failure for session ${sessionId}`);
//       supabase
//         .from('whatsapp_sessions')
//         .update({
//           status: 'AUTH_FAILURE'
//         })
//         .eq('id', sessionId);
//     });

//     // Handle disconnect
//     client.on('disconnected', (reason) => {
//       console.log(`Client ${sessionId} disconnected:`, reason);
//       activeClients.delete(sessionId);
      
//       supabase
//         .from('whatsapp_sessions')
//         .update({
//           status: 'DISCONNECTED'
//         })
//         .eq('id', sessionId);
//     });

//     // Initialize the client
//     client.initialize();
    
//     res.json({ 
//       success: true, 
//       message: 'Session created successfully', 
//       sessionId 
//     });
//   } catch (error) {
//     console.error('Error creating session:', error);
//     res.status(500).json({ error: 'Failed to create session' });
//   }
// });

// // API to get session status
// app.get('/client-status/:sessionId', async (req, res) => {
//   const sessionId = req.params.sessionId;
  
//   const { data: session, error } = await supabase
//     .from('whatsapp_sessions')
//     .select('status, qr_code, last_activity')
//     .eq('id', sessionId)
//     .single();

//   if (error) {
//     return res.status(500).json({ error: 'Database error' });
//   }
  
//   if (!session) {
//     return res.status(404).json({ error: 'Session not found' });
//   }
  
//   const response = {
//     status: session.status,
//     lastActivity: session.last_activity
//   };
  
//   if (session.status === 'QR_GENERATED') {
//     response.qrCode = session.qr_code;
//   }
  
//   res.json(response);
// });

// // API to get all active clients
// app.get('/clients', async (req, res) => {
//   const { data: sessions, error } = await supabase
//   .from('whatsapp_sessions')
//   .select('id, status, last_activity')
//   .eq('status', 'READY');

// if (error) {
//   return res.status(500).json({ error: 'Database error' });
// }

// const activeSessions = sessions.map(session => ({
//   id: session.id,
//   status: session.status,
//   lastActivity: session.last_activity
// }));

// // Reinitialize clients that are in READY state but not in activeClients
//    loadAllClients(activeSessions);
//        return res.json(activeSessions);

 
// });

// async function LOADSOSSION(){
//   const { data: sessions, error } = await supabase
//   .from('whatsapp_sessions')
//   .select('id, status, last_activity')
//   .eq('status', 'READY');

// if (error) {
//   return res.status(500).json({ error: 'Database error' });
// }

// const activeSessions = sessions.map(session => ({
//   id: session.id,
//   status: session.status,
//   lastActivity: session.last_activity
// }));

// // Reinitialize clients that are in READY state but not in activeClients
//    loadAllClients(activeSessions);
//   //return res.json(activeSessions);
// }

// // API to delete a session
// // app.delete('/api/session/:sessionId', async (req, res) => {
// //   const sessionId = req.params.sessionId;
// //   const client = activeClients.get(sessionId);
  
// //   if (client) {
// //     client.destroy()
// //       .then(async () => {
// //         activeClients.delete(sessionId);
        
// //         await supabase
// //           .from('whatsapp_sessions')
// //           .delete()
// //           .eq('id', sessionId);
        
// //         res.json({ success: true, message: 'Session deleted successfully' });
// //       })
// //       .catch(error => {
// //         console.error('Error destroying client:', error);
// //         res.status(500).json({ error: 'Failed to delete session' });
// //       });
// //   } else {
// //     await supabase
// //       .from('whatsapp_sessions')
// //       .delete()
// //       .eq('id', sessionId);
    
// //     res.json({ success: true, message: 'Session deleted successfully' });
// //   }
// // });

// // API to get all messages
// app.get('/messages/:instanstoken', async (req, res) => {
//   const instantToken = req.params.instanstoken;

//   // Get user from token
//   const { data: user, error: userError } = await supabase
//     .from('usersT')
//     .select('id')
//     .eq('instantToken', instantToken)
//     .single();

//   if (userError || !user) {
//     return res.status(401).json({ error: 'غير مصرح به' });
//   }

//   // Get messages
//   const { data: messages, error } = await supabase
//     .from('messages')
//     .select('id, phonenumber, message_text, direction, status, timestamp')
//     .neq('phonenumber', 'status@broadcast')
//     .eq('session_id', user.id)
//     .order('timestamp', { ascending: false })
//     .limit(100);

//   if (error) {
//     return res.status(500).json({ error: 'خطأ في جلب الرسائل' });
//   }

//   res.json(messages);
// });

// // API to send a message
// app.post('/send2/:instanstoken', async (req, res) => {
//   const instantToken = req.params.instanstoken;
//   const { phone, text } = req.body;
  
//   if (!phone || !text) {
//     return res.status(400).json({ error: 'Phone and text parameters are required' });
//   }

//   // Get user and session from token
//   const { data: user, error: userError } = await supabase
//     .from('usersT')
//     .select('id')
//     .eq('instantToken', instantToken)
//     .single();

//   if (userError || !user) {
//     return res.status(401).json({ error: 'غير مصرح به' });
//   }

//   const { data: session, error: sessionError } = await supabase
//     .from('whatsapp_sessions')
//     .select('id')
//     .eq('id', user.id)
//     .eq('status', 'READY')
//     .single();

//   if (sessionError || !session) {
//     return res.status(404).json({ error: 'No active session found' });
//   }

//   const client = activeClients.get(session.id);
//   if (!client) {
//     return res.status(404).json({ error: 'Session not active' });
//   }
  
//   try {
//     // Format phone number
//     let formattedPhone = phone.replace(/\D/g, '');
//     if (!formattedPhone.endsWith('@c.us')) {
//       formattedPhone += '@c.us';
//     }
    
//     // Send the message
//     await client.sendMessage(formattedPhone, text);
    
//     // Save to database
//     await supabase
//       .from('messages')
//       .insert({
//         session_id: session.id,
//         phonenumber: formattedPhone,
//         message_text: text,
//         direction: 'OUTGOING',
//         status: 'SENT',
    
//       });
    
//     res.json({ success: true, message: 'Message sent successfully' });
//   } catch (error) {
//     console.error('Error sending message:', error);
    
//     // Save failed attempt to database
//     await supabase
//       .from('messages')
//       .insert({
//         session_id: session.id,
//         phonenumber: phone,
//         message_text: text,
//         direction: 'OUTGOING',
//         status: 'FAILED',
      
//       });
    
//     res.status(500).json({ error: 'Failed to send message' });
//   }
// });


// app.post('/send/:instanstoken', async (req, res) => {
//   const instantToken = req.params.instanstoken;
//   const phone = req.query.phone;

//    const text = req.query.text;

//   if (!phone || !text) {
//     return res.status(400).json({ error: 'Phone and text parameters are required' });
//   }

//   // Get user and session from token
//   const { data: user, error: userError } = await supabase
//     .from('usersT')
//     .select('id')
//     .eq('instantToken', instantToken)
//     .single();

//   if (userError || !user) {
//     return res.status(401).json({ error: 'غير مصرح به' });
//   }

//   const { data: session, error: sessionError } = await supabase
//     .from('whatsapp_sessions')
//     .select('id')
//     .eq('id', user.id)
//     .eq('status', 'READY')
//     .single();

//   if (sessionError || !session) {
//     return res.status(404).json({ error: 'No active session found' });
//   }

//   const client = activeClients.get(session.id);
//   if (!client) {
//     return res.status(404).json({ error: 'Session not active' });
//   }
  
//   try {
//     // Format phone number
//     let formattedPhone = phone.replace(/\D/g, '');
//     if (!formattedPhone.endsWith('@c.us')) {
//       formattedPhone += '@c.us';
//     }
    
//     // Send the message
//     await client.sendMessage(formattedPhone, text);
    
//     // Save to database
//     await supabase
//       .from('messages')
//       .insert({
//         session_id: session.id,
//         phonenumber: formattedPhone,
//         message_text: text,
//         direction: 'OUTGOING',
//         status: 'SENT',
    
//       });
    
//     res.json({ success: true, message: 'Message sent successfully' });
//   } catch (error) {
//     console.error('Error sending message:', error);
    
//     // Save failed attempt to database
//     await supabase
//       .from('messages')
//       .insert({
//         session_id: session.id,
//         phonenumber: phone,
//         message_text: text,
//         direction: 'OUTGOING',
//         status: 'FAILED',
      
//       });
    
//     res.status(500).json({ error: 'Failed to send message' });
//   }
// });

// if (process.env.AUTO_START === 'true') {
//   serverInstance = app.listen(process.env.PORT || 3000, () => {
//       isServerRunning = true;
//       console.log(`الخادم يعمل على المنفذ ${process.env.PORT || 3000}`);
//   });
// }
// // Helper function to load all clients
// async function loadAllClients(activeSessions) {
//   for (const session of activeSessions) {
//     if (!activeClients.has(session.id)) {
//       try {
//         const client = new Client({
//           authStrategy: new LocalAuth({ clientId: session.id }),
//           puppeteer: { 
//             headless: true,
//             args: ['--no-sandbox', '--disable-setuid-sandbox']
//           }
//         });

//         client.on('ready', () => {
//           console.log(`Client ${session.id} is ready!`);
//           activeClients.set(session.id, client);
//         });

//         client.on('disconnected', () => {
//           activeClients.delete(session.id);
//         });

//         client.on('auth_failure', () => {
//           activeClients.delete(session.id);
//           supabase
//             .from('whatsapp_sessions')
//             .update({
//               status: 'AUTH_FAILURE'
//             })
//             .eq('id', session.id);
//         });

//         await client.initialize();
//       } catch (error) {
//         console.error(`Error initializing client ${session.id}:`, error);
//       }
//     }
//   }
// }

// // Serve static files
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// app.get('/login', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'login.html'));
// });

// app.get('/register', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'register.html'));
// });
// app.use((req, res) => {
//   res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
// });

// app.get('/dashboard', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
 
//   if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
//     console.error('❌ خطأ: متغيرات Supabase البيئية غير معرّفة!');
//     console.log('تأكد من:');
//     console.log('1. وجود ملف .env في المجلد الرئيسي');
//     console.log('2. أن المتغيرات معرّفة بشكل صحيح');
//     process.exit(1);
//   }
//    LOADSOSSION();
// });

// process.on('SIGINT', async () => {
//   console.log('\nGraceful shutdown...');
//   for (const [id, client] of activeClients) {
//     try {
//       await client.destroy();
//       console.log(`[${id}] Client destroyed`);
//     } catch (err) {
//       console.error(`[${id}] Destruction failed:`, err);
//     }
//   }
//   process.exit();
// });





// async function getAllWhatsAppNumbers(client, sessionId) {
//   // Verify client is ready and connected
//   if (!client?.info || !client?.pupPage) {
//     throw new Error('WhatsApp client is not ready or connected');
//   }

//   try {
//     const [contacts, chats] = await Promise.all([
//       client.getContacts(),
//       client.getChats()
//     ]);

//     const numbersMap = new Map();

//     // Process contacts
//     contacts.forEach(contact => {
//       if (contact.number) {
//         const cleanNumber = contact.number.replace('@c.us', '').replace('+', '');
//         numbersMap.set(cleanNumber, {
//           number: cleanNumber,
//           name: contact.name || contact.pushname || null,
//           sessionId
//         });
//       }
//     });

//     // Process chats (non-group chats)
//     chats.forEach(chat => {
//       if (!chat.isGroup && chat.id?.user) {
//         const cleanNumber = chat.id.user.replace(/\D/g, '');
//         if (!numbersMap.has(cleanNumber)) {
//           numbersMap.set(cleanNumber, {
//             number: cleanNumber,
//             name: chat.name || chat.pushname || chat.formattedTitle || null,
//             sessionId
//           });
//         }
//       }
//     });

//     return Array.from(numbersMap.values());
    
//   } catch (error) {
//     console.error('Error fetching WhatsApp numbers:', {
//       error: error.message,
//       stack: error.stack
//     });
//     throw new Error(`Failed to get WhatsApp contacts: ${error.message}`);
//   }
// }

// async function saveNumbersToDatabase(numbers, sessionId) {
//   if (!numbers || numbers.length === 0) {
//     console.warn('No numbers to save');
//     return { success: true, count: 0 };
//   }

//   try {
//     // Verify database connection first
//     await testConnection();

//     // Prepare batch data
//     const insertData = numbers.map(numberObj => ({
//       sessionid: sessionId,
//       number: numberObj.number.replace('+', ''),
//       name: numberObj.name || null,
//       saved_at: new Date().toISOString()
//     }));

//     // Split into chunks to avoid timeout
//     const chunkSize = 100;
//     const chunks = [];
//     for (let i = 0; i < insertData.length; i += chunkSize) {
//       chunks.push(insertData.slice(i, i + chunkSize));
//     }

//     let totalSaved = 0;
    
//     // Process chunks sequentially
//     for (const chunk of chunks) {
//       const { error } = await supabase
//         .from('tbwhatsapp_numbers')
//         .upsert(chunk, { onConflict: 'sessionid,number' });

//       if (error) {
//         console.error('Error saving chunk:', error);
//         throw error;
//       }
//       totalSaved += chunk.length;
//       console.log(`Saved ${chunk.length} numbers (total: ${totalSaved})`);
//     }

//     // Verify total count
//     const { count, error: countError } = await supabase
//       .from('tbwhatsapp_numbers')
//       .select('*', { count: 'exact', head: true })
//       .eq('sessionid', sessionId);

//     if (countError) {
//       console.error('Count verification error:', countError);
//     } else {
//       console.log(`Total numbers for session ${sessionId}: ${count}`);
//     }

//     return { success: true, count: totalSaved };
    
//   } catch (error) {
//     console.error('Database save error:', {
//       message: error.message,
//       stack: error.stack,
//       sessionId,
//       attemptCount: numbers.length
//     });
    
//     // Retry logic (simple example)
//     if (error.message.includes('fetch failed') || error.message.includes('connection')) {
//       console.log('Attempting to reconnect...');
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       return saveNumbersToDatabase(numbers, sessionId); // Recursive retry
//     }
    
//     throw new Error(`Failed to save contacts after retries: ${error.message}`);
//   }
// }
require('dotenv').config(); // Load .env file
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { createLogger, format, transports } = require('winston');
const fs = require('fs');

// Initialize Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// في بداية الملف بعد تعريف supabase

// بعد تعريف app.use(express.static(...))
const apiRoutes = require('./routes/api');
const { CONFIG_FILES } = require('next/dist/shared/lib/constants');
app.use('/api', apiRoutes);

const sessions = new Map();
const qrcodes = new Map();

// Initialize Supabase
let supabase;
try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    logger.info('Supabase client initialized successfully');
} catch (err) {
    logger.error('Failed to initialize Supabase client:', err);
    process.exit(1);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (err) {
        logger.error(`Failed to load index page: ${err.message}`);
        res.status(500).send('Internal Server Error');
    }
});
app.use(express.urlencoded({ extended: true }));
app.get('/api/allsessions', async (req, res) => {
    try {
        const activeSessions = await getActiveSessions();
        res.json(activeSessions);
    } catch (error) {
        logger.error('Error getting active sessions:', error);
        res.status(500).json({ error: 'Failed to retrieve active sessions' });
    }
});

app.get('/status', (req, res) => {
    res.json({
        Sessions: sessions.size,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
    }); 
});
// Socket.io events
io.on('connection', (socket) => {
    try {
        const currentsessionId = socket.id;
        console.log(` session ${sessions}`);
      
       // socket.emit(`currentsessionId: ${socket.id}`);
       
     
        socket.emit('currentsessionId', socket.id);

        socket.on('create_session', async (sessionId) => {
            try {

                console.log(` session ${sessions}`);
                if (!sessionId || typeof sessionId !== 'string') {
                    throw new Error('Invalid session ID provided');
                }

                if (sessions.has(sessionId)) {
                    logger.info(`Existing session found in memory: ${sessionId}`);
                    const existingClient = sessions.get(sessionId);
                    
                    if (existingClient.info) {
                        socket.emit('authenticated', { sessionId });
                        socket.emit('status', `Session ${sessionId} is already connected.`);
                        return;
                    } else {
                     await   existingClient.initialize();
                   //     await sessions.get(sessionId).initialize();
                        
                        
                        logger.info(`Session ${sessionId} exists but not connected. Reinitializing...`);
                    }
                }

                const client = new Client({
                    authStrategy: new LocalAuth({
                        dataPath: `./sessions/${sessionId}`
                    }),
                    puppeteer: {
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    }
                });

                client.on('qr', async (qr) => {
                    try {
                        if (socket.connected){

                        
                        socket.emit('qr', { sessionId, qr });
                        socket.emit('status', 'Please scan the QR code for authentication...');
                        console.log(`QR code sent for session ${sessionId}`);
                    
                        qrcodes.set(sessionId, qr);
                    //  saveSession(sessionId);
                       
                    
                    
                    }

                        else{
                       // sessions.delete(sessionId);
                        //await deleteSession(sessionId);
                        }
                    } catch (err) {
                        logger.error('QR generation failed:', err);
                        socket.emit('error', { message: 'Failed to generate QR' });
                    }
                });

                client.on('authenticated', async() => {
                    try {
                       
                       const clientinfo=client.info();
                        saveClientInfo(sessionId, client.info)
                                .then(() => {
                                    socket.emit('authenticated', { clientinfo });
                                })

                    } catch (err) {
                        logger.error(`Error in authenticated event for ${sessionId}:`, err);
                        await deleteSessionFolder(sessionId);
                    }
                });

                client.on('ready', () => {
                    try {
                        logger.info(`Client ready: ${sessionId}`);
                        if (client.info) {
                            saveClientInfo(sessionId, client.info)
                                .then(() => {
                                    socket.emit('authenticated', { sessionId });
                                })
                                .catch(err => {
                                    logger.error('Client info save error:', err);
                                    socket.emit('error', {
                                        message: 'Failed to save client info',
                                        details: err.message
                                    });
                                });
                        }
                    } catch (err) {
                        logger.error(`Error in ready event for ${sessionId}:`, err);
                    }
                });

                // client.on('auth_failure', async (msg) => {
                //     try {
                //         logger.error(`Auth failure for session ${sessionId}: ${msg}`);
                //         socket.emit('error', { message: `Authentication failed: ${msg}` });
                //         socket.emit('status', 'Authentication failed, please try scanning QR again.');
                //         sessions.delete(sessionId);
                //         await deleteSession(sessionId);
                //         if (client.destroy) await client.destroy();
                //     } catch (err) {
                //         logger.error(`Error handling auth_failure for ${sessionId}:`, err);
                //     }
                // });

                // client.on('disconnected', async (reason) => {
                //     try {
                //         logger.info(`Session ${sessionId} disconnected: ${reason}`);
                //         socket.emit('status', `Disconnected: ${reason}`);
                //         socket.emit('disconnected', { sessionId, reason });
                //         sessions.delete(sessionId);
                //         await deleteSession(sessionId);
                //         if (client.destroy) await client.destroy();
                //     } catch (err) {
                //         logger.error(`Error handling disconnect for ${sessionId}:`, err);
                //     }
                // });

                await client.initialize();
                sessions.set(sessionId, client);
                logger.info(`Client initialization requested for session: ${sessionId}`);
            } catch (initErr) {
                logger.error(`Failed to initialize client for session ${sessionId}:`, initErr.message);
                socket.emit('error', { message: `Client initialization failed: ${initErr.message}` });
            }
        });

        socket.on('regenerate_qr', async (sessionId) => {
            try {
                const client = sessions.get(sessionId);
                if (!client) {
                    throw new Error('Session does not exist for QR regeneration');
                }
                if (client.info) {
                    throw new Error('Client is already connected');
                }

                await client.destroy();
                sessions.delete(sessionId);
                socket.emit('status', `Regenerating QR for ${sessionId}...`);
                await io.sockets.in(socket.id).emit('create_session', sessionId);
            } catch (err) {
                logger.error(`Failed to regenerate QR for session ${sessionId}:`, err);
                socket.emit('error', { message: err.message || 'Failed to regenerate QR' });
            }
        });

        socket.on('send_message', async ({ sessionId, phoneNumber, message }, callback) => {
            try {
                if (!sessionId || !phoneNumber || !message) {
                    throw new Error('Missing required parameters');
                }

                const client = sessions.get(sessionId);
                if (!client || !client.info) {
                    throw new Error('Session does not exist or is not authenticated');
                }

                const number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
                const result = await client.sendMessage(number, message);
                logger.info(`Message sent from ${sessionId} to ${number}`);
                callback({ success: true, id: result.id._serialized });
            } catch (err) {
                logger.error(`Message send error for session ${sessionId}:`, err);
                callback({ success: false, error: err.message || 'Failed to send message' });
            }
        });

        socket.on('delete_session', async (sessionId) => {
            try {
                if (!isValidSessionId(sessionId)) {
                    throw new Error('Invalid session ID format');
                }

                const client = sessions.get(sessionId);
                const promises = [];
                
                if (client) {
                 //   promises.push(client.destroy().catch(e => logger.error('Client destroy error:', e)));
                    sessions.delete(sessionId);
                }
                
                promises.push(
                    deleteSession(sessionId).catch(e => logger.error('DB delete error:', e)),
                    deleteSessionFolder(sessionId).catch(e => logger.error('Folder delete error:', e))
                );
                
                await Promise.all(promises);
                socket.emit('session_deleted', { success: true, sessionId });
            } catch (err) {
                logger.error(`Full deletion failed for ${sessionId}:`, err);
                socket.emit('session_deleted', { 
                    success: false, 
                    sessionId,
                    error: err.message 
                });
            }
        });

        socket.on('disconnect', (reason) => {
            try {
                logger.info(`Disconnected: ${socket.id} (Reason: ${reason})`);
                sessions.forEach((client, sessionId) => {
                    if (!client.info) {
                    //    client.destroy().catch(err => logger.error(`Error destroying client ${sessionId}:`, err));
                    //    sessions.delete(sessionId);
                    }
                });
            } catch (err) {
                logger.error('Error in disconnect handler:', err);
            }
        });

    } catch (err) {
        logger.error('Error in socket connection handler:', err);
    }
});

// Helper functions
function isValidSessionId(sessionId) {
    return /^[a-zA-Z0-9_-]+$/.test(sessionId);
}

async function deleteSessionFolder2(sessionId) {
    try {
        const sessionPath = path.join(__dirname, 'sessions', sessionId);
        
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            logger.info(`Session folder deleted: ${sessionPath}`);
            return true;
        }
        
        logger.info(`Session folder not found: ${sessionPath}`);
        return false;
    } catch (err) {
        logger.error(`Error deleting session folder ${sessionId}:`, err);
        throw err;
    }
}




async function deleteSessionFolder(sessionId) {
    const sessionPath = path.join(sessionsDir, sessionId);
    
    if (!fs.existsSync(sessionPath)) {
        console.log(`[INFO] Folder not found: ${sessionPath}`);
        return false;
    }

    try {
        // إغلاق العميل أولاً إذا كان موجوداً
        const client = sessions.get(sessionId);
        if (client) {
          //  await client.destroy();
            //sessions.delete(sessionId);
        }

        // حذف المجلد مع إعادة المحاولة
        await fs.promises.rm(sessionPath, { 
            recursive: false, 
            force: true,
            maxRetries: 3,
            retryDelay: 100
        });
        
        console.log(`[SUCCESS] Deleted session folder: ${sessionPath}`);
        return true;
    } catch (err) {
        console.error(`[ERROR] Failed to delete ${sessionPath}:`, err);
        
        // حاول باستخدام طريقة بديلة إذا فشلت
        try {
            await exec(`rm -rf "${sessionPath}"`); // للأنظمة الشبيهة بيونكس
            return true;
        } catch (fallbackErr) {
            console.error(`[FALLBACK ERROR] Also failed:`, fallbackErr);
            throw err; // أعد رمي الخطأ الأصلي
        }
    }
}


async function saveSession(sessionId) {
    try {
       
        const { error } = await supabase
            .from('sessions_whatsapp')
            .upsert({
                session_id: sessionId,
                client_info: sessions.get(sessionId).Client.info,
                session_data: qrcodes.get(sessionId),
                updated_at: new Date().toISOString()
                
            }, {
                onConflict: 'session_id',
                returning: 'minimal'
            });

        if (error) throw error;
        logger.info(`Session data saved/updated: ${sessionId}`);
    } catch (err) {
        logger.error(`Failed to save session data for ${sessionId}:`, err.message);
        throw err;
    }
}

async function saveClientInfo(sessionId, clientInfo) {
    try {
        if (!clientInfo) {
            logger.warn(`No client info provided for session: ${sessionId}`);
            return;
        }

        const { error } = await supabase
            .from('sessions_whatsapp')
            .upsert({
                session_id: sessionId,
                client_info: clientInfo,
                session_data: qrcodes.get(sessionId),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'session_id',
                returning: 'minimal'
            });

        if (error) throw error;
        logger.info(`Client info saved/updated for session: ${sessionId}`);
    } catch (err) {
        logger.error(`Failed to save client info for ${sessionId}:`, err.message);
        throw err;
    }
}
async function deleteSessionFolder(sessionId) {
    try {
        
      const sessionPath = path.join(__dirname, 'sessions', sessionId);
      if (fs.existsSync(sessionPath)) {
      //  fs.rmSync(sessionPath, { recursive: true, force: true });
        logger.info(`Session folder deleted: ${sessionPath}`);
        return true;
      }
      return false;
    } catch (err) {
      logger.error(`Error deleting session folder ${sessionId}:`, err);
      throw err;
    }
  }


async function getSession(sessionId) {
    try {
        const { data, error } = await supabase
            .from('sessions_whatsapp')
            .select('session_data')
            .eq('session_id', sessionId)
            .maybeSingle();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }
        return data ? data.session_data : null;
    } catch (err) {
        deleteSession(sessionId);
        logger.error(`Failed to load session ${sessionId} from DB:`, err);
        throw err;
    }
}



 async function loadActiveSessions() {
    try {
        const { data: activeSessions, error } =  await supabase
            .from('sessions_whatsapp')
            .select('session_id, session_data, client_info, updated_at, created_at')
           // .not('client_info', 'is', null)
            // Only load active sessions
         ;
        if (error) throw error;

        if (!activeSessions || activeSessions.length === 0) {
            logger.info('No active sessions found to load at startup.');
            console.log('No active sessions found to load at startup.');
            return;
        }



        logger.info(`Loading ${activeSessions.length} active sessions...`);
        console.log(`Loading ${activeSessions.length} active sessions...`);

        for (const session of activeSessions) {
            try {
                // Skip if session already exists and is connected
                if (sessions.has(session.session_id)) {
                    const existingClient = sessions.get(session.session_id);
                    if (existingClient && existingClient.info?.wid) {
                        logger.info(`Session ${session.session_id} is already connected. Skipping...`);
                        continue;
                    }
                }
                console.log(`Session ${session.session_id} is already connected. Skipping...`);
                const client = new Client({
                    session: session.session_data,
                    clientInfo: session.client_info,
                    authStrategy: new LocalAuth({
                        dataPath: `./sessions/${session.session_id}`
                    }),
                    puppeteer: {
                        args: ['--no-sandbox', '--disable-setuid-sandbox'],
                        headless: true
                    },
                    takeoverOnConflict: true,
                    restartOnAuthFail: true
                });

                // Setup event handlers
              //  setupClientEventHandlers(client, session);

                // Store references
                sessions.set(session.session_id, client);
                qrcodes.set(session.session_id, session.session_data); // Initialize with null QR code

                // Initialize the client
                 client.initialize();
                
            } catch (err) {
                logger.error(`Failed to initialize session ${session.session_id}: ${err.message}`);
             //   await handleSessionError(session.session_id, err);
            }
        }
    } catch (err) {
        logger.error(`General failure loading sessions at startup: ${err.message}`);
    }

}

  let listCommand = {}
const sessionsDir = path.join(__dirname, 'sessions');
// const readCommands = () => {
//     let dir = sessionsDir
//     let dirs = fs.readdirSync(dir)
//     let listType = []
  
//     try {
//         dirs.forEach(async (res) => {
//             let groups = res.toLowerCase()
//             Commands.type = dirs.filter(v => v !== "_").map(v => v)
//             listCommand[groups] = []
//             let files = fs.readdirSync(`${dir}/${res}`).filter((file) => file.endsWith(".js"))
//             for (const file of files) {
//                 const command = require(`${dir}/${res}/${file}`)
//                 let options = {
//                     name: command.name ? command.name : "",
//                     alias: command.alias ? command.alias : [],
//                     desc: command.desc ? command.desc : "",
//                     type: command.type ? command.type : "",
//                     example: command.example ? command.example : "",
//                     isMedia: command.isMedia ? command.isMedia : false,
//                     isOwner: command.isOwner ? command.isOwner : false,
//                     isGroup: command.isGroup ? command.isGroup : false,
//                     isPrivate: command.isPrivate ? command.isPrivate : false,
//                     isBotAdmin: command.isBotAdmin ? command.isBotAdmin : false,
//                     isAdmin: command.isAdmin ? command.isAdmin : false,
//                     isBot: command.isBot ? command.isBot : false,
//                     disable: command.disable ? command.disable : false,
//                     isQuery: command.isQuery ? command.isQuery : false,
//                     start: command.start ? command.start : () => {}
//                 }
//                 listCommand[groups].push(options)
//                 Commands.set(options.name, options)
//                 global.reloadFile(`${dir}/${res}/${file}`)
//             }
//         })
//         Commands.list = listCommand
//     } catch (e) {
//         console.error(e)
//     }
// }




// Start server



// جلب جميع الجلسات المحفوظة

if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir);
}

const sessionFiles = fs.readdirSync(sessionsDir);

// تحميل كل جلسة


const PORT = process.env.PORT || 3000;
server.listen(PORT, async() => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`WebSocket available at ws://localhost:${PORT}`);
     console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}`);
   //await loadActiveSessions().catch(err => logger.error('Error loading active sessions:', err));
   await loadAllSessions();
   printSessions();
   // await loadAllSessionsFolder();
});

// Process event handlers
// أضف هذه الدالة
async function safeDestroy(client, sessionId) {
    try {
        if (!client) return;
        
        // 1. Remove all listeners
        client.removeAllListeners();
        
        // 2. Close page if exists
        if (client.pupPage && !client.pupPage.isClosed()) {
            await client.pupPage.close().catch(() => {});
        }
        
        // 3. Destroy client
        await client.destroy().catch(() => {});
        
        // 4. Cleanup
        sessions.delete(sessionId);
        qrcodes.delete(sessionId);
        
        return true;
    } catch (err) {
        logger.error(`Force cleanup for ${sessionId}:`, err);
        return false;
    }
}

// عدل SIGINT handler
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    
    const cleanupResults = await Promise.all(
        Array.from(sessions.entries()).map(
            async ([id, client]) => ({
                sessionId: id,
                success: await safeDestroy(client, id)
            })
        )
    );
    
    server.close(() => {
        logger.info('Cleanup completed', cleanupResults);
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

app.post('/send/:sessionId',  async (req, res) => {
    try{
    const { sessionId } = req.params;
    let phoneNumber = req.query.phoneNumber;
    let message = req.query.message;
     
     
     if (!phoneNumber && !message) {
        message = req.body.message;
        phoneNumber = req.body.phoneNumber;
      }
    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }
  
    const client = sessions.get(sessionId);
    if (!client) {

      return res.status(404).json({ error: 'Session not found' });
    }
    console.log("client.info:",client.info)
    if (!client.info) {
        console.log("client.info:",client.info)
        logger.info(`Destroying WhatsApp client for session ${sessionId}...`);
      //  await client.destroy();
    }
    
      const number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
      const result = await client.sendMessage(number, message);
      res.json({ success: true, messageId: result.id._serialized });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' + error });
    }
  });




// Assuming these are defined elsewhere in your code


async function loadAllSessionsFolder() {
    try {
        // Read session files from directory
        const sessionFiles = fs.readdirSync(sessionsDir);
        
        // Process each session file
        for (const sessionFile of sessionFiles) {
            try {
                const sessionId = sessionFile;
                const sessionPath = path.join(sessionsDir, sessionFile);
                
                // Skip if not a directory (session folders are typically directories)
                if (!fs.statSync(sessionPath).isDirectory()) {
                    continue;
                }

                const client = new Client({
                    authStrategy: new LocalAuth({
                        dataPath: sessionPath
                    }),
                    puppeteer: {
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    }
                });

                client.on('ready', () => {
                    console.log(`✅ Session ${sessionId} is ready!`);
                //   qrcodes.delete(sessionId); // Remove QR code if it was stored
                });

                client.on('qr', qr => {
                    if (!client.connected) {
                        console.log(`❌ الاتصال مغلق لـ ${sessionId} - تنظيف الجلسة...`);
                        
                        // إجراءات التنظيف:
                        qrcodes.delete(sessionId);
                        sessions.delete(sessionId);
                      //  client.destroy();
                    //    deleteSessionFolder(sessionId);
                        // يمكنك أيضاً حذف مجلد الجلسة إذا أردت
                        // await deleteSessionFolder(sessionId);
                        
                        return;
                    }
                    
                    // إذا كان الاتصال نشطاً
                    qrcodes.set(sessionId, qr);
                    console.log(`🔑 Session ${sessionId} needs QR scan`);
                });

                client.on('auth_failure', () => {
                    console.log(`❌ Authentication failed for session ${sessionId}`);
                  //  client.destroy();
                    sessions.delete(sessionId);
                });

                client.on('disconnected', (reason) => {
                    console.log(`⚠️ Session ${sessionId} disconnected: ${reason}`);
                    sessions.delete(sessionId);
                });

                await client.initialize();
                sessions.set(sessionId, client);
                
            } catch (error) {
                console.error(`Error initializing session ${sessionFile}:`, error);
            }
        }
        
        console.log(`Loaded ${sessions.size} sessions successfully`);
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

// Usage
//loadAllSessionsFolder();
function printSessions() {
    console.log('Current sessions:');
    sessions.forEach((client, sessionId) => {
        console.log(`- ${sessionId} (ready: ${!!client.info})`);
    });
}

// استبدل الدالتين بدالة واحدة محسنة
async function loadAllSessions() {
    try {
        // Load from database
        const { data: dbSessions } = await supabase
            .from('sessions_whatsapp')
            .select('session_id, session_data, client_info');
        
        // Load from filesystem
        const sessionFiles = fs.readdirSync(sessionsDir)
            .filter(file => fs.statSync(path.join(sessionsDir, file)).isDirectory());

        const loadedSessions = new Set();

        // Load database sessions first
        for (const session of dbSessions || []) {
            if (!sessions.has(session.session_id)) {
                await initializeSession(session.session_id, session);
                loadedSessions.add(session.session_id);
            }
        }

        // Load filesystem sessions
        for (const sessionFile of sessionFiles) {
            if (!loadedSessions.has(sessionFile)) {
                await initializeSession(sessionFile);
            }
        }
    } catch (err) {
        logger.error('Failed to load sessions:', err);
    }
}

async function initializeSession(sessionId, sessionData = null) {
    try {
        const client = new Client({
            authStrategy: new LocalAuth({
                dataPath: `./sessions/${sessionId}`
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        setupClientHandlers(client, sessionId);
        await client.initialize();
        sessions.set(sessionId, client);
        return true;
    } catch (err) {
        logger.error(`Failed to init session ${sessionId}:`, err);
        return false;
    }
}
