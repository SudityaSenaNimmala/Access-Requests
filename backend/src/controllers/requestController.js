import Request from '../models/Request.js';
import DBInstance from '../models/DBInstance.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import queryExecutor from '../services/queryExecutor.js';

// Create a new request
export const createRequest = async (req, res) => {
  try {
    const { dbInstanceId, reason, query, teamLeadId } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Extract collection name from query (e.g., db.users.find() -> users)
    const collectionMatch = query.match(/db\.(\w+)\./);
    const collectionName = collectionMatch ? collectionMatch[1] : 'unknown';

    // Determine query type from the method
    const methodMatch = query.match(/db\.\w+\.(\w+)\s*\(/);
    const queryType = methodMatch ? methodMatch[1] : 'custom';

    // Validate DB instance exists and is active
    const dbInstance = await DBInstance.findById(dbInstanceId);
    if (!dbInstance || !dbInstance.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive database instance' });
    }

    // Validate team lead exists and has correct role
    const teamLead = await User.findById(teamLeadId);
    if (!teamLead || !['team_lead', 'admin'].includes(teamLead.role)) {
      return res.status(400).json({ message: 'Invalid team lead' });
    }

    // Create the request
    const request = await Request.create({
      developerId: req.user._id,
      developerName: req.user.name,
      developerEmail: req.user.email,
      dbInstanceId,
      dbInstanceName: dbInstance.name,
      reason,
      query,
      collectionName,
      queryType,
      teamLeadId,
      teamLeadName: teamLead.name,
    });

    // Notify team lead via email
    await emailService.notifyTeamLeadNewRequest(teamLead, request, req.user);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${teamLeadId}`).emit('new_request', {
        requestId: request._id,
        developerName: req.user.name,
        dbInstanceName: dbInstance.name,
      });
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get requests for developer
export const getDeveloperRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { developerId: req.user._id };
    if (status) {
      query.status = status;
    }

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('dbInstanceId', 'name database')
      .populate('teamLeadId', 'name email');

    const total = await Request.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for team lead
export const getTeamLeadRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { teamLeadId: req.user._id };
    if (status) {
      query.status = status;
    }

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('dbInstanceId', 'name database')
      .populate('developerId', 'name email');

    const total = await Request.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single request
export const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('dbInstanceId', 'name database')
      .populate('developerId', 'name email')
      .populate('teamLeadId', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user has access to this request
    const userId = req.user._id.toString();
    const isOwner = request.developerId._id.toString() === userId;
    const isTeamLead = request.teamLeadId._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTeamLead && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve request (team lead only)
export const approveRequest = async (req, res) => {
  try {
    const { comment } = req.body;
    
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the assigned team lead or admin
    if (request.teamLeadId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Update request status
    request.status = 'approved';
    request.reviewComment = comment;
    request.reviewedAt = new Date();
    await request.save();

    // Execute the query
    const executionResult = await queryExecutor.executeQuery(request);

    if (executionResult.success) {
      request.status = 'executed';
      request.result = executionResult.result;
      request.executedAt = new Date();
    } else {
      request.status = 'failed';
      request.error = executionResult.error;
    }
    await request.save();

    // Get developer for notification
    const developer = await User.findById(request.developerId);

    // Send email notification
    if (request.status === 'executed') {
      await emailService.notifyDeveloperRequestApproved(developer, request);
    } else {
      await emailService.notifyDeveloperQueryFailed(developer, request, executionResult.error);
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.developerId}`).emit('request_updated', {
        requestId: request._id,
        status: request.status,
        hasResult: request.status === 'executed',
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reject request (team lead only)
export const rejectRequest = async (req, res) => {
  try {
    const { comment } = req.body;
    
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the assigned team lead or admin
    if (request.teamLeadId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    request.status = 'rejected';
    request.reviewComment = comment;
    request.reviewedAt = new Date();
    await request.save();

    // Get developer for notification
    const developer = await User.findById(request.developerId);
    await emailService.notifyDeveloperRequestRejected(developer, request);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.developerId}`).emit('request_updated', {
        requestId: request._id,
        status: 'rejected',
      });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all requests (admin only)
export const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('dbInstanceId', 'name database')
      .populate('developerId', 'name email')
      .populate('teamLeadId', 'name email');

    const total = await Request.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resubmit a failed request (developer only)
export const resubmitRequest = async (req, res) => {
  try {
    const { query } = req.body;
    
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the owner of this request
    if (request.developerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to resubmit this request' });
    }

    // Only allow resubmission of failed requests
    if (request.status !== 'failed') {
      return res.status(400).json({ message: 'Only failed requests can be resubmitted' });
    }

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Extract collection name from query
    const collectionMatch = query.match(/db\.(\w+)\./);
    const collectionName = collectionMatch ? collectionMatch[1] : 'unknown';

    // Determine query type from the method
    const methodMatch = query.match(/db\.\w+\.(\w+)\s*\(/);
    const queryType = methodMatch ? methodMatch[1] : 'custom';

    // Update the request with new query and reset status to pending
    request.query = query;
    request.collectionName = collectionName;
    request.queryType = queryType;
    request.status = 'pending';
    request.error = null;
    request.result = null;
    request.reviewComment = null;
    request.reviewedAt = null;
    request.executedAt = null;
    request.resubmittedAt = new Date();
    await request.save();

    // Get team lead for notification
    const teamLead = await User.findById(request.teamLeadId);

    // Notify team lead via email
    await emailService.notifyTeamLeadNewRequest(teamLead, request, req.user);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.teamLeadId}`).emit('new_request', {
        requestId: request._id,
        developerName: req.user.name,
        dbInstanceName: request.dbInstanceName,
        isResubmission: true,
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Resubmit request error:', error);
    res.status(500).json({ message: error.message });
  }
};
