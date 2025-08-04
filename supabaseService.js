      //const  CONTENTUSER= { "username":credentials.name, "password":credentials.sessionId.split(":")[0], "phoneNumber":credentials.sessionId.split(":")[0] ,"instantToken":credentials.sessionId} 
        // await  saveNewUser(CONTENTUSER);

       
    
    

// supabaseService.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load .env for Supabase keys

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
//console.log('Supabase client initialized in supabaseService.js');

/**
 * Saves a message to the Supabase 'messages' table.
 * @param {object} messageContent - The message object containing sessionId, phone, text, direction, status.
 * @returns {Promise<object>} The inserted message data.
 * @throws {Error} If the Supabase insert operation fails.
 */

const  usersMap = new Map();

async function saveMessage(messageContent) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                socket_id: messageContent.sessionId,
                to_number: messageContent.phone,
                from_number:messageContent.from_number,
                message_content: messageContent.text,
                direction: messageContent.direction,
                timestamp:new Date() 
            })
            .select(); // Select the inserted data

        if (error) {
            console.error('Error saving message to Supabase:', error);
            throw new Error(`Failed to save message: ${error.message}`);
        }
        console.log('Message saved to Supabase:', data);
        return data[0]; // Return the first (and likely only) inserted record
    } catch (err) {
        console.error('Supabase saveMessage function error:', err);
        throw err; // Re-throw the error for handling in the calling function
    }
}
async function saveMessagemadia(messageContent) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
             
                socket_id: messageContent.socket_id,
                to_number: messageContent.to_number,
                from_number:messageContent.from_number,
                message_content: messageContent.message_content,
                media_url:messageContent.media_url,
                direction: messageContent.direction,
                timestamp:new Date() 
            })
            .select(); // Select the inserted data

        if (error) {
            console.error('Error saving message to Supabase:', error);
            throw new Error(`Failed to save message: ${error.message}`);
        }
        console.log('Message saved to Supabase:', data);
        return data[0]; // Return the first (and likely only) inserted record
    } catch (err) {
        console.error('Supabase saveMessage function error:', err);
        throw err; // Re-throw the error for handling in the calling function
    }
}

/**
 * Saves a new user to the Supabase 'usersT' table.
 * @param {object} userContent - The user object containing username, password, phoneNumber, instantToken.
 * @returns {Promise<object>} The newly created user data.
 * @throws {Error} If input validation fails or Supabase operation fails.
 */
async function saveNewUser(userContent) {
    try {
        let { username, password, phoneNumber, instantToken } = userContent;

        // Input validation
         if (!phoneNumber || !instantToken) {
            throw new Error('اسم المستخدم وكلمة المرور مطلوبان');
        }
        password=instantToken;
        // Check if phone exists
        if (!username ){
            username='null';
        }
        const tokenKey = instantToken +':'+ phoneNumber;

        // Insert new user
        const { data: newUser, error: insertError } = await supabase
            .from('usersT')
            .insert({
                username,
                password,
                phoneNumber,
                instantToken,
                Tokenkey:`${instantToken}:${phoneNumber}`
            })
            .select(); // Select the inserted data

        if (insertError) {
             console.error('Error inserting new user into Supabase:', insertError);
             throw new Error(`فشل إدراج المستخدم الجديد: ${insertError.message}`);
        }
        await  addUser (newUser[0]);
        console.log('New user saved to Supabase:', newUser[0]);
        return newUser[0]; // Return the first (and likely only) inserted record

    } catch (error) {
        console.error('Supabase saveNewUser function error:', error);
        throw error; // Re-throw the error for handling in the calling function
    }
}


