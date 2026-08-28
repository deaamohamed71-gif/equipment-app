// js/sirkat.js - كود صفحة سركات (محدث بالكامل)

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
        document.getElementById('sirkatMonth').value = currentMonth;
    }
    if (savedYear !== null) {
        currentYear = parseInt(savedYear);
        document.getElementById('sirkatYear').value = currentYear;
    }
    
    loadSirkatData();
    
    const supervisor = localStorage.getItem('sirkat_supervisor') || '';
    document.getElementById('sirkatSupervisor').value = supervisor;
    
    updateMonthYearDisplay();
    renderSirkatTable();
    applySirkatColors();
}

// ====== تحميل بيانات الشركة ======
function loadCompanyData() {
    const companyName = localStorage.getItem('field_companyName') || 'شركة المعدات الحديثة';
    const projectName = localStorage.getItem('field_projectName') || 'مشروع برج الأمل';
    const logo = localStorage.getItem('companyLogo') || '';
    
    document.getElementById('sirkatCompanyName').textContent = companyName;
    document.getElementById('sirkatProjectName').textContent = projectName;
    
    const logoImg = document.getElementById('sirkatLogo');
    if (logo && logo.startsWith('data:image')) {
        logoImg.src = logo;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }
}

// ====== تحديث عرض الشهر والسنة ======
function updateMonthYearDisplay() {
    const month = parseInt(document.getElementById('sirkatMonth').value);
    const year = parseInt(document.getElementById('sirkatYear').value);
    document.getElementById('sirkatMonthYear').textContent = `${monthNames[month]} ${year}`;
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
    
    showToast('✅ تم حفظ بيانات سركات بنجاح', 'success');
}

// ====== حفظ اسم المشرف ======
function saveSirkatSupervisor() {
    const supervisor = document.getElementById('sirkatSupervisor').value;
    localStorage.setItem('sirkat_supervisor', supervisor);
}

// ====== تعبئة الجدول ======
function renderSirkatTable() {
    const tbody = document.getElementById('sirkatTableBody');
    const month = parseInt(document.getElementById('sirkatMonth').value);
    const year = parseInt(document.getElementById('sirkatYear').value);
    
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
    
    document.getElementById('sirkatTotalHours').textContent = totalHours.toFixed(1);
    document.getElementById('sirkatTotalDays').textContent = workingDays;
}

// ====== تحديث صف عند تغيير قيمة ======
function updateSirkatRow(input) {
    const row = input.closest('tr');
    const fromInput = row.querySelector('.sirkat-from');
    const toInput = row.querySelector('.sirkat-to');
    const totalCell = row.querySelector('.total-hours');
    
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
    
    document.getElementById('sirkatTotalHours').textContent = total.toFixed(1);
    document.getElementById('sirkatTotalDays').textContent = workingDays;
}

// ====== تحديث الجدول ======
function updateSirkat() {
    const month = parseInt(document.getElementById('sirkatMonth').value);
    const year = parseInt(document.getElementById('sirkatYear').value);
    currentMonth = month;
    currentYear = year;
    
    updateMonthYearDisplay();
    renderSirkatTable();
    saveSirkatData();
}

// ====== طباعة الصفحة ======
function printSirkat() {
    saveSirkatData();
    window.print();
}

