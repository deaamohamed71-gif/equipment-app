// js/quotation.js - كود صفحة العرض مع دالة PDF عبر الطباعة

// ====== البيانات الافتراضية ======
const defaultData = [
    { name: 'رافعة مقصية', unit: 'متر', value: 18, priceType: 'شهري', duration: 'شهور', count: 1, unitPrice: 60000 },
    { name: 'ونش أحمال', unit: 'طن', value: 35, priceType: 'يومي', duration: 'أيام', count: 22, unitPrice: 2500 },
    { name: 'فورك لفت', unit: 'متر', value: 12, priceType: 'يومي', duration: 'ساعات', count: 80, unitPrice: 150 }
];

const defaultNotes = [
    '1. أسعار الإيجار أعلاه لا تشمل قيمة ضريبة القيمة المضافة (VAT).',
    '2. يتحمل المستأجر تكاليف الإعاشة والإقامة لطاقم التشغيل طوال فترة التعاقد.',
    '3. يتحمل المستأجر المسؤولية الكاملة عن تأمين المعدات ضد السرقة أو التلف أو الحريق.'
];

const iconMap = {
    'رافعة مقصية': 'fa-arrow-up',
    'ونش أحمال': 'fa-tower-crane',
    'فورك لفت': 'fa-truck',
    'مانليفت': 'fa-hand-holding-heart'
};

const defaultIcon = 'fa-arrow-up';
let data = [];
let notes = [];
let selectedRowIndex = -1;
let isPremium = false;

// ====== تهيئة الترخيص ======
function initLicense() {
    if (typeof licenseManager !== 'undefined') {
        licenseManager.initialize();
        const info = licenseManager.getLicenseInfo();
        isPremium = info ? info.isPremium : false;
        updateUIForLicense();
    }
}

// ====== تحديث الواجهة حسب الترخيص ======
function updateUIForLicense() {
    if (typeof licenseManager === 'undefined') return;
    const features = licenseManager.getFeatures();
    
    if (!features.isPremium) {
        const maxItems = features.maxItems;
        const currentCount = data.length;
        
        if (currentCount > maxItems) {
            data = data.slice(0, maxItems);
            showToast(`⚠️ النسخة المجانية تسمح بـ ${maxItems} بنود فقط. تم تقليص العرض.`, 'error');
            renderTable();
        }
    }
}

// ====== العمليات الحسابية ======
function getOperationTotal(row) {
    const count = row.count || 1;
    const unitPrice = row.unitPrice || 0;
    if (row.priceType === 'يومي') {
        if (row.duration === 'أيام') return count * unitPrice;
        if (row.duration === 'ساعات') { const days = Math.ceil(count / 8); return days * unitPrice; }
        if (row.duration === 'شهور') return count * 26 * unitPrice;
    }
    if (row.priceType === 'شهري') {
        if (row.duration === 'شهور') return count * unitPrice;
        if (row.duration === 'أيام') { const months = Math.ceil(count / 26); return months * unitPrice; }
        if (row.duration === 'ساعات') { const months = Math.ceil(count / 208); return months * unitPrice; }
    }
    return count * unitPrice;
}

function getIconForName(name) {
    return iconMap[name] || defaultIcon;
}

