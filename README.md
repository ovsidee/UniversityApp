# University Administration App

A Single Page Application (SPA) for managing university students, courses, enrollments, and grades. 
Built with Node.js, Express, SQLite, and JavaScript.

**Final Project for TIN (Internet Technologies)**
**Author:** Vitalii Korytnyi (s31719)

---

## Features

### Authentication & Roles
* **Guest:** Can view the home page and course list (read-only). Can Register and Login.
* **Student:** Can view their own profile, enrolled courses, and grades.
* **Admin:** Full CRUD (Create, Read, Update, Delete) permissions for Students and Courses.

### Functionality
* **Single Page Application (SPA)**
* **Student Management:** Add, edit, delete, and view student profiles.
* **Course Management:** Create, edit, and delete courses.
* **Enrollment System:**
    * Admin can enroll students into courses.
    * Admin can assign grades (Validation: 2.0 to 5.0).
    * Admin can remove students from courses.
* **Internationalization (i18n):** dynamic switching between **English (EN)** and **Polish (PL)** languages.

### Technical Highlights
* **Backend:** Node.js + Express.
* **Database:** SQLite (Auto-initializes tables and seed data).
<img width="845" height="404" alt="image" src="https://github.com/user-attachments/assets/4a499ed1-69e3-4710-88c7-960edee464e9" />
* **Security:** Password hashing (`bcryptjs`), Session management (`express-session`), Backend API validation.
* **Frontend:** Pure Vanilla JavaScript (ES6 Modules) - No heavy frameworks like React or Vue.

---

## Installation & Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v14 or higher recommended)
* NPM (comes with Node.js)

### 2. Clone/Download
Navigate to your project directory:
```bash
cd ..\UniversityApp\
```

### 3. Install the required packages (express, sqlite3, bcryptjs, express-session, etc.):
```bash
npm install
```

### 4. Database Initialization
Generate the DataBase (if not present in folder)
```bash 
node dbInitializer.js
```

On the first run, it checks for university-app (SQLite DB file).
If missing, it runs public/dbScripts/create.sql to create tables.
It then runs public/dbScripts/data.sql to seed initial data.

---

## How to run?

### 1. Start the server:
```bash
node server.js
```
### 2. Open your browser and visit: 
```bash
http://localhost:3000
```

---

## Default Accounts (Seed Data)

| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | Admin123!  |
| Student | artem    | Artem123!  |
| Guest   | guest    | Guest123!  |
