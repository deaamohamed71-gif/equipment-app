// js/activation.js - كود صفحة التفعيل (محدث لربط الخطط بترخيص الملفات)

// ====== تحميل بيانات الترخيص ======
function loadActivationData() {
    const info = licenseManager.getLicenseInfo();
    if (!info) return;
    
    const statusTitle = document.getElementById('statusTitle');
    const statusDays = document.getElementById('statusDays');
    const statusBarFill = document.getElementById('statusBarFill');
    const statusIcon = document.getElementById('statusIcon');
    const planDetails = document.getElementById('planDetails');
    
    if (info.isPremium) {
        const planNames = {
            'monthly': 'شهرية',
            'yearly': 'سنوية',
            'premium': 'مدفوعة'
        };
        
        const planEmojis = {
            'monthly': '📅',
            'yearly': '📆',
            'premium': '⭐'
        };
        
        const planName = planNames[info.plan] || 'مدفوعة';
        const planEmoji = planEmojis[info.plan] || '⭐';
        
        statusTitle.textContent = `🎉 النسخة المدفوعة (${planName})`;
        statusTitle.style.color = 'var(--gold)';
        statusDays.textContent = `✅ ${planEmoji} متبقي ${info.daysLeft} يوماً`;
        statusBarFill.style.width = '100%';
        statusBarFill.style.background = 'var(--gold)';
        statusIcon.innerHTML = '<i class="fas fa-crown" style="color: var(--gold);"></i>';
        
        if (planDetails) {
            planDetails.textContent = `📋 الخطة: ${planName} (${info.daysLeft} يوم متبقي)`;
            planDetails.style.display = 'block';
            planDetails.style.color = 'var(--gold)';
            planDetails.style.fontWeight = '600';
        }
    } else {
        statusTitle.textContent = '📋 النسخة المجانية';
        statusTitle.style.color = 'var(--primary)';
        const daysLeft = info.daysLeft;
        statusDays.textContent = `⏳ المتبقي: ${daysLeft} يوماً`;
        const percentage = (daysLeft / 90) * 100;
        statusBarFill.style.width = Math.min(100, percentage) + '%';
        statusBarFill.style.background = daysLeft > 30 ? 'var(--success)' : daysLeft > 10 ? 'var(--warning)' : 'var(--danger)';
        statusIcon.innerHTML = '<i class="fas fa-gift" style="color: var(--primary);"></i>';
        
        if (planDetails) {
            planDetails.textContent = '📋 الخطة: تجريبية (90 يوم)';
            planDetails.style.display = 'block';
            planDetails.style.color = 'var(--text-light)';
            planDetails.style.fontWeight = '400';
        }
    }
    
    updateFeatures(info);
}

// ====== تحديث الميزات ======
function updateFeatures(info) {
    const features = info.features;
    
    const freeItems = document.querySelectorAll('#freeFeatures li');
    const freeIcons = [
        features.maxItems >= 3,
        features.maxOffers >= 5,
        features.maxClients >= 5,
        features.canExportPDF,
        features.canReports,
        features.canSignatures,
        features.canFullDesign,
        features.canExportExcel
    ];
    
    freeItems.forEach((item, index) => {
        const icon = item.querySelector('i');
        if (freeIcons[index]) {
            icon.className = 'fas fa-check';
            icon.style.color = 'var(--success)';
        } else {
            icon.className = 'fas fa-times';
            icon.style.color = 'var(--danger)';
        }
    });
    
    const premiumItems = document.querySelectorAll('#premiumFeatures li');
    const premiumIcons = [
        features.maxItems === Infinity,
        features.maxOffers === Infinity,
        features.maxClients === Infinity,
        !features.showWatermark,
        features.canReports,
        features.canSignatures,
        features.canFullDesign,
        features.canExportExcel
    ];
    
    premiumItems.forEach((item, index) => {
        const icon = item.querySelector('i');
        if (info.isPremium && premiumIcons[index]) {
            icon.className = 'fas fa-check';
            icon.style.color = 'var(--success)';
        } else {
            icon.className = 'fas fa-times';
            icon.style.color = 'var(--text-light)';
        }
    });
}

// ====== تفعيل الترخيص (مع Firebase) ======
async function activateLicense() {
    const input = document.getElementById('licenseKeyInput');
    const key = input.value.trim();
    const messageEl = document.getElementById('activationMessage');
    
    if (!key) {
        messageEl.innerHTML = '<span style="color: var(--danger);">⚠️ الرجاء إدخال مفتاح التفعيل</span>';
        return;
    }
    
    messageEl.innerHTML = '<span style="color: var(--primary);">⏳ جاري التحقق من المفتاح...</span>';
    
    const result = await licenseManager.activateLicense(key);
    messageEl.innerHTML = `<span style="color: ${result.success ? 'var(--success)' : 'var(--danger)'};">${result.message}</span>`;
    
    if (result.success) {
        setTimeout(() => {
            loadActivationData();
            showToast('🎉 تم تفعيل النسخة المدفوعة بنجاح!', 'success');
        }, 500);
    }
    
    input.value = '';
}

// ====== اختيار خطة (محدث - توجيه لصفحة ترخيص الملفات) ======
function selectPlan(plan) {
    // ✅ توجيه المستخدم مباشرة إلى صفحة ترخيص الملفات
    // مع تمرير الخطة المختارة كمعامل في الرابط
    window.location.href = `activation-license.html?plan=${plan}`;
}

// ====== التحقق من الترخيص من Firebase عند تحميل صفحة التفعيل ======
async function verifyLicenseOnActivationPage() {
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
                    showToast('⚠️ تم إلغاء الترخيص المدفوع.', 'error');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (error) {
                console.warn('فشل التحقق من Firebase:', error);
            }
        }
    }
}

// ====== التهيئة ======
document.addEventListener('DOMContentLoaded', function() {
    licenseManager.initialize();
    
    setTimeout(() => {
        loadActivationData();
        verifyLicenseOnActivationPage();
    }, 100);
    
    licenseManager.addListener(function(info) {
        if (info) {
            loadActivationData();
        }
    });
});

// ====== دالة للرجوع إلى الصفحة الرئيسية ======
function goHome() {
    window.location.href = 'dashboard.html';
}
