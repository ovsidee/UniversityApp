import { state, t, fetchApi, loadTranslations, checkSession, showError } from './utils.js';
import * as Auth from './auth.js';
import * as Students from './students.js';
import * as Courses from './courses.js';

// init of page
async function init() {
    await loadTranslations(state.currentLang);
    await checkSession();
    window.addEventListener('popstate', handleRouting);
    handleRouting();
}

// router of views
export function handleRouting() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    const publicRoutes = ['/', '/home', '/login', '/register', '/courses'];

    if (!state.currentUser && !publicRoutes.includes(path)) {
        window.navigateTo('/login');
        return;
    }

    if (path === '/' || path === '/home') renderHome();
    else if (path === '/login') Auth.renderLogin();
    else if (path === '/register') Auth.renderRegister();

    else if (path === '/students') Students.renderStudentList(page);
    else if (path === '/students/add') Students.renderStudentForm('Add');
    else if (path.startsWith('/students/view/')) Students.renderStudentView(path.split('/').pop());
    else if (path.startsWith('/students/edit/')) Students.renderStudentForm('Edit', path.split('/').pop());

    else if (path === '/courses') Courses.renderCourseList(page);
    else if (path === '/courses/add') Courses.renderCourseForm('Add');
    else if (path.startsWith('/courses/view/')) Courses.renderCourseView(path.split('/').pop());
    else if (path.startsWith('/courses/edit/')) Courses.renderCourseForm('Edit', path.split('/').pop());
    else if (path.startsWith('/courses/enroll/')) Courses.renderCourseEnrollForm(path.split('/').pop());

    else document.getElementById('app').innerHTML = `<h2>${t('404_title')}</h2><p>${t('404_msg')}</p>`;

    updateNav();
}

