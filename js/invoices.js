// js/invoices.js - كود إدارة الفواتير (محدث مع html2pdf.js للتصدير الاحترافي)

// ====== المتغيرات ======
let invoices = [];
let currentInvoiceId = null;
let currentOfferData = null;

// ============================================================
//  ✅ دوال مساعدة لجلب بيانات الشركة والإعدادات
// ============================================================

function getCompanyData() {
    return {
        name: localStorage.getItem('field_companyName') || 'شركة المعدات الحديثة',
        phone: localStorage.getItem('field_companyPhone') || '',
        address: localStorage.getItem('field_companyAddress') || '',
        commercial: localStorage.getItem('field_companyCommercial') || '',
        tax: localStorage.getItem('field_companyTax') || '',
        logo: localStorage.getItem('companyLogo') || '',
        sigEmployee: localStorage.getItem('sig_sigEmployee') || '',
        sigClient: localStorage.getItem('sig_sigClient') || '',
        primaryColor: localStorage.getItem('primaryColor') || '#1a6b8a',
        goldColor: localStorage.getItem('goldColor') || '#c9a84c',
        primaryLight: localStorage.getItem('primaryColor') ? localStorage.getItem('primaryColor') + '20' : '#e8f4f8',
        isDarkMode: document.body.classList.contains('dark-mode') || false
    };
}

function getCurrencySymbol() {
    return 'ج.م';
}

// ============================================================
//  ✅ دوال تحميل وعرض الفواتير
// ============================================================

function loadInvoices() {
    try {
        invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    } catch (e) {
        invoices = [];
    }
    
    const tbody = document.getElementById('invoicesTableBody');
    if (tbody) {
        renderInvoices();
    }
    updateStats();
}

function renderInvoices(filteredData) {
    const tbody = document.getElementById('invoicesTableBody');
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
                <td>${total.toLocaleString('en-US')} ${getCurrencySymbol()}</td>
                <td>${paid.toLocaleString('en-US')} ${getCurrencySymbol()}</td>
                <td>${remaining.toLocaleString('en-US')} ${getCurrencySymbol()}</td>
                <td><span class="status-badge ${status.class}">${status.label}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewInvoice('${inv.id}')" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="openPaymentModal('${inv.id}')" title="دفع">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                    <button class="btn btn-sm btn-gold" onclick="exportInvoicePDF('${inv.id}')" title="PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInvoice('${inv.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

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
    if (revenueEl) revenueEl.textContent = revenue.toLocaleString('en-US') + ' ' + getCurrencySymbol();
}

// ============================================================
//  ✅ إنشاء فاتورة جديدة
// ============================================================

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
    
    if (totalEl) totalEl.textContent = total.toLocaleString('en-US') + ' ' + getCurrencySymbol();
    if (itemsEl) itemsEl.textContent = (offer.data ? offer.data.length : 0);
    if (previewEl) previewEl.style.display = 'block';
}

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
        notes: offer.notes || []
    };
    
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    closeInvoiceModal();
    renderInvoices();
    updateStats();
    showToast('✅ تم إنشاء الفاتورة بنجاح', 'success');
}

