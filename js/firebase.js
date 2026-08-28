// js/firebase.js - دوال Firebase المشتركة

// ====== Firebase SDK ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔑 إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCz-71iDf1_DDbFFzc67oRMHDDLczIcoac",
    authDomain: "equipment-license-system.firebaseapp.com",
    projectId: "equipment-license-system",
    storageBucket: "equipment-license-system.firebasestorage.app",
    messagingSenderId: "452293810382",
    appId: "1:452293810382:web:44e16f934ff76d8db4c92f",
    measurementId: "G-2BVY6Z9WQKS"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;

// ====== دالة التحقق من الترخيص ======
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
            expiryDate: data.expiryDate
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