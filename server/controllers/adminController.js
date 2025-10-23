import express from 'express';
const router = express.Router();
import {pool} from '../libs/database.js'; 

export const getAdminStatistics = async (req, res) => {
  try {
    
    const [
      hospitalStats,
      branchStats,
      userStats,
      patientStats,
      visitStats,
      todayVisits,
    ] = await Promise.all([
      
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM hospitals'),
      
      pool.query('SELECT COUNT(*) as total FROM branches'),

      pool.query('SELECT COUNT(*) as total FROM users'),
      
      pool.query('SELECT COUNT(*) as total FROM patients'),
      
      pool.query('SELECT COUNT(*) as total FROM visits'),
      
      pool.query(`SELECT COUNT(*) as total FROM visits WHERE DATE(created_at) = CURRENT_DATE`),
      
     
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_hospitals: parseInt(hospitalStats.rows[0].total),
        active_hospitals: parseInt(hospitalStats.rows[0].active),
        total_branches: parseInt(branchStats.rows[0].total),
        total_users: parseInt(userStats.rows[0].total),
        total_patients: parseInt(patientStats.rows[0].total),
        total_visits: parseInt(visitStats.rows[0].total),
        today_visits: parseInt(todayVisits.rows[0].total),
      }
    });
    
  } catch (error) {
    console.error('Admin statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
};

export const getLocalAdminStatistics = async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    
    if (!hospital_id) {
      return res.status(400).json({
        success: false,
        message: 'Hospital ID not found for user'
      });
    }

    const [
      hospitalInfo,
      branchStats,
      userStats,
      patientStats,
      visitStats,
      todayVisits,
      providerStats,
      activePatients,
      recentVisits,
      departmentStats
    ] = await Promise.all([

      pool.query(
        'SELECT hospital_name, hospital_type, is_active, accredition_status FROM hospitals WHERE hospital_id = $1',
        [hospital_id]
      ),
      
    
      pool.query(
        'SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM branches WHERE hospital_id = $1',
        [hospital_id]
      ),
      
      // pool.query(
      //   'SELECT COUNT(*) as total, COUNT(CASE WHEN employment_status = $1 THEN 1 END) as active FROM users WHERE hospital_id = $2',
      //   ['active', hospital_id]
      // ),
       pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN employment_status = $2 THEN 1 END) as active
         FROM (
           -- Regular users with hospital_id
           SELECT user_id, employment_status 
           FROM users 
           WHERE hospital_id = $1
           
           UNION
           
           -- Medical providers via provider_hospitals
           SELECT u.user_id, u.employment_status
           FROM users u
           JOIN healthcare_providers hp ON u.user_id = hp.user_id
           JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
           WHERE ph.hospital_id = $1
         ) AS all_hospital_users`,
        [hospital_id, 'active']
      ),
      
      pool.query(
        'SELECT COUNT(DISTINCT patient_id) as total FROM patient_identifiers WHERE hospital_id = $1',
        [hospital_id]
      ),
      
      pool.query(
        'SELECT COUNT(*) as total FROM visits WHERE hospital_id = $1',
        [hospital_id]
      ),
      
      pool.query(
        'SELECT COUNT(*) as total FROM visits WHERE hospital_id = $1 AND DATE(visit_date) = CURRENT_DATE',
        [hospital_id]
      ),
      
      pool.query(
      `SELECT COUNT(DISTINCT hp.provider_id) AS total
        FROM healthcare_providers hp
        JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
        JOIN users u ON u.user_id = hp.user_id
        WHERE ph.hospital_id = $1
        AND u.employment_status = $2`,
      [hospital_id, 'active']
      ),

      
      pool.query(
        `SELECT COUNT(DISTINCT patient_id) as total 
         FROM visits 
         WHERE hospital_id = $1 
         AND visit_date >= CURRENT_DATE - INTERVAL '6 months'`,
        [hospital_id]
      ),
      
      pool.query(
        `SELECT COUNT(*) as total 
         FROM visits 
         WHERE hospital_id = $1 
         AND visit_date >= DATE_TRUNC('week', CURRENT_DATE)`,
        [hospital_id]
      ),
      
      pool.query(
        `SELECT department, COUNT(*) as count 
         FROM users 
         WHERE hospital_id = $1 
         AND employment_status = $2 
         AND department IS NOT NULL 
         GROUP BY department 
         ORDER BY count DESC 
         LIMIT 5`,
        [hospital_id, 'active']
      )
    ]);

    const visitTypesResult = await pool.query(
      `SELECT visit_type, COUNT(*) as count 
       FROM visits 
       WHERE hospital_id = $1 
       AND visit_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY visit_type`,
      [hospital_id]
    );

    res.status(200).json({
      success: true,
      data: {
        hospital_name: hospitalInfo.rows[0]?.hospital_name || 'N/A',
        hospital_type: hospitalInfo.rows[0]?.hospital_type || 'N/A',
        hospital_status: hospitalInfo.rows[0]?.is_active ? 'Active' : 'Inactive',
        accredition_status: hospitalInfo.rows[0]?.accredition_status || 'Not Accredited',
        
        total_branches: parseInt(branchStats.rows[0].total),
        active_branches: parseInt(branchStats.rows[0].active),
        
        total_staff: parseInt(userStats.rows[0].total),
        active_staff: parseInt(userStats.rows[0].active),
        total_providers: parseInt(providerStats.rows[0].total),
        
        total_patients: parseInt(patientStats.rows[0].total),
        active_patients: parseInt(activePatients.rows[0].total),
        
        total_visits: parseInt(visitStats.rows[0].total),
        today_visits: parseInt(todayVisits.rows[0].total),
        week_visits: parseInt(recentVisits.rows[0].total),
        
        departments: departmentStats.rows,
        visit_types: visitTypesResult.rows
      }
    });
    
  } catch (error) {
    console.error('Local admin statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital statistics',
      error: error.message
    });
  }
};

export const getBranchStatistics = async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const branch_id = req.user.branch_id;
    
    if (!hospital_id || !branch_id) {
      return res.status(400).json({
        success: false,
        message: 'Hospital ID or Branch ID not found for user'
      });
    }

    const [
      branchInfo,
      userStats,
      visitStats,
      todayVisits,
      providerStats
    ] = await Promise.all([
      pool.query(
        'SELECT branch_name, branch_type, is_active FROM branches WHERE branch_id = $1 AND hospital_id = $2',
        [branch_id, hospital_id]
      ),
      
      pool.query(
        'SELECT COUNT(*) as total FROM users WHERE branch_id = $1 AND employment_status = $2',
        [branch_id, 'active']
      ),
      
      pool.query(
        'SELECT COUNT(*) as total FROM visits WHERE branch_id = $1',
        [branch_id]
      ),
      
      pool.query(
        'SELECT COUNT(*) as total FROM visits WHERE branch_id = $1 AND DATE(visit_date) = CURRENT_DATE',
        [branch_id]
      ),
      
      pool.query(
        `SELECT COUNT(DISTINCT hp.provider_id) as total 
         FROM healthcare_providers hp 
         JOIN users u ON hp.user_id = u.user_id 
         WHERE u.branch_id = $1 AND u.employment_status = $2`,
        [branch_id, 'active']
      )
    ]);

    res.status(200).json({
      success: true,
      data: {
        branch_name: branchInfo.rows[0]?.branch_name || 'N/A',
        branch_type: branchInfo.rows[0]?.branch_type || 'N/A',
        branch_status: branchInfo.rows[0]?.is_active ? 'Active' : 'Inactive',
        total_staff: parseInt(userStats.rows[0].total),
        total_providers: parseInt(providerStats.rows[0].total),
        total_visits: parseInt(visitStats.rows[0].total),
        today_visits: parseInt(todayVisits.rows[0].total)
      }
    });
    
  } catch (error) {
    console.error('Branch statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch statistics',
      error: error.message
    });
  }
};


export const getHospitalUsers = async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const branch_id = req.user.branch_id;

    if (!hospital_id) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID not found for user"
      });
    }

    // Base params
    const params = [hospital_id];
    let branchFilter = "";

    // If branch-level user, limit scope
    if (branch_id) {
      params.push(branch_id);
      branchFilter = "AND (u.branch_id = $2 OR ph.branch_id = $2)";
    }

    // 🔹 Query 1: Non-medical hospital users (non-role 3/4)
    const hospitalUsersQuery = `
      SELECT 
        u.user_id, u.first_name, u.last_name, u.username,
        u.email, u.role_id, u.department, u.branch_id,u.contact_info,
        u.employment_status, u.account_status, u.created_at 
      FROM users u
      WHERE u.hospital_id = $1 
        AND u.role_id NOT IN (3, 4)
        ${branchFilter}
      ORDER BY u.created_at DESC;
    `;

    // 🔹 Query 2: Medical providers (role 3/4) joined via provider tables
    const providerUsersQuery = `
      SELECT 
        u.user_id, u.first_name, u.last_name, u.username, u.email,
        u.role_id, hp.specialization, hp.license_number,
        ph.branch_id, ph.is_primary, ph.start_date, ph.end_date
      FROM users u
      JOIN healthcare_providers hp ON u.user_id = hp.user_id
      JOIN provider_hospitals ph ON hp.provider_id = ph.provider_id
      WHERE ph.hospital_id = $1
        ${branchFilter}
      ORDER BY u.created_at DESC;
    `;

    // Execute both queries
    const [hospitalUsers, providerUsers] = await Promise.all([
      pool.query(hospitalUsersQuery, params),
      pool.query(providerUsersQuery, params)
    ]);

    // Merge results if needed, or return separately
    res.status(200).json({
      success: true,
      scope: branch_id ? "branch" : "hospital",
      data: {
        general_users: hospitalUsers.rows,
        medical_providers: providerUsers.rows
      }
    });

  } catch (error) {
    console.error("Hospital users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hospital users",
      error: error.message
    });
  }
};
