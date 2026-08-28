// js/sirkat.js - الكود المكتمل والمصحح نهائياً

// ====== المتغيرات ======
let sirkatData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// ====== تهيئة الصفحة ======
function initSirkat() {
    loadCompanyData();
    
    const savedMonth = localStorage.getItem('sirkat_month');
    const savedYear = localStorage.getItem('sirkat_year');
    
    if (savedMonth !== null) {
        currentMonth = parseInt(savedMonth);
        const monthSelect = document.getElementById('sirkatMonth');
        if (monthSelect) monthSelect.value = currentMonth;
    }
    if (savedYear !== null) {
        currentYear = parseInt(savedYear);
        const yearInput = document.getElementById('sirkatYear');
        if (yearInput) yearInput.value = currentYear;
    }
    
    loadSirkatData();
    
    const supervisor = localStorage.getItem('sirkat_supervisor') || '';
    const supervisorInput = document.getElementById('sirkatSupervisor');
    if (supervisorInput) supervisorInput.value = supervisor;
    
    updateMonthYearDisplay();
    renderSirkatTable();
    applySirkatColors();
}

// ====== تحميل بيانات الشركة ======
function loadCompanyData() {
    const companyName = localStorage.getItem('field_companyName') || 'شركة المعدات الحديثة';
    const projectName = localStorage.getItem('field_projectName') || 'مشروع برج الأمل';
    const logo = localStorage.getItem('companyLogo') || '';
    
    const companyEl = document.getElementById('sirkatCompanyName');
    const projectEl = document.getElementById('sirkatProjectName');
    if (companyEl) companyEl.textContent = companyName;
    if (projectEl) projectEl.textContent = projectName;
    
    const logoImg = document.getElementById('sirkatLogo');
    if (logoImg) {
        if (logo && logo.startsWith('data:image')) {
            logoImg.src = logo;
            logoImg.style.display = 'block';
        } else {
            logoImg.style.display = 'none';
        }
    }
}

// ====== تحديث عرض الشهر والسنة ======
function updateMonthYearDisplay() {
    const monthSelect = document.getElementById('sirkatMonth');
    const yearInput = document.getElementById('sirkatYear');
    const displayEl = document.getElementById('sirkatMonthYear');
    
    if (monthSelect && yearInput && displayEl) {
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearInput.value);
        displayEl.textContent = `${monthNames[month]} ${year}`;
    }
}

// ====== تحميل بيانات سركات ======
function loadSirkatData() {
    const saved = localStorage.getItem('sirkat_data');
    if (saved) {
        try {
            sirkatData = JSON.parse(saved);
        } catch {
            sirkatData = {};
        }
    } else {
        sirkatData = {};
    }
}

// ====== حفظ بيانات سركات ======
function saveSirkatData() {
    const rows = document.querySelectorAll('#sirkatTableBody tr');
    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const day = row.querySelector('.day-cell')?.textContent || '';
        const date = row.querySelector('.date-cell')?.textContent || '';
        const from = inputs[0]?.value || '';
        const to = inputs[1]?.value || '';
        const driver = inputs[2]?.value || '';
        const engineer = inputs[3]?.value || '';
        
        const key = `${currentYear}-${currentMonth}-${index + 1}`;
        sirkatData[key] = {
            day: day,
            date: date,
            from: from,
            to: to,
            driver: driver,
            engineer: engineer
        };
    });
    
    localStorage.setItem('sirkat_data', JSON.stringify(sirkatData));
    localStorage.setItem('sirkat_month', currentMonth);
    localStorage.setItem('sirkat_year', currentYear);
    
    if (typeof showToast === 'function') {
        showToast('✅ تم حفظ بيانات سركات بنجاح', 'success');
    }
}

// ====== حفظ اسم المشرف ======
function saveSirkatSupervisor() {
    const supervisorInput = document.getElementById('sirkatSupervisor');
    if (supervisorInput) {
        localStorage.setItem('sirkat_supervisor', supervisorInput.value);
    }
}