// ============================================================
//  ✅ عرض الفاتورة
// ============================================================

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
                            <td style="font-weight:bold;color:var(--primary);">${inv.total.toLocaleString('en-US')} ${getCurrencySymbol()}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:left;">المدفوع</td>
                            <td style="color:var(--success);">${(inv.paid || 0).toLocaleString('en-US')} ${getCurrencySymbol()}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:left;font-weight:bold;">المتبقي</td>
                            <td style="font-weight:bold;color:${(inv.total - (inv.paid || 0)) > 0 ? 'var(--danger)' : 'var(--success)'};">${(inv.total - (inv.paid || 0)).toLocaleString('en-US')} ${getCurrencySymbol()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            ${inv.payments && inv.payments.length > 0 ? `
                <hr />
                <h4>سجل المدفوعات</h4>
                ${inv.payments.map(p => `
                    <div style="display:flex;justify-content:space-between;padding:0.2rem 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
                        <span>${p.amount.toLocaleString('en-US')} ${getCurrencySymbol()}</span>
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
                <button class="btn btn-sm btn-gold" onclick="exportInvoicePDF('${inv.id}')">
                    <i class="fas fa-file-pdf"></i> PDF
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

// ============================================================
//  ✅ إدارة المدفوعات
// ============================================================

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
        if (resultDiv) resultDiv.innerHTML = `<span style="color:var(--danger);">⚠️ المبلغ أكبر من المتبقي (${(inv.total - (inv.paid || 0)).toLocaleString('en-US')} ${getCurrencySymbol()})</span>`;
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
    showToast(`✅ تم تسجيل دفعة ${amount.toLocaleString('en-US')} ${getCurrencySymbol()}`, 'success');
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('active');
    currentInvoiceId = null;
}

// ============================================================
//  ✅ حذف فاتورة
// ============================================================

function deleteInvoice(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    invoices = invoices.filter(i => i.id !== id);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    renderInvoices();
    updateStats();
    showToast('✅ تم حذف الفاتورة', 'success');
}

// ============================================================
//  ✅ الفلترة
// ============================================================

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

// ============================================================
//  ✅ تصدير PDF باستخدام html2pdf.js (محسّن)
// ============================================================

function exportInvoicePDF(invoiceId) {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) {
        showToast('❌ الفاتورة غير موجودة', 'error');
        return;
    }

    // التحقق من الترخيص
    if (typeof licenseManager !== 'undefined') {
        const features = licenseManager.getFeatures();
        if (!features.canExportPDF) {
            showToast('⚠️ تصدير PDF متاح فقط في النسخة المدفوعة', 'error');
            licenseManager.showActivationPrompt();
            return;
        }
    }

    showToast('📄 جاري تجهيز ملف PDF...', 'success');

    // ====== جلب بيانات الشركة ======
    const company = getCompanyData();
    
    // ====== إنشاء HTML القالب ======
    const htmlContent = generateInvoicePDFHTML(company, inv);

    // ====== إنشاء عنصر مؤقت ======
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:0;width:210mm;padding:0;background:#fff;z-index:99999;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // ====== تحويل إلى PDF ======
    const opt = {
        margin:        [8, 8, 8, 8],
        filename:      `${inv.number || 'فاتورة'}.pdf`,
        image:         { type: 'jpeg', quality: 0.98 },
        html2canvas:   { 
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: true
        },
        jsPDF:         { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(container).save().then(() => {
            document.body.removeChild(container);
            showToast('✅ تم تصدير PDF بنجاح', 'success');
        }).catch((err) => {
            console.error('PDF Error:', err);
            document.body.removeChild(container);
            showToast('❌ حدث خطأ أثناء تصدير PDF', 'error');
        });
    } else {
        // خطة بديلة: استخدام الطباعة
        showToast('⚠️ مكتبة PDF غير متاحة، سيتم استخدام الطباعة', 'warning');
        document.body.removeChild(container);
        printInvoice(invoiceId);
    }
}

// ============================================================
//  ✅ إنشاء HTML قالب الفاتورة
// ============================================================

function generateInvoicePDFHTML(company, inv) {
    const statusMap = {
        'paid': '✅ مدفوعة',
        'unpaid': '⏳ غير مدفوعة',
        'overdue': '🔴 متأخرة',
        'cancelled': '❌ ملغية'
    };

    const itemsRows = (inv.data || []).map((item, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 5px 4px; border: 0.5px solid #ddd; text-align: center; font-size: 8pt;">${item.name || '---'}</td>
            <td style="padding: 5px 4px; border: 0.5px solid #ddd; text-align: center; font-size: 8pt;">${item.count || 0}</td>
            <td style="padding: 5px 4px; border: 0.5px solid #ddd; text-align: center; font-size: 8pt;">${Number(item.unitPrice || 0).toLocaleString('en-US')}</td>
            <td style="padding: 5px 4px; border: 0.5px solid #ddd; text-align: center; font-size: 8pt; font-weight: bold; color: ${company.primaryColor};">
                ${((item.count || 0) * (item.unitPrice || 0)).toLocaleString('en-US')}
            </td>
        </tr>
    `).join('');

    const primaryColor = company.primaryColor || '#1a6b8a';
    const goldColor = company.goldColor || '#c9a84c';
    const isDark = company.isDarkMode;

    // حساب المتبقي
    const remaining = (inv.total || 0) - (inv.paid || 0);
    const remainingColor = remaining > 0 ? '#c0392b' : '#2d8f4a';

    return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة - ${inv.number}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Cairo', 'Segoe UI', sans-serif;
                    background: #ffffff;
                    color: #1a2a3a;
                    font-size: 9pt;
                    line-height: 1.5;
                    padding: 5mm;
                }
                .page {
                    width: 190mm;
                    margin: 0 auto;
                    background: #fff;
                }
                
                /* ====== الهيدر ====== */
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding-bottom: 8px;
                    border-bottom: 3px solid ${primaryColor};
                    margin-bottom: 12px;
                }
                .header .company-info {
                    flex: 1;
                }
                .header .company-info .logo-img {
                    max-height: 45px;
                    max-width: 80px;
                    border-radius: 4px;
                    border: 1px solid #eee;
                    padding: 2px;
                    margin-bottom: 4px;
                }
                .header .company-info h2 {
                    font-size: 13pt;
                    color: ${primaryColor};
                    margin: 0;
                }
                .header .company-info p {
                    font-size: 7pt;
                    color: #666;
                    margin: 1px 0;
                }
                .header .invoice-title {
                    text-align: left;
                    flex-shrink: 0;
                }
                .header .invoice-title h1 {
                    font-size: 16pt;
                    color: ${goldColor};
                    margin: 0;
                }
                .header .invoice-title .status {
                    display: inline-block;
                    padding: 1px 8px;
                    border-radius: 10px;
                    font-size: 7pt;
                    font-weight: 700;
                    background: ${inv.status === 'paid' ? 'rgba(45,143,74,0.1)' : 'rgba(192,57,43,0.1)'};
                    color: ${inv.status === 'paid' ? '#2d8f4a' : '#c0392b'};
                    margin-top: 2px;
                }
                .header .invoice-title p {
                    font-size: 8pt;
                    color: #666;
                    margin: 1px 0;
                }
                
                /* ====== معلومات الفاتورة ====== */
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 6px;
                    padding: 8px 10px;
                    background: #f8fafc;
                    border-radius: 4px;
                    border: 0.5px solid #e0e8ec;
                    margin-bottom: 10px;
                }
                .info-grid .info-item label {
                    font-size: 6pt;
                    color: #999;
                    text-transform: uppercase;
                    display: block;
                }
                .info-grid .info-item .value {
                    font-size: 9pt;
                    font-weight: 700;
                    color: ${primaryColor};
                }
                
                /* ====== الجدول ====== */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 6px 0;
                }
                table th {
                    background: ${primaryColor};
                    color: #fff;
                    padding: 5px 4px;
                    text-align: center;
                    font-size: 7pt;
                    font-weight: 700;
                    border: 0.5px solid ${primaryColor};
                }
                table td {
                    padding: 4px 3px;
                    border: 0.5px solid #ddd;
                    text-align: center;
                    font-size: 8pt;
                }
                
                /* ====== الإجماليات ====== */
                .totals {
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    padding: 8px 12px;
                    background: #f8fafc;
                    border-radius: 4px;
                    border: 0.5px solid #e0e8ec;
                    margin: 8px 0;
                }
                .totals .total-item {
                    text-align: center;
                }
                .totals .total-item .label {
                    font-size: 7pt;
                    color: #666;
                }
                .totals .total-item .amount {
                    font-weight: 700;
                    font-size: 10pt;
                }
                .totals .total-item .amount.paid { color: #2d8f4a; }
                .totals .total-item .amount.remaining { color: ${remainingColor}; }
                
                /* ====== الملاحظات ====== */
                .notes {
                    margin-top: 8px;
                    padding: 8px 10px;
                    background: #f8fafc;
                    border: 0.5px solid #e0e8ec;
                    border-right: 3px solid ${goldColor};
                    border-radius: 4px;
                }
                .notes h4 {
                    font-size: 8pt;
                    color: ${primaryColor};
                    margin: 0 0 3px 0;
                }
                .notes p {
                    font-size: 7pt;
                    color: #444;
                    margin: 1px 0;
                }
                
                /* ====== الفوتر ====== */
                .footer {
                    margin-top: 10px;
                    text-align: center;
                    color: #999;
                    font-size: 6pt;
                    border-top: 0.5px solid #eee;
                    padding-top: 6px;
                }
                
                @media print {
                    body { padding: 0; margin: 0; }
                    .page { width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <!-- الهيدر -->
                <div class="header">
                    <div class="company-info">
                        ${company.logo ? `<img src="${company.logo}" class="logo-img" alt="الشعار" />` : ''}
                        <h2>${company.name}</h2>
                        ${company.address ? `<p>📍 ${company.address}</p>` : ''}
                        ${company.phone ? `<p>📞 ${company.phone}</p>` : ''}
                        ${company.commercial || company.tax ? `<p>${company.commercial ? `سجل تجاري: ${company.commercial}` : ''} ${company.tax ? `| رقم ضريبي: ${company.tax}` : ''}</p>` : ''}
                    </div>
                    <div class="invoice-title">
                        <h1>فاتورة</h1>
                        <p><strong>رقم:</strong> ${inv.number}</p>
                        <p><strong>التاريخ:</strong> ${new Date(inv.date).toLocaleDateString('ar-EG')}</p>
                        <span class="status">${statusMap[inv.status] || inv.status}</span>
                    </div>
                </div>

                <!-- معلومات الفاتورة -->
                <div class="info-grid">
                    <div class="info-item">
                        <label>العميل</label>
                        <div class="value">${inv.client || 'غير محدد'}</div>
                    </div>
                    <div class="info-item">
                        <label>العرض المرتبط</label>
                        <div class="value">${inv.offerName || '---'}</div>
                    </div>
                    <div class="info-item">
                        <label>تاريخ الاستحقاق</label>
                        <div class="value">${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('ar-EG') : '---'}</div>
                    </div>
                    <div class="info-item">
                        <label>المتبقي</label>
                        <div class="value" style="color:${remainingColor};">${remaining.toLocaleString('en-US')} ${getCurrencySymbol()}</div>
                    </div>
                </div>

                <!-- جدول البنود -->
                <table>
                    <thead>
                        <tr>
                            <th style="width:40%;">المعدة</th>
                            <th style="width:15%;">العدد</th>
                            <th style="width:20%;">سعر الوحدة</th>
                            <th style="width:25%;">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>${itemsRows}</tbody>
                </table>

                <!-- الإجماليات -->
                <div class="totals">
                    <div class="total-item">
                        <div class="label">الإجمالي</div>
                        <div class="amount">${(inv.total || 0).toLocaleString('en-US')} ${getCurrencySymbol()}</div>
                    </div>
                    <div class="total-item">
                        <div class="label">المدفوع</div>
                        <div class="amount paid">${(inv.paid || 0).toLocaleString('en-US')} ${getCurrencySymbol()}</div>
                    </div>
                    <div class="total-item">
                        <div class="label">المتبقي</div>
                        <div class="amount remaining">${remaining.toLocaleString('en-US')} ${getCurrencySymbol()}</div>
                    </div>
                </div>

                <!-- الملاحظات -->
                ${inv.notes && inv.notes.length > 0 ? `
                <div class="notes">
                    <h4>📋 ملاحظات:</h4>
                    ${inv.notes.map(n => `<p>• ${n}</p>`).join('')}
                </div>
                ` : ''}

                <!-- الفوتر -->
                <div class="footer">
                    تم إنشاء هذه الفاتورة بواسطة نظام عروض أسعار المعدات | ${new Date().toLocaleDateString('ar-EG')}
                </div>
            </div>
        </body>
        </html>
    `;
}

// ============================================================
//  ✅ دوال الطباعة والتصدير الأخرى
// ============================================================

function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (modal) modal.classList.remove('active');
}

function exportInvoicesPDF() {
    if (invoices.length === 0) {
        showToast('⚠️ لا توجد فواتير للتصدير', 'error');
        return;
    }
    // تصدير جميع الفواتير (يمكن تطويرها لاحقاً)
    showToast('⚠️ تصدير جميع الفواتير قيد التطوير', 'warning');
}

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

function printInvoice(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    // استخدام التصدير المحسن بدلاً من الطباعة المباشرة
    exportInvoicePDF(id);
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
window.exportInvoicePDF = exportInvoicePDF;
window.getCompanyData = getCompanyData;
window.getCurrencySymbol = getCurrencySymbol;

// ============================================================
//  ✅ التهيئة
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        loadInvoices();
    }, 200);
    
    console.log('📄 صفحة الفواتير - تم تهيئتها بنجاح مع دعم PDF المتقدم');
});
