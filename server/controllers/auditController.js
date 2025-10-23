import {pool} from '../libs/database.js';
import { logAudit } from "../libs/auditLogger.js";

export const getAuditLogs = async (req, res) => {
  try {
    const user_id = req.user?.user_id || null;
    const {
      page = 1,
      limit = 50,
      user_filter,
      patient_filter,
      hospital_filter,
      branch_filter,
      action_type,
      event_type,
      table_name,
      start_date,
      end_date,
      ip_address,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (user_filter) {
      whereConditions.push(`al.user_id = $${paramCount}`);
      queryParams.push(user_filter);
      paramCount++;
    }

    if (patient_filter) {
      whereConditions.push(`al.patient_id = $${paramCount}`);
      queryParams.push(patient_filter);
      paramCount++;
    }

    if (hospital_filter) {
      whereConditions.push(`al.hospital_id = $${paramCount}`);
      queryParams.push(hospital_filter);
      paramCount++;
    }

    if (branch_filter) {
      whereConditions.push(`al.branch_id = $${paramCount}`);
      queryParams.push(branch_filter);
      paramCount++;
    }

    if (action_type) {
      whereConditions.push(`al.action_type = $${paramCount}`);
      queryParams.push(action_type);
      paramCount++;
    }

    if (event_type) {
      whereConditions.push(`al.event_type = $${paramCount}`);
      queryParams.push(event_type);
      paramCount++;
    }

    if (table_name) {
      whereConditions.push(`al.table_name = $${paramCount}`);
      queryParams.push(table_name);
      paramCount++;
    }

    if (ip_address) {
      whereConditions.push(`al.ip_address = $${paramCount}`);
      queryParams.push(ip_address);
      paramCount++;
    }

    if (start_date) {
      whereConditions.push(`al.timestamp >= $${paramCount}`);
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereConditions.push(`al.timestamp <= $${paramCount}`);
      queryParams.push(end_date);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(
        al.event_type ILIKE $${paramCount} OR 
        al.table_name ILIKE $${paramCount} OR 
        al.endpoint ILIKE $${paramCount} OR
        CAST(al.ip_address AS TEXT) ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        al.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        h.hospital_name,
        b.branch_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN patients p ON al.patient_id = p.patient_id
      LEFT JOIN hospitals h ON al.hospital_id = h.hospital_id
      LEFT JOIN branches b ON al.branch_id = b.branch_id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); 

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: {
        logs: logsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: total,
          per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const { log_id } = req.params;

    if (!log_id) {
      return res.status(400).json({
        status: "failed",
        message: "Log ID is required"
      });
    }

    const query = `
      SELECT 
        al.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.role as user_role,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.patient_number,
        h.hospital_name,
        b.branch_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN patients p ON al.patient_id = p.patient_id
      LEFT JOIN hospitals h ON al.hospital_id = h.hospital_id
      LEFT JOIN branches b ON al.branch_id = b.branch_id
      WHERE al.log_id = $1
    `;

    const result = await pool.query(query, [log_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Audit log not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};

export const getUserAuditLogs = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 50, start_date, end_date } = req.query;

    if (!user_id) {
      return res.status(400).json({
        status: "failed",
        message: "User ID is required"
      });
    }

    const offset = (page - 1) * limit;
    let whereConditions = [`al.user_id = $1`];
    let queryParams = [user_id];
    let paramCount = 2;

    if (start_date) {
      whereConditions.push(`al.timestamp >= $${paramCount}`);
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereConditions.push(`al.timestamp <= $${paramCount}`);
      queryParams.push(end_date);
      paramCount++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT 
        al.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        h.hospital_name,
        b.branch_name
      FROM audit_logs al
      LEFT JOIN patients p ON al.patient_id = p.patient_id
      LEFT JOIN hospitals h ON al.hospital_id = h.hospital_id
      LEFT JOIN branches b ON al.branch_id = b.branch_id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: {
        logs: logsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};

export const getPatientAuditLogs = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "Patient ID is required"
      });
    }

    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        al.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        h.hospital_name,
        b.branch_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN hospitals h ON al.hospital_id = h.hospital_id
      LEFT JOIN branches b ON al.branch_id = b.branch_id
      WHERE al.patient_id = $1
      ORDER BY al.timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      WHERE patient_id = $1
    `;

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, [patient_id, limit, offset]),
      pool.query(countQuery, [patient_id])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: {
        logs: logsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};

export const getAuditStatistics = async (req, res) => {
  try {
    const { start_date, end_date, hospital_id, branch_id } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`timestamp >= $${paramCount}`);
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereConditions.push(`timestamp <= $${paramCount}`);
      queryParams.push(end_date);
      paramCount++;
    }

    if (hospital_id) {
      whereConditions.push(`hospital_id = $${paramCount}`);
      queryParams.push(hospital_id);
      paramCount++;
    }

    if (branch_id) {
      whereConditions.push(`branch_id = $${paramCount}`);
      queryParams.push(branch_id);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const statsQuery = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT patient_id) as unique_patients,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(CASE WHEN event_type = 'Create' THEN 1 END) as creates,
        COUNT(CASE WHEN event_type = 'Read' THEN 1 END) as reads,
        COUNT(CASE WHEN event_type = 'Update' THEN 1 END) as updates,
        COUNT(CASE WHEN event_type = 'Delete' THEN 1 END) as deletes,
        jsonb_object_agg(
          COALESCE(table_name, 'unknown'),
          table_count
        ) as activity_by_table
      FROM (
        SELECT 
          *,
          COUNT(*) OVER (PARTITION BY table_name) as table_count
        FROM audit_logs
        ${whereClause}
      ) subquery
    `;

    const activityQuery = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs
      ${whereClause}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `;

    const topUsersQuery = `
      SELECT 
        al.user_id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(*) as action_count
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause}
      GROUP BY al.user_id, u.first_name, u.last_name, u.email
      ORDER BY action_count DESC
      LIMIT 10
    `;

    const [statsResult, activityResult, topUsersResult] = await Promise.all([
      pool.query(statsQuery, queryParams),
      pool.query(activityQuery, queryParams),
      pool.query(topUsersQuery, queryParams)
    ]);

    res.status(200).json({
      status: "success",
      data: {
        statistics: statsResult.rows[0],
        daily_activity: activityResult.rows,
        top_users: topUsersResult.rows
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};

export const getRecentAuditLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const query = `
      SELECT 
        al.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        h.hospital_name,
        b.branch_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN patients p ON al.patient_id = p.patient_id
      LEFT JOIN hospitals h ON al.hospital_id = h.hospital_id
      LEFT JOIN branches b ON al.branch_id = b.branch_id
      ORDER BY al.timestamp DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    res.status(200).json({
      status: "success",
      data: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};

export const exportAuditLogs = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      hospital_id,
      branch_id,
      user_id,
      event_type
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`al.timestamp >= $${paramCount}`);
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereConditions.push(`al.timestamp <= $${paramCount}`);
      queryParams.push(end_date);
      paramCount++;
    }

    if (hospital_id) {
      whereConditions.push(`al.hospital_id = $${paramCount}`);
      queryParams.push(hospital_id);
      paramCount++;
    }

    if (branch_id) {
      whereConditions.push(`al.branch_id = $${paramCount}`);
      queryParams.push(branch_id);
      paramCount++;
    }

    if (user_id) {
      whereConditions.push(`al.user_id = $${paramCount}`);
      queryParams.push(user_id);
      paramCount++;
    }

    if (event_type) {
      whereConditions.push(`al.event_type = $${paramCount}`);
      queryParams.push(event_type);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        al.log_id,
        al.timestamp,
        al.event_type,
        al.action_type,
        al.table_name,
        al.request_method,
        al.endpoint,
        al.ip_address,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        h.hospital_name,
        b.branch_name,
        al.old_values,
        al.new_values
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN patients p ON al.patient_id = p.patient_id
      LEFT JOIN hospitals h ON al.hospital_id = h.hospital_id
      LEFT JOIN branches b ON al.branch_id = b.branch_id
      ${whereClause}
      ORDER BY al.timestamp DESC
    `;

    const result = await pool.query(query, queryParams);

    res.status(200).json({
      status: "success",
      data: result.rows,
      message: "Audit logs exported successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};

export const getHospitalAuditLogs = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    
    if (!user_id) {
      return res.status(401).json({
        status: "failed",
        message: "User authentication required"
      });
    }

    const {
      page = 1,
      limit = 50,
      branch_filter,
      action_type,
      event_type,
      table_name,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    const userQuery = `
      SELECT hospital_id 
      FROM users 
      WHERE user_id = $1
    `;
    
    const userResult = await pool.query(userQuery, [user_id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      });
    }

    const hospital_id = userResult.rows[0].hospital_id;
    
    if (!hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "User is not associated with any hospital"
      });
    }

    let whereConditions = [`al.hospital_id = $1`];
    let queryParams = [hospital_id];
    let paramCount = 2;

    if (branch_filter) {
      whereConditions.push(`al.branch_id = $${paramCount}`);
      queryParams.push(branch_filter);
      paramCount++;
    }

    if (action_type) {
      whereConditions.push(`al.action_type = $${paramCount}`);
      queryParams.push(action_type);
      paramCount++;
    }

    if (event_type) {
      whereConditions.push(`al.event_type = $${paramCount}`);
      queryParams.push(event_type);
      paramCount++;
    }

    if (table_name) {
      whereConditions.push(`al.table_name = $${paramCount}`);
      queryParams.push(table_name);
      paramCount++;
    }

    if (start_date) {
      whereConditions.push(`al.timestamp >= $${paramCount}`);
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereConditions.push(`al.timestamp <= $${paramCount}`);
      queryParams.push(end_date);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(
        al.event_type ILIKE $${paramCount} OR 
        al.table_name ILIKE $${paramCount} OR 
        al.endpoint ILIKE $${paramCount} OR
        CAST(al.ip_address AS TEXT) ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT 
        al.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.role_id as user_role_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        h.hospital_name,
        b.branch_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN patients p ON al.patient_id = p.patient_id
      LEFT JOIN hospitals h ON al.hospital_id = h.hospital_id
      LEFT JOIN branches b ON al.branch_id = b.branch_id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit and offset

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: {
        hospital_id,
        logs: logsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: total,
          per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};