// ====== الجدول ======
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    const fragment = document.createDocumentFragment();
    const iconColor = document.getElementById('iconColorPicker')?.value || '#888';
    let features = { maxItems: 3, isPremium: false };
    
    if (typeof licenseManager !== 'undefined') {
        features = licenseManager.getFeatures();
    }
    
    const maxItems = features.maxItems;
    const isPremium = features.isPremium;
    
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        const icon = row.icon || getIconForName(row.name) || defaultIcon;
        const opTotal = getOperationTotal(row);
        
        const showLimitWarning = !isPremium && index >= maxItems - 1 && index === data.length - 1;
        
        tr.innerHTML = `
            <td class="equip-name" onclick="selectRow(${index})" style="cursor:pointer;">
                <i class="fas ${icon}" style="color:${iconColor}; font-size:1rem;"></i> 
                <input type="text" style="width:110px; border-radius:20px; padding:0.15rem 0.3rem; text-align:center; border:1px solid var(--border); background:transparent; font-size:0.8rem;" value="${row.name}" onchange="updateField(${index}, 'name', this.value)" />
                ${!isPremium && showLimitWarning ? '<i class="fas fa-lock" style="color:var(--gold); font-size:0.7rem;" title="الحد الأقصى للبنود في النسخة المجانية"></i>' : ''}
            </td>
            <td>
                <select onchange="updateField(${index}, 'unit', this.value)" style="font-size:0.8rem;">
                    <option value="متر" ${row.unit === 'متر' ? 'selected' : ''}>متر</option>
                    <option value="طن" ${row.unit === 'طن' ? 'selected' : ''}>طن</option>
                </select>
            </td>
            <td><input type="number" class="spec-input" value="${row.value}" min="0" onchange="updateField(${index}, 'value', Number(this.value))" /></td>
            <td>
                <select onchange="updateField(${index}, 'priceType', this.value)" style="font-size:0.8rem;">
                    <option value="يومي" ${row.priceType === 'يومي' ? 'selected' : ''}>يومي</option>
                    <option value="شهري" ${row.priceType === 'شهري' ? 'selected' : ''}>شهري</option>
                </select>
            </td>
            <td>
                <select onchange="updateField(${index}, 'duration', this.value)" style="font-size:0.8rem;">
                    <option value="ساعات" ${row.duration === 'ساعات' ? 'selected' : ''}>ساعات</option>
                    <option value="أيام" ${row.duration === 'أيام' ? 'selected' : ''}>أيام</option>
                    <option value="شهور" ${row.duration === 'شهور' ? 'selected' : ''}>شهور</option>
                </select>
            </td>
            <td><input type="number" class="count-input" value="${row.count}" min="0" onchange="updateField(${index}, 'count', Number(this.value))" /></td>
            <td><input type="number" class="price-input" value="${row.unitPrice}" min="0" onchange="updateField(${index}, 'unitPrice', Number(this.value))" /></td>
            <td style="font-weight:700; color:var(--primary);" id="opTotal-${index}">${opTotal.toLocaleString('en-US')}</td>
            <td><button class="delete-row" onclick="deleteRow(${index})"><i class="fas fa-times"></i></button></td>
        `;
        fragment.appendChild(tr);
    });
    
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
    updateTotalSummary();
    saveData();
}

function selectRow(index) { 
    selectedRowIndex = index; 
    document.querySelectorAll('#tableBody tr').forEach((tr, i) => {
        tr.style.background = (i === index) ? 'var(--primary-light)' : '';
    });
}

function updateField(index, field, value) {
    if (index < 0 || index >= data.length) return;
    data[index][field] = value;
    const totalEl = document.getElementById(`opTotal-${index}`);
    if (totalEl) totalEl.textContent = getOperationTotal(data[index]).toLocaleString('en-US');
    updateTotalSummary();
    saveData();
}

function deleteRow(index) {
    if (data.length <= 1) { showToast('⚠️ لا يمكن حذف الصف الأخير', 'error'); return; }
    data.splice(index, 1);
    renderTable();
}

function addRow() {
    if (typeof licenseManager === 'undefined') {
        data.push({ name: 'معدة جديدة', unit: 'متر', value: 0, priceType: 'يومي', duration: 'أيام', count: 1, unitPrice: 0, icon: defaultIcon });
        renderTable();
        showToast('📝 تم إضافة صف جديد', 'success');
        return;
    }
    
    const features = licenseManager.getFeatures();
    const currentCount = data.length;
    const maxItems = features.maxItems;
    
    if (currentCount >= maxItems) {
        const msg = `⚠️ النسخة المجانية تسمح بـ ${maxItems} بنود فقط. قم بالترقية للاستفادة من المزيد.`;
        showToast(msg, 'error');
        licenseManager.showActivationPrompt();
        return;
    }
    
    data.push({ name: 'معدة جديدة', unit: 'متر', value: 0, priceType: 'يومي', duration: 'أيام', count: 1, unitPrice: 0, icon: defaultIcon });
    renderTable();
    showToast('📝 تم إضافة صف جديد', 'success');
}

function clearEquipmentOnly() {
    data.forEach(row => { row.name = ''; row.value = 0; row.count = 1; row.unitPrice = 0; });
    renderTable();
    showToast('✅ تم مسح المحتويات', 'success');
}

