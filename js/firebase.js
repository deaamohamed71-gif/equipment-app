// js/firebase.js - دوال Firebase المشتركة (محدثة بالكامل)
// ============================================================
//  يدعم: Auth, Firestore, Storage
//  يدعم: إدارة المستخدمين، التراخيص، الصلاحيات (Roles)
// ============================================================

// ====== استيراد Firebase SDK ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    deleteUser,
    updateProfile,
    updateEmail,
    updatePassword,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    getDocs,
    setDoc, 
    updateDoc, 
    deleteDoc, 
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    increment,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    uploadString,
    getDownloadURL, 
    deleteObject,
    listAll,
    getMetadata,
    updateMetadata
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ====== إعدادات Firebase ======
const firebaseConfig = {
    apiKey: "AIzaSyCZ-7iiOf1-_DObFFzc67oRMMDDCLzCoac",
    authDomain: "equipment-license-system.firebaseapp.com",
    projectId: "equipment-license-system",
    storageBucket: "equipment-license-system.firebasestorage.app",
    messagingSenderId: "452293810382",
    appId: "1:452293810382:web:44e16f934ff76d8db4c92f",
    measurementId: "G-2BVY6Z9WQKS"
};

// ====== تهيئة Firebase ======
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('🔥 Firebase initialized successfully');

// ============================================================
//  1. جعل الكائنات متاحة عالمياً (للوصول من أي مكان)
// ============================================================
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

// ============================================================
//  2. دوال Auth (المصادقة)
// ============================================================
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.sendEmailVerification = sendEmailVerification;
window.sendPasswordResetEmail = sendPasswordResetEmail;
window.onAuthStateChanged = onAuthStateChanged;
window.signOut = signOut;
window.deleteUser = deleteUser;
window.updateProfile = updateProfile;
window.updateEmail = updateEmail;
window.updatePassword = updatePassword;
window.signInAnonymously = signInAnonymously;

// ============================================================
//  3. دوال Firestore
// ============================================================
window.doc = doc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.collection = collection;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.limit = limit;
window.onSnapshot = onSnapshot;
window.addDoc = addDoc;
window.serverTimestamp = serverTimestamp;
window.arrayUnion = arrayUnion;
window.arrayRemove = arrayRemove;
window.increment = increment;
window.runTransaction = runTransaction;

// ============================================================
//  4. دوال Storage
// ============================================================
window.ref = ref;
window.uploadBytes = uploadBytes;
window.uploadString = uploadString;
window.getDownloadURL = getDownloadURL;
window.deleteObject = deleteObject;
window.listAll = listAll;
window.getMetadata = getMetadata;
window.updateMetadata = updateMetadata;

// ============================================================
//  5. دوال إدارة المستخدمين (Users Management)
// ============================================================

/**
 * إنشاء مستخدم جديد في Firebase Auth + Firestore
 */
window.createUserWithProfile = async function(email, password, displayName, role = 'user', phone = '') {
    try {
        // 1. إنشاء المستخدم في Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 2. تحديث الاسم في Auth
        await updateProfile(user, { displayName: displayName || email.split('@')[0] });
        
        // 3. حفظ بيانات المستخدم في Firestore
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: displayName || user.displayName || email.split('@')[0],
            phone: phone || '',
            role: role || 'user',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            emailVerified: user.emailVerified || false,
            lastLogin: serverTimestamp(),
            settings: {
                theme: 'light',
                language: 'ar',
                notifications: true
            }
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        
        console.log('✅ User created successfully:', user.uid);
        return { success: true, user: user, uid: user.uid };
    } catch (error) {
        console.error('❌ Error creating user:', error);
        return { success: false, error: error.message };
    }
};

/**
 * جلب بيانات مستخدم من Firestore
 */
window.getUserProfile = async function(uid) {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'User not found' };
        }
    } catch (error) {
        console.error('❌ Error getting user profile:', error);
        return { success: false, error: error.message };
    }
};

/**
 * تحديث بيانات مستخدم في Firestore
 */
window.updateUserProfile = async function(uid, updates) {
    try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('✅ User profile updated:', uid);
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating user profile:', error);
        return { success: false, error: error.message };
    }
};

/**
 * حذف مستخدم (من Auth + Firestore)
 */
window.deleteUserAccount = async function(uid) {
    try {
        // 1. حذف من Firestore
        await deleteDoc(doc(db, 'users', uid));
        
        // 2. حذف من Auth (يتطلب مصادقة)
        // يتم تنفيذها من جهة العميل مع مستخدم مسجل دخول
        // يمكن حذفها من Firestore فقط إذا لم يكن المستخدم مسجل دخول
        
        console.log('✅ User deleted from Firestore:', uid);
        return { success: true };
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        return { success: false, error: error.message };
    }
};

/**
 * جلب جميع المستخدمين (للمطورين فقط)
 */
window.getAllUsers = async function() {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const users = [];
        querySnapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        return { success: true, users: users };
    } catch (error) {
        console.error('❌ Error getting all users:', error);
        return { success: false, error: error.message };
    }
};

