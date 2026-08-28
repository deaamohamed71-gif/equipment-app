// js/license-file.js - نظام الترخيص عبر ملفات ZLX (معدل)

// ====== مفتاح التشفير (يجب أن يكون سرياً) ======
const ENCRYPTION_KEY = 'EquipmentApp-2026-SecretKey-!@#$%';

// ====== توليد معرف الجهاز ======
function generateDeviceId() {
    try {
        // جمع معلومات الجهاز - استخدام أسماء متغيرات مختلفة
        const screenInfo = `${window.screen?.width || 'unknown'}x${window.screen?.height || 'unknown'}`;
        const userAgent = navigator.userAgent || 'unknown';
        const platform = navigator.platform || 'unknown';
        const language = navigator.language || 'ar';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
        
        // إنشاء معرف فريد
        const raw = `${screenInfo}|${userAgent}|${platform}|${language}|${timezone}`;
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
        const prefixes = ['ASSAM', 'ACER', 'DELL', 'HP', 'LENO', 'MSI', 'ASUS'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return `${prefix}-${parts.join('-')}`;
    } catch (error) {
        console.error('Error generating device ID:', error);
        // Fallback: استخدام timestamp عشوائي
        const fallback = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `DEV-${fallback}`;
    }
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
    try {
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

// ====== تهيئة الصفحة ======
document.addEventListener('DOMContentLoaded', function() {
    try {
        // توليد وعرض معرف الجهاز
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = generateDeviceId();
            localStorage.setItem('device_id', deviceId);
        }
        const deviceIdEl = document.getElementById('deviceId');
        if (deviceIdEl) {
            deviceIdEl.textContent = deviceId;
        }
        
        // التحقق من وجود ترخيص محفوظ
        const savedLicense = localStorage.getItem('license_data');
        if (savedLicense) {
            try {
                const license = JSON.parse(savedLicense);
                displayLicenseInfo(license);
                const infoEl = document.getElementById('licenseInfo');
                if (infoEl) infoEl.style.display = 'block';
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
                    const infoEl = document.getElementById('licenseInfo');
                    if (infoEl) infoEl.style.display = 'block';
                    
                    // تخزين بيانات الترخيص
                    localStorage.setItem('license_data', JSON.stringify(license));
                    localStorage.setItem('license_file', content);
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
        const planEl = document.getElementById('infoPlan');
        const expiryEl = document.getElementById('infoExpiry');
        const daysEl = document.getElementById('infoDays');
        
        if (userEl) userEl.textContent = license.userName || 'مستخدم مميز';
        if (planEl) planEl.textContent = license.plan || 'سنوية';
        
        if (expiryEl) {
            const expiry = new Date(license.expiryDate);
            expiryEl.textContent = expiry.toLocaleDateString('ar-EG');
        }
        
        if (daysEl) {
            const expiry = new Date(license.expiryDate);
            const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
            daysEl.textContent = `${daysLeft} يوم`;
        }
    } catch (error) {
        console.error('Display license info error:', error);
    }
}

// ====== عرض رسالة خطأ ======
function showLicenseError(message) {
    const errorEl = document.getElementById('licenseError');
    const successEl = document.getElementById('licenseSuccess');
    const errorMsg = document.getElementById('errorMessage');
    
    if (errorEl) errorEl.style.display = 'block';
    if (successEl) successEl.style.display = 'none';
    if (errorMsg) errorMsg.textContent = message;
}

// ====== عرض رسالة نجاح ======
function showLicenseSuccess(message) {
    const errorEl = document.getElementById('licenseError');
    const successEl = document.getElementById('licenseSuccess');
    const successMsg = document.getElementById('successMessage');
    
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
    if (successMsg) successMsg.textContent = message;
}

// ====== تفعيل الترخيص ======
function activateLicense() {
    try {
        const savedLicense = localStorage.getItem('license_data');
        if (!savedLicense) {
            showToast('⚠️ يرجى رفع ملف الترخيص أولاً', 'error');
            return;
        }
        
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
        console.error('Activation error:', error);
        showToast('❌ حدث خطأ أثناء التفعيل', 'error');
    }
}

// ====== إلغاء التفعيل ======
function cancelActivation() {
    if (confirm('⚠️ هل أنت متأكد من إلغاء التفعيل؟')) {
        try {
            localStorage.removeItem('license_data');
            localStorage.removeItem('license_file');
            const infoEl = document.getElementById('licenseInfo');
            const fileName = document.getElementById('fileName');
            const errorEl = document.getElementById('licenseError');
            const successEl = document.getElementById('licenseSuccess');
            
            if (infoEl) infoEl.style.display = 'none';
            if (fileName) fileName.textContent = '';
            if (errorEl) errorEl.style.display = 'none';
            if (successEl) successEl.style.display = 'none';
            
            showToast('✅ تم إلغاء التفعيل', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error('Cancel activation error:', error);
            showToast('❌ حدث خطأ أثناء إلغاء التفعيل', 'error');
        }
    }
}

// ====== دالة للمطور: إنشاء ملف ترخيص (تُستخدم من Console) ======
window.generateLicense = function(deviceId, userName, plan, days) {
    try {
        const data = {
            deviceId: deviceId || prompt('معرف الجهاز:'),
            userName: userName || prompt('اسم المستخدم:'),
            plan: plan || prompt('الخطة (شهرية/سنوية):') || 'سنوية',
            expiryDate: new Date(Date.now() + (days || 365) * 24 * 60 * 60 * 1000).toISOString()
        };
        return generateLicenseFile(data);
    } catch (error) {
        console.error('Generate license error:', error);
        showToast('❌ حدث خطأ أثناء إنشاء الترخيص', 'error');
        return null;
    }
};

console.log('✅ نظام الترخيص بالملفات (ZLX) تم تهيئته بنجاح');
