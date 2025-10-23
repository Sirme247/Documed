import bcrypt from 'bcrypt';    
import crypto from 'crypto';
import nodemailer from 'nodemailer'


import { logAudit } from "../libs/auditLogger.js";
import {pool} from '../libs/database.js';
import { hashedPassword, createJWT, comparePassword } from '../libs/index.js';

const safe = (val) => (val !== undefined ? val : null);


export const getUser = async (req, res) => {
  try {
    const user_id = req.user.user_id; 
    const result = await pool.query(
      `SELECT 
         u.user_id,
         u.first_name,
         u.middle_name,
         u.last_name,
         u.username,
         u.date_of_birth,
         u.gender,
         u.email,
         u.contact_info,
         u.address_line,
         u.role_id,
         u.hospital_id,
         u.branch_id,
         u.employee_id,
         u.department,
         u.employment_status,
         u.account_status,
         u.created_at,
         u.updated_at,
         h.hospital_name,
         h.hospital_type,
         h.city AS hospital_city,
         h.state AS hospital_state,
         h.country AS hospital_country,
         b.branch_name,
         b.branch_type,
         b.city AS branch_city,
         b.state AS branch_state,
         b.country AS branch_country
       FROM users u
       LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.user_id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const user = result.rows[0];
    let provider = null;

    if (user.role_id === 3 || user.role_id === 4) {
      const providerRes = await pool.query(
        `SELECT 
           p.provider_id,
           p.license_number,
           p.license_expiry,
           p.specialization,
           ph.provider_hospital_id,
           ph.hospital_id,
           h.hospital_name,
           h.hospital_type,
           h.city AS hospital_city,
           h.state AS hospital_state,
           h.country AS hospital_country,
           ph.branch_id,
           b.branch_name,
           b.branch_type,
           b.city AS branch_city,
           b.state AS branch_state,
           b.country AS branch_country,
           ph.start_date,
           ph.end_date,
           ph.is_primary
         FROM healthcare_providers p
         LEFT JOIN provider_hospitals ph ON p.provider_id = ph.provider_id
         LEFT JOIN hospitals h ON ph.hospital_id = h.hospital_id
         LEFT JOIN branches b ON ph.branch_id = b.branch_id
         WHERE p.user_id = $1`,
        [user_id]
      );

      if (providerRes.rows.length > 0) {
        const base = providerRes.rows[0]; 


        const hospitals = [];
        const branches = [];

        providerRes.rows.forEach(row => {
          if (row.hospital_id) {
            hospitals.push({
              provider_hospital_id: row.provider_hospital_id,
              hospital_id: row.hospital_id,
              hospital_name: row.hospital_name,
              hospital_type: row.hospital_type,
              hospital_city: row.hospital_city,
              hospital_state: row.hospital_state,
              hospital_country: row.hospital_country,
              start_date: row.start_date,
              end_date: row.end_date,
              is_primary: row.is_primary
            });
          }

          if (row.branch_id) {
            branches.push({
              branch_id: row.branch_id,
              branch_name: row.branch_name,
              branch_type: row.branch_type,
              branch_city: row.branch_city,
              branch_state: row.branch_state,
              branch_country: row.branch_country,
              start_date: row.start_date,
              end_date: row.end_date,
              is_primary: row.is_primary
            });
          }
        });

        provider = {
          provider_id: base.provider_id,
          license_number: base.license_number,
          license_expiry: base.license_expiry,
          specialization: base.specialization,
          hospitals,
          branches
        };
      }
    }

    res.status(200).json({
      status: "success",
      message: "User fetched successfully",
      user,
      provider, 
    });

  } catch (error) {
    console.error("getUser error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error while fetching user",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const {
      search = '',
      role_id,
      hospital_id,
      branch_id,
      employment_status,
      account_status,
      page = 1,
      limit = 50,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Validate sort parameters to prevent SQL injection
    const validSortColumns = [
      'user_id', 'first_name', 'last_name', 'username', 
      'email', 'employee_id', 'created_at', 'updated_at',
      'employment_status', 'account_status'
    ];
    const validSortOrders = ['ASC', 'DESC'];

    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) 
      ? sort_order.toUpperCase() 
      : 'DESC';

    // Build WHERE conditions
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Restrict hospital admins to their own hospital
    // Updated to include providers via provider_hospitals
    if (req.user.role_id === 2) {
      conditions.push(`(
        u.hospital_id = $${paramCount} OR
        ph.hospital_id = $${paramCount}
      )`);
      params.push(req.user.hospital_id);
      paramCount++;
    }

    // Search across multiple fields using ILIKE for case-insensitive search
    if (search.trim()) {
      conditions.push(`(
        u.first_name ILIKE $${paramCount} OR
        u.last_name ILIKE $${paramCount} OR
        u.username ILIKE $${paramCount} OR
        u.email ILIKE $${paramCount} OR
        u.employee_id ILIKE $${paramCount} OR
        CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramCount}
      )`);
      params.push(`%${search.trim()}%`);
      paramCount++;
    }

    // Filter by role
    if (role_id) {
      conditions.push(`u.role_id = $${paramCount}`);
      params.push(parseInt(role_id));
      paramCount++;
    }

    // Filter by hospital (for super admins)
    // Updated to include providers via provider_hospitals
    if (hospital_id && req.user.role_id === 1) {
      conditions.push(`(
        u.hospital_id = $${paramCount} OR
        ph.hospital_id = $${paramCount}
      )`);
      params.push(parseInt(hospital_id));
      paramCount++;
    }

    // Filter by branch
    // Updated to include providers via provider_hospitals
    if (branch_id) {
      conditions.push(`(
        u.branch_id = $${paramCount} OR
        ph.branch_id = $${paramCount}
      )`);
      params.push(parseInt(branch_id));
      paramCount++;
    }

    // Filter by employment status
    if (employment_status) {
      conditions.push(`u.employment_status = $${paramCount}`);
      params.push(employment_status);
      paramCount++;
    }

    // Filter by account status
    if (account_status) {
      conditions.push(`u.account_status = $${paramCount}`);
      params.push(account_status);
      paramCount++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    // Updated to include LEFT JOIN with provider_hospitals
    const countQuery = `
      SELECT COUNT(DISTINCT u.user_id) as total
      FROM users u
      LEFT JOIN healthcare_providers hp ON u.user_id = hp.user_id
      LEFT JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const totalUsers = parseInt(countResult.rows[0].total);

    // Main query with joins for related data
    // Updated to properly handle provider hospital associations
    const query = `
  SELECT * FROM (
    SELECT DISTINCT ON (u.user_id)
      u.user_id,
      u.first_name,
      u.middle_name,
      u.last_name,
      u.username,
      u.employee_id,
      u.date_of_birth,
      u.gender,
      u.email,
      u.contact_info,
      u.address_line,
      u.role_id,
      r.role_name,
      COALESCE(u.hospital_id, ph.hospital_id) as hospital_id,
      COALESCE(h.hospital_name, h2.hospital_name) as hospital_name,
      COALESCE(u.branch_id, ph.branch_id) as branch_id,
      COALESCE(b.branch_name, b2.branch_name) as branch_name,
      u.department,
      u.employment_status,
      u.account_status,
      u.last_login,
      u.must_change_password,
      u.created_at,
      u.updated_at,
      CASE 
        WHEN hp.provider_id IS NOT NULL THEN true 
        ELSE false 
      END as is_provider,
      hp.license_number,
      hp.specialization,
      ph.is_primary,
      ph.start_date as provider_start_date,
      ph.end_date as provider_end_date
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
    LEFT JOIN branches b ON u.branch_id = b.branch_id
    LEFT JOIN healthcare_providers hp ON u.user_id = hp.user_id
    LEFT JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
    LEFT JOIN hospitals h2 ON ph.hospital_id = h2.hospital_id
    LEFT JOIN branches b2 ON ph.branch_id = b2.branch_id
    ${whereClause}
    ORDER BY u.user_id, ph.is_primary DESC NULLS LAST
  ) AS distinct_users
  ORDER BY ${sortColumn} ${sortOrder}
  LIMIT $${paramCount} OFFSET $${paramCount + 1}
`;

    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      data: {
        users: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_users: totalUsers,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error while fetching users"
    });
  }
};


