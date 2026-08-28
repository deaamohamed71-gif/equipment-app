// ====== تصدير PDF (عالي الدقة بدون بكسلة وفي صفحة واحدة) ======
function saveSirkatPDF() {
    saveSirkatData();
    showToast('📄 جاري تجهيز ملف PDF عالي الدقة...', 'success');
    
    // إخفاء عناصر التحكم مؤقتاً
    const controls = document.querySelector('.sirkat-controls');
    const backBtn = document.querySelector('.sirkat-back');
    
    if (controls) controls.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    
    // جلب الألوان
    const primaryColor = localStorage.getItem('primaryColor') || '#1a6b8a';
    const goldColor = localStorage.getItem('goldColor') || '#c9a84c';
    const bgColor = localStorage.getItem('bgColor') || '#f0f4f8';
    const textColor = localStorage.getItem('textColor') || '#1a2a3a';
    
    // استبدال أنماط الطباعة بستايل فائق النعومة والوضوح
    const style = document.createElement('style');
    style.id = 'pdf-print-style';
    style.textContent = `
        @page {
            size: A4 portrait;
            margin: 0;
        }
        * {
            box-sizing: border-box !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
        }
        body {
            font-family: 'Cairo', sans-serif !important;
            background: #fff !important;
            color: ${textColor} !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        #sirkatContainer {
            width: 794px !important; /* العرض الطبيعي الدقيق لصفحة A4 بـ 96DPI */
            height: 1120px !important; /* الارتفاع المثالي لصفحة واحدة */
            padding: 15px 20px !important;
            margin: 0 auto !important;
            background: #fff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-shadow: none !important;
        }
        
        /* الهيدر */
        .sirkat-header {
            background: ${primaryColor} !important;
            color: #fff !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            margin-bottom: 8px !important;
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
            gap: 8px !important;
        }
        .sirkat-logo img {
            max-height: 32px !important;
            border-radius: 4px !important;
            background: #fff !important;
            padding: 2px !important;
        }
        .sirkat-logo h1 {
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #fff !important;
            margin: 0 !important;
        }
        .sirkat-date {
            font-size: 11px !important;
            background: rgba(255,255,255,0.2) !important;
            padding: 2px 8px !important;
            border-radius: 4px !important;
            color: #fff !important;
        }
        .sirkat-header-bottom {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-top: 4px !important;
            padding-top: 4px !important;
            border-top: 1px solid rgba(255,255,255,0.2) !important;
        }
        .sirkat-header-bottom h2 {
            font-size: 12px !important;
            color: #fff !important;
            margin: 0 !important;
        }
        .sirkat-header-bottom p {
            font-size: 10px !important;
            color: rgba(255,255,255,0.9) !important;
            margin: 0 !important;
        }
        
        /* الجدول الرئيسي */
        .sirkat-table-wrap {
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            overflow: hidden !important;
            flex-grow: 1 !important;
        }
        .sirkat-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
        }
        
        /* ضبط عناوين الجدول وحمايتها من البكسلة */
        .sirkat-table th {
            background: ${primaryColor} !important;
            color: #fff !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            padding: 5px 2px !important;
            text-align: center !important;
            border: 1px solid ${primaryColor} !important;
            line-height: 1.2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        /* صفوف الجدول */
        .sirkat-table td {
            font-size: 9.5px !important;
            padding: 1px 2px !important;
            height: 22px !important;
            border-bottom: 1px solid #e5e7eb !important;
            border-left: 1px solid #f3f4f6 !important;
            border-right: 1px solid #f3f4f6 !important;
            text-align: center !important;
            vertical-align: middle !important;
            color: ${textColor} !important;
        }
        .sirkat-table tr:nth-child(even) td {
            background-color: ${bgColor} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sirkat-table td input {
            font-size: 9.5px !important;
            border: none !important;
            background: transparent !important;
            color: ${textColor} !important;
            text-align: center !important;
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .sirkat-table td input::placeholder {
            color: transparent !important;
        }
        .sirkat-table td .total-hours {
            font-weight: 700 !important;
            color: ${primaryColor} !important;
        }
        .sirkat-table tfoot td {
            font-size: 10px !important;
            font-weight: 700 !important;
            padding: 4px 2px !important;
            background: #f9fafb !important;
            border-top: 2px solid ${primaryColor} !important;
        }
        
        /* منطقة الفوتر والمشرف */
        .sirkat-supervisor {
            margin-top: 6px !important;
            padding: 4px 0 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }
        .sirkat-supervisor label {
            font-size: 10.5px !important;
            font-weight: 600 !important;
            color: ${textColor} !important;
        }
        .sirkat-supervisor input {
            font-size: 10.5px !important;
            border: none !important;
            border-bottom: 1px solid ${primaryColor} !important;
            background: transparent !important;
            color: ${textColor} !important;
            width: 200px !important;
            padding: 2px 4px !important;
        }
    `;
    document.head.appendChild(style);
    
    const element = document.getElementById('sirkatContainer');
    
    const opt = {
        margin:       0,
        filename:     `سركات_${monthNames[currentMonth]}_${currentYear}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { 
            scale: 4, // رفع المقياس إلى 4x للحد من البكسلة وزيادة حدة النصوص
            useCORS: true,
            logging: false,
            letterRendering: true,
            windowWidth: 794
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
        showToast('✅ تم تصدير PDF بنجاح بدقة عالية', 'success');
    }).catch(err => {
        console.error('PDF Error:', err);
        if (controls) controls.style.display = '';
        if (backBtn) backBtn.style.display = '';
        document.getElementById('pdf-print-style')?.remove();
        showToast('❌ حدث خطأ أثناء تصدير PDF', 'error');
    });
}