// ============================================
// CHECK LOGIN
// ============================================
function checkLogin() {
    const loggedIn = localStorage.getItem('realestate_logged_in');
    if (!loggedIn || loggedIn !== 'true') {
        window.location.href = '/login.html';
    }
}

function logout() {
    localStorage.removeItem('realestate_logged_in');
    window.location.href = '/';
}

// ============================================
// DATA STORE
// ============================================
const DB = {
    get(key, defaultVal = []) {
        try {
            return JSON.parse(localStorage.getItem('realestate_' + key)) || defaultVal;
        } catch { return defaultVal; }
    },
    set(key, val) {
        localStorage.setItem('realestate_' + key, JSON.stringify(val));
    }
};

function getProperties() { return DB.get('properties'); }
function setProperties(props) { DB.set('properties', props); }
function getAdvisors() { return DB.get('advisors'); }
function setAdvisors(advs) { DB.set('advisors', advs); }
function getNotes() { return DB.get('notes'); }
function setNotes(notes) { DB.set('notes', notes); }
function getContacts() { return DB.get('contacts'); }
function setContacts(contacts) { DB.set('contacts', contacts); }
function getRequests() { return DB.get('requests'); }
function setRequests(requests) { DB.set('requests', requests); }

function getCurrentUser() {
    return document.getElementById('admin-name')?.textContent || 'مدیر اصلی';
}

function formatPrice(num) {
    if (!num || num === 0) return '۰';
    return Number(num).toLocaleString('fa-IR');
}

function getAdvisorById(id) {
    const advisors = getAdvisors();
    return advisors.find(a => a.id === id) || null;
}

// ============================================
// RENDER PROPERTIES
// ============================================
let currentFilter = 'all';
let visibleCount = 6;

