import {pool} from '../libs/database.js';
import { hashedPassword, comparePassword,createJWT } from '../libs/index.js';

export const signInUser = async (req, res) =>{
    try{

        const {email,username, password} = req.body;

        if(!email && !password || !username && !password){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill the required fields"
                }
        ) }

        const result = await pool.query('SELECT * FROM users WHERE email= $1 OR username = $2'  , [email, username]);

        const user = result.rows[0];

        if(!user){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Invalid credentials"
                });
        }
    
        const isMatch = await comparePassword(password, user?.password_hash);

        if (!isMatch){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Invalid credentials"
                });
        }
        const token = createJWT(user?.user_id);

        user.password = undefined;

        res.status(200).json(
            {
                status: "success",
                message: "User signed in successfully",
                user, token
            }
        )




    } catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}
