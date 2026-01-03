const app = document.getElementById('app');
const navLinks = document.getElementById('nav-links');

// Global State
let currentUser = null;
let currentLang = localStorage.getItem('lang') || 'en';
let translations = {};

// --- 1. INITIALIZATION ---
async function init() {
    await loadTranslations(currentLang); // Fetch en.json or pl.json
    await checkSession();

    window.addEventListener('popstate', handleRouting);
    handleRouting();
}

// --- 2. I18N HELPER ---
async function loadTranslations(lang) {
    try {
        const res = await fetch(`/api/locales/${lang}`);
        translations = await res.json();
        currentLang = lang;
        localStorage.setItem('lang', lang);
        updateNav();
        // If we switch lang, re-render current view
        const path = window.location.pathname;
        if (path) handleRouting();
    } catch (e) {
        console.error("Failed to load translations", e);
    }
}

function t(key) {
    return translations[key] || key;
}

// --- 3. ROUTING ---
function navigateTo(path) {
    window.history.pushState({}, path, window.location.origin + path);
    handleRouting();
}

function handleRouting() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    const publicRoutes = ['/', '/home', '/login', '/register', '/courses'];

    if (!currentUser && !publicRoutes.includes(path)) {
        navigateTo('/login');
        return;
    }

    // Switch
    if (path === '/' || path === '/home') renderHome();
    else if (path === '/login') renderLogin();
    else if (path === '/register') renderRegister();

    // Students
    else if (path === '/students') renderStudentList(page);
    else if (path === '/students/add') renderStudentForm('Add');
    else if (path.startsWith('/students/view/')) renderStudentView(path.split('/').pop());
    else if (path.startsWith('/students/edit/')) renderStudentForm('Edit', path.split('/').pop());
    else if (path.startsWith('/students/enroll/')) renderStudentEnrollForm(path.split('/').pop());

    // Courses
    else if (path === '/courses') renderCourseList(page);
    else if (path === '/courses/add') renderCourseForm('Add');
    else if (path.startsWith('/courses/view/')) renderCourseView(path.split('/').pop());
    else if (path.startsWith('/courses/edit/')) renderCourseForm('Edit', path.split('/').pop());
    else if (path.startsWith('/courses/enroll/')) renderCourseEnrollForm(path.split('/').pop());

    else renderNotFound();

    updateNav();
}

async function fetchApi(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
        currentUser = null;
        navigateTo('/login');
        throw new Error("Unauthorized");
    }
    return res;
}

// --- 4. NAVIGATION BAR (with Lang Switcher) ---
function updateNav() {
    // Language Switcher HTML
    const langSwitch = `
        <li style="margin-left: 15px;">
            <a href="#" onclick="loadTranslations('en'); return false;" style="opacity: ${currentLang==='en'?'1':'0.5'}">EN</a> |
            <a href="#" onclick="loadTranslations('pl'); return false;" style="opacity: ${currentLang==='pl'?'1':'0.5'}">PL</a>
        </li>
    `;

    if (currentUser) {
        const isAdmin = currentUser.role === 'admin';
        const isStudent = currentUser.role === 'student';

        let menuItems = `<li><a href="#" onclick="navigateTo('/'); return false;">${t('home_nav')}</a></li>`;

        if (isAdmin) {
            menuItems += `<li><a href="#" onclick="navigateTo('/students'); return false;">${t('students_nav')}</a></li>`;
        } else if (isStudent && currentUser.studentId) {
            menuItems += `<li><a href="#" onclick="navigateTo('/students/view/${currentUser.studentId}'); return false;">${t('my_profile')}</a></li>`;
        }

        menuItems += `<li><a href="#" onclick="navigateTo('/courses'); return false;">${t('courses_nav')}</a></li>`;
        menuItems += `<li style="margin-left:20px; color:#aaa">${t('welcome_user')}, ${currentUser.username}</li>`;
        menuItems += `<li><a href="#" onclick="navigateTo('/logout'); logout(); return false;" style="color: #ff6b6b;">${t('logout_nav')}</a></li>`; // Fixed href/onclick

        navLinks.innerHTML = menuItems + langSwitch;
    } else {
        navLinks.innerHTML = `
            <li><a href="#" onclick="navigateTo('/'); return false;">${t('home_nav')}</a></li>
            <li><a href="#" onclick="navigateTo('/courses'); return false;">${t('courses_nav')}</a></li>
            <li><a href="#" onclick="navigateTo('/login'); return false;">${t('login_nav')}</a></li>
            <li><a href="#" onclick="navigateTo('/register'); return false;">${t('register_nav') || 'Register'}</a></li>
            ${langSwitch}
        `;
    }
    // Update Brand in Nav (if you have ID for it, or just use document.title)
    document.title = t('brand');
    const brandEl = document.querySelector('.brand');
    if(brandEl) brandEl.innerText = t('brand');
}

