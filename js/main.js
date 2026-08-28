// js/main.js - الكود الأساسي المشترك (محدث مع روابط dashboard.html)

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
    
    document.querySelectorAll('.mode-toggle').forEach(btn => {
        btn.innerHTML = isDark ? 
            '<i class="fas fa-sun"></i> فاتح' : 
            '<i class="fas fa-moon"></i> غامق';
    });
}

function loadMode() {
    const mode = localStorage.getItem('themeModeV2');
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
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

// ====== تحميل الهيدر والفوتر ======
function loadHeaderFooter() {
    const headerPlaceholder = document.getElementById('header');
    if (headerPlaceholder) {
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        const isDark = document.body.classList.contains('dark-mode');
        const isActivationPage = currentPage === 'activation.html';
        const isHelpPage = currentPage === 'help.html';
        const isOnboardingPage = currentPage === 'onboarding.html';
        const isSettingsPage = currentPage === 'settings.html';
        const isChangelogPage = currentPage === 'changelog.html';
        const isSirkatPage = currentPage === 'sirkat.html';
        const isLandingPage = currentPage === 'index.html';
        
        // إخفاء الهيدر في صفحات معينة
        if (isOnboardingPage || isHelpPage || isSettingsPage || isChangelogPage || isSirkatPage || isLandingPage) {
            headerPlaceholder.style.display = 'none';
            return;
        }
        
        headerPlaceholder.innerHTML = `
            <div class="header-logo">
                <img id="headerLogo" src="" alt="الشعار" style="display:none;" />
                <h1><i class="fas fa-crown" style="color:var(--gold);"></i> عروض المعدات</h1>
            </div>
            <nav class="header-nav">
                <a href="dashboard.html" ${currentPage === 'dashboard.html' ? 'class="active"' : ''}>
                    <i class="fas fa-home"></i> الرئيسية
                </a>
                <a href="quotation.html" ${currentPage === 'quotation.html' ? 'class="active"' : ''}>
                    <i class="fas fa-file-invoice"></i> العرض
                </a>
                <a href="company.html" ${currentPage === 'company.html' ? 'class="active"' : ''}>
                    <i class="fas fa-building"></i> الشركة
                </a>
                <a href="reports.html" ${currentPage === 'reports.html' ? 'class="active"' : ''}>
                    <i class="fas fa-chart-bar"></i> التقارير
                </a>
                <a href="design.html" ${currentPage === 'design.html' ? 'class="active"' : ''}>
                    <i class="fas fa-palette"></i> التصميم
                </a>
                ${!isActivationPage ? `
                    <a href="sirkat.html" class="btn btn-teal" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
                        <i class="fas fa-clipboard-list"></i> سركات
                    </a>
                    <a href="changelog.html" class="btn btn-info" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
                        <i class="fas fa-history"></i> التحديثات
                    </a>
                    <a href="help.html" class="btn btn-info" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
                        <i class="fas fa-question-circle"></i> التعليمات
                    </a>
                    <a href="settings.html" class="btn btn-purple" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
                        <i class="fas fa-tools"></i> المطور
                    </a>
                    <a href="activation.html" class="btn btn-gold" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
                        <i class="fas fa-key"></i> التفعيل
                    </a>
                ` : ''}
                <button class="btn mode-toggle" onclick="toggleMode()">
                    <i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i> 
                    ${isDark ? 'فاتح' : 'غامق'}
                </button>
            </nav>
        `;
        
        const logo = localStorage.getItem('companyLogo');
        if (logo && logo.startsWith('data:image')) {
            const img = document.getElementById('headerLogo');
            img.src = logo;
            img.style.display = 'block';
        }
    }
    
    const footerPlaceholder = document.getElementById('footer');
    if (footerPlaceholder) {
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        const isOnboardingPage = currentPage === 'onboarding.html';
        const isHelpPage = currentPage === 'help.html';
        const isSettingsPage = currentPage === 'settings.html';
        const isChangelogPage = currentPage === 'changelog.html';
        const isSirkatPage = currentPage === 'sirkat.html';
        const isLandingPage = currentPage === 'index.html';
        
        if (isOnboardingPage || isHelpPage || isSettingsPage || isChangelogPage || isSirkatPage || isLandingPage) {
            footerPlaceholder.style.display = 'none';
            return;
        }
        
        const features = licenseManager ? licenseManager.getFeatures() : { isPremium: false };
        const status = features.isPremium ? '⭐ النسخة المدفوعة' : '📋 النسخة المجانية';
        
        footerPlaceholder.innerHTML = `
            <p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ${status}</p>
        `;
    }
}

// ====== التحقق من الترخيص عند بدء التطبيق ======
async function checkLicenseOnStart() {
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
                            footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | 📋 النسخة المجانية</p>`;
                        }
                        setTimeout(() => window.location.reload(), 1500);
                    }
                } catch (error) {
                    console.warn('فشل التحقق من Firebase عند بدء التشغيل:', error);
                }
            }
        }
    }
}

// ====== التهيئة العامة ======
function initApp() {
    if (typeof licenseManager !== 'undefined') {
        licenseManager.initialize();
        
        licenseManager.addListener(function(info) {
            if (info) {
                const footer = document.getElementById('footer');
                if (footer) {
                    const status = info.isPremium ? '⭐ النسخة المدفوعة' : '📋 النسخة المجانية';
                    footer.innerHTML = `<p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة | ${status}</p>`;
                }
            }
        });
    }
    
    loadMode();
    loadColors();
    loadHeaderFooter();
    
    setTimeout(checkLicenseOnStart, 1500);
}

document.addEventListener('DOMContentLoaded', initApp);