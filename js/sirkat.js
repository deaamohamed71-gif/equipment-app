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
                <td><input type="text" class="sirkat-driver" value="${driver}" placeholder="السائق" onchange="updateSirkatRow(this)" /></td>
                <td><input type="text" class="sirkat-engineer" value="${engineer}" placeholder="التوقيع" onchange="updateSirkatRow(this)" /></td>
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

// ====== تصدير PDF (Portrait - صفحة واحدة) ======
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
    
    // جلب الألوان من localStorage
    const primaryColor = localStorage.getItem('primaryColor') || '#1a6b8a';
    const goldColor = localStorage.getItem('goldColor') || '#c9a84c';
    const bgColor = localStorage.getItem('bgColor') || '#f0f4f8';
    const textColor = localStorage.getItem('textColor') || '#1a2a3a';
    
    // إضافة تنسيق خاص للـ PDF
    const style = document.createElement('style');
    style.id = 'pdf-print-style';
    style.textContent = `
        /* ألوان من صفحة التصميم */
        .sirkat-header {
            background: ${primaryColor} !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-table th {
            background: ${primaryColor} !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-date {
            background: rgba(255,255,255,0.15) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-table td .total-hours {
            font-weight: 700 !important;
            color: ${primaryColor} !important;
        }
        .sirkat-table tfoot td {
            border-top: 2px solid ${primaryColor} !important;
            color: ${textColor} !important;
        }
        .sirkat-table td {
            color: ${textColor} !important;
        }
        .sirkat-table tbody tr:nth-child(even) td {
            background: ${bgColor}33 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-supervisor label i {
            color: ${goldColor} !important;
        }
        .sirkat-supervisor label {
            color: ${textColor} !important;
        }
        .sirkat-supervisor input {
            color: ${textColor} !important;
            border-bottom: 1px solid ${primaryColor} !important;
        }
        .sirkat-header-bottom h2 i {
            color: ${goldColor} !important;
        }
        .sirkat-logo h1 {
            color: #fff !important;
        }
        .sirkat-header-bottom p {
            color: rgba(255,255,255,0.9) !important;
        }
        
        /* تنسيق الطباعة - Portrait وصفحة واحدة */
        @page {
            size: A4 portrait;
            margin: 5mm 8mm;
        }
        body {
            font-family: 'Cairo', sans-serif !important;
        }
        .sirkat-table {
            font-size: 0.7rem !important;
            width: 100% !important;
            page-break-inside: avoid !important;
        }
        .sirkat-table th {
            font-size: 0.6rem !important;
            padding: 0.2rem 0.15rem !important;
        }
        .sirkat-table td {
            font-size: 0.6rem !important;
            padding: 0.15rem 0.1rem !important;
        }
        .sirkat-table td input {
            font-size: 0.6rem !important;
            padding: 0.05rem !important;
        }
        .sirkat-table td input[type="time"] {
            width: 50px !important;
        }
        .sirkat-table tfoot td {
            font-size: 0.65rem !important;
            padding: 0.2rem 0.15rem !important;
        }
        .sirkat-logo h1 {
            font-size: 0.9rem !important;
        }
        .sirkat-logo img {
            max-height: 30px !important;
        }
        .sirkat-date {
            font-size: 0.7rem !important;
            padding: 0.1rem 0.5rem !important;
        }
        .sirkat-header {
            padding: 0.4rem 0.8rem !important;
            margin-bottom: 0.3rem !important;
        }
        .sirkat-header-bottom h2 {
            font-size: 0.8rem !important;
        }
        .sirkat-header-bottom p {
            font-size: 0.7rem !important;
        }
        .sirkat-header-top {
            gap: 0.2rem !important;
        }
        .sirkat-header-bottom {
            margin-top: 0.2rem !important;
            padding-top: 0.2rem !important;
        }
        .sirkat-table-wrap {
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            overflow: hidden !important;
        }
        .sirkat-supervisor {
            padding: 0.3rem 0.5rem !important;
            margin-top: 0.3rem !important;
            border: none !important;
            background: transparent !important;
        }
        .sirkat-supervisor input {
            font-size: 0.7rem !important;
            padding: 0.1rem 0.3rem !important;
            min-width: 100px !important;
            border: none !important;
            border-bottom: 1px solid ${primaryColor} !important;
            background: transparent !important;
        }
        .sirkat-supervisor label {
            font-size: 0.7rem !important;
        }
        .sirkat-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
        }
        .dashboard {
            padding: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
        }
        body {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        #header, #footer, .no-print {
            display: none !important;
        }
        /* منع تقسيم الجدول */
        .sirkat-table-wrap {
            page-break-inside: avoid !important;
        }
        .sirkat-table tbody tr {
            page-break-inside: avoid !important;
        }
        .sirkat-table tfoot {
            page-break-inside: avoid !important;
        }
        .sirkat-table th, .sirkat-table td {
            border-color: #ddd !important;
        }
    `;
    document.head.appendChild(style);
    
    const element = document.getElementById('sirkatContainer');
    
    const opt = {
        margin:        [4, 6, 4, 6],
        filename:     `سركات_${monthNames[currentMonth]}_${currentYear}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            windowHeight: element.scrollHeight
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
    
    // الهيدر
    const header = document.getElementById('sirkatHeader');
    if (header) header.style.background = primary;
    
    // رأس الجدول
    document.querySelectorAll('.sirkat-table th').forEach(th => {
        th.style.background = primary;
    });
    
    // الإجمالي
    const totalEl = document.getElementById('sirkatTotalHours');
    if (totalEl) totalEl.style.color = primary;
    
    // الإجمالي في التذييل
    document.querySelectorAll('.sirkat-table tfoot td').forEach(td => {
        td.style.color = text;
    });
    
    // أيقونات الذهبية
    document.querySelectorAll('.sirkat-header-bottom h2 i, .sirkat-supervisor label i').forEach(el => {
        el.style.color = gold;
    });
    
    // اسم الشركة
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