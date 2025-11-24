import Fastify from 'fastify';

const fastify = Fastify({
  logger: true
});

// In-memory data store (replace with database in production)
let items = [];
let nextId = 1;

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
  return { items };
});

// GET /items/:id - Get a single item
fastify.get('/items/:id', { schema: itemIdSchema }, async (request, reply) => {
  const { id } = request.params;
  const item = items.find(i => i.id === parseInt(id));
  
  if (!item) {
    reply.code(404);
    return { error: 'Item not found' };
  }
  
  return item;
});

// POST /items - Create a new item
fastify.post('/items', { schema: createItemSchema }, async (request, reply) => {
  const { name, description, price } = request.body;
  
  const newItem = {
    id: nextId++,
    name,
    description: description || '',
    price: price || 0,
    createdAt: new Date().toISOString()
  };
  
  items.push(newItem);
  reply.code(201);
  return newItem;
});

// PUT /items/:id - Update an item
fastify.put('/items/:id', { schema: updateItemSchema }, async (request, reply) => {
  const { id } = request.params;
  const { name, description, price } = request.body;
  
  const itemIndex = items.findIndex(i => i.id === parseInt(id));
  
  if (itemIndex === -1) {
    reply.code(404);
    return { error: 'Item not found' };
  }
  
  const existingItem = items[itemIndex];
  const updatedItem = {
    ...existingItem,
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price }),
    updatedAt: new Date().toISOString()
  };
  
  items[itemIndex] = updatedItem;
  return updatedItem;
});

// DELETE /items/:id - Delete an item
fastify.delete('/items/:id', { schema: itemIdSchema }, async (request, reply) => {
  const { id } = request.params;
  const itemIndex = items.findIndex(i => i.id === parseInt(id));
  
  if (itemIndex === -1) {
    reply.code(404);
    return { error: 'Item not found' };
  }
  
  const deletedItem = items.splice(itemIndex, 1)[0];
  return { message: 'Item deleted', item: deletedItem };
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
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

