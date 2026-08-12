const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, '../../inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database error: " + err.message);
});

// Create tables using raw SQL
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price REAL,
        quantity INTEGER,
        supplier_id INTEGER,
        image_url TEXT,
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )`);

    // Create a default admin user if it doesn't exist
    db.get("SELECT * FROM users WHERE username = 'admin'", async (err, row) => {
        if (!row) {
            // hash the password safely
            let hashed = await bcrypt.hash('admin123', 10);
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['admin', hashed]);
        }
    });
});

module.exports = db;