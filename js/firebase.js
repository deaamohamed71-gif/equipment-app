// js/firebase.js - دوال Firebase المشتركة (محدثة مع Storage و Firestore)

// ====== استيراد Firebase SDK ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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

// ====== جعل الكائنات متاحة عالمياً ======
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

// ====== دوال Firestore ======
window.getFirestore = getFirestore;
window.doc = doc;
window.getDoc = getDoc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;

// ====== دوال Storage ======
window.getStorage = getStorage;
window.ref = ref;
window.uploadBytes = uploadBytes;
window.getDownloadURL = getDownloadURL;
window.deleteObject = deleteObject;

// ====== دوال Auth ======
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.onAuthStateChanged = onAuthStateChanged;

// ====== دالة التحقق من الترخيص من Firebase ======
window.verifyLicenseWithFirebase = async function(licenseKey) {
    try {
        const docRef = doc(db, "licenses", licenseKey);
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
            return { valid: false, message: "❌ انتهت صلاحية الترخيص" };
        }

        return { 
            valid: true, 
            message: "✅ ترخيص صالح",
            plan: data.plan || 'premium',
            expiryDate: data.expiryDate,
            userName: data.userName || '',
            userPhone: data.userPhone || ''
        };
    } catch (error) {
        console.error("خطأ في التحقق من الترخيص:", error);
        return { valid: false, message: "⚠️ تعذر الاتصال بخادم الترخيص، يرجى التحقق من اتصالك بالإنترنت." };
    }
};

// ====== دالة تسجيل الدخول ======
window.loginUser = async function(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ تم تسجيل الدخول بنجاح:", userCredential.user.email);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("❌ خطأ في تسجيل الدخول:", error);
        return { success: false, error: error.message };
    }
};

// ====== متابعة حالة المستخدم ======
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ المستخدم مسجل دخول:", user.email);
    } else {
        console.log("❌ المستخدم غير مسجل دخول");
    }
});

console.log("✅ Firebase تهيئته تمت بنجاح");
