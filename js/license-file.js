// js/license-file.js - نظام الترخيص بالملفات (محدث مع Firebase Auth و userId)

// ====== مفتاح التشفير ======
const ENCRYPTION_KEY = atob('RXF1aXBtZW50QXBwLTIwMjYtU2VjcmV0S2V5LSEhQCMk');

// ====== توليد معرف الجهاز ======
function generateDeviceId() {
    try {
        const screenInfo = `${window.screen?.width || 'unknown'}x${window.screen?.height || 'unknown'}`;
        const userAgent = navigator.userAgent || 'unknown';
        const platform = navigator.platform || 'unknown';
        const language = navigator.language || 'ar';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
        
        const raw = `${screenInfo}|${userAgent}|${platform}|${language}|${timezone}`;
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
        const parts = [];
        for (let i = 0; i < 4; i++) {
            parts.push(hex.substring(i * 4, (i + 1) * 4));
        }
        const prefixes = ['ASSAM', 'ACER', 'DELL', 'HP', 'LENO', 'MSI', 'ASUS'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return `${prefix}-${parts.join('-')}`;
    } catch (error) {
        console.error('Error generating device ID:', error);
        const fallback = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `DEV-${fallback}`;
    }
}

// ====== تشفير البيانات (يدعم العربية) ======
function encryptLicense(data) {
    try {
        const json = JSON.stringify(data);
        const encoded = encodeURIComponent(json);
        const encrypted = btoa(encoded);
        const signature = btoa(ENCRYPTION_KEY.substring(0, 10));
        return `${encrypted}.${signature}`;
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
}

// ====== فك تشفير البيانات (يدعم العربية) ======
function decryptLicense(encryptedData) {
    try {
        const parts = encryptedData.split('.');
        if (parts.length !== 2) return null;
        
        const [encrypted, signature] = parts;
        const expectedSignature = btoa(ENCRYPTION_KEY.substring(0, 10));
        
        if (signature !== expectedSignature) {
            return { valid: false, error: 'توقيع غير صالح' };
        }
        
        const decoded = atob(encrypted);
        const json = decodeURIComponent(decoded);
        const data = JSON.parse(json);
        return { valid: true, data };
    } catch (error) {
        console.error('Decryption error:', error);
        return { valid: false, error: 'ملف تالف أو غير صالح' };
    }
}

// ====== التحقق من صحة السيريال ======
function validateSerial(deviceId, plan) {
    const validSerials = {
        'monthly': ['ASSAM-MONTHLY-', 'DELL-MONTHLY-', 'HP-MONTHLY-'],
        'yearly': ['ASSAM-YEARLY-', 'DELL-YEARLY-', 'HP-YEARLY-']
    };
    
    if (plan === 'مجانية' || plan === 'trial') return true;
    
    const prefixes = validSerials[plan] || [];
    return prefixes.some(prefix => deviceId.startsWith(prefix));
}

// ====== التحقق من صحة بيانات المستخدم ======
function validateUserData() {
    const fullName = document.getElementById('userFullName')?.value.trim();
    const phone = document.getElementById('userPhone')?.value.trim();
    const plan = document.getElementById('userPlan')?.value;
    const deviceId = document.getElementById('deviceId')?.textContent || localStorage.getItem('device_id') || '';
    
    let errors = [];
    
    if (!fullName || fullName.split(' ').length < 2) {
        errors.push('الاسم الثلاثي (يجب أن يتكون من اسمين على الأقل)');
    }
    
    if (!phone || phone.length < 10) {
        errors.push('رقم الهاتف (يجب أن يكون 10 أرقام على الأقل)');
    }
    
    if (!plan || plan === '') {
        errors.push('الخطة (يجب اختيار خطة)');
    }
    
    if (!deviceId || deviceId === 'جاري التحميل...') {
        errors.push('معرف الجهاز (لم يتم تحميله بعد)');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        data: { fullName, phone, plan, deviceId }
    };
}

// ====== إنشاء ملف ترخيص (للمطور) ======
function generateLicenseFile(userData) {
    try {
        if (!validateSerial(userData.deviceId, userData.plan)) {
            showToast('❌ سيريال الجهاز غير صالح لهذه الخطة', 'error');
            return null;
        }
        
        const licenseData = {
            deviceId: userData.deviceId,
            userName: userData.userName || 'مستخدم مميز',
            userPhone: userData.userPhone || '',
            plan: userData.plan || 'سنوية',
            expiryDate: userData.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            version: '1.0',
            features: {
                maxItems: Infinity,
                maxOffers: Infinity,
                maxClients: Infinity,
                canExportPDF: true,
                canExportExcel: true,
                canReports: true,
                canSignatures: true,
                canFullDesign: true,
                canCharts: true,
                showWatermark: false,
                isPremium: true
            }
        };
        
        const encrypted = encryptLicense(licenseData);
        if (!encrypted) return null;
        
        const blob = new Blob([encrypted], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `license_${userData.deviceId.substring(0, 8)}.zlx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return licenseData;
    } catch (error) {
        console.error('Generate license error:', error);
        return null;
    }
}

// ============================================================
//  ✅ دوال المصادقة والتسجيل المجهول (للمستخدم العادي)
// ============================================================

/**
 * تسجيل دخول مجهول للمستخدم العادي (بدون بريد وكلمة مرور)
 * ده اللي هيسمحله يكتب في Firebase حسب القواعد الجديدة
 */
async function ensureAnonymousAuth() {
    try {
        const auth = window.firebaseAuth;
        if (!auth) {
            console.warn('⚠️ Firebase Auth غير متاح');
            return { success: false, error: 'Firebase Auth not available' };
        }
        
        // ✅ إذا كان المستخدم مسجل دخول بالفعل (حتى لو مجهول)
        if (auth.currentUser) {
            console.log('✅ المستخدم مسجل دخول بالفعل:', auth.currentUser.uid);
            return { success: true, user: auth.currentUser };
        }
        
        // ✅ تسجيل دخول مجهول
        const result = await window.signInAnonymously(auth);
        console.log('✅ تم تسجيل دخول مجهول:', result.user.uid);
        return { success: true, user: result.user };
        
    } catch (error) {
        console.error('❌ فشل تسجيل الدخول المجهول:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
//  حفظ الترخيص في Firebase (باستخدام المصادقة المجهولة + userId)
// ============================================================

async function saveLicenseToFirestore(licenseData) {
    try {
        // 1️⃣ التأكد من أن المستخدم مسجل دخول (مجهول)
        const authResult = await ensureAnonymousAuth();
        if (!authResult.success) {
            console.warn('⚠️ فشل تسجيل الدخول المجهول، سيتم التفعيل محلياً فقط');
            return { success: false, error: 'Auth failed', localOnly: true };
        }
        
        // 2️⃣ التحقق من وجود Firestore
        const db = window.firebaseDB;
        if (!db) {
            console.warn('⚠️ Firestore غير متاح');
            return { success: false, error: 'Firestore not available', localOnly: true };
        }
        
        // ✅ 3️⃣ إضافة userId للمستند
        const userId = authResult.user.uid;
        
        // 4️⃣ حفظ الترخيص في Firestore
        const docRef = window.doc(db, 'licenses', licenseData.deviceId);
        await window.setDoc(docRef, {
            deviceId: licenseData.deviceId,
            userName: licenseData.userName || 'مستخدم',
            userPhone: licenseData.userPhone || '',
            plan: licenseData.plan || 'سنوية',
            expiryDate: licenseData.expiryDate,
            createdAt: licenseData.createdAt || new Date().toISOString(),
            status: 'active',
            activatedAt: new Date().toISOString(),
            activatedBy: userId,
            userId: userId // ✅ إضافة userId للقواعد الجديدة
        });
        
        console.log('✅ تم حفظ الترخيص في Firebase مع userId:', userId);
        return { success: true };
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الترخيص:', error);
        return { success: false, error: error.message, localOnly: true };
    }
}

// ============================================================
//  ✅ دالة التفعيل الأساسية (المعدلة)
// ============================================================

async function activateLicense() {
    try {
        let savedLicense = localStorage.getItem('license_data');
        if (!savedLicense) {
            showToast('⚠️ يرجى رفع ملف الترخيص أولاً', 'error');
            return;
        }
        
        const license = JSON.parse(savedLicense);
        const deviceId = localStorage.getItem('device_id') || '';
        
        const expiry = new Date(license.expiryDate);
        if (expiry < new Date()) {
            showToast('❌ انتهت صلاحية الترخيص!', 'error');
            return;
        }
        
        if (license.deviceId !== deviceId) {
            showToast('❌ هذا الترخيص ليس لهذا الجهاز!', 'error');
            return;
        }
        
        showToast('⏳ جاري حفظ الترخيص في قاعدة البيانات...', 'success');
        
        // ====== ✅ محاولة حفظ الترخيص في Firebase ======
        let firebaseSaved = false;
        const result = await saveLicenseToFirestore(license);
        
        if (result.success) {
            firebaseSaved = true;
            showToast('✅ تم حفظ الترخيص في قاعدة البيانات', 'success');
        } else if (result.localOnly) {
            showToast('⚠️ فشل الحفظ في Firebase، سيتم التفعيل محلياً', 'warning');
        } else {
            showToast('⚠️ فشل الحفظ في Firebase، سيتم التفعيل محلياً', 'warning');
        }
        
        // ====== ✅ تطبيق الترخيص محلياً (دائماً) ======
        const applyResult = applyLicenseToSystem(license);
        
        if (applyResult.success) {
            showToast(`🎉 تم تفعيل النسخة الاحترافية بنجاح!`, 'success');
            localStorage.setItem('active_license_id', license.deviceId);
            localStorage.setItem('license_firebase_saved', firebaseSaved ? 'true' : 'false');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showToast('❌ حدث خطأ أثناء التفعيل: ' + applyResult.error, 'error');
        }
        
    } catch (error) {
        console.error('Activation error:', error);
        showToast('❌ حدث خطأ أثناء التفعيل: ' + error.message, 'error');
    }
}

// ============================================================
//  تطبيق الترخيص على النظام
// ============================================================

function applyLicenseToSystem(license) {
    try {
        const expiry = new Date(license.expiryDate);
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        const premiumData = {
            type: 'premium',
            plan: license.plan || 'سنوية',
            startDate: license.createdAt || new Date().toISOString(),
            expiryDate: license.expiryDate,
            features: {
                maxItems: Infinity,
                maxOffers: Infinity,
                maxClients: Infinity,
                canExportPDF: true,
                canExportExcel: true,
                canReports: true,
                canSignatures: true,
                canFullDesign: true,
                canCharts: true,
                showWatermark: false,
                isPremium: true
            },
            status: 'active',
            licenseKey: 'FILE-' + license.deviceId.substring(0, 8),
            isPremium: true,
            userName: license.userName || 'مستخدم',
            userPhone: license.userPhone || '',
            daysLeft: daysLeft,
            isExpired: daysLeft <= 0
        };
        
        localStorage.setItem('app_license_data', JSON.stringify(premiumData));
        sessionStorage.setItem('app_license_data', JSON.stringify(premiumData));
        
        if (typeof licenseManager !== 'undefined') {
            licenseManager.licenseData = premiumData;
            licenseManager.isValidated = true;
            licenseManager.saveLicense(premiumData);
            licenseManager.notifyListeners();
        }
        
        updateFooterStatus(true);
        updateLicenseStatusUI(premiumData);
        
        console.log('✅ تم تطبيق الترخيص بنجاح:', premiumData);
        
        return { success: true, daysLeft: daysLeft };
    } catch (error) {
        console.error('Apply license error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
//  دوال مساعدة (تحديث الواجهة)
// ============================================================

function updateLicenseStatusUI(licenseData) {
    const statusEl = document.getElementById('licenseStatusText');
    if (statusEl) {
        statusEl.innerHTML = `
            <i class="fas fa-crown" style="color: var(--gold);"></i>
            🎉 أنت مشترك في <strong>النسخة المدفوعة</strong> - جميع الميزات متاحة!
            <span style="font-size:0.75rem; opacity:0.7; margin-right:8px;">
                | الخطة: ${licenseData.plan || 'مدفوعة'} | متبقي: ${licenseData.daysLeft || 0} يوم
            </span>
        `;
    }
    
    const planDetails = document.getElementById('planDetails');
    if (planDetails) {
        planDetails.textContent = `📋 الخطة: ${licenseData.plan || 'مدفوعة'} (${licenseData.daysLeft || 0} يوم متبقي)`;
        planDetails.style.display = 'block';
        planDetails.style.color = 'var(--gold)';
        planDetails.style.fontWeight = '600';
    }
    
    const footer = document.getElementById('footer');
    if (footer) {
        footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ⭐ النسخة المدفوعة | 📞 01096597825</p>`;
    }
}

function updateFooterStatus(isPremium) {
    const footer = document.getElementById('footer');
    if (footer) {
        const status = isPremium ? '⭐ النسخة المدفوعة' : '📋 النسخة المجانية';
        footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ${status} | 📞 01096597825</p>`;
    }
}

// ============================================================
//  دوال رفع ملف الترخيص وعرض النتائج
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = generateDeviceId();
            localStorage.setItem('device_id', deviceId);
        }
        const deviceIdEl = document.getElementById('deviceId');
        if (deviceIdEl) {
            deviceIdEl.textContent = deviceId;
        }
        
        const savedLicense = localStorage.getItem('license_data');
        if (savedLicense) {
            try {
                const license = JSON.parse(savedLicense);
                displayLicenseInfo(license);
                const infoEl = document.getElementById('licenseInfo');
                if (infoEl) infoEl.style.display = 'block';
                
                const activateBtn = document.getElementById('activateBtn');
                if (activateBtn) activateBtn.style.display = 'flex';
            } catch (e) {
                console.warn('Invalid saved license data');
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// ====== رفع ملف الترخيص ======
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('licenseFile');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const fileName = document.getElementById('fileName');
            if (fileName) {
                fileName.textContent = `📄 ${file.name}`;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const content = event.target.result;
                    const result = decryptLicense(content);
                    
                    if (!result || !result.valid) {
                        showLicenseError(result?.error || 'ملف تالف أو غير صالح');
                        return;
                    }
                    
                    const license = result.data;
                    const deviceIdEl = document.getElementById('deviceId');
                    const deviceId = deviceIdEl ? deviceIdEl.textContent : '';
                    
                    if (license.deviceId !== deviceId) {
                        showLicenseError('هذه الرخصة مخصصة لجهاز آخر ولا تطابق معرف جهازك!');
                        return;
                    }
                    
                    const expiry = new Date(license.expiryDate);
                    if (expiry < new Date()) {
                        showLicenseError('انتهت صلاحية الترخيص!');
                        return;
                    }
                    
                    showLicenseSuccess('✅ تم التحقق من الترخيص بنجاح!');
                    displayLicenseInfo(license);
                    const infoEl = document.getElementById('licenseInfo');
                    if (infoEl) infoEl.style.display = 'block';
                    
                    localStorage.setItem('license_data', JSON.stringify(license));
                    localStorage.setItem('license_file', content);
                    
                    const activateBtn = document.getElementById('activateBtn');
                    if (activateBtn) activateBtn.style.display = 'flex';
                    
                } catch (error) {
                    console.error('File read error:', error);
                    showLicenseError('حدث خطأ أثناء قراءة الملف');
                }
            };
            reader.readAsText(file);
        });
    }
});

// ====== عرض معلومات الترخيص ======
function displayLicenseInfo(license) {
    try {
        const userEl = document.getElementById('infoUser');
        const phoneEl = document.getElementById('infoPhone');
        const planEl = document.getElementById('infoPlan');
        const deviceIdEl = document.getElementById('infoDeviceId');
        const expiryEl = document.getElementById('infoExpiry');
        const daysEl = document.getElementById('infoDays');
        
        if (userEl) userEl.textContent = license.userName || '---';
        if (phoneEl) phoneEl.textContent = license.userPhone || '---';
        if (planEl) planEl.textContent = license.plan || '---';
        if (deviceIdEl) deviceIdEl.textContent = license.deviceId || '---';
        
        if (expiryEl) {
            const expiry = new Date(license.expiryDate);
            expiryEl.textContent = expiry.toLocaleDateString('ar-EG');
        }
        
        if (daysEl) {
            const expiry = new Date(license.expiryDate);
            const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
            daysEl.textContent = daysLeft > 0 ? `${daysLeft} يوم متبقي` : '⛔ انتهى الترخيص';
            daysEl.style.color = daysLeft <= 0 ? 'var(--danger)' : daysLeft < 7 ? 'var(--warning)' : 'var(--success)';
        }
    } catch (error) {
        console.error('Display license info error:', error);
    }
}

// ====== عرض رسائل ======
function showLicenseError(message) {
    const errorEl = document.getElementById('licenseError');
    const successEl = document.getElementById('licenseSuccess');
    const errorMsg = document.getElementById('errorMessage');
    
    if (errorEl) errorEl.style.display = 'block';
    if (successEl) successEl.style.display = 'none';
    if (errorMsg) errorMsg.textContent = message;
}

function showLicenseSuccess(message) {
    const errorEl = document.getElementById('licenseError');
    const successEl = document.getElementById('licenseSuccess');
    const successMsg = document.getElementById('successMessage');
    
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
    if (successMsg) successMsg.textContent = message;
}

// ====== بدء النسخة المجانية ======
function startFreeTrialFromUI() {
    if (confirm('🆓 هل تريد بدء النسخة المجانية لمدة 90 يوم؟')) {
        const trialData = licenseManager.startFreeTrial();
        if (trialData) {
            showToast(`✅ تم بدء النسخة المجانية! متبقي ${trialData.daysLeft} يوم`, 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    }
}

// ====== إرسال البيانات للمطور ======
function sendToWhatsApp() {
    const validation = validateUserData();
    
    if (validation.data.plan === 'مجانية') {
        startFreeTrialFromUI();
        return;
    }
    
    if (!validation.valid) {
        const errorMsg = '⚠️ يرجى إكمال البيانات التالية:\n\n• ' + validation.errors.join('\n• ');
        alert(errorMsg);
        showToast('⚠️ يرجى إكمال جميع البيانات المطلوبة', 'error');
        return;
    }
    
    const { fullName, phone, plan, deviceId } = validation.data;
    
    const message = 
        `📋 *طلب تفعيل النسخة الاحترافية*\n\n` +
        `👤 *الاسم:* ${fullName}\n` +
        `📱 *الهاتف:* ${phone}\n` +
        `📅 *الخطة:* ${plan}\n` +
        `🆔 *معرف الجهاز:* ${deviceId}\n\n` +
        `📌 *يرجى إرسال ملف الترخيص لهذا المستخدم*`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/201096597825?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    showToast('✅ جاري فتح واتساب لإرسال البيانات', 'success');
}

// ====== نسخ معرف الجهاز ======
function copyDeviceId() {
    const deviceIdEl = document.getElementById('deviceId');
    if (!deviceIdEl) return;
    
    const deviceId = deviceIdEl.textContent;
    if (!deviceId || deviceId === 'جاري التحميل...') {
        showToast('⚠️ المعرف غير جاهز بعد، يرجى الانتظار', 'error');
        return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(deviceId)
            .then(() => {
                showToast('✅ تم نسخ معرف الجهاز بنجاح!', 'success');
                const btn = document.querySelector('.device-id-box .btn-copy');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ';
                    btn.style.background = 'var(--success)';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-copy"></i> نسخ';
                        btn.style.background = '';
                    }, 2000);
                }
            })
            .catch(() => {
                fallbackCopy(deviceId);
            });
    } else {
        fallbackCopy(deviceId);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('✅ تم نسخ معرف الجهاز بنجاح!', 'success');
    } catch (err) {
        showToast('❌ فشل النسخ، يرجى نسخه يدوياً', 'error');
    }
    document.body.removeChild(textarea);
}

// ============================================================
//  دوال المطور (متاحة عالمياً)
// ============================================================

window.generateLicense = function(deviceId, userName, userPhone, plan, days) {
    try {
        const finalDeviceId = deviceId || localStorage.getItem('device_id') || 'UNKNOWN';
        
        const data = {
            deviceId: finalDeviceId,
            userName: userName || 'مستخدم',
            userPhone: userPhone || '',
            plan: plan || 'سنوية',
            expiryDate: new Date(Date.now() + (days || 365) * 24 * 60 * 60 * 1000).toISOString()
        };
        return generateLicenseFile(data);
    } catch (error) {
        console.error('Generate license error:', error);
        showToast('❌ حدث خطأ أثناء إنشاء الترخيص', 'error');
        return null;
    }
};

// ====== جعل الدوال متاحة عالمياً ======
window.validateUserData = validateUserData;
window.sendToWhatsApp = sendToWhatsApp;
window.copyDeviceId = copyDeviceId;
window.activateLicense = activateLicense;
window.applyLicenseToSystem = applyLicenseToSystem;
window.updateFooterStatus = updateFooterStatus;
window.updateLicenseStatusUI = updateLicenseStatusUI;
window.generateLicense = generateLicense;
window.startFreeTrialFromUI = startFreeTrialFromUI;
window.validateSerial = validateSerial;
window.saveLicenseToFirestore = saveLicenseToFirestore;
window.ensureAnonymousAuth = ensureAnonymousAuth;

console.log('✅ نظام الترخيص بالملفات (ZLX) تم تهيئته بنجاح');
console.log('✅ المستخدم العادي سيسجل دخول مجهول للكتابة في Firebase');
console.log('✅ تم إضافة userId للحفاظ على أمان البيانات');
