// ============================================
// DATA STORE
// ============================================
const API_BASE = '';

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
}

async function getProperties() {
    try {
        const data = await apiCall('/api/properties', { method: 'GET' });
        return data || [];
    } catch {
        return [];
    }
}

async function getAdvisors() {
    try {
        const data = await apiCall('/api/advisors', { method: 'GET' });
        return data || [];
    } catch {
        return [];
    }
}

async function getNotes() {
    try {
        const data = await apiCall('/api/notes', { method: 'GET' });
        return data || [];
    } catch {
        return [];
    }
}

async function getContacts() {
    try {
        const data = await apiCall('/api/contacts', { method: 'GET' });
        return data || [];
    } catch {
        return [];
    }
}

async function getRequests() {
    try {
        const data = await apiCall('/api/requests', { method: 'GET' });
        return data || [];
    } catch {
        return [];
    }
}

function formatPrice(num) {
    if (!num || num === 0) return '۰';
    return Number(num).toLocaleString('fa-IR');
}

// ============================================
// UPLOAD IMAGE
// ============================================
async function uploadImage(file, folder = 'properties') {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'خطا در آپلود تصویر');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'خطا در آپلود تصویر');
        }
        return result.url;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// ============================================
// RENDER PROPERTIES
// ============================================
let currentFilter = 'all';
let visibleCount = 6;
let allProperties = [];

