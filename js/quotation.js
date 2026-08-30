// js/quotation.js - كود صفحة العرض مع التحسينات (Constants + Debouncing)

// ============================================================
//  ✅ الثوابت (بدلاً من الأرقام السحرية)
// ============================================================
const WORK_HOURS_PER_DAY = 8;
const WORK_DAYS_PER_MONTH = 26;
const WORK_HOURS_PER_MONTH = 208;
const DEBOUNCE_DELAY = 500; // تأخير الحفظ بعد التوقف عن الكتابة

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
let saveTimeout = null; // لتأخير الحفظ (Debouncing)

// ============================================================
//  ✅ دالة Debouncing للحفظ
// ============================================================
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveData();
        console.log('✅ تم حفظ البيانات بعد التوقف عن الكتابة');
    }, DEBOUNCE_DELAY);
}

// ====== الحصول على userId الحالي ======
function getCurrentUserId() {
    try {
        const auth = window.firebaseAuth;
        if (auth && auth.currentUser) {
            return auth.currentUser.uid;
        }
        return localStorage.getItem('user_id') || 'anonymous';
    } catch (e) {
        return 'anonymous';
    }
}

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

// ============================================================
//  ✅ العمليات الحسابية (باستخدام الثوابت)
// ============================================================
function getOperationTotal(row) {
    const count = row.count || 1;
    const unitPrice = row.unitPrice || 0;
    
    if (row.priceType === 'يومي') {
        if (row.duration === 'أيام') return count * unitPrice;
        if (row.duration === 'ساعات') { 
            const days = Math.ceil(count / WORK_HOURS_PER_DAY); 
            return days * unitPrice; 
        }
        if (row.duration === 'شهور') return count * WORK_DAYS_PER_MONTH * unitPrice;
    }
    if (row.priceType === 'شهري') {
        if (row.duration === 'شهور') return count * unitPrice;
        if (row.duration === 'أيام') { 
            const months = Math.ceil(count / WORK_DAYS_PER_MONTH); 
            return months * unitPrice; 
        }
        if (row.duration === 'ساعات') { 
            const months = Math.ceil(count / WORK_HOURS_PER_MONTH); 
            return months * unitPrice; 
        }
    }
    return count * unitPrice;
}

function getIconForName(name) {
    return iconMap[name] || defaultIcon;
}

