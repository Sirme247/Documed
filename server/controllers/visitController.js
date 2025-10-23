import {pool} from '../libs/database.js';
import { logAudit } from "../libs/auditLogger.js";

export const registerVisit = async (req, res)=>{
    try{
        const user_id = req.user.user_id;


        const {visit_number,visit_type,patient_id,provider_id,hospital_id,branch_id,priority_level,referring_provider_name,referring_provider_hospital,reason_for_visit,admission_status,discharge_date,notes} = req.body;
        if(!visit_number || !visit_type || !patient_id || !hospital_id){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }

        const visitExist = await pool.query('SELECT * FROM visits WHERE visit_number= $1 AND patient_id = $2' , [visit_number,patient_id]);

        if( visitExist.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Visit with given visit number already exists"
                }
            )
        }
        const newVisit = await pool.query( `INSERT INTO visits 
            (visit_number,visit_type,patient_id,provider_id,hospital_id,branch_id,priority_level,referring_provider_name,referring_provider_hospital,reason_for_visit,admission_status,discharge_date,notes,user_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) 
            RETURNING visit_id`,
            [
                visit_number,visit_type,patient_id,provider_id,hospital_id,branch_id??null,priority_level,referring_provider_name??null,referring_provider_hospital??null,reason_for_visit,admission_status??null,discharge_date?? null,notes??null, user_id
            ])

        const visit_id = newVisit.rows[0].visit_id;

        res.status(201).json(
            {
                status: "success",
                message: "Patient visit registered successfully",
                visit_id
            }
        )    


    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }   
}

export const recordVitals = async (req, res)=>{
    try{
        const {visit_id,  blood_pressure,heart_rate, respiratory_rate, temperature,oxygen_saturation,weight,weight_unit, height,height_unit, bmi} = req.body;        
        if(!visit_id || !temperature || !blood_pressure || !heart_rate){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }           

        const newVitals = await pool.query( `INSERT INTO vitals
            (visit_id,  blood_pressure,heart_rate, respiratory_rate, temperature,oxygen_saturation,weight,weight_unit, height,height_unit, bmi)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
                visit_id,  blood_pressure,heart_rate, respiratory_rate, temperature,oxygen_saturation,weight??null,weight_unit??'kg', height??NULL,height_unit??'cm', bmi??null
            ]
        )   
        res.status(201).json(
            {
                status: "success",
                message: "Patient vitals recorded successfully",
            }
        )   

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const recordDiagnosis = async (req, res)=>{
    try{
        const {visit_id, diagnosis_type,diagnosis_name,icd_codes_version, icd_code,is_chronic,diagnosis_description,severity} = req.body;        

        if(!visit_id || !diagnosis_name){
            return res.status(400).json(
                {   
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }
        
        const newDiagnosis = await pool.query( `INSERT INTO diagnoses
            (visit_id, diagnosis_type,diagnosis_name,icd_codes_version, icd_code,is_chronic,diagnosis_description,severity)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
                visit_id, diagnosis_type??'General',diagnosis_name,icd_codes_version??null, icd_code??null,is_chronic??false,diagnosis_description??null,severity??'Not Specified'
            ]
        )


        res.status(201).json(
            {
                status: "success",
                message: "Patient diagnosis recorded successfully",
            }
        )

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }       

}

