# ClariMeet - Your Smart Meeting Assistant

**ClariMeet** is a modern web application that helps you manage your meetings more effectively. Think of it as your personal assistant for video meetings - it records your meetings, creates automatic summaries, tracks important decisions, and helps you stay organized with action items.

## What is ClariMeet?

ClariMeet is designed to make your meeting experience better by:

- 📹 **Recording & Storing Videos**: Upload and store your meeting recordings securely in the cloud
- 📝 **Automatic Transcripts**: Get written transcripts of your meetings automatically
- 🤖 **AI-Powered Summaries**: Let artificial intelligence create meeting summaries with key points and highlights
- ✅ **Action Items Tracking**: Keep track of tasks and decisions made during meetings
- 📊 **Dashboard Overview**: See all your meetings, summaries, and transcripts in one organized place
- 🔐 **Secure Access**: Sign in with Google or create your own account to keep your data safe

Perfect for teams, professionals, students, or anyone who wants to get more value from their meetings!

---

## 🚀 Getting Started

### What You'll Need

Before you start, make sure you have these installed on your computer:

1. **Node.js** (version 18 or newer) - This lets your computer run the application
   - Download from: https://nodejs.org/
   - Choose the "LTS" (Long Term Support) version

2. **Docker Desktop** - This runs the database (where your data is stored)
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install the version for your operating system (Windows or Mac)

3. **Git** (optional but recommended) - This helps you download the project
   - Download from: https://git-scm.com/

---

## 📥 Installation & Setup

### Step 1: Download the Project

If you have Git installed:
```bash
git clone <your-repo-url>
cd ClariMeet
```

Or download the project as a ZIP file and extract it to a folder.

### Step 2: Install Required Packages

Open your terminal (Command Prompt on Windows, Terminal on Mac) in the project folder and run:

```bash
npm install
```

This will download all the necessary components for the application. This may take a few minutes.

### Step 3: Set Up Environment Variables

Create a file named `.env.local` in the main project folder. You can use any text editor (Notepad on Windows, TextEdit on Mac).

Add the following content to the file:

```env
# Database Connection
DATABASE_URL=postgresql://clarimeet_user:clarimeet_password@localhost:5555/clarimeet_db

# Security Key (you can use any random string here)
JWT_SECRET=your-super-secret-key-change-this-in-production

# Google Sign-In (optional - you can add these later)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (for video storage - optional)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important**: Make sure to save this file as `.env.local` (with the dot at the beginning) in the main project folder.

---

## 🪟 Running on Windows

### Step 1: Start Docker Desktop

1. Open Docker Desktop from your Start menu
2. Wait for Docker to fully start (you'll see a whale icon in your system tray)
3. Make sure it says "Docker Desktop is running" in the Docker Desktop window

### Step 2: Start the Database

Open **Command Prompt** or **PowerShell** in the project folder and run:

```bash
npm run db:up
```

This will start the database. Wait until you see "✅ Database container started!"

### Step 3: Set Up the Database Structure

```bash
npm run db:push
```

This creates the necessary tables in your database. You should see "Your database is now in sync with your Prisma schema."

### Step 4: Start the Application

```bash
npm run dev
```

You should see a message like:
```
✓ Ready in 3.2s
- Local:        http://localhost:3000
```

### Step 5: Open in Your Browser

Open your web browser (Chrome, Edge, Firefox, etc.) and go to:

```
http://localhost:3000
```

You should now see the ClariMeet homepage! 🎉

---

## 🍎 Running on Mac

### Step 1: Start Docker Desktop

1. Open Docker Desktop from your Applications folder
2. Wait for Docker to fully start (you'll see a whale icon in your menu bar)
3. Make sure Docker Desktop shows "Docker Desktop is running"

### Step 2: Start the Database

Open **Terminal** (you can find it in Applications > Utilities) and navigate to your project folder:

```bash
cd /path/to/ClariMeet
npm run db:up
```

This will start the database. Wait until you see "✅ Database container started!"

### Step 3: Set Up the Database Structure

```bash
npm run db:push
```

This creates the necessary tables in your database. You should see "Your database is now in sync with your Prisma schema."

### Step 4: Start the Application

```bash
npm run dev
```

You should see a message like:
```
✓ Ready in 3.2s
- Local:        http://localhost:3000
```

### Step 5: Open in Your Browser

Open Safari, Chrome, or any web browser and go to:

```
http://localhost:3000
```

You should now see the ClariMeet homepage! 🎉

---

## 🛠️ Useful Commands

Once everything is set up, here are some helpful commands:

### Database Commands

```bash
# Start the database
npm run db:up

# Stop the database
npm run db:down

# Test database connection
npm run db:test

# View database in browser (Prisma Studio)
npm run db:studio

# Update database structure (after schema changes)
npm run db:push
```

### Development Commands

```bash
# Start the app (do this after database is running)
npm run dev

# Build for production
npm run build

# Start production server (after building)
npm start
```

---

## 🐛 Troubleshooting

### "Can't reach database server" Error

**Problem**: The application can't connect to the database.

**Solution**:
1. Make sure Docker Desktop is running
2. Wait for Docker to fully start (check the system tray/menu bar)
3. Run `npm run db:up` to start the database container
4. Run `npm run db:test` to verify the connection

### "Docker Desktop is not running" Error

**Problem**: Docker Desktop isn't started.

**Solution**:
- **Windows**: Open Docker Desktop from Start menu, wait for it to fully load
- **Mac**: Open Docker Desktop from Applications, wait for the whale icon to appear in menu bar

### Port Already in Use Error

**Problem**: Port 3000 or 5555 is already being used.

**Solution**:
- Close other applications using these ports
- Or restart your computer
- On Windows, you can check what's using a port: `netstat -ano | findstr :3000`
- On Mac, you can check: `lsof -i :3000`

### Module Not Found Errors

**Problem**: Packages aren't installed correctly.

**Solution**:
```bash
# Delete node_modules and package-lock.json
# Windows:
rmdir /s /q node_modules
del package-lock.json

# Mac:
rm -rf node_modules
rm package-lock.json

# Then reinstall
npm install
```

### Database Connection Issues After Restart

**Problem**: Database stopped working after restarting your computer.

**Solution**:
1. Start Docker Desktop
2. Run `npm run db:up` to start the database
3. Run `npm run db:test` to verify it's working

---

## 📁 Project Structure

Here's what the main folders contain:

- **`app/`** - All the pages and features of the application
- **`components/`** - Reusable interface elements (buttons, forms, etc.)
- **`lib/`** - Helper functions and utilities
- **`prisma/`** - Database structure definitions
- **`public/`** - Images and other static files
- **`.env.local`** - Your configuration file (keep this private!)

---

## 🔐 Security Notes

- Never share your `.env.local` file with anyone
- Don't commit `.env.local` to version control (it's already in `.gitignore`)
- Change the `JWT_SECRET` to a random string in production
- Keep your database credentials secure

---

## 🎯 What's Next?

Once you have ClariMeet running:

1. **Sign Up**: Create an account or sign in with Google
2. **Upload a Meeting**: Try uploading a video file
3. **Generate Summary**: Use the AI tools to create meeting summaries
4. **Explore Dashboard**: Check out all the features in the dashboard

---

## 📞 Need Help?

If you run into issues:

1. Check the terminal/command prompt for error messages
2. Make sure all prerequisites are installed correctly
3. Verify Docker Desktop is running
4. Check that your `.env.local` file is set up correctly
5. Try running `npm run db:test` to verify database connectivity

---

## 📝 License

This project is licensed under the MIT License.

---

**Happy meeting management! 🎉**
