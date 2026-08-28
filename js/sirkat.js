// js/sirkat.js - كود صفحة سركات

// ====== المتغيرات ======
let sirkatData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// ====== تهيئة الصفحة ======
function initSirkat() {
    // تحميل بيانات الشركة
    loadCompanyData();
    
    // تحميل الشهر والسنة من localStorage
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
    
    // تحميل بيانات سركات
    loadSirkatData();
    
    // تحميل اسم المشرف
    const supervisor = localStorage.getItem('sirkat_supervisor') || '';
    document.getElementById('sirkatSupervisor').value = supervisor;
    
    // تحديث عرض الشهر
    updateMonthYearDisplay();
    
    // تعبئة الجدول
    renderSirkatTable();
    
    // تطبيق الألوان
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
    // جمع البيانات من الجدول
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
    
    // عدد أيام الشهر
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
        
        // حساب الإجمالي
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
                total = Math.round(total / 60 * 10) / 10; // تقريب لأقرب 0.1
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
    
    // تحديث الإجمالي
    document.getElementById('sirkatTotalHours').textContent = totalHours.toFixed(1);
    document.getElementById('sirkatTotalDays').textContent = workingDays;
}

// ====== تحديث صف عند تغيير قيمة ======
function updateSirkatRow(input) {
    const row = input.closest('tr');
    const cells = row.querySelectorAll('td');
    const fromInput = row.querySelector('.sirkat-from');
    const toInput = row.querySelector('.sirkat-to');
    const totalCell = row.querySelector('.total-hours');
    const dayCell = row.querySelector('.day-cell');
    const dateCell = row.querySelector('.date-cell');
    const driverInput = row.querySelector('.sirkat-driver');
    const engineerInput = row.querySelector('.sirkat-engineer');
    
    // حساب الإجمالي
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
    
    // تحديث الإجمالي الكلي
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

// ====== تحديث الجدول عند تغيير الشهر أو السنة ======
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

// ====== تصدير PDF ======
function saveSirkatPDF() {
    saveSirkatData();
    const element = document.getElementById('sirkatContainer');
    html2pdf().from(element).save(`سركات_${monthNames[currentMonth]}_${currentYear}.pdf`);
    showToast('📄 جاري تصدير PDF', 'success');
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

// ====== تطبيق الألوان من إعدادات التصميم ======
function applySirkatColors() {
    const primary = localStorage.getItem('primaryColor') || '#1a6b8a';
    const gold = localStorage.getItem('goldColor') || '#c9a84c';
    const bg = localStorage.getItem('bgColor') || '#f0f4f8';
    const text = localStorage.getItem('textColor') || '#1a2a3a';
    
    // تطبيق الألوان على الهيدر
    const header = document.getElementById('sirkatHeader');
    if (header) {
        header.style.background = primary;
    }
    
    // تطبيق الألوان على رأس الجدول
    const thElements = document.querySelectorAll('.sirkat-table th');
    thElements.forEach(th => {
        th.style.background = primary;
    });
    
    // تطبيق الألوان على الإجمالي
    const totalEl = document.getElementById('sirkatTotalHours');
    if (totalEl) {
        totalEl.style.color = primary;
    }
}

// ====== الاستماع لتغييرات الألوان ======
window.addEventListener('storage', function(e) {
    if (e.key === 'primaryColor' || e.key === 'goldColor' || e.key === 'bgColor' || e.key === 'textColor') {
        applySirkatColors();
    }
});

// ====== التهيئة عند تحميل الصفحة ======
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSirkat, 100);
});