// js/invoices.js - كود إدارة الفواتير (محدث مع التحقق من وجود العناصر)

// ====== المتغيرات ======
let invoices = [];
let currentInvoiceId = null;
let currentOfferData = null;

// ====== تحميل الفواتير ======
function loadInvoices() {
    try {
        invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    } catch (e) {
        invoices = [];
    }
    
    // ✅ التحقق من وجود الجدول قبل التعديل
    const tbody = document.getElementById('invoicesTableBody');
    if (tbody) {
        renderInvoices();
    }
    updateStats();
}

// ====== عرض الفواتير ======
function renderInvoices(filteredData) {
    const tbody = document.getElementById('invoicesTableBody');
    
    // ✅ التحقق من وجود العنصر
    if (!tbody) return;
    
    const data = filteredData || invoices;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;color:var(--text-light);padding:2rem;">
                    <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>
                    لا توجد فواتير
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(inv => {
        const statusMap = {
            'paid': { class: 'paid', label: '✅ مدفوعة' },
            'unpaid': { class: 'unpaid', label: '⏳ غير مدفوعة' },
            'overdue': { class: 'overdue', label: '🔴 متأخرة' },
            'cancelled': { class: 'cancelled', label: '❌ ملغية' }
        };
        const status = statusMap[inv.status] || statusMap['unpaid'];
        const total = inv.total || 0;
        const paid = inv.paid || 0;
        const remaining = total - paid;
        
        return `
            <tr>
                <td><strong>${inv.number || '---'}</strong></td>
                <td>${inv.client || 'غير محدد'}</td>
                <td>${inv.offerName || '---'}</td>
                <td>${inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : '---'}</td>
                <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('ar-EG') : '---'}</td>
                <td>${total.toLocaleString('en-US')} ج.م</td>
                <td>${paid.toLocaleString('en-US')} ج.م</td>
                <td>${remaining.toLocaleString('en-US')} ج.م</td>
                <td><span class="status-badge ${status.class}">${status.label}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewInvoice('${inv.id}')" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="openPaymentModal('${inv.id}')" title="دفع">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInvoice('${inv.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ====== تحديث الإحصائيات ======
function updateStats() {
    const total = invoices.length;
    const paid = invoices.filter(i => i.status === 'paid').length;
    const unpaid = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length;
    const revenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
    
    const totalEl = document.getElementById('totalInvoices');
    const paidEl = document.getElementById('paidInvoices');
    const unpaidEl = document.getElementById('unpaidInvoices');
    const revenueEl = document.getElementById('totalRevenue');
    
    if (totalEl) totalEl.textContent = total;
    if (paidEl) paidEl.textContent = paid;
    if (unpaidEl) unpaidEl.textContent = unpaid;
    if (revenueEl) revenueEl.textContent = revenue.toLocaleString('en-US') + ' ج.م';
}

// ====== إنشاء فاتورة جديدة من العرض ======
function createInvoiceFromOffer() {
    const modal = document.getElementById('invoiceModal');
    const select = document.getElementById('offerSelect');
    
    if (!modal || !select) {
        showToast('⚠️ عناصر الصفحة غير مكتملة', 'error');
        return;
    }
    
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    select.innerHTML = '<option value="">-- اختر عرض --</option>';
    offers.forEach(offer => {
        const opt = document.createElement('option');
        opt.value = offer.name;
        opt.textContent = `${offer.name} - ${offer.targetCompany || 'غير محدد'}`;
        select.appendChild(opt);
    });
    
    const nextNum = invoices.length + 1;
    const invoiceNumEl = document.getElementById('invoiceNumber');
    if (invoiceNumEl) {
        invoiceNumEl.value = `INV-2026-${String(nextNum).padStart(3, '0')}`;
    }
    
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueEl = document.getElementById('invoiceDueDate');
    if (dueEl) {
        dueEl.value = due.toISOString().split('T')[0];
    }
    
    const previewEl = document.getElementById('offerPreview');
    if (previewEl) previewEl.style.display = 'none';
    if (modal) modal.classList.add('active');
}

// ====== تحميل بيانات العرض ======
function loadOfferData() {
    const select = document.getElementById('offerSelect');
    if (!select) return;
    
    const name = select.value;
    if (!name) {
        const previewEl = document.getElementById('offerPreview');
        if (previewEl) previewEl.style.display = 'none';
        return;
    }
    
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const offer = offers.find(o => o.name === name);
    if (!offer) return;
    
    currentOfferData = offer;
    
    const clientEl = document.getElementById('previewClient');
    if (clientEl) clientEl.textContent = offer.targetCompany || 'غير محدد';
    
    let total = 0;
    if (offer.data && Array.isArray(offer.data)) {
        offer.data.forEach(row => {
            if (row.unitPrice && row.count) {
                total += row.unitPrice * row.count;
            }
        });
    }
    
    const totalEl = document.getElementById('previewTotal');
    const itemsEl = document.getElementById('previewItems');
    const previewEl = document.getElementById('offerPreview');
    
    if (totalEl) totalEl.textContent = total.toLocaleString('en-US') + ' ج.م';
    if (itemsEl) itemsEl.textContent = (offer.data ? offer.data.length : 0);
    if (previewEl) previewEl.style.display = 'block';
}

// ====== حفظ الفاتورة ======
function saveInvoice() {
    const offerName = document.getElementById('offerSelect')?.value;
    const number = document.getElementById('invoiceNumber')?.value;
    const dueDate = document.getElementById('invoiceDueDate')?.value;
    
    if (!offerName) {
        showToast('⚠️ الرجاء اختيار عرض', 'error');
        return;
    }
    
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    const offer = offers.find(o => o.name === offerName);
    if (!offer) {
        showToast('⚠️ العرض غير موجود', 'error');
        return;
    }
    
    let total = 0;
    if (offer.data && Array.isArray(offer.data)) {
        offer.data.forEach(row => {
            if (row.unitPrice && row.count) {
                total += row.unitPrice * row.count;
            }
        });
    }
    
    const invoice = {
        id: 'inv_' + Date.now(),
        number: number || `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
        offerName: offerName,
        client: offer.targetCompany || 'غير محدد',
        data: offer.data || [],
        total: total,
        paid: 0,
        date: new Date().toISOString(),
        dueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        status: 'unpaid',
        payments: [],
        notes: ''
    };
    
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    closeInvoiceModal();
    renderInvoices();
    updateStats();
    showToast('✅ تم إنشاء الفاتورة بنجاح', 'success');
}

// ====== عرض الفاتورة ======
function viewInvoice(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) {
        showToast('❌ الفاتورة غير موجودة', 'error');
        return;
    }
    
    let itemsHtml = '';
    if (inv.data && Array.isArray(inv.data)) {
        inv.data.forEach(row => {
            itemsHtml += `
                <tr>
                    <td>${row.name || 'غير محدد'}</td>
                    <td>${row.count || 0}</td>
                    <td>${(row.unitPrice || 0).toLocaleString('en-US')}</td>
                    <td>${((row.count || 0) * (row.unitPrice || 0)).toLocaleString('en-US')}</td>
                </tr>
            `;
        });
    }
    
    const statusMap = {
        'paid': '✅ مدفوعة',
        'unpaid': '⏳ غير مدفوعة',
        'overdue': '🔴 متأخرة',
        'cancelled': '❌ ملغية'
    };
    
    const modalContent = `
        <div style="padding:0.5rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">
                <h3 style="margin:0;">${inv.number}</h3>
                <span class="status-badge ${inv.status}">${statusMap[inv.status] || inv.status}</span>
            </div>
            <p><strong>العميل:</strong> ${inv.client}</p>
            <p><strong>العرض:</strong> ${inv.offerName}</p>
            <p><strong>التاريخ:</strong> ${new Date(inv.date).toLocaleDateString('ar-EG')}</p>
            <p><strong>تاريخ الاستحقاق:</strong> ${new Date(inv.dueDate).toLocaleDateString('ar-EG')}</p>
            <hr />
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                    <thead>
                        <tr style="background:var(--primary);color:#fff;">
                            <th style="padding:0.3rem;text-align:center;">المعدة</th>
                            <th style="padding:0.3rem;text-align:center;">العدد</th>
                            <th style="padding:0.3rem;text-align:center;">سعر الوحدة</th>
                            <th style="padding:0.3rem;text-align:center;">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align:left;font-weight:bold;">الإجمالي</td>
                            <td style="font-weight:bold;color:var(--primary);">${inv.total.toLocaleString('en-US')} ج.م</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:left;">المدفوع</td>
                            <td style="color:var(--success);">${(inv.paid || 0).toLocaleString('en-US')} ج.م</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:left;font-weight:bold;">المتبقي</td>
                            <td style="font-weight:bold;color:${(inv.total - (inv.paid || 0)) > 0 ? 'var(--danger)' : 'var(--success)'};">${(inv.total - (inv.paid || 0)).toLocaleString('en-US')} ج.م</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            ${inv.payments && inv.payments.length > 0 ? `
                <hr />
                <h4>سجل المدفوعات</h4>
                ${inv.payments.map(p => `
                    <div style="display:flex;justify-content:space-between;padding:0.2rem 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
                        <span>${p.amount.toLocaleString('en-US')} ج.م</span>
                        <span>${p.method}</span>
                        <span>${new Date(p.date).toLocaleDateString('ar-EG')}</span>
                        <span style="font-size:0.75rem;color:var(--text-light);">${p.note || ''}</span>
                    </div>
                `).join('')}
            ` : ''}
            <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
                <button class="btn btn-sm btn-primary" onclick="printInvoice('${inv.id}')">
                    <i class="fas fa-print"></i> طباعة
                </button>
                <button class="btn btn-sm btn-success" onclick="openPaymentModal('${inv.id}')">
                    <i class="fas fa-money-bill-wave"></i> دفع
                </button>
                <button class="btn btn-sm btn-danger" onclick="if(confirm('هل أنت متأكد؟')){deleteInvoice('${inv.id}')}">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;">
            <button class="close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
            ${modalContent}
        </div>
    `;
    modal.onclick = function(e) { if (e.target === this) this.remove(); };
    document.body.appendChild(modal);
}