export const registerUser = async (req, res) => {
  const client = await pool.connect();
  try {
    let {
      first_name, middle_name, last_name, date_of_birth, gender,
      contact_info, address_line, hospital_id, branch_id, email,
      username, role_id, employee_id, license_number,
      license_expiry, department, specialization, start_date,
      password
    } = req.body;

    if (!first_name || !last_name || !date_of_birth || !contact_info ||
        !email || !username || !password || !role_id) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    if (role_id === 3 && !license_number) {
      return res.status(400).json({
        status: "failed",
        message: "Provider requires license_number"
      });
    }

    await client.query("BEGIN");

    if (req.user && req.user.role_id === 2) {
      hospital_id = req.user.hospital_id;
    }

    if (branch_id) {
      const branchResult = await client.query(
        "SELECT hospital_id FROM branches WHERE branch_id = $1",
        [branch_id]
      );

      if (branchResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          status: "failed",
          message: "Invalid branch_id"
        });
      }

      hospital_id = branchResult.rows[0].hospital_id;
    }

    const userExist = await client.query("SELECT 1 FROM users WHERE email=$1", [email]);
    if (userExist.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ status: "failed", message: "Account already exists" });
    }

    const userNameTaken = await client.query("SELECT 1 FROM users WHERE username=$1", [username]);
    if (userNameTaken.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ status: "failed", message: "Username already taken" });
    }

    if (role_id === 3) {
      const providerExist = await client.query(
        "SELECT 1 FROM healthcare_providers WHERE license_number=$1",
        [license_number]
      );
      if (providerExist.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ status: "failed", message: "License number already exists" });
      }
    }

    const hashed_password = await hashedPassword(password);
    const provider_hospital_id = hospital_id;
    const provider_branch_id = branch_id;

    if (role_id === 3) {
      hospital_id = null;
      branch_id = null;
    }

    const newUser = await client.query(
      `INSERT INTO users (
          first_name, middle_name, last_name, date_of_birth, gender,
          contact_info, address_line, email, username, password_hash,
          hospital_id, branch_id, role_id, employee_id, department
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        first_name,
        middle_name || null,
        last_name,
        date_of_birth,
        gender || null,
        contact_info || null,
        address_line || null,
        email,
        username,
        hashed_password,
        hospital_id,
        branch_id || null,
        role_id,
        employee_id,
        department
      ]
    );

    const user = newUser.rows[0];
    let provider = null;
    let provider_hospital = null;

    await logAudit({
      user_id: req.user?.user_id || null,
      table_name: "users",
      action_type: "register_user",
      new_values: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        hospital_id: user.hospital_id,
        branch_id: user.branch_id
      },
      event_type: "CREATE",
      ip_address: req.ip,
      branch_id: req.user?.branch_id || null,
      hospital_id: req.user?.hospital_id || null,
      request_method: req.method,
      endpoint: req.originalUrl
    });

    if (role_id === 3 || role_id === 4) {
      const newProvider = await client.query(
        `INSERT INTO healthcare_providers (
            user_id, license_number, license_expiry, specialization
        ) VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [user.user_id, license_number, license_expiry, specialization]
      );

      provider = newProvider.rows[0];

      await logAudit({
        user_id: req.user?.user_id || null,
        table_name: "healthcare_providers",
        action_type: "register_provider",
        new_values: provider,
        event_type: "CREATE",
        ip_address: req.ip,
        branch_id: req.user?.branch_id || null,
        hospital_id: req.user?.hospital_id || null,
        request_method: req.method,
        endpoint: req.originalUrl
      });
    }

    if (role_id === 3) {
      const providerHospital = await client.query(
        `INSERT INTO provider_hospitals(provider_id, hospital_id, branch_id, start_date)
         VALUES($1,$2,$3,$4)
         RETURNING *`,
        [provider.provider_id, provider_hospital_id, provider_branch_id, start_date]
      );

      provider_hospital = providerHospital.rows[0];

      await logAudit({
        user_id: req.user?.user_id || null,
        table_name: "provider_hospitals",
        action_type: "assign_provider_to_hospital",
        new_values: provider_hospital,
        event_type: "CREATE",
        ip_address: req.ip,
        branch_id: provider_branch_id,
        hospital_id: provider_hospital_id,
        request_method: req.method,
        endpoint: req.originalUrl
      });
    }

    await client.query("COMMIT");

    user.password_hash = undefined;

    res.status(201).json({
      status: "success",
      message: "Registration successful",
      user,
      provider,
      provider_hospital
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

// Check if practitioner exists
export const checkExistingPractitioner = async (req, res) => {
  try {
    const { license_number, email } = req.query;

    if (!license_number && !email) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide license_number or email"
      });
    }

    const query = `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role_id,
        hp.license_number,
        hp.specialization,
        json_agg(
          json_build_object(
            'hospital_id', h.hospital_id,
            'hospital_name', h.hospital_name,
            'branch_id', ph.branch_id,
            'branch_name', b.branch_name,
            'is_primary', ph.is_primary
          )
        ) as current_hospitals
      FROM users u
      JOIN healthcare_providers hp ON u.user_id = hp.user_id
      LEFT JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
      LEFT JOIN hospitals h ON ph.hospital_id = h.hospital_id
      LEFT JOIN branches b ON ph.branch_id = b.branch_id
      WHERE hp.license_number = $1 OR u.email = $2
      GROUP BY u.user_id, hp.license_number, hp.specialization
    `;

    const result = await pool.query(query, [license_number, email]);

    if (result.rows.length > 0) {
      return res.status(200).json({
        status: "success",
        exists: true,
        doctor: result.rows[0]
      });
    }

    res.status(200).json({
      status: "success",
      exists: false
    });

  } catch (error) {
    console.error("Check existing practitioner error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

// Search doctor
export const searchDoctor = async (req, res) => {
  try {
    const { user_id, license_number } = req.query;

    if (!user_id && !license_number) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide user_id or license_number"
      });
    }

    const query = `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role_id,
        hp.license_number,
        hp.specialization,
        json_agg(
          json_build_object(
            'hospital_id', h.hospital_id,
            'hospital_name', h.hospital_name,
            'branch_id', ph.branch_id,
            'branch_name', b.branch_name,
            'is_primary', ph.is_primary
          )
        ) FILTER (WHERE h.hospital_id IS NOT NULL) as current_hospitals
      FROM users u
      JOIN healthcare_providers hp ON u.user_id = hp.user_id
      LEFT JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
      LEFT JOIN hospitals h ON ph.hospital_id = h.hospital_id
      LEFT JOIN branches b ON ph.branch_id = b.branch_id
      WHERE u.user_id = $1 OR hp.license_number = $2
      GROUP BY u.user_id, hp.license_number, hp.specialization
    `;

    const result = await pool.query(query, [user_id || null, license_number || null]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Doctor not found"
      });
    }

    res.status(200).json({
      status: "success",
      doctor: result.rows[0]
    });

  } catch (error) {
    console.error("Search doctor error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};

export const registerExistingMedicalPractitioner = async (req, res) => {
  const client = await pool.connect();
  try {
    let { user_id, license_number, hospital_id, start_date } = req.body;

    if (!user_id || !license_number || !hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields",
      });
    }

    if (req.user.role_id === 2) {
      hospital_id = req.user.hospital_id;
    }

    await client.query("BEGIN");

    const userExists = await client.query("SELECT * FROM users WHERE user_id=$1", [user_id]);
    if (!userExists.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const providerResult = await client.query(
      "SELECT provider_id FROM healthcare_providers WHERE user_id = $1",
      [user_id]
    );

    if (!providerResult.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "User is not registered as a healthcare provider",
      });
    }

    const provider_id = providerResult.rows[0].provider_id;

    const existingLink = await client.query(
      "SELECT 1 FROM provider_hospitals WHERE provider_id=$1 AND hospital_id=$2",
      [provider_id, hospital_id]
    );

    if (existingLink.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        status: "failed",
        message: "Practitioner is already registered in this hospital",
      });
    }

    const newProviderHospital = await client.query(
      `INSERT INTO provider_hospitals (provider_id, hospital_id, start_date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [provider_id, hospital_id, start_date]
    );
  
    await client.query(
      `INSERT INTO audit_logs (
         user_id, action, entity, entity_id, description, timestamp
       ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        req.user.user_id,
        "REGISTER_EXISTING_PRACTITIONER",
        "provider_hospitals",
        newProviderHospital.rows[0].id || null,
        `Linked provider_id=${provider_id} (license=${license_number}) to hospital_id=${hospital_id} starting ${start_date}`,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Existing practitioner registered successfully in hospital",
      provider_id,
      providerHospital: newProviderHospital.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


export const passwordChange = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user.user_id;
    const { current_password, new_password, confirm_password } = req.body;

    const userExists = await client.query("SELECT * FROM users WHERE user_id=$1", [user_id]);
    const user = userExists.rows[0];

    if (!user) {
      return res.status(404).json({ status: "failed", message: "User not found" });
    }

    if (new_password !== confirm_password) {
      return res.status(401).json({ status: "failed", message: "Passwords do not match" });
    }

    const isMatch = await comparePassword(current_password, user?.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: "failed", message: "Invalid current password" });
    }

    const hashed_password = await hashedPassword(new_password);

    await client.query("BEGIN");

    await client.query(
      "UPDATE users SET password_hash = $1, must_change_password = false WHERE user_id = $2",
      [hashed_password, user_id]
    );

    await client.query(
      `INSERT INTO audit_logs (
          user_id,event_type, action_type, table_name,  timestamp
        )
        VALUES ($1, $2, $3, $4, NOW())`,
      [
        user_id,
        "CHANGE PASSWORD",
        "USER_PASSWORD_CHANGE",
        "users",
        
      ]
      );


    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Password successfully changed",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


