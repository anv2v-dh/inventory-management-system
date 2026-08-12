// --- Authentication State & Toggle ---
let isRegisterMode = false;
const token = localStorage.getItem('token');

if (token) {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');
    loadData();
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? "Register Account" : "Admin Login";
    document.getElementById('auth-btn').innerText = isRegisterMode ? "Register" : "Login";
    document.getElementById('toggle-msg').innerText = isRegisterMode ? "Already have an account?" : "Need an account?";
    document.getElementById('toggle-auth-mode').innerText = isRegisterMode ? "Login here" : "Register here";
    document.getElementById('auth-error').innerText = "";
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const endpoint = isRegisterMode ? '/api/register' : '/api/login';

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    });
    
    const data = await res.json();
    if (res.ok) {
        if (isRegisterMode) {
            alert(data.message);
            toggleAuthMode();
        } else {
            localStorage.setItem('token', data.token);
            location.reload();
        }
    } else {
        document.getElementById('auth-error').innerText = data.error;
    }
});

function logout() {
    localStorage.removeItem('token');
    location.reload();
}

// --- UI Navigation ---
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`${sectionName}-section`).classList.add('active');
}

function toggleProductForm() {
    document.getElementById('add-product-form').classList.toggle('hidden');
}

// --- Data Fetching & Rendering ---
let allProducts = [];

async function loadData() {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    
    // Fetch Suppliers
    let suppRes = await fetch('/api/suppliers', { headers });
    let suppliers = await suppRes.json();
    
    let suppSelect = document.getElementById('prod-supplier');
    let filterSelect = document.getElementById('filter-supplier');
    let suppBody = document.getElementById('suppliers-body');
    
    // Clear elements to prevent duplicate list items
    suppBody.innerHTML = '';
    suppSelect.innerHTML = '<option value="">Select Supplier</option>';
    filterSelect.innerHTML = '<option value="">All Suppliers</option>';

    suppliers.forEach(s => {
        const safeName = (s.name || '').replace(/'/g, "\\'");
        const safeEmail = (s.email || '').replace(/'/g, "\\'");
        const safePhone = (s.phone || '').replace(/'/g, "\\'");

        suppBody.innerHTML += `
            <tr>
                <td>${s.name}</td>
                <td>${s.email}</td>
                <td>${s.phone || 'N/A'}</td>
                <td>
                    <button onclick="editSupplier(${s.id}, '${safeName}', '${safeEmail}', '${safePhone}')">Edit</button>
                    <button onclick="deleteSupplier(${s.id})" style="background:#d9534f; color:white;">Delete</button>
                </td>
            </tr>`;
        suppSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        filterSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
    });

    // Fetch Products
    let prodRes = await fetch('/api/products', { headers });
    allProducts = await prodRes.json();
    renderProducts(allProducts);
}

function renderProducts(products) {
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '';
    
    products.forEach(p => {
        const rowClass = p.quantity < 5 ? 'low-stock' : '';
        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td><img src="${p.image_url}" class="product-img"></td>
                <td>${p.name}</td>
                <td>${p.supplier_name || 'N/A'}</td>
                <td>Rs. ${p.price}</td>
                <td>${p.quantity}</td>
                <td>
                    <button onclick="editProduct(${p.id}, ${p.price}, ${p.quantity})">Edit</button>
                    <button onclick="deleteProduct(${p.id})" style="background:#d9534f; color:white;">Delete</button>
                </td>
            </tr>
        `;
    });
}

// --- Search and Filter ---
function filterProducts() {
    const searchTxt = document.getElementById('search-product').value.toLowerCase();
    const filterSupp = document.getElementById('filter-supplier').value;

    const filtered = allProducts.filter(p => {
        const matchesName = p.name.toLowerCase().includes(searchTxt);
        const matchesSupp = filterSupp === "" || p.supplier_name === filterSupp;
        return matchesName && matchesSupp;
    });
    renderProducts(filtered);
}

// --- Form Submissions ---
document.getElementById('add-supplier-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
    
    const body = JSON.stringify({
        name: document.getElementById('supp-name').value,
        email: document.getElementById('supp-email').value,
        phone: document.getElementById('supp-phone').value
    });

    const res = await fetch('/api/suppliers', { method: 'POST', headers, body });
    if (res.ok) {
        e.target.reset();
        loadData();
    } else {
        const err = await res.json();
        alert(err.error);
    }
});

document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    let formData = new FormData();
    formData.append('name', document.getElementById('prod-name').value);
    formData.append('description', document.getElementById('prod-desc').value);
    formData.append('price', document.getElementById('prod-price').value);
    formData.append('quantity', document.getElementById('prod-qty').value);
    formData.append('supplier_id', document.getElementById('prod-supplier').value);
    formData.append('image', document.getElementById('prod-image').files[0]);

    const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
    });

    if (res.ok) {
        e.target.reset();
        toggleProductForm();
        loadData();
    } else {
        const err = await res.json();
        alert("Error: " + err.error);
    }
});

// --- Edit & Delete Functions ---
async function editProduct(id, currentPrice, currentQty) {
    const newPrice = prompt("Enter new price (Rs.):", currentPrice);
    const newQty = prompt("Enter new quantity:", currentQty);

    if (newPrice !== null && newQty !== null) {
        const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ price: parseFloat(newPrice), quantity: parseInt(newQty) })
        });

        if (res.ok) {
            loadData();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }
}

async function deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.ok) {
            loadData();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }
}

async function editSupplier(id, currentName, currentEmail, currentPhone) {
    const newName = prompt("Enter new supplier name:", currentName);
    const newEmail = prompt("Enter new supplier email:", currentEmail);
    const newPhone = prompt("Enter new supplier phone:", currentPhone);

    if (newName && newEmail) {
        const res = await fetch(`/api/suppliers/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ name: newName, email: newEmail, phone: newPhone })
        });

        if (res.ok) {
            loadData();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }
}

async function deleteSupplier(id) {
    if (confirm("Are you sure you want to delete this supplier?")) {
        const res = await fetch(`/api/suppliers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.ok) {
            loadData();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }
}