// ====== فتح مودال الدفع ======
function openPaymentModal(invoiceId) {
    currentInvoiceId = invoiceId;
    const modal = document.getElementById('paymentModal');
    if (!modal) {
        showToast('⚠️ مودال الدفع غير موجود', 'error');
        return;
    }
    
    const amountEl = document.getElementById('paymentAmount');
    const methodEl = document.getElementById('paymentMethod');
    const noteEl = document.getElementById('paymentNote');
    const resultEl = document.getElementById('paymentResult');
    
    if (amountEl) amountEl.value = '';
    if (methodEl) methodEl.value = 'cash';
    if (noteEl) noteEl.value = '';
    if (resultEl) resultEl.innerHTML = '';
    
    modal.classList.add('active');
}

// ====== حفظ الدفع ======
function savePayment() {
    const amount = parseFloat(document.getElementById('paymentAmount')?.value);
    const method = document.getElementById('paymentMethod')?.value;
    const note = document.getElementById('paymentNote')?.value.trim();
    const resultDiv = document.getElementById('paymentResult');
    
    if (!amount || amount <= 0) {
        if (resultDiv) resultDiv.innerHTML = '<span style="color:var(--danger);">⚠️ الرجاء إدخال مبلغ صحيح</span>';
        return;
    }
    
    const inv = invoices.find(i => i.id === currentInvoiceId);
    if (!inv) {
        if (resultDiv) resultDiv.innerHTML = '<span style="color:var(--danger);">❌ الفاتورة غير موجودة</span>';
        return;
    }
    
    if (amount > (inv.total - (inv.paid || 0))) {
        if (resultDiv) resultDiv.innerHTML = `<span style="color:var(--danger);">⚠️ المبلغ أكبر من المتبقي (${(inv.total - (inv.paid || 0)).toLocaleString('en-US')} ج.م)</span>`;
        return;
    }
    
    inv.paid = (inv.paid || 0) + amount;
    inv.payments = inv.payments || [];
    inv.payments.push({
        amount: amount,
        method: method,
        note: note,
        date: new Date().toISOString()
    });
    
    if (inv.paid >= inv.total) {
        inv.status = 'paid';
    } else {
        inv.status = 'unpaid';
        if (new Date(inv.dueDate) < new Date()) {
            inv.status = 'overdue';
        }
    }
    
    localStorage.setItem('invoices', JSON.stringify(invoices));
    renderInvoices();
    updateStats();
    closePaymentModal();
    showToast(`✅ تم تسجيل دفعة ${amount.toLocaleString('en-US')} ج.م`, 'success');
}

