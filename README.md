# E-Commerce Products Catalog

**Live Demo:** 🚀 [https://think41-ecommerce.netlify.app](https://think41-ecommerce.netlify.app)

## Overview

A full-stack MERN e-commerce application built with MongoDB, Express.js, React.js, and Node.js. The platform features 29,000+ products imported from CSV data with normalized database architecture and comprehensive product management.

## Key Features

- **Product Catalog**: Browse 29K+ products with advanced filtering, search, and pagination
- **Department Navigation**: Shop by departments (Men/Women) with dedicated pages
- **Responsive Design**: Mobile-friendly interface with Bootstrap styling
- **RESTful API**: Complete backend with department and product endpoints
- **Database Normalization**: MongoDB with foreign key relationships
- **Real-time Filtering**: Dynamic search by category, brand, price range
- **URL-based Navigation**: Bookmarkable URLs with filter persistence

## Architecture

- **Frontend**: React.js with React Router, responsive UI components
- **Backend**: Express.js RESTful API on port 5000
- **Database**: MongoDB Atlas with normalized collections
- **Deployment**: Frontend on Netlify, backend on cloud hosting

## Navigation

- `/` - Home page with statistics and navigation
- `/products` - All products with filtering
- `/departments` - Department listing
- `/departments/:id` - Department-specific products
- `/products/:id` - Individual product details

## Technologies

React.js, Express.js, MongoDB, Bootstrap, Axios, Mongoose, CSV Parser 