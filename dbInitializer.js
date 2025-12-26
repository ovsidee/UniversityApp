const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// paths
const DB_FILE = path.join(__dirname, 'university-app'); // naming the file university.db
const DB_SCRIPTS_PATH = path.join(__dirname, 'public', 'dbScripts');
const CREATE_SCRIPT_PATH = path.join(DB_SCRIPTS_PATH, 'create.sql');
const DATA_SCRIPT_PATH = path.join(DB_SCRIPTS_PATH, 'data.sql');

let createSql;
let dataSql;

// read sql files
try {
    createSql = fs.readFileSync(CREATE_SCRIPT_PATH, 'utf8');
    dataSql = fs.readFileSync(DATA_SCRIPT_PATH, 'utf8');
} catch (err) {
    console.error('Error reading SQL files:', err.message);
    process.exit(1);
}

// connect to db
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) return console.error('Error opening database:', err.message);
    console.log(`Connected to the database: ${DB_FILE}`);
});

// run sql commands
db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    // check if the 'Student' table actually exists in the database schema
    const checkTableSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='Student'";

    db.get(checkTableSql, [], (err, row) => {
        if (err) {
            console.error('Error checking table existence:', err.message);
            return closeDb();
        }

        // table exists, check for data, if not, seed it
        if (row) {
            checkDataAndSeed();
        } else {
            console.log('Tables missing. Running create.sql...');
            runCreateAndSeed();
        }
    });
});

function checkDataAndSeed() {
    const sqlCheck = `SELECT COUNT(*) AS count FROM Student`;

    db.get(sqlCheck, [], (err, row) => {
        if (err) {
            console.error('Error checking student count:', err.message);
            return closeDb();
        }

        if (row.count > 0) {
            console.log('Tables already contain data. data.sql skipped.');
            closeDb();
        } else {
            console.log('Table exists but is empty. Running data.sql...');
            db.exec(dataSql, (err) => {
                if (err) console.error('Error running data.sql:', err.message);
                else console.log('Data seeded successfully!');
                closeDb();
            });
        }
    });
}

function runCreateAndSeed() {
    db.exec(createSql, (err) => {
        if (err) {
            console.error('Error executing create.sql:', err.message);
            return closeDb();
        }
        console.log('Tables created successfully!');
        db.exec(dataSql, (err) => {
            if (err) console.error('Error running data.sql:', err.message);
            else console.log('Data seeded successfully!');
            closeDb();
        });
    });
}

function closeDb() {
    db.close((err) => {
        if (err) return console.error('Error closing the database:', err.message);
        console.log('Database initialization complete!');
    });
}