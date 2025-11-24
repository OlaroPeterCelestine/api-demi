# Fastify CRUD API

A simple CRUD (Create, Read, Update, Delete) API built with Fastify.

## Features

- ✅ Full CRUD operations for items
- ✅ PostgreSQL database integration
- ✅ JSON Schema validation
- ✅ Request logging
- ✅ Error handling
- ✅ Health check endpoint with database status

## Installation

```bash
npm install
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Database

This API uses **PostgreSQL** for persistent data storage. The database connection is configured via the `DATABASE_URL` environment variable.

### Database Schema

The `items` table is automatically created on server startup with the following structure:

- `id` - SERIAL PRIMARY KEY
- `name` - VARCHAR(255) NOT NULL
- `description` - TEXT
- `price` - DECIMAL(10, 2) DEFAULT 0
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (defaults to Railway database)
- `PORT` - Server port (defaults to 3000)
- `HOST` - Server host (defaults to 0.0.0.0)

## API Endpoints

### Health Check
- **GET** `/health` - Check server status

### Items CRUD

#### Get All Items
- **GET** `/items`
- **Response:** `{ "items": [...] }`

#### Get Single Item
- **GET** `/items/:id`
- **Response:** `{ "id": 1, "name": "...", ... }`
- **Error:** `404` if item not found

#### Create Item
- **POST** `/items`
- **Body:**
  ```json
  {
    "name": "Item Name" (required),
    "description": "Optional description",
    "price": 0
  }
  ```
- **Response:** `201` with created item

#### Update Item
- **PUT** `/items/:id`
- **Body:** (all fields optional)
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "price": 99.99
  }
  ```
- **Response:** Updated item
- **Error:** `404` if item not found

#### Delete Item
- **DELETE** `/items/:id`
- **Response:** `{ "message": "Item deleted", "item": {...} }`
- **Error:** `404` if item not found

## Example Usage

### Create an item:
```bash
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "description": "Gaming laptop", "price": 1299.99}'
```

### Get all items:
```bash
curl http://localhost:3000/items
```

### Get single item:
```bash
curl http://localhost:3000/items/1
```

### Update an item:
```bash
curl -X PUT http://localhost:3000/items/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 1199.99}'
```

### Delete an item:
```bash
curl -X DELETE http://localhost:3000/items/1
```

## Deployment to Render

This API is configured to deploy to Render.com.

### Prerequisites
- A GitHub account
- A Render.com account (free tier available)

### Steps to Deploy

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration
   - Or manually configure:
     - **Name:** fastify-crud-api
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** Free
   - Click "Create Web Service"

3. **Your API will be live at:**
   `https://fastify-crud-api.onrender.com` (or your custom domain)

The `render.yaml` file is already configured, so Render will automatically use the correct settings.

## Notes

- This API uses PostgreSQL for persistent data storage. Data persists across server restarts.
- The database table is automatically created on first server startup.
- JSON Schema validation ensures request data integrity.
- The server automatically uses the `PORT` environment variable provided by Render.
- Database connection string can be configured via the `DATABASE_URL` environment variable.

# api-demi