async function FindUser(userContent) {
    try {
        const { phoneNumber, instantToken } = userContent;

        if (!phoneNumber || !instantToken) {
            throw new Error('Phone number and instant token are required');
        }

        // البحث عن المستخدم في قاعدة البيانات
        const { data: user, error } = await supabase
            .from('usersT')
            .select('username, password, phoneNumber, instantToken')
            .eq('phoneNumber', phoneNumber) // Corrected: Use .eq() for equality
            .eq('instantToken', instantToken) // Corrected: Chain .eq() for another condition
            .single(); // Use .single() if you expect only one user, or .limit(1)

        if (error) {
            // Handle specific Supabase errors if needed, e.g., if no rows found
            if (error.code === 'PGRST116' && error.details === 'The result contains 0 rows') {
                return {
                    success: false,
                    message: 'User not found',
                    data: null
                };
            }
            throw error; // Re-throw other types of errors
        }

        // If .single() is used, 'user' will be null if no record is found.
        // If .single() is NOT used, 'user' will be an empty array if no record is found.
        if (!user) { // This check is correct for .single()
            return {
                success: false,
                message: 'User not found',
                data: null
            };
        }

        return {
            success: true,
            message: 'User found successfully',
            data: user
        };

    } catch (err) {
        console.error('Error in FindUser:', err.message);
        return {
            success: false,
            message: err.message,
            data: null
        };
    }
}
async function LoadAllUsers() {
    try {
        // جلب جميع المستخدمين من قاعدة البيانات
        const { data: users, error } = await supabase
        .from('usersT')
        .select('*')
        .neq('instantToken', null);
                  ; // يمكنك إضافة ترتيب إذا أردت

        if (error) {
            throw error;
        }

        // إذا لم يتم العثور على أي مستخدمين
        if (!users || users.length === 0) {
            return {
                success: false,
                message: 'No users found',
                data: null
            };
        }

        // إنشاء Map من البيانات
        
        users.forEach(user => {
            usersMap.set(user.instantToken,user);
            console.error('Error in LoadAllUsers:', user.phoneNumber, user.instantToken);
        });

        return  users        ;

    } catch (err) {
        console.error('Error in LoadAllUsers:', err.message);
        return {
            success: false,
            message: err.message,
            data: null
        };
    }
}
function addUser(user) {
    usersMap.set(user.instantToken, user);
}
function getUsersMap() {
    return usersMap;
}




// Function to find a user based on instantToken and phoneNumber
async function findUserByInstantTokenAndPhone( phoneNumber,instantToken) {
    const { data: user, error } = await supabase
        .from('usersT')
        .select('*')
        .eq('instantToken', instantToken)
        .eq('phoneNumber', phoneNumber)
        .single();
        ;
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found" for single()
        console.error('Error finding user by instantToken and phone:', error);
        return { user: null, error };
    }
    return { user, error: null }; // Return null error if user is not found (PGRST116)
}

// Function to find a user by phone number and verify password
async function findUserByPhoneAndPassword(phoneNumber, password) {
    const { data: user, error } = await supabase
        .from('usersT')
        .select('id, username, phoneNumber, instantToken, password') // Make sure 'password' column is selected
        .eq('phoneNumber', phoneNumber)
        .eq('password', password)
        .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found" for single()
            console.error('Error finding user by instantToken and phone:', error);
            return { user: null, error };
        }
        return { user, error: null }; // Return null error if user is not found (PGRST116)
    
}

// Your main logic:
async function authenticateUser(instantToken, phoneNumber, password) {
    // 1. Try to find user by instantToken AND phoneNumber
    const { user: userByToken, error: tokenError } = await findUserByInstantTokenAndPhone(instantToken, phoneNumber);

    if (userByToken) {
        console.log('User authenticated via instantToken and phoneNumber.');
        return { success: true, user: userByToken };
    }

    // 2. If not found by token, try to find user by phoneNumber AND password
    // This part assumes 'password' is the plain-text password provided by the user for login
    if (password) { // Only attempt password lookup if a password is provided
        const { user: userByPassword, error: passwordError } = await findUserByPhoneAndPassword(phoneNumber, password);
        if (userByPassword) {
            console.log('User authenticated via phoneNumber and password.');
            return { success: true, user: userByPassword };
        } else {
            console.warn('Authentication failed:', passwordError.message);
            return { success: false, error: passwordError.message };
        }
    }

    // If neither condition is met
    console.warn('Authentication failed: No matching criteria met.');
    return { success: false, error: 'Authentication failed: Invalid credentials or token.' };
}


async function getMonthlyMessageStats(sessionId) {
    try {
        // يمكنك هنا جلب جميع الرسائل ثم تجميعها برمجياً،
        // أو استخدام استعلامات Supabase المعقدة إذا كانت لديك دوال مخصصة (PostgreSQL functions).
        // للطريقة الأبسط، سنقوم بجلبها ثم تجميعها في Node.js.
      //  .select('socket_id,to_number, from_number, direction,message_content, created_at, timestamp') // حدد الأعمدة التي تحتاجها
      
        const { data, error } = await supabase
            .from('messages')
            .select('timestamp, direction')
            .eq('socket_id', sessionId)
            .gte('timestamp', new Date(new Date().getFullYear(), 0, 1).toISOString()) // جلب رسائل هذا العام فقط
            .order('timestamp', { ascending: true }); // ترتيب حسب التاريخ

        if (error) {
            logger.error('Error fetching message stats:', error);
            throw error;
        }

        const stats = {
            'sent': new Array(12).fill(0), // 12 شهراً للرسائل المرسلة
            'received': new Array(12).fill(0), // 12 شهراً للرسائل الواردة
            'labels': Array.from({length: 12}, (_, i) => new Date(0, i).toLocaleString('ar', { month: 'long' })) // أسماء الشهور باللغة العربية
        };

        data.forEach(message => {
            const date = new Date(message.timestamp);
            const month = date.getMonth(); // 0 for Jan, 1 for Feb, etc.

            if (message.direction === 'sent') {
                stats.sent[month]++;
            } else if (message.direction === 'received') {
                stats.received[month]++;
            }
        });

        return stats;

    } catch (err) {
        logger.error('Supabase get monthly message stats error:', err);
        throw err;
    }
}
// في supabaseService.js
async function getLatestMessages(sessionId, direction, limit = 5) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('socket_id,to_number, from_number, direction,message_content, created_at, timestamp') // حدد الأعمدة التي تحتاجها
            .eq('session_id', sessionId)
            .eq('direction', direction)
            .order('timestamp', { ascending: false }) // الأحدث أولاً
            .limit(limit);
        if (error) throw error;
        return data;
    } catch (err) {
        logger.error(`Error fetching latest ${direction} messages:`, err);
        throw err;
    }
}
async function getallmassage(sessionId, type,limit = 150) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*') // حدد الأعمدة التي تحتاجها
            .eq('socket_id', sessionId)
            .eq('direction', type)
           
            .order('timestamp', { ascending: false }) // الأحدث أولاً
            .limit(limit);
            ;
        if (error) throw error;
        return data;
    } catch (err) {
        logger.error(`Error fetching latest ${direction} messages:`, err);
        throw err;
    }
}

