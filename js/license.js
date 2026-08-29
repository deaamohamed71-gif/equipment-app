// js/license.js - نظام الترخيص الأساسي (محدث للربط مع ترخيص الملفات)

class LicenseManager {
    constructor() {
        this.STORAGE_KEY = 'app_license_data';
        this.TRIAL_DAYS = 90;
        this.MAX_ITEMS = 3;
        this.MAX_OFFERS = 5;
        this.MAX_CLIENTS = 5;
        this.licenseData = null;
        this.isValidated = false;
        this.callbacks = [];
        this.verificationInterval = null;
        this.PLAN_DURATIONS = {
            'monthly': 30,
            'yearly': 365,
            'trial': 90
        };
    }

    // ====== التهيئة ======
    initialize() {
        // ✅ التحقق من ترخيص الملفات أولاً
        if (typeof checkFileLicenseOnStart === 'function') {
            const fileLicenseValid = checkFileLicenseOnStart();
            if (fileLicenseValid) {
                // الترخيص بالملفات موجود وصالح
                this.notifyListeners();
                this.startPeriodicVerification();
                return true;
            }
        }

        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.licenseData = JSON.parse(saved);
                this.isValidated = this.isLicenseValid(this.licenseData);
                
                this.verifyLicenseWithFirebase().then(valid => {
                    if (!valid) {
                        this.notifyListeners();
                        this.updateUIAfterValidation();
                    }
                });
            } catch {
                this.isValidated = false;
            }
        }
        
        if (!this.isValidated || !this.licenseData) {
            this.startTrial();
        }
        
        this.notifyListeners();
        this.startPeriodicVerification();
        
        return this.isValidated;
    }

    // ====== بدء النسخة التجريبية ======
    startTrial() {
        const trialData = {
            type: 'trial',
            plan: 'trial',
            startDate: new Date().toISOString(),
            expiryDate: this.calculateExpiry(this.TRIAL_DAYS),
            features: this.getTrialFeatures(),
            status: 'active',
            isPremium: false
        };
        
        this.licenseData = trialData;
        this.isValidated = true;
        this.saveLicense(trialData);
        this.notifyListeners();
        return trialData;
    }

    // ====== حساب مدة الخطة ======
    getPlanDuration(plan) {
        return this.PLAN_DURATIONS[plan] || 30;
    }

    // ====== التحقق من صلاحية الترخيص ======
    isLicenseValid(license) {
        if (!license) return false;
        if (license.status === 'expired') return false;
        
        const expiry = new Date(license.expiryDate);
        const now = new Date();
        
        if (now > expiry) {
            license.status = 'expired';
            this.saveLicense(license);
            this.notifyListeners();
            return false;
        }
        
        return true;
    }

    // ====== التحقق من الترخيص من Firebase ======
    async verifyLicenseWithFirebase() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) return true;
        
        let license;
        try {
            license = JSON.parse(saved);
        } catch {
            return true;
        }
        
        if (!license.isPremium) return true;
        
        const key = license.licenseKey;
        if (!key) return true;
        
        // التحقق من أنه ليس ترخيص ملفات (يبدأ بـ FILE-)
        if (key && key.startsWith('FILE-')) {
            // ترخيص الملفات يتم التحقق منه بشكل منفصل
            return true;
        }
        
        if (typeof window.verifyLicenseWithFirebase === 'function') {
            try {
                const result = await window.verifyLicenseWithFirebase(key);
                if (!result.valid) {
                    this.licenseData = null;
                    this.isValidated = false;
                    this.startTrial();
                    this.notifyListeners();
                    showToast('⚠️ تم إلغاء الترخيص المدفوع، تم التحويل للنسخة التجريبية.', 'error');
                    return false;
                }
                return true;
            } catch (error) {
                console.warn('فشل التحقق من Firebase:', error);
                return true;
            }
        }
        
        return true;
    }

    // ====== تفعيل الترخيص مع الخطة ======
    async activateLicense(key) {
        // التحقق من أنه ليس ترخيص ملفات
        if (key && key.startsWith('FILE-')) {
            return { success: false, message: '⚠️ هذا ترخيص ملفات، يرجى استخدام صفحة التفعيل بالملفات' };
        }
        
        if (typeof window.verifyLicenseWithFirebase === 'function') {
            try {
                const result = await window.verifyLicenseWithFirebase(key);
                
                if (result.valid) {
                    const plan = result.plan || 'monthly';
                    const duration = this.getPlanDuration(plan);
                    const expiryDate = this.calculateExpiry(duration);
                    
                    const premiumData = {
                        type: 'premium',
                        plan: plan,
                        startDate: new Date().toISOString(),
                        expiryDate: expiryDate,
                        features: this.getPremiumFeatures(),
                        status: 'active',
                        licenseKey: key,
                        isPremium: true
                    };
                    
                    this.licenseData = premiumData;
                    this.isValidated = true;
                    this.saveLicense(premiumData);
                    this.notifyListeners();
                    
                    const planNames = {
                        'monthly': 'شهرية',
                        'yearly': 'سنوية',
                        'trial': 'تجريبية'
                    };
                    
                    return { 
                        success: true, 
                        message: `✅ تم تفعيل النسخة المدفوعة (${planNames[plan] || plan}) - ${duration} يوم`
                    };
                } else {
                    return { success: false, message: result.message };
                }
            } catch (error) {
                console.error("خطأ في الاتصال بخادم Firebase:", error);
                return this.activateLicenseLocal(key);
            }
        } else {
            return this.activateLicenseLocal(key);
        }
    }

    // ====== تفعيل الترخيص محلياً (احتياطي) ======
    activateLicenseLocal(key) {
        const validKeys = [
            'EQ2026-X9F7-KL82-MN34',
            'EQ2026-W8E6-JK71-LM23',
            'PREMIUM-MONTHLY-KEY',
            'PREMIUM-YEARLY-KEY'
        ];
        
        if (validKeys.includes(key)) {
            let plan = 'monthly';
            let duration = 30;
            
            if (key === 'PREMIUM-YEARLY-KEY') {
                plan = 'yearly';
                duration = 365;
            }
            
            const premiumData = {
                type: 'premium',
                plan: plan,
                startDate: new Date().toISOString(),
                expiryDate: this.calculateExpiry(duration),
                features: this.getPremiumFeatures(),
                status: 'active',
                licenseKey: key,
                isPremium: true
            };
            
            this.licenseData = premiumData;
            this.isValidated = true;
            this.saveLicense(premiumData);
            this.notifyListeners();
            
            const planNames = {
                'monthly': 'شهرية',
                'yearly': 'سنوية'
            };
            
            return { 
                success: true, 
                message: `✅ تم تفعيل النسخة المدفوعة (${planNames[plan] || plan}) محلياً.`
            };
        }
        
        return { success: false, message: '❌ مفتاح التفعيل غير صالح' };
    }

    // ====== حساب تاريخ الانتهاء ======
    calculateExpiry(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    // ====== الحصول على معلومات الترخيص ======
    getLicenseInfo() {
        if (!this.licenseData) return null;
        const daysLeft = this.getDaysLeft(this.licenseData.expiryDate);
        const isExpired = daysLeft <= 0;
        
        const planNames = {
            'monthly': 'شهرية',
            'yearly': 'سنوية',
            'trial': 'تجريبية'
        };
        
        return {
            type: this.licenseData.isPremium ? 'مدفوعة' : 'مجانية',
            plan: this.licenseData.plan || 'trial',
            planName: planNames[this.licenseData.plan] || 'تجريبية',
            expiry: this.licenseData.expiryDate,
            daysLeft: daysLeft,
            isExpired: isExpired,
            isPremium: this.licenseData.isPremium || false,
            licenseKey: this.licenseData.licenseKey || null,
            features: this.getFeatures(),
            userName: this.licenseData.userName || null
        };
    }

    // ====== الحصول على الميزات المتاحة ======
    getFeatures() {
        if (!this.licenseData) return this.getTrialFeatures();
        if (this.licenseData.isPremium) return this.getPremiumFeatures();
        return this.getTrialFeatures();
    }

    // ====== ميزات النسخة التجريبية ======
    getTrialFeatures() {
        return {
            maxItems: 3,
            maxOffers: 5,
            maxClients: 5,
            canExportPDF: true,
            canExportExcel: false,
            canReports: false,
            canSignatures: false,
            canFullDesign: false,
            canCharts: false,
            canFullColors: false,
            showWatermark: true,
            isPremium: false
        };
    }

    // ====== ميزات النسخة المدفوعة ======
    getPremiumFeatures() {
        return {
            maxItems: Infinity,
            maxOffers: Infinity,
            maxClients: Infinity,
            canExportPDF: true,
            canExportExcel: true,
            canReports: true,
            canSignatures: true,
            canFullDesign: true,
            canCharts: true,
            canFullColors: true,
            showWatermark: false,
            isPremium: true
        };
    }

    // ====== حفظ الترخيص ======
    saveLicense(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // ====== حساب الأيام المتبقية ======
    getDaysLeft(expiryDate) {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = expiry - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // ====== التحقق من ميزة معينة ======
    canUse(featureName) {
        const features = this.getFeatures();
        return features[featureName] === true;
    }

    // ====== الحصول على الحد الأقصى ======
    getMax(featureName) {
        const features = this.getFeatures();
        return features[featureName] || 0;
    }

    // ====== تسجيل المستمعين ======
    addListener(callback) {
        this.callbacks.push(callback);
    }

    // ====== إعلام المستمعين ======
    notifyListeners() {
        const info = this.getLicenseInfo();
        this.callbacks.forEach(cb => cb(info));
    }

    // ====== عرض نافذة التفعيل ======
    showActivationPrompt() {
        if (window.location.pathname.includes('activation.html')) return;
        if (window.location.pathname.includes('activation-license.html')) return;
        
        if (confirm('⚠️ هذه الميزة متاحة فقط في النسخة المدفوعة.\n\nهل تريد الانتقال إلى صفحة التفعيل الآن؟')) {
            window.location.href = 'activation-license.html';
        }
    }

    // ====== التحقق الدوري ======
    startPeriodicVerification() {
        if (this.verificationInterval) {
            clearInterval(this.verificationInterval);
        }
        
        this.verificationInterval = setInterval(() => {
            // التحقق من ترخيص الملفات
            if (typeof checkFileLicenseOnStart === 'function') {
                checkFileLicenseOnStart();
            }
            
            this.verifyLicenseWithFirebase().then(valid => {
                if (!valid) {
                    this.notifyListeners();
                    this.updateUIAfterValidation();
                }
            });
        }, 5 * 60 * 1000);
    }

    // ====== تحديث الواجهة بعد التحقق ======
    updateUIAfterValidation() {
        const info = this.getLicenseInfo();
        if (info && !info.isPremium) {
            const statusEl = document.getElementById('licenseStatusText');
            if (statusEl) {
                statusEl.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                    ⚠️ تم إلغاء الترخيص المدفوع. جاري التحويل للنسخة التجريبية.
                `;
            }
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }
}

// ====== إنشاء نسخة واحدة من مدير الترخيص ======
const licenseManager = new LicenseManager();

// ====== التحقق من ترخيص الملفات عند بدء التطبيق ======
function checkFileLicenseOnStart() {
    const fileLicense = localStorage.getItem('license_data');
    if (fileLicense) {
        try {
            const license = JSON.parse(fileLicense);
            const expiry = new Date(license.expiryDate);
            const now = new Date();
            
            if (expiry > now) {
                // الترخيص ساري → تطبيقه
                if (typeof applyLicenseToSystem === 'function') {
                    applyLicenseToSystem(license);
                }
                return true;
            } else {
                // الترخيص منتهي → حذفه والعودة للتجريبي
                localStorage.removeItem('license_data');
                localStorage.removeItem('license_file');
                if (typeof showToast === 'function') {
                    showToast('⚠️ انتهت صلاحية الترخيص، تم التحويل للنسخة التجريبية', 'error');
                }
                return false;
            }
        } catch (e) {
            console.warn('Invalid file license:', e);
            return false;
        }
    }
    return false;
}

// ====== دوال مساعدة ======
function checkFeature(featureName, message) {
    if (!licenseManager.canUse(featureName)) {
        const msg = message || '⚠️ هذه الميزة متاحة فقط في النسخة المدفوعة. قم بالترقية الآن!';
        showToast(msg, 'error');
        licenseManager.showActivationPrompt();
        return false;
    }
    return true;
}

function checkLimit(currentCount, maxCount, featureName) {
    if (currentCount >= maxCount) {
        const msg = `⚠️ النسخة المجانية تسمح بـ ${maxCount} ${featureName} فقط. قم بالترقية للاستفادة من المزيد.`;
        showToast(msg, 'error');
        licenseManager.showActivationPrompt();
        return false;
    }
    return true;
}