export const recordTreatments = async (req, res)=>{
    try{

        const {visit_id,treatment_name,treatment_type,procedure_code,treatment_description,start_date,end_date,outcome,complications,follow_up_required,treatment_notes} = req.body


        if(!visit_id || !treatment_name){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }
       const newTreatment = await pool.query(
  `INSERT INTO treatments
    (visit_id, treatment_name, treatment_type, procedure_code, treatment_description,
     start_date, end_date, outcome, complications, follow_up_required, treatment_notes)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
  [
    visit_id,
    treatment_name,
    treatment_type === "" ? null : treatment_type,
    procedure_code === "" ? null : procedure_code,
    treatment_description === "" ? null : treatment_description,
    start_date === "" ? null : start_date,
    end_date === "" ? null : end_date,
    outcome === "" ? "Ongoing" : outcome, // default if empty
    complications === "" ? null : complications,
    follow_up_required === true, // ensures boolean
    treatment_notes === "" ? null : treatment_notes,
  ]
);

        res.status(201).json(
            {
                status: "success",
                message: "Patient treatment recorded successfully",
            }
        )

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const recordVisitPrescriptions = async (req, res)=>{
    try{
        const {visit_id, medication_name, dosage, frequency, start_date, end_date, refills_allowed,instructions, is_active} = req.body;            
        if(!visit_id || !medication_name){  
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }
        const newPrescription = await pool.query(
  `INSERT INTO visit_prescriptions
    (visit_id, medication_name, dosage, frequency, start_date, end_date, refills_allowed, instructions, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
  [
    visit_id,
    medication_name,
    dosage || null,
    frequency || null,
    start_date === "" ? null : start_date,
    end_date === "" ? null : end_date,
    refills_allowed ?? 0,
    instructions || null,
    is_active ?? true
  ]
);

        res.status(201).json(
            {

                status: "success",
                message: "Visit prescription recorded successfully",
            }
        )       
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const RecordLabTests = async (req, res)=>{
    try{
        const {visit_id, priority, test_code, test_name,pdf_url, findings, recommendations,lab_notes} = req.body;
        if(!visit_id || !test_name){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }
        const newLabTest = await pool.query( `INSERT INTO lab_tests
            (visit_id, priority, test_code, test_name,pdf_url, findings, recommendations,lab_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,  
            [
                visit_id, priority??'normal', test_code??null, test_name, pdf_url??null, findings??null, recommendations??null,lab_notes??null
            ]   
        )
        res.status(201).json(
            {
                status: "success",
                message: "Lab test recorded successfully",
            }
        )       
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }       
}

export const recordImagingResults = async (req, res)=>{
    try{
        const{visit_id,image_url,findings,reccomendations}= req.body;

        if(!visit_id || !image_url ){
            return res.status(400).json(
                {
                    status: "failed",   
                    message: "Please fill all required fields"
                }
            )
        }   
        const newImagingResult = await pool.query( `INSERT INTO imaging_results
            (visit_id,image_url,findings,reccomendations)    
            VALUES ($1,$2,$3,$4)`,  
            [
                visit_id,image_url,findings??null,reccomendations??null
            ]
        )
        res.status(201).json(
            {
                status: "success",
                message: "Imaging result recorded successfully",
            }
        )       
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }   
}


export const getVisitDetails = async (req, res) => {
  try {
    const { visit_id } = req.params;

    if (!visit_id) {
      return res.status(400).json({
        status: "failed",
        message: "Visit ID is required",
      });
    }

    const visitResult = await pool.query(
      `SELECT 
          v.*, 
          p.first_name AS patient_first_name, 
          p.last_name AS patient_last_name, 
          h.hospital_name,
          h.city AS hospital_city,
          b.branch_name,
          b.city AS branch_city
       FROM visits v
       LEFT JOIN patients p ON v.patient_id = p.patient_id
       LEFT JOIN hospitals h ON v.hospital_id = h.hospital_id
       LEFT JOIN branches b ON v.branch_id = b.branch_id
       WHERE v.visit_id = $1`,
      [visit_id]
    );

    if (visitResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Visit not found",
      });
    }

    const [
      vitalsResult,
      diagnosesResult,
      treatmentsResult,
      prescriptionsResult,
      labTestsResult,
      imagingResultsResult,
    ] = await Promise.all([
      pool.query("SELECT * FROM vitals WHERE visit_id = $1", [visit_id]),
      pool.query("SELECT * FROM diagnoses WHERE visit_id = $1", [visit_id]),
      pool.query("SELECT * FROM treatments WHERE visit_id = $1", [visit_id]),
      pool.query("SELECT * FROM visit_prescriptions WHERE visit_id = $1", [visit_id]),
      pool.query("SELECT * FROM lab_tests WHERE visit_id = $1", [visit_id]),
      pool.query("SELECT * FROM imaging_results WHERE visit_id = $1", [visit_id]),
    ]);

    const visitData = {
      ...visitResult.rows[0],
      vitals: vitalsResult.rows,
      diagnoses: diagnosesResult.rows,
      treatments: treatmentsResult.rows,
      prescriptions: prescriptionsResult.rows,
      lab_tests: labTestsResult.rows,
      imaging_results: imagingResultsResult.rows,
    };

    res.status(200).json({
      status: "success",
      message: "Visit data retrieved successfully",
      data: visitData,
    });
  } catch (error) {
    console.error("Error fetching visit details:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getPatientVisits = async (req, res) => {
  try {
    const { patient_id } = req.params;

    if (!patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "Patient ID is required",
      });
    }

    const visitsResult = await pool.query(
      `SELECT 
          v.visit_id,
          v.visit_number,
          v.visit_date,
          v.visit_type,
          v.reason_for_visit,
          v.priority_level,
          v.hospital_id,
          h.hospital_name,
          h.city AS hospital_city,
          v.branch_id,
          b.branch_name,
          b.city AS branch_city,
          v.created_at,
          v.updated_at
       FROM visits v
       LEFT JOIN hospitals h ON v.hospital_id = h.hospital_id
       LEFT JOIN branches b ON v.branch_id = b.branch_id
       WHERE v.patient_id = $1
       ORDER BY v.visit_date DESC`,
      [patient_id]
    );

    if (visitsResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "No visits found for this patient",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Patient visits retrieved successfully",
      data: visitsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching patient visits:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};




export const deleteVisit = async (req, res) => {
  const client = await pool.connect();

  try {
    const { visit_id } = req.params;

    if (!visit_id) {
      return res.status(400).json({
        status: "failed",
        message: "Visit ID is required",
      });
    }

    // 
    // if (![1, 2, 3].includes(req.user.role_id)) {
    //   return res.status(403).json({
    //     status: "failed",
    //     message: "You are not authorized to delete visits",
    //   });
    // }

    await client.query("BEGIN");

    const visitResult = await client.query(
      `SELECT * FROM visits WHERE visit_id = $1`,
      [visit_id]
    );

    if (visitResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Visit not found",
      });
    }

    const visit = visitResult.rows[0];

    if (req.user.role_id === 2 && visit.hospital_id !== req.user.hospital_id) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        status: "failed",
        message: "You can only delete visits from your hospital",
      });
    }

    const tables = [
      "vitals",
      "diagnoses",
      "treatments",
      "visit_prescriptions",
      "lab_tests",
      "imaging_results",
    ];

    for (const table of tables) {
      await client.query(`DELETE FROM ${table} WHERE visit_id = $1`, [visit_id]);

      await logAudit({
        user_id: req.user.user_id,
        table_name: table,
        action_type: "delete_related_records",
        old_values: { visit_id },
        event_type: "DELETE",
        ip_address: req.ip,
        branch_id: req.user.branch_id,
        hospital_id: req.user.hospital_id,
        request_method: req.method,
        endpoint: req.originalUrl,
      });
    }

    await client.query(`DELETE FROM visits WHERE visit_id = $1`, [visit_id]);

    await logAudit({
      user_id: req.user.user_id,
      table_name: "visits",
      action_type: "delete_visit",
      old_values: visit,
      event_type: "DELETE",
      ip_address: req.ip,
      branch_id: req.user.branch_id,
      hospital_id: req.user.hospital_id,
      request_method: req.method,
      endpoint: req.originalUrl,
    });

    await client.query("COMMIT");

    res.status(200).json({
      status: "success",
      message: "Visit and all related records deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting visit:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

export const getVisitsList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      hospital_id, 
      branch_id,
      visit_type,
      priority_level,
      admission_status,
      search,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        v.visit_id,
        v.visit_number,
        v.visit_date,
        v.visit_type,
        v.priority_level,
        v.reason_for_visit,
        v.admission_status,
        v.patient_id,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.primary_number AS patient_phone,
        v.provider_id,
        v.hospital_id,
        h.hospital_name,
        v.branch_id,
        b.branch_name,
        v.created_at,
        v.updated_at
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.patient_id
      LEFT JOIN hospitals h ON v.hospital_id = h.hospital_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCounter = 1;

    if (hospital_id) {
      query += ` AND v.hospital_id = $${paramCounter}`;
      queryParams.push(hospital_id);
      paramCounter++;
    }

    if (branch_id) {
      query += ` AND v.branch_id = $${paramCounter}`;
      queryParams.push(branch_id);
      paramCounter++;
    }

    if (visit_type) {
      query += ` AND v.visit_type = $${paramCounter}`;
      queryParams.push(visit_type);
      paramCounter++;
    }

    if (priority_level) {
      query += ` AND v.priority_level = $${paramCounter}`;
      queryParams.push(priority_level);
      paramCounter++;
    }

    if (admission_status) {
      query += ` AND v.admission_status = $${paramCounter}`;
      queryParams.push(admission_status);
      paramCounter++;
    }

    if (search) {
      query += ` AND (
        p.first_name ILIKE $${paramCounter} OR 
        p.last_name ILIKE $${paramCounter} OR
        v.visit_number ILIKE $${paramCounter} OR
        v.reason_for_visit ILIKE $${paramCounter}
      )`;
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    if (start_date) {
      query += ` AND v.visit_date >= $${paramCounter}`;
      queryParams.push(start_date);
      paramCounter++;
    }

    if (end_date) {
      query += ` AND v.visit_date <= $${paramCounter}`;
      queryParams.push(end_date);
      paramCounter++;
    }

    const countQuery = query.replace(
      /SELECT[\s\S]*FROM/,
      'SELECT COUNT(*) FROM'
    );
    const countResult = await pool.query(countQuery, queryParams);
    const totalRecords = parseInt(countResult.rows[0].count);

    query += ` ORDER BY v.visit_date DESC, v.created_at DESC`;
    query += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(limit, offset);

    const visitsResult = await pool.query(query, queryParams);

    res.status(200).json({
      status: "success",
      message: "Visits list retrieved successfully",
      data: visitsResult.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalRecords / limit),
        total_records: totalRecords,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error fetching visits list:", error);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};

export const getHospitalVisitsForDay = async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const branch_id = req.user.branch_id;

    if (!hospital_id) {
      return res.status(400).json({
        status: "error",
        message: "Hospital ID not found for user"
      });
    }

    
    let query = `
      SELECT 
        v.visit_id,
        v.visit_number,
        v.visit_date,
        v.visit_type,
        v.reason_for_visit,
        v.priority_level,
        v.admission_status,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.primary_number AS patient_phone,
        b.branch_name,
        h.hospital_name
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.patient_id
      LEFT JOIN hospitals h ON v.hospital_id = h.hospital_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      WHERE v.hospital_id = $1
      AND DATE(v.visit_date) = CURRENT_DATE
    `;

    const params = [hospital_id];

    if (branch_id) {
      query += ` AND v.branch_id = $2`;
      params.push(branch_id);
    }

    query += ` ORDER BY v.visit_date DESC, v.created_at DESC`;

    const result = await pool.query(query, params);

    console.log('Today visits query result:', {
      hospital_id,
      branch_id,
      total_visits: result.rows.length,
      date: new Date().toISOString()
    });

    res.status(200).json({
      status: "success",
      scope: branch_id ? "branch" : "hospital",
      total_visits: result.rows.length,
      visits: result.rows
    });

  } catch (error) {
    console.error("Error fetching hospital visits for day:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message
    });
  }
};

export const visitsInHospital = async (req, res) => {
  try {
    const hospital_id = req.user.hospital_id;
    const branch_id = req.user.branch_id || null;

    if (!hospital_id) {
      return res.status(400).json({
        status: "error",
        message: "Hospital ID not found for user"
      });
    }

    let query;
    let params;

    if (branch_id) {
      // ✅ User is tied to a specific branch
      query = `
        SELECT 
          v.*,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          b.branch_name
        FROM visits v
        LEFT JOIN patients p ON v.patient_id = p.patient_id
        LEFT JOIN branches b ON v.branch_id = b.branch_id
        WHERE v.hospital_id = $1 AND v.branch_id = $2
        ORDER BY v.visit_date DESC
      `;
      params = [hospital_id, branch_id];
    } else {
      // ✅ User is tied to the entire hospital (no branch restriction)
      query = `
        SELECT 
          v.*,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          b.branch_name
        FROM visits v
        LEFT JOIN patients p ON v.patient_id = p.patient_id
        LEFT JOIN branches b ON v.branch_id = b.branch_id
        WHERE v.hospital_id = $1
        ORDER BY v.visit_date DESC
      `;
      params = [hospital_id];
    }

    const result = await pool.query(query, params);

    res.status(200).json({
      status: "success",
      total_visits: result.rows.length,
      visits: result.rows
    });

  } catch (error) {
    console.error("Error fetching visits in hospital:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message
    });
  }
};