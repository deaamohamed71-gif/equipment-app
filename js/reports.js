// js/reports.js - كود صفحة التقارير مع نظام الترخيص

let offersChart = null;
let clientsChart = null;

// ====== تهيئة الترخيص ======
function initReportsLicense() {
    licenseManager.initialize();
    const features = licenseManager.getFeatures();
    
    if (!features.canReports) {
        showPremiumRequiredMessage();
    }
}

// ====== عرض رسالة الترقية ======
function showPremiumRequiredMessage() {
    const container = document.querySelector('.reports-container');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'premium-required-message';
    messageDiv.style.cssText = `
        background: rgba(201, 168, 76, 0.1);
        border: 2px solid var(--gold);
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        margin-bottom: 1.5rem;
    `;
    messageDiv.innerHTML = `
        <i class="fas fa-lock" style="font-size: 3rem; color: var(--gold); margin-bottom: 0.5rem;"></i>
        <h2 style="color: var(--text); font-family: 'Cairo', sans-serif;">🔒 هذه الميزة متاحة فقط في النسخة المدفوعة</h2>
        <p style="color: var(--text-light); margin: 0.5rem 0;">قم بترقية حسابك للاستفادة من التقارير والإحصائيات المتقدمة</p>
        <button class="btn btn-gold" onclick="window.location.href='activation.html'" style="margin-top: 1rem;">
            <i class="fas fa-rocket"></i> ترقية الآن
        </button>
    `;
    container.prepend(messageDiv);
    
    const sections = container.querySelectorAll('.section-card, .stats-grid, .charts-grid');
    sections.forEach(el => {
        el.style.opacity = '0.3';
        el.style.pointerEvents = 'none';
    });
}

// ====== تحميل البيانات ======
function loadReportData() {
    const features = licenseManager.getFeatures();
    
    if (!features.canReports) {
        showPremiumRequiredMessage();
        return;
    }
    
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const clients = JSON.parse(localStorage.getItem('savedClients') || '[]');
    
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
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const fromEl = document.getElementById('reportFrom');
    const toEl = document.getElementById('reportTo');
    if (fromEl) fromEl.value = firstDay.toISOString().split('T')[0];
    if (toEl) toEl.value = lastDay.toISOString().split('T')[0];
    
    generateReport();
}

function generateReport() {
    const features = licenseManager.getFeatures();
    if (!features.canReports) {
        showPremiumRequiredMessage();
        return;
    }
    
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const from = document.getElementById('reportFrom')?.value;
    const to = document.getElementById('reportTo')?.value;
    const client = document.getElementById('reportClient')?.value;
    const status = document.getElementById('reportStatus')?.value;
    
    let filtered = offers.filter(offer => {
        if (from || to) {
            const date = offer.createdAt || offer.expiryDate;
            if (date) {
                const d = new Date(date);
                if (from && d < new Date(from)) return false;
                if (to && d > new Date(to)) return false;
            }
        }
        if (client && offer.targetCompany !== client) return false;
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
        tax = total * 0.14;
        
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

function viewOffer(name) {
    if (name) {
        localStorage.setItem('viewOfferName', name);
        window.location.href = 'quotation.html';
    }
}

function updateCharts(offers) {
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
    
    const clientData = {};
    offers.forEach(offer => {
        if (offer.targetCompany) {
            clientData[offer.targetCompany] = (clientData[offer.targetCompany] || 0) + 1;
        }
    });
    
    const clientLabels = Object.keys(clientData);
    const clientCounts = Object.values(clientData);
    
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

function exportReportPDF() {
    const features = licenseManager.getFeatures();
    if (!features.canReports) {
        showToast('⚠️ التقارير متاحة فقط في النسخة المدفوعة', 'error');
        licenseManager.showActivationPrompt();
        return;
    }
    
    const element = document.querySelector('.reports-container');
    if (!element) return;
    html2pdf().from(element).save('Reports.pdf');
    showToast('📄 جاري تصدير التقرير PDF', 'success');
}

function exportReportExcel() {
    const features = licenseManager.getFeatures();
    if (!features.canExportExcel) {
        showToast('⚠️ تصدير Excel متاح فقط في النسخة المدفوعة', 'error');
        licenseManager.showActivationPrompt();
        return;
    }
    
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
    const features = licenseManager.getFeatures();
    if (!features.canReports) {
        showToast('⚠️ التقارير متاحة فقط في النسخة المدفوعة', 'error');
        licenseManager.showActivationPrompt();
        return;
    }
    window.print();
}

document.addEventListener('DOMContentLoaded', function() {
    licenseManager.initialize();
    
    setTimeout(function() {
        initReportsLicense();
        loadReportData();
    }, 100);
});