export const adminResetPassword = async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, temp_password } = req.body;

    const userExists = await client.query("SELECT * FROM users WHERE user_id=$1", [user_id]);
    if (!userExists.rows[0]) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const adminRole = req.user.role_id;
    const adminHospitalid = req.user.hospital_id;

    if (adminRole === 2 && userExists.rows[0].role_id === 3) {
      const provider = await client.query(
        "SELECT provider_id FROM healthcare_providers WHERE user_id=$1",
        [userExists.rows[0].user_id]
      );
      if (!provider.rows[0]) {
        return res.status(404).json({ status: "failed", message: "Provider not found" });
      }

      const providerHospitals = await client.query(
        "SELECT hospital_id FROM provider_hospitals WHERE provider_id=$1",
        [provider.rows[0].provider_id]
      );

      const hospitalIds = providerHospitals.rows.map((r) => r.hospital_id);

      if (!hospitalIds.includes(adminHospitalid)) {
        return res.status(403).json({ status: "failed", message: "Access denied" });
      }
    } else if (adminRole === 2 && adminHospitalid !== userExists.rows[0].hospital_id) {
      return res.status(403).json({ status: "failed", message: "Access denied" });
    }

    const hashed_password = await hashedPassword(temp_password);

    await client.query("BEGIN");

    await client.query(
      "UPDATE users SET password_hash=$1, must_change_password=true WHERE user_id=$2",
      [hashed_password, user_id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, description, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        req.user.user_id,
        "ADMIN_PASSWORD_RESET",
        "users",
        user_id,
        `Admin (ID: ${req.user.user_id}) reset password for user (ID: ${user_id}). Temporary password issued.`,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Temporary password set. User must change on next login.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const adminUpdateUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id } = req.body;
    const currentUserId = req.user.user_id;

    if (user_id === currentUserId) {
      return res.status(401).json({
        status: "Denied",
        message: "Cannot perform operation on self",
      });
    }

    const {
      first_name,
      middle_name,
      last_name,
      username,
      employee_id,
      department,
      date_of_birth,
      gender,
      email,
      contact_info,
      address_line,
      role_id,
      employment_status,
      account_status,
      license_number,
      license_expiry,
      specialization,
    } = req.body;

    await client.query("BEGIN");

    const userExists = await client.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
    if (!userExists.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const adminRole = req.user.role_id;
    const adminHospitalid = req.user.hospital_id;

    if (adminRole === 2 && userExists.rows[0].role_id === 3) {
      const provider = await client.query(
        "SELECT provider_id FROM healthcare_providers WHERE user_id=$1",
        [userExists.rows[0].user_id]
      );
      if (!provider.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({ status: "failed", message: "Provider not found" });
      }

      const providerHospitals = await client.query(
        "SELECT hospital_id FROM provider_hospitals WHERE provider_id=$1",
        [provider.rows[0].provider_id]
      );

      const hospitalIds = providerHospitals.rows.map((r) => r.hospital_id);

      if (!hospitalIds.includes(adminHospitalid)) {
        await client.query("ROLLBACK");
        return res.status(403).json({ status: "failed", message: "Access denied" });
      }
    } else if (adminRole === 2 && adminHospitalid !== userExists.rows[0].hospital_id) {
      await client.query("ROLLBACK");
      return res.status(403).json({ status: "failed", message: "Access denied" });
    }

    const updatedUser = await client.query(
      `UPDATE users 
       SET 
          first_name = COALESCE($1, first_name),
          middle_name = COALESCE($2, middle_name),
          last_name = COALESCE($3, last_name),
          username = COALESCE($4, username),
          employee_id = COALESCE($5, employee_id),
          department = COALESCE($6, department),
          date_of_birth = COALESCE($7, date_of_birth),
          gender = COALESCE($8, gender),
          email = COALESCE($9, email),
          contact_info = COALESCE($10, contact_info),
          address_line = COALESCE($11, address_line),
          role_id = COALESCE($12, role_id),
          employment_status = COALESCE($13, employment_status),
          account_status = COALESCE($14, account_status),
          updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $15
       RETURNING *`,
      [
        safe(first_name),
        safe(middle_name),
        safe(last_name),
        safe(username),
        safe(employee_id),
        safe(department),
        safe(date_of_birth),
        safe(gender),
        safe(email),
        safe(contact_info),
        safe(address_line),
        safe(role_id),
        safe(employment_status),
        safe(account_status),
        user_id,
      ]
    );

    let user = updatedUser.rows[0];
    user.password_hash = undefined;

    let provider = null;

    if (user.role_id === 3) {
      const providerExists = await client.query(
        "SELECT * FROM healthcare_providers WHERE user_id = $1",
        [user_id]
      );

      if (!providerExists.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          status: "failed",
          message: "Healthcare provider record not found",
        });
      }

      const updatedProvider = await client.query(
        `UPDATE healthcare_providers
         SET 
            license_number = COALESCE($1, license_number),
            license_expiry = COALESCE($2, license_expiry),
            specialization = COALESCE($3, specialization),
            updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4
         RETURNING provider_id, license_number, license_expiry, specialization`,
        [safe(license_number), safe(license_expiry), safe(specialization), user_id]
      );

      provider = updatedProvider.rows[0];
    }

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, description, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        req.user.user_id, 
        "ADMIN_UPDATE_USER",
        "users",
        user_id, 
        `Admin (ID: ${req.user.user_id}) updated user profile (ID: ${user_id}).`,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      user,
      provider,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};