// ============================================================
//  ✅ الجدول (محسّن)
// ============================================================
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
                <input type="text" style="width:110px; border-radius:20px; padding:0.15rem 0.3rem; text-align:center; border:1px solid var(--border); background:transparent; font-size:0.8rem;" value="${row.name}" onchange="updateField(${index}, 'name', this.value)" onblur="debouncedSave()" />
                ${!isPremium && showLimitWarning ? '<i class="fas fa-lock" style="color:var(--gold); font-size:0.7rem;" title="الحد الأقصى للبنود في النسخة المجانية"></i>' : ''}
            </td>
            <td>
                <select onchange="updateField(${index}, 'unit', this.value)" onblur="debouncedSave()" style="font-size:0.8rem;">
                    <option value="متر" ${row.unit === 'متر' ? 'selected' : ''}>متر</option>
                    <option value="طن" ${row.unit === 'طن' ? 'selected' : ''}>طن</option>
                </select>
            </td>
            <td><input type="number" class="spec-input" value="${row.value}" min="0" onchange="updateField(${index}, 'value', Number(this.value))" onblur="debouncedSave()" /></td>
            <td>
                <select onchange="updateField(${index}, 'priceType', this.value)" onblur="debouncedSave()" style="font-size:0.8rem;">
                    <option value="يومي" ${row.priceType === 'يومي' ? 'selected' : ''}>يومي</option>
                    <option value="شهري" ${row.priceType === 'شهري' ? 'selected' : ''}>شهري</option>
                </select>
            </td>
            <td>
                <select onchange="updateField(${index}, 'duration', this.value)" onblur="debouncedSave()" style="font-size:0.8rem;">
                    <option value="ساعات" ${row.duration === 'ساعات' ? 'selected' : ''}>ساعات</option>
                    <option value="أيام" ${row.duration === 'أيام' ? 'selected' : ''}>أيام</option>
                    <option value="شهور" ${row.duration === 'شهور' ? 'selected' : ''}>شهور</option>
                </select>
            </td>
            <td><input type="number" class="count-input" value="${row.count}" min="0" onchange="updateField(${index}, 'count', Number(this.value))" onblur="debouncedSave()" /></td>
            <td><input type="number" class="price-input" value="${row.unitPrice}" min="0" onchange="updateField(${index}, 'unitPrice', Number(this.value))" onblur="debouncedSave()" /></td>
            <td style="font-weight:700; color:var(--primary);" id="opTotal-${index}">${opTotal.toLocaleString('en-US')}</td>
            <td><button class="delete-row" onclick="deleteRow(${index})"><i class="fas fa-times"></i></button></td>
        `;
        fragment.appendChild(tr);
    });
    
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
    updateTotalSummary();
    // ✅ الحفظ التلقائي يتم عبر debouncedSave
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
    
    // ✅ تحديث الإجمالي فقط (بدون إعادة بناء الجدول)
    const totalEl = document.getElementById(`opTotal-${index}`);
    if (totalEl) {
        totalEl.textContent = getOperationTotal(data[index]).toLocaleString('en-US');
    }
    updateTotalSummary();
    // ✅ الحفظ يتم عبر debouncedSave (عند onblur)
}

function deleteRow(index) {
    if (data.length <= 1) { showToast('⚠️ لا يمكن حذف الصف الأخير', 'error'); return; }
    data.splice(index, 1);
    renderTable();
    debouncedSave();
}

function addRow() {
    if (typeof licenseManager === 'undefined') {
        data.push({ name: 'معدة جديدة', unit: 'متر', value: 0, priceType: 'يومي', duration: 'أيام', count: 1, unitPrice: 0, icon: defaultIcon });
        renderTable();
        showToast('📝 تم إضافة صف جديد', 'success');
        debouncedSave();
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
    debouncedSave();
}

function clearEquipmentOnly() {
    data.forEach(row => { row.name = ''; row.value = 0; row.count = 1; row.unitPrice = 0; });
    renderTable();
    showToast('✅ تم مسح المحتويات', 'success');
    debouncedSave();
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
            <input type="text" class="note-text" value="${note.replace(/"/g, '&quot;')}" onchange="updateNote(${idx}, this.value)" onblur="debouncedSave()" />
            <button class="delete-note" onclick="deleteNote(${idx})"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    });
}

function addNote() { 
    notes.push('ملاحظة جديدة.'); 
    renderNotes(); 
    debouncedSave(); 
}

function deleteNote(index) { 
    notes.splice(index, 1); 
    renderNotes(); 
    debouncedSave(); 
}

function updateNote(index, value) { 
    notes[index] = value; 
    debouncedSave(); 
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

// ====== حفظ البيانات (مع Debouncing) ======
function saveData() {
    try {
        localStorage.setItem('equipDataV12', JSON.stringify(data));
        localStorage.setItem('equipNotesV12', JSON.stringify(notes));
    } catch (e) {
        console.warn('⚠️ فشل حفظ البيانات:', e);
        showToast('⚠️ حدث خطأ في حفظ البيانات', 'error');
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
    
    const userId = getCurrentUserId();
    
    savedOffers = savedOffers.filter(o => o.name !== name);
    savedOffers.push({ 
        name, 
        data: cleanData, 
        notes: notes.filter(n => n.trim().length > 0),
        targetCompany: document.getElementById('targetCompany')?.value || '',
        expiryDate: document.getElementById('validityDate')?.value || '',
        createdAt: new Date().toISOString(),
        userId: userId
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
    
    const userId = getCurrentUserId();
    let clients = getClients().filter(c => c.name !== name);
    clients.push({ 
        name, 
        phone, 
        email,
        userId: userId
    });
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
//  ✅ تحويل العرض إلى فاتورة
// ============================================================
function convertToInvoice() {
    const currentName = document.getElementById('quotationNumber')?.value || 'عرض غير مسمى';
    const targetCompany = document.getElementById('targetCompany')?.value || 'غير محدد';
    const welcomeMessage = document.getElementById('welcomeMessage')?.value || '';
    
    if (data.length === 0 || !data.some(row => row.name && row.name.trim())) {
        showToast('⚠️ لا توجد بيانات في العرض لتحويلها إلى فاتورة', 'error');
        return;
    }
    
    let total = 0;
    data.forEach(row => {
        if (row.unitPrice && row.count) {
            total += row.unitPrice * row.count;
        }
    });
    
    const transportGo = parseFloat(document.getElementById('transportGo')?.value) || 0;
    const transportBack = parseFloat(document.getElementById('transportBack')?.value) || 0;
    const transportFlatbed = parseFloat(document.getElementById('transportFlatbed')?.value) || 0;
    const roadCards = parseFloat(document.getElementById('roadCards')?.value) || 0;
    const fuelCost = parseFloat(document.getElementById('fuelCost')?.value) || 0;
    
    const extrasTotal = transportGo + transportBack + transportFlatbed + roadCards + fuelCost;
    const totalWithExtras = total + extrasTotal;
    
    const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 0;
    const taxAmount = totalWithExtras * (taxRate / 100);
    const grandTotal = totalWithExtras + taxAmount;
    
    const notesData = notes && notes.length > 0 ? notes : [];
    
    if (grandTotal === 0) {
        showToast('⚠️ الإجمالي صفر، لا يمكن إنشاء فاتورة', 'error');
        return;
    }
    
    let invoices = [];
    try {
        invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    } catch (e) {
        invoices = [];
    }
    
    const nextNum = invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(nextNum).padStart(3, '0')}`;
    const userId = getCurrentUserId();
    
    const invoice = {
        id: 'inv_' + Date.now(),
        number: invoiceNumber,
        offerName: currentName,
        client: targetCompany,
        welcomeMessage: welcomeMessage,
        data: data.map(row => ({ ...row })),
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
        offerCreatedAt: new Date().toISOString(),
        userId: userId
    };
    
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    
    showToast(`✅ تم تحويل العرض "${currentName}" إلى فاتورة رقم ${invoiceNumber}`, 'success');
    
    if (confirm(`✅ تم إنشاء الفاتورة رقم ${invoiceNumber}\n\nهل تريد عرض تفاصيل الفاتورة الآن؟`)) {
        window.location.href = `invoice-detail.html?id=${invoice.id}`;
    }
}

// ====== تصدير PDF ======
function savePDF() {
    if (typeof licenseManager !== 'undefined') {
        const features = licenseManager.getFeatures();
        if (!features.canExportPDF) {
            showToast('⚠️ تصدير PDF متاح فقط في النسخة المدفوعة', 'error');
            licenseManager.showActivationPrompt();
            return;
        }
    }
    
    // ... باقي كود PDF (نفس السابق)
    // (لم يتغير)
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
window.debouncedSave = debouncedSave;

// ============================================================
//  ✅ التهيئة
// ============================================================
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
    
    console.log('✅ تم تحميل صفحة العروض مع التحسينات (Constants + Debouncing)');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadQuotationData, 100);
});
