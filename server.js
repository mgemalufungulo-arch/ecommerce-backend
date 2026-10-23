const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares za kusoma JSON na kuruhusu CORS
app.use(express.json());
app.use(cors());

// Kuunganisha na MySQL Database (Inasoma Environment Variables za Render/Aiven pamoja na SSL)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',          
    password: process.env.DB_PASSWORD || 'bonny@123',    
    database: process.env.DB_NAME || 'ecommerce_db',
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false // Inaruhusu muunganisho salama unaotakiwa na Aiven
    }
});

db.connect((err) => {
    if (err) {
        console.error('Imeshindwa kuunganisha na Database:', err.message);
        return;
    }
    console.log('Database imeunganishwa kikamilifu na Aiven / MySQL!');
});

// Jaribio la kwanza la API route
app.get('/', (req, res) => {
    res.send('API ya E-Commerce inafanya kazi vizuri!');
});

// 1. API ya Kuongeza Bidhaa Mpya (POST Request)
app.post('/api/products', (req, res) => {
    const { name, description, price, stock_quantity, image_url, category_id } = req.body;

    const sql = "INSERT INTO products (name, description, price, stock_quantity, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [name, description, price, stock_quantity, image_url, category_id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Hitilafu katika kuongeza bidhaa:", err);
            return res.status(500).json({ error: "Imeshindwa kuongeza bidhaa kwenye Database" });
        }
        res.status(201).json({ 
            message: "Bidhaa imeongezwa kwa mafanikio!",
            productId: result.insertId 
        });
    });
});

// 2. API ya Kuchota/Kuona Bidhaa Zote (GET Request)
app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM products";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Hitilafu katika kuchota bidhaa:", err);
            return res.status(500).json({ error: "Imeshindwa kupata bidhaa" });
        }
        res.json(results);
    });
});

// 3. API ya Kuchota Bidhaa Moja Tu kwa Kutumia ID yake (GET Request)
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const sql = "SELECT * FROM products WHERE id = ?";
    
    db.query(sql, [productId], (err, results) => {
        if (err) {
            console.error("Hitilafu katika kuchota bidhaa:", err);
            return res.status(500).json({ error: "Imeshindwa kupata bidhaa" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Bidhaa haijaonekana!" });
        }
        res.json(results[0]);
    });
});

// 4. API ya Kusasisha au Kurekebisha Taarifa za Bidhaa (PUT Request)
app.put('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const { name, description, price, stock_quantity, image_url, category_id } = req.body;

    const sql = "UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, image_url = ?, category_id = ? WHERE id = ?";
    const values = [name, description, price, stock_quantity, image_url, category_id, productId];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Hitilafu katika kusasisha bidhaa:", err);
            return res.status(500).json({ error: "Imeshindwa kusasisha bidhaa" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bidhaa haijaonekana ili isasishwe!" });
        }
        res.json({ message: "Taarifa za bidhaa zimesasishwa kwa mafanikio!" });
    });
});

// 5. API ya Kufuta Bidhaa (DELETE Request)
app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const sql = "DELETE FROM products WHERE id = ?";

    db.query(sql, [productId], (err, result) => {
        if (err) {
            console.error("Hitilafu katika kufuta bidhaa:", err);
            return res.status(500).json({ error: "Imeshindwa kufuta bidhaa" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bidhaa haijaonekana ili ifutwe!" });
        }
        res.json({ message: "Bidhaa imefutwa kwa mafanikio!" });
    });
});

// 6. API ya Kusajili Mteja Mpya (Register)
app.post('/api/users/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Tafadhali jaza nafasi zote wazi!" });
    }

    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'customer')";
    
    db.query(sql, [name, email, password], (err, result) => {
        if (err) {
            console.error("Hitilafu wakati wa kusajili:", err);
            return res.status(500).json({ error: "Barua pepe hii inaweza kuwa imeshatumika tayari." });
        }
        res.status(201).json({ 
            message: "Mteja amejisajili kwa mafanikio!", 
            userId: result.insertId 
        });
    });
});

// 7. API ya Mteja Kuingia kwenye Mfumo (Login)
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Weka barua pepe na neno la siri!" });
    }

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error("Hitilafu wakati wa login:", err);
            return res.status(500).json({ error: "Hitilafu kwenye mfumo" });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Barua pepe au neno la siri si sahihi!" });
        }

        const user = results[0];
        res.json({
            message: "Umeingia kwa mafanikio!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

// 8. API ya Kuweka Agizo Jipya (Create Order)
app.post('/api/orders', (req, res) => {
    const { user_id, total_amount, shipping_address } = req.body;

    if (!user_id || !total_amount || !shipping_address) {
        return res.status(400).json({ error: "Tafadhali jaza taarifa zote za agizo!" });
    }

    const sql = "INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, 'Pending')";

    db.query(sql, [user_id, total_amount, shipping_address], (err, result) => {
        if (err) {
            console.error("Hitilafu wakati wa kuweka agizo:", err);
            return res.status(500).json({ error: "Imeshindwa kuweka agizo" });
        }
        res.status(201).json({
            message: "Agizo limewekwa kwa mafanikio!",
            orderId: result.insertId
        });
    });
});

// 9. API ya Kuangalia Maagizo Yote (Get All Orders)
app.get('/api/orders', (req, res) => {
    const sql = `
        SELECT orders.id, users.name AS customer_name, orders.total_amount, orders.status, orders.shipping_address, orders.created_at 
        FROM orders 
        JOIN users ON orders.user_id = users.id
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Hitilafu katika kuchota maagizo:", err);
            return res.status(500).json({ error: "Imeshindwa kupata maagizo" });
        }
        res.json(results);
    });
});

// Kuwasha Seva kwenye Port ya Render au 5000 kama ipo local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server inafanya kazi kwenye port ${PORT}`);
});