/**
 * تغيير صلاحية مستخدم (Role)
 */
window.updateUserRole = async function(uid, newRole) {
    try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, {
            role: newRole,
            updatedAt: serverTimestamp()
        });
        console.log(`✅ User role updated to ${newRole}:`, uid);
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating user role:', error);
        return { success: false, error: error.message };
    }
};

/**
 * تغيير حالة المستخدم (active/inactive/suspended)
 */
window.updateUserStatus = async function(uid, status) {
    try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, {
            status: status,
            updatedAt: serverTimestamp()
        });
        console.log(`✅ User status updated to ${status}:`, uid);
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating user status:', error);
        return { success: false, error: error.message };
    }
};

// ============================================================
//  6. دوال إدارة التراخيص (Licenses Management)
// ============================================================

/**
 * حفظ ترخيص في Firestore
 */
window.saveLicenseToFirestore = async function(licenseData) {
    try {
        const docRef = doc(db, 'licenses', licenseData.deviceId);
        await setDoc(docRef, {
            deviceId: licenseData.deviceId,
            userName: licenseData.userName || 'مستخدم',
            userPhone: licenseData.userPhone || '',
            plan: licenseData.plan || 'سنوية',
            expiryDate: licenseData.expiryDate,
            createdAt: licenseData.createdAt || new Date().toISOString(),
            status: licenseData.status || 'active',
            updatedAt: new Date().toISOString(),
            createdBy: licenseData.createdBy || null,
            notes: licenseData.notes || ''
        });
        console.log('✅ License saved to Firestore:', licenseData.deviceId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error saving license:', error);
        return { success: false, error: error.message };
    }
};

/**
 * جلب ترخيص من Firestore
 */
window.getLicenseFromFirestore = async function(deviceId) {
    try {
        const docRef = doc(db, 'licenses', deviceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'License not found' };
        }
    } catch (error) {
        console.error('❌ Error getting license:', error);
        return { success: false, error: error.message };
    }
};

/**
 * جلب جميع التراخيص من Firestore
 */
window.getAllLicenses = async function() {
    try {
        const licensesRef = collection(db, 'licenses');
        const querySnapshot = await getDocs(licensesRef);
        const licenses = [];
        querySnapshot.forEach(doc => {
            licenses.push({ deviceId: doc.id, ...doc.data() });
        });
        return { success: true, licenses: licenses };
    } catch (error) {
        console.error('❌ Error getting all licenses:', error);
        return { success: false, error: error.message };
    }
};

/**
 * تمديد ترخيص في Firestore
 */
window.extendLicenseInFirestore = async function(deviceId, days) {
    try {
        const docRef = doc(db, 'licenses', deviceId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            return { success: false, error: 'License not found' };
        }
        
        const currentData = docSnap.data();
        const currentExpiry = currentData.expiryDate ? new Date(currentData.expiryDate) : new Date();
        currentExpiry.setDate(currentExpiry.getDate() + days);
        
        await updateDoc(docRef, {
            expiryDate: currentExpiry.toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        console.log(`✅ License extended by ${days} days:`, deviceId);
        return { success: true, newExpiry: currentExpiry.toISOString() };
    } catch (error) {
        console.error('❌ Error extending license:', error);
        return { success: false, error: error.message };
    }
};

/**
 * حذف ترخيص من Firestore
 */
window.deleteLicenseFromFirestore = async function(deviceId) {
    try {
        await deleteDoc(doc(db, 'licenses', deviceId));
        console.log('✅ License deleted from Firestore:', deviceId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error deleting license:', error);
        return { success: false, error: error.message };
    }
};

/**
 * التحقق من صحة الترخيص من Firestore
 */
window.verifyLicenseWithFirebase = async function(deviceId) {
    try {
        const docRef = doc(db, 'licenses', deviceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { valid: false, message: "❌ مفتاح الترخيص غير موجود" };
        }

        const data = docSnap.data();

        if (data.status !== 'active') {
            return { valid: false, message: "❌ الترخيص غير نشط" };
        }

        const expiry = new Date(data.expiryDate);
        const now = new Date();
        if (now > expiry) {
            await updateDoc(docRef, { status: 'expired' });
            return { valid: false, message: "❌ انتهت صلاحية الترخيص" };
        }

        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        return { 
            valid: true, 
            message: "✅ ترخيص صالح",
            plan: data.plan || 'premium',
            expiryDate: data.expiryDate,
            userName: data.userName || '',
            userPhone: data.userPhone || '',
            daysLeft: daysLeft,
            data: data
        };
    } catch (error) {
        console.error("خطأ في التحقق من الترخيص:", error);
        return { valid: false, message: "⚠️ تعذر الاتصال بخادم الترخيص" };
    }
};

// ============================================================
//  7. دوال تسجيل الدخول والخروج
// ============================================================

/**
 * تسجيل دخول المستخدم
 */
window.loginUser = async function(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // تحديث آخر تسجيل دخول في Firestore
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
            lastLogin: serverTimestamp(),
            status: 'active'
        });
        
        console.log("✅ تم تسجيل الدخول بنجاح:", user.email);
        return { success: true, user: user };
    } catch (error) {
        console.error("❌ خطأ في تسجيل الدخول:", error);
        return { success: false, error: error.message };
    }
};

