// ====== تصدير PDF مضبوط بدقة الريفرنس على صفحة A4 واحدة ======
function saveSirkatPDF() {
    saveSirkatData();
    showToast('📄 جاري تجهيز ملف PDF...', 'success');
    
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
            height: 296mm !important; /* ارتفاع A4 كاملاً */
            padding: 8mm 10mm !important;
            margin: 0 auto !important;
            background: #fff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
        }
        
        /* الهيدر العلوي */
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
        
        /* الجدول الرئيسي */
        .sirkat-table-wrap {
            border: 1px solid #333 !important;
            border-radius: 1mm !important;
            overflow: hidden !important;
            height: 250mm !important; /* ارتفاع مخصص ليحتوي الـ 31 صف بالملم */
            display: flex !important;
            flex-direction: column !important;
        }
        .sirkat-table {
            width: 100% !important;
            height: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
        }
        
        /* العناوين th */
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
        
        /* الخلايا td */
        .sirkat-table td {
            font-size: 7.5pt !important;
            height: 7.2mm !important; /* ارتفاع حسابي دقيق يضمن تكييف 31 صف داخل الـ 250mm */
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
        
        /* الفوتر السفلي */
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
    
    html2pdf().set(opt).from(element).save().then(() => {
        if (controls) controls.style.display = '';
        if (backBtn) backBtn.style.display = '';
        document.getElementById('pdf-print-style')?.remove();
        showToast('✅ تم تصدير PDF بنجاح في صفحة واحدة', 'success');
    }).catch(err => {
        console.error('PDF Error:', err);
        if (controls) controls.style.display = '';
        if (backBtn) backBtn.style.display = '';
        document.getElementById('pdf-print-style')?.remove();
        showToast('❌ حدث خطأ أثناء تصدير PDF', 'error');
    });
}