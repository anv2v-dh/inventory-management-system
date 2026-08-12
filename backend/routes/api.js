const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('../config/db');
const path = require('path');

// Setup Multer for image uploads
const storage = multer.diskStorage({
    destination: './backend/uploads/',
    filename: function(req, file, cb) {
        cb(null, 'prod-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware to protect routes
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const token = bearerHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, authData) => {
            if (err) return res.status(403).json({ error: "Invalid token" });
            req.authData = authData;
            next();
        });
    } else {
        res.status(401).json({ error: "Access denied. Please login." });
    }
}

// --- AUTH ROUTES ---
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    try {
        const hashed = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed], function(err) {
            if (err) return res.status(400).json({ error: "Username already exists" });
            res.json({ message: "Registration successful! You can now log in." });
        });
    } catch (e) {
        res.status(500).json({ error: "Server error during registration" });
    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ error: "Server error" });
        if (!user) return res.status(400).json({ error: "User not found" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: "Wrong password" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({ token });
    });
});

// --- SUPPLIER ROUTES ---
router.get('/suppliers', verifyToken, (req, res) => {
    db.all("SELECT * FROM suppliers", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/suppliers', verifyToken, (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

    db.run("INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)", 
        [name, email, phone], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

router.put('/suppliers/:id', verifyToken, (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
    }

    db.run("UPDATE suppliers SET name = ?, email = ?, phone = ? WHERE id = ?", 
        [name, email, phone, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Supplier updated successfully" });
    });
});

router.delete('/suppliers/:id', verifyToken, (req, res) => {
    // Check if supplier has linked products before deleting
    db.get("SELECT COUNT(*) as count FROM products WHERE supplier_id = ?", [req.params.id], (err, row) => {
        if (row && row.count > 0) {
            return res.status(400).json({ error: "Cannot delete supplier with linked products." });
        }
        db.run("DELETE FROM suppliers WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Supplier deleted successfully" });
        });
    });
});

// --- PRODUCT ROUTES ---
router.get('/products', verifyToken, (req, res) => {
    const sql = `
        SELECT products.*, suppliers.name as supplier_name 
        FROM products 
        LEFT JOIN suppliers ON products.supplier_id = suppliers.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/products', verifyToken, upload.single('image'), (req, res) => {
    const { name, description, price, quantity, supplier_id } = req.body;
    if (!name || price < 0 || quantity < 0) {
        return res.status(400).json({ error: "Invalid data. Price and quantity cannot be negative." });
    }

    let imageUrl = req.file ? '/uploads/' + req.file.filename : '';

    db.run(`INSERT INTO products (name, description, price, quantity, supplier_id, image_url) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
        [name, description, price, quantity, supplier_id, imageUrl], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

router.put('/products/:id', verifyToken, (req, res) => {
    const { price, quantity } = req.body;
    if (price < 0 || quantity < 0) {
        return res.status(400).json({ error: "Price and quantity cannot be negative" });
    }

    db.run("UPDATE products SET price = ?, quantity = ? WHERE id = ?", 
        [price, quantity, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product updated successfully" });
    });
});

router.delete('/products/:id', verifyToken, (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product deleted successfully" });
    });
});

module.exports = router;