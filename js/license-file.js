// js/license-file.js - نظام الترخيص عبر ملفات ZLX

// ====== مفتاح التشفير (يجب أن يكون سرياً) ======
const ENCRYPTION_KEY = 'EquipmentApp-2026-SecretKey-!@#$%';

// ====== توليد معرف الجهاز ======
function generateDeviceId() {
    // جمع معلومات الجهاز
    const screen = `${screen.width}x${screen.height}`;
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || 'unknown';
    const language = navigator.language || 'ar';
    
    // إنشاء معرف فريد
    const raw = `${screen}|${userAgent}|${platform}|${language}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // تنسيق المعرف
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    const parts = [];
    for (let i = 0; i < 4; i++) {
        parts.push(hex.substring(i * 4, (i + 1) * 4));
    }
    // إضافة بادئة عشوائية
    const prefix = ['ASSAM', 'ACER', 'DELL', 'HP', 'LENO'][Math.floor(Math.random() * 5)];
    return `${prefix}-${parts.join('-')}`;
}

// ====== تشفير البيانات ======
function encryptLicense(data) {
    try {
        const json = JSON.stringify(data);
        // تشفير بسيط باستخدام Base64 + XOR (للتوضيح، يفضل استخدام CryptoJS في الإنتاج)
        let encrypted = btoa(json);
        // إضافة توقيع
        const signature = btoa(ENCRYPTION_KEY.substring(0, 10));
        return `${encrypted}.${signature}`;
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
}

// ====== فك تشفير البيانات ======
function decryptLicense(encryptedData) {
    try {
        const parts = encryptedData.split('.');
        if (parts.length !== 2) return null;
        
        const [encrypted, signature] = parts;
        const expectedSignature = btoa(ENCRYPTION_KEY.substring(0, 10));
        
        // التحقق من التوقيع
        if (signature !== expectedSignature) {
            return { valid: false, error: 'توقيع غير صالح' };
        }
        
        const json = atob(encrypted);
        const data = JSON.parse(json);
        return { valid: true, data };
    } catch (error) {
        console.error('Decryption error:', error);
        return { valid: false, error: 'ملف تالف أو غير صالح' };
    }
}

// ====== إنشاء ملف ترخيص (للمطور) ======
function generateLicenseFile(userData) {
    // بيانات الترخيص
    const licenseData = {
        deviceId: userData.deviceId,
        userName: userData.userName || 'مستخدم مميز',
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
    
    // إنشاء ملف للتحميل
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license_${userData.deviceId.substring(0, 8)}.zlx`;
    a.click();
    URL.revokeObjectURL(url);
    
    return licenseData;
}

// ====== تهيئة الصفحة ======
document.addEventListener('DOMContentLoaded', function() {
    // توليد وعرض معرف الجهاز
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem('device_id', deviceId);
    }
    document.getElementById('deviceId').textContent = deviceId;
    
    // التحقق من وجود ترخيص محفوظ
    const savedLicense = localStorage.getItem('license_data');
    if (savedLicense) {
        try {
            const license = JSON.parse(savedLicense);
            displayLicenseInfo(license);
            document.getElementById('licenseInfo').style.display = 'block';
        } catch (e) {
            // بيانات تالفة
        }
    }
});

// ====== رفع ملف الترخيص ======
document.getElementById('licenseFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileName = document.getElementById('fileName');
    fileName.textContent = `📄 ${file.name}`;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        const result = decryptLicense(content);
        
        if (!result || !result.valid) {
            showLicenseError(result?.error || 'ملف تالف أو غير صالح');
            return;
        }
        
        const license = result.data;
        const deviceId = document.getElementById('deviceId').textContent;
        
        // التحقق من تطابق معرف الجهاز
        if (license.deviceId !== deviceId) {
            showLicenseError('هذه الرخصة مخصصة لجهاز آخر ولا تطابق معرف جهازك!');
            return;
        }
        
        // التحقق من الصلاحية
        const expiry = new Date(license.expiryDate);
        if (expiry < new Date()) {
            showLicenseError('انتهت صلاحية الترخيص!');
            return;
        }
        
        // ✅ كل شيء صحيح
        showLicenseSuccess('✅ تم التحقق من الترخيص بنجاح!');
        displayLicenseInfo(license);
        document.getElementById('licenseInfo').style.display = 'block';
        
        // تخزين بيانات الترخيص
        localStorage.setItem('license_data', JSON.stringify(license));
        localStorage.setItem('license_file', content);
    };
    reader.readAsText(file);
});