// ====== تعبئة الجدول ======
function renderSirkatTable() {
    const tbody = document.getElementById('sirkatTableBody');
    const monthSelect = document.getElementById('sirkatMonth');
    const yearInput = document.getElementById('sirkatYear');
    
    if (!tbody || !monthSelect || !yearInput) return;
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    let totalHours = 0;
    let workingDays = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dayName = dayNames[date.getDay()];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const key = `${year}-${month}-${i}`;
        
        const data = sirkatData[key] || {};
        const from = data.from || '';
        const to = data.to || '';
        const driver = data.driver || '';
        const engineer = data.engineer || '';
        
        let total = 0;
        if (from && to) {
            const fromParts = from.split(':');
            const toParts = to.split(':');
            if (fromParts.length === 2 && toParts.length === 2) {
                const fromHours = parseInt(fromParts[0]) || 0;
                const fromMinutes = parseInt(fromParts[1]) || 0;
                const toHours = parseInt(toParts[0]) || 0;
                const toMinutes = parseInt(toParts[1]) || 0;
                total = (toHours * 60 + toMinutes) - (fromHours * 60 + fromMinutes);
                total = Math.round(total / 60 * 10) / 10;
                if (total < 0) total = 0;
            }
        }
        
        if (total > 0) workingDays++;
        totalHours += total;
        
        html += `
            <tr>
                <td>${i}</td>
                <td class="day-cell">${dayName}</td>
                <td class="date-cell">${dateStr}</td>
                <td><input type="time" class="sirkat-from" value="${from}" onchange="updateSirkatRow(this)" /></td>
                <td><input type="time" class="sirkat-to" value="${to}" onchange="updateSirkatRow(this)" /></td>
                <td class="total-hours" id="total-${i}">${total > 0 ? total.toFixed(1) : 0}</td>
                <td><input type="text" class="sirkat-driver" value="${driver}" placeholder="" onchange="updateSirkatRow(this)" /></td>
                <td><input type="text" class="sirkat-engineer" value="${engineer}" placeholder="" onchange="updateSirkatRow(this)" /></td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    
    const totalHoursEl = document.getElementById('sirkatTotalHours');
    const totalDaysEl = document.getElementById('sirkatTotalDays');
    if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(1);
    if (totalDaysEl) totalDaysEl.textContent = workingDays;
}

// ====== تحديث صف عند تغيير قيمة ======
function updateSirkatRow(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    const fromInput = row.querySelector('.sirkat-from');
    const toInput = row.querySelector('.sirkat-to');
    const totalCell = row.querySelector('.total-hours');
    
    if (!fromInput || !toInput || !totalCell) return;
    
    const from = fromInput.value;
    const to = toInput.value;
    let total = 0;
    
    if (from && to) {
        const fromParts = from.split(':');
        const toParts = to.split(':');
        if (fromParts.length === 2 && toParts.length === 2) {
            const fromHours = parseInt(fromParts[0]) || 0;
            const fromMinutes = parseInt(fromParts[1]) || 0;
            const toHours = parseInt(toParts[0]) || 0;
            const toMinutes = parseInt(toParts[1]) || 0;
            total = (toHours * 60 + toMinutes) - (fromHours * 60 + fromMinutes);
            total = Math.round(total / 60 * 10) / 10;
            if (total < 0) total = 0;
        }
    }
    
    totalCell.textContent = total > 0 ? total.toFixed(1) : 0;
    updateTotalSummary();
}

// ====== تحديث الإجمالي الكلي ======
function updateTotalSummary() {
    const totalCells = document.querySelectorAll('.total-hours');
    let total = 0;
    let workingDays = 0;
    
    totalCells.forEach(cell => {
        const val = parseFloat(cell.textContent) || 0;
        total += val;
        if (val > 0) workingDays++;
    });
    
    const totalHoursEl = document.getElementById('sirkatTotalHours');
    const totalDaysEl = document.getElementById('sirkatTotalDays');
    if (totalHoursEl) totalHoursEl.textContent = total.toFixed(1);
    if (totalDaysEl) totalDaysEl.textContent = workingDays;
}

// ====== تحديث الجدول ======
function updateSirkat() {
    const monthSelect = document.getElementById('sirkatMonth');
    const yearInput = document.getElementById('sirkatYear');
    if (!monthSelect || !yearInput) return;
    
    currentMonth = parseInt(monthSelect.value);
    currentYear = parseInt(yearInput.value);
    
    updateMonthYearDisplay();
    renderSirkatTable();
    saveSirkatData();
}

// ====== طباعة الصفحة ======
function printSirkat() {
    saveSirkatData();
    window.print();
}

// ====== تصدير PDF ======
function saveSirkatPDF() {
    saveSirkatData();
    if (typeof showToast === 'function') showToast('📄 جاري تجهيز ملف PDF...', 'success');
    
    const controls = document.querySelector('.sirkat-controls');
    const backBtn = document.querySelector('.sirkat-back');
    
    if (controls) controls.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    
    const primaryColor = localStorage.getItem('primaryColor') || '#1a6b8a';
    const goldColor = localStorage.getItem('goldColor') || '#c9a84c';
    const bgColor = localStorage.getItem('bgColor') || '#f0f4f8';
    const textColor = localStorage.getItem('textColor') || '#1a2a3a';
    
    const style = document.createElement('style');
    style.id = 'pdf-print-style';
    style.textContent = `
        @page {
            size: A4 portrait;
            margin: 0;
        }
        * {
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-font-smoothing: antialiased !important;
        }
        body {
            font-family: 'Cairo', sans-serif !important;
            background: #fff !important;
            color: ${textColor} !important;
        }
        #sirkatContainer {
            width: 210mm !important;
            height: 296mm !important;
            padding: 8mm 10mm !important;
            margin: 0 auto !important;
            background: #fff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
        }
        .sirkat-header {
            background: ${primaryColor} !important;
            color: #fff !important;
            padding: 4mm 6mm !important;
            border-radius: 2mm !important;
            height: 22mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-header-top {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .sirkat-logo {
            display: flex !important;
            align-items: center !important;
            gap: 3mm !important;
        }
        .sirkat-logo img {
            max-height: 10mm !important;
            background: #fff !important;
            padding: 1px !important;
            border-radius: 1mm !important;
        }
        .sirkat-logo h1 {
            font-size: 11pt !important;
            font-weight: 700 !important;
            color: #fff !important;
        }
        .sirkat-date {
            font-size: 8pt !important;
            background: rgba(255,255,255,0.2) !important;
            padding: 1mm 3mm !important;
            border-radius: 1mm !important;
            color: #fff !important;
        }
        .sirkat-header-bottom {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-top: 2mm !important;
            border-top: 0.5px solid rgba(255,255,255,0.3) !important;
            padding-top: 1mm !important;
        }
        .sirkat-header-bottom h2 {
            font-size: 9pt !important;
            color: #fff !important;
        }
        .sirkat-header-bottom p {
            font-size: 8pt !important;
            color: rgba(255,255,255,0.9) !important;
        }
        .sirkat-table-wrap {
            border: 1px solid #333 !important;
            border-radius: 1mm !important;
            overflow: hidden !important;
            height: 250mm !important;
            display: flex !important;
            flex-direction: column !important;
        }
        .sirkat-table {
            width: 100% !important;
            height: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
        }
        .sirkat-table th {
            background: ${primaryColor} !important;
            color: #fff !important;
            font-size: 8.5pt !important;
            font-weight: 700 !important;
            height: 7mm !important;
            text-align: center !important;
            border: 0.5px solid #333 !important;
            vertical-align: middle !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-table td {
            font-size: 7.5pt !important;
            height: 7.2mm !important;
            border: 0.5px solid #ccc !important;
            text-align: center !important;
            vertical-align: middle !important;
            color: ${textColor} !important;
            padding: 0 !important;
        }
        .sirkat-table tr:nth-child(even) td {
            background-color: ${bgColor} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-table td input {
            font-size: 7.5pt !important;
            border: none !important;
            background: transparent !important;
            color: ${textColor} !important;
            text-align: center !important;
            width: 100% !important;
            height: 100% !important;
            outline: none !important;
        }
        .sirkat-table td input::placeholder {
            color: transparent !important;
        }
        .sirkat-table td .total-hours {
            font-weight: 700 !important;
            color: ${primaryColor} !important;
        }
        .sirkat-table tfoot td {
            font-size: 8.5pt !important;
            font-weight: 700 !important;
            height: 7.5mm !important;
            background: #f0f0f0 !important;
            border-top: 1.5px solid #333 !important;
        }
        .sirkat-supervisor {
            height: 10mm !important;
            display: flex !important;
            align-items: center !important;
            gap: 3mm !important;
            padding: 0 2mm !important;
        }
        .sirkat-supervisor label {
            font-size: 8.5pt !important;
            font-weight: 600 !important;
            color: ${textColor} !important;
        }
        .sirkat-supervisor input {
            font-size: 8.5pt !important;
            border: none !important;
            border-bottom: 1px solid ${primaryColor} !important;
            background: transparent !important;
            color: ${textColor} !important;
            width: 60mm !important;
        }
    `;
    document.head.appendChild(style);
    
    const element = document.getElementById('sirkatContainer');
    
    const opt = {
        margin:       0,
        filename:     `سركات_${monthNames[currentMonth]}_${currentYear}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { 
            scale: 3,
            useCORS: true,
            logging: false,
            letterRendering: true
        },
        jsPDF:        { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => {
            if (controls) controls.style.display = '';
            if (backBtn) backBtn.style.display = '';
            document.getElementById('pdf-print-style')?.remove();
            if (typeof showToast === 'function') showToast('✅ تم تصدير PDF بنجاح', 'success');
        }).catch(err => {
            console.error('PDF Error:', err);
            if (controls) controls.style.display = '';
            if (backBtn) backBtn.style.display = '';
            document.getElementById('pdf-print-style')?.remove();
            if (typeof showToast === 'function') showToast('❌ حدث خطأ أثناء تصدير PDF', 'error');
        });
    } else {
        if (controls) controls.style.display = '';
        if (backBtn) backBtn.style.display = '';
        document.getElementById('pdf-print-style')?.remove();
        window.print();
    }
}

// ====== إعادة تعيين البيانات ======
function clearSirkatData() {
    if (confirm('⚠️ هل أنت متأكد من مسح جميع بيانات سركات؟')) {
        if (confirm('⚠️ تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه!')) {
            localStorage.removeItem('sirkat_data');
            sirkatData = {};
            renderSirkatTable();
            if (typeof showToast === 'function') showToast('✅ تم إعادة تعيين البيانات', 'success');
        }
    }
}

// ====== تطبيق الألوان ======
function applySirkatColors() {
    const primary = localStorage.getItem('primaryColor') || '#1a6b8a';
    const gold = localStorage.getItem('goldColor') || '#c9a84c';
    const text = localStorage.getItem('textColor') || '#1a2a3a';
    
    const header = document.getElementById('sirkatHeader');
    if (header) header.style.background = primary;
    
    document.querySelectorAll('.sirkat-table th').forEach(th => {
        th.style.background = primary;
    });
    
    const totalEl = document.getElementById('sirkatTotalHours');
    if (totalEl) totalEl.style.color = primary;
    
    document.querySelectorAll('.sirkat-table tfoot td').forEach(td => {
        td.style.color = text;
    });
}

// ====== التهيئة عند فتح الصفحة ======
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSirkat, 100);
});