// --- 5. AUTH VIEWS ---
function renderLogin() {
    app.innerHTML = `
        <h2>${t('login_title')}</h2>
        <div id="msg" class="alert error" style="display:none"></div>
        <form class="form-card" onsubmit="handleLogin(event)">
            <div class="form-group"><label>${t('label_username')}</label><input type="text" id="username" required></div>
            <div class="form-group"><label>${t('label_password')}</label><input type="password" id="password" required></div>
            <button type="submit" class="btn">${t('login_btn')}</button>
            <p><a href="#" onclick="navigateTo('/register'); return false;">${t('register_link')}</a></p>
        </form>
    `;
}

function renderRegister() {
    app.innerHTML = `
        <h2>${t('register_title')}</h2>
        <div id="msg" class="alert error" style="display:none"></div>
        <form class="form-card" onsubmit="handleRegister(event)">
            <div class="form-group"><label>${t('label_username')}</label><input type="text" id="reg-user" required></div>
            <div class="form-group">
                <label>${t('label_password')}</label>
                <input type="password" id="reg-pass" required>
                <small style="color: #666; display: block; margin-top: 5px;">${t('password_hint')}</small>
            </div>
            
            <h3 style="font-size: 1rem; margin-bottom: 15px; color: #555;">${t('student_profile_details')}</h3>

            <div class="form-group"><label>${t('label_firstname')}</label><input type="text" id="reg-fn" required></div>
            <div class="form-group"><label>${t('label_lastname')}</label><input type="text" id="reg-ln" required></div>
            <div class="form-group"><label>${t('label_email')}</label><input type="email" id="reg-email" required></div>
            <div class="form-group"><label>${t('label_phone')}</label><input type="text" id="reg-phone"></div>
            <button type="submit" class="btn">${t('register_btn')}</button>
        </form>
    `;
}

// --- 6. STUDENT VIEWS ---

