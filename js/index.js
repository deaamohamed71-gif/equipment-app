// js/index.js - كود الصفحة الرئيسية

// ====== تحميل البيانات ======
function loadDashboardData() {
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const clients = JSON.parse(localStorage.getItem('savedClients') || '[]');
    const equipmentData = JSON.parse(localStorage.getItem('equipDataV12') || '[]');
    
    // تحديث الإحصائيات
    document.getElementById('totalOffers').textContent = offers.length;
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalEquipment').textContent = equipmentData.length || 0;
    
    // حساب الإيرادات الإجمالية
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
    
    // عرض أحدث العروض
    renderRecentOffers(offers);
}

// ====== عرض أحدث العروض ======
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
    
    // عرض آخر 5 عروض
    const recent = offers.slice(-5).reverse();
    tbody.innerHTML = recent.map(offer => {
        // حساب الإجمالي
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
                <td>${offer.createdAt || new Date().toLocaleDateString('ar-EG')}</td>
                <td>${total.toLocaleString('en-US')} ج.م</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

// ====== تحديد حالة العرض ======
function getOfferStatus(offer) {
    if (!offer) return 'قيد الانتظار';
    
    // التحقق من تاريخ الصلاحية
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
    // تأخير التحميل قليلاً لضمان تحميل الهيدر
    setTimeout(loadDashboardData, 100);
});