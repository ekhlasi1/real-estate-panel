// ============================================
// DATA STORE (Local Storage)
// ============================================
const DB = {
    get(key, defaultVal = []) {
        try {
            return JSON.parse(localStorage.getItem('realestate_' + key)) || defaultVal;
        } catch {
            return defaultVal;
        }
    },
    set(key, val) {
        localStorage.setItem('realestate_' + key, JSON.stringify(val));
    }
};

// ============================================
// HELPERS
// ============================================
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
    if (!num) return '۰';
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

function renderProperties(filter = 'all') {
    const grid = document.getElementById('property-grid');
    if (!grid) return;

    let props = getProperties();
    if (filter === 'available') props = props.filter(p => p.status === 'موجود');
    else if (filter === 'sold') props = props.filter(p => p.status === 'فروش رفته');
    else if (filter === 'rented') props = props.filter(p => p.status === 'اجاره رفته');

    if (props.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">هیچ ملکی یافت نشد</p>`;
        return;
    }

    grid.innerHTML = props.map(p => {
        const advisor = getAdvisorById(p.advisorId);
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : '';

        return `
        <div class="property-card" data-id="${p.id}">
            <div class="image-wrapper">
                ${p.images && p.images.length > 0
                    ? `<img src="${p.images[0]}" alt="${p.title}">`
                    : `<i class="fas fa-building" style="font-size:40px;color:var(--text-muted);"></i>`
                }
                <span class="badge badge-${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">
                    ${p.status}
                </span>
            </div>
            <div class="body">
                <h3>${p.title}</h3>
                <div class="price">${formatPrice(p.price)} تومان</div>
                <p style="color:var(--text-muted);font-size:14px;margin:5px 0;">${p.address || ''}</p>
                <div class="advisor-contact">
                    <div class="advisor-info">
                        <i class="fas fa-user-tie" style="color:var(--gold);"></i>
                        <span>${advisorName}</span>
                    </div>
                    ${advisorPhone ? `
                    <div class="advisor-phone">
                        <i class="fas fa-phone" style="color:var(--success);"></i>
                        <a href="tel:${advisorPhone}" class="phone-link" onclick="trackPhoneClick('${p.id}')">
                            ${advisorPhone}
                        </a>
                    </div>
                    ` : `
                    <div class="advisor-phone" style="color:var(--text-muted);font-size:12px;">
                        <i class="fas fa-phone" style="color:var(--text-muted);"></i>
                        شماره تماس ثبت نشده
                    </div>
                    `}
                </div>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${p.type}</span>
                    <span class="date"><i class="fas fa-calendar-alt"></i> ${p.date || ''}</span>
                </div>
            </div>
        </div>
    `}).join('');

    updateStats();
}

// ============================================
// TRACK PHONE CLICK
// ============================================
function trackPhoneClick(propertyId) {
    const stats = JSON.parse(localStorage.getItem('realestate_phone_clicks') || '{}');
    if (!stats[propertyId]) stats[propertyId] = 0;
    stats[propertyId]++;
    localStorage.setItem('realestate_phone_clicks', JSON.stringify(stats));
}

