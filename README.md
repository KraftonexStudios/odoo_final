# OneFlow - Project Management System

A comprehensive project management system built with Next.js 15, React 19, and Prisma.

## Features

### 🎯 Core Features
- **Project Management** - Create, track, and manage projects with Kanban boards
- **Task Management** - Assign tasks, track progress, and manage deadlines
- **Time Tracking** - Log hours with timesheet approvals
- **Expense Management** - Submit expenses with receipt images for approval
- **Milestone Tracking** - Set and track project milestones
- **Real-time Notifications** - Get notified about assignments, approvals, and updates

### 📊 Financial Management
- **Sales Orders** - Create and track sales orders
- **Purchase Orders** - Manage purchase orders
- **Customer Invoices** - Generate and track invoices
- **Vendor Bills** - Manage vendor bills
- **Partner Management** - Manage customers and vendors

### 👥 Role-Based Access Control
- **Admin** - Full system access and user management
- **Project Manager** - Manage projects, approve timesheets/expenses
- **Sales/Finance** - Handle financial operations
- **Team Member** - Submit timesheets and expenses

### 🎨 Modern UI/UX
- Clean, professional interface with shadcn/ui
- Drag-and-drop Kanban boards
- Rich text editor for descriptions
- Image upload for receipts and project covers
- Responsive design for mobile and desktop

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with useOptimistic
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **TanStack Query** - Server state management
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **React Beautiful DnD** - Drag and drop

### Backend
- **Next.js Server Actions** - Server-side logic
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Relational database
- **Clerk** - Authentication and user management

### Deployment
- **Docker** - Containerization
- **Nginx** - Reverse proxy and load balancing
- **Docker Compose** - Multi-container orchestration

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Clerk account for authentication

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd oneflow
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Configure your `.env` file with:
- Database connection string
- Clerk API keys
- Other configuration

5. Run database migrations:
\`\`\`bash
npx prisma db push
\`\`\`

6. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Development
\`\`\`bash
docker-compose up
\`\`\`

### Production
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

See `IMPLEMENTATION_STATUS.md` for detailed Docker configuration.

## Project Structure

\`\`\`
src/
├── actions/          # Server actions
├── app/              # Next.js app directory
│   ├── (auth)/      # Auth pages (sign-in, sign-up)
│   ├── (main)/      # Main app pages
│   └── admin/       # Admin panel
├── components/       # React components
│   ├── forms/       # Form components
│   ├── project/     # Project-specific components
│   ├── shared/      # Shared components
│   └── ui/          # UI primitives (shadcn/ui)
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
└── provider/        # Context providers
\`\`\`

## Documentation

- `IMPLEMENTATION_STATUS.md` - Current implementation status
- `FINAL_IMPLEMENTATION_REPORT.md` - Complete feature overview
- `public/app.md` - Original requirements

## Features by Role

### Admin
- User management
- System-wide analytics
- All CRUD operations
- Project assignment
- Full approval capabilities

### Project Manager
- Manage assigned projects
- Create and assign tasks
- Approve expenses and timesheets
- View project analytics
- Assign team members

### Sales/Finance
- Manage sales and purchase orders
- Create invoices
- Manage partners
- View financial reports

### Team Member
- View assigned projects and tasks
- Submit timesheets
- Submit expenses with receipts
- Comment on tasks
- Track personal progress

## Contributing

This is a private project management system. For questions or issues, please contact the development team.

## License

Private - All Rights Reserved

---

**OneFlow** - Streamline Your Project Management
