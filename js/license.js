// js/license.js - نظام الترخيص الأساسي (محدث للتحقق من Firestore)

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
        // ✅ أولاً: التحقق من الترخيص في Firestore
        this.checkFirestoreLicense();

        // ✅ ثانياً: التحقق من ترخيص الملفات المحلي
        const fileLicense = localStorage.getItem('license_data');
        if (fileLicense) {
            try {
                const license = JSON.parse(fileLicense);
                const expiry = new Date(license.expiryDate);
                if (expiry > new Date()) {
                    const premiumData = this.buildPremiumData(license);
                    this.licenseData = premiumData;
                    this.isValidated = true;
                    this.saveLicense(premiumData);
                    this.notifyListeners();
                    this.startPeriodicVerification();
                    return true;
                }
            } catch (e) {
                console.warn('File license check error:', e);
            }
        }

        // ✅ ثالثاً: التحقق من الترخيص المخزن محلياً (app_license_data)
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.licenseData = JSON.parse(saved);
                this.isValidated = this.isLicenseValid(this.licenseData);
                
                if (this.isValidated && !this.licenseData.isPremium) {
                    this.notifyListeners();
                    this.startPeriodicVerification();
                    return true;
                }
            } catch {
                this.isValidated = false;
            }
        }
        
        // ✅ رابعاً: لا يوجد ترخيص صالح → نبدأ النسخة المجانية
        if (!this.isValidated || !this.licenseData) {
            this.startFreeTrial();
        }
        
        this.notifyListeners();
        this.startPeriodicVerification();
        return this.isValidated;
    }

    // ====== التحقق من الترخيص في Firestore ======
    async checkFirestoreLicense() {
        try {
            const deviceId = localStorage.getItem('device_id') || '';
            const activeLicenseId = localStorage.getItem('active_license_id');
            
            if (!deviceId || !activeLicenseId) return false;
            
            if (typeof window.verifyLicenseFromFirestore === 'function') {
                const result = await window.verifyLicenseFromFirestore(activeLicenseId);
                
                if (result.valid && result.data) {
                    const license = result.licenseData || {
                        deviceId: result.data.deviceId,
                        userName: result.data.userName,
                        userPhone: result.data.userPhone,
                        plan: result.data.plan,
                        expiryDate: result.data.expiryDate
                    };
                    
                    if (typeof window.applyLicenseToSystem === 'function') {
                        window.applyLicenseToSystem(license);
                    } else {
                        this.applyLicenseToSystem(license);
                    }
                    
                    console.log('✅ تم تفعيل الترخيص من Firestore');
                    return true;
                } else {
                    localStorage.removeItem('active_license_id');
                    console.log('❌ الترخيص غير صالح، تم إلغاؤه');
                    return false;
                }
            }
        } catch (error) {
            console.warn('فشل التحقق من Firestore:', error);
            return false;
        }
        return false;
    }

    // ====== تطبيق الترخيص على النظام ======
    applyLicenseToSystem(license) {
        try {
            const expiry = new Date(license.expiryDate);
            const now = new Date();
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            
            const premiumData = {
                type: 'premium',
                plan: license.plan || 'سنوية',
                startDate: license.createdAt || new Date().toISOString(),
                expiryDate: license.expiryDate,
                features: this.getPremiumFeatures(),
                status: 'active',
                licenseKey: 'FILE-' + license.deviceId.substring(0, 8),
                isPremium: true,
                userName: license.userName || 'مستخدم',
                userPhone: license.userPhone || '',
                daysLeft: daysLeft,
                isExpired: daysLeft <= 0
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(premiumData));
            this.licenseData = premiumData;
            this.isValidated = true;
            this.notifyListeners();
            
            // تحديث الفوتر
            const footer = document.getElementById('footer');
            if (footer) {
                footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ⭐ النسخة المدفوعة | 📞 01096597825</p>`;
            }
            
            return premiumData;
        } catch (error) {
            console.error('Apply license error:', error);
            return null;
        }
    }

    // ====== بدء النسخة المجانية (90 يوم) ======
    startFreeTrial() {
        const trialData = {
            type: 'trial',
            plan: 'trial',
            startDate: new Date().toISOString(),
            expiryDate: this.calculateExpiry(this.TRIAL_DAYS),
            features: this.getTrialFeatures(),
            status: 'active',
            isPremium: false,
            daysLeft: this.TRIAL_DAYS
        };
        
        this.licenseData = trialData;
        this.isValidated = true;
        this.saveLicense(trialData);
        this.notifyListeners();
        return trialData;
    }

    // ====== بناء بيانات الترخيص المدفوع ======
    buildPremiumData(license) {
        const expiry = new Date(license.expiryDate);
        const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        
        return {
            type: 'premium',
            plan: license.plan || 'سنوية',
            startDate: license.createdAt || new Date().toISOString(),
            expiryDate: license.expiryDate,
            features: this.getPremiumFeatures(),
            status: 'active',
            licenseKey: 'FILE-' + license.deviceId.substring(0, 8),
            isPremium: true,
            userName: license.userName,
            userPhone: license.userPhone,
            daysLeft: daysLeft
        };
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
        
        if (license.daysLeft !== undefined) {
            license.daysLeft = this.getDaysLeft(license.expiryDate);
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
        
        if (key && key.startsWith('FILE-')) {
            return true;
        }
        
        if (typeof window.verifyLicenseWithFirebase === 'function') {
            try {
                const result = await window.verifyLicenseWithFirebase(key);
                if (!result.valid) {
                    this.licenseData = null;
                    this.isValidated = false;
                    this.startFreeTrial();
                    this.notifyListeners();
                    showToast('⚠️ تم إلغاء الترخيص المدفوع، تم التحويل للنسخة المجانية.', 'error');
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
            userName: this.licenseData.userName || null,
            userPhone: this.licenseData.userPhone || null
        };
    }

    // ====== الحصول على الميزات المتاحة ======
    getFeatures() {
        if (!this.licenseData) return this.getTrialFeatures();
        if (this.licenseData.isPremium) return this.getPremiumFeatures();
        return this.getTrialFeatures();
    }

    // ====== ميزات النسخة المجانية ======
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
        if (data && data.expiryDate) {
            const daysLeft = this.getDaysLeft(data.expiryDate);
            data.daysLeft = daysLeft;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        }
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
            // التحقق من الترخيص في Firestore
            this.checkFirestoreLicense();
            
            // التحقق من ترخيص الملفات المحلي
            const fileLicense = localStorage.getItem('license_data');
            if (fileLicense) {
                try {
                    const license = JSON.parse(fileLicense);
                    const expiry = new Date(license.expiryDate);
                    if (expiry > new Date()) {
                        return;
                    } else {
                        localStorage.removeItem('license_data');
                        localStorage.removeItem('license_file');
                        if (this.licenseData && this.licenseData.isPremium) {
                            this.licenseData = null;
                            this.isValidated = false;
                            this.startFreeTrial();
                            this.notifyListeners();
                            showToast('⚠️ انتهت صلاحية الترخيص، تم التحويل للنسخة المجانية', 'error');
                        }
                    }
                } catch (e) {
                    console.warn('Periodic file license check error:', e);
                }
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
                    ⚠️ تم إلغاء الترخيص المدفوع. جاري التحويل للنسخة المجانية.
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
                if (typeof window.applyLicenseToSystem === 'function') {
                    window.applyLicenseToSystem(license);
                } else {
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
                        userName: license.userName,
                        userPhone: license.userPhone,
                        daysLeft: Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
                    };
                    
                    localStorage.setItem('app_license_data', JSON.stringify(premiumData));
                    if (typeof licenseManager !== 'undefined') {
                        licenseManager.licenseData = premiumData;
                        licenseManager.isValidated = true;
                        licenseManager.saveLicense(premiumData);
                        licenseManager.notifyListeners();
                    }
                    
                    const footer = document.getElementById('footer');
                    if (footer) {
                        footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ⭐ النسخة المدفوعة | 📞 01096597825</p>`;
                    }
                }
                return true;
            } else {
                localStorage.removeItem('license_data');
                localStorage.removeItem('license_file');
                if (typeof showToast === 'function') {
                    showToast('⚠️ انتهت صلاحية الترخيص، تم التحويل للنسخة المجانية', 'error');
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
