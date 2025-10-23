import { pool } from '../libs/database.js';
import { comparePassword, createJWT } from '../libs/index.js';
export const signInUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide password and either email or username",
      });
    }

    // 🔹 Get user by email or username
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid username/email or password",
      });
    }

    // 🔹 Compare password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid username/email or password",
      });
    }

    // 🔹 Blocked account or employment
    const blockedAccountStatuses = ["suspended", "locked", "archived"];
    const blockedEmploymentStatuses = ["fired", "suspended"];

    if (
      blockedAccountStatuses.includes(user.account_status) ||
      blockedEmploymentStatuses.includes(user.employment_status)
    ) {
      return res.status(403).json({
        status: "failed",
        message: "Account is not active. Please contact administrator.",
      });
    }

    // 🔹 Update last login timestamp
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
      [user.user_id]
    );

    let hospital_id = user.hospital_id;
    let branch_id = user.branch_id;
    let hospitals = [];

    // 🔹 If doctor and hospital_id is null → fetch from provider_hospitals
    if (user.role_id === 3 && !hospital_id) {
      const providerResult = await pool.query(
        `SELECT provider_id FROM healthcare_providers WHERE user_id = $1`,
        [user.user_id]
      );

      if (providerResult.rows.length > 0) {
        const provider_id = providerResult.rows[0].provider_id;

        const hospitalResults = await pool.query(
          `SELECT 
              ph.hospital_id,
              h.hospital_name,
              ph.branch_id,
              ph.is_primary
           FROM provider_hospitals ph
           JOIN hospitals h ON ph.hospital_id = h.hospital_id
           WHERE ph.provider_id = $1
           ORDER BY ph.is_primary DESC, ph.hospital_id ASC`,
          [provider_id]
        );

        hospitals = hospitalResults.rows;

        // 🏥 Set hospital_id and branch_id from primary or first hospital
        if (hospitals.length > 0) {
          // Use primary hospital if exists, otherwise use first one
          const primaryHospital = hospitals.find(h => h.is_primary) || hospitals[0];
          hospital_id = primaryHospital.hospital_id;
          branch_id = primaryHospital.branch_id;
        }
      }
    }

    // 🔹 Create JWT with hospital_id and branch_id included
    const token = createJWT({
      user_id: user.user_id,
      role_id: user.role_id,
      hospital_id: hospital_id,  // Now includes provider's hospital
      branch_id: branch_id,      // Now includes provider's branch
      must_change_password: user.must_change_password,
    });

    delete user.password_hash;

    // 🔹 Return user with hospital_id and branch_id set
    res.status(200).json({
      status: "success",
      message: "User signed in successfully",
      user: {
        ...user,
        hospital_id,  // Add to user object
        branch_id,    // Add to user object
      },
      hospitals,      // All hospitals for multi-hospital providers
      token,
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message,
    });
  }
};

export const doctorSelectHospital = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { hospital_id, branch_id } = req.body;
    if (!hospital_id || !branch_id) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide hospital_id and branch_id",
      });
    }
    // 🔹 Verify that the hospital and branch belong to the docto
    const hospitalResults = await pool.query(
      `SELECT 
          ph.hospital_id,
          h.hospital_name,
          ph.branch_id
       FROM provider_hospitals ph
       JOIN healthcare_providers hp ON ph.provider_id = hp.provider_id
       JOIN hospitals h ON ph.hospital_id = h.hospital_id
       WHERE hp.user_id = $1 AND ph.hospital_id = $2 AND ph.branch_id = $3`,
      [user_id, hospital_id, branch_id]
    );
    if (hospitalResults.rows.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid hospital_id or branch_id for this user",
      });
    }
    // 🔹 Create new JWT with selected hospital and branc
    const token = createJWT({
      user_id: user_id,
      role_id: req.user.role_id,
      hospital_id: hospital_id,
      branch_id: branch_id,
      must_change_password: req.user.must_change_password,
    });
    res.status(200).json({
      status: "success",
      message: "Hospital and branch selected successfully",
      hospital: hospitalResults.rows[0],
      token,
    });
    
  } catch (error) {
    console.error("Hospital selection error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message,
    });
  }
}
  