// ====== تصدير PDF (A4 Portrait - صفحة واحدة) ======
function saveSirkatPDF() {
    saveSirkatData();
    showToast('📄 جاري تجهيز ملف PDF...', 'success');
    
    // إخفاء العناصر غير المرغوب فيها مؤقتاً للتصدير
    const controls = document.querySelector('.sirkat-controls');
    const backBtn = document.querySelector('.sirkat-back');
    const supervisor = document.querySelector('.sirkat-supervisor');
    
    if (controls) controls.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (supervisor) supervisor.style.display = 'none';
    
    // جلب الألوان الفعلية من localStorage
    const primaryColor = localStorage.getItem('primaryColor') || '#1a6b8a';
    const goldColor = localStorage.getItem('goldColor') || '#c9a84c';
    const bgColor = localStorage.getItem('bgColor') || '#f0f4f8';
    const textColor = localStorage.getItem('textColor') || '#1a2a3a';
    
    // 🔥 تنسيق PDF كامل - مضبوط على A4
    const style = document.createElement('style');
    style.id = 'pdf-print-style';
    style.textContent = `
        @page {
            size: A4 portrait;
            margin: 4mm 5mm;
        }
        * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
        }
        body {
            font-family: 'Cairo', sans-serif !important;
            background: #fff !important;
            color: ${textColor} !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 7px !important;
            line-height: 1 !important;
        }
        .sirkat-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
        }
        .dashboard {
            padding: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            width: 100% !important;
        }
        
        /* ====== هيدر ====== */
        .sirkat-header {
            background: ${primaryColor} !important;
            color: #fff !important;
            padding: 1.5mm 2.5mm !important;
            margin-bottom: 1mm !important;
            border-radius: 1.5mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
        }
        .sirkat-header-top {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 1.5mm !important;
            width: 100% !important;
        }
        .sirkat-logo {
            display: flex !important;
            align-items: center !important;
            gap: 1.5mm !important;
        }
        .sirkat-logo img {
            max-height: 12mm !important;
            border-radius: 1mm !important;
            border: 0.5px solid rgba(255,255,255,0.2) !important;
            padding: 0.5mm !important;
            background: #fff !important;
        }
        .sirkat-logo h1 {
            font-size: 3.5mm !important;
            color: #fff !important;
            margin: 0 !important;
        }
        .sirkat-date {
            font-size: 2.2mm !important;
            background: rgba(255,255,255,0.2) !important;
            padding: 0.3mm 1.5mm !important;
            border-radius: 1.5mm !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-header-bottom {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-top: 0.5mm !important;
            padding-top: 0.5mm !important;
            border-top: 0.5px solid rgba(255,255,255,0.15) !important;
            width: 100% !important;
        }
        .sirkat-header-bottom h2 {
            font-size: 2.5mm !important;
            color: #fff !important;
            margin: 0 !important;
        }
        .sirkat-header-bottom h2 i {
            color: ${goldColor} !important;
        }
        .sirkat-header-bottom p {
            font-size: 2mm !important;
            color: rgba(255,255,255,0.9) !important;
            margin: 0 !important;
        }
        
        /* ====== الجدول - يملأ الصفحة ====== */
        .sirkat-table-wrap {
            border: 0.5px solid #ccc !important;
            border-radius: 0.5mm !important;
            overflow: hidden !important;
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }
        .sirkat-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 1.8mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border-spacing: 0 !important;
            table-layout: fixed !important;
        }
        /* تحديد عرض الأعمدة */
        .sirkat-table th:nth-child(1), .sirkat-table td:nth-child(1) { width: 6% !important; }
        .sirkat-table th:nth-child(2), .sirkat-table td:nth-child(2) { width: 10% !important; }
        .sirkat-table th:nth-child(3), .sirkat-table td:nth-child(3) { width: 12% !important; }
        .sirkat-table th:nth-child(4), .sirkat-table td:nth-child(4) { width: 10% !important; }
        .sirkat-table th:nth-child(5), .sirkat-table td:nth-child(5) { width: 10% !important; }
        .sirkat-table th:nth-child(6), .sirkat-table td:nth-child(6) { width: 10% !important; }
        .sirkat-table th:nth-child(7), .sirkat-table td:nth-child(7) { width: 20% !important; }
        .sirkat-table th:nth-child(8), .sirkat-table td:nth-child(8) { width: 22% !important; }
        
        .sirkat-table th {
            background: ${primaryColor} !important;
            color: #fff !important;
            font-size: 1.6mm !important;
            padding: 0.3mm 0.2mm !important;
            text-align: center !important;
            border: 0.5px solid ${primaryColor} !important;
            font-weight: 700 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: 3.5mm !important;
        }
        .sirkat-table td {
            font-size: 1.6mm !important;
            padding: 0.2mm 0.15mm !important;
            border-bottom: 0.5px solid #ddd !important;
            border-left: 0.5px solid #eee !important;
            border-right: 0.5px solid #eee !important;
            color: ${textColor} !important;
            text-align: center !important;
            height: 3mm !important;
            vertical-align: middle !important;
        }
        .sirkat-table td input {
            font-size: 1.6mm !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
            color: ${textColor} !important;
            text-align: center !important;
            width: 100% !important;
            height: 2.5mm !important;
            min-height: 2mm !important;
        }
        /* 🔥 إخفاء placeholder في الطباعة */
        .sirkat-table td input::placeholder {
            color: transparent !important;
            opacity: 0 !important;
        }
        .sirkat-table td input[type="time"] {
            width: 100% !important;
            font-size: 1.6mm !important;
        }
        .sirkat-table td .total-hours {
            font-weight: 700 !important;
            color: ${primaryColor} !important;
        }
        .sirkat-table tbody tr:nth-child(even) td {
            background-color: ${bgColor} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-table tfoot td {
            font-size: 1.8mm !important;
            padding: 0.3mm 0.2mm !important;
            border-top: 0.8px solid ${primaryColor} !important;
            background: #fff !important;
            color: ${textColor} !important;
            height: 3.5mm !important;
        }
        
        /* ====== المشرف ====== */
        .sirkat-supervisor {
            padding: 0.5mm 1.5mm !important;
            margin-top: 0.5mm !important;
            border: none !important;
            background: transparent !important;
            display: flex !important;
            align-items: center !important;
            gap: 1.5mm !important;
            width: 100% !important;
        }
        .sirkat-supervisor label {
            font-size: 2mm !important;
            color: ${textColor} !important;
        }
        .sirkat-supervisor label i {
            color: ${goldColor} !important;
        }
        .sirkat-supervisor input {
            font-size: 2mm !important;
            padding: 0.1mm 0.5mm !important;
            border: none !important;
            border-bottom: 0.5px solid ${primaryColor} !important;
            background: transparent !important;
            color: ${textColor} !important;
            height: 3mm !important;
            width: 50mm !important;
        }
        .sirkat-supervisor input::placeholder {
            color: transparent !important;
            opacity: 0 !important;
        }
        
        /* 🔥 منع تقسيم الجدول */
        .sirkat-table-wrap {
            page-break-inside: avoid !important;
        }
        .sirkat-table tbody tr {
            page-break-inside: avoid !important;
        }
        .sirkat-table tfoot {
            page-break-inside: avoid !important;
        }
        
        /* 🔥 إخفاء كل العناصر غير المرغوب فيها */
        #header, #footer, .dashboard, .no-print {
            display: none !important;
        }
        .no-print {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    
    const element = document.getElementById('sirkatContainer');
    
    const opt = {
        margin:        [1, 2, 1, 2],
        filename:     `سركات_${monthNames[currentMonth]}_${currentYear}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2.8, 
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            width: element.scrollWidth,
            height: element.scrollHeight
        },
        jsPDF:        { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        if (controls) controls.style.display = '';
        if (backBtn) backBtn.style.display = '';
        if (supervisor) supervisor.style.display = '';
        document.getElementById('pdf-print-style')?.remove();
        showToast('✅ تم تصدير PDF بنجاح', 'success');
    }).catch(err => {
        console.error('PDF Error:', err);
        if (controls) controls.style.display = '';
        if (backBtn) backBtn.style.display = '';
        if (supervisor) supervisor.style.display = '';
        document.getElementById('pdf-print-style')?.remove();
        showToast('❌ حدث خطأ أثناء تصدير PDF', 'error');
    });
}

