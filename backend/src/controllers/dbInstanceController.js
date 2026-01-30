import DBInstance from '../models/DBInstance.js';
import mongoose from 'mongoose';

// Get all DB instances
export const getAllDBInstances = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    const query = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    console.log('Fetching DB instances with query:', query);
    const instances = await DBInstance.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    console.log('Found DB instances:', instances.length);
    res.json(instances);
  } catch (error) {
    console.error('Error fetching DB instances:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single DB instance
export const getDBInstance = async (req, res) => {
  try {
    const instance = await DBInstance.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!instance) {
      return res.status(404).json({ message: 'DB instance not found' });
    }

    res.json(instance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create DB instance (admin only)
export const createDBInstance = async (req, res) => {
  try {
    const { name, connectionString, database, description } = req.body;

    // Validate connection string by trying to connect
    try {
      const testConn = await mongoose.createConnection(connectionString, {
        dbName: database,
        serverSelectionTimeoutMS: 5000,
      }).asPromise();
      await testConn.close();
    } catch (connError) {
      return res.status(400).json({ 
        message: 'Failed to connect to database. Please check connection string.',
        error: connError.message 
      });
    }

    const instance = await DBInstance.create({
      name,
      connectionString,
      database,
      description,
      isActive: true,
      createdBy: req.user._id,
    });

    console.log('Created DB instance:', instance._id, instance.name);

    res.status(201).json(instance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'DB instance name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update DB instance (admin only)
export const updateDBInstance = async (req, res) => {
  try {
    const { name, connectionString, database, description, isActive } = req.body;

    const instance = await DBInstance.findById(req.params.id);
    if (!instance) {
      return res.status(404).json({ message: 'DB instance not found' });
    }

    // If connection string is being updated, validate it
    if (connectionString && connectionString !== instance.connectionString) {
      try {
        const testConn = await mongoose.createConnection(connectionString, {
          dbName: database || instance.database,
          serverSelectionTimeoutMS: 5000,
        }).asPromise();
        await testConn.close();
      } catch (connError) {
        return res.status(400).json({ 
          message: 'Failed to connect to database. Please check connection string.',
          error: connError.message 
        });
      }
      instance.connectionString = connectionString;
    }

    if (name) instance.name = name;
    if (database) instance.database = database;
    if (description !== undefined) instance.description = description;
    if (isActive !== undefined) instance.isActive = isActive;

    await instance.save();

    res.json(instance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'DB instance name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete DB instance (admin only)
export const deleteDBInstance = async (req, res) => {
  try {
    const instance = await DBInstance.findById(req.params.id);
    if (!instance) {
      return res.status(404).json({ message: 'DB instance not found' });
    }

    await instance.deleteOne();

    res.json({ message: 'DB instance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Test DB connection (admin only)
export const testConnection = async (req, res) => {
  try {
    const { connectionString, database } = req.body;

    const testConn = await mongoose.createConnection(connectionString, {
      dbName: database,
      serverSelectionTimeoutMS: 5000,
    }).asPromise();

    // Get list of collections
    const collections = await testConn.db.listCollections().toArray();
    await testConn.close();

    res.json({ 
      success: true, 
      message: 'Connection successful',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Connection failed',
      error: error.message 
    });
  }
};