// ====== الملاحظات ======
function renderNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    notes.forEach((note, idx) => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.innerHTML = `
            <i class="fas fa-circle"></i>
            <input type="text" class="note-text" value="${note.replace(/"/g, '&quot;')}" onchange="updateNote(${idx}, this.value)" />
            <button class="delete-note" onclick="deleteNote(${idx})"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    });
}

function addNote() { 
    notes.push('ملاحظة جديدة.'); 
    renderNotes(); 
    saveData(); 
}

function deleteNote(index) { 
    notes.splice(index, 1); 
    renderNotes(); 
    saveData(); 
}

function updateNote(index, value) { 
    notes[index] = value; 
    saveData(); 
}

// ====== الحسابات ======
function updateExtras() { 
    updateTotalSummary(); 
    autoSave(); 
}

function updateTotalSummary() {
    let total = 0;
    data.forEach(row => { total += getOperationTotal(row); });
    
    ['transportGo','transportBack','transportFlatbed','roadCards','fuelCost'].forEach(id => {
        const el = document.getElementById(id);
        if (el) total += Number(el.value) || 0;
    });

    const taxRate = Number(document.getElementById('taxRate')?.value) || 0;
    const taxAmount = total * (taxRate / 100);
    const totalWithTax = total + taxAmount;

    const taxAmountEl = document.getElementById('taxAmount');
    const totalWithTaxEl = document.getElementById('totalWithTax');
    const totalDisplayEl = document.getElementById('totalDisplay');
    const taxNoteEl = document.getElementById('taxNote');
    
    if (taxAmountEl) taxAmountEl.textContent = taxAmount.toLocaleString('en-US');
    if (totalWithTaxEl) totalWithTaxEl.textContent = totalWithTax.toLocaleString('en-US');
    if (totalDisplayEl) totalDisplayEl.innerHTML = `<i class="fas fa-coins"></i> ${total.toLocaleString('en-US')} ج.م`;
    if (taxNoteEl) taxNoteEl.style.display = (taxRate === 0) ? 'inline-block' : 'none';
}

function calcTotal() { 
    updateTotalSummary(); 
    showToast('✅ تم حساب الإجمالي بنجاح', 'success'); 
}

// ====== حفظ البيانات ======
function saveData() {
    try {
        localStorage.setItem('equipDataV12', JSON.stringify(data));
        localStorage.setItem('equipNotesV12', JSON.stringify(notes));
    } catch (e) {
        console.warn('Failed to save data:', e);
    }
}

function autoSave() {
    ['quotationNumber','issueDate','validityDate','targetCompany','welcomeMessage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem('field_' + id, el.value);
    });
    ['transportGo','transportBack','transportFlatbed','roadCards','fuelCost'].forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem('extra_' + id, el.value);
    });
    const taxRate = document.getElementById('taxRate');
    if (taxRate) localStorage.setItem('taxRate', taxRate.value);
    
    saveData();
    updateValidityStatus();
}

// ====== حالة الصلاحية ======
function updateValidityStatus() {
    const valDate = document.getElementById('validityDate')?.value;
    const today = new Date().toISOString().split('T')[0];
    const status = document.getElementById('validityStatus');
    if (status) {
        status.textContent = (valDate && valDate >= today) ? '✅ ساري' : '⛔ منتهي';
        status.style.color = (valDate && valDate >= today) ? '#2d8f4a' : '#c0392b';
    }
}

// ====== العروض المحفوظة ======
function saveCurrentOffer() {
    if (typeof licenseManager === 'undefined') {
        saveOfferDirectly();
        return;
    }
    
    const features = licenseManager.getFeatures();
    const maxOffers = features.maxOffers;
    let savedOffers = [];
    
    try {
        savedOffers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    } catch { savedOffers = []; }
    
    if (!features.isPremium && savedOffers.length >= maxOffers) {
        showToast(`⚠️ النسخة المجانية تسمح بـ ${maxOffers} عروض فقط. قم بالترقية للاستفادة من المزيد.`, 'error');
        licenseManager.showActivationPrompt();
        return;
    }
    
    saveOfferDirectly();
}

function saveOfferDirectly() {
    const name = document.getElementById('quotationNumber')?.value || 'عرض غير مسمى';
    let savedOffers = [];
    try {
        savedOffers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    } catch { savedOffers = []; }
    
    const cleanData = data.filter(row => row.name && row.name.trim().length > 0);
    
    if (cleanData.length === 0) {
        showToast('⚠️ لا توجد بيانات صالحة للحفظ', 'error');
        return;
    }
    
    savedOffers = savedOffers.filter(o => o.name !== name);
    savedOffers.push({ 
        name, 
        data: cleanData, 
        notes: notes.filter(n => n.trim().length > 0),
        targetCompany: document.getElementById('targetCompany')?.value || '',
        expiryDate: document.getElementById('validityDate')?.value || '',
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('savedOffers', JSON.stringify(savedOffers));
    loadSavedOffersList();
    showToast('✅ تم حفظ العرض', 'success');
}

function loadSavedOffersList() {
    const select = document.getElementById('savedOffersList');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- سابقة --</option>';
    let offers = [];
    try {
        offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    } catch { offers = []; }
    offers.forEach(offer => {
        if (offer.name && typeof offer.name === 'string') {
            const opt = document.createElement('option');
            opt.value = offer.name;
            opt.textContent = offer.name;
            select.appendChild(opt);
        }
    });
}

function deleteSavedOffer() {
    const name = document.getElementById('savedOffersList')?.value;
    if (!name) { showToast('⚠️ الرجاء اختيار عرض', 'error'); return; }
    let offers = [];
    try {
        offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    } catch { offers = []; }
    localStorage.setItem('savedOffers', JSON.stringify(offers.filter(o => o.name !== name)));
    loadSavedOffersList();
    showToast('✅ تم حذف العرض', 'success');
}

function loadSavedOffer(name) {
    if (!name) return;
    let offers = [];
    try {
        offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    } catch { offers = []; }
    const offer = offers.find(o => o.name === name);
    if (offer) {
        if (offer.data && Array.isArray(offer.data) && offer.data.length > 0) {
            data = offer.data;
        } else {
            showToast('⚠️ بيانات العرض غير صالحة', 'error');
            return;
        }
        notes = (offer.notes && Array.isArray(offer.notes)) ? offer.notes : defaultNotes;
        if (offer.targetCompany) {
            const el = document.getElementById('targetCompany');
            if (el) el.value = offer.targetCompany;
        }
        renderTable();
        renderNotes();
        updateTotalSummary();
        showToast('✅ تم تحميل العرض', 'success');
    }
}

// ====== العملاء ======
function getClients() { 
    try { return JSON.parse(localStorage.getItem('savedClients') || '[]'); } 
    catch { return []; }
}

function loadClientList() {
    const datalist = document.getElementById('clientList');
    if (!datalist) return;
    datalist.innerHTML = '';
    getClients().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        datalist.appendChild(opt);
    });
}

function addClient() {
    if (typeof licenseManager !== 'undefined') {
        const features = licenseManager.getFeatures();
        const maxClients = features.maxClients;
        let clients = getClients();
        
        if (!features.isPremium && clients.length >= maxClients) {
            showToast(`⚠️ النسخة المجانية تسمح بـ ${maxClients} عملاء فقط. قم بالترقية للاستفادة من المزيد.`, 'error');
            licenseManager.showActivationPrompt();
            return;
        }
    }
    
    const name = document.getElementById('newClientName')?.value.trim();
    const phone = document.getElementById('newClientPhone')?.value.trim();
    const email = document.getElementById('newClientEmail')?.value.trim();
    
    if (!name) { showToast('⚠️ الرجاء إدخال اسم العميل', 'error'); return; }
    
    let clients = getClients().filter(c => c.name !== name);
    clients.push({ name, phone, email });
    localStorage.setItem('savedClients', JSON.stringify(clients));
    loadClientList();
    document.getElementById('newClientName').value = '';
    document.getElementById('newClientPhone').value = '';
    document.getElementById('newClientEmail').value = '';
    showToast(`✅ تم إضافة العميل "${name}"`, 'success');
}

function openClientModal() { 
    const modal = document.getElementById('clientModal');
    if (modal) modal.classList.add('active');
    renderClientList();
}

function closeClientModal() { 
    const modal = document.getElementById('clientModal');
    if (modal) modal.classList.remove('active');
}

function renderClientList() {
    const container = document.getElementById('clientListContainer');
    if (!container) return;
    const clients = getClients();
    if (clients.length === 0) {
        container.innerHTML = '<p style="color:var(--text-light);">لا يوجد عملاء مسجلين</p>';
        return;
    }
    container.innerHTML = clients.map(c => `
        <div class="client-item">
            <div class="client-info">
                <span><strong>${c.name}</strong></span>
                <span class="client-phone">${c.phone || 'لا يوجد'}</span>
                <span class="client-email">${c.email || 'لا يوجد'}</span>
            </div>
            <button class="btn btn-danger btn-sm" onclick="removeClient('${c.name}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function removeClient(name) {
    let clients = getClients().filter(c => c.name !== name);
    localStorage.setItem('savedClients', JSON.stringify(clients));
    renderClientList();
    loadClientList();
    showToast('✅ تم حذف العميل', 'success');
}

