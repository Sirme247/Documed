import JWT from 'jsonwebtoken';
// import dotenv from 'dotenv';


export const authMiddleware = async (req,res,next)=>{
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
          status: "auth_failed", 
          message: "Authentication failed"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const userToken = JWT.verify(token, process.env.JWT_SECRET);

        req.user = {
            user_id: userToken.user_id,
            role_id: userToken.role_id,
            hospital_id: userToken.hospital_id,
            must_change_password: userToken.must_change_password  
        };

        
       if (req.user.must_change_password && !req.originalUrl.endsWith("/change-password")) {
          return res.status(403).json({
            status: "forbidden",
            message: "You must change your password before continuing."
        });
        }

        next();
    } catch(error) {
        console.log(error);
        return res.status(401).json({
          status: "auth_failed", 
          message: "Authentication failed"
        });
    }
}

export const requireRole = (...allowedRoleIds) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoleIds.includes(req.user.role_id)) {
      return res
        .status(403)
        .json({ status: "forbidden", message: "Access denied" });
    }
    next();
  };
};



export default {authMiddleware , requireRole };