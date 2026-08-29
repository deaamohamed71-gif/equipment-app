// js/index.js - كود الصفحة الرئيسية (محدث للتحقق من حالة الترخيص + الإشعارات)

// ====== تحميل بيانات الترخيص ======
function loadLicenseStatus() {
    // ✅ التحقق من وجود ترخيص مدفوع مطبق
    const appLicense = localStorage.getItem('app_license_data');
    const statusEl = document.getElementById('licenseStatusText');
    const planDetails = document.getElementById('planDetails');
    
    if (appLicense) {
        try {
            const data = JSON.parse(appLicense);
            if (data.isPremium) {
                if (statusEl) {
                    statusEl.innerHTML = `
                        <i class="fas fa-crown" style="color: var(--gold);"></i>
                        🎉 أنت مشترك في <strong>النسخة المدفوعة</strong> - جميع الميزات متاحة!
                        <span style="font-size:0.75rem; opacity:0.7; margin-right:8px;">
                            | الخطة: ${data.plan || 'مدفوعة'} | متبقي: ${data.daysLeft || 0} يوم
                        </span>
                    `;
                }
                if (planDetails) {
                    planDetails.textContent = `📋 الخطة: ${data.plan || 'مدفوعة'} (${data.daysLeft || 0} يوم متبقي)`;
                    planDetails.style.display = 'block';
                    planDetails.style.color = 'var(--gold)';
                    planDetails.style.fontWeight = '600';
                }
                return true;
            }
        } catch (e) {
            console.warn('Invalid app license data:', e);
        }
    }
    
    // ✅ لو مش مدفوع، اعرض الحالة من licenseManager
    if (statusEl && typeof licenseManager !== 'undefined') {
        const info = licenseManager.getLicenseInfo();
        if (info) {
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
            
            if (planDetails) {
                planDetails.textContent = '📋 الخطة: تجريبية (90 يوم)';
                planDetails.style.display = 'block';
                planDetails.style.color = 'var(--text-light)';
                planDetails.style.fontWeight = '400';
            }
        }
    }
    
    return false;
}

// ====== تحميل الإشعارات ======
function loadNotifications() {
    const container = document.getElementById('notificationsList');
    const countEl = document.getElementById('notifCount');
    
    if (!container) return;
    
    // جلب الإشعارات من localStorage
    let notifications = [];
    try {
        notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    } catch (e) {
        notifications = [];
    }
    
    // تحديث العدد
    if (countEl) {
        countEl.textContent = notifications.length;
        countEl.style.display = notifications.length > 0 ? 'inline-block' : 'none';
    }
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;color:var(--text-light);padding:1.5rem;">
                <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>
                لا توجد إشعارات جديدة
            </div>
        `;
        return;
    }
    
    // عرض أحدث 10 إشعارات (الأحدث أولاً)
    const recent = [...notifications].reverse().slice(0, 10);
    
    container.innerHTML = recent.map((notif, index) => {
        const isNew = notif.timestamp && (new Date(notif.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000));
        return `
            <div class="notification-item" style="padding:0.6rem 0.8rem;border-bottom:1px solid var(--border);display:flex;gap:0.8rem;align-items:flex-start;background:${isNew ? 'rgba(201,168,76,0.05)' : 'transparent'};border-radius:8px;transition:all 0.3s;">
                <i class="fas fa-bell" style="color:var(--gold);font-size:1.1rem;margin-top:0.2rem;"></i>
                <div style="flex:1;">
                    <strong style="font-size:0.9rem;color:var(--text);display:block;">${notif.title || 'إشعار'}</strong>
                    <p style="font-size:0.8rem;color:var(--text-light);margin:0.2rem 0;">${notif.message || ''}</p>
                    <span style="font-size:0.6rem;color:var(--text-light);opacity:0.6;">
                        ${notif.timestamp ? new Date(notif.timestamp).toLocaleString('ar-EG') : ''}
                        ${isNew ? '🆕 جديد' : ''}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    // تحديث آخر ظهور للإشعارات
    if (notifications.length > 0) {
        localStorage.setItem('last_notification_view', new Date().toISOString());
    }
}

// ====== عرض إشعار منبثق (Toast) عند وجود إشعارات جديدة ======
function showNotificationToast() {
    try {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const lastShown = localStorage.getItem('last_notification_shown') || '1970-01-01';
        
        // الإشعارات الجديدة فقط
        const newNotifs = notifications.filter(n => n.timestamp && n.timestamp > lastShown);
        
        if (newNotifs.length > 0) {
            // عرض أحدث إشعار جديد
            const latest = newNotifs[newNotifs.length - 1];
            if (typeof showToast === 'function') {
                showToast(`🔔 ${latest.title || 'إشعار جديد'}: ${latest.message || ''}`, 'success');
            } else {
                alert(`🔔 ${latest.title || 'إشعار جديد'}\n\n${latest.message || ''}`);
            }
            localStorage.setItem('last_notification_shown', new Date().toISOString());
        }
    } catch (e) {
        console.warn('Error showing notification toast:', e);
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

// ====== إضافة إشعار تجريبي (للتجربة) ======
function addTestNotification() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push({
        title: '📢 تحديث جديد',
        message: 'تم إضافة نظام الإشعارات في لوحة التحكم',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    loadNotifications();
    showNotificationToast();
    if (typeof showToast === 'function') {
        showToast('✅ تم إضافة إشعار تجريبي', 'success');
    }
}

// ====== الاستماع لتغييرات الإشعارات (من localStorage) ======
window.addEventListener('storage', function(e) {
    if (e.key === 'notifications') {
        loadNotifications();
    }
    if (e.key === 'app_license_data' || e.key === 'license_data') {
        loadLicenseStatus();
    }
});

// ====== التهيئة ======
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة الترخيص
    if (typeof licenseManager !== 'undefined') {
        licenseManager.initialize();
    }
    
    if (typeof licenseManager !== 'undefined') {
        licenseManager.addListener(function(info) {
            if (info) {
                loadLicenseStatus();
            }
        });
    }
    
    setTimeout(function() {
        loadLicenseStatus();
        loadDashboardData();
        loadNotifications();
        
        // عرض الإشعارات الجديدة بعد ثانية
        setTimeout(function() {
            showNotificationToast();
        }, 1000);
    }, 150);
    
    // ✅ إضافة زر تجريبي للإشعارات (في Console)
    console.log('📢 لإضافة إشعار تجريبي، اكتب: addTestNotification()');
});

// جعل الدوال متاحة عالمياً
window.addTestNotification = addTestNotification;
window.loadNotifications = loadNotifications;