function getPhoneClickStats() {
    return JSON.parse(localStorage.getItem('realestate_phone_clicks') || '{}');
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">هیچ ملکی وجود ندارد</td></tr>`;
        return;
    }

    tbody.innerHTML = props.map(p => {
        const advisor = getAdvisorById(p.advisorId);
        const advisorName = advisor ? advisor.name : 'نامشخص';
        const advisorPhone = advisor ? advisor.phone : 'ثبت نشده';
        
        return `
        <tr>
            <td>
                ${p.images && p.images.length > 0
                    ? `<img src="${p.images[0]}" class="thumb" alt="${p.title}">`
                    : `<div style="width:50px;height:50px;background:var(--secondary);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-building" style="color:var(--text-muted);"></i>
                       </div>`
                }
            </td>
            <td>${p.title}</td>
            <td>${p.type}</td>
            <td>${formatPrice(p.price)}</td>
            <td>${advisorName}</td>
            <td style="direction:ltr;text-align:center;font-weight:600;color:var(--gold);">${advisorPhone}</td>
            <td><span class="status-badge status-${p.status === 'موجود' ? 'available' : p.status === 'فروش رفته' ? 'sold' : 'rented'}">${p.status}</span></td>
            <td>
                <button onclick="deleteProperty('${p.id}')" class="action-btn danger"><i class="fas fa-trash"></i></button>
                <button onclick="togglePropertyStatus('${p.id}')" class="action-btn"><i class="fas fa-sync-alt"></i></button>
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
// ADVISORS CRUD
// ============================================
function renderAdvisors() {
    const container = document.getElementById('advisor-list');
    const grid = document.getElementById('advisor-stats-grid');
    if (!container) return;

    const advisors = getAdvisors();
    const props = getProperties();

    if (advisors.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">هیچ مشاوری ثبت نشده است</p>';
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
                <p style="font-size:12px;color:var(--gold-light);">${a.specialty || 'مشاور املاک'}</p>
                <div class="stats">
                    <span>${count} ملک</span>
                </div>
                <button onclick="deleteAdvisor('${a.id}')" style="background:transparent;border:none;color:var(--danger);cursor:pointer;margin-top:5px;">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
    }).join('');

    if (grid) {
        grid.innerHTML = advisors.map(a => {
            const count = props.filter(p => p.advisorId === a.id).length;
            return `
                <div class="advisor-card" style="padding:15px;">
                    <h4>${a.name}</h4>
                    <p style="color:var(--gold-light);">${count} ملک</p>
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
        advisors.map(a => `<option value="${a.id}">${a.name} (${a.phone})</option>`).join('');
}

// ============================================
// NOTES SYSTEM
// ============================================
function saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    if (!title || !content) {
        alert('لطفاً عنوان و متن یادداشت را وارد کنید');
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
    alert('✅ یادداشت با موفقیت ذخیره شد');
}

function renderNotes() {
    const container = document.getElementById('notes-list');
    if (!container) return;

    const notes = getNotes();
    if (notes.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">هیچ یادداشتی وجود ندارد</p>';
        return;
    }

    container.innerHTML = notes.slice().reverse().map(n => `
        <div style="background:var(--secondary);padding:15px;border-radius:8px;margin-bottom:10px;border-right:3px solid var(--gold);">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <h4 style="color:var(--gold);">${n.title}</h4>
                <div>
                    <button onclick="deleteNote('${n.id}')" style="background:transparent;border:none;color:var(--danger);cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p style="color:var(--text-muted);font-size:14px;margin:5px 0;">${n.content}</p>
            <small style="color:var(--text-muted);font-size:11px;">
                ${n.author || 'مدیر'} | ${n.date} ${n.time}
            </small>
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
// CONTACTS SYSTEM
// ============================================
function addContact() {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const desc = document.getElementById('contact-desc').value.trim();

    if (!name || !phone) {
        alert('لطفاً نام و شماره تماس را وارد کنید');
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
    alert('✅ مخاطب با موفقیت اضافه شد');
}

function renderContacts(filter = '') {
    const container = document.getElementById('contacts-list');
    if (!container) return;

    let contacts = getContacts();
    if (filter) {
        contacts = contacts.filter(c =>
            c.name.includes(filter) ||
            c.phone.includes(filter) ||
            c.desc.includes(filter)
        );
    }

    if (contacts.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">هیچ مخاطبی وجود ندارد</p>';
        return;
    }

    container.innerHTML = contacts.map(c => `
        <div style="background:var(--secondary);padding:12px 15px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
                <strong>${c.name}</strong>
                <span style="color:var(--gold);margin:0 10px;">${c.phone}</span>
                ${c.desc ? `<span style="color:var(--text-muted);font-size:13px;">${c.desc}</span>` : ''}
                <br><small style="color:var(--text-muted);font-size:11px;">افزوده شده توسط: ${c.addedBy || 'مدیر'} | ${c.date}</small>
            </div>
            <div>
                <button onclick="deleteContact('${c.id}')" style="background:transparent;border:none;color:var(--danger);cursor:pointer;padding:5px;">
                    <i class="fas fa-trash"></i>
                </button>
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
// REQUESTS SYSTEM
// ============================================
document.addEventListener('DOMContentLoaded', function() {
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

            alert('✅ درخواست شما با موفقیت ارسال شد. کارشناسان ما با شما تماس خواهند گرفت.');
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
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProperties(currentFilter);
        });
    });

    // Property form
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
            renderProperties(currentFilter);
            renderAdminProperties();
            updateStats();
            alert('✅ ملک با موفقیت اضافه شد');
        });
    }

    // Advisor form
    const advForm = document.getElementById('advisor-form');
    if (advForm) {
        advForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('advisor-name').value.trim();
            const phone = document.getElementById('advisor-phone').value.trim();
            const email = document.getElementById('advisor-email').value.trim();
            const password = document.getElementById('advisor-password').value.trim();
            const specialty = document.getElementById('advisor-specialty').value.trim();

            if (!name || !phone || !password) {
                alert('لطفاً تمام فیلدهای ضروری را پر کنید');
                return;
            }

            const advisors = getAdvisors();
            advisors.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name: name,
                phone: phone,
                email: email,
                password: password,
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
});

