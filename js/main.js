// js/main.js - الكود الأساسي المشترك (محدث مع قائمة الهامبورجر)

// ====== التوست ======
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    
    if (!toast) {
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = 'toast';
        newToast.innerHTML = `<i class="fas fa-check-circle"></i> <span id="toastMessage">${message}</span>`;
        document.body.appendChild(newToast);
        toast = newToast;
    }
    
    const toastMsg = document.getElementById('toastMessage');
    if (toastMsg) toastMsg.textContent = message;
    
    toast.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { 
        toast.className = 'toast'; 
    }, 3000);
}

// ====== الوضع الليلي/النهاري ======
function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('themeModeV2', isDark ? 'dark' : 'light');
    
    // تحديث أيقونة الوضع في الهيدر
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        modeToggle.title = isDark ? 'الوضع الفاتح' : 'الوضع الغامق';
    }
}

function loadMode() {
    const mode = localStorage.getItem('themeModeV2');
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            modeToggle.title = 'الوضع الفاتح';
        }
    } else {
        document.body.classList.remove('dark-mode');
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            modeToggle.title = 'الوضع الغامق';
        }
    }
}

// ====== تحميل الألوان ======
function loadColors() {
    const primary = localStorage.getItem('primaryColor');
    const gold = localStorage.getItem('goldColor');
    const bg = localStorage.getItem('bgColor');
    const text = localStorage.getItem('textColor');
    const icon = localStorage.getItem('iconColorPicker');
    
    if (primary) {
        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-light', primary + '20');
        document.documentElement.style.setProperty('--primary-dark', primary);
    }
    if (gold) {
        document.documentElement.style.setProperty('--gold', gold);
        document.documentElement.style.setProperty('--gold-light', gold + '30');
    }
    if (bg) {
        document.documentElement.style.setProperty('--body-bg', bg);
    }
    if (text) {
        document.documentElement.style.setProperty('--text', text);
    }
    if (icon) {
        document.documentElement.style.setProperty('--icon-color', icon);
    }
}

// ====== الذهاب للصفحة الرئيسية ======
function goHome() {
    window.location.href = 'dashboard.html';
}