async function renderProperties(filter = 'all') {
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;

    allProperties = await getProperties();
    let props = allProperties;
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

    const advisors = await getAdvisors();

    grid.innerHTML = await Promise.all(visible.map(async (p) => {
        const advisor = advisors.find(a => a.id === p.advisorId) || null;
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        let imageHtml = '';
        if (p.images && p.images.length > 0 && p.images[0]) {
            const imgUrl = p.images[0];
            imageHtml = `<img src="${imgUrl}" alt="${p.title}" onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:32px;\\'><i class=\\'fas fa-building\\'></i></div>'" />`;
        } else {
            imageHtml = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:32px;">
                <i class="fas fa-building"></i>
            </div>`;
        }

        const code = p.code || p.id?.substring(0, 6) || '---';
        const statusClass = p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented';
        const statusLabel = p.status;
        const typeLabel = p.type === 'فروش' ? 'فروش' : 'اجاره';

        return `
        <div class="property-card" data-id="${p.id}">
            <div class="image-wrapper">
                ${imageHtml}
                <span class="badge badge-${statusClass}">${statusLabel}</span>
                <span class="type-badge">${typeLabel}</span>
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
    `})).then(results => results.join(''));

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

async function searchProperties() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;

    if (!query) {
        renderProperties(currentFilter);
        return;
    }

    const allProps = await getProperties();
    const props = allProps.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.address && p.address.toLowerCase().includes(query))
    );

    if (props.length === 0) {
        grid.innerHTML = `<div class="empty-state">نتیجه‌ای برای "${query}" یافت نشد</div>`;
        document.getElementById('loadMore').style.display = 'none';
        return;
    }

    const advisors = await getAdvisors();

    grid.innerHTML = await Promise.all(props.map(async (p) => {
        const advisor = advisors.find(a => a.id === p.advisorId) || null;
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        let imageHtml = '';
        if (p.images && p.images.length > 0 && p.images[0]) {
            const imgUrl = p.images[0];
            imageHtml = `<img src="${imgUrl}" alt="${p.title}" onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:32px;\\'><i class=\\'fas fa-building\\'></i></div>'" />`;
        } else {
            imageHtml = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400);font-size:32px;">
                <i class="fas fa-building"></i>
            </div>`;
        }

        const code = p.code || p.id?.substring(0, 6) || '---';
        const statusClass = p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented';
        const statusLabel = p.status;
        const typeLabel = p.type === 'فروش' ? 'فروش' : 'اجاره';

        return `
        <div class="property-card">
            <div class="image-wrapper">
                ${imageHtml}
                <span class="badge badge-${statusClass}">${statusLabel}</span>
                <span class="type-badge">${typeLabel}</span>
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
    `})).then(results => results.join(''));

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
    const rented = props.filter(p => p.status === 'اجاره رفته').length;

    const totalEl = document.getElementById('totalProperties');
    const activeEl = document.getElementById('activeProperties');
    const soldEl = document.getElementById('soldProperties');

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (soldEl) soldEl.textContent = sold;

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
async function renderAdvisors() {
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

        const advisors = await getAdvisors();
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

    const adminGrid = document.getElementById('advisorList');
    if (adminGrid) {
        const advisors = await getAdvisors();
        if (advisors.length === 0) {
            adminGrid.innerHTML = '<div class="empty-state">هیچ مشاوری ثبت نشده است</div>';
        } else {
            adminGrid.innerHTML = advisors.map(a => `
                <div class="advisor-card">
                    <div class="avatar"><i class="fas fa-user-tie"></i></div>
                    <h4>${a.name}</h4>
                    <p>${a.specialty || 'مشاور املاک'}</p>
                    <span style="color:var(--gold);font-weight:600;direction:ltr;">${a.phone}</span>
                    <button onclick="deleteAdvisor('${a.id}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
        populateAdvisorSelect();
    }

    const miniGrid = document.getElementById('adminAdvisorGrid');
    if (miniGrid) {
        const advisors = await getAdvisors();
        if (advisors.length === 0) {
            miniGrid.innerHTML = '<div class="empty-state">هیچ مشاوری ثبت نشده است</div>';
        } else {
            miniGrid.innerHTML = advisors.map(a => `
                <div class="advisor-card" style="padding:8px;">
                    <h4>${a.name}</h4>
                    <span style="font-size:11px;color:var(--gold);">${a.phone}</span>
                </div>
            `).join('');
        }
    }
}

async function deleteAdvisor(id) {
    if (!confirm('آیا از حذف این مشاور مطمئن هستید؟')) return;
    await fetch('/api/advisors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    renderAdvisors();
    populateAdvisorSelect();
}

async function populateAdvisorSelect() {
    const select = document.getElementById('propAdvisor');
    if (!select) return;
    const advisors = await getAdvisors();
    select.innerHTML = '<option value="">انتخاب مشاور</option>' +
        advisors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
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
        const advisor = advisors.find(a => a.id === p.advisorId) || null;
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

async function deleteProperty(id) {
    if (!confirm('آیا از حذف این ملک مطمئن هستید؟')) return;
    await fetch('/api/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    renderProperties(currentFilter);
    renderAdminProperties();
    updateStats();
}

async function togglePropertyStatus(id) {
    const props = await getProperties();
    const idx = props.findIndex(p => p.id === id);
    if (idx !== -1) {
        const statuses = ['موجود', 'فروش رفته', 'اجاره رفته'];
        const current = statuses.indexOf(props[idx].status);
        props[idx].status = statuses[(current + 1) % statuses.length];
        await fetch('/api/properties', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(props[idx])
        });
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
        alert('لطفاً عنوان و متن را وارد کنید');
        return;
    }

    const newNote = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        title: title,
        content: content,
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR'),
        author: 'مدیر'
    };
    await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
    });

    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    renderNotes();
}

async function renderNotes() {
    const container = document.getElementById('notesList');
    if (!container) return;

    const notes = await getNotes();
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

async function deleteNote(id) {
    if (!confirm('آیا از حذف این یادداشت مطمئن هستید؟')) return;
    await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    renderNotes();
}

// ============================================
// CONTACTS
// ============================================
async function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const desc = document.getElementById('contactDesc').value.trim();

    if (!name || !phone) {
        alert('لطفاً نام و شماره را وارد کنید');
        return;
    }

    const newContact = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: name,
        phone: phone,
        desc: desc || '',
        date: new Date().toLocaleDateString('fa-IR'),
        addedBy: 'مدیر'
    };
    await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
    });

    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactDesc').value = '';
    renderContacts();
}

async function renderContacts(filter = '') {
    const container = document.getElementById('contactsList');
    if (!container) return;

    let contacts = await getContacts();
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

async function deleteContact(id) {
    if (!confirm('آیا از حذف این مخاطب مطمئن هستید؟')) return;
    await fetch('/api/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    renderContacts();
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
}

async function updateRequestStatus(id, status) {
    await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
    });
    renderRequests();
}

