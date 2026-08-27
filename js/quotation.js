// js/quotation.js - كود صفحة العرض مع نظام الترخيص ودالة PDF المحسنة

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
    'ونش أحمال': 'fa-crane',
    'فورك لفت': 'fa-truck',
    'مانليفت': 'fa-hand-holding'
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

// ====== إضافة صف مع التحقق من الترخيص ======
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

// ====== تصدير PDF محسن مع جميع البيانات ======
function savePDF() {
    // التحقق من وجود licenseManager
    if (typeof licenseManager !== 'undefined') {
        const features = licenseManager.getFeatures();
        
        if (!features.canExportPDF) {
            showToast('⚠️ تصدير PDF متاح فقط في النسخة المدفوعة', 'error');
            licenseManager.showActivationPrompt();
            return;
        }
    }
    
    showToast('📄 جاري تجهيز ملف PDF...', 'success');
    
    // ====== جمع جميع البيانات ======
    // 1. معلومات الشركة
    const companyName = document.getElementById('companyName')?.value || 'شركة المعدات الحديثة';
    const companyPhone = document.getElementById('companyPhone')?.value || '0123456789';
    const companyAddress = document.getElementById('companyAddress')?.value || 'القاهرة';
    const companyCommercial = document.getElementById('companyCommercial')?.value || '123456';
    const companyTax = document.getElementById('companyTax')?.value || '987654';
    const projectName = document.getElementById('projectName')?.value || 'برج الأمل';
    
    // 2. الشعار
    const logo = localStorage.getItem('companyLogo') || '';
    
    // 3. معلومات العرض
    const quotationNumber = document.getElementById('quotationNumber')?.value || 'QT-2026-001';
    const issueDate = document.getElementById('issueDate')?.value || new Date().toISOString().split('T')[0];
    const validityDate = document.getElementById('validityDate')?.value || '';
    
    // 4. الشركة المستهدفة والرسالة
    const targetCompany = document.getElementById('targetCompany')?.value || 'غير محدد';
    const welcomeMessage = document.getElementById('welcomeMessage')?.value || 'نشكركم على ثقتكم';
    
    // 5. الحقول الإضافية
    const transportGo = document.getElementById('transportGo')?.value || '0';
    const transportBack = document.getElementById('transportBack')?.value || '0';
    const transportFlatbed = document.getElementById('transportFlatbed')?.value || '0';
    const roadCards = document.getElementById('roadCards')?.value || '0';
    const fuelCost = document.getElementById('fuelCost')?.value || '0';
    
    // 6. الضريبة والإجمالي
    const taxRate = document.getElementById('taxRate')?.value || '0';
    const taxAmount = document.getElementById('taxAmount')?.textContent || '0';
    const totalWithTax = document.getElementById('totalWithTax')?.textContent || '0';
    const totalDisplay = document.getElementById('totalDisplay')?.innerHTML || '0 ج.م';
    
    // 7. التوقيعات
    const sigEmployee = localStorage.getItem('sig_sigEmployee') || '';
    const sigClient = localStorage.getItem('sig_sigClient') || '';
    
    // 8. الملاحظات
    const notesData = notes || defaultNotes;
    
    // ====== بناء HTML للتصدير ======
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>عرض أسعار - ${quotationNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm 10mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            padding: 10px;
            font-size: 11px;
            background: white;
            color: #1a2a3a;
        }
        .quotation-container {
            max-width: 100%;
            margin: 0 auto;
        }
        
        /* الهيدر */
        .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 8px;
            border-bottom: 3px solid #1a6b8a;
            margin-bottom: 10px;
        }
        .pdf-header .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .pdf-header .logo-area img {
            max-height: 60px;
            max-width: 80px;
            border-radius: 8px;
            border: 1px solid #ddd;
            padding: 4px;
        }
        .pdf-header .logo-area .company-info h2 {
            font-size: 16px;
            color: #1a6b8a;
            margin: 0;
        }
        .pdf-header .logo-area .company-info p {
            font-size: 9px;
            color: #666;
            margin: 2px 0;
        }
        .pdf-header .quotation-title {
            text-align: left;
        }
        .pdf-header .quotation-title h1 {
            font-size: 18px;
            color: #c9a84c;
            margin: 0;
        }
        .pdf-header .quotation-title p {
            font-size: 10px;
            color: #666;
            margin: 2px 0;
        }
        
        /* معلومات العرض */
        .quotation-info {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 20px;
            padding: 6px 0;
            border-bottom: 1px solid #e0e8ec;
            margin-bottom: 6px;
        }
        .quotation-info .info-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
        }
        .quotation-info .info-item strong {
            color: #1a6b8a;
        }
        .validity-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            background: #e8f4f8;
            color: #1a6b8a;
            font-size: 10px;
            font-weight: 700;
        }
        
        /* العميل */
        .welcome-msg {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            padding: 6px 10px;
            background: #f8fafc;
            border-radius: 8px;
            margin: 6px 0;
            font-size: 10px;
            border: 1px solid #e0e8ec;
        }
        .welcome-msg .label {
            font-weight: 600;
            color: #1a6b8a;
        }
        .welcome-msg .value {
            font-weight: 500;
        }
        
        /* الجدول */
        .table-wrap {
            overflow: visible !important;
            border: 1px solid #e0e8ec !important;
            border-radius: 8px !important;
            margin: 8px 0 !important;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        th {
            background: #1a6b8a;
            color: white;
            padding: 5px 4px;
            text-align: center;
            border: 1px solid #1a6b8a;
            font-size: 9px;
            font-weight: 700;
        }
        td {
            padding: 4px 4px;
            text-align: center;
            border: 1px solid #ddd;
            font-size: 9px;
        }
        tr:nth-child(even) td {
            background: #f8fafc;
        }
        .equip-name {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            justify-content: center;
        }
        .equip-name i {
            font-size: 10px;
            color: #888;
        }
        
        /* الحقول الإضافية */
        .extra-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 4px 10px;
            padding: 6px 10px;
            background: #f8fafc;
            border-radius: 8px;
            margin: 6px 0;
            font-size: 10px;
            border: 1px solid #e0e8ec;
        }
        .extra-fields .field {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .extra-fields .field-label {
            font-weight: 500;
        }
        .extra-fields .field-value {
            font-weight: 700;
            color: #1a6b8a;
        }
        
        /* الضريبة والإجمالي */
        .tax-total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            padding: 6px 12px;
            background: #f8fafc;
            border-radius: 8px;
            margin: 6px 0;
            border: 1px solid #e0e8ec;
        }
        .tax-section {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            font-size: 10px;
        }
        .tax-section .label {
            font-weight: 600;
        }
        .tax-result {
            font-weight: 700;
            color: #1a6b8a;
            font-size: 11px;
        }
        .total-summary {
            padding: 4px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            background: #e8f4f8;
            border: 2px solid #1a6b8a;
            color: #1a6b8a;
        }
        .total-summary i {
            color: #c9a84c;
        }
        .tax-note {
            font-size: 8px;
            color: #c9a84c;
            background: #f5ecc0;
            padding: 2px 10px;
            border-radius: 10px;
        }
        
        /* الملاحظات */
        .note-section {
            margin-top: 10px;
            padding: 8px 12px;
            border-right: 3px solid #c9a84c;
            background: #f8fafc;
            border: 1px solid #e0e8ec;
            border-right-width: 3px;
            border-radius: 8px;
        }
        .note-section h3 {
            font-size: 11px;
            color: #1a6b8a;
            margin-bottom: 4px;
        }
        .note-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 2px 0;
            border-bottom: 1px solid #eee;
            font-size: 9px;
        }
        .note-item i {
            color: #c9a84c;
            font-size: 4px;
        }
        
        /* التوقيعات */
        .signature-area {
            display: flex;
            gap: 30px;
            margin-top: 14px;
            flex-wrap: wrap;
        }
        .signature-box {
            flex: 1;
            border: 1px dashed #ccc;
            padding: 10px 15px;
            text-align: center;
            min-width: 150px;
            border-radius: 8px;
        }
        .signature-box .sig-header {
            display: flex;
            align-items: center;
            gap: 6px;
            justify-content: center;
            margin-bottom: 4px;
        }
        .signature-box .sig-header i {
            color: #c9a84c;
            font-size: 14px;
        }
        .signature-box .sig-header h4 {
            font-size: 10px;
            margin: 0;
            color: #1a6b8a;
        }
        .signature-box .sig-preview {
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-box .sig-preview img {
            max-height: 50px;
            max-width: 100%;
        }
        .signature-box .sig-empty {
            color: #aaa;
            font-size: 9px;
        }
        
        /* الفوتر */
        .pdf-footer {
            margin-top: 16px;
            text-align: center;
            color: #999;
            font-size: 8px;
            border-top: 1px solid #eee;
            padding-top: 8px;
        }
        
        /* علامة مائية */
        .watermark {
            position: fixed;
            bottom: 50%;
            left: 50%;
            transform: translate(-50%, 50%) rotate(-30deg);
            font-size: 60px;
            color: rgba(0,0,0,0.04);
            font-weight: bold;
            pointer-events: none;
            z-index: 9999;
            white-space: nowrap;
        }
        
        /* منع تقسيم الجدول */
        table { page-break-inside: avoid; }
        tr { page-break-inside: avoid; }
        .note-section { page-break-inside: avoid; }
        .signature-area { page-break-inside: avoid; }
    </style>
</head>
<body>
    <div class="quotation-container">
        
        <!-- ====== الهيدر ====== -->
        <div class="pdf-header">
            <div class="logo-area">
                ${logo ? `<img src="${logo}" alt="شعار الشركة" />` : ''}
                <div class="company-info">
                    <h2>${companyName}</h2>
                    <p><i class="fas fa-phone"></i> ${companyPhone} | <i class="fas fa-map-marker-alt"></i> ${companyAddress}</p>
                    <p><i class="fas fa-id-card"></i> سجل تجاري: ${companyCommercial} | <i class="fas fa-receipt"></i> الرقم الضريبي: ${companyTax}</p>
                    <p><i class="fas fa-project-diagram"></i> المشروع: ${projectName}</p>
                </div>
            </div>
            <div class="quotation-title">
                <h1>عرض أسعار</h1>
                <p>رقم العرض: <strong>${quotationNumber}</strong></p>
                <p>تاريخ الإصدار: ${issueDate}</p>
                ${validityDate ? `<p>تاريخ الصلاحية: ${validityDate}</p>` : ''}
            </div>
        </div>
        
        <!-- ====== معلومات العميل ====== -->
        <div class="welcome-msg">
            <span class="label"><i class="fas fa-handshake"></i> موجه إلى:</span>
            <span class="value"><strong>${targetCompany}</strong></span>
            <span style="opacity:0.3;">|</span>
            <span class="value">${welcomeMessage}</span>
        </div>
        
        <!-- ====== الجدول ====== -->
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th style="width:18%;">المعدة</th>
                        <th style="width:8%;">الوحدة</th>
                        <th style="width:8%;">القيمة</th>
                        <th style="width:10%;">نوع السعر</th>
                        <th style="width:9%;">المدة</th>
                        <th style="width:7%;">العدد</th>
                        <th style="width:12%;">سعر الوحدة</th>
                        <th style="width:13%;">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            <td class="equip-name">
                                <i class="fas ${row.icon || getIconForName(row.name) || 'fa-arrow-up'}"></i>
                                ${row.name || 'غير محدد'}
                            </td>
                            <td>${row.unit || '---'}</td>
                            <td>${row.value || 0}</td>
                            <td>${row.priceType || '---'}</td>
                            <td>${row.duration || '---'}</td>
                            <td>${row.count || 0}</td>
                            <td>${Number(row.unitPrice || 0).toLocaleString('en-US')}</td>
                            <td style="font-weight:700; color:#1a6b8a;">${getOperationTotal(row).toLocaleString('en-US')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- ====== الحقول الإضافية ====== -->
        <div class="extra-fields">
            <div class="field"><span class="field-label"><i class="fas fa-truck"></i> نقل ذهاب:</span> <span class="field-value">${Number(transportGo).toLocaleString('en-US')} ج.م</span></div>
            <div class="field"><span class="field-label"><i class="fas fa-truck"></i> نقل عودة:</span> <span class="field-value">${Number(transportBack).toLocaleString('en-US')} ج.م</span></div>
            <div class="field"><span class="field-label"><i class="fas fa-trailer"></i> مشال:</span> <span class="field-value">${Number(transportFlatbed).toLocaleString('en-US')} ج.م</span></div>
            <div class="field"><span class="field-label"><i class="fas fa-road"></i> كارتات:</span> <span class="field-value">${Number(roadCards).toLocaleString('en-US')} ج.م</span></div>
            <div class="field"><span class="field-label"><i class="fas fa-gas-pump"></i> سولار:</span> <span class="field-value">${Number(fuelCost).toLocaleString('en-US')} ج.م</span></div>
        </div>
        
        <!-- ====== الضريبة والإجمالي ====== -->
        <div class="tax-total-row">
            <div class="tax-section">
                <span class="label"><i class="fas fa-percent"></i> VAT:</span>
                <span>${taxRate}%</span>
                <span>قيمة الضريبة: <span class="tax-result">${taxAmount} ج.م</span></span>
                <span>الإجمالي شامل الضريبة: <span class="tax-result">${totalWithTax} ج.م</span></span>
                ${taxRate == 0 ? '<span class="tax-note">💰 المبلغ الكلي لا يشمل أي ضرائب</span>' : ''}
            </div>
            <div class="total-summary">
                <i class="fas fa-coins"></i> ${totalDisplay.replace(/<[^>]*>/g, '').trim()}
            </div>
        </div>
        
        <!-- ====== الملاحظات ====== -->
        ${notesData && notesData.length > 0 ? `
        <div class="note-section">
            <h3><i class="fas fa-file-contract"></i> ملاحظات وشروط</h3>
            ${notesData.map(note => `
                <div class="note-item">
                    <i class="fas fa-circle"></i>
                    <span>${note}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <!-- ====== التوقيعات ====== -->
        <div class="signature-area">
            <div class="signature-box">
                <div class="sig-header">
                    <i class="fas fa-user-tie"></i>
                    <h4>توقيع الموظف</h4>
                </div>
                <div class="sig-preview">
                    ${sigEmployee ? `<img src="${sigEmployee}" alt="توقيع الموظف" />` : '<span class="sig-empty">لا يوجد توقيع</span>'}
                </div>
            </div>
            <div class="signature-box">
                <div class="sig-header">
                    <i class="fas fa-user-check"></i>
                    <h4>توقيع العميل</h4>
                </div>
                <div class="sig-preview">
                    ${sigClient ? `<img src="${sigClient}" alt="توقيع العميل" />` : '<span class="sig-empty">لا يوجد توقيع</span>'}
                </div>
            </div>
        </div>
        
        <!-- ====== الفوتر ====== -->
        <div class="pdf-footer">
            تم إنشاء هذا العرض بواسطة نظام عروض أسعار المعدات | ${new Date().toLocaleDateString('ar-EG')}
        </div>
        
    </div>
</body>
</html>
    `;
    
    // ====== إنشاء عنصر مؤقت للتصدير ======
    const printContainer = document.createElement('div');
    printContainer.style.cssText = 'padding: 0; background: white; direction: rtl;';
    printContainer.innerHTML = htmlContent;
    document.body.appendChild(printContainer);
    
    // ====== إعدادات التصدير ======
    const opt = {
        margin: [6, 8, 6, 8],
        filename: `Quotation_${quotationNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            windowHeight: printContainer.scrollHeight
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'landscape'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(printContainer).save().then(() => {
        if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
        }
        showToast('✅ تم تصدير PDF بنجاح', 'success');
    }).catch(err => {
        if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
        }
        showToast('❌ حدث خطأ أثناء تصدير PDF', 'error');
        console.error('PDF Export Error:', err);
    });
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

// ====== التهيئة ======
function loadQuotationData() {
    // تهيئة الترخيص
    if (typeof licenseManager !== 'undefined') {
        initLicense();
    }
    
    // تحميل البيانات
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
    
    // تحميل القيم من localStorage
    ['quotationNumber','issueDate','validityDate','targetCompany','welcomeMessage'].forEach(id => {
        const val = localStorage.getItem('field_' + id);
        const el = document.getElementById(id);
        if (val !== null && el) el.value = val;
    });
    
    // تعيين التواريخ الافتراضية
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const future = new Date(now);
    future.setDate(future.getDate() + 30);
    const futureStr = future.toISOString().split('T')[0];
    
    const issueDateEl = document.getElementById('issueDate');
    const validityDateEl = document.getElementById('validityDate');
    if (issueDateEl && !issueDateEl.value) issueDateEl.value = today;
    if (validityDateEl && !validityDateEl.value) validityDateEl.value = futureStr;
    
    // تحميل الحقول الإضافية
    ['transportGo','transportBack','transportFlatbed','roadCards','fuelCost'].forEach(id => {
        const val = localStorage.getItem('extra_' + id);
        const el = document.getElementById(id);
        if (val !== null && el) el.value = val;
    });
    
    const taxRate = localStorage.getItem('taxRate');
    const taxRateEl = document.getElementById('taxRate');
    if (taxRate && taxRateEl) taxRateEl.value = taxRate;
    
    // تحديث الواجهة حسب الترخيص
    if (typeof licenseManager !== 'undefined') {
        updateUIForLicense();
    }
    
    // العرض
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