// ====== تحميل الهيدر والفوتر ======
function loadHeaderFooter() {
    // ✅ الهيدر القديم يتم إخفاؤه (لأن الهيدر الجديد موجود في كل صفحة)
    const headerPlaceholder = document.getElementById('header');
    if (headerPlaceholder) {
        headerPlaceholder.style.display = 'none';
    }
    
    // ✅ الفوتر
    const footerPlaceholder = document.getElementById('footer');
    if (footerPlaceholder) {
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        const isOnboardingPage = currentPage === 'onboarding.html';
        const isHelpPage = currentPage === 'help.html';
        const isSettingsPage = currentPage === 'settings.html';
        const isChangelogPage = currentPage === 'changelog.html';
        const isSirkatPage = currentPage === 'sirkat.html';
        const isLandingPage = currentPage === 'index.html';
        const isLicenseActivationPage = currentPage === 'activation-license.html';
        
        if (isOnboardingPage || isHelpPage || isSettingsPage || isChangelogPage || isSirkatPage || isLandingPage || isLicenseActivationPage) {
            footerPlaceholder.style.display = 'none';
            return;
        }
        
        // ✅ التحقق من حالة الترخيص لتحديث الفوتر
        let isPremium = false;
        let planName = 'مجانية';
        let daysLeft = 0;
        
        const appLicense = localStorage.getItem('app_license_data');
        if (appLicense) {
            try {
                const data = JSON.parse(appLicense);
                isPremium = data.isPremium || false;
                planName = data.plan || 'مجانية';
                daysLeft = data.daysLeft || 0;
            } catch (e) {}
        }
        
        const status = isPremium ? `⭐ النسخة المدفوعة (${planName} - ${daysLeft} يوم)` : '📋 النسخة المجانية';
        footerPlaceholder.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ${status} | 📞 01096597825</p>`;
    }
}

// ====== التحقق من الترخيص عند بدء التطبيق ======
async function checkLicenseOnStart() {
    // ✅ التحقق من ترخيص الملفات أولاً
    if (typeof checkFileLicenseOnStart === 'function') {
        const result = checkFileLicenseOnStart();
        if (result) {
            // الترخيص بالملفات موجود وصالح
            const footer = document.getElementById('footer');
            if (footer) {
                footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ⭐ النسخة المدفوعة | 📞 01096597825</p>`;
            }
            // تحديث حالة الترخيص في السايدبار
            updateSidebarLicenseStatus();
            return true;
        }
    }
    
    // ✅ التحقق من الترخيص العادي
    if (typeof licenseManager !== 'undefined') {
        const info = licenseManager.getLicenseInfo();
        if (info && info.isPremium && info.licenseKey) {
            if (typeof window.verifyLicenseWithFirebase === 'function') {
                try {
                    const result = await window.verifyLicenseWithFirebase(info.licenseKey);
                    if (!result.valid) {
                        licenseManager.licenseData = null;
                        licenseManager.isValidated = false;
                        licenseManager.startTrial();
                        licenseManager.notifyListeners();
                        showToast('⚠️ تم إلغاء الترخيص المدفوع، تم التحويل للنسخة التجريبية.', 'error');
                        const footer = document.getElementById('footer');
                        if (footer) {
                            footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | 📋 النسخة المجانية | 📞 01096597825</p>`;
                        }
                        updateSidebarLicenseStatus();
                        setTimeout(() => window.location.reload(), 1500);
                    }
                } catch (error) {
                    console.warn('فشل التحقق من Firebase عند بدء التشغيل:', error);
                }
            }
        }
    }
    updateSidebarLicenseStatus();
}

// ====== تحديث حالة الترخيص في السايدبار ======
function updateSidebarLicenseStatus() {
    const statusEl = document.getElementById('sidebarLicenseStatus');
    if (!statusEl) return;
    
    const appLicense = localStorage.getItem('app_license_data');
    if (appLicense) {
        try {
            const data = JSON.parse(appLicense);
            if (data.isPremium) {
                statusEl.innerHTML = `⭐ ${data.plan || 'مدفوعة'} (${data.daysLeft || 0} يوم)`;
                statusEl.style.color = 'var(--gold)';
                return;
            }
        } catch (e) {}
    }
    statusEl.innerHTML = '📋 النسخة المجانية';
    statusEl.style.color = '';
}

// ====== التهيئة العامة ======
function initApp() {
    // ✅ التحقق من الترخيص عند بدء التشغيل
    if (typeof checkLicenseOnStart === 'function') {
        checkLicenseOnStart();
    }
    
    if (typeof licenseManager !== 'undefined') {
        licenseManager.initialize();
        
        licenseManager.addListener(function(info) {
            if (info) {
                const footer = document.getElementById('footer');
                if (footer) {
                    const status = info.isPremium ? '⭐ النسخة المدفوعة' : '📋 النسخة المجانية';
                    footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ${status} | 📞 01096597825</p>`;
                }
                updateSidebarLicenseStatus();
            }
        });
    }
    
    loadMode();
    loadColors();
    loadHeaderFooter();
    
    // تحميل الشعار في الهيدر الجديد
    const logo = localStorage.getItem('companyLogo');
    if (logo && logo.startsWith('data:image')) {
        const img = document.getElementById('headerLogo');
        if (img) {
            img.src = logo;
            img.style.display = 'block';
        }
    }
    
    setTimeout(checkLicenseOnStart, 1500);
}

// ====== الاستماع لتغييرات الترخيص ======
window.addEventListener('storage', function(e) {
    if (e.key === 'app_license_data' || e.key === 'license_data') {
        updateSidebarLicenseStatus();
    }
});

document.addEventListener('DOMContentLoaded', initApp);