function renderProperties(filter = 'all') {
    const grid = document.getElementById('property-grid');
    if (!grid) return;

    let props = getProperties();
    if (filter === 'available') props = props.filter(p => p.status === 'موجود');
    else if (filter === 'sold') props = props.filter(p => p.status === 'فروش رفته');
    else if (filter === 'rented') props = props.filter(p => p.status === 'اجاره رفته');

    const total = props.length;
    const visible = props.slice(0, visibleCount);

    if (visible.length === 0) {
        grid.innerHTML = `<div class="empty-state">هیچ ملکی یافت نشد</div>`;
        return;
    }

    grid.innerHTML = visible.map(p => {
        const advisor = getAdvisorById(p.advisorId);
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        return `
        <div class="property-card" data-id="${p.id}">
            <div class="image">
                ${p.images && p.images.length > 0
                    ? `<img src="${p.images[0]}" alt="${p.title}">`
                    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:40px;">
                        <i class="fas fa-building"></i>
                       </div>`
                }
                <span class="badge badge-${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">
                    ${p.status}
                </span>
                <span class="price-tag">${formatPrice(p.price)} تومان</span>
            </div>
            <div class="content">
                <h3>${p.title}</h3>
                <div class="address"><i class="fas fa-map-pin"></i> ${p.address || 'آدرس ثبت نشده'}</div>
                <div class="advisor-row">
                    <span class="name"><i class="fas fa-user-tie"></i> ${advisorName}</span>
                    ${advisorPhone ? `<a href="tel:${advisorPhone}" class="phone">${advisorPhone}</a>` : ''}
                </div>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${p.type}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${p.date || ''}</span>
                </div>
            </div>
        </div>
    `}).join('');

    const loadMore = document.getElementById('load-more');
    if (loadMore) {
        loadMore.style.display = visibleCount >= total ? 'none' : 'block';
    }
}

function loadMore() {
    visibleCount += 6;
    renderProperties(currentFilter);
}

function searchProperties() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    if (!query) { renderProperties(currentFilter); return; }

    const props = getProperties().filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
    );

    const grid = document.getElementById('property-grid');
    if (props.length === 0) {
        grid.innerHTML = `<div class="empty-state">نتیجه‌ای برای "${query}" یافت نشد</div>`;
        return;
    }

    grid.innerHTML = props.map(p => {
        const advisor = getAdvisorById(p.advisorId);
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';
        return `
        <div class="property-card">
            <div class="image">
                ${p.images && p.images.length > 0
                    ? `<img src="${p.images[0]}" alt="${p.title}">`
                    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:40px;">
                        <i class="fas fa-building"></i>
                       </div>`
                }
                <span class="badge badge-${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">${p.status}</span>
                <span class="price-tag">${formatPrice(p.price)} تومان</span>
            </div>
            <div class="content">
                <h3>${p.title}</h3>
                <div class="address"><i class="fas fa-map-pin"></i> ${p.address || 'آدرس ثبت نشده'}</div>
                <div class="advisor-row">
                    <span class="name"><i class="fas fa-user-tie"></i> ${advisorName}</span>
                    ${advisorPhone ? `<a href="tel:${advisorPhone}" class="phone">${advisorPhone}</a>` : ''}
                </div>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${p.type}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${p.date || ''}</span>
                </div>
            </div>
        </div>
    `}).join('');
    document.getElementById('load-more').style.display = 'none';
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats() {
    const props = getProperties();
    const total = props.length;
    const active = props.filter(p => p.status === 'موجود').length;
    const sold = props.filter(p => p.status === 'فروش رفته').length;
    const rented = props.filter(p => p.status === 'اجاره رفته').length;

    document.querySelectorAll('#total-properties').forEach(el => el.textContent = total);
    document.querySelectorAll('#active-properties').forEach(el => el.textContent = active);
    document.querySelectorAll('#sold-properties').forEach(el => el.textContent = sold);
    document.querySelectorAll('#rented-properties').forEach(el => el.textContent = rented);
    document.querySelectorAll('#stat-total, #dash-total').forEach(el => el.textContent = total);
    document.querySelectorAll('#stat-active, #dash-active').forEach(el => el.textContent = active);
    document.querySelectorAll('#stat-sold, #dash-sold').forEach(el => el.textContent = sold);
    document.querySelectorAll('#stat-rented, #dash-rented').forEach(el => el.textContent = rented);
}

// ============================================
// RENDER ADMIN PROPERTIES
// ============================================
function renderAdminProperties() {
    const tbody = document.getElementById('property-table-body');
    if (!tbody) return;

    const props = getProperties();
    if (props.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">هیچ ملکی وجود ندارد</td></tr>`;
        return;
    }

    tbody.innerHTML = props.map(p => {
        const advisor = getAdvisorById(p.advisorId);
        const advisorName = advisor ? advisor.name : 'نامشخص';
        return `
        <tr>
            <td>
                ${p.images && p.images.length > 0
                    ? `<img src="${p.images[0]}" class="thumb">`
                    : `<div class="thumb" style="background:var(--gray-200);display:flex;align-items:center;justify-content:center;color:var(--gray-400);">
                        <i class="fas fa-building"></i>
                       </div>`
                }
            </td>
            <td>${p.title}</td>
            <td>${p.type}</td>
            <td>${formatPrice(p.price)}</td>
            <td>${advisorName}</td>
            <td><span class="status-badge ${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">${p.status}</span></td>
            <td>
                <button onclick="deleteProperty('${p.id}')" class="action-btn danger"><i class="fas fa-trash"></i></button>
                <button onclick="togglePropertyStatus('${p.id}')" class="action-btn gold"><i class="fas fa-sync-alt"></i></button>
            </td>
        </tr>
    `}).join('');
}

function deleteProperty(id) {
    if (!confirm('آیا از حذف این ملک مطمئن هستید؟')) return;
    let props = getProperties();
    props = props.filter(p => p.id !== id);
    setProperties(props);
    renderProperties(currentFilter);
    renderAdminProperties();
    updateStats();
}

function togglePropertyStatus(id) {
    let props = getProperties();
    const idx = props.findIndex(p => p.id === id);
    if (idx !== -1) {
        const statuses = ['موجود', 'فروش رفته', 'اجاره رفته'];
        const current = statuses.indexOf(props[idx].status);
        props[idx].status = statuses[(current + 1) % statuses.length];
        setProperties(props);
        renderProperties(currentFilter);
        renderAdminProperties();
        updateStats();
    }
}

// ============================================
// ADVISORS
// ============================================
function renderAdvisors() {
    const container = document.getElementById('advisor-list');
    const grid = document.getElementById('advisor-stats-grid');
    if (!container) return;

    const advisors = getAdvisors();
    const props = getProperties();

    if (advisors.length === 0) {
        container.innerHTML = '<div class="empty-state">هیچ مشاوری ثبت نشده است</div>';
        if (grid) grid.innerHTML = '';
        return;
    }

    container.innerHTML = advisors.map(a => {
        const count = props.filter(p => p.advisorId === a.id).length;
        return `
            <div class="advisor-card">
                <i class="fas fa-user-tie"></i>
                <h4>${a.name}</h4>
                <p>${a.phone}</p>
                <p>${a.specialty || 'مشاور املاک'}</p>
                <span class="count">${count} ملک</span>
                <div style="margin-top:8px;">
                    <button onclick="deleteAdvisor('${a.id}')" style="background:transparent;border:none;color:var(--gray-400);cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (grid) {
        grid.innerHTML = advisors.map(a => {
            const count = props.filter(p => p.advisorId === a.id).length;
            return `
                <div class="advisor-card" style="padding:10px;">
                    <h4>${a.name}</h4>
                    <span class="count">${count} ملک</span>
                </div>
            `;
        }).join('');
    }
}

function deleteAdvisor(id) {
    if (!confirm('آیا از حذف این مشاور مطمئن هستید؟')) return;
    let advisors = getAdvisors();
    advisors = advisors.filter(a => a.id !== id);
    setAdvisors(advisors);
    renderAdvisors();
    populateAdvisorSelect();
}

function populateAdvisorSelect() {
    const select = document.getElementById('prop-advisor');
    if (!select) return;
    const advisors = getAdvisors();
    select.innerHTML = '<option value="">انتخاب مشاور</option>' +
        advisors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// ============================================
// NOTES
// ============================================
function saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    if (!title || !content) {
        alert('لطفاً عنوان و متن را وارد کنید');
        return;
    }

    const notes = getNotes();
    notes.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        title: title,
        content: content,
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR'),
        author: getCurrentUser()
    });
    setNotes(notes);

    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById('notes-list');
    if (!container) return;

    const notes = getNotes();
    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state">هیچ یادداشتی وجود ندارد</div>';
        return;
    }

    container.innerHTML = notes.slice().reverse().map(n => `
        <div class="note-item">
            <div class="header">
                <h4>${n.title}</h4>
                <button onclick="deleteNote('${n.id}')"><i class="fas fa-trash"></i></button>
            </div>
            <p>${n.content}</p>
            <span class="date">${n.author || 'مدیر'} | ${n.date} ${n.time}</span>
        </div>
    `).join('');
}

function deleteNote(id) {
    if (!confirm('آیا از حذف این یادداشت مطمئن هستید؟')) return;
    let notes = getNotes();
    notes = notes.filter(n => n.id !== id);
    setNotes(notes);
    renderNotes();
}

// ============================================
// CONTACTS
// ============================================
function addContact() {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const desc = document.getElementById('contact-desc').value.trim();

    if (!name || !phone) {
        alert('لطفاً نام و شماره را وارد کنید');
        return;
    }

    const contacts = getContacts();
    contacts.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: name,
        phone: phone,
        desc: desc || '',
        date: new Date().toLocaleDateString('fa-IR'),
        addedBy: getCurrentUser()
    });
    setContacts(contacts);

    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-desc').value = '';
    renderContacts();
}

function renderContacts(filter = '') {
    const container = document.getElementById('contacts-list');
    if (!container) return;

    let contacts = getContacts();
    if (filter) {
        contacts = contacts.filter(c =>
            c.name.includes(filter) ||
            c.phone.includes(filter)
        );
    }

    if (contacts.length === 0) {
        container.innerHTML = '<div class="empty-state">هیچ مخاطبی وجود ندارد</div>';
        return;
    }

    container.innerHTML = contacts.map(c => `
        <div class="contact-item">
            <div class="info">
                <strong>${c.name}</strong>
                <span class="phone">${c.phone}</span>
                ${c.desc ? `<span class="desc">${c.desc}</span>` : ''}
            </div>
            <div class="actions">
                <button onclick="deleteContact('${c.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function searchContacts() {
    const query = document.getElementById('contact-search').value;
    renderContacts(query);
}

function deleteContact(id) {
    if (!confirm('آیا از حذف این مخاطب مطمئن هستید؟')) return;
    let contacts = getContacts();
    contacts = contacts.filter(c => c.id !== id);
    setContacts(contacts);
    renderContacts();
}

// ============================================
// REQUESTS
// ============================================
function renderRequests() {
    const container = document.getElementById('requests-table-body');
    if (!container) return;

    const requests = getRequests();
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
}

function updateRequestStatus(id, status) {
    let requests = getRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx !== -1) {
        requests[idx].status = status;
        setRequests(requests);
        renderRequests();
    }
}

function deleteRequest(id) {
    if (!confirm('آیا از حذف این درخواست مطمئن هستید؟')) return;
    let requests = getRequests();
    requests = requests.filter(r => r.id !== id);
    setRequests(requests);
    renderRequests();
}

// ============================================
// BACKUP
// ============================================
function createBackup() {
    const data = {
        properties: getProperties(),
        advisors: getAdvisors(),
        notes: getNotes(),
        contacts: getContacts(),
        requests: getRequests(),
        date: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const backups = DB.get('backups', []);
    backups.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR'),
        size: JSON.stringify(data).length
    });
    DB.set('backups', backups);
    renderBackupList();

    alert('✅ بکاپ با موفقیت گرفته شد');
}

function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.properties) {
                alert('❌ فایل بکاپ معتبر نیست');
                return;
            }

            if (!confirm('⚠️ آیا از بازگردانی مطمئن هستید؟')) return;

            setProperties(data.properties || []);
            setAdvisors(data.advisors || []);
            if (data.notes) setNotes(data.notes);
            if (data.contacts) setContacts(data.contacts);
            if (data.requests) setRequests(data.requests);

            alert('✅ اطلاعات با موفقیت بازگردانی شد');
            location.reload();
        } catch(err) {
            alert('❌ خطا: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function renderBackupList() {
    const container = document.getElementById('backup-list');
    if (!container) return;

    const backups = DB.get('backups', []);
    if (backups.length === 0) {
        container.innerHTML = '<div class="empty-state">هیچ بکاپی موجود نیست</div>';
        return;
    }

    container.innerHTML = backups.slice().reverse().map(b => `
        <div class="backup-item">
            <div class="info">
                <i class="fas fa-file-archive"></i>
                <span>بکاپ ${b.date} ${b.time}</span>
                <small>${Math.round(b.size/1024)} KB</small>
                ${b.auto ? '<span style="color:var(--gold);font-size:10px;">(خودکار)</span>' : ''}
            </div>
            <button onclick="deleteBackup('${b.id}')" class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

function deleteBackup(id) {
    if (!confirm('آیا از حذف این بکاپ مطمئن هستید؟')) return;
    let backups = DB.get('backups', []);
    backups = backups.filter(b => b.id !== id);
    DB.set('backups', backups);
    renderBackupList();
}

// ============================================
// AUTO BACKUP
// ============================================
function checkAutoBackup() {
    const now = new Date();
    const lastBackup = localStorage.getItem('realestate_last_backup');
    const today = now.toDateString();

    if (now.getHours() === 0 && now.getMinutes() === 0) {
        if (lastBackup !== today) {
            const data = {
                properties: getProperties(),
                advisors: getAdvisors(),
                notes: getNotes(),
                contacts: getContacts(),
                requests: getRequests(),
                date: new Date().toISOString(),
                version: '1.0'
            };
            const backups = DB.get('backups', []);
            backups.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                date: new Date().toLocaleDateString('fa-IR'),
                time: new Date().toLocaleTimeString('fa-IR'),
                size: JSON.stringify(data).length,
                auto: true
            });
            DB.set('backups', backups);
            localStorage.setItem('realestate_last_backup', today);
        }
    }
}

setInterval(checkAutoBackup, 60000);
checkAutoBackup();

// ============================================
// COMMISSION CALCULATOR
// ============================================
function calculateCommission() {
    const rentInput = document.getElementById('commission-rent');
    const monthlyInput = document.getElementById('commission-monthly');
    const resultDiv = document.getElementById('commission-result');

    const rentValue = rentInput.value.replace(/,/g, '').trim();
    const monthlyValue = monthlyInput.value.replace(/,/g, '').trim();

    const rent = parseFloat(rentValue);
    const monthly = parseFloat(monthlyValue);

    if (isNaN(rent) || rent < 0) {
        alert('لطفاً مبلغ رهن را به‌درستی وارد کنید');
        rentInput.focus();
        return;
    }

    if (isNaN(monthly) || monthly < 0) {
        alert('لطفاً مبلغ اجاره ماهانه را به‌درستی وارد کنید');
        monthlyInput.focus();
        return;
    }

    // محاسبه کمیسیون رهن: تا ۵۰ میلیون ۲٪، مازاد ۱٪
    let commissionFromRent = 0;
    if (rent <= 50000000) {
        commissionFromRent = rent * 0.02;
    } else {
        commissionFromRent = (50000000 * 0.02) + ((rent - 50000000) * 0.01);
    }

    // محاسبه کمیسیون اجاره: (اجاره × ۲) ÷ ۳
    const commissionFromMonthly = (monthly * 2) / 3;

    // جمع کل (بدون مالیات)
    const totalBeforeTax = commissionFromRent + commissionFromMonthly;

    // مالیات ۱۰٪
    const tax = totalBeforeTax * 0.10;

    // کل کمیسیون نهایی
    const totalCommission = totalBeforeTax + tax;

    // سهم موجر و مستاجر (هر کدام نصف)
    const ownerShare = totalCommission / 2;
    const tenantShare = totalCommission / 2;

    document.getElementById('result-total').textContent = formatPrice(Math.round(totalCommission));
    document.getElementById('result-owner').textContent = formatPrice(Math.round(ownerShare));
    document.getElementById('result-tenant').textContent = formatPrice(Math.round(tenantShare));

    const detailsDiv = document.getElementById('result-details');
    detailsDiv.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;font-size:13px;">
            <span>📊 کمیسیون رهن (تا ۵۰M: ۲٪ / مازاد: ۱٪)</span>
            <span><strong>${formatPrice(Math.round(commissionFromRent))}</strong> تومان</span>
            <span>📊 کمیسیون اجاره (اجاره × ۲ ÷ ۳)</span>
            <span><strong>${formatPrice(Math.round(commissionFromMonthly))}</strong> تومان</span>
            <span>📊 جمع کمیسیون (بدون مالیات)</span>
            <span><strong>${formatPrice(Math.round(totalBeforeTax))}</strong> تومان</span>
            <span>📊 مالیات (۱۰٪)</span>
            <span><strong>${formatPrice(Math.round(tax))}</strong> تومان</span>
            <span style="color:var(--gold);font-weight:700;">💰 کل کمیسیون نهایی</span>
            <span style="color:var(--gold);font-weight:700;">${formatPrice(Math.round(totalCommission))} تومان</span>
            <span style="color:#4fc3f7;">👤 سهم موجر (۵۰٪)</span>
            <span style="color:#4fc3f7;">${formatPrice(Math.round(ownerShare))} تومان</span>
            <span style="color:#81c784;">👤 سهم مستاجر (۵۰٪)</span>
            <span style="color:#81c784;">${formatPrice(Math.round(tenantShare))} تومان</span>
        </div>
    `;

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// WIZARD
// ============================================
function initWizard() {
    const steps = document.querySelectorAll('.wizard-steps .step');
    const stepContents = document.querySelectorAll('.wizard-step');
    const prevBtn = document.getElementById('wizard-prev');
    const nextBtn = document.getElementById('wizard-next');
    const submitBtn = document.getElementById('wizard-submit');
    let currentStep = 1;

    function updateStep(step) {
        steps.forEach((s, i) => s.classList.toggle('active', i + 1 === step));
        stepContents.forEach((s, i) => s.classList.toggle('active', i + 1 === step));

        if (step === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'inline-flex';
            submitBtn.style.display = 'none';
        } else if (step === 3) {
            prevBtn.style.display = 'inline-flex';
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-flex';
        } else {
            prevBtn.style.display = 'inline-flex';
            nextBtn.style.display = 'inline-flex';
            submitBtn.style.display = 'none';
        }
        currentStep = step;
    }

    steps.forEach((s, i) => s.addEventListener('click', () => updateStep(i + 1)));

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) updateStep(currentStep - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < 3) updateStep(currentStep + 1);
    });

    const fileInput = document.getElementById('prop-files');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const preview = document.getElementById('upload-preview');
            preview.innerHTML = '';
            for (let f of this.files) {
                if (f.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(f);
                    preview.appendChild(img);
                }
            }
        });
    }

    updateStep(1);
}

