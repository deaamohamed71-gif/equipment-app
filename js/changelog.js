// js/changelog.js - كود صفحة سجل التحديثات (ديناميكي)

const DEFAULT_UPDATES = [
    {
        id: 1,
        version: "v1.1.0",
        date: "28 أغسطس 2026",
        status: "🆕 جديد",
        isNew: true,
        features: [
            "✨ إضافة صفحة المطور (لوحة تحكم متقدمة)",
            "🔒 حماية صفحة المطور بتسجيل الدخول عبر Firebase",
            "📢 إضافة صفحة سجل التحديثات الديناميكية",
            "📱 تحسينات كبيرة في تجربة الموبايل",
            "📋 إضافة نظام سركات (المطبوعات الاحترافية)"
        ],
        improvements: [
            "⚡ تحسين أداء التطبيق",
            "🎨 تحسين واجهة المستخدم",
            "🌙 تحسين الوضع الليلي"
        ],
        fixes: [
            "🔧 إصلاح مشكلة عرض الجدول في PDF",
            "🔧 إصلاح مشكلة الفوتر في الموبايل",
            "🔧 إصلاح مشكلة Service Worker"
        ]
    },
    {
        id: 2,
        version: "v1.0.0",
        date: "25 أغسطس 2026",
        status: "🚀 الإطلاق الأول",
        isNew: false,
        features: [
            "🏗️ نظام إدارة عروض أسعار المعدات",
            "📄 إنشاء وتحرير العروض",
            "👥 إدارة العملاء",
            "📊 التقارير والإحصائيات",
            "🎨 تخصيص التصميم",
            "🔑 نظام الترخيص (مجاني/مدفوع)",
            "📱 متوافق مع الموبايل"
        ],
        improvements: [],
        fixes: []
    }
];

function initChangelog() {
    let updates = localStorage.getItem('changelog_updates');
    
    if (!updates) {
        localStorage.setItem('changelog_updates', JSON.stringify(DEFAULT_UPDATES));
        localStorage.setItem('changelog_last_seen', new Date().toISOString());
    }
    
    renderChangelog();
    checkForNewUpdates();
}

function renderChangelog() {
    const container = document.getElementById('changelogList');
    const updates = JSON.parse(localStorage.getItem('changelog_updates') || '[]');
    
    if (updates.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;color:var(--text-light);padding:3rem;">
                <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>
                لا توجد تحديثات حتى الآن
            </div>
        `;
        return;
    }
    
    container.innerHTML = updates.map(update => `
        <div class="changelog-item ${update.isNew ? 'new' : ''}" data-id="${update.id}">
            <div class="changelog-version">
                <span class="version-badge">${update.version}</span>
                <span class="version-date">${update.date}</span>
                <span class="version-status">${update.status}</span>
                ${update.isNew ? '<span class="version-new-badge">🆕 جديد</span>' : ''}
            </div>
            <div class="changelog-content">
                ${update.features && update.features.length ? `
                    <h3>📋 الإضافات الجديدة</h3>
                    <ul>${update.features.map(f => `<li>${f}</li>`).join('')}</ul>
                ` : ''}
                ${update.improvements && update.improvements.length ? `
                    <h3>🔧 التحسينات</h3>
                    <ul>${update.improvements.map(f => `<li>${f}</li>`).join('')}</ul>
                ` : ''}
                ${update.fixes && update.fixes.length ? `
                    <h3>🐛 إصلاحات</h3>
                    <ul>${update.fixes.map(f => `<li>${f}</li>`).join('')}</ul>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function checkForNewUpdates() {
    const updates = JSON.parse(localStorage.getItem('changelog_updates') || '[]');
    const lastSeen = localStorage.getItem('changelog_last_seen');
    
    if (!lastSeen) return;
    
    const lastSeenDate = new Date(lastSeen);
    const hasNew = updates.some(update => {
        const updateDate = new Date(update.date);
        return updateDate > lastSeenDate && update.isNew;
    });
    
    const badge = document.getElementById('newUpdateBadge');
    if (badge) {
        badge.style.display = hasNew ? 'inline-block' : 'none';
    }
}

function addChangelogUpdate(version, date, features, improvements, fixes) {
    const updates = JSON.parse(localStorage.getItem('changelog_updates') || '[]');
    
    const maxId = updates.reduce((max, u) => Math.max(max, u.id || 0), 0);
    
    const newUpdate = {
        id: maxId + 1,
        version: version.startsWith('v') ? version : 'v' + version,
        date: date,
        status: '🆕 جديد',
        isNew: true,
        features: features ? features.split('|').map(s => s.trim()).filter(s => s) : [],
        improvements: improvements ? improvements.split('|').map(s => s.trim()).filter(s => s) : [],
        fixes: fixes ? fixes.split('|').map(s => s.trim()).filter(s => s) : []
    };
    
    updates.unshift(newUpdate);
    
    updates.forEach((u, index) => {
        if (index > 0) {
            u.isNew = false;
            u.status = u.status.replace('🆕 جديد', '📌 سابق');
        }
    });
    
    localStorage.setItem('changelog_updates', JSON.stringify(updates));
    localStorage.setItem('changelog_last_seen', new Date().toISOString());
    
    renderChangelog();
    checkForNewUpdates();
    
    return newUpdate;
}

function addChangelogUpdateFromUI() {
    const version = prompt('📝 رقم الإصدار (مثال: 1.2.0):');
    if (!version) return;
    
    const date = prompt('📅 التاريخ (مثال: 29 أغسطس 2026):');
    if (!date) return;
    
    const features = prompt('✨ الميزات الجديدة (افصل بينها بـ | ):');
    const improvements = prompt('🔧 التحسينات (افصل بينها بـ | ):');
    const fixes = prompt('🐛 الإصلاحات (افصل بينها بـ | ):');
    
    const result = addChangelogUpdate(version, date, features || '', improvements || '', fixes || '');
    
    if (result) {
        showToast('✅ تم إضافة التحديث بنجاح!', 'success');
    }
}

window.addChangelogUpdateFromUI = addChangelogUpdateFromUI;
window.addChangelogUpdate = addChangelogUpdate;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initChangelog, 100);
    console.log('📢 صفحة سجل التحديثات - تم تهيئتها بنجاح');
});