// ============================================================
//  ✅ تحويل العرض إلى فاتورة (محدث مع كل البيانات)
// ============================================================
function convertToInvoice() {
    // 1. جلب بيانات العرض الحالية
    const currentName = document.getElementById('quotationNumber')?.value || 'عرض غير مسمى';
    const targetCompany = document.getElementById('targetCompany')?.value || 'غير محدد';
    const welcomeMessage = document.getElementById('welcomeMessage')?.value || '';
    
    // 2. التحقق من وجود بيانات
    if (data.length === 0 || !data.some(row => row.name && row.name.trim())) {
        showToast('⚠️ لا توجد بيانات في العرض لتحويلها إلى فاتورة', 'error');
        return;
    }
    
    // 3. حساب الإجمالي من البنود
    let total = 0;
    data.forEach(row => {
        if (row.unitPrice && row.count) {
            total += row.unitPrice * row.count;
        }
    });
    
    // ✅ 4. جلب الحقول الإضافية
    const transportGo = parseFloat(document.getElementById('transportGo')?.value) || 0;
    const transportBack = parseFloat(document.getElementById('transportBack')?.value) || 0;
    const transportFlatbed = parseFloat(document.getElementById('transportFlatbed')?.value) || 0;
    const roadCards = parseFloat(document.getElementById('roadCards')?.value) || 0;
    const fuelCost = parseFloat(document.getElementById('fuelCost')?.value) || 0;
    
    // ✅ 5. حساب الإجمالي مع الحقول الإضافية
    const extrasTotal = transportGo + transportBack + transportFlatbed + roadCards + fuelCost;
    const totalWithExtras = total + extrasTotal;
    
    // ✅ 6. جلب الضريبة
    const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 0;
    const taxAmount = totalWithExtras * (taxRate / 100);
    const grandTotal = totalWithExtras + taxAmount;
    
    // ✅ 7. جلب الملاحظات
    const notesData = notes && notes.length > 0 ? notes : [];
    
    if (grandTotal === 0) {
        showToast('⚠️ الإجمالي صفر، لا يمكن إنشاء فاتورة', 'error');
        return;
    }
    
    // 8. جلب الفواتير الحالية
    let invoices = [];
    try {
        invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    } catch (e) {
        invoices = [];
    }
    
    // 9. توليد رقم فاتورة تلقائي
    const nextNum = invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(nextNum).padStart(3, '0')}`;
    
    // 10. إنشاء الفاتورة (مع كل البيانات)
    const invoice = {
        id: 'inv_' + Date.now(),
        number: invoiceNumber,
        offerName: currentName,
        client: targetCompany,
        welcomeMessage: welcomeMessage,
        data: data.map(row => ({ ...row })), // نسخ البنود
        // ✅ الحقول الإضافية
        transportGo: transportGo,
        transportBack: transportBack,
        transportFlatbed: transportFlatbed,
        roadCards: roadCards,
        fuelCost: fuelCost,
        extrasTotal: extrasTotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        totalWithExtras: totalWithExtras,
        grandTotal: grandTotal,
        notes: notesData,
        paid: 0,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'unpaid',
        payments: [],
        offerCreatedAt: new Date().toISOString()
    };
    
    // 11. حفظ الفاتورة
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    
    showToast(`✅ تم تحويل العرض "${currentName}" إلى فاتورة رقم ${invoiceNumber}`, 'success');
    
    if (confirm(`✅ تم إنشاء الفاتورة رقم ${invoiceNumber}\n\nهل تريد عرض تفاصيل الفاتورة الآن؟`)) {
        window.location.href = `invoice-detail.html?id=${invoice.id}`;
    }
}

// ====== تصدير PDF عبر نافذة الطباعة ======
function savePDF() {
    // التحقق من صلاحية الترخيص
    if (typeof licenseManager !== 'undefined') {
        const features = licenseManager.getFeatures();
        if (!features.canExportPDF) {
            showToast('⚠️ تصدير PDF متاح فقط في النسخة المدفوعة', 'error');
            licenseManager.showActivationPrompt();
            return;
        }
    }
    
    // ====== جلب جميع البيانات من localStorage ======
    // 1. بيانات الشركة (المحفوظة من company.js)
    const companyName = localStorage.getItem('field_companyName') || 'شركة المعدات الحديثة';
    const companyPhone = localStorage.getItem('field_companyPhone') || '';
    const companyAddress = localStorage.getItem('field_companyAddress') || '';
    const companyCommercial = localStorage.getItem('field_companyCommercial') || '';
    const companyTax = localStorage.getItem('field_companyTax') || '';
    const projectName = localStorage.getItem('field_projectName') || '';
    const logo = localStorage.getItem('companyLogo') || '';
    
    // 2. معلومات العرض (من حقول الصفحة الحالية)
    const quotationNumber = document.getElementById('quotationNumber')?.value || 'QT-2026-001';
    const issueDate = document.getElementById('issueDate')?.value || new Date().toISOString().split('T')[0];
    const validityDate = document.getElementById('validityDate')?.value || '';
    
    // 3. العميل والرسالة
    const targetCompany = document.getElementById('targetCompany')?.value || 'غير محدد';
    const welcomeMessage = document.getElementById('welcomeMessage')?.value || 'نشكركم على ثقتكم';
    
    // 4. الحقول الإضافية
    const transportGo = document.getElementById('transportGo')?.value || '0';
    const transportBack = document.getElementById('transportBack')?.value || '0';
    const transportFlatbed = document.getElementById('transportFlatbed')?.value || '0';
    const roadCards = document.getElementById('roadCards')?.value || '0';
    const fuelCost = document.getElementById('fuelCost')?.value || '0';
    
    // 5. الضريبة والإجمالي
    const taxRate = document.getElementById('taxRate')?.value || '0';
    const taxAmount = document.getElementById('taxAmount')?.textContent || '0';
    const totalWithTax = document.getElementById('totalWithTax')?.textContent || '0';
    const totalDisplay = document.getElementById('totalDisplay')?.innerHTML || '0 ج.م';
    
    // 6. التوقيعات (من localStorage)
    const sigEmployee = localStorage.getItem('sig_sigEmployee') || '';
    const sigClient = localStorage.getItem('sig_sigClient') || '';
    
    // 7. الملاحظات
    const notesData = notes && notes.length > 0 ? notes : defaultNotes;
    
    // تحديد ما إذا كانت النسخة مجانية للعلامة المائية
    let isFreeVersion = true;
    if (typeof licenseManager !== 'undefined') {
        const features = licenseManager.getFeatures();
        isFreeVersion = !features.isPremium;
    }

    // بناء الجدول
    let itemsHtml = '';
    data.forEach((row, index) => {
        const opTotal = getOperationTotal(row);
        itemsHtml += `
            <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px; font-weight: bold;">${row.name || 'غير محدد'}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${row.unit || '---'}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${row.value || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${row.priceType || '---'}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${row.duration || '---'}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${row.count || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${Number(row.unitPrice || 0).toLocaleString('en-US')}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px; font-weight: bold; color: #1a6b8a;">${opTotal.toLocaleString('en-US')}</td>
            </tr>
        `;
    });

    // العلامة المائية
    let watermarkHtml = '';
    if (isFreeVersion) {
        watermarkHtml = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 70px; color: rgba(200, 200, 200, 0.2); font-weight: bold; z-index: 9999; pointer-events: none; white-space: nowrap; text-transform: uppercase;">
                نسخة تجريبية
            </div>
        `;
    }

    // فتح نافذة الطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('⚠️ يرجى السماح بفتح النوافذ المنبثقة (Popups) لتحميل الـ PDF', 'error');
        return;
    }

    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>عرض أسعار - ${quotationNumber}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                body {
                    font-family: 'Cairo', sans-serif;
                    background: #ffffff;
                    color: #1a2a3a;
                    margin: 0;
                    padding: 15px;
                    box-sizing: border-box;
                }
                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }
            </style>
        </head>
        <body>
            ${watermarkHtml}
            
            <!-- الهيدر -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 3px solid #1a6b8a; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${logo ? `<img src="${logo}" style="max-height: 55px; max-width: 75px; border-radius: 6px; border: 1px solid #ddd; padding: 3px;" />` : ''}
                    <div>
                        <h2 style="font-size: 16px; color: #1a6b8a; margin: 0;">${companyName}</h2>
                        <p style="font-size: 10px; color: #666; margin: 2px 0;">هاتف: ${companyPhone} | العنوان: ${companyAddress}</p>
                        <p style="font-size: 10px; color: #666; margin: 0;">سجل تجاري: ${companyCommercial} | رقم ضريبي: ${companyTax} | المشروع: ${projectName}</p>
                    </div>
                </div>
                <div style="text-align: left;">
                    <h1 style="font-size: 18px; color: #c9a84c; margin: 0;">عرض أسعار</h1>
                    <p style="font-size: 10px; color: #666; margin: 2px 0;">رقم العرض: <strong>${quotationNumber}</strong></p>
                    <p style="font-size: 10px; color: #666; margin: 0;">تاريخ الإصدار: ${issueDate} ${validityDate ? `| الصلاحية: ${validityDate}` : ''}</p>
                </div>
            </div>

            <!-- العميل -->
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 10px; font-size: 11px; border: 1px solid #e0e8ec;">
                <span style="font-weight: bold; color: #1a6b8a;">موجه إلى:</span>
                <span><strong>${targetCompany}</strong></span>
                <span style="opacity: 0.3;">|</span>
                <span>${welcomeMessage}</span>
            </div>

            <!-- الجدول -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <thead>
                    <tr style="background: #1a6b8a; color: white;">
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 20%;">المعدة</th>
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 8%;">الوحدة</th>
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 8%;">القيمة</th>
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 10%;">نوع السعر</th>
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 10%;">المدة</th>
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 8%;">العدد</th>
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 15%;">سعر الوحدة</th>
                        <th style="padding: 6px; border: 1px solid #1a6b8a; text-align: center; font-size: 10px; width: 21%;">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- الحقول الإضافية -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; padding: 8px 10px; background: #f8fafc; border-radius: 6px; margin-bottom: 10px; font-size: 10px; border: 1px solid #e0e8ec; text-align: center;">
                <div>نقل ذهاب: <strong>${Number(transportGo).toLocaleString('en-US')} ج.م</strong></div>
                <div>نقل عودة: <strong>${Number(transportBack).toLocaleString('en-US')} ج.م</strong></div>
                <div>مشال: <strong>${Number(transportFlatbed).toLocaleString('en-US')} ج.م</strong></div>
                <div>كارتات: <strong>${Number(roadCards).toLocaleString('en-US')} ج.م</strong></div>
                <div>سولار: <strong>${Number(fuelCost).toLocaleString('en-US')} ج.م</strong></div>
            </div>

            <!-- الضريبة والإجمالي -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 10px; border: 1px solid #e0e8ec;">
                <div style="font-size: 10px;">
                    <strong>VAT (${taxRate}%):</strong> قيمة الضريبة: <strong>${taxAmount} ج.م</strong> | الإجمالي شامل الضريبة: <strong>${totalWithTax} ج.م</strong>
                    ${taxRate == 0 ? '<span style="color: #c9a84c; background: #f5ecc0; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">لا يشمل ضرائب</span>' : ''}
                </div>
                <div style="padding: 6px 16px; border-radius: 15px; font-weight: bold; font-size: 14px; background: #e8f4f8; border: 2px solid #1a6b8a; color: #1a6b8a;">
                    الإجمالي: ${totalDisplay.replace(/<[^>]*>/g, '').trim()}
                </div>
            </div>

            <!-- الملاحظات -->
            ${notesData && notesData.length > 0 ? `
                <div style="margin-top: 10px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e0e8ec; border-right: 3px solid #c9a84c; border-radius: 6px;">
                    <h3 style="font-size: 11px; color: #1a6b8a; margin: 0 0 5px 0;">ملاحظات وشروط:</h3>
                    ${notesData.map(note => `<div style="font-size: 10px; padding: 2px 0; color: #444;">• ${note}</div>`).join('')}
                </div>
            ` : ''}

            <!-- التوقيعات -->
            <div style="display: flex; gap: 20px; margin-top: 20px;">
                <div style="flex: 1; border: 1px dashed #ccc; padding: 10px; text-align: center; border-radius: 6px;">
                    <h4 style="font-size: 10px; color: #1a6b8a; margin: 0 0 6px 0;">توقيع الموظف</h4>
                    <div style="min-height: 40px; display: flex; align-items: center; justify-content: center;">
                        ${sigEmployee ? `<img src="${sigEmployee}" style="max-height: 40px; max-width: 100%;" />` : '<span style="color: #aaa; font-size: 9px;">لا يوجد توقيع</span>'}
                    </div>
                </div>
                <div style="flex: 1; border: 1px dashed #ccc; padding: 10px; text-align: center; border-radius: 6px;">
                    <h4 style="font-size: 10px; color: #1a6b8a; margin: 0 0 6px 0;">توقيع العميل</h4>
                    <div style="min-height: 40px; display: flex; align-items: center; justify-content: center;">
                        ${sigClient ? `<img src="${sigClient}" style="max-height: 40px; max-width: 100%;" />` : '<span style="color: #aaa; font-size: 9px;">لا يوجد توقيع</span>'}
                    </div>
                </div>
            </div>

            <!-- الفوتر -->
            <div style="margin-top: 15px; text-align: center; color: #999; font-size: 8px; border-top: 1px solid #eee; padding-top: 8px;">
                تم إنشاء هذا العرض بواسطة نظام عروض أسعار المعدات | ${new Date().toLocaleDateString('ar-EG')}
            </div>

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 400);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
    showToast('✅ تم فتح نافذة الطباعة/الحفظ كـ PDF بنجاح', 'success');
}