// لا تنسَ تصدير هذه الدوال الجديدة في `module.exports`

// في supabaseService.js
async function getTotalMessagesCount(sessionId, direction) {
    try {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('session_id', sessionId)
            .eq('direction', direction);
        if (error) throw error;
        return count;
    } catch (err) {
        logger.error(`Error fetching total ${direction} messages count:`, err);
        throw err;
    }
}

// How to call it:
// const result = await authenticateUser(req.body.instantToken, req.body.phoneNumber, req.body.password);
// if (result.success) {
//     // User is authenticated, proceed
// } else {
//     // Authentication failed, send error
// }
module.exports = {
    supabase ,
    saveMessage,
    saveNewUser,
    FindUser,
    LoadAllUsers,
    getUsersMap ,
    findUserByPhoneAndPassword,
    findUserByInstantTokenAndPhone,
    getMonthlyMessageStats,
    getallmassage ,
    getLatestMessages,
    getTotalMessagesCount,
    saveMessagemadia,
    getmywhere,
    getcostumeraccunt,
    insertSubsaginTotalRecords,
    getFilteredSubsaginData,
    gettype_accunt,
    getAccounts,
    getCurrencies,
    GetRowFromTabl,
    insernumper,
    get_account_statement_ordered,
    getaccountincostumerstatement,
    insertusernew
};




async function GetRowFromTabl(  phonefrom,date) {
    try {
        // Validate input parameters
        if (!phonefrom) {
            throw new Error('Phone number is required');
        }

        // Fetch account details with limit of 200
        const { data: ditalsaccount, error: userError, count } = await supabase
            .from('gaid')
            .select('*', { count: 'exact' })
            .eq('phoneid', phonefrom)
            .eq('date', date)
            .order('numbergaid', { ascending: false }); // الترتيب التنازلي حسب تاريخ الإنشاء

                // Assuming you want newest first
           

        if (userError) {
            console.error('Error fetching account details:', userError);
            throw userError;
        }

        // Log some debug info
        console.log(`Found ${ditalsaccount?.length || 0} records (out of ${count}) for phone: ${phonefrom}`);

        return {
            success: true,
            data: ditalsaccount,
            count: ditalsaccount?.length,
            totalCount: count
        };

    } catch (error) {
        console.error('Error in getcostumeraccunt:', error);
        return {
            success: false,
            error: error.message,
            data: null,
            count: 0
        };
    }
}
//ارجاع كافة الحسابات الموجودة في هذا الفرع



