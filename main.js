// js/main.js - الكود الأساسي المشترك

// ====== التوست ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        // إنشاء التوست إذا لم يكن موجوداً
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = 'toast';
        newToast.innerHTML = `<i class="fas fa-check-circle"></i> <span id="toastMessage">${message}</span>`;
        document.body.appendChild(newToast);
        setTimeout(() => {
            newToast.className = 'toast show' + (type === 'error' ? ' error' : '');
            clearTimeout(newToast._timeout);
            newToast._timeout = setTimeout(() => { newToast.className = 'toast'; }, 3000);
        }, 100);
        return;
    }
    
    const toastMsg = document.getElementById('toastMessage');
    if (toastMsg) toastMsg.textContent = message;
    toast.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ====== الوضع الليلي/النهاري ======
function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('themeModeV2', isDark ? 'dark' : 'light');
    
    // تحديث أيقونة الوضع في كل الصفحات
    document.querySelectorAll('.mode-toggle').forEach(btn => {
        btn.innerHTML = isDark ? 
            '<i class="fas fa-sun"></i> فاتح' : 
            '<i class="fas fa-moon"></i> غامق';
    });
}

function loadMode() {
    const mode = localStorage.getItem('themeModeV2');
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// ====== تحميل الألوان ======
function loadColors() {
    const primary = localStorage.getItem('primaryColor');
    const gold = localStorage.getItem('goldColor');
    const bg = localStorage.getItem('bgColor');
    const text = localStorage.getItem('textColor');
    const icon = localStorage.getItem('iconColorPicker');
    
    if (primary) {
        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-light', primary + '20');
        document.documentElement.style.setProperty('--primary-dark', primary);
    }
    if (gold) {
        document.documentElement.style.setProperty('--gold', gold);
        document.documentElement.style.setProperty('--gold-light', gold + '30');
    }
    if (bg) {
        document.documentElement.style.setProperty('--body-bg', bg);
    }
    if (text) {
        document.documentElement.style.setProperty('--text', text);
    }
    if (icon) {
        document.documentElement.style.setProperty('--icon-color', icon);
    }
}

// ====== تحميل الهيدر والفوتر ======
function loadHeaderFooter() {
    // تحميل الهيدر
    const headerPlaceholder = document.getElementById('header');
    if (headerPlaceholder) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const isDark = document.body.classList.contains('dark-mode');
        
        headerPlaceholder.innerHTML = `
            <div class="header-logo">
                <img id="headerLogo" src="" alt="الشعار" style="display:none;" />
                <h1><i class="fas fa-crown" style="color:var(--gold);"></i> عروض المعدات</h1>
            </div>
            <nav class="header-nav">
                <a href="index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>
                    <i class="fas fa-home"></i> الرئيسية
                </a>
                <a href="quotation.html" ${currentPage === 'quotation.html' ? 'class="active"' : ''}>
                    <i class="fas fa-file-invoice"></i> العرض
                </a>
                <a href="company.html" ${currentPage === 'company.html' ? 'class="active"' : ''}>
                    <i class="fas fa-building"></i> الشركة
                </a>
                <a href="reports.html" ${currentPage === 'reports.html' ? 'class="active"' : ''}>
                    <i class="fas fa-chart-bar"></i> التقارير
                </a>
                <a href="design.html" ${currentPage === 'design.html' ? 'class="active"' : ''}>
                    <i class="fas fa-palette"></i> التصميم
                </a>
                <button class="btn mode-toggle" onclick="toggleMode()">
                    <i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i> 
                    ${isDark ? 'فاتح' : 'غامق'}
                </button>
            </nav>
        `;
        
        // تحميل الشعار
        const logo = localStorage.getItem('companyLogo');
        if (logo && logo.startsWith('data:image')) {
            const img = document.getElementById('headerLogo');
            img.src = logo;
            img.style.display = 'block';
        }
    }
    
    // تحميل الفوتر
    const footerPlaceholder = document.getElementById('footer');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = `
            <p>© 2026 نظام عروض أسعار المعدات | جميع الحقوق محفوظة</p>
        `;
    }
}

// ====== التهيئة العامة ======
function initApp() {
    loadMode();
    loadColors();
    loadHeaderFooter();
}

// تشغيل التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);