// ====== تصدير Excel ======
function exportExcel() {
    if (typeof licenseManager !== 'undefined') {
        const features = licenseManager.getFeatures();
        if (!features.canExportExcel) {
            showToast('⚠️ تصدير Excel متاح فقط في النسخة المدفوعة', 'error');
            licenseManager.showActivationPrompt();
            return;
        }
    }
    
    let wb = XLSX.utils.book_new();
    let wsData = [["المعدة", "الوحدة", "القيمة", "نوع السعر", "المدة", "العدد", "سعر الوحدة", "الإجمالي"]];
    data.forEach(r => wsData.push([r.name, r.unit, r.value, r.priceType, r.duration, r.count, r.unitPrice, getOperationTotal(r)]));
    let ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "عروض الأسعار");
    XLSX.writeFile(wb, "Quotation.xlsx");
    showToast('📊 تم تصدير ملف إكسل', 'success');
}

function openPreview() {
    const content = document.getElementById('previewContent');
    if (!content) return;
    content.innerHTML = document.querySelector('.quotation-container')?.outerHTML || '';
    const modal = document.getElementById('previewModal');
    if (modal) modal.classList.add('active');
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.classList.remove('active');
}

function shareOptions() {
    if (navigator.share) {
        navigator.share({ title: 'عرض أسعار معدات', url: window.location.href }).catch(() => {});
    } else {
        const url = window.location.href;
        navigator.clipboard?.writeText(url).then(() => showToast('✅ تم نسخ الرابط', 'success'));
    }
}

