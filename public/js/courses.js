import { t, fetchApi, state, showError } from './utils.js';

export async function renderCourseList(page = 1) {
    const app = document.getElementById('app');
    app.innerHTML = 'Loading...';
    const res = await fetchApi(`/api/courses?page=${page}`);
    const { data, meta } = await res.json();

    const isAdmin = state.currentUser && state.currentUser.role === 'admin';
    const isLoggedIn = !!state.currentUser;

    let html = `<div class="header-flex"><h2>${t('page_courses_title')}</h2>`;
    if(isAdmin) html += `<button class="btn" onclick="navigateTo('/courses/add')">${t('btn_add_course')}</button>`;

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

export async function renderCourseView(id) {
    const app = document.getElementById('app');
    app.innerHTML = 'Loading...';
    const res = await fetchApi(`/api/courses/${id}`);
    if(!res.ok) { const json = await res.json(); app.innerHTML = `<h2>${t(json.error) || t('access_denied')}</h2>`; return; }

    const { course, students } = await res.json();
    const isAdmin = state.currentUser.role === 'admin';

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
        <table><thead><tr><th>${t('table_name')}</th><th>${t('table_grade')}</th><th>${t('table_actions')}</th></tr></thead><tbody>
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

export async function renderCourseForm(mode, id = null) {
    const app = document.getElementById('app');
    let course = { Name: '', Credits: '' };
    if (mode === 'Edit') { const res = await fetchApi(`/api/courses/${id}`); const data = await res.json(); course = data.course; }
    const title = mode === 'Add' ? t('btn_add_course') : t('btn_edit');
    const btnText = mode === 'Add' ? t('btn_save') : t('btn_update');

    app.innerHTML = `
        <h2>${title}</h2><form class="form-card" onsubmit="handleCourseSave(event, '${mode}', ${id})">
            <div class="form-group"><label>${t('label_coursename')}</label><input type="text" id="c-name" value="${course.Name}" required></div>
            <div class="form-group"><label>${t('label_credits')}</label><input type="number" id="c-cred" value="${course.Credits}" required></div>
            <button type="submit" class="btn">${btnText}</button><button type="button" class="btn secondary" onclick="navigateTo('/courses')">${t('btn_cancel')}</button>
        </form>
    `;
}

export async function renderCourseEnrollForm(id) {
    const app = document.getElementById('app');
    app.innerHTML = 'Loading...';
    try {
        const courseRes = await fetchApi(`/api/courses/${id}`); const { course } = await courseRes.json();
        const studentsRes = await fetchApi(`/api/students?all=true`); const students = await studentsRes.json();
        app.innerHTML = `
            <h2>${t('btn_enroll')}</h2><div id="msg" class="alert error" style="display:none"></div>
            <div class="card detail-card"><h3>Course: ${course.Name}</h3><p>${t('label_select_student')}...</p></div>
            <form class="form-card" style="margin-top: 20px;" onsubmit="handleEnrollSubmit(event, 'course', ${course.ID})">
                <div class="form-group"><label>${t('label_select_student')}:</label><select id="select-item" required style="width: 100%; padding: 8px;"><option value="" disabled selected>-- ${t('label_select_student')} --</option>${students.map(s => `<option value="${s.ID}">${s.First_Name} ${s.Last_Name} (${s.Email})</option>`).join('')}</select></div>
                <div class="form-group"><label>${t('label_grade')}:</label><input type="number" id="grade" step="0.5"></div>
                <div class="form-group"><label>${t('label_date')}:</label><input type="date" id="date" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="actions"><button type="submit" class="btn">${t('btn_save')}</button><button type="button" class="btn secondary" onclick="navigateTo('/courses/view/${course.ID}')">${t('btn_cancel')}</button></div>
            </form>
        `;
    } catch (e) { console.error(e); }
}