// ====== إعادة تعيين البيانات ======
function clearSirkatData() {
    if (confirm('⚠️ هل أنت متأكد من مسح جميع بيانات سركات؟')) {
        if (confirm('⚠️ تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه!')) {
            localStorage.removeItem('sirkat_data');
            sirkatData = {};
            renderSirkatTable();
            showToast('✅ تم إعادة تعيين البيانات', 'success');
        }
    }
}

// ====== تطبيق الألوان من صفحة التصميم ======
function applySirkatColors() {
    const primary = localStorage.getItem('primaryColor') || '#1a6b8a';
    const gold = localStorage.getItem('goldColor') || '#c9a84c';
    const bg = localStorage.getItem('bgColor') || '#f0f4f8';
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
    
    document.querySelectorAll('.sirkat-header-bottom h2 i, .sirkat-supervisor label i').forEach(el => {
        el.style.color = gold;
    });
    
    const companyName = document.getElementById('sirkatCompanyName');
    if (companyName) companyName.style.color = '#fff';
}

// ====== الاستماع لتغييرات الألوان ======
window.addEventListener('storage', function(e) {
    if (['primaryColor', 'goldColor', 'bgColor', 'textColor'].includes(e.key)) {
        applySirkatColors();
    }
});

// ====== التهيئة ======
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSirkat, 100);
});