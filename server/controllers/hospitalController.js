import {pool} from '../libs/database.js';
import { logAudit } from "../libs/auditLogger.js";

const safe = (val) => (val !== undefined ? val : null);

export const registerHospital = async (req, res)=>{
    try{

        const {hospital_name,hospital_type,hospital_license_number,address_line,city,state,country,zip_code,contact_number,email,accredition_status} = req.body;

        if (!hospital_name || !hospital_type || !hospital_license_number || !address_line || !city || !country || !zip_code || !contact_number || !email || !accredition_status){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }

        const hospitalExist = await pool.query('SELECT * FROM hospitals WHERE hospital_license_number= $1 OR contact_number = $2' , [hospital_license_number,contact_number]);

        if( hospitalExist.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Hospital with given license number or contact number already exists"
                }
            )
        }
        const newHospital = await pool.query( `INSERT INTO hospitals 
            (hospital_name,hospital_type,hospital_license_number,address_line,city,state,country,zip_code,contact_number,email,accredition_status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) 
            RETURNING hospital_id`,
            [
                hospital_name,hospital_type,hospital_license_number,address_line,city,state,country,zip_code,contact_number,email,accredition_status
            ])


            const createdHospital = {
              hospital_id: newHospital.rows[0].hospital_id,
              hospital_name,
              hospital_type,
              hospital_license_number,
              email,
              city,
              country,
            };


            await logAudit({
              user_id: req.user?.user_id || null, 
              table_name: "hospitals",
              action_type: "register_hospital",
              new_values: createdHospital,
              event_type: "CREATE",
              ip_address: req.ip,
              branch_id: req.user?.branch_id || null,
              hospital_id: req.user?.hospital_id || null,
              request_method: req.method,
              endpoint: req.originalUrl,
            });

        res.status(201).json(
            {
                status: "success",
                message: "Hospital registered successfully",
                hospital_id: newHospital.rows[0].hospital_id
            }
        )

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});    
    }
}
export const registerHospitalBranch = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      hospital_id,
      branch_name,
      branch_type,
      branch_license_number,
      address_line,
      city,
      state,
      country,
      zip_code,
      contact_number,
      email,
      accredition_status,
    } = req.body;

    if (
      !hospital_id ||
      !branch_name ||
      !branch_type ||
      !branch_license_number ||
      !address_line ||
      !city ||
      !country ||
      !zip_code ||
      !contact_number ||
      !email ||
      !accredition_status
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields",
      });
    }

    await client.query("BEGIN");

    
    const branchExist = await client.query(
      "SELECT * FROM branches WHERE branch_license_number = $1 AND hospital_id = $2",
      [branch_license_number, hospital_id]
    );

    if (branchExist.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        status: "failed",
        message: "Branch with given license number already exists",
      });
    }

 
    const newBranch = await client.query(
      `INSERT INTO branches 
        (hospital_id, branch_name, branch_type, branch_license_number, address_line, city, state, country, zip_code, contact_number, email, accredition_status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING branch_id`,
      [
        hospital_id,
        branch_name,
        branch_type,
        branch_license_number,
        address_line,
        city,
        state,
        country,
        zip_code,
        contact_number,
        email,
        accredition_status,
      ]
    );

    const branch_id = newBranch.rows[0].branch_id;

    
    const user_id = req.user?.user_id || null;
    const ip_address = req.ip || req.headers["x-forwarded-for"];
    const endpoint = req.originalUrl;
    const request_method = req.method;

  
    await client.query(
      `INSERT INTO audit_logs 
        (user_id, patient_id, table_name, action_type, old_values, new_values, ip_address, event_type, branch_id, hospital_id, request_method, endpoint)
        VALUES ($1, NULL, 'branches', 'INSERT', NULL, $2, $3, 'Create', $4, $5, $6, $7)`,
      [
        user_id,
        JSON.stringify({
          branch_name,
          branch_type,
          branch_license_number,
          address_line,
          city,
          state,
          country,
          zip_code,
          contact_number,
          email,
          accredition_status,
        }),
        ip_address,
        branch_id,
        hospital_id,
        request_method,
        endpoint,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Branch registered successfully",
      branch_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const updateHospital = async (req, res) => {
  const client = await pool.connect();
  try {
    const { hospital_id } = req.body;
    if (!hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID is required",
      });
    }

    await client.query("BEGIN");

   
    const hospitalExists = await client.query(
      "SELECT * FROM hospitals WHERE hospital_id = $1",
      [hospital_id]
    );

    if (hospitalExists.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Hospital not found",
      });
    }

    const oldValues = hospitalExists.rows[0]; 
    const {
      hospital_name,
      hospital_type,
      hospital_license_number,
      address_line,
      city,
      state,
      country,
      zip_code,
      contact_number,
      email,
      accredition_status,
    } = req.body;

    const updatedHospital = await client.query(
      `UPDATE hospitals 
       SET 
          hospital_name = COALESCE($1, hospital_name),
          hospital_type = COALESCE($2, hospital_type),
          hospital_license_number = COALESCE($3, hospital_license_number),
          address_line = COALESCE($4, address_line),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          country = COALESCE($7, country),
          zip_code = COALESCE($8, zip_code),
          contact_number = COALESCE($9, contact_number),
          email = COALESCE($10, email),
          accredition_status = COALESCE($11, accredition_status),
          updated_at = CURRENT_TIMESTAMP
       WHERE hospital_id = $12
       RETURNING *`,
      [
        hospital_name ?? null,
        hospital_type ?? null,
        hospital_license_number ?? null,
        address_line ?? null,
        city ?? null,
        state ?? null,
        country ?? null,
        zip_code ?? null,
        contact_number ?? null,
        email ?? null,
        accredition_status ?? null,
        hospital_id,
      ]
    );

    const newValues = updatedHospital.rows[0];

   
    const user_id = req.user?.user_id || null;
    const ip_address = req.ip || req.headers["x-forwarded-for"];
    const endpoint = req.originalUrl;
    const request_method = req.method;

    await client.query(
      `INSERT INTO audit_logs 
        (user_id, patient_id, table_name, action_type, old_values, new_values, ip_address, event_type, hospital_id, branch_id, request_method, endpoint)
       VALUES ($1, NULL, 'hospitals', 'UPDATE', $2, $3, $4, 'Update', $5, NULL, $6, $7)`,
      [
        user_id,
        JSON.stringify(oldValues),
        JSON.stringify(newValues),
        ip_address,
        hospital_id,
        request_method,
        endpoint,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Hospital updated successfully",
      hospital: newValues,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


export const updateHospitalBranch = async (req, res) => {
  const client = await pool.connect();

  try {
    const { branch_id } = req.body;
    if (!branch_id) {
      return res.status(400).json({
        status: "failed",
        message: "Branch ID is required",
      });
    }

    await client.query("BEGIN");

    
    const branchExists = await client.query(
      "SELECT * FROM branches WHERE branch_id = $1",
      [branch_id]
    );

    if (branchExists.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Branch not found",
      });
    }

    const oldValues = branchExists.rows[0];

    const {
      branch_name,
      branch_type,
      branch_license_number,
      address_line,
      city,
      state,
      country,
      zip_code,
      contact_number,
      email,
      accredition_status,
    } = req.body;

   
    const updatedBranch = await client.query(
      `UPDATE branches 
       SET 
          branch_name = COALESCE($1, branch_name),
          branch_type = COALESCE($2, branch_type),
          branch_license_number = COALESCE($3, branch_license_number),
          address_line = COALESCE($4, address_line),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          country = COALESCE($7, country),
          zip_code = COALESCE($8, zip_code),
          contact_number = COALESCE($9, contact_number),
          email = COALESCE($10, email),
          accredition_status = COALESCE($11, accredition_status),
          updated_at = CURRENT_TIMESTAMP
       WHERE branch_id = $12
       RETURNING *`,
      [
        branch_name ?? null,
        branch_type ?? null,
        branch_license_number ?? null,
        address_line ?? null,
        city ?? null,
        state ?? null,
        country ?? null,
        zip_code ?? null,
        contact_number ?? null,
        email ?? null,
        accredition_status ?? null,
        branch_id,
      ]
    );

    const newValues = updatedBranch.rows[0];

    const user_id = req.user?.user_id || null;
    const ip_address = req.ip || req.headers["x-forwarded-for"];
    const endpoint = req.originalUrl;
    const request_method = req.method;

    await client.query(
      `INSERT INTO audit_logs 
        (user_id, patient_id, table_name, action_type, old_values, new_values, ip_address, event_type, hospital_id, branch_id, request_method, endpoint)
       VALUES ($1, NULL, 'branches', 'UPDATE', $2, $3, $4, 'Update', $5, $6, $7, $8)`,
      [
        user_id,
        JSON.stringify(oldValues),
        JSON.stringify(newValues),
        ip_address,
        newValues.hospital_id,
        branch_id,
        request_method,
        endpoint,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Branch updated successfully",
      branch: newValues,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};





export const deactivateHospital = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { hospital_id } = req.params;
    const user_id = req.user?.user_id || null;
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;
    const branch_id = req.user?.branch_id || null;


    const hospital = await client.query(
      "SELECT * FROM hospitals WHERE hospital_id = $1",
      [hospital_id]
    );

    if (hospital.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Hospital not found",
      });
    }

    const updated = await client.query(
      `UPDATE hospitals 
       SET is_active = false, deleted_at = NOW()
       WHERE hospital_id = $1
       RETURNING *`,
      [hospital_id]
    );

    await client.query(
      `INSERT INTO audit_logs 
        (user_id, table_name, action_type, old_values, new_values, ip_address, event_type, branch_id, hospital_id, request_method, endpoint)
        VALUES ($1, 'hospitals', 'UPDATE', $2, $3, $4, 'Soft Delete', $5, $6, $7, $8)`,
      [
        user_id,
        JSON.stringify(hospital.rows[0]),
        JSON.stringify(updated.rows[0]),
        ip_address,
        branch_id,
        hospital_id,
        request_method,
        endpoint,
      ]
    );

    await client.query("COMMIT");
    res.status(200).json({
      status: "success",
      message: "Hospital marked as inactive",
      hospital: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


export const hardDeleteHospital = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { hospital_id } = req.params;
    const user_id = req.user?.user_id || null;
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;
    const branch_id = req.user?.branch_id || null;

    const hospital = await client.query(
      "SELECT * FROM hospitals WHERE hospital_id = $1",
      [hospital_id]
    );

    if (hospital.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Hospital not found",
      });
    }

    

    // await client.query("DELETE FROM branches WHERE hospital_id = $1", [hospital_id]);

    
    await client.query("DELETE FROM hospitals WHERE hospital_id = $1", [hospital_id]);

   
    await client.query(
      `INSERT INTO audit_logs 
        (user_id, table_name, action_type, old_values, new_values, ip_address, event_type, branch_id, hospital_id, request_method, endpoint)
        VALUES ($1, 'hospitals', 'DELETE', $2, NULL, $3, 'Hard Delete', $4, $5, $6, $7)`,
      [
        user_id,
        JSON.stringify(hospital.rows[0]),
        ip_address,
        branch_id,
        hospital_id,
        request_method,
        endpoint,
      ]
    );

    await client.query("COMMIT");
    res.status(200).json({
      status: "success",
      message: "Hospital permanently deleted",
      deleted_hospital: hospital.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


export const deactivateBranch = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { branch_id } = req.params;
    const user_id = req.user?.user_id || null;
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;

    const branch = await client.query(
      "SELECT * FROM branches WHERE branch_id = $1",
      [branch_id]
    );

    if (branch.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Branch not found",
      });
    }
    const updated = await client.query(
      `UPDATE branches 
       SET is_active = false
       WHERE branch_id = $1
       RETURNING *`,
      [branch_id]
    );
    await client.query(
      `INSERT INTO audit_logs 
        (user_id, table_name, action_type, old_values, new_values, ip_address, event_type, branch_id, hospital_id, request_method, endpoint)
        VALUES ($1, 'branches', 'UPDATE', $2, $3, $4, 'Soft Delete', $5, $6, $7, $8)`,
      [
        user_id,
        JSON.stringify(branch.rows[0]),
        JSON.stringify(updated.rows[0]),
        ip_address,
        branch_id,
        branch.rows[0].hospital_id,
        request_method,
        endpoint,
      ]
    );

    await client.query("COMMIT");
    res.status(200).json({
      status: "success",
      message: "Branch marked as inactive",
      branch: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const hardDeleteBranch = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { branch_id } = req.params;
    const user_id = req.user?.user_id || null;
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;

    const branch = await client.query(
      "SELECT * FROM branches WHERE branch_id = $1",
      [branch_id]
    );

    if (branch.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Branch not found",
      });
    }

    await client.query("DELETE FROM branches WHERE branch_id = $1", [branch_id]);

    await client.query(
      `INSERT INTO audit_logs 
        (user_id, table_name, action_type, old_values, new_values, ip_address, event_type, branch_id, hospital_id, request_method, endpoint)
        VALUES ($1, 'branches', 'DELETE', $2, NULL, $3, 'Hard Delete', $4, $5, $6, $7)`,
      [
        user_id,
        JSON.stringify(branch.rows[0]),
        ip_address,
        branch_id,
        branch.rows[0].hospital_id,
        request_method,
        endpoint,
      ]
    );

    await client.query("COMMIT");
    res.status(200).json({
      status: "success",
      message: "Branch permanently deleted",
      deleted_branch: branch.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};



export const getAllHospitals = async (req, res) => {
  try {
    const {
      search,
      hospital_type,
      city,
      state,
      country,
      accredition_status,
      is_active,
      page = 1,
      limit = 50,
      sort_by = 'hospital_name',
      sort_order = 'ASC'
    } = req.query;

    const user_id = req.user?.user_id || null;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        h.hospital_name ILIKE $${paramCount} OR 
        h.hospital_license_number ILIKE $${paramCount} OR 
        h.email ILIKE $${paramCount} OR
        h.contact_number ILIKE $${paramCount} OR
        h.city ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (hospital_type) {
      conditions.push(`h.hospital_type = $${paramCount}`);
      params.push(hospital_type);
      paramCount++;
    }

    if (city) {
      conditions.push(`h.city ILIKE $${paramCount}`);
      params.push(`%${city}%`);
      paramCount++;
    }

    if (state) {
      conditions.push(`h.state ILIKE $${paramCount}`);
      params.push(`%${state}%`);
      paramCount++;
    }

    if (country) {
      conditions.push(`h.country ILIKE $${paramCount}`);
      params.push(`%${country}%`);
      paramCount++;
    }

    if (accredition_status) {
      conditions.push(`h.accredition_status = $${paramCount}`);
      params.push(accredition_status);
      paramCount++;
    }

    if (is_active !== undefined) {
      conditions.push(`h.is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const validSortFields = ['hospital_name', 'created_at', 'updated_at', 'city', 'hospital_type'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'hospital_name';
    const sortDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM hospitals h
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalHospitals = parseInt(countResult.rows[0].total);

    const query = `
      SELECT 
        h.*,
        COUNT(b.branch_id) as branch_count
      FROM hospitals h
      LEFT JOIN branches b ON h.hospital_id = b.hospital_id AND b.is_active = true
      ${whereClause}
      GROUP BY h.hospital_id
      ORDER BY h.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Log audit
    // await logAudit({
    //   user_id,
    //   table_name: "hospitals",
    //   action_type: "SELECT",
    //   event_type: "List Hospitals",
    //   request_method: req.method,
    //   endpoint: req.originalUrl,
    //   ip_address: req.ip
    // });

    res.status(200).json({
      status: "success",
      data: {
        hospitals: result.rows,
        pagination: {
          total: totalHospitals,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(totalHospitals / limit)
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

export const getHospitalById = async (req, res) => {
  try {
    const { hospital_id } = req.params;
    const user_id = req.user?.user_id || null;

    if (!hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID is required"
      });
    }

    const hospitalQuery = `
      SELECT * FROM hospitals 
      WHERE hospital_id = $1
    `;
    const hospitalResult = await pool.query(hospitalQuery, [hospital_id]);

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Hospital not found"
      });
    }

    const hospital = hospitalResult.rows[0];

    const branchesQuery = `
      SELECT * FROM branches 
      WHERE hospital_id = $1 
      ORDER BY branch_name ASC
    `;
    const branches = await pool.query(branchesQuery, [hospital_id]);

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.user_id) as total_users,
        COUNT(DISTINCT p.patient_id) as total_patients,
        COUNT(DISTINCT v.visit_id) as total_visits
      FROM hospitals h
      

      LEFT JOIN users u ON h.hospital_id = u.hospital_id

      LEFT JOIN patient_identifiers pi ON h.hospital_id = pi.hospital_id
      LEFT JOIN patients p ON pi.patient_id = p.patient_id
      LEFT JOIN visits v ON h.hospital_id = v.hospital_id
      WHERE h.hospital_id = $1
    `;
    const stats = await pool.query(statsQuery, [hospital_id]);

    // Log audit
    // await logAudit({
    //   user_id,
    //   hospital_id,
    //   table_name: "hospitals",
    //   action_type: "SELECT",
    //   event_type: "View Hospital Details",
    //   request_method: req.method,
    //   endpoint: req.originalUrl,
    //   ip_address: req.ip
    // });

    res.status(200).json({
      status: "success",
      data: {
        hospital,
        branches: branches.rows,
        statistics: stats.rows[0]
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

export const getAllBranches = async (req, res) => {
  try {
    const {
      search,
      hospital_id,
      branch_type,
      city,
      state,
      country,
      accredition_status,
      is_active,
      page = 1,
      limit = 50,
      sort_by = 'branch_name',
      sort_order = 'ASC'
    } = req.query;

    const user_id = req.user?.user_id || null;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        b.branch_name ILIKE $${paramCount} OR 
        b.branch_license_number ILIKE $${paramCount} OR 
        b.email ILIKE $${paramCount} OR
        b.contact_number ILIKE $${paramCount} OR
        b.city ILIKE $${paramCount} OR
        h.hospital_name ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (hospital_id) {
      conditions.push(`b.hospital_id = $${paramCount}`);
      params.push(hospital_id);
      paramCount++;
    }

    if (branch_type) {
      conditions.push(`b.branch_type = $${paramCount}`);
      params.push(branch_type);
      paramCount++;
    }

    if (city) {
      conditions.push(`b.city ILIKE $${paramCount}`);
      params.push(`%${city}%`);
      paramCount++;
    }

    if (state) {
      conditions.push(`b.state ILIKE $${paramCount}`);
      params.push(`%${state}%`);
      paramCount++;
    }

    if (country) {
      conditions.push(`b.country ILIKE $${paramCount}`);
      params.push(`%${country}%`);
      paramCount++;
    }

    if (accredition_status) {
      conditions.push(`b.accredition_status = $${paramCount}`);
      params.push(accredition_status);
      paramCount++;
    }

    if (is_active !== undefined) {
      conditions.push(`b.is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const validSortFields = ['branch_name', 'created_at', 'updated_at', 'city', 'branch_type'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'branch_name';
    const sortDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM branches b
      LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalBranches = parseInt(countResult.rows[0].total);

    const query = `
      SELECT 
        b.*,
        h.hospital_name,
        h.hospital_type
      FROM branches b
      LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
      ${whereClause}
      ORDER BY b.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Log audit
    // await logAudit({
    //   user_id,
    //   table_name: "branches",
    //   action_type: "SELECT",
    //   event_type: "List Branches",
    //   request_method: req.method,
    //   endpoint: req.originalUrl,
    //   ip_address: req.ip
    // });

    res.status(200).json({
      status: "success",
      data: {
        branches: result.rows,
        pagination: {
          total: totalBranches,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(totalBranches / limit)
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

export const getBranchById = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const user_id = req.user?.user_id || null;

    if (!branch_id) {
      return res.status(400).json({
        status: "failed",
        message: "Branch ID is required"
      });
    }

    const branchQuery = `
      SELECT 
        b.*,
        h.hospital_name,
        h.hospital_type,
        h.hospital_license_number as parent_hospital_license
      FROM branches b
      LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
      WHERE b.branch_id = $1
    `;
    const branchResult = await pool.query(branchQuery, [branch_id]);

    if (branchResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Branch not found"
      });
    }

    const branch = branchResult.rows[0];

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.user_id) as total_users,
        COUNT(DISTINCT v.visit_id) as total_visits
      FROM branches b
      LEFT JOIN users u ON b.branch_id = u.branch_id 
      LEFT JOIN visits v ON b.branch_id = v.branch_id
      WHERE b.branch_id = $1
    `;
    const stats = await pool.query(statsQuery, [branch_id]);

    // Log audit
    // await logAudit({
    //   user_id,
    //   branch_id,
    //   hospital_id: branch.hospital_id,
    //   table_name: "branches",
    //   action_type: "SELECT",
    //   event_type: "View Branch Details",
    //   request_method: req.method,
    //   endpoint: req.originalUrl,
    //   ip_address: req.ip
    // });

    res.status(200).json({
      status: "success",
      data: {
        branch,
        statistics: stats.rows[0]
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

export const getBranchesByHospital = async (req, res) => {
  try{

    // const user_id = req.user.user_id || null;
    const hospital_id = req.user.hospital_id || null;
    

    // if(user_id===3){
    //   const hospital = await pool.query('SELECT hospital_id FROM users WHERE user_id = $1', [user_id]);

    // }

    if(!hospital_id){
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID is required"
      });
    }
    const branches = await pool.query('SELECT * FROM branches WHERE hospital_id = $1 AND is_active = true ORDER BY branch_name ASC', [hospital_id]);


    res.status(200).json({
      status: "success",
      data: branches.rows
    });

    
  }catch(error){
    console.log(error);
    res.status(500).json({message: "Server error"});    
  }
}

export const currentHospitalDetails = async (req, res) => {
  const client = await pool.connect();
  try {
    const hospital_id = req.user.hospital_id || null;

    if (!hospital_id) {
      client.release(); 
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID is required"
      });
    }

    await client.query('BEGIN');

    const hospital = await client.query(
      'SELECT * FROM hospitals WHERE hospital_id = $1',
      [hospital_id]
    );

    if (hospital.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({
        status: "failed",
        message: "Hospital not found"
      });
    }

    const branches = await client.query(
      'SELECT * FROM branches WHERE hospital_id = $1 AND is_active = true ORDER BY branch_name ASC',
      [hospital_id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      status: "success",
      data: hospital.rows[0],
      branches: branches.rows
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error fetching hospital details:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message
    });
  } finally {
    client.release();
  }
};
