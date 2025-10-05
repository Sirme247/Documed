import express from 'express';
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';

export const hashedPassword = async(userValue)=>{
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(userValue, salt);
    return hashedPassword;
}

export const comparePassword = async(userPassword, password)=>{
    try{
        const isMatch = await bcrypt.compare(userPassword, password);

        return isMatch;

    } catch(error){
        console.log(error);
        throw new Error("Incorrect username or password");
    }
}

// export const createJWT = (id)=>{
//     return JWT.sign({
//         user_id: id}, 
//         process.env.JWT_SECRET, {
//             expiresIn: "1d"
//         }
        
//     )
// }
export const createJWT = (user) => {
  return JWT.sign(
    {
      user_id: user.user_id,
      role_id: user.role_id,
      hospital_id: user.hospital_id,
      must_change_password: user.must_change_password
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};