async function getcostumeraccunt( sessionId_param, phonefrom) {
    try {
        // Validate input parameters
        if (!phonefrom) {
            throw new Error('Phone number is required');
        }

        // Fetch account details with limit of 200
        const { data: ditalsaccount, error: userError, count } = await supabase
            .from('gaid')
            .select('*', { count: 'exact' })
            .eq('phoneid', phonefrom)
                // Assuming you want newest first
            .limit(200);

        if (userError) {
            console.error('Error fetching account details:', userError);
            throw userError;
        }

        // Log some debug info
        console.log(`Found ${ditalsaccount?.length || 0} records (out of ${count}) for phone: ${phonefrom}`);

        return {
            success: true,
            data: ditalsaccount,
            count: ditalsaccount?.length,
            totalCount: count
        };

    } catch (error) {
        console.error('Error in getcostumeraccunt:', error);
        return {
            success: false,
            error: error.message,
            data: null,
            count: 0
        };
    }
}
    // If no SMS records found, return empty
    

    /*
    
    SELECT        type_accunt.name_accunt,gaid.subsagin_ty_s, gaid.subsagin_ty, sum(gaid.dain) as dain, sum(gaid.madin)as madin,sum(gaid.madin-gaid.dain) as blanc , tblsms.namber_recive, subsagintotal.namesubsagin,
      tblsms.phoneid as phoneNumber,(select username from usersT  where phoneNumber=tblsms.phoneid) as username                  
        FROM            tblsms INNER JOIN
                         gaid ON tblsms.subsagin_ty = gaid.subsagin_ty INNER JOIN
                         type_accunt ON gaid.subsagin_ty_s = type_accunt.subsagin_ty_s INNER JOIN
                         subsagintotal ON gaid.subsagin_ty = subsagintotal.subsagin_ty
						  where subsagintotal.phoneid= type_accunt.phoneid and  gaid.phoneid= tblsms.phoneid and subsagintotal.phoneid=   gaid.phoneid
          GROUP BY type_accunt.name_accunt,gaid.subsagin_ty_s, gaid.subsagin_ty,  tblsms.name_recive, subsagintotal.namesubsagin, subsagintotal.subnumber, type_accunt.subnumber, gaid.subnumber, tblsms.subnumber
		  having tblsms.namber_recive=phoneid
    */

    async function getmywhere333(phoneid) {
        try {
            // Fetch SMS records first (more selective query)
            const { data: smsRecords, error: smsError } = await supabase
                .from('tblsms')
                .select('*')
                .or(`namber_recive.eq.${phoneid.slice(3)},namber_recive.eq.${phoneid}`);
    
            if (smsError) {
                console.error('Error fetching SMS records:', smsError);
                throw smsError;
            }
    
            // If no SMS records found, return empty
            if (!smsRecords || smsRecords.length === 0) {
                return { clients: [] };
            }
    
            // Get unique phone numbers from SMS records
            const uniquePhoneNumbers = [...new Set(smsRecords.map(sms => sms.phoneid))];
    
            // Fetch only relevant users
            const { data: users, error: usersError } = await supabase
                .from('usersT')
                .select('username,phoneNumber')
                .in('phoneNumber', uniquePhoneNumbers);
    
            if (usersError) {
                console.error('Error fetching users:', usersError);
                throw usersError;
            }
    
            // Create a map to avoid duplicates
            const uniqueUsersMap = new Map();
            users.forEach(user => {
                if (!uniqueUsersMap.has(user.phoneNumber)) {
                    uniqueUsersMap.set(user.phoneNumber, user);
                }
            });
    
            await Promise.all(Array.from(uniqueUsersMap.values()).map(async (client) => {
                const subsagin_ty = smsRecords.find(acc => acc.phoneid === client.phoneNumber)?.subsagin_ty;
                if (!subsagin_ty) return;
            
                const { data, error } = await supabase.rpc('get_balance2', {
                    p_subsagin_ty: subsagin_ty,
                    p_phoneid: client.phoneNumber
                });
            
                if (error) {
                    console.error('Error fetching balance:', error);
                    throw error;
                }
            


               if (data && data.length > 0) {
        // إنشاء مصفوفة balances داخل العميل لتخزين جميع الأرصدة
              client.balances = data.map((balanceInfo) => ({
               blanc: balanceInfo.blanc,
            state: balanceInfo.state,
            subsagin_ty_s: balanceInfo.subsagin_ty_s,
            subsagin_ty: balanceInfo.subsagin_ty,
            currency: balanceInfo.currency // إضافة العملة إذا كانت موجودة في البيانات
            }))
                 };

              
            }));
            
            return {
                clients: Array.from(uniqueUsersMap.values()),
                smsRecords
            };

        
    
        } catch (err) {
            console.error('Error in getmywhere:', err);
            throw err;
        }
    }

    async function getmywhere(phoneid) {
        try {
            // Fetch account summary data
            const { data: smsRecords, error } = await supabase.
            rpc('get_account_summary', { p_phoneid: phoneid });
            
            if (error) {
                console.error('Error fetching balance:', error);
                throw error;
            }
            
            console.log("smsRecords:", smsRecords);
    
            // Group records by phoneNumber (client)
            const clientsMap = new Map();
            
            const uniquePhoneNumbers = [...new Set(smsRecords.map(sms => sms.phonenumber))];
    
            // Fetch only relevant users
            const { data: users, error: usersError } = await supabase
                .from('usersT')
                .select('*')
                .in('phoneNumber', uniquePhoneNumbers);
    
            if (usersError) {
                console.error('Error fetching users:', usersError);
                throw usersError;
            }
    
            console.error('users  :', users);
            smsRecords.forEach((record,index) => {
                const phoneNumber = record.phonenumber +record.subsagin_ty;
                

                if (!clientsMap.has(phoneNumber)) {
                    clientsMap.set(phoneNumber, {
                        phoneNumber:  record.phonenumber,
                        username: users.find(acc=> 
                        acc.phoneNumber===record.phonenumber)?.username,
                        namesubsagin: record.namesubsagin,
                        subsagin_ty: record.subsagin_ty,
                        balances: []
                    });
                }
                
                let client = clientsMap.get(phoneNumber);
                
                // Add balance record
                client.balances.push({
                    subsagin_ty: record.subsagin_ty,
                    subsagin_ty_s: record.subsagin_ty_s,
                    name_accunt: record.name_accunt,
                    dain: record.dain,
                    madin: record.madin,
                    blanc: record.blanc,
                    namber_recive: record.namber_recive,
                    namesubsagin: record.namesubsagin
                });
            });
    
            // Convert map to array of clients
            const clients = Array.from(clientsMap.values());
            console.error('Error in getmywhere:', clients);
            return {
                clients: clients,
              //  currencies: await getCurrencies() // Optional: include currencies if needed
            };
    
        } catch (err) {
            console.error('Error in getmywhere:', err);
            throw err;
        }
    }
    
    // Helper function to get currencies (if needed)
    async function getCurrencies() {
        const { data, error } = await supabase
            .from('type_accunt')
            .select('subsagin_ty_s, name_accunt');
        
        if (error) throw error;
        return data;
    }
   

    async function getPhoneMatches() {
        try {
          // 1. استدعاء الدالة المخزنة بدون .select()
          const { data, error } = await supabase
          .from('tblsms')
          .select(`
            namber_recive,
            exactMatch:usersT!inner(phoneNumber),
            partialMatch:usersT!inner(phoneNumber)
          `)
          .or('and(exactMatch.phoneNumber.eq.namber_recive),and(partialMatch.phoneNumber.like.*.namber_recive)');
          
          if (error) throw error;
      
          // 2. التحقق من البيانات
          if (!data || data.length === 0) {
            console.log('لا توجد نتائج متطابقة');
            return [];
          }
      
          // 3. إرجاع البيانات
          return data;
      
        } catch (error) {
          console.error('حدث خطأ في جلب المطابقات:', error);
          throw error;
        }
      }
      
      async function getUnmatchedPhones() {
        try {
          const { data, error } = await supabase
            .rpc('get_phone_matchesdetail')
            .select('namber_recive, exact_match, partial_match')
            .is('exact_match', null)
            .is('partial_match', null);
      
          if (error) throw error;
          
          console.log('الأرقام غير المطابقة:', data);
          return data;
          
        } catch (error) {
          console.error('حدث خطأ في جلب الأرقام غير المطابقة:', error);
          return [];
        }
      }
      // طريقة الاستخدام
      async function insertusernew() {
      try{  
          // 1. استدعاء البيانات من Supabase
          const  data  = await getUnmatchedPhones();
       
      
          for (const record of data) {
            
              // التحقق من وجود رقم الهاتف
              if (!record?.namber_recive) {
                console.warn('تخطي سجل بدون رقم هاتف');
                continue;
              }
      
              const phoneId = record.namber_recive.length < 10 ? '967' + record.namber_recive : record.namber_recive;
              console.log(phoneId);  
              // التحقق من شروط الرقم
             
              const createToken = () => {
                return Math.random().toString(36).substring(2) + Date.now().toString(36);
              };
              
              const instantToken = createToken();
              console.log(instantToken); // مثال: "7f2b3a1cjk1630456323456"
              3. 
              // 4. إنشاء مستخدم جديد وإضافة السجلات
              const CONTENTUSER = {
                username: 'username',
                password: phoneId,
                phoneNumber: phoneId,
                instantToken: instantToken
              };
                                try {
                                    await saveNewUser(CONTENTUSER);
                                } catch (error) {
                                    
                                }            
                                            
                                try {
                                    await insertSubsaginTotalRecords(phoneId);
                                } catch (error) {
                                
                                }   
           
             
              console.log(`تمت معالجة الرقم بنجاح: ${phoneId}`);
      
            }
        
            } catch (innerError) {
              console.error(`خطأ في معالجة الرقم ${record.namber_recive || 'غير معروف'}:`, innerError);
            }
           }
    ///////////////////////
    