// ============================================
// MENU TOGGLE
// ============================================
function initMenuToggle() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('open');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }
}

// ============================================
// COMMISSION INPUT FORMATTING
// ============================================
function initCommissionInputs() {
    const rentInput = document.getElementById('commission-rent');
    const monthlyInput = document.getElementById('commission-monthly');

    if (rentInput) {
        rentInput.addEventListener('input', function() {
            let value = this.value.replace(/,/g, '').replace(/[^0-9]/g, '');
            if (value) {
                this.value = Number(value).toLocaleString('fa-IR');
            }
        });
        rentInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') calculateCommission();
        });
    }

    if (monthlyInput) {
        monthlyInput.addEventListener('input', function() {
            let value = this.value.replace(/,/g, '').replace(/[^0-9]/g, '');
            if (value) {
                this.value = Number(value).toLocaleString('fa-IR');
            }
        });
        monthlyInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') calculateCommission();
        });
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {

    initMenuToggle();
    initCommissionInputs();

    if (window.location.pathname.includes('admin.html')) {
        checkLogin();
    }

    // Expertise form
    const expertiseForm = document.getElementById('expertise-form');
    if (expertiseForm) {
        expertiseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('expert-name').value.trim();
            const phone = document.getElementById('expert-phone').value.trim();
            const type = document.getElementById('expert-type').value;
            const desc = document.getElementById('expert-desc').value.trim();

            if (!name || !phone) {
                alert('لطفاً نام و شماره تماس را وارد کنید');
                return;
            }

            const requests = getRequests();
            requests.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name: name,
                phone: phone,
                type: type,
                desc: desc || '',
                status: 'جدید',
                date: new Date().toLocaleDateString('fa-IR'),
                time: new Date().toLocaleTimeString('fa-IR')
            });
            setRequests(requests);

            alert('✅ درخواست شما با موفقیت ارسال شد');
            this.reset();
        });
    }

    // Tab switching
    document.querySelectorAll('.admin-sidebar nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.admin-sidebar nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            const target = document.getElementById('tab-' + tab);
            if (target) target.classList.add('active');

            if (tab === 'properties') renderAdminProperties();
            if (tab === 'advisors') renderAdvisors();
            if (tab === 'notes') renderNotes();
            if (tab === 'contacts') renderContacts();
            if (tab === 'requests') renderRequests();
            if (tab === 'backup') renderBackupList();
            if (tab === 'dashboard') {
                renderAdvisors();
                updateStats();
            }
            if (tab === 'add-property') initWizard();
        });
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            visibleCount = 6;
            renderProperties(currentFilter);
        });
    });

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') searchProperties();
        });
    }

    // Property form (Wizard)
    const propForm = document.getElementById('property-form');
    if (propForm) {
        propForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = document.getElementById('prop-title').value.trim();
            const type = document.getElementById('prop-type').value;
            const price = document.getElementById('prop-price').value.replace(/,/g, '');
            const status = document.getElementById('prop-status').value;
            const advisorId = document.getElementById('prop-advisor').value;
            const address = document.getElementById('prop-address').value.trim();
            const desc = document.getElementById('prop-desc').value.trim();

            if (!title || !price || !advisorId) {
                alert('لطفاً تمام فیلدهای ضروری را پر کنید');
                return;
            }

            const files = document.getElementById('prop-files').files;
            const images = [];
            const videos = [];

            for (let f of files) {
                if (f.type.startsWith('image/')) {
                    images.push(URL.createObjectURL(f));
                } else if (f.type.startsWith('video/')) {
                    videos.push(URL.createObjectURL(f));
                }
            }

            const props = getProperties();
            props.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                title: title,
                type: type,
                price: Number(price),
                status: status,
                advisorId: advisorId,
                address: address,
                desc: desc,
                images: images,
                videos: videos,
                date: new Date().toLocaleDateString('fa-IR')
            });
            setProperties(props);

            this.reset();
            document.getElementById('prop-files').value = '';
            document.getElementById('upload-preview').innerHTML = '';
            renderProperties(currentFilter);
            renderAdminProperties();
            updateStats();
            alert('✅ ملک با موفقیت اضافه شد');
            initWizard();
        });
    }

    // Advisor form
    const advForm = document.getElementById('advisor-form');
    if (advForm) {
        advForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('advisor-name').value.trim();
            const phone = document.getElementById('advisor-phone').value.trim();
            const specialty = document.getElementById('advisor-specialty').value.trim();

            if (!name || !phone) {
                alert('لطفاً نام و تلفن را وارد کنید');
                return;
            }

            const advisors = getAdvisors();
            advisors.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name: name,
                phone: phone,
                specialty: specialty || 'مشاور املاک',
                date: new Date().toLocaleDateString('fa-IR')
            });
            setAdvisors(advisors);

            this.reset();
            renderAdvisors();
            populateAdvisorSelect();
            alert('✅ مشاور با موفقیت اضافه شد');
        });
    }

    // Initial render
    renderProperties('all');
    renderAdminProperties();
    renderAdvisors();
    renderNotes();
    renderContacts();
    renderRequests();
    renderBackupList();
    populateAdvisorSelect();
    updateStats();
    initWizard();
});