export const userUpdateUser = async (req, res) => {
    try {
        const  user_id  = req.user.user_id; 

        const {
            first_name,
            middle_name,
            last_name,
            username,
            date_of_birth,
            gender,
            email,
            contact_info,
            address_line,
        } = req.body;

       
        const userExists = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        if (!userExists.rows[0]) {
            return res.status(404).json({
                status: "failed",
                message: "User not found"
            });
        }

        
        const updatedUser = await pool.query(
            `UPDATE users 
             SET 
                first_name = COALESCE($1, first_name),
                middle_name = COALESCE($2, middle_name),
                last_name = COALESCE($3, last_name),
                username = COALESCE($4, username),
                date_of_birth = COALESCE($5, date_of_birth),
                gender = COALESCE($6, gender),
                email = COALESCE($7, email),
                contact_info = COALESCE($8, contact_info),
                address_line = COALESCE($9, address_line),
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $10
             RETURNING *`,
            [
                safe(first_name),
                safe(middle_name),
                safe(last_name),
                safe(username),
                safe(date_of_birth),
                safe(gender),
                safe(email),
                safe(contact_info),
                safe(address_line),
                user_id
            ]
        );

        const user = updatedUser.rows[0];
        user.password_hash = undefined;

        res.status(200).json({
            status: "success",
            message: "User updated",
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const selfRegister = async (req, res) => {
  const client = await pool.connect();
  try {
    let {
  first_name,
  middle_name,
  last_name,
  date_of_birth,
  gender,
  contact_info,
  address_line,
  email,
  username,
  password,
  employee_id 
} = req.body;


    if (!first_name || !last_name || !date_of_birth || !email || !username || !password) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    await client.query("BEGIN");

    // 🔎 Check duplicates
    const userExist = await client.query("SELECT 1 FROM users WHERE email=$1", [email]);
    if (userExist.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ status: "failed", message: "Email already registered" });
    }

    const userNameTaken = await client.query("SELECT 1 FROM users WHERE username=$1", [username]);
    if (userNameTaken.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ status: "failed", message: "Username already taken" });
    }

    
    const hashed_password = await hashedPassword(password);


    
    const newUser = await client.query(
  `INSERT INTO users (
      first_name, middle_name, last_name, date_of_birth, gender,
      contact_info, address_line, email, username, password_hash, role_id, employee_id
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  RETURNING user_id, first_name, middle_name, last_name, email, username, role_id, created_at`,
  [
    first_name,
    middle_name || null,
    last_name,
    date_of_birth,
    gender || null,
    contact_info || null,
    address_line || null,
    email,
    username,
    hashed_password,
    role_id,
    employee_id 
  ]
);


    await client.query("COMMIT");

    const user = newUser.rows[0];

    res.status(201).json({
      status: "success",
      message: "Self-registration successful",
      user
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};




export const deleteUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ status: "failed", message: "User ID required" });
    }

    if (![1, 2].includes(req.user.role_id)) {
      return res.status(403).json({ status: "failed", message: "Unauthorized" });
    }

    await client.query("BEGIN");
  
    const userResult = await client.query(
      `SELECT user_id, role_id FROM users WHERE user_id = $1`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ status: "failed", message: "User not found" });
    }

    const user = userResult.rows[0];

    if (req.user.role_id === 2) {
      const allowed = await client.query(
        `SELECT 1 FROM users WHERE user_id = $1 AND hospital_id = $2`,
        [user_id, req.user.hospital_id]
      );
      if (allowed.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          status: "failed",
          message: "You cannot delete users outside your hospital"
        });
      }
    }

    if (user.role_id === 3 || user.role_id === 4) {
      const providerResult = await client.query(
        "SELECT provider_id FROM healthcare_providers WHERE user_id = $1",
        [user_id]
      );

      if (providerResult.rows.length > 0) {
        const provider_id = providerResult.rows[0].provider_id;

       
        await client.query("DELETE FROM provider_hospitals WHERE provider_id = $1", [provider_id]);

      
        await logAudit({
          user_id: req.user.user_id,
          table_name: "provider_hospitals",
          action_type: "delete_provider_links",
          old_values: { provider_id },
          event_type: "DELETE",
          ip_address: req.ip,
          branch_id: req.user.branch_id,
          hospital_id: req.user.hospital_id,
          request_method: req.method,
          endpoint: req.originalUrl
        });

        await client.query("DELETE FROM healthcare_providers WHERE provider_id = $1", [provider_id]);

        await logAudit({
          user_id: req.user.user_id,
          table_name: "healthcare_providers",
          action_type: "delete_provider",
          old_values: { provider_id },
          event_type: "DELETE",
          ip_address: req.ip,
          branch_id: req.user.branch_id,
          hospital_id: req.user.hospital_id,
          request_method: req.method,
          endpoint: req.originalUrl
        });
      }
    }

    await client.query("DELETE FROM users WHERE user_id = $1", [user_id]);

    await logAudit({
      user_id: req.user.user_id,
      table_name: "users",
      action_type: "delete_user",
      old_values: { user_id },
      event_type: "DELETE",
      ip_address: req.ip,
      branch_id: req.user.branch_id,
      hospital_id: req.user.hospital_id,
      request_method: req.method,
      endpoint: req.originalUrl
    });

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "User account deleted successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete user error:", error);
    res.status(500).json({ status: "failed", message: "Server error" });
  } finally {
    client.release();
  }
};


