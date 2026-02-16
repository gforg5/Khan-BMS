# Khan-BMS (Business Management System)

A comprehensive, multi-language web-based Business Management System designed for shops, restaurants, and businesses in Pakistan. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Core Functionality
- **Multi-Language Support** - English, Urdu, and Pashto with full RTL support
- **Tiered Subscription System** - Free Demo, Standard (200 PKR), and Premium (500 PKR)
- **User Authentication** - Secure login/registration with Supabase Auth
- **Role-Based Access** - User and Admin roles with different permissions

### Dashboard
- Real-time sales statistics (daily, weekly, monthly)
- Total profit and loss calculations
- Low stock alerts
- Top-selling products overview
- Recent transaction history

### Inventory Management
- Add/Edit/Delete products with multi-language names
- Track stock quantities with low-stock thresholds
- Profit margin calculations
- Stock value tracking

### Sales & Transactions
- Quick sale entry with shopping cart functionality
- Multiple payment methods (Cash, Card, Online)
- Receipt generation with unique receipt numbers
- Automatic inventory updates
- Customer information tracking

### Financial Tracking
- Expense management with categories
- Profit/loss analysis
- Sales trends reporting
- Daily, weekly, and monthly reports

### Analytics & Reports
- Sales trends visualization
- Product performance metrics
- Best and worst sellers analysis
- Revenue tracking

### Admin Panel
- User account management
- System-wide revenue statistics
- Coupon code creation and management
- Usage tracking and analytics

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable React components
├── contexts/        # Authentication and Language contexts
├── lib/            # Supabase client and database types
├── locales/        # Translation files (en, ur, ps)
├── pages/          # Application pages
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Sales.tsx
│   ├── Reports.tsx
│   ├── Expenses.tsx
│   ├── Subscription.tsx
│   ├── Settings.tsx
│   └── Admin.tsx
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
```

## Subscription Tiers

### Free Demo
- Limited features for testing
- Up to 10 products
- 7-day analytics only
- Read-only reports

### Standard (200 PKR/month)
- Full dashboard access
- Up to 500 products
- Daily, weekly, monthly analytics
- Inventory and expense tracking
- Sales reporting

### Premium (500 PKR/month)
- Unlimited products
- Advanced analytics
- All Standard features
- Priority features

## Coupon System

- Apply discount coupons during registration
- Default coupon: `WELCOME50` (50 PKR discount)
- Admin can create and manage coupons
- Track coupon usage and expiry

## Security

- Row-Level Security (RLS) enabled on all database tables
- User data isolation - users can only access their own data
- Password hashing with Supabase Auth
- Secure API communication with Supabase

## Localization

All text is available in three languages:
- English (en)
- Urdu (ur) - اردو
- Pashto (ps) - پښتو

Language preference is saved and applied across the application.

## License

Proprietary - All rights reserved
