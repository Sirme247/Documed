import {pool} from '../libs/database.js';
import { hashedPassword, comparePassword, createJWT } from '../libs/index.js';

export const signInUser = async (req, res) => {
    try {
        const {email, username, password} = req.body;

        // Validate that password is provided along with either email or username
        if (!password || (!email && !username)) {
            return res.status(400).json({
                status: "failed",
                message: "Please provide password and either email or username"
            });
        }

        // Query user by email or username (prioritize email if both provided)

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

        // Compare password - ensure correct argument order
        const isMatch = await comparePassword(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid username/email or password"
            });
        }

        // Check account and employment status
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

        // Update last login timestamp
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
            [user.user_id]
        );

        // Generate JWT token
        const token = createJWT(user);

        // Remove sensitive data
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