async function renderStudentList(page = 1) {
    app.innerHTML = 'Loading...';
    try {
        const res = await fetchApi(`/api/students?page=${page}`);
        const { data, meta } = await res.json();
        const isAdmin = currentUser.role === 'admin';

        let html = `<div class="header-flex"><h2>${t('page_students_title')}</h2>`;
        if(isAdmin) html += `<button class="btn" onclick="navigateTo('/students/add')">${t('btn_add_student')}</button>`;
        html += `</div><table><thead><tr>
            <th>${t('table_id')}</th>
            <th>${t('table_name')}</th>
            <th>${t('table_email')}</th>
            <th>${t('table_actions')}</th>
        </tr></thead><tbody>`;

        if (data.length === 0) html += `<tr><td colspan="4">${t('no_students')}</td></tr>`;

        data.forEach(s => {
            html += `<tr>
                <td>${s.ID}</td>
                <td>${s.First_Name} ${s.Last_Name}</td>
                <td>${s.Email}</td>
                <td>
                    <button class="btn-sm view" onclick="navigateTo('/students/view/${s.ID}')">${t('btn_view')}</button>
                    ${isAdmin ? `
                        <button class="btn-sm edit" onclick="navigateTo('/students/edit/${s.ID}')">${t('btn_edit')}</button>
                        <button class="btn-sm delete" onclick="deleteStudent(${s.ID})">${t('btn_delete')}</button>
                    ` : ''}
                </td>
            </tr>`;
        });
        html += `</tbody></table>`;

        // Pagination
        html += `<div class="pagination" style="margin-top: 20px; text-align: center;">`;
        if (meta.currentPage > 1) {
            html += `<button class="btn secondary" onclick="navigateTo('/students?page=${meta.currentPage - 1}')">${t('btn_prev')}</button> `;
        }
        html += `<span style="margin: 0 10px;">${t('page_info')} ${meta.currentPage} / ${meta.totalPages}</span> `;
        if (meta.currentPage < meta.totalPages) {
            html += `<button class="btn secondary" onclick="navigateTo('/students?page=${meta.currentPage + 1}')">${t('btn_next')}</button>`;
        }
        html += `</div>`;

        app.innerHTML = html;
    } catch(e) { console.error(e); }
}

