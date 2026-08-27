// js/license.js - نظام الترخيص والاشتراك

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
    }

    // ====== التهيئة ======
    initialize() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.licenseData = JSON.parse(saved);
                this.isValidated = this.isLicenseValid(this.licenseData);
            } catch {
                this.isValidated = false;
            }
        }
        
        if (!this.isValidated || !this.licenseData) {
            this.startTrial();
        }
        
        this.notifyListeners();
        return this.isValidated;
    }

    // ====== بدء النسخة التجريبية ======
    startTrial() {
        const trialData = {
            type: 'trial',
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

    // ====== تفعيل الترخيص ======
    activateLicense(key) {
        // مفتاح تجريبي للاختبار
        const validKeys = [
            'EQ2026-X9F7-KL82-MN34',
            'EQ2026-W8E6-JK71-LM23',
            'EQ2026-V7D5-HI60-KL12',
            'PREMIUM-2026-FREE-KEY'
        ];
        
        if (validKeys.includes(key)) {
            const premiumData = {
                type: 'premium',
                startDate: new Date().toISOString(),
                expiryDate: this.calculateExpiry(365),
                features: this.getPremiumFeatures(),
                status: 'active',
                licenseKey: key,
                isPremium: true
            };
            
            this.licenseData = premiumData;
            this.isValidated = true;
            this.saveLicense(premiumData);
            this.notifyListeners();
            return { success: true, message: '✅ تم تفعيل النسخة المدفوعة بنجاح!' };
        }
        
        return { success: false, message: '❌ مفتاح التفعيل غير صالح. يرجى المحاولة مرة أخرى.' };
    }

    // ====== حساب تاريخ الانتهاء ======
    calculateExpiry(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    // ====== حفظ الترخيص ======
    saveLicense(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // ====== الحصول على معلومات الترخيص ======
    getLicenseInfo() {
        if (!this.licenseData) return null;
        const daysLeft = this.getDaysLeft(this.licenseData.expiryDate);
        const isExpired = daysLeft <= 0;
        
        return {
            type: this.licenseData.isPremium ? 'مدفوعة' : 'مجانية',
            expiry: this.licenseData.expiryDate,
            daysLeft: daysLeft,
            isExpired: isExpired,
            isPremium: this.licenseData.isPremium || false,
            features: this.getFeatures()
        };
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
        // إذا كنا في صفحة التفعيل، لا نفتحها مرة أخرى
        if (window.location.pathname.includes('activation.html')) return;
        
        // استخدام confirm لتوجيه المستخدم
        if (confirm('⚠️ هذه الميزة متاحة فقط في النسخة المدفوعة.\n\nهل تريد الانتقال إلى صفحة التفعيل الآن؟')) {
            window.location.href = 'activation.html';
        }
    }
}

// ====== إنشاء نسخة واحدة من مدير الترخيص ======
const licenseManager = new LicenseManager();

// ====== دالة مساعدة للتحقق من الميزات في أي مكان ======
function checkFeature(featureName, message) {
    if (!licenseManager.canUse(featureName)) {
        const msg = message || '⚠️ هذه الميزة متاحة فقط في النسخة المدفوعة. قم بالترقية الآن!';
        showToast(msg, 'error');
        licenseManager.showActivationPrompt();
        return false;
    }
    return true;
}

// ====== دالة للتحقق من الحد الأقصى ======
function checkLimit(currentCount, maxCount, featureName) {
    if (currentCount >= maxCount) {
        const msg = `⚠️ النسخة المجانية تسمح بـ ${maxCount} ${featureName} فقط. قم بالترقية للاستفادة من المزيد.`;
        showToast(msg, 'error');
        licenseManager.showActivationPrompt();
        return false;
    }
    return true;
}