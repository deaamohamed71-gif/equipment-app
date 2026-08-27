// js/reports.js - كود صفحة التقارير

let offersChart = null;
let clientsChart = null;

// ====== تحميل البيانات ======
function loadReportData() {
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const clients = JSON.parse(localStorage.getItem('savedClients') || '[]');
    
    // تحميل العملاء في الفلتر
    const clientSelect = document.getElementById('reportClient');
    if (clientSelect) {
        clientSelect.innerHTML = '<option value="">الكل</option>';
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            clientSelect.appendChild(opt);
        });
    }
    
    // تعيين التواريخ الافتراضية
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const fromEl = document.getElementById('reportFrom');
    const toEl = document.getElementById('reportTo');
    if (fromEl) fromEl.value = firstDay.toISOString().split('T')[0];
    if (toEl) toEl.value = lastDay.toISOString().split('T')[0];
    
    generateReport();
}

// ====== توليد التقرير ======
function generateReport() {
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const from = document.getElementById('reportFrom')?.value;
    const to = document.getElementById('reportTo')?.value;
    const client = document.getElementById('reportClient')?.value;
    const status = document.getElementById('reportStatus')?.value;
    
    // فلترة العروض
    let filtered = offers.filter(offer => {
        // فلتر التاريخ
        if (from || to) {
            const date = offer.createdAt || offer.expiryDate;
            if (date) {
                const d = new Date(date);
                if (from && d < new Date(from)) return false;
                if (to && d > new Date(to)) return false;
            }
        }
        // فلتر العميل
        if (client && offer.targetCompany !== client) return false;
        // فلتر الحالة
        if (status) {
            const offerStatus = getOfferStatus(offer);
            const statusMap = {
                'active': 'نشط',
                'expired': 'منتهي',
                'pending': 'قيد الانتظار'
            };
            if (offerStatus !== statusMap[status]) return false;
        }
        return true;
    });
    
    updateReportStats(filtered);
    renderReportTable(filtered);
    updateCharts(filtered);
}

// ====== تحديث الإحصائيات ======
function updateReportStats(offers) {
    let totalRevenue = 0;
    let activeOffers = 0;
    let uniqueClients = new Set();
    
    offers.forEach(offer => {
        if (offer.data && Array.isArray(offer.data)) {
            offer.data.forEach(row => {
                if (row.unitPrice && row.count) {
                    totalRevenue += row.unitPrice * row.count;
                }
            });
        }
        if (offer.targetCompany) uniqueClients.add(offer.targetCompany);
        if (getOfferStatus(offer) === 'نشط') activeOffers++;
    });
    
    document.getElementById('reportTotalOffers').textContent = offers.length;
    document.getElementById('reportTotalRevenue').textContent = totalRevenue.toLocaleString('en-US') + ' ج.م';
    document.getElementById('reportUniqueClients').textContent = uniqueClients.size;
    document.getElementById('reportActiveOffers').textContent = activeOffers;
}

// ====== عرض جدول التقارير ======
function renderReportTable(offers) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;
    
    if (offers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;color:var(--text-light);">
                    <i class="fas fa-inbox"></i> لا توجد عروض مطابقة للفلتر
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = offers.map(offer => {
        let total = 0;
        let tax = 0;
        if (offer.data && Array.isArray(offer.data)) {
            offer.data.forEach(row => {
                if (row.unitPrice && row.count) {
                    total += row.unitPrice * row.count;
                }
            });
        }
        tax = total * 0.14; // ضريبة 14%
        
        const status = getOfferStatus(offer);
        const statusClass = status === 'نشط' ? 'active' : status === 'منتهي' ? 'expired' : 'pending';
        
        return `
            <tr onclick="location.href='quotation.html'">
                <td><strong>${offer.name || 'عرض غير مسمى'}</strong></td>
                <td>${offer.targetCompany || 'غير محدد'}</td>
                <td>${offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                <td>${total.toLocaleString('en-US')} ج.م</td>
                <td>${tax.toLocaleString('en-US')} ج.م</td>
                <td>${(total + tax).toLocaleString('en-US')} ج.م</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();viewOffer('${offer.name}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ====== حالة العرض ======
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

// ====== عرض العرض ======
function viewOffer(name) {
    if (name) {
        localStorage.setItem('viewOfferName', name);
        window.location.href = 'quotation.html';
    }
}

// ====== الرسوم البيانية ======
function updateCharts(offers) {
    // إحصائيات العروض حسب الشهر
    const monthlyData = {};
    offers.forEach(offer => {
        if (offer.createdAt) {
            const month = new Date(offer.createdAt).getMonth();
            const year = new Date(offer.createdAt).getFullYear();
            const key = `${year}-${month + 1}`;
            monthlyData[key] = (monthlyData[key] || 0) + 1;
        }
    });
    
    const months = Object.keys(monthlyData).sort();
    const counts = months.map(m => monthlyData[m]);
    
    // إحصائيات العملاء
    const clientData = {};
    offers.forEach(offer => {
        if (offer.targetCompany) {
            clientData[offer.targetCompany] = (clientData[offer.targetCompany] || 0) + 1;
        }
    });
    
    const clientLabels = Object.keys(clientData);
    const clientCounts = Object.values(clientData);
    
    // تحديث رسم العروض
    const ctx1 = document.getElementById('offersChart')?.getContext('2d');
    if (ctx1) {
        if (offersChart) offersChart.destroy();
        const chartType = document.getElementById('chartType')?.value || 'bar';
        offersChart = new Chart(ctx1, {
            type: chartType,
            data: {
                labels: months.map(m => {
                    const [year, month] = m.split('-');
                    return `${month}/${year}`;
                }),
                datasets: [{
                    label: 'عدد العروض',
                    data: counts,
                    backgroundColor: 'rgba(26, 107, 138, 0.6)',
                    borderColor: 'rgba(26, 107, 138, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // تحديث رسم العملاء
    const ctx2 = document.getElementById('clientsChart')?.getContext('2d');
    if (ctx2) {
        if (clientsChart) clientsChart.destroy();
        const colors = [
            'rgba(201, 168, 76, 0.6)',
            'rgba(26, 107, 138, 0.6)',
            'rgba(45, 143, 74, 0.6)',
            'rgba(192, 57, 43, 0.6)',
            'rgba(230, 126, 34, 0.6)',
            'rgba(106, 52, 131, 0.6)'
        ];
        clientsChart = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: clientLabels,
                datasets: [{
                    data: clientCounts,
                    backgroundColor: colors.slice(0, clientLabels.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11 } }
                    }
                }
            }
        });
    }
}

function updateChartType() {
    if (offersChart) {
        const chartType = document.getElementById('chartType')?.value || 'bar';
        offersChart.config.type = chartType;
        offersChart.update();
    }
}

// ====== التصدير ======
function exportReportPDF() {
    const element = document.querySelector('.reports-container');
    if (!element) return;
    html2pdf().from(element).save('Reports.pdf');
    showToast('📄 جاري تصدير التقرير PDF', 'success');
}

function exportReportExcel() {
    const rows = document.querySelectorAll('#reportsTableBody tr');
    const data = [['رقم العرض', 'العميل', 'التاريخ', 'الإجمالي', 'الضريبة', 'الإجمالي شامل الضريبة', 'الحالة']];
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            data.push(Array.from(cells).slice(0, 7).map(cell => cell.textContent.trim()));
        }
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'التقارير');
    XLSX.writeFile(wb, 'Reports.xlsx');
    showToast('📊 تم تصدير التقرير Excel', 'success');
}

function printReport() {
    window.print();
}

// ====== التهيئة ======
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadReportData, 100);
});