// ====== جعل الدوال متاحة عالمياً ======
window.convertToInvoice = convertToInvoice;

// ====== التهيئة ======
function loadQuotationData() {
    if (typeof licenseManager !== 'undefined') {
        initLicense();
    }
    
    const saved = localStorage.getItem('equipDataV12');
    if (saved) {
        try { data = JSON.parse(saved); } 
        catch { data = JSON.parse(JSON.stringify(defaultData)); }
    } else {
        data = JSON.parse(JSON.stringify(defaultData));
    }
    
    const savedNotes = localStorage.getItem('equipNotesV12');
    try { notes = JSON.parse(savedNotes) || [...defaultNotes]; } 
    catch { notes = [...defaultNotes]; }
    
    ['quotationNumber','issueDate','validityDate','targetCompany','welcomeMessage'].forEach(id => {
        const val = localStorage.getItem('field_' + id);
        const el = document.getElementById(id);
        if (val !== null && el) el.value = val;
    });
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const future = new Date(now);
    future.setDate(future.getDate() + 30);
    const futureStr = future.toISOString().split('T')[0];
    
    const issueDateEl = document.getElementById('issueDate');
    const validityDateEl = document.getElementById('validityDate');
    if (issueDateEl && !issueDateEl.value) issueDateEl.value = today;
    if (validityDateEl && !validityDateEl.value) validityDateEl.value = futureStr;
    
    ['transportGo','transportBack','transportFlatbed','roadCards','fuelCost'].forEach(id => {
        const val = localStorage.getItem('extra_' + id);
        const el = document.getElementById(id);
        if (val !== null && el) el.value = val;
    });
    
    const taxRate = localStorage.getItem('taxRate');
    const taxRateEl = document.getElementById('taxRate');
    if (taxRate && taxRateEl) taxRateEl.value = taxRate;
    
    if (typeof licenseManager !== 'undefined') {
        updateUIForLicense();
    }
    
    renderTable();
    renderNotes();
    updateTotalSummary();
    updateValidityStatus();
    loadSavedOffersList();
    loadClientList();
}

// تشغيل التهيئة
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadQuotationData, 100);
});
