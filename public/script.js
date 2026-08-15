// ============================================
// PERSIAN NUMBER HELPERS - اصلاح شده
// ============================================
function persianToEnglishNumber(str) {
    if (!str) return '';
    const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
    return str.replace(/[\u06F0-\u06F9]/g, m => map[m]);
}

function toPersianNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '';
    const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/\d/g, m => digits[parseInt(m)]);
}

function formatNumberWithCommas(num) {
    if (num === undefined || num === null || isNaN(num)) return '';
    const number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number) || !isFinite(number)) return '';
    const parts = number.toLocaleString('en-US').split('.');
    return parts[0];
}

function formatPrice(num) {
    if (!num && num !== 0) return '۰';
    const number = Number(num);
    if (isNaN(number)) return '۰';
    const formatted = formatNumberWithCommas(number);
    return toPersianNumber(formatted);
}

// ============================================
// NUMBER INPUT - راه‌حل قطعی برای اعداد بالای ۳ رقم
// ============================================
function setupNumberInput(input) {
    if (!input) return;

    input.addEventListener('input', function(e) {
        let value = this.value;
        value = persianToEnglishNumber(value);
        value = value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        this.value = value;
    });

    input.addEventListener('blur', function(e) {
        let value = this.value;
        value = persianToEnglishNumber(value);
        value = value.replace(/[^0-9.]/g, '');
        if (value && value !== '.' && value !== '') {
            const number = parseFloat(value);
            if (!isNaN(number) && isFinite(number) && number > 0) {
                const formatted = formatNumberWithCommas(number);
                this.value = toPersianNumber(formatted);
            } else {
                this.value = '';
            }
        } else {
            this.value = '';
        }
    });

    input.addEventListener('focus', function(e) {
        let value = this.value;
        value = persianToEnglishNumber(value);
        value = value.replace(/[^0-9.]/g, '');
        if (value && value !== '.' && value !== '') {
            this.value = value;
        }
    });
}

function getRawNumberFromInput(input) {
    if (!input) return 0;
    let value = input.value;
    value = persianToEnglishNumber(value);
    value = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
}

function setupAllNumberInputs() {
    document.querySelectorAll('.number-input').forEach(input => {
        setupNumberInput(input);
    });
    const specificInputs = ['propSalePrice', 'propRentPrice', 'propMonthlyPrice', 'commissionRentPage', 'commissionMonthlyPage'];
    specificInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.classList.contains('number-input')) {
            input.classList.add('number-input');
            setupNumberInput(input);
        }
    });
}

// ============================================
// API FUNCTIONS
// ============================================
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        return response.json();
    } catch { return []; }
}

async function getProperties() {
    try { return await apiCall('/api/properties', { method: 'GET' }) || []; }
    catch { return []; }
}

async function getAdvisors() {
    try { return await apiCall('/api/advisors', { method: 'GET' }) || []; }
    catch { return []; }
}

async function getNotes() {
    try { return await apiCall('/api/notes', { method: 'GET' }) || []; }
    catch { return []; }
}

async function getContacts() {
    try { return await apiCall('/api/contacts', { method: 'GET' }) || []; }
    catch { return []; }
}

async function getRequests() {
    try { return await apiCall('/api/requests', { method: 'GET' }) || []; }
    catch { return []; }
}

// ============================================
// UPLOAD IMAGE
// ============================================
async function uploadImage(file, folder = 'properties') {
    if (!file) return null;
    if (typeof file === 'string' && file.startsWith('http')) return file;
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'خطا در آپلود');
        return result.url;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// ============================================
// RENDER PROPERTIES - اصلاح شده برای نمایش صحیح
// ============================================
let currentFilter = 'all';
let visibleCount = 6;
let allProperties = [];