// ============================================
// REQUESTS RENDER
// ============================================
function renderRequests() {
    const container = document.getElementById('requests-table-body');
    if (!container) return;

    const requests = getRequests();
    if (requests.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">هیچ درخواستی وجود ندارد</td></tr>`;
        return;
    }

    container.innerHTML = requests.slice().reverse().map(r => `
        <tr>
            <td>${r.date} ${r.time}</td>
            <td>${r.name}</td>
            <td>${r.phone}</td>
            <td>${r.type}</td>
            <td><span class="status-badge status-${r.status === 'جدید' ? 'available' : 'sold'}">${r.status}</span></td>
            <td>
                <button onclick="updateRequestStatus('${r.id}','تماس گرفته شده')" class="action-btn" title="تماس گرفته شده">
                    <i class="fas fa-phone gold"></i>
                </button>
                <button onclick="updateRequestStatus('${r.id}','بسته شده')" class="action-btn danger" title="بسته شدن">
                    <i class="fas fa-times"></i>
                </button>
                <button onclick="deleteRequest('${r.id}')" class="action-btn danger" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
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
// BACKUP SYSTEM
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
            if (!data.properties || !data.advisors) {
                alert('❌ فایل بکاپ معتبر نیست');
                return;
            }

            if (!confirm('⚠️ آیا از بازگردانی اطلاعات مطمئن هستید؟ اطلاعات فعلی جایگزین خواهد شد.')) return;

            setProperties(data.properties || []);
            setAdvisors(data.advisors || []);
            if (data.notes) setNotes(data.notes);
            if (data.contacts) setContacts(data.contacts);
            if (data.requests) setRequests(data.requests);

            alert('✅ اطلاعات با موفقیت بازگردانی شد');
            location.reload();
        } catch(err) {
            alert('❌ خطا در بازگردانی فایل: ' + err.message);
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
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">هیچ بکاپی موجود نیست</p>';
        return;
    }

    container.innerHTML = backups.slice().reverse().map(b => `
        <div style="background:var(--secondary);padding:12px 15px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <i class="fas fa-file-archive gold"></i>
                <span>بکاپ ${b.date} ${b.time}</span>
                <small style="color:var(--text-muted);margin-right:10px;">حجم: ${Math.round(b.size/1024)} KB</small>
                ${b.auto ? '<span style="color:var(--gold);font-size:11px;"> (خودکار)</span>' : ''}
            </div>
            <div>
                <button onclick="deleteBackup('${b.id}')" style="background:transparent;border:none;color:var(--danger);cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
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
// AUTO BACKUP AT 24:00
// ============================================
function checkAutoBackup() {
    const now = new Date();
    const lastBackup = localStorage.getItem('realestate_last_backup');
    const today = now.toDateString();

    if (now.getHours() === 0 && now.getMinutes() === 0) {
        if (lastBackup !== today) {
            console.log('🔄 Running auto backup at 24:00');
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
            console.log('✅ Auto backup completed');
        }
    }
}

setInterval(checkAutoBackup, 60000);
checkAutoBackup();

// ============================================
// REPORTS
// ============================================
function generateReport(type) {
    const props = getProperties();
    const advisors = getAdvisors();
    let report = '';

    if (type === 'sales') {
        const sold = props.filter(p => p.status === 'فروش رفته');
        const total = sold.reduce((sum, p) => sum + Number(p.price || 0), 0);
        report = `📊 گزارش فروش ماهانه\n\n`;
        report += `تعداد فروش: ${sold.length}\n`;
        report += `مجموع فروش: ${formatPrice(total)} تومان\n\n`;
        sold.forEach(p => {
            report += `- ${p.title}: ${formatPrice(p.price)} تومان (${p.date})\n`;
        });
    } else if (type === 'advisors') {
        report = `📊 گزارش عملکرد مشاورین\n\n`;
        advisors.forEach(a => {
            const count = props.filter(p => p.advisorId === a.id).length;
            const sold = props.filter(p => p.advisorId === a.id && p.status === 'فروش رفته').length;
            report += `👤 ${a.name} (${a.phone})\n`;
            report += `   کل ملک‌ها: ${count}\n`;
            report += `   فروش: ${sold}\n\n`;
        });
    } else {
        const clicks = getPhoneClickStats();
        const totalClicks = Object.values(clicks).reduce((sum, val) => sum + val, 0);
        report = `📊 گزارش کامل سیستم\n\n`;
        report += `🏠 کل ملک‌ها: ${props.length}\n`;
        report += `   موجود: ${props.filter(p => p.status === 'موجود').length}\n`;
        report += `   فروش رفته: ${props.filter(p => p.status === 'فروش رفته').length}\n`;
        report += `   اجاره رفته: ${props.filter(p => p.status === 'اجاره رفته').length}\n\n`;
        report += `👥 مشاورین: ${advisors.length}\n\n`;
        report += `📝 یادداشت‌ها: ${getNotes().length}\n`;
        report += `📇 مخاطبین: ${getContacts().length}\n`;
        report += `🤝 درخواست‌ها: ${getRequests().length}\n`;
        report += `📞 تماس‌های ثبت‌شده: ${totalClicks}\n`;
    }

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${type}-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    if (confirm('آیا از خروج مطمئن هستید؟')) {
        window.location.href = '/';
    }
}