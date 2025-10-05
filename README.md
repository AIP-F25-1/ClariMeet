# ClariMeet - AI-Powered Meeting Transcription & Analysis

A modern web application for real-time meeting transcriptions, AI-powered summaries, and intelligent meeting analytics. Built with Next.js, TypeScript, and powered by advanced AI technologies.

## 🚀 Features

- **Real-time Transcription**: Live meeting transcription with speaker identification
- **AI-Powered Summaries**: Intelligent meeting summaries and key insights
- **Smart Analytics**: Meeting analytics and performance metrics
- **User Authentication**: Secure Google OAuth and email/password authentication
- **Responsive Design**: Modern, sleek UI with dark theme
- **Dashboard**: Comprehensive dashboard with sidebar navigation
- **Database Integration**: PostgreSQL with Prisma ORM

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Animations**: GSAP, Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth, JWT tokens
- **Containerization**: Docker & Docker Compose
- **3D Graphics**: Three.js, OGL

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ClariMeet
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://clarimeet_user:clarimeet_password@localhost:5432/clarimeet_db"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Database Setup

Start the PostgreSQL database using Docker:

```bash
# Start the database
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Push the database schema
npm run db:push
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
ClariMeet/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   └── contexts/        # React contexts
├── lib/                 # Utility functions
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── styles/             # Global styles
└── docker-compose.yml  # Database configuration
```

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Database Schema

The application uses a simple User model with the following fields:
- `id`: Unique identifier
- `email`: User email address
- `name`: User's full name
- `password`: Hashed password (for email/password auth)
- `googleId`: Google OAuth ID (optional)
- `picture`: Profile picture URL
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

## 🎨 UI Components

The application uses a comprehensive set of UI components:

- **Radix UI**: Headless, accessible components
- **Tailwind CSS**: Utility-first styling
- **Custom Components**: Animated logos, sidebars, and tracing beams
- **Responsive Design**: Mobile-first approach

## 🔐 Authentication

The application supports two authentication methods:

### 1. Google OAuth (Recommended)
- Set up Google OAuth credentials in Google Cloud Console
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`
- Users can sign in with their Google accounts

### 2. Email/Password Authentication
- Users can create accounts with email and password
- Passwords are securely hashed using bcrypt
- JWT tokens are used for session management

## 🚀 Deployment

### Production Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"
```

## 🐳 Docker Deployment

### Database Only (Development)

```bash
# Start PostgreSQL database
docker-compose up -d

# Stop database
docker-compose down
```

### Full Application (Production)

Create a `Dockerfile` for the Next.js application and use Docker Compose for full deployment.

## 🛠️ Development Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:studio     # Open Prisma Studio
```

## 🎯 Key Features Implementation

### Animated Tracing Beam
- Custom scroll indicator on the left side
- Smooth animations using CSS transitions
- Responsive design for all screen sizes

### Dashboard Sidebar
- Collapsible sidebar with hover effects
- User profile integration
- Navigation between different sections

### Particle Background
- Canvas-based particle system for dashboard pages
- Customizable particle density and colors
- Smooth animations and performance optimized

### Google Authentication
- OAuth 2.0 integration
- Secure token handling
- User profile management

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure Docker is running
   - Check if PostgreSQL container is started: `docker-compose ps`
   - Verify DATABASE_URL in `.env.local`

2. **Module Not Found Errors**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

3. **Authentication Issues**
   - Verify Google OAuth credentials
   - Check JWT_SECRET is set
   - Ensure callback URLs are configured correctly

4. **Build Errors**
   - Check TypeScript errors: `npm run lint`
   - Verify all dependencies are installed
   - Clear Next.js cache: `rm -rf .next`

### Getting Help

If you encounter issues:

1. Check the terminal output for specific error messages
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed
4. Check the browser console for client-side errors

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Happy coding! 🎉**