async function renderProperties(filter = 'all') {
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;

    allProperties = await getProperties();
    let props = allProperties;

    if (filter === 'فروش') props = props.filter(p => p.type === 'فروش');
    else if (filter === 'پیش‌فروش') props = props.filter(p => p.type === 'پیش‌فروش');
    else if (filter === 'اجاره') props = props.filter(p => p.type === 'اجاره');
    else if (filter === 'available') props = props.filter(p => p.status === 'موجود');
    else if (filter === 'sold') props = props.filter(p => p.status === 'فروش رفته');
    else if (filter === 'rented') props = props.filter(p => p.status === 'اجاره رفته');

    const total = props.length;
    const visible = props.slice(0, visibleCount);

    if (visible.length === 0) {
        grid.innerHTML = `<div class="empty-state">هیچ ملکی یافت نشد</div>`;
        document.getElementById('loadMore').style.display = 'none';
        return;
    }

    const advisors = await getAdvisors();

    grid.innerHTML = visible.map(p => {
        const advisor = advisors.find(a => a.id === p.advisorId) || null;
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        let imageHtml = '';
        const hasImage = p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== '';
        
        if (hasImage) {
            imageHtml = `<img src="${p.images[0]}" alt="${p.title || 'ملک'}" 
                onerror="this.parentElement.innerHTML='<div class=\\"img-placeholder\\"><i class=\\"fas fa-building\\"></i></div>'" />`;
        } else {
            imageHtml = `<div class="img-placeholder"><i class="fas fa-building"></i></div>`;
        }

        const statusClass = p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented';
        const statusLabel = p.status || 'موجود';
        const typeLabel = p.type || '';

        let priceDisplay = '';
        if (p.type === 'فروش' || p.type === 'پیش‌فروش') {
            const priceValue = p.price || 0;
            priceDisplay = priceValue > 0 ? `${formatPrice(priceValue)} تومان` : 'تماس بگیرید';
        } else if (p.type === 'اجاره') {
            const rentPrice = p.rentPrice || p.price || 0;
            const monthlyPrice = p.monthlyPrice || 0;
            if (rentPrice > 0 && monthlyPrice > 0) {
                priceDisplay = `رهن ${formatPrice(rentPrice)} | اجاره ${formatPrice(monthlyPrice)}`;
            } else if (rentPrice > 0) {
                priceDisplay = `رهن ${formatPrice(rentPrice)}`;
            } else if (monthlyPrice > 0) {
                priceDisplay = `اجاره ${formatPrice(monthlyPrice)}`;
            } else {
                priceDisplay = 'تماس بگیرید';
            }
        } else {
            const priceValue = p.price || 0;
            priceDisplay = priceValue > 0 ? `${formatPrice(priceValue)} تومان` : 'تماس بگیرید';
        }

        const meterage = p.meterage || '---';
        const rooms = p.rooms || '---';

        return `
            <div class="property-card" data-id="${p.id}">
                <div class="image-wrapper">
                    ${imageHtml}
                    <span class="badge badge-${statusClass}">${statusLabel}</span>
                    ${typeLabel ? `<span class="type-badge">${typeLabel}</span>` : ''}
                </div>
                <div class="content">
                    <h3>${p.title || 'بدون عنوان'}</h3>
                    <div class="address"><i class="fas fa-map-pin"></i> ${p.address || 'آدرس ثبت نشده'}</div>
                    <div class="price-row">
                        <span class="price-label">قیمت:</span>
                        <span>${priceDisplay}</span>
                    </div>
                    <div class="details-row">
                        <span><i class="fas fa-vector-square"></i> ${meterage} متر</span>
                        <span><i class="fas fa-bed"></i> ${rooms} خواب</span>
                    </div>
                    <div class="advisor-row">
                        <span><i class="fas fa-user-tie"></i> ${advisorName}</span>
                        ${advisorPhone ? `<a href="tel:${advisorPhone}" class="phone">${advisorPhone}</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('loadMore').style.display = visibleCount >= total ? 'none' : 'block';
}

function loadMore() { visibleCount += 6; renderProperties(currentFilter); }

async function searchProperties() {
    const query = document.getElementById('searchInput')?.value.trim().toLowerCase();
    if (!query) { 
        renderProperties(currentFilter); 
        return; 
    }
    
    const allProps = await getProperties();
    const props = allProps.filter(p =>
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.address && p.address.toLowerCase().includes(query)) ||
        (p.code && String(p.code).includes(query))
    );
    
    const grid = document.getElementById('propertyGrid');
    if (props.length === 0) {
        grid.innerHTML = `<div class="empty-state">نتیجه‌ای برای "${query}" یافت نشد</div>`;
        document.getElementById('loadMore').style.display = 'none';
        return;
    }
    
    const advisors = await getAdvisors();
    grid.innerHTML = props.map(p => {
        const advisor = advisors.find(a => a.id === p.advisorId) || null;
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        const hasImage = p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== '';
        let imageHtml = hasImage 
            ? `<img src="${p.images[0]}" alt="${p.title}" onerror="this.parentElement.innerHTML='<div class=\\"img-placeholder\\"><i class=\\"fas fa-building\\"></i></div>'" />`
            : `<div class="img-placeholder"><i class="fas fa-building"></i></div>`;

        const statusClass = p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented';
        const statusLabel = p.status || 'موجود';
        const typeLabel = p.type || '';

        let priceDisplay = '';
        if (p.type === 'فروش' || p.type === 'پیش‌فروش') {
            const priceValue = p.price || 0;
            priceDisplay = priceValue > 0 ? `${formatPrice(priceValue)} تومان` : 'تماس بگیرید';
        } else if (p.type === 'اجاره') {
            const rentPrice = p.rentPrice || p.price || 0;
            const monthlyPrice = p.monthlyPrice || 0;
            if (rentPrice > 0 && monthlyPrice > 0) {
                priceDisplay = `رهن ${formatPrice(rentPrice)} | اجاره ${formatPrice(monthlyPrice)}`;
            } else if (rentPrice > 0) {
                priceDisplay = `رهن ${formatPrice(rentPrice)}`;
            } else if (monthlyPrice > 0) {
                priceDisplay = `اجاره ${formatPrice(monthlyPrice)}`;
            } else {
                priceDisplay = 'تماس بگیرید';
            }
        } else {
            const priceValue = p.price || 0;
            priceDisplay = priceValue > 0 ? `${formatPrice(priceValue)} تومان` : 'تماس بگیرید';
        }

        const meterage = p.meterage || '---';
        const rooms = p.rooms || '---';

        return `
            <div class="property-card" data-id="${p.id}">
                <div class="image-wrapper">
                    ${imageHtml}
                    <span class="badge badge-${statusClass}">${statusLabel}</span>
                    ${typeLabel ? `<span class="type-badge">${typeLabel}</span>` : ''}
                </div>
                <div class="content">
                    <h3>${p.title || 'بدون عنوان'}</h3>
                    <div class="address"><i class="fas fa-map-pin"></i> ${p.address || 'آدرس ثبت نشده'}</div>
                    <div class="price-row">
                        <span class="price-label">قیمت:</span>
                        <span>${priceDisplay}</span>
                    </div>
                    <div class="details-row">
                        <span><i class="fas fa-vector-square"></i> ${meterage} متر</span>
                        <span><i class="fas fa-bed"></i> ${rooms} خواب</span>
                    </div>
                    <div class="advisor-row">
                        <span><i class="fas fa-user-tie"></i> ${advisorName}</span>
                        ${advisorPhone ? `<a href="tel:${advisorPhone}" class="phone">${advisorPhone}</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('loadMore').style.display = 'none';
}

// ============================================
// UPDATE STATS
// ============================================
async function updateStats() {
    const props = await getProperties();
    const total = props.length;
    const active = props.filter(p => p.status === 'موجود').length;
    const sold = props.filter(p => p.status === 'فروش رفته').length;

    const totalEl = document.getElementById('totalProperties');
    const activeEl = document.getElementById('activeProperties');
    const soldEl = document.getElementById('soldProperties');
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (soldEl) soldEl.textContent = sold;

    ['statTotal', 'statActive', 'statSold', 'statRented'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'statTotal') el.textContent = total;
        else if (id === 'statActive') el.textContent = active;
        else if (id === 'statSold') el.textContent = sold;
        else if (id === 'statRented') el.textContent = props.filter(p => p.status === 'اجاره رفته').length;
    });
}

// ============================================
// RENDER ADVISORS
// ============================================
async function renderAdvisors() {
    const grid = document.getElementById('advisorGrid');
    if (!grid) return;

    const advisors = await getAdvisors();
    const defaultAdvisors = [
        { name: 'محمد حسینی', specialty: 'کارشناس فروش' },
        { name: 'سارا محمدی', specialty: 'کارشناس اجاره' },
        { name: 'علی رضایی', specialty: 'کارشناس سرمایه‌گذاری' },
        { name: 'فاطمه احمدی', specialty: 'کارشناس املاک لوکس' },
    ];
    const list = advisors.length > 0 ? advisors : defaultAdvisors;

    grid.innerHTML = list.map(a => `
        <div class="advisor-card">
            <div class="advisor-avatar">${a.image ? `<img src="${a.image}" />` : `<i class="fas fa-user-tie"></i>`}</div>
            <h4>${a.name}</h4>
            <p>${a.specialty || 'مشاور املاک'}</p>
        </div>
    `).join('');

    const adminGrid = document.getElementById('advisorList');
    if (adminGrid) {
        const advs = await getAdvisors();
        if (advs.length === 0) {
            adminGrid.innerHTML = '<div class="empty-state">هیچ مشاوری ثبت نشده است</div>';
        } else {
            adminGrid.innerHTML = advs.map(a => `
                <div class="advisor-card">
                    <div class="advisor-avatar">${a.image ? `<img src="${a.image}" />` : `<i class="fas fa-user-tie"></i>`}</div>
                    <h4>${a.name}</h4>
                    <p>${a.specialty || 'مشاور املاک'}</p>
                    <span class="phone-display">${a.phone}</span>
                    <button onclick="deleteAdvisor('${a.id}')" class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `).join('');
        }
        populateAdvisorSelect();
    }

    const miniGrid = document.getElementById('adminAdvisorGrid');
    if (miniGrid) {
        const advs = await getAdvisors();
        miniGrid.innerHTML = advs.length === 0
            ? '<div class="empty-state">هیچ مشاوری ثبت نشده است</div>'
            : advs.map(a => `
                <div class="advisor-card mini" style="padding:6px 10px;">
                    <h4 style="font-size:11px;">${a.name}</h4>
                    <span style="font-size:9px;color:var(--green-primary);">${a.phone}</span>
                </div>
            `).join('');
    }
}

async function deleteAdvisor(id) {
    if (!confirm('آیا از حذف این مشاور مطمئن هستید؟')) return;
    await fetch('/api/advisors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    renderAdvisors();
    populateAdvisorSelect();
}

async function populateAdvisorSelect() {
    const select = document.getElementById('propAdvisor');
    if (!select) return;
    const advisors = await getAdvisors();
    select.innerHTML = '<option value="">انتخاب مشاور</option>' + advisors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// ============================================
// RENDER ADMIN PROPERTIES
// ============================================
async function renderAdminProperties() {
    const tbody = document.getElementById('propertyTableBody');
    if (!tbody) return;
    const props = await getProperties();
    if (props.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">هیچ ملکی وجود ندارد</td></tr>`;
        return;
    }
    const advisors = await getAdvisors();
    tbody.innerHTML = props.map(p => {
        const advisorName = advisors.find(a => a.id === p.advisorId)?.name || 'نامشخص';
        let priceDisplay = '';
        if (p.type === 'فروش' || p.type === 'پیش‌فروش') {
            priceDisplay = formatPrice(p.price);
        } else if (p.type === 'اجاره') {
            const rentPrice = p.rentPrice || p.price || 0;
            const monthlyPrice = p.monthlyPrice || 0;
            priceDisplay = `رهن ${formatPrice(rentPrice)} / اجاره ${formatPrice(monthlyPrice)}`;
        } else {
            priceDisplay = formatPrice(p.price);
        }
        return `
            <tr>
                <td>${p.images && p.images.length > 0 ? `<img src="${p.images[0]}" class="thumb">` : `<div class="thumb placeholder"><i class="fas fa-building"></i></div>`}</td>
                <td>${p.title}</td>
                <td>${p.type || 'نامشخص'}</td>
                <td>${priceDisplay}</td>
                <td>${advisorName}</td>
                <td><span class="status-badge ${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">${p.status || 'موجود'}</span></td>
                <td>
                    <button onclick="deleteProperty('${p.id}')" class="action-btn danger"><i class="fas fa-trash"></i></button>
                    <button onclick="togglePropertyStatus('${p.id}')" class="action-btn gold"><i class="fas fa-sync-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteProperty(id) {
    if (!confirm('آیا از حذف این ملک مطمئن هستید؟')) return;
    await fetch('/api/properties', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    renderProperties(currentFilter);
    renderAdminProperties();
    updateStats();
}

async function togglePropertyStatus(id) {
    const props = await getProperties();
    const idx = props.findIndex(p => p.id === id);
    if (idx !== -1) {
        const statuses = ['موجود', 'فروش رفته', 'اجاره رفته'];
        props[idx].status = statuses[(statuses.indexOf(props[idx].status) + 1) % statuses.length];
        await fetch('/api/properties', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(props[idx]) });
        renderProperties(currentFilter);
        renderAdminProperties();
        updateStats();
    }
}

// ============================================
// NOTES
// ============================================
async function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    if (!title || !content) {
        alert('⚠️ لطفاً عنوان و متن یادداشت را وارد کنید');
        document.getElementById('noteTitle').focus();
        return;
    }
    const now = new Date();
    const newNote = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        title, content,
        date: now.toLocaleDateString('fa-IR'),
        time: now.toLocaleTimeString('fa-IR'),
        author: 'مدیر'
    };
    try {
        await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNote) });
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        renderNotes();
        document.getElementById('noteTitle').focus();
    } catch (error) {
        alert('❌ خطا در ذخیره یادداشت: ' + error.message);
    }
}

async function renderNotes() {
    const container = document.getElementById('notesList');
    if (!container) return;
    try {
        const notes = await getNotes();
        if (notes.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-sticky-note"></i> هیچ یادداشتی وجود ندارد</div>`;
            return;
        }
        container.innerHTML = notes.slice().reverse().map(n => `
            <div class="note-item">
                <div class="note-header">
                    <h4>${escapeHtml(n.title)}</h4>
                    <button class="note-delete" onclick="deleteNote('${n.id}')" title="حذف یادداشت">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="note-content">${escapeHtml(n.content)}</div>
                <div class="note-meta">
                    <span><i class="fas fa-user"></i> ${escapeHtml(n.author || 'مدیر')}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${escapeHtml(n.date || '')}</span>
                    <span><i class="fas fa-clock"></i> ${escapeHtml(n.time || '')}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<div class="empty-state">خطا در بارگذاری یادداشت‌ها</div>`;
    }
}

async function deleteNote(id) {
    if (!confirm('آیا از حذف این یادداشت مطمئن هستید؟')) return;
    try {
        await fetch('/api/notes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        renderNotes();
    } catch (error) {
        alert('❌ خطا در حذف یادداشت: ' + error.message);
    }
}

// ============================================
// CONTACTS
// ============================================
async function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const advisorId = document.getElementById('contactAdvisor').value;
    const desc = document.getElementById('contactDesc').value.trim();
    if (!name || !phone) {
        alert('⚠️ لطفاً نام و شماره تماس را وارد کنید');
        document.getElementById('contactName').focus();
        return;
    }
    try {
        const advisors = await getAdvisors();
        const advisor = advisors.find(a => a.id === advisorId);
        const newContact = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name, phone, advisorId, advisorName: advisor ? advisor.name : '', desc: desc || '',
            date: new Date().toLocaleDateString('fa-IR'), addedBy: 'مدیر'
        };
        await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newContact) });
        document.getElementById('contactName').value = '';
        document.getElementById('contactPhone').value = '';
        document.getElementById('contactAdvisor').value = '';
        document.getElementById('contactDesc').value = '';
        renderContacts();
        document.getElementById('contactName').focus();
    } catch (error) {
        alert('❌ خطا در افزودن مخاطب: ' + error.message);
    }
}

