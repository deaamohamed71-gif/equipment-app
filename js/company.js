// js/company.js - كود صفحة الشركة مع نظام الترخيص

const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024;

// ====== تهيئة الترخيص ======
function initCompanyLicense() {
    licenseManager.initialize();
    const features = licenseManager.getFeatures();
    
    if (!features.canSignatures) {
        const signatureSection = document.querySelector('.signature-area');
        if (signatureSection) {
            signatureSection.style.display = 'none';
            const container = document.querySelector('.section-card:last-child');
            if (container) {
                const message = document.createElement('div');
                message.style.cssText = `
                    text-align: center;
                    padding: 2rem;
                    background: rgba(201, 168, 76, 0.05);
                    border-radius: 16px;
                    border: 2px dashed var(--gold);
                `;
                message.innerHTML = `
                    <i class="fas fa-lock" style="font-size: 2rem; color: var(--gold);"></i>
                    <h3 style="color: var(--text); font-family: 'Cairo', sans-serif;">🔒 التوقيع الإلكتروني متاح فقط في النسخة المدفوعة</h3>
                    <p style="color: var(--text-light);">قم بترقية حسابك للاستفادة من هذه الميزة</p>
                    <button class="btn btn-gold" onclick="window.location.href='activation.html'" style="margin-top: 0.5rem;">
                        <i class="fas fa-rocket"></i> ترقية الآن
                    </button>
                `;
                container.appendChild(message);
            }
        }
    }
}

// ====== الشعار ======
function uploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        showToast('⚠️ يسمح فقط بملفات PNG و JPG', 'error');
        event.target.value = '';
        return;
    }
    
    if (file.size > MAX_SIGNATURE_SIZE) {
        showToast('⚠️ حجم الصورة كبير جداً (الحد الأقصى 2 ميجابايت)', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
            const MAX_SIZE = 200;
            let width = img.width, height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedData = canvas.toDataURL('image/jpeg', 0.7);
            
            const preview = document.getElementById('logoPreview');
            const placeholder = document.getElementById('logoPlaceholder');
            if (preview) {
                preview.src = compressedData;
                preview.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            localStorage.setItem('companyLogo', compressedData);
            showToast('✅ تم رفع الشعار', 'success');
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    const preview = document.getElementById('logoPreview');
    const placeholder = document.getElementById('logoPlaceholder');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'flex';
    localStorage.removeItem('companyLogo');
    document.getElementById('logoUpload').value = '';
    showToast('✅ تم حذف الشعار', 'success');
}

// ====== بيانات الشركة ======
function loadCompanyData() {
    ['companyName','companyPhone','companyAddress','companyCommercial','companyTax','projectName'].forEach(id => {
        const val = localStorage.getItem('field_' + id);
        const el = document.getElementById(id);
        if (val !== null && el) el.value = val;
    });
    
    const logo = localStorage.getItem('companyLogo');
    const preview = document.getElementById('logoPreview');
    const placeholder = document.getElementById('logoPlaceholder');
    if (logo && logo.startsWith('data:image')) {
        if (preview) { preview.src = logo; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
    }
}

function saveCompanyData() {
    ['companyName','companyPhone','companyAddress','companyCommercial','companyTax','projectName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem('field_' + id, el.value);
    });
    showToast('✅ تم حفظ بيانات الشركة', 'success');
}

function autoSaveCompany() {
    ['companyName','companyPhone','companyAddress','companyCommercial','companyTax','projectName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem('field_' + id, el.value);
    });
}

// ====== التوقيع الإلكتروني (مدفوع) ======
function uploadSignature(type, input) {
    const features = licenseManager.getFeatures();
    if (!features.canSignatures) {
        showToast('⚠️ التوقيع الإلكتروني متاح فقط في النسخة المدفوعة', 'error');
        licenseManager.showActivationPrompt();
        input.value = '';
        return;
    }
    
    const file = input.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        showToast('⚠️ يسمح فقط بملفات PNG و JPG', 'error');
        input.value = '';
        return;
    }
    
    if (file.size > MAX_SIGNATURE_SIZE) {
        showToast('⚠️ حجم الصورة كبير جداً (الحد الأقصى 2 ميجابايت)', 'error');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        const imgId = (type === 'sigEmployee') ? 'sigEmployeeImg' : 'sigClientImg';
        const placeholderId = (type === 'sigEmployee') ? 'sigEmployeePlaceholder' : 'sigClientPlaceholder';
        const img = document.getElementById(imgId);
        const placeholder = document.getElementById(placeholderId);
        
        if (img) { img.src = dataUrl; img.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        
        localStorage.setItem('sig_' + type, dataUrl);
        showToast('✅ تم رفع التوقيع', 'success');
    };
    reader.readAsDataURL(file);
}

function clearSignature(type) {
    const imgId = (type === 'sigEmployee') ? 'sigEmployeeImg' : 'sigClientImg';
    const placeholderId = (type === 'sigEmployee') ? 'sigEmployeePlaceholder' : 'sigClientPlaceholder';
    const uploadId = (type === 'sigEmployee') ? 'sigEmployeeUpload' : 'sigClientUpload';
    
    const img = document.getElementById(imgId);
    const placeholder = document.getElementById(placeholderId);
    const upload = document.getElementById(uploadId);
    
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'flex';
    if (upload) upload.value = '';
    
    localStorage.removeItem('sig_' + type);
    showToast('✅ تم مسح التوقيع', 'success');
}

function restoreSignatures() {
    const features = licenseManager.getFeatures();
    if (!features.canSignatures) return;
    
    ['sigEmployee', 'sigClient'].forEach(type => {
        const saved = localStorage.getItem('sig_' + type);
        if (saved && saved.startsWith('data:image')) {
            const imgId = (type === 'sigEmployee') ? 'sigEmployeeImg' : 'sigClientImg';
            const placeholderId = (type === 'sigEmployee') ? 'sigEmployeePlaceholder' : 'sigClientPlaceholder';
            const img = document.getElementById(imgId);
            const placeholder = document.getElementById(placeholderId);
            
            if (img) { img.src = saved; img.style.display = 'block'; }
            if (placeholder) placeholder.style.display = 'none';
        }
    });
}

// ====== التهيئة ======
document.addEventListener('DOMContentLoaded', function() {
    licenseManager.initialize();
    
    setTimeout(function() {
        initCompanyLicense();
        loadCompanyData();
        restoreSignatures();
    }, 100);
});