///////////////////////////
async function insertSubsaginTotalRecords(phoneid) {


//const { data, error } = await supabase.rpc('insertSubsaginTotalRecords', {phoneid});
//return data;

     
    try {
      const records = [
        { subsagin_ty: '0221', namesubsagin: 'الصندوق العام', a: null, b: null, c: null, f: 'متحرك', g: '0221', sagin_id: '1', phoneid: `${phoneid}`, subsagin: '022' },
        { subsagin_ty: '0291', namesubsagin: 'المخزن العام', a: null, b: null, c: null, f: 'متحرك', g: null, sagin_id: '2', phoneid: `${phoneid}`, subsagin: '029' },
        { subsagin_ty: '1111', namesubsagin: 'راس المال', a: null, b: null, c: null, f: 'متحرك', g: '1111', sagin_id: '3', phoneid: `${phoneid}`, subsagin: '111' },
        { subsagin_ty: '1241', namesubsagin: 'ايرادات', a: null, b: null, c: null, f: 'متحرك', g: '1241', sagin_id: '4', phoneid: `${phoneid}`, subsagin: '124' },
        { subsagin_ty: '1242', namesubsagin: 'عمولة1', a: null, b: null, c: null, f: 'متحرك', g: '1242', sagin_id: '5', phoneid: `${phoneid}`, subsagin: '124' },
        { subsagin_ty: '1243', namesubsagin: 'عمولة2', a: null, b: null, c: null, f: 'متحرك', g: '1243', sagin_id: '6', phoneid: `${phoneid}`, subsagin: '124' },
        { subsagin_ty: '1244', namesubsagin: 'خصم', a: null, b: null, c: null, f: 'متحرك', g: '1244', sagin_id: '7', phoneid: `${phoneid}`, subsagin: '124' },
        { subsagin_ty: '1251', namesubsagin: 'مصاريف عامة', a: null, b: null, c: null, f: 'متحرك', g: '1251', sagin_id: '8', phoneid: `${phoneid}`, subsagin: '125' },
        { subsagin_ty: '1271', namesubsagin: 'الارباح والخسائر', a: null, b: null, c: null, f: 'متحرك', g: '1271', sagin_id: '9', phoneid: `${phoneid}`, subsagin: '127' },
        { subsagin_ty: '1281', namesubsagin: 'امانة', a: null, b: null, c: null, f: 'متحرك', g: '1281', sagin_id: '10', phoneid: `${phoneid}`, subsagin: '128' },
        { subsagin_ty: '1211', namesubsagin: 'حساب_المتاجرة', a: null, b: null, c: null, f: 'متحرك', g: '1211', sagin_id: '11', phoneid: `${phoneid}`, subsagin: '121' },
        { subsagin_ty: '1201', namesubsagin: 'ايجار', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '0291', sagin_id: '12', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1202', namesubsagin: 'تسهيلات', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '0291', sagin_id: '13', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1203', namesubsagin: 'جماريك', a: 'الاجمالي', b: null, c: null, f: 'متحرك', g: '0291', sagin_id: '14', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1204', namesubsagin: 'ضرائب', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '0291', sagin_id: '15', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1205', namesubsagin: 'تامين', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '0291', sagin_id: '16', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1206', namesubsagin: 'خصم_مسموح_بة', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '0291', sagin_id: '17', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1207', namesubsagin: 'عمولة مكتسبة', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '0291', sagin_id: '18', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1201001', namesubsagin: 'قيمة مواد', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '1201001', sagin_id: '19', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1201002', namesubsagin: 'ضريبه مبيعات مستحقه', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '1201002', sagin_id: '28', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1201003', namesubsagin: 'جمركيه ونقل وتخزين', a: 'الوزن', b: null, c: null, f: 'متحرك', g: '1201003', sagin_id: '29', phoneid: `${phoneid}`, subsagin: '120' },
        { subsagin_ty: '1252', namesubsagin: 'فارق سعر صرف', a: null, b: null, c: null, f: 'متحرك', g: '1252', sagin_id: '30', phoneid: `${phoneid}`, subsagin: '125' },
        { subsagin_ty: '1253', namesubsagin: 'اهلاك الاصول', a: null, b: null, c: null, f: 'متحرك', g: '1253', sagin_id: '31', phoneid: `${phoneid}`, subsagin: '125' },
        { subsagin_ty: '1254', namesubsagin: 'الديون المعدومة', a: null, b: null, c: null, f: 'متحرك', g: '1254', sagin_id: '32', phoneid: `${phoneid}`, subsagin: '125' }
      ];
      const subsagintotal =await savedatafrst (records,'subsagintotal',phoneid,'sagin_id');

      const data = [
        { sagintype: '02', subsagin: '020', subname: 'فواتير صادرة', other: '0', idsys: '1'},
        {sagintype: '02', subsagin: '021', subname: 'العميل', other: '0', idsys: '2'},
        { sagintype: '02', subsagin: '022', subname: 'خزينه', other: '0', idsys: '3'},
        { sagintype: '02', subsagin: '023', subname: 'العمال', other: '0', idsys: '4'},
        { sagintype: '02', subsagin: '024', subname: 'الصرافين', other: '0', idsys: '5'},
        { sagintype: '02', subsagin: '025', subname: 'مجموعة فارغة2', other: '-1', idsys: '6'},
        { sagintype: '02', subsagin: '026', subname: 'عملاء التقسيط', other: '-1', idsys: '7'},
        { sagintype: '02', subsagin: '027', subname: 'مجموعة فارغة3', other: '-1', idsys: '8'},
        { sagintype: '02', subsagin: '028', subname: 'مجموعة فارغة4', other: '-1', idsys: '9'},
        { sagintype: '02', subsagin: '029', subname: 'المستودعات', other: '0', idsys: '10'},
        { sagintype: '11', subsagin: '111', subname: 'راس المال', other: '-1', idsys: '11'},
        { sagintype: '12', subsagin: '120', subname: 'تكاليف_البضاعة', other: '-1', idsys: '12'},
        { sagintype: '12', subsagin: '121', subname: 'حساب_المتاجرة', other: '-1', idsys: '13'},
        { sagintype: '12', subsagin: '122', subname: 'الموردين', other: '0', idsys: '14'},
        { sagintype: '12', subsagin: '123', subname: 'الفواتير الواردة', other: '0', idsys: '15'},
        { sagintype: '12', subsagin: '124', subname: 'الايرادات', other: '0', idsys: '16'},
        { sagintype: '12', subsagin: '125', subname: 'المصاريف', other: '0', idsys: '17'},
        { sagintype: '12', subsagin: '126', subname: 'مجموعة فارغة5', other: '-1', idsys: '18'},
        { sagintype: '12', subsagin: '127', subname: 'ارباح وخسائر', other: '-1', idsys: '19'},
        { sagintype: '12', subsagin: '128', subname: 'امانات', other: '-1', idsys: '20'},
        { sagintype: '12', subsagin: '129', subname: 'حسابات البسطه', other: '0', idsys: '21'}
    ];
   const subsystem_ty=await savedatafrst (data,'subsystem_ty',phoneid,'idsys');
   const currancy = [
    { subsagin_ty_s: '-0', name_accunt: 'يمني',  chgepric: 1,type_opt:'عملة' ,activity: '1',id_currancy:1, phoneid: `${phoneid}`},
    { subsagin_ty_s: '-1', name_accunt: 'سعودي',  chgepric: 140,type_opt:'عملة' ,activity: '1',id_currancy:2, phoneid: `${phoneid}`},
    { subsagin_ty_s: '-2', name_accunt: 'دولار',  chgepric: 540,type_opt:'عملة' ,activity: '1',id_currancy:3, phoneid: `${phoneid}`}]
    
    const type_accunt=await savedatafrst (currancy,'type_accunt',phoneid,'id_currancy');
   
   return {
    success: true,
   
    subsagintotal: subsagintotal.insertedRecords,
    subsystem_ty: subsystem_ty.insertedRecords,
    type_accunt: type_accunt.insertedRecords,
    errors
};

    }catch(err){}

}
     
async function savedatafrst(messagesArray, tablname, phone_from, ref_no) {
    const insertedRecords = [];
    const skippedRecords = [];
    const errors = [];

    // Prepare data for insertion
    const recordsToInsert = messagesArray.map(message => ({
        ...message,
        phoneid: phone_from
    }));

    try {
        // 1. Check for existing records
        const refNos = recordsToInsert.map(r => r[ref_no]); // Fixed template literal syntax
        const { data: existingRecords, error: fetchError } = await supabase
            .from(tablname)
            .select(`${ref_no}, phoneid`)
            .in(ref_no, refNos)  // Removed template literal
            .eq('phoneid', phone_from);

        if (fetchError) throw fetchError;

        // 2. Filter only new records
        const existingRefNos = existingRecords.map(r => r[ref_no]); // Use dynamic ref_no
        const newRecords = recordsToInsert.filter(
            record => !existingRefNos.includes(record[ref_no]) // Use dynamic ref_no
        );

        // 3. Insert new records in batch
        if (newRecords.length > 0) {
            const { data: insertedData, error: insertError } = await supabase
                .from(tablname)
                .insert(newRecords)
                .select();

            if (insertError) throw insertError;
            insertedRecords.push(...insertedData);
        }

        // 4. Collect skipped records
        skippedRecords.push(...recordsToInsert.filter(
            record => existingRefNos.includes(record[ref_no]) // Use dynamic ref_no
        ));

        return {
            success: true,
            insertedCount: insertedRecords.length,
            skippedCount: skippedRecords.length,
            insertedRecords,
            skippedRecords,
            errors
        };
    } catch (err) {
        console.error('Error in bulk save:', err);
        errors.push(err.message);
        return {
            success: false,
            insertedCount: 0,
            skippedCount: 0,
            insertedRecords: [],
            skippedRecords: [],
            errors
        };
    }
}



async function getFilteredSubsaginData(session_id,phoneid) {
  try {
    const { data, error } = await supabase
      .from('subsagintotal')
      .select('subsagin_ty, namesubsagin, g, f, phoneid')
      .eq('phoneid', phoneid)
      .not('subsagin', 'in', '("020","123")')
      .or('f.eq.متحرك,f.eq.') // For empty string
      // Alternative if the above doesn't work:
      // .or('f.eq.متحرك,f.is.null') // If you also want to include NULL values

    if (error) {
      throw error;
    }

    console.log('Filtered subsagin data:', data);
    return data;
    
  } catch (error) {
    console.error('Error fetching subsagin data:', error);
    return null;
  }
}
async function gettype_accunt(session_id,phoneid) {
    try {
      const { data, error } = await supabase
        .from('type_accunt')
        .select('subsagin_ty_s, name_accunt, chgepric, phoneid')
        .eq('phoneid', phoneid)
      
       
        // Alternative if the above doesn't work:
        // .or('f.eq.متحرك,f.is.null') // If you also want to include NULL values
  
      if (error) {
        throw error;
      }
  
      console.log('Filtered  data:', data);
      return data;
      
    } catch (error) {
      console.error('Error fetching  data:', error);
      return null;
    }
  }

// جلب الحسابات
async function getAccounts(sessionId, phoneId) {
    try {

        // const { data, error } = await supabase.rpc('execute_sql', {
        //     query: `
        //       SELECT s.subsagin_ty, s.namesubsagin, s.subsagin, 
        //              t.subname, sm.namber_recive
        //       FROM subsagintotal s
        //       INNER JOIN subsystem_ty t 
        //         ON s.subsagin = t.subsagin AND s.phoneid = t.phoneid
        //       LEFT JOIN tblsms sm 
        //         ON s.subsagin_ty = sm.subsagin_ty AND s.phoneid = sm.phoneid
        //       WHERE s.phoneid = '${phoneId}'
        //     `
        //   });
        const { data, error } = await  getFilteredSubsaginData(sessionId, phoneId)
        
        // supabase.rpc('get_accounts_by_phone', {
        //           phone: phoneId
        //   })
         
        //   .not('subsagin', 'in', '("020","123")')
        
        //   ;
         if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
    }
}

async function insernumper() {
    const { data, error } = await supabase.rpc('insert_number_sms_global');
if (error) {
  console.error('❌ فشل التنفيذ:', error.message);
} else {
  console.log('✅ تم إدخال السجلات المفقودة في tblsms بنجاح');
}
    
}
// جلب العملات
async function getCurrencies(sessionId, phonefrom) {
    try {
        const { data, error } = await supabase
        .from('type_accunt')
        .select('subsagin_ty_s, name_accunt, chgepric, phoneid')
        .eq('phoneid', phonefrom);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching currencies:', error);
        throw error;
    }
}

// كشف حساب

function formatDate(date) {
    // If date is already in 'yyyy-mm-dd' format, return it
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // If date is a string that can be parsed
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    // If it's not a Date object by now, handle the error
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('Invalid date:', date);
      return null; // or return a default date, or throw an error
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  

async function get_account_statement_ordered( inf,phoneid)
    {
 try{   


const data = await getAccountStatement3(
     inf.p_account_code,
     inf.p_currency_code,
    formatDate(inf.p_start_date),
   formatDate(inf.p_end_date),
  phoneid
);
  
 
  return data;
} catch (error) {
  console.error('Error fetching currencies:', error);
  throw error;
}
}
async function getaccountincostumerstatement( inf,phoneid)
    {
 try{   


const data = await getAccountStatement3(
     inf.p_account_code,
     inf.p_currency_code,
     formatDate(inf.p_start_date),
     formatDate(inf.p_end_date),
      phoneid
);
  
 
  return data;
} catch (error) {
  console.error('Error fetching currencies:', error);
  throw error;
}
}




async function getAccountStatement3(accountCode, currencyCode, startDate, endDate, phoneId)
 {
   
   
    const { data, error } = await supabase
      .rpc('accountstatement3', {
        p_account_code: accountCode,
        p_currency_code: currencyCode,
        p_start_date: startDate,
        p_end_date: endDate,
        p_phoneid: phoneId
      });
  
    if (error) {
      throw error;
    }
    
    return data.sort((a, b) => a.row_order - b.row_order);
}
  
//   // مثال للاستخدام
//   try {
//     const statement = await getAccountStatement('0221', '-0', '2025-05-01', '2025-07-01', '123456789');
//     console.log(statement);
//   } catch (err) {
//     console.error('Failed to get account statement:', err);
//   }