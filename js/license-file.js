// js/license-file.js - نظام الترخيص بالملفات (محدث)
// إضافة دالة لتطبيق الترخيص على النظام بشكل كامل

// ====== تطبيق الترخيص على النظام ======
function applyLicenseToSystem(license) {
    try {
        // حساب الأيام المتبقية
        const expiry = new Date(license.expiryDate);
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        // بيانات الترخيص المدفوع
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
            daysLeft: daysLeft,
            isExpired: daysLeft <= 0
        };
        
        // حفظ في localStorage
        localStorage.setItem('app_license_data', JSON.stringify(premiumData));
        
        // تحديث مدير الترخيص
        if (typeof licenseManager !== 'undefined') {
            licenseManager.licenseData = premiumData;
            licenseManager.isValidated = true;
            licenseManager.saveLicense(premiumData);
            licenseManager.notifyListeners();
        }
        
        // تحديث الفوتر
        updateFooterStatus(true);
        
        return { success: true, daysLeft: daysLeft };
    } catch (error) {
        console.error('Apply license error:', error);
        return { success: false, error: error.message };
    }
}

// ====== تحديث الفوتر ======
function updateFooterStatus(isPremium) {
    const footer = document.getElementById('footer');
    if (footer) {
        const status = isPremium ? '⭐ النسخة المدفوعة' : '📋 النسخة المجانية';
        footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ${status} | 📞 01096597825</p>`;
    }
}

// ====== تفعيل الترخيص (محدث) ======
function activateLicense() {
    try {
        const savedLicense = localStorage.getItem('license_data');
        if (!savedLicense) {
            showToast('⚠️ يرجى رفع ملف الترخيص أولاً', 'error');
            return;
        }
        
        const license = JSON.parse(savedLicense);
        
        // التحقق من الصلاحية
        const expiry = new Date(license.expiryDate);
        if (expiry < new Date()) {
            showLicenseError('❌ انتهت صلاحية الترخيص!');
            return;
        }
        
        // تطبيق الترخيص على النظام
        const result = applyLicenseToSystem(license);
        
        if (result.success) {
            showToast(`🎉 تم تفعيل النسخة الاحترافية بنجاح! (متبقي ${result.daysLeft} يوم)`, 'success');
            
            // تحديث عرض معلومات الترخيص
            displayLicenseInfo(license);
            
            // الانتقال للصفحة الرئيسية بعد ثانية
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showToast('❌ حدث خطأ أثناء التفعيل', 'error');
        }
    } catch (error) {
        console.error('Activation error:', error);
        showToast('❌ حدث خطأ أثناء التفعيل', 'error');
    }
}

// ====== عرض عداد الأيام في معلومات الترخيص ======
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
            daysEl.textContent = daysLeft > 0 ? `${daysLeft} يوم متبقي` : '⛔ انتهى الترخيص';
            
            // تغيير اللون حسب المدة المتبقية
            if (daysLeft <= 0) {
                daysEl.style.color = 'var(--danger)';
            } else if (daysLeft < 7) {
                daysEl.style.color = 'var(--warning)';
            } else {
                daysEl.style.color = 'var(--success)';
            }
        }
    } catch (error) {
        console.error('Display license info error:', error);
    }
}
