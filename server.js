import Fastify from 'fastify';
import postgres from '@fastify/postgres';

const fastify = Fastify({
  logger: true
});

// Database connection string (defaults to provided Railway database)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:yQoDzQkzdRoszGJBOrFQxzBQwtFItetk@switchyard.proxy.rlwy.net:21239/railway';

// Register PostgreSQL plugin
fastify.register(postgres, {
  connectionString: DATABASE_URL
});

// Initialize database table
const initDatabase = async () => {
  const client = await fastify.pg.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    fastify.log.info('Database table initialized');
  } catch (err) {
    fastify.log.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
};

// JSON Schema for item creation
const createItemSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 }
    }
  }
};

// JSON Schema for item update
const updateItemSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 }
    }
  },
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    }
  }
};

// JSON Schema for item ID parameter
const itemIdSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    }
  }
};

// Routes

// GET /items - Get all items
fastify.get('/items', async (request, reply) => {
  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query('SELECT * FROM items ORDER BY id DESC');
    return { items: rows };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { error: 'Failed to fetch items' };
  } finally {
    client.release();
  }
});

// GET /items/:id - Get a single item
fastify.get('/items/:id', { schema: itemIdSchema }, async (request, reply) => {
  const { id } = request.params;
  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      reply.code(404);
      return { error: 'Item not found' };
    }
    
    return rows[0];
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { error: 'Failed to fetch item' };
  } finally {
    client.release();
  }
});

// POST /items - Create a new item
fastify.post('/items', { schema: createItemSchema }, async (request, reply) => {
  const { name, description, price } = request.body;
  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      'INSERT INTO items (name, description, price) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', price || 0]
    );
    
    reply.code(201);
    return rows[0];
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { error: 'Failed to create item' };
  } finally {
    client.release();
  }
});

// PUT /items/:id - Update an item
fastify.put('/items/:id', { schema: updateItemSchema }, async (request, reply) => {
  const { id } = request.params;
  const { name, description, price } = request.body;
  const client = await fastify.pg.connect();
  
  try {
    // First check if item exists
    const checkResult = await client.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      reply.code(404);
      return { error: 'Item not found' };
    }
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    
    if (updates.length === 0) {
      return checkResult.rows[0];
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE items SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await client.query(query, values);
    
    return rows[0];
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { error: 'Failed to update item' };
  } finally {
    client.release();
  }
});

// DELETE /items/:id - Delete an item
fastify.delete('/items/:id', { schema: itemIdSchema }, async (request, reply) => {
  const { id } = request.params;
  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    
    if (rows.length === 0) {
      reply.code(404);
      return { error: 'Item not found' };
    }
    
    return { message: 'Item deleted', item: rows[0] };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { error: 'Failed to delete item' };
  } finally {
    client.release();
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const client = await fastify.pg.connect();
  try {
    await client.query('SELECT 1');
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  } catch (err) {
    fastify.log.error(err);
    reply.code(503);
    return { status: 'error', database: 'disconnected', timestamp: new Date().toISOString() };
  } finally {
    client.release();
  }
});

// Start server
const start = async () => {
  try {
    // Wait for PostgreSQL plugin to be ready
    await fastify.ready();
    
    // Initialize database table
    await initDatabase();
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