async function deleteRequest(id) {
    if (!confirm('آیا از حذف این درخواست مطمئن هستید؟')) return;
    await fetch('/api/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
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
            if (!data.properties) {
                alert('❌ فایل بکاپ معتبر نیست');
                return;
            }

            if (!confirm('⚠️ آیا از بازگردانی مطمئن هستید؟')) return;

            await fetch('/api/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            alert('✅ اطلاعات با موفقیت بازگردانی شد');
            location.reload();
        } catch(err) {
            alert('❌ خطا: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

async function renderBackupList() {
    const container = document.getElementById('backupList');
    if (!container) return;
    container.innerHTML = '<div class="empty-state">بکاپ‌ها به‌صورت خودکار در سرور ذخیره می‌شوند</div>';
}

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

    // MENU TOGGLE
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            nav.classList.toggle('open');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        document.addEventListener('click', function(e) {
            if (nav.classList.contains('open') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
                nav.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // FILTERS
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            visibleCount = 6;
            renderProperties(currentFilter);
        });
    });

    // SEARCH
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') searchProperties();
        });
    }

    // COMMISSION INPUT FORMATTING
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

    // PROPERTY FORM
    const propForm = document.getElementById('propertyForm');
    if (propForm) {
        propForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('propTitle').value.trim();
            const type = document.getElementById('propType').value;
            const price = document.getElementById('propPrice').value.replace(/,/g, '');
            const status = document.getElementById('propStatus').value;
            const advisorId = document.getElementById('propAdvisor').value;
            const address = document.getElementById('propAddress').value.trim();
            const desc = document.getElementById('propDesc').value.trim();
            const files = document.getElementById('propFiles').files;
            const statusDiv = document.getElementById('uploadStatus');

            if (!title || !price || !advisorId) {
                alert('لطفاً تمام فیلدهای ضروری را پر کنید');
                return;
            }

            statusDiv.style.display = 'block';
            statusDiv.textContent = '⏳ در حال آپلود تصاویر...';
            statusDiv.style.color = '#ffc107';

            const images = [];
            const videos = [];

            for (let f of files) {
                try {
                    statusDiv.textContent = `⏳ در حال آپلود: ${f.name}...`;
                    const url = await uploadImage(f, 'properties');
                    if (f.type.startsWith('image/')) {
                        images.push(url);
                    } else if (f.type.startsWith('video/')) {
                        videos.push(url);
                    }
                } catch (error) {
                    alert('خطا در آپلود فایل: ' + error.message);
                    statusDiv.textContent = '❌ خطا در آپلود تصویر';
                    statusDiv.style.color = '#e74c3c';
                    return;
                }
            }

            const newProperty = {
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
                    statusDiv.textContent = '✅ ملک با موفقیت اضافه شد';
                    statusDiv.style.color = '#27ae60';
                    this.reset();
                    document.getElementById('propFiles').value = '';
                    document.getElementById('uploadPreview').innerHTML = '';
                    renderProperties(currentFilter);
                    renderAdminProperties();
                    updateStats();
                    setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
                } else {
                    const errorData = await response.json();
                    statusDiv.textContent = '❌ خطا در ذخیره ملک: ' + (errorData.error || 'خطای ناشناخته');
                    statusDiv.style.color = '#e74c3c';
                }
            } catch (error) {
                statusDiv.textContent = '❌ خطا در ارتباط با سرور: ' + error.message;
                statusDiv.style.color = '#e74c3c';
            }
        });
    }

    // FILE PREVIEW
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

    // ADVISOR FORM
    const advForm = document.getElementById('advisorForm');
    if (advForm) {
        advForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('advisorName').value.trim();
            const phone = document.getElementById('advisorPhone').value.trim();
            const specialty = document.getElementById('advisorSpecialty').value.trim();

            if (!name || !phone) {
                alert('لطفاً نام و تلفن را وارد کنید');
                return;
            }

            const newAdvisor = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name: name,
                phone: phone,
                specialty: specialty || 'مشاور املاک',
                date: new Date().toLocaleDateString('fa-IR')
            };

            await fetch('/api/advisors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdvisor)
            });

            this.reset();
            renderAdvisors();
            populateAdvisorSelect();
            alert('✅ مشاور با موفقیت اضافه شد');
        });
    }

    // CONTACT FORM
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = this.querySelector('input[type="text"]').value.trim();
            const phone = this.querySelector('input[type="tel"]').value.trim();
            const desc = this.querySelector('textarea').value.trim();

            if (!name || !phone) {
                alert('لطفاً نام و شماره تماس را وارد کنید');
                return;
            }

            const newRequest = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name: name,
                phone: phone,
                type: 'مشاوره',
                desc: desc || '',
                status: 'جدید',
                date: new Date().toLocaleDateString('fa-IR'),
                time: new Date().toLocaleTimeString('fa-IR')
            };

            await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRequest)
            });

            alert('✅ پیام شما با موفقیت ارسال شد. کارشناسان ما با شما تماس خواهند گرفت.');
            this.reset();
        });
    }

    // INITIAL RENDERS
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