// home page (center of a screen)
function renderHome() {
    let actionButton = '';
    if (!state.currentUser)
        // anonymous user
        actionButton = `<button class="btn secondary" onclick="navigateTo('/login')">${t('hero_btn_login')}</button>`;
    else if (state.currentUser.role === 'admin')
        // admin user
        actionButton = `<button class="btn secondary" onclick="navigateTo('/students')">${t('students_nav')}</button>`;
    else if (state.currentUser.role === 'student' && state.currentUser.studentId)
        // student user
        actionButton = `<button class="btn secondary" onclick="navigateTo('/students/view/${state.currentUser.studentId}')">${t('my_profile')}</button>`;

    document.getElementById('app').innerHTML = `
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

// navigation bar (at the top)
function updateNav() {
    const navLinks = document.getElementById('nav-links');
    const brandEl = document.querySelector('.brand');
    if(brandEl) brandEl.innerText = t('brand');

    const langSwitch = `
        <li style="margin-left: 15px;">
            <a href="#" onclick="updateNavLang('en'); return false;" style="opacity: ${state.currentLang==='en'?'1':'0.5'}">EN</a> 
            |
            <a href="#" onclick="updateNavLang('pl'); return false;" style="opacity: ${state.currentLang==='pl'?'1':'0.5'}">PL</a>
        </li>
    `;

    if (state.currentUser) {
        const isAdmin = state.currentUser.role === 'admin';
        const isStudent = state.currentUser.role === 'student';

        navLinks.innerHTML = `
            <li><a href="#" onclick="navigateTo('/'); return false;">${t('home_nav')}</a></li>
            ${isAdmin ? `<li><a href="#" onclick="navigateTo('/students'); return false;">${t('students_nav')}</a></li>` : ''}
            ${(isStudent && state.currentUser.studentId) ? `<li><a href="#" onclick="navigateTo('/students/view/${state.currentUser.studentId}'); return false;">${t('my_profile')}</a></li>` : ''}
            <li><a href="#" onclick="navigateTo('/courses'); return false;">${t('courses_nav')}</a></li>
            <li style="margin-left:20px; color:#aaa">${t('welcome_user')}, ${state.currentUser.username}</li>
            <li><a href="#" onclick="logout(); return false;" style="color: #ff6b6b;">${t('logout_nav')}</a></li>
            ${langSwitch}
        `;
    } else {
        navLinks.innerHTML = `
            <li><a href="#" onclick="navigateTo('/'); return false;">${t('home_nav')}</a></li>
            <li><a href="#" onclick="navigateTo('/courses'); return false;">${t('courses_nav')}</a></li>
            <li><a href="#" onclick="navigateTo('/login'); return false;">${t('login_nav')}</a></li>
            <li><a href="#" onclick="navigateTo('/register'); return false;">${t('register_nav') || 'Register'}</a></li>
            ${langSwitch}
        `;
    }
}

window.navigateTo = function(path) {
    window.history.pushState({}, path, window.location.origin + path);
    handleRouting();
};

window.logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    state.currentUser = null;
    window.navigateTo('/login');
};

window.updateNavLang = (lang) => {
    loadTranslations(lang).then(() => {
        updateNav();
        handleRouting();
    });
};


// ----------delete handlers
window.deleteStudent = async (id) => {
    if(!confirm(t('confirm_delete'))) return;
    await fetchApi(`/api/students/${id}`, { method: 'DELETE' });
    handleRouting();
};

window.deleteCourse = async (id) => {
    if(!confirm(t('confirm_delete'))) return;
    await fetchApi(`/api/courses/${id}`, { method: 'DELETE' });
    handleRouting();
};

// ----------savers handlers
window.handleStudentSave = async (e, mode, id) => {
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
    if(res.ok) window.navigateTo('/students');
    else { const data = await res.json(); showError(t(data.error) || "Error"); }
};

window.handleCourseSave = async (e, mode, id) => {
    e.preventDefault();
    const body = { name: document.getElementById('c-name').value, credits: document.getElementById('c-cred').value };
    const url = mode === 'Add' ? '/api/courses' : `/api/courses/${id}`;
    const method = mode === 'Add' ? 'POST' : 'PUT';

    const res = await fetchApi(url, { method, body: JSON.stringify(body) });
    if (res.ok) window.navigateTo('/courses');
    else { const data = await res.json(); showError(t(data.error) || "Error"); }
};

// ----------enrollments handlers
window.handleEnrollSubmit = async (e, context, contextId) => {
    e.preventDefault();
    const selectValue = document.getElementById('select-item').value;
    const grade = document.getElementById('grade').value;
    const date = document.getElementById('date').value;

    let body = { grade: grade || null, enrollment_date: date };
    let url = context === 'student' ? `/api/students/${contextId}/enroll` : `/api/courses/${contextId}/enroll`;

    if (context === 'student') body.course_id = selectValue;
    else body.student_id = selectValue;

    const res = await fetchApi(url, { method: 'POST', body: JSON.stringify(body) });

    if(res.ok) window.navigateTo(context === 'student' ? `/students/view/${contextId}` : `/courses/view/${contextId}`);
    else { const json = await res.json(); showError(t(json.error) || "Error"); }
};

window.removeEnrollment = async (sid, cid, fromCourse = false) => {
    if(!confirm(t('confirm_unenroll'))) return;

    await fetchApi(`/api/students/${sid}/enroll/${cid}`, { method: 'DELETE' });

    handleRouting();
};

//---------update handlers
window.updateGrade = async (cid, sid) => {
    const gradeInput = document.getElementById(`grade-${sid}`);
    const gradeVal = parseFloat(gradeInput.value);

    if (isNaN(gradeVal) || gradeVal < 2 || gradeVal > 5) {
        const errorMsg = t('error_grade_range') || "Grade must be between 2 and 5";
        alert(errorMsg);
        handleRouting();
        return;
    }

    await fetchApi(`/api/courses/${cid}/grade/${sid}`, {
        method: 'PUT',
        body: JSON.stringify({ grade: gradeVal })
    });
    alert(t('btn_update') + ' OK');

    handleRouting();
};

// init the app
init();