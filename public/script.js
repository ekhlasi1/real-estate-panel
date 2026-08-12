// ============================================
// DATA STORE
// ============================================
const DB = {
    get(key, defaultVal = []) {
        try {
            const data = localStorage.getItem('realestate_' + key);
            return data ? JSON.parse(data) : defaultVal;
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
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;

    let props = getProperties();
    if (filter === 'available') props = props.filter(p => p.status === 'موجود');
    else if (filter === 'sold') props = props.filter(p => p.status === 'فروش رفته');
    else if (filter === 'rented') props = props.filter(p => p.status === 'اجاره رفته');

    const total = props.length;
    const visible = props.slice(0, visibleCount);

    if (visible.length === 0) {
        grid.innerHTML = `<div class="empty-state">هیچ ملکی یافت نشد</div>`;
        const loadMore = document.getElementById('loadMore');
        if (loadMore) loadMore.style.display = 'none';
        return;
    }

    grid.innerHTML = visible.map(p => {
        const advisor = getAdvisorById(p.advisorId);
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        let imageHtml = '';
        if (p.images && p.images.length > 0 && p.images[0]) {
            imageHtml = `<img src="${p.images[0]}" alt="${p.title}" />`;
        } else {
            imageHtml = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:36px;">
                <i class="fas fa-building"></i>
            </div>`;
        }

        const code = p.code || p.id?.substring(0, 6) || '---';

        return `
        <div class="property-card" data-id="${p.id}">
            <div class="image-wrapper">
                ${imageHtml}
                <span class="badge badge-${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">
                    ${p.status}
                </span>
                <span class="code">کد ملک: ${code}</span>
                <span class="price-tag">${formatPrice(p.price)} تومان</span>
            </div>
            <div class="content">
                <h3>${p.title}</h3>
                <div class="address"><i class="fas fa-map-pin"></i> ${p.address || 'آدرس ثبت نشده'}</div>
                <div class="advisor-row">
                    <span><i class="fas fa-user-tie"></i> ${advisorName}</span>
                    ${advisorPhone ? `<a href="tel:${advisorPhone}" class="phone">${advisorPhone}</a>` : ''}
                </div>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${p.type}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${p.date || ''}</span>
                </div>
            </div>
        </div>
    `}).join('');

    const loadMore = document.getElementById('loadMore');
    if (loadMore) {
        loadMore.style.display = visibleCount >= total ? 'none' : 'block';
    }

    updateStats();
}

function loadMore() {
    visibleCount += 6;
    renderProperties(currentFilter);
}

function searchProperties() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) { renderProperties(currentFilter); return; }

    const props = getProperties().filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.address && p.address.toLowerCase().includes(query))
    );

    const grid = document.getElementById('propertyGrid');
    if (props.length === 0) {
        grid.innerHTML = `<div class="empty-state">نتیجه‌ای برای "${query}" یافت نشد</div>`;
        document.getElementById('loadMore').style.display = 'none';
        return;
    }

    grid.innerHTML = props.map(p => {
        const advisor = getAdvisorById(p.advisorId);
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        let imageHtml = '';
        if (p.images && p.images.length > 0 && p.images[0]) {
            imageHtml = `<img src="${p.images[0]}" alt="${p.title}" />`;
        } else {
            imageHtml = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:36px;">
                <i class="fas fa-building"></i>
            </div>`;
        }

        const code = p.code || p.id?.substring(0, 6) || '---';

        return `
        <div class="property-card">
            <div class="image-wrapper">
                ${imageHtml}
                <span class="badge badge-${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">${p.status}</span>
                <span class="code">کد ملک: ${code}</span>
                <span class="price-tag">${formatPrice(p.price)} تومان</span>
            </div>
            <div class="content">
                <h3>${p.title}</h3>
                <div class="address"><i class="fas fa-map-pin"></i> ${p.address || 'آدرس ثبت نشده'}</div>
                <div class="advisor-row">
                    <span><i class="fas fa-user-tie"></i> ${advisorName}</span>
                    ${advisorPhone ? `<a href="tel:${advisorPhone}" class="phone">${advisorPhone}</a>` : ''}
                </div>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${p.type}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${p.date || ''}</span>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('loadMore').style.display = 'none';
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

    const totalEl = document.getElementById('totalProperties');
    const activeEl = document.getElementById('activeProperties');
    const soldEl = document.getElementById('soldProperties');
    const rentedEl = document.getElementById('rentedProperties');

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (soldEl) soldEl.textContent = sold;
    if (rentedEl) rentedEl.textContent = rented;

    // Admin stats
    const statTotal = document.getElementById('statTotal');
    const statActive = document.getElementById('statActive');
    const statSold = document.getElementById('statSold');
    const statRented = document.getElementById('statRented');

    if (statTotal) statTotal.textContent = total;
    if (statActive) statActive.textContent = active;
    if (statSold) statSold.textContent = sold;
    if (statRented) statRented.textContent = rented;
}

// ============================================
// RENDER ADVISORS
// ============================================
function renderAdvisors() {
    // Main page advisors
    const grid = document.getElementById('advisorGrid');
    if (grid) {
        const defaultAdvisors = [
            { name: 'عاطفه قانع', agency: 'دریا مسکن', avatar: '👩‍💼' },
            { name: 'فرهاد رضوان پور', agency: 'مدیریت سایت املاک مال', avatar: '👨‍💼' },
            { name: 'فخرالدین میرغفاری', agency: 'کارگزاری املاک مهریاد', avatar: '👨‍💼' },
            { name: 'سینا سمیع زادگان', agency: 'لندمارکت', avatar: '👨‍💼' },
            { name: 'حسین حسین پور', agency: 'املاک حسین پور', avatar: '👨‍💼' },
            { name: 'آقای امیر ادبی', agency: 'آژانس املاک ادبی', avatar: '👨‍💼' },
            { name: 'امیر بهدر', agency: 'املاک بهادر', avatar: '👨‍💼' },
            { name: 'سیدنی الله موزی', agency: 'املاک سیدنی', avatar: '👨‍💼' },
        ];

        const advisors = getAdvisors();
        const displayList = advisors.length > 0 ? advisors : defaultAdvisors;

        grid.innerHTML = displayList.map(a => `
            <div class="advisor-card">
                <div class="avatar">${a.avatar || '<i class="fas fa-user-tie"></i>'}</div>
                <h4>${a.name}</h4>
                <p>${a.agency || a.specialty || 'مشاور املاک'}</p>
                <button class="btn-profile" onclick="alert('پروفایل ${a.name}')">نمایش پروفایل</button>
            </div>
        `).join('');
    }

    // Admin advisor list
    const adminGrid = document.getElementById('advisorList');
    if (adminGrid) {
        const advisors = getAdvisors();
        if (advisors.length === 0) {
            adminGrid.innerHTML = '<div class="empty-state">هیچ مشاوری ثبت نشده است</div>';
        } else {
            adminGrid.innerHTML = advisors.map(a => `
                <div class="advisor-card">
                    <div class="avatar"><i class="fas fa-user-tie"></i></div>
                    <h4>${a.name}</h4>
                    <p>${a.phone}</p>
                    <p>${a.specialty || 'مشاور املاک'}</p>
                    <button onclick="deleteAdvisor('${a.id}')" style="background:transparent;border:none;color:var(--gray-400);cursor:pointer;margin-top:6px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
        populateAdvisorSelect();
    }

    // Admin mini grid
    const miniGrid = document.getElementById('adminAdvisorGrid');
    if (miniGrid) {
        const advisors = getAdvisors();
        if (advisors.length === 0) {
            miniGrid.innerHTML = '<div class="empty-state">هیچ مشاوری ثبت نشده است</div>';
        } else {
            miniGrid.innerHTML = advisors.map(a => `
                <div class="advisor-card" style="padding:10px;">
                    <h4>${a.name}</h4>
                    <span style="font-size:12px;color:var(--gold);">${a.phone}</span>
                </div>
            `).join('');
        }
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
    const select = document.getElementById('propAdvisor');
    if (!select) return;
    const advisors = getAdvisors();
    select.innerHTML = '<option value="">انتخاب مشاور</option>' +
        advisors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// ============================================
// RENDER ADMIN PROPERTIES
// ============================================
function renderAdminProperties() {
    const tbody = document.getElementById('propertyTableBody');
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
// NOTES
// ============================================
function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
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
        author: 'مدیر'
    });
    setNotes(notes);

    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById('notesList');
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
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const desc = document.getElementById('contactDesc').value.trim();

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
        addedBy: 'مدیر'
    });
    setContacts(contacts);

    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactDesc').value = '';
    renderContacts();
}

function renderContacts(filter = '') {
    const container = document.getElementById('contactsList');
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
    const query = document.getElementById('contactSearch').value;
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
    const container = document.getElementById('requestsTableBody');
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
    const container = document.getElementById('backupList');
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
    const rentInput = document.getElementById('commissionRent');
    const monthlyInput = document.getElementById('commissionMonthly');
    const resultDiv = document.getElementById('commissionResult');

    const rent = parseFloat(rentInput.value.replace(/,/g, '').trim());
    const monthly = parseFloat(monthlyInput.value.replace(/,/g, '').trim());

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

    // 1. کمیسیون رهن: تا ۵۰M = ۲٪ ، مازاد = ۱٪
    let commissionFromRent = 0;
    if (rent <= 50000000) {
        commissionFromRent = rent * 0.02;
    } else {
        commissionFromRent = (50000000 * 0.02) + ((rent - 50000000) * 0.01);
    }

    // 2. کمیسیون اجاره: (اجاره × ۲) ÷ ۳
    const commissionFromMonthly = (monthly * 2) / 3;

    // 3. جمع (بدون مالیات)
    const totalBeforeTax = commissionFromRent + commissionFromMonthly;

    // 4. مالیات ۱۰٪
    const tax = totalBeforeTax * 0.10;

    // 5. کل کمیسیون نهایی
    const totalCommission = totalBeforeTax + tax;

    // 6. سهم موجر و مستاجر (هر کدام نصف)
    const ownerShare = totalCommission / 2;
    const tenantShare = totalCommission / 2;

    // نمایش نتیجه
    resultDiv.innerHTML = `
        <div class="result-header">
            <i class="fas fa-file-invoice"></i>
            <h3>نتیجه محاسبه</h3>
        </div>
        <div class="result-grid">
            <div class="result-item total">
                <span class="label">کل کمیسیون</span>
                <span class="value">${formatPrice(Math.round(totalCommission))}</span>
            </div>
            <div class="result-item owner">
                <span class="label"><i class="fas fa-user-tie"></i> سهم موجر</span>
                <span class="value">${formatPrice(Math.round(ownerShare))}</span>
            </div>
            <div class="result-item tenant">
                <span class="label"><i class="fas fa-user"></i> سهم مستاجر</span>
                <span class="value">${formatPrice(Math.round(tenantShare))}</span>
            </div>
        </div>
        <div class="result-details">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;">
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
        </div>
    `;

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {

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
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') searchProperties();
        });
    }

    // Commission input formatting
    const rentInput = document.getElementById('commissionRent');
    const monthlyInput = document.getElementById('commissionMonthly');

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

    // Property form (admin)
    const propForm = document.getElementById('propertyForm');
    if (propForm) {
        propForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = document.getElementById('propTitle').value.trim();
            const type = document.getElementById('propType').value;
            const price = document.getElementById('propPrice').value.replace(/,/g, '');
            const status = document.getElementById('propStatus').value;
            const advisorId = document.getElementById('propAdvisor').value;
            const address = document.getElementById('propAddress').value.trim();
            const desc = document.getElementById('propDesc').value.trim();

            if (!title || !price || !advisorId) {
                alert('لطفاً تمام فیلدهای ضروری را پر کنید');
                return;
            }

            const files = document.getElementById('propFiles').files;
            const images = [];
            for (let f of files) {
                if (f.type.startsWith('image/')) {
                    images.push(URL.createObjectURL(f));
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
                date: new Date().toLocaleDateString('fa-IR')
            });
            setProperties(props);

            this.reset();
            document.getElementById('propFiles').value = '';
            document.getElementById('uploadPreview').innerHTML = '';
            renderProperties(currentFilter);
            renderAdminProperties();
            updateStats();
            alert('✅ ملک با موفقیت اضافه شد');
        });
    }

    // Advisor form (admin)
    const advForm = document.getElementById('advisorForm');
    if (advForm) {
        advForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('advisorName').value.trim();
            const phone = document.getElementById('advisorPhone').value.trim();
            const specialty = document.getElementById('advisorSpecialty').value.trim();

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

    // File preview
    const fileInput = document.getElementById('propFiles');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const preview = document.getElementById('uploadPreview');
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

    // Initial renders
    renderProperties('all');
    renderAdvisors();
    renderAdminProperties();
    renderNotes();
    renderContacts();
    renderRequests();
    renderBackupList();
    populateAdvisorSelect();
    updateStats();
});

// ============================================
// LOGIN FUNCTIONS
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