async function renderContacts(filter = '') {
    const container = document.getElementById('contactsList');
    if (!container) return;
    try {
        let contacts = await getContacts();
        if (filter) {
            const search = filter.toLowerCase().trim();
            contacts = contacts.filter(c =>
                c.name.toLowerCase().includes(search) ||
                c.phone.includes(search) ||
                (c.advisorName && c.advisorName.toLowerCase().includes(search))
            );
        }
        if (contacts.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-address-book"></i> ${filter ? 'نتیجه‌ای برای جستجو یافت نشد' : 'هیچ مخاطبی وجود ندارد'}</div>`;
            return;
        }
        container.innerHTML = contacts.map(c => `
            <div class="contact-item">
                <div class="contact-info">
                    <span class="contact-name">${escapeHtml(c.name)}</span>
                    <span class="contact-phone">${escapeHtml(c.phone)}</span>
                    ${c.advisorName ? `<span class="contact-advisor"><i class="fas fa-user-tie"></i> ${escapeHtml(c.advisorName)}</span>` : ''}
                    ${c.desc ? `<span class="contact-desc">${escapeHtml(c.desc)}</span>` : ''}
                </div>
                <div class="contact-actions">
                    <button onclick="deleteContact('${c.id}')" title="حذف مخاطب">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<div class="empty-state">خطا در بارگذاری مخاطبین</div>`;
    }
}

function searchContacts() {
    const query = document.getElementById('contactSearch').value;
    renderContacts(query);
}

async function deleteContact(id) {
    if (!confirm('آیا از حذف این مخاطب مطمئن هستید؟')) return;
    try {
        await fetch('/api/contacts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        renderContacts();
    } catch (error) {
        alert('❌ خطا در حذف مخاطب: ' + error.message);
    }
}

// ============================================
// REQUESTS
// ============================================
async function renderRequests() {
    const container = document.getElementById('requestsTableBody');
    if (!container) return;
    const requests = await getRequests();
    if (requests.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="empty-state">هیچ درخواستی وجود ندارد</td></tr>`;
        return;
    }
    container.innerHTML = requests.slice().reverse().map(r => `
        <tr>
            <td>${r.date} ${r.time}</td>
            <td>${r.name}</td>
            <td>${r.phone}</td>
            <td>${r.type}</td>
            <td><span class="status-badge ${r.status === 'جدید' ? 'available' : 'sold'}">${r.status}</span></td>
            <td>
                <button onclick="updateRequestStatus('${r.id}','تماس گرفته شده')" class="action-btn gold"><i class="fas fa-phone"></i></button>
                <button onclick="deleteRequest('${r.id}')" class="action-btn danger"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    const countEl = document.getElementById('requestsCount');
    if (countEl) countEl.textContent = requests.filter(r => r.status === 'جدید').length;
}

async function updateRequestStatus(id, status) {
    await fetch('/api/requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    renderRequests();
}

async function deleteRequest(id) {
    if (!confirm('آیا از حذف این درخواست مطمئن هستید؟')) return;
    await fetch('/api/requests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    renderRequests();
}

// ============================================
// BACKUP
// ============================================
async function createBackup() {
    const response = await fetch('/api/backup');
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ بکاپ با موفقیت گرفته شد');
}

async function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.properties) { alert('❌ فایل بکاپ معتبر نیست'); return; }
            if (!confirm('⚠️ آیا از بازگردانی مطمئن هستید؟')) return;
            await fetch('/api/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            alert('✅ اطلاعات با موفقیت بازگردانی شد');
            location.reload();
        } catch(err) { alert('❌ خطا: ' + err.message); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

async function renderBackupList() {
    const container = document.getElementById('backupList');
    if (container) container.innerHTML = '<div class="empty-state">بکاپ‌ها به‌صورت خودکار در سرور ذخیره می‌شوند</div>';
}

// ============================================
// UTILITY
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// COMMISSION CALCULATOR
// ============================================
function calculateCommissionPage() {
    const rentInput = document.getElementById('commissionRentPage');
    const monthlyInput = document.getElementById('commissionMonthlyPage');
    const resultDiv = document.getElementById('commissionPageResult');

    if (!rentInput || !monthlyInput) {
        alert('خطا در بارگذاری صفحه. لطفاً صفحه را رفرش کنید.');
        return;
    }

    const rent = getRawNumberFromInput(rentInput);
    const monthly = getRawNumberFromInput(monthlyInput);

    if (isNaN(rent) || rent <= 0) {
        alert('لطفاً مبلغ رهن را به‌درستی وارد کنید (مثال: ۵۰,۰۰۰,۰۰۰)');
        rentInput.focus();
        return;
    }
    if (isNaN(monthly) || monthly <= 0) {
        alert('لطفاً مبلغ اجاره ماهانه را به‌درستی وارد کنید (مثال: ۲,۵۰۰,۰۰۰)');
        monthlyInput.focus();
        return;
    }

    let commissionFromRent = 0;
    if (rent <= 50000000) {
        commissionFromRent = rent * 0.02;
    } else {
        commissionFromRent = (50000000 * 0.02) + ((rent - 50000000) * 0.01);
    }

    const commissionFromMonthly = (monthly * 2) / 3;
    const totalBeforeTax = commissionFromRent + commissionFromMonthly;
    const tax = totalBeforeTax * 0.10;
    const totalCommission = totalBeforeTax + tax;
    const ownerShare = totalCommission / 2;
    const tenantShare = totalCommission / 2;

    document.getElementById('resultTotalPage').textContent = formatPrice(Math.round(totalCommission));
    document.getElementById('resultOwnerPage').textContent = formatPrice(Math.round(ownerShare));
    document.getElementById('resultTenantPage').textContent = formatPrice(Math.round(tenantShare));

    document.getElementById('resultDetailsPage').innerHTML = `
        <div class="details-grid">
            <span>کمیسیون رهن (تا ۵۰M: ۲٪ / مازاد: ۱٪)</span>
            <span><strong>${formatPrice(Math.round(commissionFromRent))}</strong></span>
            <span>کمیسیون اجاره (اجاره × ۲ ÷ ۳)</span>
            <span><strong>${formatPrice(Math.round(commissionFromMonthly))}</strong></span>
            <span>جمع کمیسیون (بدون مالیات)</span>
            <span><strong>${formatPrice(Math.round(totalBeforeTax))}</strong></span>
            <span>مالیات (۱۰٪)</span>
            <span><strong>${formatPrice(Math.round(tax))}</strong></span>
            <span style="color:var(--gold);font-weight:700;">کل کمیسیون نهایی</span>
            <span style="color:var(--gold);font-weight:700;">${formatPrice(Math.round(totalCommission))}</span>
            <span style="color:#4fc3f7;">سهم موجر (۵۰٪)</span>
            <span style="color:#4fc3f7;">${formatPrice(Math.round(ownerShare))}</span>
            <span style="color:#81c784;">سهم مستاجر (۵۰٪)</span>
            <span style="color:#81c784;">${formatPrice(Math.round(tenantShare))}</span>
        </div>
    `;

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// DOM CONTENT LOADED
// ============================================
document.addEventListener('DOMContentLoaded', function() {

    setupAllNumberInputs();

    // ---- Property Form ----
    const propForm = document.getElementById('propertyForm');
    if (propForm) {
        propForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const title = document.getElementById('propTitle').value.trim();
            const type = document.getElementById('propType').value;
            const status = document.getElementById('propStatus').value;
            const advisorId = document.getElementById('propAdvisor').value;
            const address = document.getElementById('propAddress').value.trim();
            const desc = document.getElementById('propDesc').value.trim();
            const meterage = document.getElementById('propMeterage')?.value.trim() || '';
            const rooms = document.getElementById('propRooms')?.value.trim() || '';
            const files = document.getElementById('propFiles').files;
            const imageUrl = document.getElementById('propImageUrl').value.trim();
            const statusDiv = document.getElementById('uploadStatus');

            let price = 0, rentPrice = 0, monthlyPrice = 0;

            if (type === 'فروش' || type === 'پیش‌فروش') {
                price = getRawNumberFromInput(document.getElementById('propSalePrice'));
                if (price <= 0) {
                    alert('⚠️ لطفاً قیمت را به‌درستی وارد کنید');
                    document.getElementById('propSalePrice').focus();
                    return;
                }
            } else if (type === 'اجاره') {
                rentPrice = getRawNumberFromInput(document.getElementById('propRentPrice'));
                monthlyPrice = getRawNumberFromInput(document.getElementById('propMonthlyPrice'));
                if (rentPrice <= 0 && monthlyPrice <= 0) {
                    alert('⚠️ لطفاً حداقل یکی از مبالغ رهن یا اجاره را وارد کنید');
                    document.getElementById('propRentPrice').focus();
                    return;
                }
                price = rentPrice;
            }

            if (!title || !advisorId) {
                alert('⚠️ لطفاً عنوان و مشاور را وارد کنید');
                return;
            }

            statusDiv.style.display = 'block';
            statusDiv.textContent = '⏳ در حال پردازش...';
            statusDiv.className = 'upload-status processing';

            const images = [];
            const videos = [];

            if (imageUrl) { images.push(imageUrl); }

            for (let f of files) {
                try {
                    statusDiv.textContent = `⏳ در حال آپلود: ${f.name}...`;
                    const url = await uploadImage(f, 'properties');
                    if (f.type.startsWith('image/')) images.push(url);
                    else if (f.type.startsWith('video/')) videos.push(url);
                } catch (error) {
                    alert('❌ خطا در آپلود فایل: ' + error.message);
                    statusDiv.textContent = '❌ خطا در آپلود';
                    statusDiv.className = 'upload-status error';
                    return;
                }
            }

            const newProperty = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                title, type, price, rentPrice, monthlyPrice, status, advisorId, address, desc,
                meterage, rooms, images, videos,
                date: new Date().toLocaleDateString('fa-IR'),
                code: Math.floor(100000 + Math.random() * 900000)
            };

            try {
                const response = await fetch('/api/properties', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProperty)
                });
                if (response.ok) {
                    statusDiv.textContent = '✅ ملک با موفقیت ثبت شد';
                    statusDiv.className = 'upload-status success';
                    this.reset();
                    document.getElementById('propFiles').value = '';
                    document.getElementById('propImageUrl').value = '';
                    document.getElementById('uploadPreview').innerHTML = '';
                    if (typeof togglePriceFields === 'function') togglePriceFields();
                    renderProperties(currentFilter);
                    renderAdminProperties();
                    updateStats();
                    setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
                } else {
                    const errorData = await response.json();
                    statusDiv.textContent = '❌ خطا: ' + (errorData.error || 'خطای ناشناخته');
                    statusDiv.className = 'upload-status error';
                }
            } catch (error) {
                statusDiv.textContent = '❌ خطا در ارتباط با سرور';
                statusDiv.className = 'upload-status error';
            }
        });
    }

    // ---- Advisor Form ----
    const advisorForm = document.getElementById('advisorForm');
    if (advisorForm) {
        advisorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('advisorName').value.trim();
            const phone = document.getElementById('advisorPhone').value.trim();
            const password = document.getElementById('advisorPassword').value.trim();
            const specialty = document.getElementById('advisorSpecialty').value.trim();
            const experience = document.getElementById('advisorExperience')?.value.trim() || '';

            let imageUrl = '';
            const fileInput = document.getElementById('advisorImageFile');
            const urlInput = document.getElementById('advisorImageUrl');
            if (fileInput.files && fileInput.files.length > 0) {
                try { imageUrl = await uploadImage(fileInput.files[0], 'advisors'); }
                catch (err) { alert('خطا در آپلود عکس: ' + err.message); return; }
            } else if (urlInput.value.trim()) {
                imageUrl = urlInput.value.trim();
            }

            if (!name || !phone || !password) { alert('لطفاً نام، شماره و رمز عبور را وارد کنید'); return; }

            const newAdvisor = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name, phone, password, specialty: specialty || 'مشاور املاک',
                experience: experience || '',
                image: imageUrl,
                date: new Date().toLocaleDateString('fa-IR')
            };

            await fetch('/api/advisors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdvisor)
            });

            this.reset();
            document.getElementById('advisorImageFile').value = '';
            document.getElementById('advisorImageUrl').value = '';
            document.getElementById('advisorImagePreview').innerHTML = '';
            renderAdvisors();
            populateAdvisorSelect();
            populateContactAdvisorSelect();
            alert('✅ مشاور با موفقیت اضافه شد');
        });
    }

    // ---- Filters ----
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            visibleCount = 6;
            renderProperties(currentFilter);
        });
    });

    // ---- Search ----
    document.getElementById('searchInput')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') searchProperties();
    });

    // ---- Populate selects ----
    async function populateContactAdvisorSelect() {
        const select = document.getElementById('contactAdvisor');
        if (!select) return;
        const advisors = await getAdvisors();
        select.innerHTML = '<option value="">انتخاب مشاور</option>' + advisors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }

    // ---- Initial renders ----
    renderProperties('all');
    renderAdvisors();
    renderAdminProperties();
    renderNotes();
    renderContacts();
    renderRequests();
    renderBackupList();
    populateAdvisorSelect();
    populateContactAdvisorSelect();
    updateStats();

    // ---- Menu Toggle ----
    document.querySelectorAll('.menu-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const nav = this.closest('.container').querySelector('.nav');
            if (nav) nav.classList.toggle('open');
            this.classList.toggle('active');
        });
    });

    // ---- Smooth scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- Preloader ----
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 500);
        }, 600);
    }

    // ---- Header scroll ----
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ---- Reveal animations ----
    const observerOptions = { threshold: 0.08, rootMargin: '0px 0px -20px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.property-card, .advisor-card, .stat-card').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
});

// ============================================
// LOGIN FUNCTIONS
// ============================================
function checkLogin() {
    if (!localStorage.getItem('realestate_logged_in') || localStorage.getItem('realestate_logged_in') !== 'true') {
        window.location.href = '/login.html';
    }
}

function logout() {
    localStorage.removeItem('realestate_logged_in');
    localStorage.removeItem('realestate_user_type');
    localStorage.removeItem('realestate_advisor_id');
    localStorage.removeItem('realestate_advisor_name');
    window.location.href = '/';
}