export const getUserDetails = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        status: "failed",
        message: "User ID is required"
      });
    }

    // Authorization check - Admin can view all, Local Admin can view their hospital users
    if (req.user.role_id === 2) {
      const userHospitalCheck = await pool.query(
        `SELECT u.user_id, u.hospital_id, u.role_id
         FROM users u
         WHERE u.user_id = $1`,
        [user_id]
      );

      if (userHospitalCheck.rows.length === 0) {
        return res.status(404).json({
          status: "failed",
          message: "User not found"
        });
      }

      const targetUser = userHospitalCheck.rows[0];

      // If target is a doctor, check if they're linked to admin's hospital
      if (targetUser.role_id === 3) {
        const providerCheck = await pool.query(
          `SELECT ph.hospital_id
           FROM healthcare_providers hp
           JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
           WHERE hp.user_id = $1 AND ph.hospital_id = $2`,
          [user_id, req.user.hospital_id]
        );

        if (providerCheck.rows.length === 0) {
          return res.status(403).json({
            status: "failed",
            message: "Access denied"
          });
        }
      } else if (targetUser.hospital_id !== req.user.hospital_id) {
        return res.status(403).json({
          status: "failed",
          message: "Access denied"
        });
      }
    }

    // Fetch comprehensive user details
    const result = await pool.query(
      `SELECT 
         u.user_id,
         u.first_name,
         u.middle_name,
         u.last_name,
         u.username,
         u.date_of_birth,
         u.gender,
         u.email,
         u.contact_info,
         u.address_line,
         u.role_id,
         r.role_name,
         u.hospital_id,
         h.hospital_name,
         h.hospital_type,
         h.city AS hospital_city,
         h.state AS hospital_state,
         h.country AS hospital_country,
         h.email AS hospital_email,
         h.contact_number AS hospital_phone,
         u.branch_id,
         b.branch_name,
         b.branch_type,
         b.city AS branch_city,
         b.state AS branch_state,
         b.country AS branch_country,
         b.email AS branch_email,
         b.contact_number AS branch_phone,
         u.employee_id,
         u.department,
         u.employment_status,
         u.account_status,
         u.last_login,
         u.must_change_password,
         u.created_at,
         u.updated_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN hospitals h ON u.hospital_id = h.hospital_id
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.user_id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      });
    }

    const user = result.rows[0];
    let provider = null;
    let statistics = null;

    // If user is a healthcare provider (Doctor or Nurse)
    if (user.role_id === 3 || user.role_id === 4) {
      const providerRes = await pool.query(
        `SELECT 
           hp.provider_id,
           hp.license_number,
           hp.license_expiry,
           hp.specialization,
           hp.created_at AS provider_created_at,
           hp.updated_at AS provider_updated_at
         FROM healthcare_providers hp
         WHERE hp.user_id = $1`,
        [user_id]
      );

      if (providerRes.rows.length > 0) {
        provider = providerRes.rows[0];

        // Get all hospitals/branches this provider is linked to
        const providerHospitalsRes = await pool.query(
          `SELECT 
             ph.provider_hospital_id,
             ph.hospital_id,
             h.hospital_name,
             h.hospital_type,
             h.city AS hospital_city,
             h.state AS hospital_state,
             h.country AS hospital_country,
             ph.branch_id,
             b.branch_name,
             b.branch_type,
             b.city AS branch_city,
             b.state AS branch_state,
             b.country AS branch_country,
             ph.start_date,
             ph.end_date,
             ph.is_primary
           FROM provider_hospitals ph
           LEFT JOIN hospitals h ON ph.hospital_id = h.hospital_id
           LEFT JOIN branches b ON ph.branch_id = b.branch_id
           WHERE ph.provider_id = $1
           ORDER BY ph.is_primary DESC, ph.start_date DESC`,
          [provider.provider_id]
        );

        provider.hospitals = providerHospitalsRes.rows.filter(row => row.hospital_id);
        provider.branches = providerHospitalsRes.rows.filter(row => row.branch_id);

        // Get provider statistics
        const statsRes = await pool.query(
          `SELECT 
             COUNT(DISTINCT v.visit_id) as total_visits,
             COUNT(DISTINCT v.patient_id) as total_patients,
             COUNT(DISTINCT CASE WHEN v.visit_date >= CURRENT_DATE - INTERVAL '30 days' THEN v.visit_id END) as visits_last_30_days,
             COUNT(DISTINCT CASE WHEN v.visit_date >= CURRENT_DATE - INTERVAL '7 days' THEN v.visit_id END) as visits_last_7_days
           FROM visits v
           WHERE v.provider_id = $1`,
          [provider.provider_id]
        );

        if (statsRes.rows.length > 0) {
          statistics = {
            ...statsRes.rows[0],
            license_status: provider.license_expiry 
              ? new Date(provider.license_expiry) > new Date() ? 'Valid' : 'Expired'
              : 'Not Set'
          };
        }
      }
    }

    // Get activity statistics for all users
    if (!statistics) {
      statistics = {};
    }

    // Get recent audit logs for this user
    const auditLogsRes = await pool.query(
      `SELECT 
         al.log_id,
         al.action_type,
         al.table_name,
         al.event_type,
         al.timestamp,
         al.ip_address,
         al.endpoint
       FROM audit_logs al
       WHERE al.user_id = $1
       ORDER BY al.timestamp DESC
       LIMIT 10`,
      [user_id]
    );

    const recentActivity = auditLogsRes.rows;

    res.status(200).json({
      status: "success",
      message: "User details fetched successfully",
      data: {
        user,
        provider,
        statistics,
        recentActivity
      }
    });

  } catch (error) {
    console.error("getUserDetails error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error while fetching user details"
    });
  }
};

export const getHospitalUsers = async (req,res) =>{
  try{
    const hospital_id = req.user.hospital_id;

    const result = await pool.query(
      `SELECT 
         u.user_id, 
          u.first_name,
          u.last_name,
          u.email,
          u.username,
          u.role_id,
          r.role_name,
          u.department,
          u.employment_status,  
          u.account_status,
          u.created_at
       FROM users u 
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE u.hospital_id = $1
        ORDER BY u.created_at DESC`,
      [hospital_id]
    );
    res.status(200).json({
      status: "success",
      message: "Hospital users fetched successfully",
      users: result.rows
    }
  )

  }catch(error){
    console.error("getHospitalUsers error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error while fetching hospital users"
    });
  }
}