# Shopping Zone - React + Node + MongoDB Admin Project

Shopping Zone is a professional online shopping project for exam/demo presentation.

## What is fixed in this version

- Admin **Add Product** now saves correctly.
- Admin **Update Product** now actually changes product data.
- Admin **Delete Product** now removes product and refreshes the list.
- Order status update and delete actions now refresh properly.
- Customer message delete now refreshes properly.
- API request headers are fixed, so backend receives JSON data correctly.
- MongoDB connection support added.
- If MongoDB URI is not given, the project still runs using local `backend/data/db.json` for emergency demo.

## Main Features

### User Side

Users can:

- Browse Men, Women and Kids collections
- View Dress, Shoes, Bags, Makeup and Accessories sections
- Search products
- Filter by category and section
- Sort products by price, rating and newest
- View product quick details
- Add products to cart
- Add products to wishlist
- Register account
- Login account
- Place order
- View their own orders
- Send contact message

### Admin Side

Admin panel URL:

```txt
http://localhost:5173/#/admin
```

Admin can:

- View store overview
- Add product
- Update product
- Delete product
- Search admin product list
- View orders
- Change order status
- Delete order
- View registered customers
- View customer messages
- Delete customer messages
- See total products, orders, customers and revenue

## Demo Login

Customer:

```txt
Email: customer@shoppingzone.com
Password: customer123
```

Admin:

```txt
Email: admin@shoppingzone.com
Password: admin123
```

## Run Project

Extract the zip and open the main project folder in VS Code.

Install root dependencies:

```bash
npm install
```

Install frontend and backend dependencies:

```bash
npm run install:all
```

Run both frontend and backend:

```bash
npm run dev
```

Open:

```txt
Customer Website: http://localhost:5173
Admin Panel:      http://localhost:5173/#/admin
Backend Server:   http://localhost:4000
Health Check:     http://localhost:4000/api/health
```

## MongoDB Setup

### 1. Create `.env` file in backend folder

Inside the `backend` folder, create a file named `.env`.

Copy this:

```env
PORT=4000
ADMIN_EMAIL=admin@shoppingzone.com
ADMIN_PASSWORD=admin123
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/shoppingzone?retryWrites=true&w=majority
MONGODB_DB_NAME=shoppingzone
```

Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your MongoDB Atlas details.

For local MongoDB, you can use:

```env
PORT=4000
ADMIN_EMAIL=admin@shoppingzone.com
ADMIN_PASSWORD=admin123
MONGODB_URI=mongodb://127.0.0.1:27017/shoppingzone
MONGODB_DB_NAME=shoppingzone
```

### 2. Important MongoDB Atlas settings

In MongoDB Atlas:

1. Go to **Database Access** and create a username/password.
2. Go to **Network Access** and add your current IP address.
3. Copy your connection string from **Connect → Drivers**.
4. Paste it into `backend/.env` as `MONGODB_URI`.
5. If your password has special characters like `@`, `#`, `/`, replace them with URL encoded values or create an easier password.

### 3. Check connection

Run:

```bash
npm run dev
```

Then open:

```txt
http://localhost:4000/api/health
```

If MongoDB is connected, you will see:

```json
"storage": "mongodb",
"mongoConnected": true
```

If you see:

```json
"storage": "json",
"mongoConnected": false
```

then MongoDB URI is missing or connection failed.

## Presentation Line

My project name is Shopping Zone. It is a React.js e-commerce website where users can browse products, register/login, add products to cart, place orders and view order history. I also integrated a Node.js Express backend with MongoDB, so products, users, orders, messages and admin actions are stored in the database. The admin dashboard can add, update and delete products, manage orders, view customers and check customer messages.
