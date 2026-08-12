# Full-Stack Inventory Management System

A full-stack web application for managing inventory, products, and suppliers. Built with Node.js, Express, SQLite, and vanilla HTML/CSS/JavaScript.

## Features
- **Authentication**: JWT-based user register/login with hashed passwords via `bcryptjs`.
- **Full CRUD Operations**: Create, Read, Update, and Delete options for Products and Suppliers.
- **Relational Schema**: Products linked to Suppliers using foreign keys (`supplier_id`).
- **File Uploads**: Product image uploading handled using `multer`.
- **UI Enhancements**: Client/server side validation, low-stock visual alert (highlighted red when quantity < 5), live text search, and supplier filtering.

## API Endpoints

### Auth
- `POST /api/register` - Create a new user account
- `POST /api/login` - Authenticate user & retrieve JWT token

### Suppliers
- `GET /api/suppliers` - Fetch all suppliers (Protected)
- `POST /api/suppliers` - Create supplier (Protected)
- `DELETE /api/suppliers/:id` - Delete supplier (Protected)

### Products
- `GET /api/products` - Fetch all products with supplier details (Protected)
- `POST /api/products` - Create product with image upload (Protected)
- `PUT /api/products/:id` - Update product price/quantity (Protected)
- `DELETE /api/products/:id` - Delete product (Protected)

## Project Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install