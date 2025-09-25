import {pool} from '../libs/database.js';

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

        const hospitalExist = await pool.query('SELECT * FROM hospital WHERE hospital_license_number= $1 OR contact_number = $3' , [hospital_license_number,contact_number]);

        if( hospitalExist.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Hospital with given license number or contact number already exists"
                }
            )
        }
        const newHospital = await pool.query( `INSERT INTO hospital 
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
