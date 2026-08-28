// js/changelog.js - كود صفحة سجل التحديثات

document.addEventListener('DOMContentLoaded', function() {
    console.log('📢 صفحة سجل التحديثات - مرحباً بك!');
    
    // تأثير عند التمرير على العناصر
    const items = document.querySelectorAll('.changelog-item');
    items.forEach((item, index) => {
        item.style.animationDelay = (index * 0.1) + 's';
        item.classList.add('fade-in');
    });
});