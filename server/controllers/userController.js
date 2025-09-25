import bcrypt from 'bcrypt';    

import {pool} from '../libs/database.js';
import { hashedPassword, createJWT } from '../libs/index.js';


export const registerUser = async (requestAnimationFrame,res) =>{
    try{
        const {first_name, middle_name, last_name,date_of_birth,gender,contact_info, address_line,hospital_id,email,
            username, password, role_id, employee_id,
            license_number,license_expiry,department,specialization} = req.body;

        if(!firstName || !last_name || !date_of_birth || !contact_info ||
          !hospital_id || !email || !username || !password || !role_id 
        ){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                });
            }    
            const userExist = await pool.query('SELECT * FROM users WHERE email= $1 OR  username = $2 OR employee_id = $3'  , [email, username,employee_id]);
            
            if(userExist.row.length > 0){
                return res.status(400).json(
                {
                    status: "failed",
                    message: "Account already exists"
                });
            }

            // 'super_admin', 'Full system access, manage hospitals and users',
            // 'local_admin', 'Manage hospital-specific users and patients',
            // 'provider', 'Healthcare providers such as doctors, nurses, pharmacists',
            // 'staff', 'Non-provider hospital staff like receptionists, lab techs, billing', 
            
            
            if (role_id === 3){ 
                const providerExist = await pool.query('SELECT * FROM healthcare_providers WHERE employee_id= $1 OR  license_number = $2' , [employee_id, license_number]);
                if(providerExist.row.length > 0){
                    return res.status(400).json(
                    {
                        status: "failed",
                        message: "Provider with given employee ID or license number already exists"
                    });
                }
            }

            const hashed_password = hashedPassword(password);

            const newUser = await pool.query( `INSERT INTO users 
                (first_name, middle_name, last_name, date_of_birth,
                 gender, contact_info, address_line, email, username,
                 password_hash, hospital_id, role_id, employee_id) 
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) 
                RETURNING user_id`,
            [
                first_name,middle_name || null,last_name,date_of_birth,gender || null,contact_info || null,
                address_line || null, email, username, hashed_password, hospital_id,role_id,employee_id,department
            ]
            )

            const user_id = newUser.rows[0].user_id;

            if (role_id === 3){
                await pool.query(`INSERT INTO healthcare_providers 
                (user_id, license_number, license_expiry,specialization) 
                VALUES ($1,$2,$3,$4)`,
                [user_id,  license_number, license_expiry, specialization]
                );
            }

            password = undefined;
            newUser.password = undefined;

             res.status(201).json(
                {
                    status: "success",
                    message: "Registration successfully"
                }
            );

            


    } catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const passwordReset = async (req, res) =>{
    try{


    } catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}