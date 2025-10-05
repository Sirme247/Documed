import {pool} from '../libs/database.js';

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

export const registerHospitalBranch = async (req, res)=>{
    try{

        const {hospital_id,branch_name,branch_type,branch_license_number,address_line,city, state,country,zip_code,contact_number,email,accredition_status} = req.body;

        if (!hospital_id || !branch_name || !branch_type || !branch_license_number || !address_line || !city || !country || !zip_code || !contact_number || !email || !accredition_status){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }

        const branchExist = await pool.query('SELECT * FROM branches WHERE branch_license_number= $1 AND hospital_id = $2' , [branch_license_number, hospital_id]);

        if( branchExist.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Branch with given license number already exists"
                }
            )
        }
        const newBranch = await pool.query( `INSERT INTO branches 
            (hospital_id,branch_name,branch_type,branch_license_number,address_line,city, state,country,zip_code,contact_number,email,accredition_status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) 
            RETURNING branch_id`,
            [
                hospital_id,branch_name,branch_type,branch_license_number,address_line,city,state,country,zip_code,contact_number,email,accredition_status
            ])
        
        const branch_id = newBranch.rows[0].branch_id;

        res.status(201).json(
            {
                status: "success",
                message: "Branch registered successfully",
                branch_id
            }
        )

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});    
    }
}

export const updateHospital = async (req, res) => {
  try {
    const { hospital_id } = req.body;
    if (!hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID is required",
      });
    }

    const hospitalExists = await pool.query(
      "SELECT * FROM hospitals WHERE hospital_id = $1",
      [hospital_id]
    );

    if (hospitalExists.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Hospital not found",
      });
    }

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

    const updatedHospital = await pool.query(
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
        
        safe(hospital_name),
        safe(hospital_type),
        safe(hospital_license_number),
        safe(address_line),
        safe(city),
        safe(state),
        safe(country),
        safe(zip_code),
        safe(contact_number),
        safe(email),
        safe(accredition_status),
        hospital_id

      ]
    );

    res.status(200).json({
      status: "success",
      message: "Hospital updated successfully",
      hospital: updatedHospital.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateHospitalBranch = async (req, res) => {
  try {
    const { branch_id } = req.body;
    if (!branch_id) {
      return res.status(400).json({
        status: "failed",
        message: "Branch ID is required",
      });
    }

    const branchExists = await pool.query(
      "SELECT * FROM branches WHERE branch_id = $1",
      [branch_id]
    );

    if (branchExists.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Branch not found",
      });
    }

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

    const updatedBranch = await pool.query(
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
                
        safe(branch_name),
        safe(branch_type),
        safe(branch_license_number),
        safe(address_line),
        safe(city),
        safe(state),
        safe(country),
        safe(zip_code),
        safe(contact_number),
        safe(email),
        safe(accredition_status),
        branch_id


      ]
    );

    res.status(200).json({
      status: "success",
      message: "Branch updated successfully",
      branch: updatedBranch.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Get hospital(s) information
export const getHospitalInformation = async (req, res) => {
  try {
    const { hospital_id } = req.params; // from /hospitals/:hospital_id

    if (hospital_id) {
      // Get single hospital by ID
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

    // Get all hospitals
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

    // 🏥 Case 1: Single branch of a hospital
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

    // 🏥 Case 2: All branches for a specific hospital
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

    // 🏥 Case 3: All branches across all hospitals
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
