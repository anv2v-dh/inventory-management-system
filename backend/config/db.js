const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../inventory.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Suppliers Table
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT
    )`);

    // Products Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        supplier_id INTEGER,
        image_url TEXT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )`);

    db.get("SELECT * FROM users WHERE username = ?", ['arnav'], async (err, row) => {
        if (!row) {
            const hashedPassword = await bcrypt.hash('arnav456', 10);
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['arnav', hashedPassword]);
            console.log("Default user created: arnav / arnav456");
        }
    });
});

module.exports = db;