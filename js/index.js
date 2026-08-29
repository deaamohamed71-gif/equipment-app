// js/index.js - كود الصفحة الرئيسية (محدث للتحقق من حالة الترخيص + الإشعارات الفورية من Firebase باستخدام onSnapshot)

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

// ============================================================
//  ✅ الإشعارات (باستخدام onSnapshot للاستماع الفوري)
// ============================================================

// ====== تحميل الإشعارات من Firebase (استماع فوري) ======
async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    const countEl = document.getElementById('notifCount');
    
    if (!container) return;
    
    try {
        const db = window.firebaseDB;
        if (!db) {
            loadNotificationsLocal();
            return;
        }
        
        // ✅ إلغاء الاشتراك السابق إن وجد
        if (window.unsubscribeNotifications) {
            window.unsubscribeNotifications();
            window.unsubscribeNotifications = null;
        }
        
        // ✅ استخدام onSnapshot للاستماع الفوري
        const notificationsRef = window.collection(db, 'notifications');
        const q = window.query(notificationsRef, window.orderBy('timestamp', 'desc'), window.limit(1));
        
        window.unsubscribeNotifications = window.onSnapshot(q, (querySnapshot) => {
            const notifications = [];
            querySnapshot.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            
            // ✅ عرض الإشعار الأحدث فقط
            renderNotifications(notifications, container, countEl);
            
            // عرض إشعار منبثق للإشعارات الجديدة
            if (notifications.length > 0) {
                showNewNotificationToast(notifications);
            }
            
        }, (error) => {
            console.warn('Error listening to notifications:', error);
            loadNotificationsLocal();
        });
        
    } catch (error) {
        console.warn('Error setting up notifications listener:', error);
        loadNotificationsLocal();
    }
}