async function renderStudentView(id) {
    app.innerHTML = 'Loading...';
    const res = await fetchApi(`/api/students/${id}`);
    if(!res.ok) {
        const json = await res.json();
        app.innerHTML = `<h2>${t(json.error) || t('access_denied')}</h2>`;
        return;
    }

    const { student, enrollments } = await res.json();
    const isAdmin = currentUser.role === 'admin';

    let html = `
        <div class="card detail-card">
            <h2>${student.First_Name} ${student.Last_Name}</h2>
            <p><strong>${t('table_email')}:</strong> ${student.Email}</p>
            <p><strong>${t('label_phone')}:</strong> ${student.PhoneNumber || '-'}</p>
            <div style="margin-top: 15px;">
                ${isAdmin ? `<button class="btn" onclick="navigateTo('/students/edit/${student.ID}')">${t('btn_edit')}</button>` : ''}
                ${isAdmin ? `<button class="btn" style="background-color: #28a745;" onclick="navigateTo('/students/enroll/${student.ID}')">${t('btn_enroll')}</button>` : ''}
                
                ${isAdmin ? `<button class="btn secondary" onclick="navigateTo('/students')">${t('btn_cancel')}</button>` : ''}
            </div>
        </div>
        <h3>${t('detail_enrolled_title')}</h3>
        <table><thead><tr>
            <th>${t('label_coursename')}</th>
            <th>${t('label_credits')}</th>
            <th>${t('table_grade')}</th>
            <th>${t('table_date')}</th>
            <th>${t('table_actions')}</th>
        </tr></thead><tbody>
    `;

    if(enrollments.length === 0) html += `<tr><td colspan="5">${t('no_enrollments')}</td></tr>`;
    enrollments.forEach(e => {
        html += `<tr>
            <td>${e.Name}</td>
            <td>${e.Credits}</td>
            <td>${e.grade || '-'}</td>
            <td>${e.enrollment_date}</td>
            <td>
                ${isAdmin ? `<button class="btn-sm delete" onclick="removeEnrollment('${student.ID}', '${e.course_ID}')">${t('btn_remove')}</button>` : `<span style="color:#999">${t('text_read_only')}</span>`}
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    app.innerHTML = html;
}

// ENROLL STUDENT FORM
async function renderStudentEnrollForm(id) {
    app.innerHTML = 'Loading...';
    try {
        const studentRes = await fetchApi(`/api/students/${id}`);
        const { student } = await studentRes.json();
        const coursesRes = await fetchApi(`/api/courses?all=true`);
        const courses = await coursesRes.json();

        app.innerHTML = `
            <h2>${t('btn_enroll')}</h2>
            <div id="msg" class="alert error" style="display:none"></div>
            
            <div class="card detail-card">
                <h3>${student.First_Name} ${student.Last_Name}</h3>
                <p>${t('label_select_course')}...</p>
            </div>

            <form class="form-card" style="margin-top: 20px;" onsubmit="handleEnrollSubmit(event, 'student', ${student.ID})">
                <div class="form-group">
                    <label>${t('label_select_course')}:</label>
                    <select id="select-item" required style="width: 100%; padding: 8px;">
                        <option value="" disabled selected>-- ${t('label_select_course')} --</option>
                        ${courses.map(c => `<option value="${c.ID}">${c.Name} (${c.Credits} credits)</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>${t('label_grade')}:</label>
                    <input type="number" id="grade" step="0.5" min="2" max="5" placeholder="e.g. 4.5">
                </div>
                <div class="form-group">
                    <label>${t('label_date')}:</label>
                    <input type="date" id="date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="actions">
                    <button type="submit" class="btn">${t('btn_save')}</button>
                    <button type="button" class="btn secondary" onclick="navigateTo('/students/view/${student.ID}')">${t('btn_cancel')}</button>
                </div>
            </form>
        `;
    } catch (e) { console.error(e); }
}

async function renderStudentForm(mode, id = null) {
    let student = { First_Name: '', Last_Name: '', Email: '', PhoneNumber: '' };
    if (mode === 'Edit') {
        const res = await fetchApi(`/api/students/${id}`);
        const data = await res.json();
        student = data.student;
    }

    // Determine Title based on mode
    const title = mode === 'Add' ? t('btn_add_student') : t('btn_edit');
    const btnText = mode === 'Add' ? t('btn_save') : t('btn_update');

    app.innerHTML = `
        <h2>${title}</h2>
        <div id="msg" class="alert error" style="display:none"></div>
        <form class="form-card" onsubmit="handleStudentSave(event, '${mode}', ${id})">
            <div class="form-group"><label>${t('label_firstname')}</label><input type="text" id="fn" value="${student.First_Name}" required></div>
            <div class="form-group"><label>${t('label_lastname')}</label><input type="text" id="ln" value="${student.Last_Name}" required></div>
            <div class="form-group"><label>${t('label_email')}</label><input type="email" id="em" value="${student.Email}" required></div>
            <div class="form-group"><label>${t('label_phone')}</label><input type="text" id="ph" value="${student.PhoneNumber || ''}"></div>
            <button type="submit" class="btn">${btnText}</button>
            <button type="button" class="btn secondary" onclick="navigateTo('/students')">${t('btn_cancel')}</button>
        </form>
    `;
}

// --- 7. COURSE VIEWS ---

async function renderCourseList(page = 1) {
    app.innerHTML = 'Loading...';
    const res = await fetchApi(`/api/courses?page=${page}`);
    const { data, meta } = await res.json();

    // Check if user exists, if not, assume guest
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isLoggedIn = !!currentUser; // boolean check

    let html = `<div class="header-flex"><h2>${t('page_courses_title')}</h2>`;
    if(isAdmin) html += `<button class="btn" onclick="navigateTo('/courses/add')">${t('btn_add_course')}</button>`;

    // Only show "Actions" column if logged in
    html += `</div><table><thead><tr>
        <th>${t('table_id')}</th>
        <th>${t('table_name')}</th>
        <th>${t('table_credits')}</th>
        ${isLoggedIn ? `<th>${t('table_actions')}</th>` : ''} 
    </tr></thead><tbody>`;

    if (data.length === 0) html += `<tr><td colspan="4">${t('no_courses')}</td></tr>`;

    data.forEach(c => {
        html += `<tr>
            <td>${c.ID}</td><td>${c.Name}</td><td>${c.Credits}</td>
            ${isLoggedIn ? `
                <td>
                    <button class="btn-sm view" onclick="navigateTo('/courses/view/${c.ID}')">${t('btn_view')}</button>
                    ${isAdmin ? `
                        <button class="btn-sm edit" onclick="navigateTo('/courses/edit/${c.ID}')">${t('btn_edit')}</button>
                        <button class="btn-sm delete" onclick="deleteCourse(${c.ID})">${t('btn_delete')}</button>
                    `:''}
                </td>
            ` : ''} 
        </tr>`;
    });
    html += `</tbody></table>`;

    // Pagination
    html += `<div class="pagination" style="margin-top: 20px; text-align: center;">`;
    if (meta.currentPage > 1) {
        html += `<button class="btn secondary" onclick="navigateTo('/courses?page=${meta.currentPage - 1}')">${t('btn_prev')}</button> `;
    }
    html += `<span style="margin: 0 10px;">${t('page_info')} ${meta.currentPage} / ${meta.totalPages}</span> `;
    if (meta.currentPage < meta.totalPages) {
        html += `<button class="btn secondary" onclick="navigateTo('/courses?page=${meta.currentPage + 1}')">${t('btn_next')}</button>`;
    }
    html += `</div>`;

    app.innerHTML = html;
}

async function renderCourseView(id) {
    const res = await fetchApi(`/api/courses/${id}`);
    const { course, students } = await res.json();
    const isAdmin = currentUser.role === 'admin';

    let html = `
        <div class="card detail-card">
            <h2>${course.Name}</h2>
            <p><strong>${t('label_credits')}:</strong> ${course.Credits}</p>
            <div style="margin-top:15px">
                ${isAdmin ? `<button class="btn" onclick="navigateTo('/courses/edit/${course.ID}')">${t('btn_edit')}</button>` : ''}
                ${isAdmin ? `<button class="btn" style="background-color: #28a745;" onclick="navigateTo('/courses/enroll/${course.ID}')">${t('btn_enroll')}</button>` : ''}
                <button class="btn secondary" onclick="navigateTo('/courses')">${t('btn_cancel')}</button>
            </div>
        </div>
        <h3>${t('detail_course_students')}</h3>
        <table><thead><tr>
            <th>${t('table_name')}</th>
            <th>${t('table_grade')}</th>
            <th>${t('table_actions')}</th>
        </tr></thead><tbody>
    `;

    if(students.length === 0) html += `<tr><td colspan="3">${t('no_enrollments')}</td></tr>`;
    students.forEach(s => {
        html += `<tr>
            <td>${s.First_Name} ${s.Last_Name}</td>
            <td>
                ${isAdmin ? `
                    <div style="display:flex; gap:5px; align-items:center;">
                        <input type="number" id="grade-${s.ID}" value="${s.grade||''}" step="0.5" min="2" max="5" style="width:60px; padding:5px">
                        <button class="btn-sm edit" onclick="updateGrade(${course.ID}, ${s.ID})">${t('btn_update')}</button>
                    </div>
                ` : (s.grade || 'N/A')}
            </td>
            <td>
                ${isAdmin ? `
                    <button class="btn-sm delete" onclick="removeEnrollment('${s.ID}', '${course.ID}', true)">${t('btn_remove')}</button>
                ` : `<span style="color:#999">${t('text_read_only')}</span>`}
            </td>
        </tr>`;
    });
    html += `</tbody></table>`;
    app.innerHTML = html;
}

// ENROLL COURSE FORM
async function renderCourseEnrollForm(id) {
    app.innerHTML = 'Loading...';
    try {
        const courseRes = await fetchApi(`/api/courses/${id}`);
        const { course } = await courseRes.json();
        const studentsRes = await fetchApi(`/api/students?all=true`);
        const students = await studentsRes.json();

        app.innerHTML = `
            <h2>Add Student to Course</h2>
            <div id="msg" class="alert error" style="display:none"></div>

            <div class="card detail-card">
                <h3>Course: ${course.Name}</h3>
                <p>${t('label_select_student')}...</p>
            </div>

            <form class="form-card" style="margin-top: 20px;" onsubmit="handleEnrollSubmit(event, 'course', ${course.ID})">
                <div class="form-group">
                    <label>${t('label_select_student')}:</label>
                    <select id="select-item" required style="width: 100%; padding: 8px;">
                        <option value="" disabled selected>-- ${t('label_select_student')} --</option>
                        ${students.map(s => `<option value="${s.ID}">${s.First_Name} ${s.Last_Name} (${s.Email})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>${t('label_grade')}:</label>
                    <input type="number" id="grade" step="0.5" min="2" max="5" placeholder="e.g. 4.5">
                </div>
                <div class="form-group">
                    <label>${t('label_date')}:</label>
                    <input type="date" id="date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="actions">
                    <button type="submit" class="btn">${t('btn_save')}</button>
                    <button type="button" class="btn secondary" onclick="navigateTo('/courses/view/${course.ID}')">${t('btn_cancel')}</button>
                </div>
            </form>
        `;
    } catch (e) { console.error(e); }
}

async function renderCourseForm(mode, id = null) {
    let course = { Name: '', Credits: '' };
    if (mode === 'Edit') {
        const res = await fetchApi(`/api/courses/${id}`);
        const data = await res.json();
        course = data.course;
    }

    const title = mode === 'Add' ? t('btn_add_course') : t('btn_edit');
    const btnText = mode === 'Add' ? t('btn_save') : t('btn_update');

    app.innerHTML = `
        <h2>${title}</h2>
        <form class="form-card" onsubmit="handleCourseSave(event, '${mode}', ${id})">
            <div class="form-group"><label>${t('label_coursename')}</label><input type="text" id="c-name" value="${course.Name}" required></div>
            <div class="form-group"><label>${t('label_credits')}</label><input type="number" id="c-cred" value="${course.Credits}" required></div>
            <button type="submit" class="btn">${btnText}</button>
            <button type="button" class="btn secondary" onclick="navigateTo('/courses')">${t('btn_cancel')}</button>
        </form>
    `;
}

function renderHome() {
    let actionButton = '';

    // Logic to determine the second button based on Role
    if (!currentUser) {
        // Guest -> Login
        actionButton = `<button class="btn secondary" onclick="navigateTo('/login')">${t('hero_btn_login')}</button>`;
    } else if (currentUser.role === 'admin') {
        // Admin -> View All Students
        actionButton = `<button class="btn secondary" onclick="navigateTo('/students')">${t('students_nav')}</button>`;
    } else if (currentUser.role === 'student' && currentUser.studentId) {
        // Student -> View My Profile
        actionButton = `<button class="btn secondary" onclick="navigateTo('/students/view/${currentUser.studentId}')">${t('my_profile')}</button>`;
    }

    app.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <h1>${t('hero_title')}</h1>
            <p>${t('hero_subtitle')}</p>
            <div style="margin-top:30px">
                <button class="btn" onclick="navigateTo('/courses')">${t('hero_btn_view_courses')}</button>
                ${actionButton}
            </div>
        </div>

        <div class="features" style="display: flex; gap: 20px; margin-top: 40px; justify-content: space-around; flex-wrap: wrap;">
            <div class="card detail-card" style="flex: 1; min-width: 250px; text-align: center;">
                <h3>${t('feat_students_title')}</h3>
                <p>${t('feat_students_desc')}</p>
            </div>
            <div class="card detail-card" style="flex: 1; min-width: 250px; text-align: center;">
                <h3>${t('feat_courses_title')}</h3>
                <p>${t('feat_courses_desc')}</p>
            </div>
        </div>
    `;
}

function renderNotFound() { app.innerHTML = `<h2>${t('404_title')}</h2><p>${t('404_msg')}</p>`; }

// --- 8. ACTIONS / HANDLERS ---

async function checkSession() {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            if (data.isAuthenticated) currentUser = data.user;
        }
    } catch (e) { currentUser = null; }
}

async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();
    if(res.ok) {
        currentUser = data.user;
        navigateTo('/');
    } else {
        showError(t(data.error) || "Login failed");
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const body = {
        username: document.getElementById('reg-user').value,
        password: document.getElementById('reg-pass').value,
        first_name: document.getElementById('reg-fn').value,
        last_name: document.getElementById('reg-ln').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value
    };

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });

    if(res.ok) navigateTo('/login');
    else {
        const data = await res.json();
        showError(t(data.error) || data.error);
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    navigateTo('/login');
}

// Student Actions
async function handleStudentSave(e, mode, id) {
    e.preventDefault();
    const body = {
        first_name: document.getElementById('fn').value,
        last_name: document.getElementById('ln').value,
        email: document.getElementById('em').value,
        phone: document.getElementById('ph').value
    };

    const url = mode === 'Add' ? '/api/students' : `/api/students/${id}`;
    const method = mode === 'Add' ? 'POST' : 'PUT';

    const res = await fetchApi(url, { method, body: JSON.stringify(body) });
    if(res.ok) navigateTo('/students');
    else {
        const data = await res.json();
        showError(t(data.error) || "Error");
    }
}

async function deleteStudent(id) {
    if(!confirm(t('confirm_delete'))) return;
    await fetchApi(`/api/students/${id}`, { method: 'DELETE' });
    renderStudentList();
}

// Course Actions
async function handleCourseSave(e, mode, id) {
    e.preventDefault();
    const body = {
        name: document.getElementById('c-name').value,
        credits: document.getElementById('c-cred').value
    };

    const url = mode === 'Add' ? '/api/courses' : `/api/courses/${id}`;
    const method = mode === 'Add' ? 'POST' : 'PUT';

    const res = await fetchApi(url, { method, body: JSON.stringify(body) });

    if (res.ok) {
        navigateTo('/courses');
    } else {
        const data = await res.json();
        // This will look up "error_course_exists" in your json file
        showError(t(data.error) || "Error saving course");
    }
}

async function deleteCourse(id) {
    if(!confirm(t('confirm_delete'))) return;
    await fetchApi(`/api/courses/${id}`, { method: 'DELETE' });
    renderCourseList();
}

// Unified Enrollment Submit Handler
async function handleEnrollSubmit(e, context, contextId) {
    e.preventDefault();

    const selectValue = document.getElementById('select-item').value;
    const grade = document.getElementById('grade').value;
    const date = document.getElementById('date').value;

    let body = { grade: grade || null, enrollment_date: date };
    let url = '';

    if (context === 'student') {
        body.course_id = selectValue;
        url = `/api/students/${contextId}/enroll`;
    } else {
        body.student_id = selectValue;
        url = `/api/courses/${contextId}/enroll`;
    }

    const res = await fetchApi(url, { method: 'POST', body: JSON.stringify(body) });

    if(res.ok) {
        if (context === 'student') navigateTo(`/students/view/${contextId}`);
        else navigateTo(`/courses/view/${contextId}`);
    } else {
        const json = await res.json();
        showError(t(json.error) || "Enrollment failed");
    }
}

async function removeEnrollment(studentId, courseId, fromCourseView = false) {
    if(!confirm(t('confirm_unenroll'))) return;
    await fetchApi(`/api/students/${studentId}/enroll/${courseId}`, { method: 'DELETE' });
    if (fromCourseView) renderCourseView(courseId);
    else renderStudentView(studentId);
}

async function updateGrade(courseId, studentId) {
    const gradeVal = document.getElementById(`grade-${studentId}`).value;
    await fetchApi(`/api/courses/${courseId}/grade/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({ grade: gradeVal })
    });
    alert(t('btn_update') + ' OK');
}

// Utils
function showError(msg) {
    const el = document.getElementById('msg');
    if(el) { el.innerText = msg; el.style.display = 'block'; }
    else alert(msg);
}

// Start App
init();