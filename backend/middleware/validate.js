// backend/middleware/validate.js

// Backend middleware to strictly validate inputs on the server side.
// Prevents API bypass via DevTools, Postman, or external HTTP requests.

const validateProduct = (req, res, next) => {
    const { name, price, quantity } = req.body;

    if (req.method === 'POST' && (!name || name.trim() === '')) {
        return res.status(400).json({ error: "Product name is required." });
    }

    if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: "Price cannot be negative or invalid." });
        }
    }

    if (quantity !== undefined) {
        const parsedQty = parseInt(quantity, 10);
        if (isNaN(parsedQty) || parsedQty < 0) {
            return res.status(400).json({ error: "Quantity cannot be negative or invalid." });
        }
    }

    next();
};

const validateSupplier = (req, res, next) => {
    const { name, email } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Supplier name is required." });
    }

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid supplier email is required." });
    }

    next();
};

module.exports = { validateProduct, validateSupplier };