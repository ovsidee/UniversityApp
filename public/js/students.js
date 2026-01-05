import { t, fetchApi, state, showError } from './utils.js';

export async function renderStudentList(page = 1) {
    const app = document.getElementById('app');

    if (!state.currentUser) {
        window.navigateTo('/login');
        return;
    }

    app.innerHTML = 'Loading...';
    try {
        const res = await fetchApi(`/api/students?page=${page}`);
        const { data, meta } = await res.json();
        const isAdmin = state.currentUser.role === 'admin';

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
    } catch(e) {
        console.error(e);
        app.innerHTML = `<h3 style="color:red">Error loading list</h3>`;
    }
}

export async function renderStudentView(id) {
    // must be admin or owner of student to view profile
    const isOwner = state.currentUser && String(state.currentUser.studentId) === String(id);
    const isAdmin = state.currentUser && state.currentUser.role === 'admin';

    if (!isAdmin && !isOwner) {
        showError(t('access_denied'));
        window.navigateTo('/');
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = 'Loading...';
    try {
        const res = await fetchApi(`/api/students/${id}`);
        if(!res.ok) {
            const json = await res.json();
            app.innerHTML = `<h2>${t(json.error) || t('access_denied')}</h2>`;
            return;
        }

        const { student, enrollments } = await res.json();
        const isAdmin = state.currentUser.role === 'admin';

        let html = `
            <div class="card detail-card">
                <h2>${student.First_Name} ${student.Last_Name}</h2>
                <p><strong>${t('table_email')}:</strong> ${student.Email}</p>
                <p><strong>${t('label_phone')}:</strong> ${student.PhoneNumber || '-'}</p>
                <div style="margin-top: 15px;">
                    ${isAdmin ? `<button class="btn" onclick="navigateTo('/students/edit/${student.ID}')">${t('btn_edit')}</button>` : ''}
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
    } catch(e) {
        console.error(e);
        app.innerHTML = `<h2>Error loading profile</h2>`;
    }
}

export async function renderStudentForm(mode, id = null) {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showError(t('access_denied'));
        window.navigateTo('/students');
        return;
    }

    const app = document.getElementById('app');
    let student = { First_Name: '', Last_Name: '', Email: '', PhoneNumber: '' };
    if (mode === 'Edit') {
        const res = await fetchApi(`/api/students/${id}`);
        const data = await res.json();
        student = data.student;
    }
    // determine title based on mode
    const title = mode === 'Add' ? t('btn_add_student') : t('btn_edit');
    const btnText = mode === 'Add' ? t('btn_save') : t('btn_update');

    app.innerHTML = `
        <h2>${title}</h2><div id="msg" class="alert error" style="display:none"></div>
        <form class="form-card" onsubmit="handleStudentSave(event, '${mode}', ${id})">
            <div class="form-group"><label>${t('label_firstname')}</label><input type="text" id="fn" value="${student.First_Name}" required></div>
            <div class="form-group"><label>${t('label_lastname')}</label><input type="text" id="ln" value="${student.Last_Name}" required></div>
            <div class="form-group"><label>${t('label_email')}</label><input type="email" id="em" value="${student.Email}" required></div>
            <div class="form-group"><label>${t('label_phone')}</label><input type="text" id="ph" value="${student.PhoneNumber || ''}"></div>
            <button type="submit" class="btn">${btnText}</button><button type="button" class="btn secondary" onclick="navigateTo('/students')">${t('btn_cancel')}</button>
        </form>
    `;
}