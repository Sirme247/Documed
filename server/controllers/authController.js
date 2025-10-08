import {pool} from '../libs/database.js';
import { hashedPassword, comparePassword, createJWT } from '../libs/index.js';
import { logAudit } from "../libs/auditLogger.js";


export const signInUser = async (req, res) => {
    try {
        const {email, username, password} = req.body;

        if (!password || (!email && !username)) {
            return res.status(400).json({
                status: "failed",
                message: "Please provide password and either email or username"
            });
        }


        const result = await pool.query('SELECT * FROM users WHERE email= $1 OR username = $2' , [email, username]);
        // let result;
        // if (email) {
        //     result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
        // } else {
        //     result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
        // }

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid username/email or password"
            });
        }

      
        const isMatch = await comparePassword(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid username/email or password"
            });
        }

       
        const blockedAccountStatuses = ['suspended', 'locked', 'archived'];
        const blockedEmploymentStatuses = ['fired', 'suspended'];

        if (blockedAccountStatuses.includes(user.account_status) || 
            blockedEmploymentStatuses.includes(user.employment_status)) {
            return res.status(400).json({
                status: "failed",
                message: "Account is not active. Please contact administrator."
            });
        }

        // Check if password change is required
        // if (user.must_change_password) {
        //     return res.status(403).json({
        //         status: "failed",
        //         message: "Password reset required. Please change your temporary password."
        //     });
        // }

       
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
            [user.user_id]
        );

        
        const token = createJWT(user);

       
        delete user.password_hash;

        res.status(200).json({
            status: "success",
            message: "User signed in successfully",
            user,
            token
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "failed",
            message: "Server error"
        });
    }
}