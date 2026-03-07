# Restaurant Management System - Setup Guide

## Quick Start

Follow these steps to get your restaurant management system up and running:

### Prerequisites

Make sure you have the following installed:
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
cd ..
```

### 2. Setup PostgreSQL Database

```bash
# Create a new PostgreSQL database
createdb restaurant_db

# Or using psql
psql -U postgres
CREATE DATABASE restaurant_db;
\q
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update the following:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - JWT_SECRET (use a strong random string)
# - Optional: EMAIL_* settings for notifications
# - Optional: STRIPE_* settings for payments
```

### 4. Seed the Database

```bash
# Run the seeding script to create initial data
node backend/seedDatabase.js
```

This will create:
- Admin user (admin@restaurant.com / admin123)
- Sample staff members
- Menu items (appetizers, mains, desserts, beverages)
- Inventory items
- Tables
- Sample customers

### 5. Start the Application

#### Option 1: Run Backend and Frontend Separately

```bash
# Terminal 1 - Start backend server
npm run server

# Terminal 2 - Start frontend (in a new terminal)
npm run client
```

#### Option 2: Use Concurrently (recommended)

```bash
# Install concurrently globally
npm install -g concurrently

# Add this to package.json scripts:
"dev": "concurrently \"npm run server\" \"cd frontend && npm start\""

# Run both servers
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default Login Credentials

**Admin Account:**
- Email: admin@restaurant.com
- Password: admin123

**Manager Account:**
- Email: manager@restaurant.com
- Password: manager123

**Cashier Account:**
- Email: cashier@restaurant.com
- Password: cashier123

**Waiter Account:**
- Email: waiter@restaurant.com
- Password: waiter123

**Chef Account:**
- Email: chef@restaurant.com
- Password: chef123

## Features Overview

### 1. **Dashboard**
- Real-time statistics
- Today's orders and revenue
- Active orders count
- Low stock alerts

### 2. **POS (Point of Sale)**
- Quick order creation
- Menu item selection by category
- Cart management
- Order type selection (dine-in, takeaway, delivery)
- Table assignment

### 3. **Orders Management**
- View all orders
- Filter by status
- Update order status
- Real-time order tracking
- Kitchen display integration

### 4. **Menu Management**
- Add/edit menu items
- Category management
- Price management
- Toggle availability
- Item descriptions and images

### 5. **Inventory Management**
- Stock tracking
- Low stock alerts
- Restock management
- Category organization
- Supplier information

### 6. **Reservations**
- Create reservations
- View upcoming reservations
- Manage table assignments
- QR code generation
- Status tracking

### 7. **Customer Management (CRM)**
- Customer database
- Loyalty program (Bronze, Silver, Gold, Platinum)
- Points management
- Order history
- Customer preferences

### 8. **Staff Management**
- Employee roster
- Role management
- Schedule management
- Performance tracking
- Department organization

### 9. **Reports & Analytics**
- Sales reports
- Revenue analysis
- Menu performance
- Inventory reports
- Customer analytics

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Orders
- GET `/api/orders` - List orders
- POST `/api/orders` - Create order
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id/status` - Update order status

### Menu
- GET `/api/menu` - List menu items
- POST `/api/menu` - Create menu item
- PUT `/api/menu/:id` - Update menu item
- DELETE `/api/menu/:id` - Delete menu item

### Inventory
- GET `/api/inventory` - List inventory
- POST `/api/inventory` - Add inventory item
- POST `/api/inventory/:id/restock` - Restock item
- GET `/api/inventory/alerts/low-stock` - Low stock alerts

### Reservations
- GET `/api/reservations` - List reservations
- POST `/api/reservations` - Create reservation
- PUT `/api/reservations/:id/status` - Update status

### Customers
- GET `/api/customers` - List customers
- POST `/api/customers` - Add customer
- POST `/api/customers/:id/loyalty/add` - Add loyalty points

### Staff
- GET `/api/staff` - List staff
- GET `/api/staff/schedules` - Get schedules
- POST `/api/staff/schedules` - Create schedule

### Reports
- GET `/api/reports/sales` - Sales report
- GET `/api/reports/menu` - Menu performance
- GET `/api/reports/inventory` - Inventory report
- GET `/api/reports/dashboard` - Dashboard stats

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in .env
- Verify database exists: `psql -l`

### Port Already in Use
- Backend (5000): Change PORT in .env
- Frontend (3000): Set PORT=3001 before starting

### Module Not Found Errors
- Run `npm install` in root directory
- Run `npm install` in frontend directory
- Clear cache: `npm cache clean --force`

### CORS Errors
- Check FRONTEND_URL in backend .env
- Verify proxy in frontend package.json

## Production Deployment

### Environment Setup
1. Set NODE_ENV=production
2. Update all environment variables
3. Use strong JWT_SECRET
4. Configure proper database credentials

### Build Frontend
```bash
cd frontend
npm run build
```

### Run Production Server
```bash
NODE_ENV=production npm start
```

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS
- **Database**: AWS RDS, Heroku Postgres
- **Frontend**: Netlify, Vercel, AWS S3

## Support

For issues or questions:
1. Check the documentation
2. Review API endpoints
3. Check console logs
4. Verify environment variables

## Security Notes

⚠️ **Important**: 
- Change default passwords immediately
- Use strong JWT_SECRET in production
- Enable HTTPS in production
- Implement rate limiting
- Regular database backups
- Keep dependencies updated

## License

MIT License - Free for personal and commercial use
