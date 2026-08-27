// js/design.js - كود صفحة التصميم

// ====== الألوان ======
function changeColor(color) {
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-light', color + '20');
    document.documentElement.style.setProperty('--primary-dark', color);
    localStorage.setItem('primaryColor', color);
    document.getElementById('primaryColorText').value = color;
}

function changeGold(color) {
    document.documentElement.style.setProperty('--gold', color);
    document.documentElement.style.setProperty('--gold-light', color + '30');
    localStorage.setItem('goldColor', color);
    document.getElementById('goldColorText').value = color;
}

function changeBgColor(color) {
    document.documentElement.style.setProperty('--body-bg', color);
    localStorage.setItem('bgColor', color);
    if (!document.body.classList.contains('dark-mode')) {
        document.body.style.background = color;
    }
    document.getElementById('bgColorText').value = color;
}

function changeTextColor(color) {
    document.documentElement.style.setProperty('--text', color);
    localStorage.setItem('textColor', color);
    document.getElementById('textColorText').value = color;
}

function changeIconColor(color) {
    document.documentElement.style.setProperty('--icon-color', color);
    localStorage.setItem('iconColorPicker', color);
    document.getElementById('iconColorText').value = color;
}

function resetDesignColors() {
    const defaultColors = {
        primary: '#1a6b8a',
        gold: '#c9a84c',
        bg: '#f0f4f8',
        text: '#1a2a3a',
        icon: '#888888'
    };
    
    document.getElementById('primaryColor').value = defaultColors.primary;
    document.getElementById('goldColor').value = defaultColors.gold;
    document.getElementById('bgColor').value = defaultColors.bg;
    document.getElementById('textColor').value = defaultColors.text;
    document.getElementById('iconColor').value = defaultColors.icon;
    
    changeColor(defaultColors.primary);
    changeGold(defaultColors.gold);
    changeBgColor(defaultColors.bg);
    changeTextColor(defaultColors.text);
    changeIconColor(defaultColors.icon);
    
    showToast('✅ تم إعادة تعيين الألوان', 'success');
}

// ====== تحميل الألوان في صفحة التصميم ======
function loadDesignColors() {
    const primary = localStorage.getItem('primaryColor');
    const gold = localStorage.getItem('goldColor');
    const bg = localStorage.getItem('bgColor');
    const text = localStorage.getItem('textColor');
    const icon = localStorage.getItem('iconColorPicker');
    
    if (primary) {
        document.getElementById('primaryColor').value = primary;
        document.getElementById('primaryColorText').value = primary;
        changeColor(primary);
    }
    if (gold) {
        document.getElementById('goldColor').value = gold;
        document.getElementById('goldColorText').value = gold;
        changeGold(gold);
    }
    if (bg) {
        document.getElementById('bgColor').value = bg;
        document.getElementById('bgColorText').value = bg;
        changeBgColor(bg);
    }
    if (text) {
        document.getElementById('textColor').value = text;
        document.getElementById('textColorText').value = text;
        changeTextColor(text);
    }
    if (icon) {
        document.getElementById('iconColor').value = icon;
        document.getElementById('iconColorText').value = icon;
        changeIconColor(icon);
    }
}

// ====== الخطوط ======
function changeFont(font) {
    document.documentElement.style.setProperty('--font-family', font);
    document.querySelectorAll('*').forEach(el => {
        el.style.fontFamily = `${font}, 'Cairo', sans-serif`;
    });
    localStorage.setItem('mainFont', font);
    showToast('✅ تم تغيير الخط', 'success');
}

function changeFontSize(size) {
    document.documentElement.style.setProperty('--font-size', size + 'px');
    document.getElementById('fontSizeDisplay').textContent = size + 'px';
    localStorage.setItem('fontSize', size);
}

function loadFontSettings() {
    const font = localStorage.getItem('mainFont');
    const size = localStorage.getItem('fontSize');
    
    if (font) {
        document.getElementById('mainFont').value = font;
        changeFont(font);
    }
    if (size) {
        document.getElementById('fontSize').value = size;
        document.getElementById('fontSizeDisplay').textContent = size + 'px';
        changeFontSize(size);
    }
}

// ====== الأيقونات ======
function selectIcon(icon) {
    document.querySelectorAll('.icon-item').forEach(el => el.classList.remove('selected'));
    const item = document.querySelector(`.icon-item input[value="${icon}"]`);
    if (item) {
        item.checked = true;
        item.closest('.icon-item').classList.add('selected');
    }
    localStorage.setItem('selectedIcon', icon);
}

function applyIconToSelected() {
    const icon = document.querySelector('input[name="iconSelect"]:checked')?.value;
    if (!icon) { showToast('⚠️ الرجاء اختيار أيقونة', 'error'); return; }
    
    // نحتاج إلى تمرير الأيقونة إلى صفحة العرض
    localStorage.setItem('selectedIcon', icon);
    showToast('✅ تم حفظ الأيقونة المختارة', 'success');
}

function applyIconToAll() {
    const icon = document.querySelector('input[name="iconSelect"]:checked')?.value;
    if (!icon) { showToast('⚠️ الرجاء اختيار أيقونة', 'error'); return; }
    
    localStorage.setItem('defaultIcon', icon);
    showToast('✅ تم تعيين الأيقونة الافتراضية للجميع', 'success');
}

function loadIconSettings() {
    const icon = localStorage.getItem('selectedIcon');
    if (icon) {
        const item = document.querySelector(`.icon-item input[value="${icon}"]`);
        if (item) {
            item.checked = true;
            item.closest('.icon-item').classList.add('selected');
        }
    }
}

// ====== المظهر ======
function setTheme(theme) {
    document.querySelectorAll('.theme-item').forEach(el => el.classList.remove('selected'));
    const item = document.querySelector(`.theme-item[onclick*="${theme}"]`);
    if (item) item.classList.add('selected');
    
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        localStorage.setItem('themeModeV2', 'dark');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('themeModeV2', 'light');
    } else {
        // Auto - بناءً على تفضيلات النظام
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('themeModeV2', 'auto');
    }
    showToast(`✅ تم تغيير المظهر إلى ${theme === 'dark' ? 'غامق' : theme === 'light' ? 'فاتح' : 'تلقائي'}`, 'success');
}

function loadThemeSettings() {
    const theme = localStorage.getItem('themeModeV2');
    if (theme === 'dark') {
        document.querySelector('.theme-item[onclick*="dark"]')?.classList.add('selected');
    } else if (theme === 'light') {
        document.querySelector('.theme-item[onclick*="light"]')?.classList.add('selected');
    } else {
        document.querySelector('.theme-item[onclick*="auto"]')?.classList.add('selected');
    }
}

// ====== التهيئة ======
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        loadDesignColors();
        loadFontSettings();
        loadIconSettings();
        loadThemeSettings();
    }, 100);
});