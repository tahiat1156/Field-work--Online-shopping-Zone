# Project Report: Shopping Zone

## 1. Introduction

Shopping Zone is a professional online fashion shopping project. The main target of the project is to show a modern React.js frontend with a small but working Node.js backend integration. The customer side is clean and shopping-focused, while the admin side is separated for management tasks.

## 2. Objectives

- Build a professional online shopping frontend
- Create Men, Women and Kids collections
- Add subsections such as Dress, Shoes, Bags, Makeup and Accessories
- Add login and registration for customers
- Add cart, wishlist, checkout and order history
- Create a separate admin dashboard
- Allow admin to add, update and delete products
- Allow admin to manage orders, customers and messages
- Integrate frontend with a Node.js backend

## 3. Technologies Used

### Frontend

- React.js
- Vite
- CSS3
- Responsive layout

### Backend

- Node.js
- Express.js
- Local JSON file database

## 4. Customer Features

- Home page with professional hero section
- Shop page with all collections
- Category filters
- Subsection filters
- Search and sorting
- Quick product view
- Add to cart
- Wishlist
- Login/register
- Checkout
- My orders
- Contact form

## 5. Admin Features

- Separate admin panel
- Admin login
- Store overview cards
- Product add/update/delete
- Product search inside admin panel
- Order list
- Order status update
- Order delete
- Customer list
- Customer message list
- Message delete

## 6. Backend Integration

The project uses a small Express.js backend. The frontend sends requests to the backend for products, user login/register, orders, contact messages and admin management. Data is stored in a local JSON file for easy exam demonstration.

## 7. Run Instructions

```bash
npm install
npm run install:all
npm run dev
```

Open:

```txt
Customer: http://localhost:5173
Admin:    http://localhost:5173/#/admin
Backend:  http://localhost:4000
```

## 8. Demo Accounts

Customer:

```txt
customer@shoppingzone.com / customer123
```

Admin:

```txt
admin@shoppingzone.com / admin123
```

## 9. Conclusion

Shopping Zone successfully demonstrates a professional frontend-focused e-commerce project with backend integration. It is suitable for academic presentation because the user side is clean and professional, while the admin panel shows practical management features such as product CRUD, order management and customer message handling.