// ====== حذف فاتورة ======
function deleteInvoice(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    invoices = invoices.filter(i => i.id !== id);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    renderInvoices();
    updateStats();
    showToast('✅ تم حذف الفاتورة', 'success');
}

// ====== إغلاق المودالات ======
function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (modal) modal.classList.remove('active');
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('active');
    currentInvoiceId = null;
}

// ====== الفلترة ======
function applyFilter() {
    const from = document.getElementById('filterFrom')?.value;
    const to = document.getElementById('filterTo')?.value;
    const status = document.getElementById('filterStatus')?.value;
    
    let filtered = [...invoices];
    
    if (from) {
        filtered = filtered.filter(i => i.date >= from);
    }
    if (to) {
        filtered = filtered.filter(i => i.date <= to);
    }
    if (status) {
        filtered = filtered.filter(i => i.status === status);
    }
    
    renderInvoices(filtered);
    showToast(`✅ تم التصفية (${filtered.length} فاتورة)`, 'success');
}

// ====== تصدير PDF ======
function exportInvoicesPDF() {
    window.print();
}

// ====== تصدير Excel ======
function exportInvoicesExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('⚠️ مكتبة Excel غير متاحة', 'error');
        return;
    }
    
    const data = [['رقم الفاتورة', 'العميل', 'العرض', 'التاريخ', 'تاريخ الاستحقاق', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة']];
    invoices.forEach(inv => {
        data.push([
            inv.number || '',
            inv.client || '',
            inv.offerName || '',
            inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : '',
            inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('ar-EG') : '',
            inv.total || 0,
            inv.paid || 0,
            (inv.total - (inv.paid || 0)) || 0,
            inv.status || ''
        ]);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');
    XLSX.writeFile(wb, 'Invoices.xlsx');
    showToast('📊 تم تصدير الفواتير Excel', 'success');
}

// ====== طباعة فاتورة ======
function printInvoice(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('⚠️ يرجى السماح بفتح النوافذ المنبثقة', 'error');
        return;
    }
    
    let itemsHtml = '';
    if (inv.data && Array.isArray(inv.data)) {
        inv.data.forEach(row => {
            itemsHtml += `
                <tr>
                    <td>${row.name || 'غير محدد'}</td>
                    <td>${row.count || 0}</td>
                    <td>${(row.unitPrice || 0).toLocaleString('en-US')}</td>
                    <td>${((row.count || 0) * (row.unitPrice || 0)).toLocaleString('en-US')}</td>
                </tr>
            `;
        });
    }
    
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><title>فاتورة ${inv.number}</title>
        <style>
            body{font-family:'Cairo',sans-serif;padding:20px;}
            .header{text-align:center;border-bottom:2px solid #1a6b8a;padding-bottom:10px;margin-bottom:20px;}
            .header h1{color:#1a6b8a;margin:0;}
            .info{display:flex;justify-content:space-between;margin-bottom:20px;}
            table{width:100%;border-collapse:collapse;margin:10px 0;}
            th{background:#1a6b8a;color:#fff;padding:6px;text-align:center;}
            td{padding:6px;border:1px solid #ddd;text-align:center;}
            .total{font-weight:bold;font-size:1.2em;text-align:left;padding:10px 0;}
            .footer{text-align:center;margin-top:20px;color:#999;font-size:0.8rem;}
            @media print{body{padding:10px;}}
        </style>
        </head>
        <body>
            <div class="header">
                <h1>فاتورة</h1>
                <p>${inv.number}</p>
            </div>
            <div class="info">
                <div><strong>العميل:</strong> ${inv.client}</div>
                <div><strong>التاريخ:</strong> ${new Date(inv.date).toLocaleDateString('ar-EG')}</div>
                <div><strong>تاريخ الاستحقاق:</strong> ${new Date(inv.dueDate).toLocaleDateString('ar-EG')}</div>
            </div>
            <table>
                <thead><tr><th>المعدة</th><th>العدد</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="total">الإجمالي: ${inv.total.toLocaleString('en-US')} ج.م</div>
            <div style="display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:10px;">
                <div><strong>المدفوع:</strong> ${(inv.paid || 0).toLocaleString('en-US')} ج.م</div>
                <div><strong>المتبقي:</strong> ${(inv.total - (inv.paid || 0)).toLocaleString('en-US')} ج.م</div>
                <div><strong>الحالة:</strong> ${inv.status === 'paid' ? '✅ مدفوعة' : inv.status === 'overdue' ? '🔴 متأخرة' : '⏳ غير مدفوعة'}</div>
            </div>
            <div class="footer">تم إنشاء هذه الفاتورة بواسطة نظام عروض أسعار المعدات</div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ============================================================
//  ✅ جعل الدوال متاحة عالمياً
// ============================================================
window.loadInvoices = loadInvoices;
window.renderInvoices = renderInvoices;
window.updateStats = updateStats;
window.createInvoiceFromOffer = createInvoiceFromOffer;
window.loadOfferData = loadOfferData;
window.saveInvoice = saveInvoice;
window.viewInvoice = viewInvoice;
window.openPaymentModal = openPaymentModal;
window.savePayment = savePayment;
window.deleteInvoice = deleteInvoice;
window.closeInvoiceModal = closeInvoiceModal;
window.closePaymentModal = closePaymentModal;
window.applyFilter = applyFilter;
window.exportInvoicesPDF = exportInvoicesPDF;
window.exportInvoicesExcel = exportInvoicesExcel;
window.printInvoice = printInvoice;

// ============================================================
//  ✅ التهيئة
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        loadInvoices();
    }, 200);
    
    console.log('📄 صفحة الفواتير - تم تهيئتها بنجاح');
});
