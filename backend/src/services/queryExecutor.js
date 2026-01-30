import mongoose from 'mongoose';
import DBInstance from '../models/DBInstance.js';

class QueryExecutor {
  constructor() {
    this.connections = new Map();
  }

  async getConnection(dbInstanceId) {
    // Check if we already have a connection
    if (this.connections.has(dbInstanceId.toString())) {
      const conn = this.connections.get(dbInstanceId.toString());
      if (conn.readyState === 1) {
        return conn;
      }
      // Connection is not ready, remove it
      this.connections.delete(dbInstanceId.toString());
    }

    // Get DB instance and create new connection
    const dbInstance = await DBInstance.findById(dbInstanceId);
    if (!dbInstance) {
      throw new Error('Database instance not found');
    }

    const connectionString = dbInstance.getConnectionString();
    const conn = await mongoose.createConnection(connectionString, {
      dbName: dbInstance.database,
    }).asPromise();

    this.connections.set(dbInstanceId.toString(), conn);
    return conn;
  }

  async executeQuery(request) {
    const { dbInstanceId, query } = request;
    
    try {
      const conn = await this.getConnection(dbInstanceId);
      const db = conn.db;

      // Parse the MongoDB shell-style query
      const result = await this.executeMongoQuery(db, query);

      return {
        success: true,
        result: result.data,
        executionTime: result.executionTime,
        rowCount: Array.isArray(result.data) ? result.data.length : 1,
      };
    } catch (error) {
      console.error('Query execution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async executeMongoQuery(db, queryString) {
    const startTime = Date.now();
    
    // Remove comments and trim
    const cleanQuery = queryString
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .trim();

    // Parse the query to extract collection and operation
    // Supports formats like:
    // db.collection.find({})
    // db.collection.aggregate([])
    // db.collection.insertOne({})
    // db.getCollection("name").find({})
    // db.runCommand({})
    // db.currentOp({})
    // db.adminCommand({})

    let result;

    // Handle db.currentOp() - admin command
    if (cleanQuery.match(/^db\.currentOp\s*\(/)) {
      const { args: argsStr, remainder: postProcess } = this.extractMethodArgs(cleanQuery, 'db.currentOp');
      
      let filter = {};
      if (argsStr && argsStr.trim()) {
        try {
          const parsed = this.parseArgs(argsStr);
          filter = Array.isArray(parsed) ? parsed[0] || {} : parsed;
        } catch (e) {
          console.log('Failed to parse currentOp args:', e.message);
        }
      }
      
      console.log('Executing currentOp with filter:', JSON.stringify(filter));
      
      // Use aggregate with $currentOp for better compatibility
      try {
        const adminDb = db.admin();
        const pipeline = [
          { $currentOp: { allUsers: true, idleSessions: false, ...filter } }
        ];
        const opResult = await adminDb.aggregate(pipeline).toArray();
        
        // Handle post-processing like .inprog.length
        if (postProcess) {
          // For currentOp, the result is already an array (like inprog)
          result = this.applyPostProcess({ inprog: opResult }, postProcess);
        } else {
          result = opResult;
        }
      } catch (aggError) {
        // Fallback to old method for older MongoDB versions
        console.log('Aggregate $currentOp failed, trying command:', aggError.message);
        const adminDb = db.admin();
        const opResult = await adminDb.command({ currentOp: true, ...filter });
        
        if (postProcess) {
          result = this.applyPostProcess(opResult, postProcess);
        } else {
          result = opResult.inprog || opResult;
        }
      }
    }
    // Handle db.runCommand()
    else if (cleanQuery.match(/^db\.runCommand\s*\(/)) {
      const { args: argsStr, remainder: postProcess } = this.extractMethodArgs(cleanQuery, 'db.runCommand');
      let command = {};
      if (argsStr && argsStr.trim()) {
        const parsed = this.parseArgs(argsStr);
        command = Array.isArray(parsed) ? parsed[0] || {} : parsed;
      }
      result = await db.command(command);
      if (postProcess) {
        result = this.applyPostProcess(result, postProcess);
      }
    }
    // Handle db.adminCommand()
    else if (cleanQuery.match(/^db\.adminCommand\s*\(/)) {
      const { args: argsStr, remainder: postProcess } = this.extractMethodArgs(cleanQuery, 'db.adminCommand');
      let command = {};
      if (argsStr && argsStr.trim()) {
        const parsed = this.parseArgs(argsStr);
        command = Array.isArray(parsed) ? parsed[0] || {} : parsed;
      }
      const adminDb = db.admin();
      result = await adminDb.command(command);
      if (postProcess) {
        result = this.applyPostProcess(result, postProcess);
      }
    }
    // Handle db.getCollection("name").method()
    else if (cleanQuery.match(/^db\.getCollection\s*\(/)) {
      const collMatch = cleanQuery.match(/^db\.getCollection\s*\(\s*["']([^"']+)["']\s*\)\.(\w+)\s*\(/);
      if (!collMatch) {
        throw new Error('Invalid getCollection query format');
      }
      const [, collectionName, method] = collMatch;
      const methodStart = cleanQuery.indexOf(`)\.${method}(`) + `)\.${method}`.length;
      const { args: argsStr } = this.extractMethodArgs(cleanQuery.substring(methodStart - method.length - 1), method);
      result = await this.executeCollectionMethod(db, collectionName, method, argsStr, cleanQuery);
    }
    // Handle db.collection.method()
    else if (cleanQuery.match(/^db\.\w+\.\w+/)) {
      const match = cleanQuery.match(/^db\.(\w+)\.(\w+)\s*\(/);
      if (!match) {
        throw new Error('Invalid query format. Expected: db.collection.method(args)');
      }
      const [, collectionName, method] = match;
      const { args: argsStr } = this.extractMethodArgs(cleanQuery, `db.${collectionName}.${method}`);
      result = await this.executeCollectionMethod(db, collectionName, method, argsStr, cleanQuery);
    }
    else {
      throw new Error('Unsupported query format. Use db.collection.method() syntax');
    }

    const executionTime = Date.now() - startTime;
    return { data: result, executionTime };
  }

  // Extract arguments from a method call, handling nested braces/brackets
  extractMethodArgs(query, methodPrefix) {
    const startIdx = query.indexOf(methodPrefix);
    if (startIdx === -1) {
      return { args: '', remainder: '' };
    }
    
    // Find the opening parenthesis
    let parenStart = query.indexOf('(', startIdx + methodPrefix.length);
    if (parenStart === -1) {
      return { args: '', remainder: '' };
    }
    
    // Track nested braces/brackets/parens
    let depth = 1;
    let i = parenStart + 1;
    let inString = false;
    let stringChar = '';
    
    while (i < query.length && depth > 0) {
      const char = query[i];
      const prevChar = i > 0 ? query[i - 1] : '';
      
      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
      
      if (!inString) {
        if (char === '(' || char === '{' || char === '[') {
          depth++;
        } else if (char === ')' || char === '}' || char === ']') {
          depth--;
        }
      }
      
      i++;
    }
    
    const args = query.substring(parenStart + 1, i - 1);
    const remainder = query.substring(i).trim();
    
    return { args, remainder };
  }

  async executeCollectionMethod(db, collectionName, method, argsStr, fullQuery = '') {
    const collection = db.collection(collectionName);
    const args = this.parseArgs(argsStr);

    // Parse chained methods from full query (e.g., .limit(10).sort({_id:-1}))
    const chainedMethods = this.parseChainedMethods(fullQuery, method);

    switch (method) {
      case 'find': {
        const filter = args[0] || {};
        const projection = args[1] || {};
        let cursor = collection.find(filter);
        
        if (Object.keys(projection).length > 0) {
          cursor = cursor.project(projection);
        }
        
        // Apply chained methods
        for (const chain of chainedMethods) {
          if (chain.method === 'limit' && chain.args[0]) {
            cursor = cursor.limit(chain.args[0]);
          } else if (chain.method === 'skip' && chain.args[0]) {
            cursor = cursor.skip(chain.args[0]);
          } else if (chain.method === 'sort' && chain.args[0]) {
            cursor = cursor.sort(chain.args[0]);
          } else if (chain.method === 'project' && chain.args[0]) {
            cursor = cursor.project(chain.args[0]);
          }
        }
        
        // Default limit if not specified
        if (!chainedMethods.some(c => c.method === 'limit')) {
          cursor = cursor.limit(100);
        }
        
        return await cursor.toArray();
      }

      case 'findOne': {
        const filter = args[0] || {};
        const options = args[1] || {};
        return await collection.findOne(filter, options);
      }

      case 'aggregate': {
        const pipeline = args[0] || [];
        const options = args[1] || {};
        return await collection.aggregate(pipeline, options).toArray();
      }

      case 'countDocuments': {
        const filter = args[0] || {};
        const options = args[1] || {};
        return await collection.countDocuments(filter, options);
      }

      case 'estimatedDocumentCount': {
        return await collection.estimatedDocumentCount();
      }

      case 'distinct': {
        const field = args[0];
        const filter = args[1] || {};
        return await collection.distinct(field, filter);
      }

      case 'insertOne': {
        const doc = args[0];
        if (!doc) throw new Error('Document required for insertOne');
        return await collection.insertOne(doc);
      }

      case 'insertMany': {
        const docs = args[0];
        if (!docs || !Array.isArray(docs)) throw new Error('Array of documents required for insertMany');
        return await collection.insertMany(docs);
      }

      case 'updateOne': {
        const filter = args[0] || {};
        const update = args[1];
        const options = args[2] || {};
        if (!update) throw new Error('Update document required for updateOne');
        return await collection.updateOne(filter, update, options);
      }

      case 'updateMany': {
        const filter = args[0] || {};
        const update = args[1];
        const options = args[2] || {};
        if (!update) throw new Error('Update document required for updateMany');
        return await collection.updateMany(filter, update, options);
      }

      case 'replaceOne': {
        const filter = args[0] || {};
        const replacement = args[1];
        const options = args[2] || {};
        if (!replacement) throw new Error('Replacement document required for replaceOne');
        return await collection.replaceOne(filter, replacement, options);
      }

      case 'deleteOne': {
        const filter = args[0] || {};
        return await collection.deleteOne(filter);
      }

      case 'deleteMany': {
        const filter = args[0] || {};
        return await collection.deleteMany(filter);
      }

      case 'findOneAndUpdate': {
        const filter = args[0] || {};
        const update = args[1];
        const options = args[2] || {};
        return await collection.findOneAndUpdate(filter, update, options);
      }

      case 'findOneAndDelete': {
        const filter = args[0] || {};
        const options = args[1] || {};
        return await collection.findOneAndDelete(filter, options);
      }

      case 'findOneAndReplace': {
        const filter = args[0] || {};
        const replacement = args[1];
        const options = args[2] || {};
        return await collection.findOneAndReplace(filter, replacement, options);
      }

      case 'createIndex': {
        const keys = args[0];
        const options = args[1] || {};
        return await collection.createIndex(keys, options);
      }

      case 'dropIndex': {
        const indexName = args[0];
        return await collection.dropIndex(indexName);
      }

      case 'indexes': {
        return await collection.indexes();
      }

      case 'stats': {
        return await collection.stats();
      }

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  parseChainedMethods(fullQuery, primaryMethod) {
    const chainedMethods = [];
    
    // Find all chained method calls after the primary method
    // e.g., db.users.find({}).limit(10).sort({_id:-1})
    const chainRegex = /\.(\w+)\s*\(([^)]*)\)/g;
    let match;
    let foundPrimary = false;
    
    while ((match = chainRegex.exec(fullQuery)) !== null) {
      if (match[1] === primaryMethod) {
        foundPrimary = true;
        continue;
      }
      if (foundPrimary) {
        try {
          const args = match[2].trim() ? this.parseArgs(match[2]) : [];
          chainedMethods.push({
            method: match[1],
            args: args
          });
        } catch (e) {
          // Skip if can't parse
        }
      }
    }
    
    return chainedMethods;
  }

  applyPostProcess(result, postProcess) {
    // Handle property access like .inprog.length, .count, etc.
    if (!postProcess) return result;
    
    // Split by dots and access properties
    const parts = postProcess.split('.').filter(p => p.trim());
    let current = result;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }
      // Handle array index access like [0]
      const indexMatch = part.match(/^(\w+)?\[(\d+)\]$/);
      if (indexMatch) {
        if (indexMatch[1]) {
          current = current[indexMatch[1]];
        }
        current = current?.[parseInt(indexMatch[2])];
      } else {
        current = current[part];
      }
    }
    
    return current;
  }

  parseArgs(argsStr) {
    if (!argsStr || !argsStr.trim()) {
      return [];
    }

    try {
      // Create a safe evaluation context using Function constructor
      // This allows us to parse MongoDB shell syntax directly
      const parseMongoSyntax = (str) => {
        // Replace MongoDB-specific types with JS equivalents
        let processed = str
          // Handle ObjectId - convert to string for now
          .replace(/ObjectId\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"')
          .replace(/ObjectId\s*\(\s*\)/g, '""')
          // Handle ISODate / new Date
          .replace(/ISODate\s*\(\s*["']([^"']+)["']\s*\)/g, 'new Date("$1")')
          .replace(/ISODate\s*\(\s*\)/g, 'new Date()')
          // Handle NumberLong
          .replace(/NumberLong\s*\(\s*["']?(-?\d+)["']?\s*\)/g, '$1')
          // Handle NumberInt
          .replace(/NumberInt\s*\(\s*["']?(-?\d+)["']?\s*\)/g, '$1')
          // Handle NumberDecimal
          .replace(/NumberDecimal\s*\(\s*["']?([^"')]+)["']?\s*\)/g, '$1')
          // Handle UUID
          .replace(/UUID\s*\(\s*["']([^"']+)["']\s*\)/g, '"$1"')
          // Handle BinData
          .replace(/BinData\s*\(\s*\d+\s*,\s*["']([^"']+)["']\s*\)/g, '"$1"')
          // Handle Timestamp
          .replace(/Timestamp\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, '{"t": $1, "i": $2}');

        // Use Function constructor to safely evaluate MongoDB shell syntax
        // This handles unquoted keys like { name: "value" }
        const fn = new Function(`return [${processed}]`);
        return fn();
      };

      return parseMongoSyntax(argsStr);
    } catch (error) {
      console.error('Error parsing query arguments:', error.message);
      console.error('Args string:', argsStr);
      throw new Error(`Failed to parse query arguments: ${error.message}`);
    }
  }

  async closeConnection(dbInstanceId) {
    if (this.connections.has(dbInstanceId.toString())) {
      const conn = this.connections.get(dbInstanceId.toString());
      await conn.close();
      this.connections.delete(dbInstanceId.toString());
    }
  }

  async closeAllConnections() {
    for (const [id, conn] of this.connections) {
      await conn.close();
    }
    this.connections.clear();
  }
}

export default new QueryExecutor();
