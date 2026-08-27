// js/index.js - كود الصفحة الرئيسية مع التحقق من الترخيص

// ====== تحميل بيانات الترخيص ======
function loadLicenseStatus() {
    const info = licenseManager.getLicenseInfo();
    const statusEl = document.getElementById('licenseStatusText');
    
    if (!statusEl) return;
    
    if (info) {
        if (info.isPremium) {
            statusEl.innerHTML = `
                <i class="fas fa-crown" style="color: var(--gold);"></i>
                🎉 أنت مشترك في <strong>النسخة المدفوعة</strong> - جميع الميزات متاحة!
            `;
        } else {
            const daysLeft = info.daysLeft;
            let statusColor = 'var(--success)';
            let statusText = 'نشطة';
            
            if (daysLeft < 10) {
                statusColor = 'var(--danger)';
                statusText = 'تنتهي قريباً!';
            } else if (daysLeft < 30) {
                statusColor = 'var(--warning)';
                statusText = 'شبه منتهية';
            }
            
            statusEl.innerHTML = `
                <i class="fas fa-gift" style="color: var(--primary);"></i>
                📋 النسخة <strong>المجانية</strong> - متبقي <strong style="color: ${statusColor};">${daysLeft} يوماً</strong> (${statusText})
                <span style="font-size:0.75rem; opacity:0.6; margin-right:8px;">
                    | الحد الأقصى: 3 بنود، 5 عروض، 5 عملاء
                </span>
            `;
        }
    } else {
        statusEl.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
            ⚠️ لم يتم العثور على ترخيص. الرجاء تفعيل التطبيق.
        `;
    }
}

// ====== التحقق من الترخيص من Firebase عند تحميل الصفحة ======
async function verifyLicenseOnLoad() {
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

// ====== تحميل البيانات ======
function loadDashboardData() {
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const clients = JSON.parse(localStorage.getItem('savedClients') || '[]');
    const equipmentData = JSON.parse(localStorage.getItem('equipDataV12') || '[]');
    
    document.getElementById('totalOffers').textContent = offers.length;
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalEquipment').textContent = equipmentData.length || 0;
    
    let totalRevenue = 0;
    offers.forEach(offer => {
        if (offer.data && Array.isArray(offer.data)) {
            offer.data.forEach(row => {
                if (row.unitPrice && row.count) {
                    totalRevenue += row.unitPrice * row.count;
                }
            });
        }
    });
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString('en-US') + ' ج.م';
    
    renderRecentOffers(offers);
}

function renderRecentOffers(offers) {
    const tbody = document.getElementById('recentOffersList');
    if (!tbody) return;
    
    if (offers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:var(--text-light);">
                    <i class="fas fa-inbox"></i> لا توجد عروض محفوظة
                </td>
            </tr>
        `;
        return;
    }
    
    const recent = offers.slice(-5).reverse();
    tbody.innerHTML = recent.map(offer => {
        let total = 0;
        if (offer.data && Array.isArray(offer.data)) {
            offer.data.forEach(row => {
                if (row.unitPrice && row.count) {
                    total += row.unitPrice * row.count;
                }
            });
        }
        
        const status = getOfferStatus(offer);
        const statusClass = status === 'نشط' ? 'active' : status === 'منتهي' ? 'expired' : 'pending';
        
        return `
            <tr onclick="location.href='quotation.html'">
                <td><strong>${offer.name || 'عرض غير مسمى'}</strong></td>
                <td>${offer.targetCompany || 'غير محدد'}</td>
                <td>${offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')}</td>
                <td>${total.toLocaleString('en-US')} ج.م</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

function getOfferStatus(offer) {
    if (!offer) return 'قيد الانتظار';
    const expiryDate = offer.expiryDate || offer.validityDate;
    if (expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        if (now > expiry) return 'منتهي';
        if (now < new Date(expiry.getTime() - 7 * 24 * 60 * 60 * 1000)) return 'نشط';
        return 'قيد الانتظار';
    }
    return 'نشط';
}

// ====== التهيئة ======
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة الترخيص
    licenseManager.initialize();
    
    licenseManager.addListener(function(info) {
        if (info) {
            loadLicenseStatus();
        }
    });
    
    setTimeout(function() {
        loadLicenseStatus();
        loadDashboardData();
        verifyLicenseOnLoad();
    }, 150);
});