// ====== عرض معلومات الترخيص ======
function displayLicenseInfo(license) {
    document.getElementById('infoUser').textContent = license.userName || 'مستخدم مميز';
    document.getElementById('infoPlan').textContent = license.plan || 'سنوية';
    
    const expiry = new Date(license.expiryDate);
    document.getElementById('infoExpiry').textContent = expiry.toLocaleDateString('ar-EG');
    
    const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    document.getElementById('infoDays').textContent = `${daysLeft} يوم`;
}

// ====== عرض رسالة خطأ ======
function showLicenseError(message) {
    const errorEl = document.getElementById('licenseError');
    const successEl = document.getElementById('licenseSuccess');
    errorEl.style.display = 'block';
    successEl.style.display = 'none';
    document.getElementById('errorMessage').textContent = message;
}

// ====== عرض رسالة نجاح ======
function showLicenseSuccess(message) {
    const errorEl = document.getElementById('licenseError');
    const successEl = document.getElementById('licenseSuccess');
    errorEl.style.display = 'none';
    successEl.style.display = 'block';
    document.getElementById('successMessage').textContent = message;
}

// ====== تفعيل الترخيص ======
function activateLicense() {
    const savedLicense = localStorage.getItem('license_data');
    if (!savedLicense) {
        showToast('⚠️ يرجى رفع ملف الترخيص أولاً', 'error');
        return;
    }
    
    try {
        const license = JSON.parse(savedLicense);
        // تطبيق الترخيص على النظام
        if (typeof licenseManager !== 'undefined') {
            // تحويل بيانات الترخيص إلى نظام الترخيص الحالي
            const premiumData = {
                type: 'premium',
                plan: license.plan || 'premium',
                startDate: license.createdAt || new Date().toISOString(),
                expiryDate: license.expiryDate,
                features: license.features || licenseManager.getPremiumFeatures(),
                status: 'active',
                licenseKey: 'FILE-' + license.deviceId.substring(0, 8),
                isPremium: true,
                userName: license.userName
            };
            
            licenseManager.licenseData = premiumData;
            licenseManager.isValidated = true;
            licenseManager.saveLicense(premiumData);
            licenseManager.notifyListeners();
        }
        
        showToast('🎉 تم تفعيل النسخة الاحترافية بنجاح!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        showToast('❌ حدث خطأ أثناء التفعيل', 'error');
    }
}

// ====== إلغاء التفعيل ======
function cancelActivation() {
    if (confirm('⚠️ هل أنت متأكد من إلغاء التفعيل؟')) {
        localStorage.removeItem('license_data');
        localStorage.removeItem('license_file');
        document.getElementById('licenseInfo').style.display = 'none';
        document.getElementById('fileName').textContent = '';
        document.getElementById('licenseError').style.display = 'none';
        document.getElementById('licenseSuccess').style.display = 'none';
        showToast('✅ تم إلغاء التفعيل', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}

// ====== دالة للمطور: إنشاء ملف ترخيص (تُستخدم من Console) ======
window.generateLicense = function(deviceId, userName, plan, days) {
    const data = {
        deviceId: deviceId || prompt('معرف الجهاز:'),
        userName: userName || prompt('اسم المستخدم:'),
        plan: plan || prompt('الخطة (شهرية/سنوية):') || 'سنوية',
        expiryDate: new Date(Date.now() + (days || 365) * 24 * 60 * 60 * 1000).toISOString()
    };
    return generateLicenseFile(data);
};