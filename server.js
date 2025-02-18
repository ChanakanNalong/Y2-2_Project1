const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require("bcrypt");

const app = express();
app.use(cors()); // ใช้ CORS เพื่อให้ Frontend (React) เชื่อมได้
app.use(express.json()); // ให้ Express อ่าน JSON ใน req.body

// เชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tax_db',
    waitForConnections: true,
    connectionLimit: 50, // รองรับ 50 Connections
    queueLimit: 0
});

// ตรวจสอบว่าฐานข้อมูลเชื่อมต่อได้ไหม
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ MySQL Connection Error:', err);
        return;
    }
    console.log('✅ MySQL Connected');
    connection.release();
});

// 🟢 Route: ดึง Users ทั้งหมด
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('❌ Error fetching users:', err);
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});

// 🟢 Route: สมัครสมาชิก (Sign Up)
app.post('/add-user', async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match!" });
    }

    // ตรวจสอบว่า Email ซ้ำกันไหม
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error("❌ Error checking email:", err);
            return res.status(500).json({ error: "Database query failed" });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: "Email already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)`;
        const values = [firstname, lastname, email, hashedPassword];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("❌ Error inserting user:", err);
                return res.status(500).json({ error: "Database insertion failed" });
            }
            res.json({ message: "✅ User added successfully", userId: result.insertId });
        });
    });
});

// 🟢 Route: ดึงข้อมูล Income
app.get('/income', (req, res) => {
    db.query('SELECT * FROM income', (err, results) => {
        if (err) {
            console.error('❌ Error fetching income:', err);
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});

// 🟢 Route: เพิ่มข้อมูล Income
app.post('/add-income', (req, res) => {
    const { user_id, salary, freelance, copyright, interest_dividend, rent, profession, contractor, sell_products, sum_income,} = req.body;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const query = `INSERT INTO income (user_id, salary, freelance, copyright, interest_dividend, rent, profession, contractor, sell_products, sum_income) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [user_id, salary, freelance, copyright, interest_dividend, rent, profession, contractor, sell_products, sum_income,];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("❌ Error inserting income:", err);
            return res.status(500).json({ error: "Database insertion failed" });
        }
        res.json({ message: "✅ Income added successfully", incomeId: result.insertId });
    });
});

// 🟢 Route: ดึงข้อมูล Deduction
app.get('/deduction', (req, res) => {
    db.query('SELECT * FROM deduction', (err, results) => {
        if (err) {
            console.error('❌ Error fetching deduction:', err);
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});

// 🟢 Route: เพิ่มข้อมูล Deduction
app.post('/add-deduction', (req, res) => {
    const { user_id, personal_family, saving_invest, residence, donate, other } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const query = `INSERT INTO deduction (user_id, personal_family, saving_invest, residence, donate, other) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [user_id, personal_family, saving_invest, residence, donate, other];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("❌ Error inserting deduction:", err);
            return res.status(500).json({ error: "Database insertion failed" });
        }
        res.json({ message: "✅ Deduction added successfully", id: result.insertId });
    });
});

// 🟢 Route: ดึงข้อมูล Homepage
app.get('/homepage', (req, res) => {
    const query = `
        SELECT u.id, u.firstname, u.lastname, u.email, 
        i.salary, i.freelance, i.copyright, i.interest_dividend, 
        i.rent, i.profession, i.contractor, i.sell_products, i.sum_income, 
        d.personal_family, d.saving_invest, d.residence, d.donate, d.other 
        FROM users u 
        LEFT JOIN income i ON u.id = i.user_id 
        LEFT JOIN deduction d ON u.id = d.user_id
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error executing query:', err);
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});

// 🟢 Start Server
app.listen(3000, () => {
    console.log('🚀 Server running on port 3000!');
});
