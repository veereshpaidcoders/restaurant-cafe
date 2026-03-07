#!/bin/bash

# Restaurant Management System - Quick Start Script

echo "🍽️  Restaurant Management System - Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v13 or higher."
    exit 1
fi

echo "✓ PostgreSQL found"

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials before continuing."
    echo "   Press Enter when ready..."
    read
fi

# Install dependencies
echo ""
echo "📦 Installing backend dependencies..."
npm install

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Ask about database setup
echo ""
echo "🗄️  Database Setup"
read -p "Have you created the PostgreSQL database 'restaurant_db'? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the database first:"
    echo "  createdb restaurant_db"
    echo "  OR use psql: CREATE DATABASE restaurant_db;"
    exit 1
fi

# Seed database
echo ""
read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    node backend/seedDatabase.js
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Option 1 - Start servers separately:"
echo "   Terminal 1: npm run server"
echo "   Terminal 2: npm run client"
echo ""
echo "   Option 2 - Start both (recommended):"
echo "   Press Enter to start both servers now..."
read

echo ""
echo "Starting Restaurant Management System..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Default login: admin@restaurant.com / admin123"
echo ""

# Start both servers
npm run server &
cd frontend && npm start
