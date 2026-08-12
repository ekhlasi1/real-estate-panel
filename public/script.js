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
        grid.innerHTML = `<div class="empty-state" style="text-align:center;padding:40px;color:var(--gray-500);">هیچ ملکی یافت نشد</div>`;
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
        grid.innerHTML = `<div class="empty-state" style="text-align:center;padding:40px;color:var(--gray-500);">نتیجه‌ای برای "${query}" یافت نشد</div>`;
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
}

// ============================================
// RENDER ADVISORS - با عکس پروفایل
// ============================================
function renderAdvisors() {
    const grid = document.getElementById('advisorGrid');
    if (!grid) return;

    // لیست مشاورین با عکس پروفایل
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
            <div class="avatar">
                ${a.avatar || '<i class="fas fa-user-tie"></i>'}
            </div>
            <h4>${a.name}</h4>
            <p>${a.agency || a.specialty || 'مشاور املاک'}</p>
            <button class="btn-profile" onclick="alert('پروفایل ${a.name}')">نمایش پروفایل</button>
        </div>
    `).join('');
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

    document.getElementById('resultTotal').textContent = formatPrice(Math.round(totalCommission));
    document.getElementById('resultOwner').textContent = formatPrice(Math.round(ownerShare));
    document.getElementById('resultTenant').textContent = formatPrice(Math.round(tenantShare));

    const details = document.getElementById('resultDetails');
    details.innerHTML = `
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

    // Menu toggle (mobile)
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.querySelector('.header-center nav');
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('open');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
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

    // Initial renders
    renderProperties('all');
    renderAdvisors();
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