/**
 * تسجيل الخروج
 */
window.logoutUser = async function() {
    try {
        await signOut(auth);
        console.log("✅ تم تسجيل الخروج بنجاح");
        return { success: true };
    } catch (error) {
        console.error("❌ خطأ في تسجيل الخروج:", error);
        return { success: false, error: error.message };
    }
};

/**
 * إرسال رابط إعادة تعيين كلمة المرور
 */
window.resetPassword = async function(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log("✅ تم إرسال رابط إعادة التعيين إلى:", email);
        return { success: true };
    } catch (error) {
        console.error("❌ خطأ في إرسال رابط إعادة التعيين:", error);
        return { success: false, error: error.message };
    }
};

// ============================================================
//  8. دوال الصلاحيات (Roles & Permissions)
// ============================================================

/**
 * التحقق من صلاحيات المستخدم
 */
window.checkUserPermission = async function(uid, requiredRole) {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            return { allowed: false, error: 'User not found' };
        }
        
        const userData = docSnap.data();
        const userRole = userData.role || 'user';
        
        // ترتيب الصلاحيات من الأعلى للأدنى
        const roleHierarchy = {
            'super_admin': 5,
            'admin': 4,
            'manager': 3,
            'premium': 2,
            'user': 1
        };
        
        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        const allowed = userLevel >= requiredLevel;
        
        return { 
            allowed: allowed, 
            role: userRole,
            level: userLevel
        };
    } catch (error) {
        console.error('❌ Error checking permission:', error);
        return { allowed: false, error: error.message };
    }
};

/**
 * جلب جميع الصلاحيات المتاحة
 */
window.getAvailableRoles = function() {
    return {
        'super_admin': 'مدير عام (جميع الصلاحيات)',
        'admin': 'مدير (إدارة المستخدمين والتراخيص)',
        'manager': 'مدير مشروع (إدارة العروض)',
        'premium': 'مستخدم مدفوع (جميع الميزات)',
        'user': 'مستخدم عادي (الميزات المجانية)'
    };
};

// ============================================================
//  9. مراقبة حالة المصادقة
// ============================================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ المستخدم مسجل دخول:", user.email);
        
        // تحديث حالة المستخدم في Firestore
        try {
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                lastLogin: serverTimestamp(),
                status: 'active'
            });
        } catch (error) {
            console.warn('Could not update user status:', error);
        }
        
        // جعل المستخدم متاحاً عالمياً
        window.currentUser = user;
    } else {
        console.log("❌ المستخدم غير مسجل دخول");
        window.currentUser = null;
    }
});

// ============================================================
//  10. دوال مساعدة إضافية
// ============================================================

/**
 * التحقق من الاتصال بـ Firebase
 */
window.checkFirebaseConnection = async function() {
    try {
        const testRef = doc(db, 'system', 'connection_test');
        await setDoc(testRef, { 
            timestamp: serverTimestamp(),
            status: 'connected' 
        });
        console.log('✅ Firebase connection successful');
        return { success: true };
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * الحصول على الوقت الحالي من الخادم
 */
window.getServerTime = async function() {
    try {
        const testRef = doc(db, 'system', 'time_test');
        await setDoc(testRef, { timestamp: serverTimestamp() });
        const docSnap = await getDoc(testRef);
        return docSnap.data().timestamp.toDate();
    } catch (error) {
        console.error('❌ Error getting server time:', error);
        return new Date();
    }
};

console.log('✅ Firebase initialized successfully with all features');
console.log('📋 Available functions:');
console.log('  - createUserWithProfile(email, password, displayName, role, phone)');
console.log('  - getUserProfile(uid)');
console.log('  - updateUserProfile(uid, updates)');
console.log('  - deleteUserAccount(uid)');
console.log('  - getAllUsers()');
console.log('  - updateUserRole(uid, newRole)');
console.log('  - updateUserStatus(uid, status)');
console.log('  - saveLicenseToFirestore(licenseData)');
console.log('  - getLicenseFromFirestore(deviceId)');
console.log('  - getAllLicenses()');
console.log('  - extendLicenseInFirestore(deviceId, days)');
console.log('  - deleteLicenseFromFirestore(deviceId)');
console.log('  - verifyLicenseWithFirebase(deviceId)');
console.log('  - loginUser(email, password)');
console.log('  - logoutUser()');
console.log('  - resetPassword(email)');
console.log('  - checkUserPermission(uid, requiredRole)');
console.log('  - getAvailableRoles()');
console.log('  - checkFirebaseConnection()');
console.log('  - getServerTime()');
