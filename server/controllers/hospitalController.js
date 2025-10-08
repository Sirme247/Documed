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




export const getHospitalInformation = async (req, res) => {
  try {
    const { hospital_id } = req.params; 

    if (hospital_id) {
      
      const hospital = await pool.query(
        'SELECT * FROM hospitals WHERE hospital_id = $1',
        [hospital_id]
      );

      if (hospital.rows.length === 0) {
        return res.status(404).json({
          status: 'failed',
          message: 'Hospital not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Hospital retrieved successfully',
        data: hospital.rows[0],
      });
    }

  
    const allHospitals = await pool.query('SELECT * FROM hospitals ORDER BY hospital_name ASC');

    res.status(200).json({
      status: 'success',
      message: 'Hospitals retrieved successfully',
      total: allHospitals.rowCount,
      data: allHospitals.rows,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};




export const getBranchInformation = async (req, res) => {
  try {
    const { hospital_id, branch_id } = req.params;

    
    if (hospital_id && branch_id) {
      const branch = await pool.query(
        `SELECT * FROM branches 
         WHERE branch_id = $1 AND hospital_id = $2`,
        [branch_id, hospital_id]
      );

      if (branch.rows.length === 0) {
        return res.status(404).json({
          status: 'failed',
          message: 'Branch not found for this hospital',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Branch retrieved successfully',
        data: branch.rows[0],
      });
    }

    
    if (hospital_id) {
      const branches = await pool.query(
        `SELECT * FROM branches 
         WHERE hospital_id = $1
         ORDER BY branch_name ASC`,
        [hospital_id]
      );

      return res.status(200).json({
        status: 'success',
        message: 'Branches retrieved successfully',
        total: branches.rowCount,
        data: branches.rows,
      });
    }

    
    const allBranches = await pool.query(
      `SELECT b.*, h.hospital_name 
       FROM branches b
       JOIN hospitals h ON h.hospital_id = b.hospital_id
       ORDER BY h.hospital_name, b.branch_name`
    );

    res.status(200).json({
      status: 'success',
      message: 'All branches retrieved successfully',
      total: allBranches.rowCount,
      data: allBranches.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