// ====== عرض الإشعار الأحدث فقط في الواجهة ======
function renderNotifications(notifications, container, countEl) {
    // ✅ تحديث العدد
    if (countEl) {
        if (notifications.length > 0) {
            countEl.textContent = '1';
            countEl.style.display = 'inline-block';
        } else {
            countEl.textContent = '0';
            countEl.style.display = 'none';
        }
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
    
    // ✅ عرض أحدث إشعار فقط (الأول في القائمة)
    const latest = notifications[0];
    const isNew = !latest.read && (latest.timestamp && (new Date(latest.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)));
    
    container.innerHTML = `
        <div class="notification-item" style="padding:0.8rem 1rem;display:flex;gap:0.8rem;align-items:flex-start;background:${isNew ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.03)'};border-radius:10px;border:1px solid ${isNew ? 'var(--gold)' : 'var(--border)'};transition:all 0.3s;cursor:pointer;" onclick="markNotificationRead('${latest.id}')">
            <i class="fas fa-bell" style="color:var(--gold);font-size:1.2rem;margin-top:0.2rem;"></i>
            <div style="flex:1;">
                <strong style="font-size:0.95rem;color:var(--text);display:block;">${latest.title || 'إشعار'}</strong>
                <p style="font-size:0.85rem;color:var(--text-light);margin:0.3rem 0;">${latest.message || ''}</p>
                <span style="font-size:0.65rem;color:var(--text-light);opacity:0.6;">
                    ${latest.timestamp ? new Date(latest.timestamp).toLocaleString('ar-EG') : ''}
                    ${isNew ? ' 🆕 جديد' : ''}
                </span>
            </div>
            ${isNew ? `<span style="background:var(--gold);color:#fff;padding:0.1rem 0.6rem;border-radius:12px;font-size:0.6rem;font-weight:700;">جديد</span>` : ''}
        </div>
    `;
    
    // ✅ تحديث آخر ظهور
    localStorage.setItem('last_notification_view', new Date().toISOString());
}

// ====== عرض الإشعارات من localStorage (احتياطي) ======
function loadNotificationsLocal() {
    const container = document.getElementById('notificationsList');
    const countEl = document.getElementById('notifCount');
    
    let notifications = [];
    try {
        notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    } catch (e) {
        notifications = [];
    }
    
    // ✅ عرض أحدث إشعار فقط
    if (countEl) {
        if (notifications.length > 0) {
            countEl.textContent = '1';
            countEl.style.display = 'inline-block';
        } else {
            countEl.textContent = '0';
            countEl.style.display = 'none';
        }
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
    
    // ✅ عرض أحدث إشعار
    const latest = notifications[notifications.length - 1];
    const isNew = !latest.read && (latest.timestamp && (new Date(latest.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)));
    
    container.innerHTML = `
        <div class="notification-item" style="padding:0.8rem 1rem;display:flex;gap:0.8rem;align-items:flex-start;background:${isNew ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.03)'};border-radius:10px;border:1px solid ${isNew ? 'var(--gold)' : 'var(--border)'};">
            <i class="fas fa-bell" style="color:var(--gold);font-size:1.2rem;margin-top:0.2rem;"></i>
            <div style="flex:1;">
                <strong style="font-size:0.95rem;color:var(--text);display:block;">${latest.title || 'إشعار'}</strong>
                <p style="font-size:0.85rem;color:var(--text-light);margin:0.3rem 0;">${latest.message || ''}</p>
                <span style="font-size:0.65rem;color:var(--text-light);opacity:0.6;">
                    ${latest.timestamp ? new Date(latest.timestamp).toLocaleString('ar-EG') : ''}
                    ${isNew ? ' 🆕 جديد' : ''}
                </span>
            </div>
            ${isNew ? `<span style="background:var(--gold);color:#fff;padding:0.1rem 0.6rem;border-radius:12px;font-size:0.6rem;font-weight:700;">جديد</span>` : ''}
        </div>
    `;
}

// ====== عرض إشعار منبثق للإشعارات الجديدة ======
function showNewNotificationToast(notifications) {
    try {
        const lastShown = localStorage.getItem('last_notification_shown') || '1970-01-01';
        
        // الإشعارات الجديدة فقط (غير مقروءة ومحدثة)
        const newNotifs = notifications.filter(n => 
            !n.read && n.timestamp && n.timestamp > lastShown
        );
        
        if (newNotifs.length > 0) {
            // عرض أحدث إشعار جديد
            const latest = newNotifs[0];
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

// ====== تعليم الإشعار كمقروء ======
async function markNotificationRead(notificationId) {
    try {
        const db = window.firebaseDB;
        if (db) {
            const docRef = window.doc(db, 'notifications', notificationId);
            await window.updateDoc(docRef, {
                read: true,
                readAt: new Date().toISOString()
            });
            console.log('✅ تم تعليم الإشعار كمقروء');
            
            // ✅ تحديث الواجهة (حيث أن onSnapshot هيعملها تلقائياً)
        }
    } catch (error) {
        console.warn('Error marking notification as read:', error);
        // تعليم كمقروء محلياً
        markNotificationReadLocal(notificationId);
    }
}

// ====== تعليم الإشعار كمقروء محلياً (احتياطي) ======
function markNotificationReadLocal(notificationId) {
    try {
        let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications = notifications.map(n => {
            if (n.id === notificationId || n.timestamp === notificationId) {
                return { ...n, read: true, readAt: new Date().toISOString() };
            }
            return n;
        });
        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotificationsLocal();
    } catch (e) {
        console.warn('Error marking notification as read locally:', e);
    }
}

// ====== تحميل بيانات لوحة التحكم ======
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
    const notification = {
        id: 'test_' + Date.now(),
        title: '📢 تحديث جديد',
        message: 'تم إضافة نظام الإشعارات في لوحة التحكم (تجريبي)',
        timestamp: new Date().toISOString(),
        read: false
    };
    localStorage.setItem('notifications', JSON.stringify([notification]));
    loadNotifications();
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
    }, 150);
    
    // ✅ تنبيه: الإشعارات الآن تعمل بـ onSnapshot (استماع فوري) وتعرض أحدث إشعار فقط
    console.log('📢 الإشعارات تعمل بـ onSnapshot - تظهر فوراً عند إرسالها');
    console.log('📢 يتم عرض أحدث إشعار فقط (تم مسح القديم)');
    console.log('📢 لإضافة إشعار تجريبي، اكتب: addTestNotification()');
});

// جعل الدوال متاحة عالمياً
window.addTestNotification = addTestNotification;
window.loadNotifications = loadNotifications;
window.markNotificationRead = markNotificationRead;
