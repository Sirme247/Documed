import {pool} from '../libs/database.js';
import { logAudit } from "../libs/auditLogger.js";

const safe = (val) => (val !== undefined ? val : null);

const toNull = (value) => (value === '' ? null : value);

export const registerPatient = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // const user_hospital_id = req.user.hospital_id;

    const {
      first_name, middle_name, last_name, country_of_birth,
      country_of_residence, national_id, date_of_birth, gender,
      marital_status, blood_type, occupation, address_line,
      email, primary_number, secondary_number, emergency_contact1_name,
      emergency_contact1_number, emergency_contact1_relationship, emergency_contact2_name,
      emergency_contact2_number, emergency_contact2_relationship, primary_insurance_provider,
      primary_insurance_policy_number, secondary_insurance_provider,
      secondary_insurance_policy_number, ethnicity, preffered_language, religion,

      hospital_id, patient_mrn,

      allergen, reaction, allergy_severity, verified,
      medication_name, dosage, frequency, start_date, end_date, medication_is_active,
      hospital_where_prescribed, medication_notes,

      icd_codes_version, icd_code, condition_name, diagnosed_date,
      current_status, condition_severity, management_plan, condition_notes, is_active,

      relationship, relative_name, relative_patient_id, relative_condition_name,
      age_of_onset, family_history_notes,

      smoking_status, alcohol_use, drug_use, physical_activity,
      diet_description, living_situation, support_system
    } = req.body;

    const user_id = req.user.user_id; 
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;
    const branch_id = req.user.branch_id || null;

    if (!first_name || !last_name || !country_of_residence || !date_of_birth || !gender || !primary_number ) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    const patientExist = await client.query(
      `SELECT * FROM patients WHERE
        (email = $1 AND email IS NOT NULL) OR
        (national_id = $2 AND national_id IS NOT NULL) OR
        (first_name = $3 AND last_name = $4 AND date_of_birth = $5 AND gender = $6)`,
      [email, national_id, first_name, last_name, date_of_birth, gender]
    );

    if (patientExist.rows.length > 0) {
      return res.status(400).json({
        status: "failed",
        message: "Patient with given email or national ID already exists"
      });
    }

    const newPatient = await client.query(
  `INSERT INTO patients (
    first_name, middle_name, last_name, country_of_birth, country_of_residence, national_id, 
    date_of_birth, gender, marital_status, blood_type, occupation, address_line, email,
    primary_number, secondary_number, emergency_contact1_name, emergency_contact1_number, 
    emergency_contact1_relationship, emergency_contact2_name, emergency_contact2_number,
    emergency_contact2_relationship, primary_insurance_provider, primary_insurance_policy_number,
    secondary_insurance_provider, secondary_insurance_policy_number, ethnicity, preffered_language, religion
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28)
  RETURNING patient_id`,
  [
    first_name,
    middle_name,
    last_name,
    country_of_birth,
    country_of_residence,
    national_id,
    date_of_birth,
    gender,
    marital_status,
    blood_type,
    occupation,
    address_line,
    email,
    primary_number,
    secondary_number,
    emergency_contact1_name,
    emergency_contact1_number,
    emergency_contact1_relationship,
    emergency_contact2_name,
    emergency_contact2_number,
    emergency_contact2_relationship,
    toNull(primary_insurance_provider),
    toNull(primary_insurance_policy_number),
    toNull(secondary_insurance_provider),
    toNull(secondary_insurance_policy_number),
    toNull(ethnicity),
    toNull(preffered_language),
    toNull(religion)
  ]
);


    const patient_id = newPatient.rows[0].patient_id;

    const identifier = await client.query(
      `INSERT INTO patient_identifiers (patient_id, hospital_id, patient_mrn)
       VALUES ($1,$2,$3) RETURNING *`,
      [patient_id, hospital_id, patient_mrn]
    );

   await client.query(
  `INSERT INTO audit_logs (
    user_id, patient_id, table_name, action_type, old_values, new_values,
    ip_address, event_type, branch_id, hospital_id, request_method, endpoint
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
  [
    user_id,
    patient_id,
    'patients',
    'INSERT',
    null,
    null,
    ip_address,
    'Create',
    branch_id,
    hospital_id,
    request_method,
    endpoint
  ]
);

    if (allergen) {
      const allergy = await client.query(
        `INSERT INTO allergies (patient_id, allergen, reaction, allergy_severity, verified)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [patient_id, allergen, reaction, allergy_severity || 'Not Specified', verified || false]
      );

    await client.query(
  `INSERT INTO audit_logs (
    user_id, patient_id, table_name, action_type, old_values,
    ip_address, event_type, branch_id, hospital_id, request_method, endpoint
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
  [
    user_id,
    patient_id,
    'allergies',
    'INSERT',
    null,
    ip_address,
    'Create',
    branch_id,
    hospital_id,
    request_method,
    endpoint
  ]
);

    }
    if (medication_name) {
      const med = await client.query(
        `INSERT INTO medications (
            patient_id, medication_name, dosage, frequency, start_date, end_date,
            medication_is_active, hospital_where_prescribed, medication_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          patient_id, medication_name, dosage || null, frequency || null,
          start_date || null, end_date || null, medication_is_active || true,
          hospital_where_prescribed || null, medication_notes || null
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (
          user_id, patient_id, table_name, action_type, old_values,
          ip_address, event_type, branch_id, hospital_id, request_method, endpoint
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          user_id,
          patient_id,
          'allergies',
          'INSERT',
          null,
          'Create',
          branch_id,
          hospital_id,
          request_method,
          endpoint
        ]);
    }
    if (condition_name) {
      const condition = await client.query(
        `INSERT INTO chronic_conditions (
            patient_id, icd_codes_version, icd_code, condition_name, diagnosed_date,
            current_status, condition_severity, management_plan, condition_notes, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          patient_id, icd_codes_version || null, icd_code || null, condition_name || null,
          diagnosed_date || null, current_status || null, condition_severity || 'Not Specified',
          management_plan || null, condition_notes || null, is_active || true
        ]
      );

    await client.query(
        `INSERT INTO audit_logs (
          user_id, patient_id, table_name, action_type, old_values,
          ip_address, event_type, branch_id, hospital_id, request_method, endpoint
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          user_id,
          patient_id,
          'chronic_conditions',
          'INSERT',
          null,
          'Create',
          branch_id,
          hospital_id,
          request_method,
          endpoint
        ]);
    }

    if (relative_condition_name) {
      const fam = await client.query(
        `INSERT INTO family_history (
            patient_id, relative_name, relationship, relative_patient_id, 
            relative_condition_name, age_of_onset, family_history_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [patient_id, relative_name, relationship ?? null, relative_patient_id || null,
         relative_condition_name || null, age_of_onset || null, family_history_notes || null]
      );

      await client.query(
        `INSERT INTO audit_logs (
          user_id, patient_id, table_name, action_type, old_values,
          ip_address, event_type, branch_id, hospital_id, request_method, endpoint
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          user_id,
          patient_id,
          'family_history',
          'INSERT',
          null,
          'Create',
          branch_id,
          hospital_id,
          request_method,
          endpoint
        ]);
    }

    if (smoking_status || alcohol_use || drug_use || physical_activity || diet_description || living_situation) {
      const social = await client.query(
        `INSERT INTO social_history (
            patient_id, smoking_status, alcohol_use, drug_use, physical_activity,
            diet_description, living_situation, support_system)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          patient_id, smoking_status || null, alcohol_use || null, drug_use || null,
          physical_activity || null, diet_description || null, living_situation || null, support_system || null
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (
          user_id, patient_id, table_name, action_type, old_values,
          ip_address, event_type, branch_id, hospital_id, request_method, endpoint
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          user_id,
          patient_id,
          'social_history',
          'INSERT',
          null,
          'Create',
          branch_id,
          hospital_id,
          request_method,
          endpoint
        ]);
    }

    await client.query("COMMIT");
    res.status(201).json({
      status: "success",
      message: "Patient registered successfully",
      patient: newPatient.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};



export const addAllergies = async (req, res) => {
  try {
    const { patient_id, allergen, reaction, allergy_severity, verified } = req.body;
    const user_id = req.user?.user_id || null;

    if (!allergen || !reaction) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    const allergyExists = await pool.query(
      "SELECT * FROM allergies WHERE allergen = $1 AND patient_id=$2",
      [allergen, patient_id]
    );

    if (allergyExists.rows.length > 0) {
      return res.status(400).json({
        status: "failed",
        message: "The allergy is already recorded",
        duplicates: allergyExists.rows
      });
    }

    const addNewAllergy = await pool.query(
      `INSERT INTO allergies (patient_id, allergen, reaction, allergy_severity, verified)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [patient_id, allergen, reaction, allergy_severity ?? "Not Specified", verified ?? false]
    );

    const allergyData = addNewAllergy.rows[0];

    await logAudit({
      user_id,
      patient_id,
      table_name: "allergies",
      action_type: "INSERT",
      new_values: allergyData,
      event_type: "Add Allergy",
      request_method: req.method,
      endpoint: req.originalUrl
    });

    res.status(201).json({
      status: "success",
      message: "Allergy recorded successfully",
      allergyData
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addMedication = async (req, res) => {
  try {
    const {
      patient_id,
      medication_name,
      dosage,
      frequency,
      start_date,
      end_date,
      medication_is_active,
      hospital_where_prescribed,
      medication_notes
    } = req.body;
    const user_id = req.user?.user_id || null;

    if (!medication_name) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    const addNewMedication = await pool.query(
      `INSERT INTO medications
        (patient_id, medication_name, dosage, frequency, start_date, end_date, medication_is_active,
         hospital_where_prescribed, medication_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        patient_id,
        medication_name,
        dosage || null,
        frequency || null,
        start_date || null,
        end_date || null,
        medication_is_active || true,
        hospital_where_prescribed || null,
        medication_notes || null
      ]
    );

    const medData = addNewMedication.rows[0];

    await logAudit({
      user_id,
      patient_id,
      table_name: "medications",
      action_type: "INSERT",
      new_values: medData,
      event_type: "Add Medication",
      request_method: req.method,
      endpoint: req.originalUrl
    });

    res.status(201).json({
      status: "success",
      message: "Medication recorded successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addChronicConditions = async (req, res) => {
  try {
    const {
      patient_id,
      icd_codes_version,
      icd_code,
      condition_name,
      diagnosed_date,
      current_status,
      condition_severity,
      management_plan,
      condition_notes,
      is_active
    } = req.body;
    const user_id = req.user?.user_id || null;

    if (!condition_name || !current_status) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    const addNewChronicCondition = await pool.query(
      `INSERT INTO chronic_conditions
        (patient_id, icd_codes_version, icd_code, condition_name, diagnosed_date,
         current_status, condition_severity, management_plan, condition_notes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        patient_id,
        icd_codes_version || null,
        icd_code || null,
        condition_name,
        diagnosed_date || null,
        current_status,
        condition_severity || "Not Specified",
        management_plan || null,
        condition_notes || null,
        is_active || true
      ]
    );

    const conditionData = addNewChronicCondition.rows[0];

    await logAudit({
      user_id,
      patient_id,
      table_name: "chronic_conditions",
      action_type: "INSERT",
      new_values: conditionData,
      event_type: "Add Chronic Condition",
      request_method: req.method,
      endpoint: req.originalUrl
    });

    res.status(201).json({
      status: "success",
      message: "Condition recorded successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addFamilyHistory = async (req, res) => {
  try {
    const {
      patient_id,
      relative_name,
      relationship,
      relative_patient_id,
      relative_condition_name,
      age_of_onset,
      family_history_notes
    } = req.body;
    const user_id = req.user?.user_id || null;

    if (!relative_condition_name) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    const addNewFamilyHistory = await pool.query(
      `INSERT INTO family_history
        (patient_id, relative_name, relationship, relative_patient_id,
         relative_condition_name, age_of_onset, family_history_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        patient_id,
        relative_name,
        relationship || null,
        relative_patient_id || null,
        relative_condition_name,
        age_of_onset || null,
        family_history_notes || null
      ]
    );

    const familyData = addNewFamilyHistory.rows[0];

    await logAudit({
      user_id,
      patient_id,
      table_name: "family_history",
      action_type: "INSERT",
      new_values: familyData,
      event_type: "Add Family History",
      request_method: req.method,
      endpoint: req.originalUrl
    });

    res.status(201).json({
      status: "success",
      message: "Family history recorded successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addSocialHistory = async (req, res) => {
  try {
    const {
      patient_id,
      smoking_status,
      alcohol_use,
      drug_use,
      physical_activity,
      diet_description,
      living_situation,
      support_system
    } = req.body;
    const user_id = req.user?.user_id || null;

    if (!smoking_status && !alcohol_use && !drug_use && !physical_activity && !living_situation && !support_system) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all required fields"
      });
    }

    const addNewSocialHistory = await pool.query(
      `INSERT INTO social_history
        (patient_id, smoking_status, alcohol_use, drug_use, physical_activity,
         diet_description, living_situation, support_system)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        patient_id,
        smoking_status || null,
        alcohol_use || null,
        drug_use || null,
        physical_activity || null,
        diet_description || null,
        living_situation || null,
        support_system || null
      ]
    );

    const socialData = addNewSocialHistory.rows[0];

    await logAudit({
      user_id,
      patient_id,
      table_name: "social_history",
      action_type: "INSERT",
      new_values: socialData,
      event_type: "Add Social History",
      request_method: req.method,
      endpoint: req.originalUrl
    });

    res.status(201).json({
      status: "success",
      message: "Social history recorded successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updatePatient = async (req, res) => {
  try {
    const { patient_id } = req.body;
    const user_id = req.user?.user_id || null;

    if (!patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "Patient_id not identified",
      });
    }

    const patientExist = await pool.query(`SELECT * FROM patients WHERE patient_id = $1`, [patient_id]);
    if (patientExist.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Patient does not exist",
      });
    }

    const old_values = patientExist.rows[0];

    const {
      first_name, middle_name, last_name, country_of_birth, country_of_residence,
      national_id, date_of_birth, gender, marital_status, blood_type,
      occupation, address_line, email, primary_number, secondary_number,
      emergency_contact1_name, emergency_contact1_number, emergency_contact1_relationship,
      emergency_contact2_name, emergency_contact2_number, emergency_contact2_relationship,
      primary_insurance_provider, primary_insurance_policy_number,
      secondary_insurance_provider, secondary_insurance_policy_number,
      ethnicity, preffered_language, religion, is_active, is_deceased, date_of_death
    } = req.body;

    const result = await pool.query(
      `UPDATE patients
       SET first_name = COALESCE($1, first_name),
           middle_name = COALESCE($2, middle_name),
           last_name = COALESCE($3, last_name),
           country_of_birth = COALESCE($4, country_of_birth),
           country_of_residence = COALESCE($5, country_of_residence),
           national_id = COALESCE($6, national_id),
           date_of_birth = COALESCE($7, date_of_birth),
           gender = COALESCE($8, gender),
           marital_status = COALESCE($9, marital_status),
           blood_type = COALESCE($10, blood_type),
           occupation = COALESCE($11, occupation),
           address_line = COALESCE($12, address_line),
           email = COALESCE($13, email),
           primary_number = COALESCE($14, primary_number),
           secondary_number = COALESCE($15, secondary_number),
           emergency_contact1_name = COALESCE($16, emergency_contact1_name),
           emergency_contact1_number = COALESCE($17, emergency_contact1_number),
           emergency_contact1_relationship = COALESCE($18, emergency_contact1_relationship),
           emergency_contact2_name = COALESCE($19, emergency_contact2_name),
           emergency_contact2_number = COALESCE($20, emergency_contact2_number),
           emergency_contact2_relationship = COALESCE($21, emergency_contact2_relationship),
           primary_insurance_provider = COALESCE($22, primary_insurance_provider),
           primary_insurance_policy_number = COALESCE($23, primary_insurance_policy_number),
           secondary_insurance_provider = COALESCE($24, secondary_insurance_provider),
           secondary_insurance_policy_number = COALESCE($25, secondary_insurance_policy_number),
           ethnicity = COALESCE($26, ethnicity),
           preffered_language = COALESCE($27, preffered_language),
           religion = COALESCE($28, religion),
           is_active = COALESCE($29, is_active),
           is_deceased = COALESCE($30, is_deceased),
           date_of_death = COALESCE($31, date_of_death),
           updated_at = NOW()
       WHERE patient_id = $32
       RETURNING *`,
      [
        safe(first_name), safe(middle_name), safe(last_name), safe(country_of_birth), safe(country_of_residence),
        safe(national_id), safe(date_of_birth), safe(gender), safe(marital_status), safe(blood_type),
        safe(occupation), safe(address_line), safe(email), safe(primary_number), safe(secondary_number),
        safe(emergency_contact1_name), safe(emergency_contact1_number), safe(emergency_contact1_relationship),
        safe(emergency_contact2_name), safe(emergency_contact2_number), safe(emergency_contact2_relationship),
        safe(primary_insurance_provider), safe(primary_insurance_policy_number),
        safe(secondary_insurance_provider), safe(secondary_insurance_policy_number),
        safe(ethnicity), safe(preffered_language), safe(religion), safe(is_active), safe(is_deceased), safe(date_of_death),
        safe(patient_id),
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "failed", message: "Patient not found" });
    }

    const updatedPatient = result.rows[0];

    await logAudit({
      user_id,
      patient_id,
      table_name: "patients",
      action_type: "UPDATE",
      old_values,
      event_type: "Update Patient",
      request_method: req.method,
      endpoint: req.originalUrl,
    });

    res.status(200).json({
      status: "success",
      message: "Patient updated successfully",
      patient: updatedPatient,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
};



export const updateSocialHistory = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const {
      patient_id,
      smoking_status,
      alcohol_use,
      drug_use,
      physical_activity,
      diet_description,
      living_situation,
      support_system,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ status: "failed", message: "patient_id is required" });
    }

    const oldData = await pool.query("SELECT * FROM social_history WHERE patient_id = $1", [patient_id]);
    if (oldData.rows.length === 0)
      return res.status(404).json({ status: "failed", message: "Social history not found" });

    const updateQuery = await pool.query(
      `UPDATE social_history
       SET 
        smoking_status = COALESCE($1, smoking_status),
        alcohol_use = COALESCE($2, alcohol_use),
        drug_use = COALESCE($3, drug_use),
        physical_activity = COALESCE($4, physical_activity),
        diet_description = COALESCE($5, diet_description),
        living_situation = COALESCE($6, living_situation),
        support_system = COALESCE($7, support_system),
        updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $8 RETURNING *`,
      [smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system, patient_id]
    );

    const updated = updateQuery.rows[0];

    await logAudit(user_id, "UPDATE", "social_history", patient_id, {
      before: oldData.rows[0],
      after: updated,
    });

    res.status(200).json({
      status: "success",
      message: "Social history updated successfully",
      social_history: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateAllergy = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { allergy_id, patient_id, allergen, reaction, allergy_severity, verified } = req.body;

    if (!allergy_id || !patient_id)
      return res.status(400).json({ status: "failed", message: "allergy_id and patient_id are required" });

    const oldData = await pool.query("SELECT * FROM allergies WHERE allergy_id = $1 AND patient_id = $2", [allergy_id, patient_id]);
    if (oldData.rows.length === 0)
      return res.status(404).json({ status: "failed", message: "Allergy not found" });

    const result = await pool.query(
      `UPDATE allergies
       SET allergen = COALESCE($1, allergen),
           reaction = COALESCE($2, reaction),
           allergy_severity = COALESCE($3, allergy_severity),
           verified = COALESCE($4, verified),
           updated_at = CURRENT_TIMESTAMP
       WHERE allergy_id = $5 AND patient_id = $6 RETURNING *`,
      [allergen, reaction, allergy_severity, verified, allergy_id, patient_id]
    );

    await logAudit(user_id, "UPDATE", "allergies", allergy_id, {
      before: oldData.rows[0],
      after: result.rows[0],
    });

    res.status(200).json({
      status: "success",
      message: "Allergy updated successfully",
      allergy: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateMedication = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { medication_id, patient_id, medication_name, dosage, frequency, start_date, end_date, medication_is_active, hospital_where_prescribed, medication_notes } = req.body;

    if (!medication_id || !patient_id)
      return res.status(400).json({ status: "failed", message: "medication_id and patient_id are required" });

    const oldData = await pool.query("SELECT * FROM medications WHERE medication_id = $1 AND patient_id = $2", [medication_id, patient_id]);
    if (oldData.rows.length === 0)
      return res.status(404).json({ status: "failed", message: "Medication not found" });

    const result = await pool.query(
      `UPDATE medications
       SET medication_name = COALESCE($1, medication_name),
           dosage = COALESCE($2, dosage),
           frequency = COALESCE($3, frequency),
           start_date = COALESCE($4, start_date),
           end_date = COALESCE($5, end_date),
           medication_is_active = COALESCE($6, medication_is_active),
           hospital_where_prescribed = COALESCE($7, hospital_where_prescribed),
           medication_notes = COALESCE($8, medication_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE medication_id = $9 AND patient_id = $10
       RETURNING *`,
      [medication_name, dosage, frequency, start_date, end_date, medication_is_active, hospital_where_prescribed, medication_notes, medication_id, patient_id]
    );

    await logAudit(user_id, "UPDATE", "medications", medication_id, {
      before: oldData.rows[0],
      after: result.rows[0],
    });

    res.status(200).json({
      status: "success",
      message: "Medication updated successfully",
      medication: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateChronicCondition = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { condition_id, patient_id, icd_codes_version, icd_code, condition_name, diagnosed_date, current_status, condition_severity, management_plan, condition_notes, is_active, last_reviewed } = req.body;

    if (!condition_id || !patient_id)
      return res.status(400).json({ status: "failed", message: "condition_id and patient_id are required" });

    const oldData = await pool.query("SELECT * FROM chronic_conditions WHERE condition_id = $1 AND patient_id = $2", [condition_id, patient_id]);
    if (oldData.rows.length === 0)
      return res.status(404).json({ status: "failed", message: "Chronic condition not found" });

    const result = await pool.query(
      `UPDATE chronic_conditions
       SET icd_codes_version = COALESCE($1, icd_codes_version),
           icd_code = COALESCE($2, icd_code),
           condition_name = COALESCE($3, condition_name),
           diagnosed_date = COALESCE($4, diagnosed_date),
           current_status = COALESCE($5, current_status),
           condition_severity = COALESCE($6, condition_severity),
           management_plan = COALESCE($7, management_plan),
           condition_notes = COALESCE($8, condition_notes),
           is_active = COALESCE($9, is_active),
           last_reviewed = COALESCE($10, last_reviewed),
           updated_at = CURRENT_TIMESTAMP
       WHERE condition_id = $11 AND patient_id = $12
       RETURNING *`,
      [icd_codes_version, icd_code, condition_name, diagnosed_date, current_status, condition_severity, management_plan, condition_notes, is_active, last_reviewed, condition_id, patient_id]
    );

    await logAudit(user_id, "UPDATE", "chronic_conditions", condition_id, {
      before: oldData.rows[0],
      after: result.rows[0],
    });

    res.status(200).json({
      status: "success",
      message: "Chronic condition updated successfully",
      condition: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateFamilyHistory = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { family_history_id, patient_id, relative_name, relationship, relative_patient_id, relative_condition_name, age_of_onset, family_history_notes } = req.body;

    if (!family_history_id || !patient_id)
      return res.status(400).json({ status: "failed", message: "family_history_id and patient_id are required" });

    const oldData = await pool.query("SELECT * FROM family_history WHERE family_history_id = $1 AND patient_id = $2", [family_history_id, patient_id]);
    if (oldData.rows.length === 0)
      return res.status(404).json({ status: "failed", message: "Family history not found" });

    const result = await pool.query(
      `UPDATE family_history
       SET relative_name = COALESCE($1, relative_name),
           relationship = COALESCE($2, relationship),
           relative_patient_id = COALESCE($3, relative_patient_id),
           relative_condition_name = COALESCE($4, relative_condition_name),
           age_of_onset = COALESCE($5, age_of_onset),
           family_history_notes = COALESCE($6, family_history_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE family_history_id = $7 AND patient_id = $8
       RETURNING *`,
      [relative_name, relationship, relative_patient_id, relative_condition_name, age_of_onset, family_history_notes, family_history_id, patient_id]
    );

    await logAudit(user_id, "UPDATE", "family_history", family_history_id, {
      before: oldData.rows[0],
      after: result.rows[0],
    });

    res.status(200).json({
      status: "success",
      message: "Family history updated successfully",
      family_history: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getPatientFullProfile = async (req, res) => {
  try {
    const { patient_id } = req.params;

    if (!patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "Patient ID is required",
      });
    }

    const patientResult = await pool.query(
      `SELECT * FROM patients WHERE patient_id = $1`,
      [patient_id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Patient not found",
      });
    }

    const [
      identifiersResult,
      allergiesResult,
      medicationsResult,
      chronicConditionsResult,
      familyHistoryResult,
      socialHistoryResult,
    ] = await Promise.all([
      pool.query(
        "SELECT * FROM patient_identifiers WHERE patient_id = $1",
        [patient_id]
      ),
      pool.query("SELECT * FROM allergies WHERE patient_id = $1", [patient_id]),
      pool.query("SELECT * FROM medications WHERE patient_id = $1", [patient_id]),
      pool.query(
        "SELECT * FROM chronic_conditions WHERE patient_id = $1",
        [patient_id]
      ),
      pool.query(
        "SELECT * FROM family_history WHERE patient_id = $1",
        [patient_id]
      ),
      pool.query(
        "SELECT * FROM social_history WHERE patient_id = $1",
        [patient_id]
      ),
    ]);

    const fullProfile = {
      patient_info: patientResult.rows[0],
      identifiers: identifiersResult.rows,
      allergies: allergiesResult.rows,
      medications: medicationsResult.rows,
      chronic_conditions: chronicConditionsResult.rows,
      family_history: familyHistoryResult.rows,
      social_history: socialHistoryResult.rows,
    };

    res.status(200).json({
      status: "success",
      message: "Patient profile retrieved successfully",
      data: fullProfile,
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const deletePatient = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { patient_id } = req.params; 
    const user_id = req.user.user_id;
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;
    const branch_id = req.user.branch_id || null;

    const patient = await client.query(
      "SELECT * FROM patients WHERE patient_id = $1",
      [patient_id]
    );

    if (patient.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Patient not found",
      });
    }

    const deletedPatient = await client.query(
      `UPDATE patients 
       SET is_active = false, deleted_at = NOW()
       WHERE patient_id = $1
       RETURNING *`,
      [patient_id]
    );

    await logAudit(client, {
      user_id,
      patient_id,
      table_name: "patients",
      action_type: "UPDATE",
      old_values: patient.rows[0],
      new_values: deletedPatient.rows[0],
      ip_address,
      event_type: "Soft Delete",
      branch_id,
      hospital_id: req.user.hospital_id || null,
      request_method,
      endpoint,
    });

    await client.query("COMMIT");
    res.status(200).json({
      status: "success",
      message: "Patient record marked as inactive",
      patient: deletedPatient.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const hardDeletePatient = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { patient_id } = req.params;
    const user_id = req.user.user_id;
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;
    const branch_id = req.user.branch_id || null;

    const patient = await client.query(
      "SELECT * FROM patients WHERE patient_id = $1",
      [patient_id]
    );

    if (patient.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Patient not found",
      });
    }

    await client.query("DELETE FROM allergies WHERE patient_id = $1", [patient_id]);
    await client.query("DELETE FROM medications WHERE patient_id = $1", [patient_id]);
    await client.query("DELETE FROM chronic_conditions WHERE patient_id = $1", [patient_id]);
    await client.query("DELETE FROM family_history WHERE patient_id = $1", [patient_id]);
    await client.query("DELETE FROM social_history WHERE patient_id = $1", [patient_id]);
    await client.query("DELETE FROM patient_identifiers WHERE patient_id = $1", [patient_id]);

    const deleted = await client.query(
      "DELETE FROM patients WHERE patient_id = $1 RETURNING *",
      [patient_id]
    );

    await logAudit(client, {
      user_id,
      patient_id,
      table_name: "patients",
      action_type: "DELETE",
      old_values: patient.rows[0],
      new_values: null,
      ip_address,
      event_type: "Hard Delete",
      branch_id,
      hospital_id: req.user.hospital_id || null,
      request_method,
      endpoint,
    });

    await client.query("COMMIT");
    res.status(200).json({
      status: "success",
      message: "Patient record permanently deleted",
      deleted_patient: deleted.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};




export const getPatients = async (req, res) => {
  try {
    const {
      search,
      hospital_id,
      branch_id,
      gender,
      blood_type,
      min_age,
      max_age,
      marital_status,
      is_active,
      is_deceased,
      has_allergies,
      has_chronic_conditions,
      insurance_provider,
      page = 1,
      limit = 50,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const user_id = req.user?.user_id || null;
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Search across multiple fields
    if (search) {
      conditions.push(`(
        p.first_name ILIKE $${paramCount} OR 
        p.middle_name ILIKE $${paramCount} OR 
        p.last_name ILIKE $${paramCount} OR 
        p.email ILIKE $${paramCount} OR 
        p.national_id ILIKE $${paramCount} OR
        p.primary_number ILIKE $${paramCount} OR
        pi.patient_mrn ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filter by hospital
    if (hospital_id) {
      conditions.push(`pi.hospital_id = $${paramCount}`);
      params.push(hospital_id);
      paramCount++;
    }

    // Filter by gender
    if (gender) {
      conditions.push(`p.gender = $${paramCount}`);
      params.push(gender);
      paramCount++;
    }

    // Filter by blood type
    if (blood_type) {
      conditions.push(`p.blood_type = $${paramCount}`);
      params.push(blood_type);
      paramCount++;
    }

    // Filter by marital status
    if (marital_status) {
      conditions.push(`p.marital_status = $${paramCount}`);
      params.push(marital_status);
      paramCount++;
    }

    // Filter by active status
    if (is_active !== undefined) {
      conditions.push(`p.is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    // Filter by deceased status
    if (is_deceased !== undefined) {
      conditions.push(`p.is_deceased = $${paramCount}`);
      params.push(is_deceased === 'true');
      paramCount++;
    }

    // Age range filter
    if (min_age || max_age) {
      if (min_age) {
        conditions.push(`DATE_PART('year', AGE(p.date_of_birth)) >= $${paramCount}`);
        params.push(min_age);
        paramCount++;
      }
      if (max_age) {
        conditions.push(`DATE_PART('year', AGE(p.date_of_birth)) <= $${paramCount}`);
        params.push(max_age);
        paramCount++;
      }
    }

    // Filter by insurance provider
    if (insurance_provider) {
      conditions.push(`(
        p.primary_insurance_provider ILIKE $${paramCount} OR 
        p.secondary_insurance_provider ILIKE $${paramCount}
      )`);
      params.push(`%${insurance_provider}%`);
      paramCount++;
    }

    // Filter patients with allergies
    if (has_allergies === 'true') {
      conditions.push(`EXISTS (SELECT 1 FROM allergies WHERE patient_id = p.patient_id)`);
    }

    // Filter patients with chronic conditions
    if (has_chronic_conditions === 'true') {
      conditions.push(`EXISTS (SELECT 1 FROM chronic_conditions WHERE patient_id = p.patient_id AND is_active = true)`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort_by to prevent SQL injection
    const validSortFields = ['created_at', 'updated_at', 'first_name', 'last_name', 'date_of_birth'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.patient_id) as total
      FROM patients p
      LEFT JOIN patient_identifiers pi ON p.patient_id = pi.patient_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalPatients = parseInt(countResult.rows[0].total);

    // Get patients with pagination
    const query = `
      SELECT 
        p.patient_id,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.date_of_birth,
        DATE_PART('year', AGE(p.date_of_birth)) as age,
        p.gender,
        p.marital_status,
        p.blood_type,
        p.email,
        p.primary_number,
        p.secondary_number,
        p.country_of_residence,
        p.national_id,
        p.primary_insurance_provider,
        p.is_active,
        p.is_deceased,
        p.created_at,
        p.updated_at,
        ARRAY_AGG(DISTINCT jsonb_build_object(
          'hospital_id', pi.hospital_id,
          'patient_mrn', pi.patient_mrn
        )) FILTER (WHERE pi.identifier_id IS NOT NULL) as identifiers,
        COUNT(DISTINCT a.allergy_id) as allergy_count,
        COUNT(DISTINCT cc.condition_id) FILTER (WHERE cc.is_active = true) as chronic_condition_count
      FROM patients p
      LEFT JOIN patient_identifiers pi ON p.patient_id = pi.patient_id
      LEFT JOIN allergies a ON p.patient_id = a.patient_id
      LEFT JOIN chronic_conditions cc ON p.patient_id = cc.patient_id
      ${whereClause}
      GROUP BY p.patient_id
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Log audit
    // await logAudit({
    //   user_id,
    //   table_name: "patients",
    //   action_type: "SELECT",
    //   event_type: "List Patients",
    //   request_method: req.method,
    //   endpoint: req.originalUrl,
    //   ip_address: req.ip
    // });

    res.status(200).json({
      status: "success",
      data: {
        patients: result.rows,
        pagination: {
          total: totalPatients,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(totalPatients / limit)
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};


export const getPatientById = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const user_id = req.user?.user_id || null;

    if (!patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "Patient ID is required"
      });
    }

    // Get patient basic info
    const patientQuery = `
      SELECT 
        p.*,
        DATE_PART('year', AGE(p.date_of_birth)) as age,
        ARRAY_AGG(DISTINCT jsonb_build_object(
          'identifier_id', pi.identifier_id,
          'hospital_id', pi.hospital_id,
          'patient_mrn', pi.patient_mrn
        )) FILTER (WHERE pi.identifier_id IS NOT NULL) as identifiers
      FROM patients p
      LEFT JOIN patient_identifiers pi ON p.patient_id = pi.patient_id
      WHERE p.patient_id = $1
      GROUP BY p.patient_id
    `;
    const patientResult = await pool.query(patientQuery, [patient_id]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Patient not found"
      });
    }

    const patient = patientResult.rows[0];

    // Get allergies
    const allergiesQuery = `
      SELECT * FROM allergies 
      WHERE patient_id = $1 
      ORDER BY created_at DESC
    `;
    const allergies = await pool.query(allergiesQuery, [patient_id]);

    // Get medications
    const medicationsQuery = `
      SELECT * FROM medications 
      WHERE patient_id = $1 
      ORDER BY medication_is_active DESC, created_at DESC
    `;
    const medications = await pool.query(medicationsQuery, [patient_id]);

    // Get chronic conditions
    const conditionsQuery = `
      SELECT * FROM chronic_conditions 
      WHERE patient_id = $1 
      ORDER BY is_active DESC, created_at DESC
    `;
    const conditions = await pool.query(conditionsQuery, [patient_id]);

    // Get family history
    const familyHistoryQuery = `
      SELECT * FROM family_history 
      WHERE patient_id = $1 
      ORDER BY created_at DESC
    `;
    const familyHistory = await pool.query(familyHistoryQuery, [patient_id]);

    // Get social history
    const socialHistoryQuery = `
      SELECT * FROM social_history 
      WHERE patient_id = $1 
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const socialHistory = await pool.query(socialHistoryQuery, [patient_id]);

    // Get recent visits
    const visitsQuery = `
      SELECT 
        v.visit_id,
        v.visit_number,
        v.visit_type,
        v.visit_date,
        v.reason_for_visit,
        v.admission_status,
        v.discharge_date,
        v.priority_level
      FROM visits v
      WHERE v.patient_id = $1
      ORDER BY v.visit_date DESC
      LIMIT 10
    `;
    const visits = await pool.query(visitsQuery, [patient_id]);

    // Log audit
    // await logAudit({
    //   user_id,
    //   patient_id,
    //   table_name: "patients",
    //   action_type: "SELECT",
    //   event_type: "View Patient Details",
    //   request_method: req.method,
    //   endpoint: req.originalUrl,
    //   ip_address: req.ip
    // });

    res.status(200).json({
      status: "success",
      data: {
        patient,
        medical_history: {
          allergies: allergies.rows,
          medications: medications.rows,
          chronic_conditions: conditions.rows,
          family_history: familyHistory.rows,
          social_history: socialHistory.rows.length > 0 ? socialHistory.rows[0] : null
        },
        recent_visits: visits.rows
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error" 
    });
  }
};


export const searchPatientsInTheWeek = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const hospital_id = req.user.hospital_id;
    const branch_id = req.user.branch_id;
    
    if (!hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID not found for user"
      });
    }
    
    // Build query with optional branch filter
    let query = `
      SELECT DISTINCT ON (p.patient_id)
        p.patient_id,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.primary_number,
        p.email,
        EXTRACT(YEAR FROM AGE(p.date_of_birth)) AS age,
        COUNT(v.visit_id) OVER (PARTITION BY p.patient_id) as total_visits_last_7_days,
        MAX(v.visit_date) OVER (PARTITION BY p.patient_id) as last_visit_date,
        v.visit_id as latest_visit_id,
        v.visit_number,
        v.visit_type,
        v.priority_level,
        v.admission_status,
        v.reason_for_visit,
        h.hospital_name,
        b.branch_name
      FROM patients p
      INNER JOIN visits v ON p.patient_id = v.patient_id
      LEFT JOIN hospitals h ON v.hospital_id = h.hospital_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      WHERE v.hospital_id = $1
        AND v.visit_date >= CURRENT_DATE - INTERVAL '7 days'
        AND v.visit_date <= CURRENT_DATE
    `;
    
    const params = [hospital_id];
    
    // Add branch filter if user has a branch
    if (branch_id) {
      query += ` AND v.branch_id = $2`;
      params.push(branch_id);
    }
    
    query += `
      ORDER BY p.patient_id, v.visit_date DESC
    `;
    
    const result = await pool.query(query, params);
    
    // Sort by most recent visit
    const patients = result.rows.sort((a, b) => 
      new Date(b.last_visit_date) - new Date(a.last_visit_date)
    );
    
    // Calculate the exact 7-day period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    res.status(200).json({
      status: "success",
      scope: branch_id ? "branch" : "hospital",
      total_patients: patients.length,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
      period_description: "Last 7 days",
      patients: patients
    });
    
  } catch (error) {
    console.error("Search patients in last 7 days error:", error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error",
      error: error.message
    });
  }
};


export const getFrequentlyCheckedPatientsThirtyDays = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const hospital_id = req.user.hospital_id;
    const branch_id = req.user.branch_id;
    
    if (!hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID not found for user"
      });
    }

    const { search, priority } = req.query;

    let query = `
      SELECT 
        p.patient_id,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.primary_number,
        p.email,
        EXTRACT(YEAR FROM AGE(p.date_of_birth)) AS age,
        
        v.visit_id,
        v.visit_number,
        v.visit_type,
        v.visit_date,
        v.priority_level,
        v.admission_status,
        v.reason_for_visit,
        v.updated_at,
        
        -- Count activities on this visit
        COUNT(DISTINCT vt.vital_id) as vitals_count,
        COUNT(DISTINCT d.diagnosis_id) as diagnoses_count,
        COUNT(DISTINCT t.treatment_id) as treatments_count,
        COUNT(DISTINCT vp.prescription_id) as prescriptions_count,
        COUNT(DISTINCT lt.lab_test_id) as lab_tests_count,
        COUNT(DISTINCT ir.imaging_result_id) as imaging_count,
        
        -- Get latest update timestamps
        GREATEST(
          v.updated_at,
          MAX(vt.created_at),
          MAX(d.created_at),
          MAX(t.created_at),
          MAX(vp.created_at),
          MAX(lt.created_at),
          MAX(ir.created_at)
        ) as last_activity_date,
        
        MAX(vt.created_at) as last_vitals_recorded,
        MAX(d.created_at) as last_diagnosis_recorded,
        MAX(t.created_at) as last_treatment_recorded,
        MAX(vp.created_at) as last_prescription_recorded,
        MAX(lt.created_at) as last_lab_test_recorded,
        MAX(ir.created_at) as last_imaging_recorded,
        
        -- Check if current user has interacted
        BOOL_OR(
          vt.recorded_by = $2 OR
          v.provider_id = (SELECT provider_id FROM healthcare_providers WHERE user_id = $2) OR
          v.user_id = $2
        ) as user_interaction,
        
        -- Calculate activity score
        (
          (COUNT(DISTINCT vt.vital_id) * 3) +
          (COUNT(DISTINCT d.diagnosis_id) * 4) +
          (COUNT(DISTINCT t.treatment_id) * 4) +
          (COUNT(DISTINCT vp.prescription_id) * 3) +
          (COUNT(DISTINCT lt.lab_test_id) * 2) +
          (COUNT(DISTINCT ir.imaging_result_id) * 2)
        ) as activity_score,
        
        -- Days since admission
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v.visit_date)) as days_since_admission,
        
        -- Days since last activity
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - GREATEST(
          v.updated_at,
          MAX(vt.created_at),
          MAX(d.created_at),
          MAX(t.created_at),
          MAX(vp.created_at),
          MAX(lt.created_at),
          MAX(ir.created_at)
        ))) as days_since_last_activity,
        
        -- Total records
        (COUNT(DISTINCT vt.vital_id) + COUNT(DISTINCT d.diagnosis_id) + 
         COUNT(DISTINCT t.treatment_id) + COUNT(DISTINCT vp.prescription_id) + 
         COUNT(DISTINCT lt.lab_test_id) + COUNT(DISTINCT ir.imaging_result_id)) as total_records,
        
        h.hospital_name,
        b.branch_name
        
      FROM visits v
      INNER JOIN patients p ON v.patient_id = p.patient_id
      LEFT JOIN hospitals h ON v.hospital_id = h.hospital_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN vitals vt ON v.visit_id = vt.visit_id
      LEFT JOIN diagnoses d ON v.visit_id = d.visit_id
      LEFT JOIN treatments t ON v.visit_id = t.visit_id
      LEFT JOIN visit_prescriptions vp ON v.visit_id = vp.visit_id
      LEFT JOIN lab_tests lt ON v.visit_id = lt.visit_id
      LEFT JOIN imaging_results ir ON v.visit_id = ir.visit_id
      
      WHERE v.hospital_id = $1
        AND v.admission_status IN ('admitted')
    `;

    const params = [hospital_id, user_id];
    let paramCount = 2;

    // Add branch filter
    if (branch_id) {
      paramCount++;
      query += ` AND v.branch_id = $${paramCount}`;
      params.push(branch_id);
    }

    // Add priority filter
    if (priority && priority.trim()) {
      paramCount++;
      query += ` AND v.priority_level = $${paramCount}`;
      params.push(priority.trim().toLowerCase());
    }

    // Add search filter
    if (search && search.trim()) {
      paramCount++;
      query += ` AND (
        p.first_name ILIKE $${paramCount} OR
        p.last_name ILIKE $${paramCount} OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramCount} OR
        v.visit_number ILIKE $${paramCount}
      )`;
      params.push(`%${search.trim()}%`);
    }

    query += `
      GROUP BY 
        p.patient_id, p.first_name, p.last_name, p.date_of_birth, 
        p.gender, p.primary_number, p.email,
        v.visit_id, v.visit_number, v.visit_type, v.visit_date,
        v.priority_level, v.admission_status, v.reason_for_visit, v.updated_at,
        h.hospital_name, b.branch_name
      ORDER BY 
        CASE v.priority_level
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        user_interaction DESC,
        activity_score DESC,
        v.updated_at DESC
      LIMIT 50
    `;

    const result = await pool.query(query, params);

    res.status(200).json({
      status: "success",
      scope: branch_id ? "branch" : "hospital",
      total_visits: result.rows.length,
      search_term: search || null,
      priority_filter: priority || null,
      period_description: "Currently admitted patients",
      visits: result.rows.map(visit => ({
        visit_id: visit.visit_id,
        visit_number: visit.visit_number,
        visit_type: visit.visit_type,
        visit_date: visit.visit_date,
        admission_status: visit.admission_status,
        priority_level: visit.priority_level,
        reason_for_visit: visit.reason_for_visit,
        
        patient_id: visit.patient_id,
        patient_name: `${visit.first_name} ${visit.last_name}`,
        first_name: visit.first_name,
        last_name: visit.last_name,
        date_of_birth: visit.date_of_birth,
        gender: visit.gender,
        age: visit.age,
        primary_number: visit.primary_number,
        email: visit.email,
        
        activity_score: visit.activity_score,
        total_records: visit.total_records,
        days_since_last_activity: visit.days_since_last_activity,
        days_since_admission: visit.days_since_admission,
        user_has_interacted: visit.user_interaction,
        
        activities: {
          vitals_recorded: visit.vitals_count,
          diagnoses: visit.diagnoses_count,
          treatments: visit.treatments_count,
          prescriptions: visit.prescriptions_count,
          lab_tests: visit.lab_tests_count,
          imaging_studies: visit.imaging_count
        },
        
        last_activities: {
          last_activity: visit.last_activity_date,
          last_vitals: visit.last_vitals_recorded,
          last_diagnosis: visit.last_diagnosis_recorded,
          last_treatment: visit.last_treatment_recorded,
          last_prescription: visit.last_prescription_recorded,
          last_lab_test: visit.last_lab_test_recorded,
          last_imaging: visit.last_imaging_recorded
        },
        
        hospital_name: visit.hospital_name,
        branch_name: visit.branch_name
      }))
    });

  } catch (error) {
    console.error("Get frequently checked admitted patients error:", error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error",
      error: error.message
    });
  }
};



export const getAdmittedPatients = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user.user_id;
    const hospital_id = req.user.hospital_id;
    const branch_id = req.user.branch_id;
    const { priority, search, status, sortBy = 'priority' } = req.query;

    if (!hospital_id) {
      return res.status(400).json({
        status: "failed",
        message: "Hospital ID is required",
      });
    }

    // Base query with additional fields
    let query = `
      SELECT 
        v.visit_id,
        v.visit_number,
        v.visit_date,
        v.priority_level,
        v.admission_status,
        v.reason_for_visit,
        v.created_at AS admitted_at,
        v.updated_at AS last_updated,
        p.patient_id,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.gender,
        p.date_of_birth,
        p.primary_number,
        p.email,
        p.blood_type,
        pi.patient_mrn,
        b.branch_name,
        h.hospital_name,
        u.first_name AS provider_first_name,
        u.last_name AS provider_last_name,
        DATE_PART('year', AGE(p.date_of_birth)) AS age,
        DATE_PART('day', NOW() - v.visit_date) AS days_since_admission,
        DATE_PART('hour', NOW() - v.visit_date) AS hours_since_admission
      FROM visits v
      JOIN patients p ON v.patient_id = p.patient_id
      JOIN hospitals h ON v.hospital_id = h.hospital_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN users u ON v.user_id = u.user_id
      LEFT JOIN patient_identifiers pi ON p.patient_id = pi.patient_id AND pi.hospital_id = v.hospital_id
      WHERE v.hospital_id = $1
        AND v.admission_status = 'admitted'
    `;

    const params = [hospital_id];

    // Apply branch filtering if user has one
    if (branch_id) {
      params.push(branch_id);
      query += ` AND v.branch_id = $${params.length}`;
    }

    // Apply priority filter if provided
    if (priority && priority !== 'all') {
      params.push(priority.toLowerCase());
      query += ` AND v.priority_level = $${params.length}`;
    }

    // Apply search filter (patient name, MRN, or visit number)
    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      query += ` AND (
        LOWER(p.first_name || ' ' || p.last_name) LIKE LOWER($${params.length})
        OR LOWER(pi.patient_mrn) LIKE LOWER($${params.length})
        OR LOWER(v.visit_number) LIKE LOWER($${params.length})
      )`;
    }

    // Sorting
    const sortOptions = {
      priority: 'v.priority_level DESC, v.visit_date ASC',
      date: 'v.visit_date DESC',
      name: 'p.last_name ASC, p.first_name ASC',
      duration: 'v.visit_date ASC'
    };

    query += ` ORDER BY ${sortOptions[sortBy] || sortOptions.priority};`;

    const { rows } = await client.query(query, params);

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE priority_level = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE priority_level = 'high') as high_count,
        COUNT(*) FILTER (WHERE priority_level = 'normal') as normal_count,
        COUNT(*) FILTER (WHERE priority_level = 'low') as low_count,
        AVG(DATE_PART('day', NOW() - visit_date)) as avg_days_admitted
      FROM visits
      WHERE hospital_id = $1 
        AND admission_status = 'admitted'
        ${branch_id ? 'AND branch_id = $2' : ''}
    `;

    const statsParams = branch_id ? [hospital_id, branch_id] : [hospital_id];
    const { rows: stats } = await client.query(statsQuery, statsParams);

    res.status(200).json({
      status: "success",
      total: rows.length,
      statistics: stats[0],
      data: rows,
      user_id: user_id,
    });
  } catch (error) {
    console.error("Get admitted patients error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

export const dischargePatient = async (req, res) => {
  try {
    const { visit_id } = req.params;
    const user_id = req.user.user_id;
    const dischargeDate = new Date();

    if (!visit_id) {
      return res.status(400).json({
        status: "failed",
        message: "Visit ID is required",
      });
    } 
    const visitResult = await pool.query(
      `SELECT * FROM visits WHERE visit_id = $1`,
      [visit_id]
    );  
    if (visitResult.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "Visit not found",
      });
    }
    const dischargeResult = await pool.query(
      `UPDATE visits 
       SET admission_status = 'discharged', discharge_date = $1, updated_at = NOW()
       WHERE visit_id = $2
       RETURNING *`,
      [dischargeDate, visit_id]
    );
    res.status(200).json({
      status: "success",
      message: "Patient discharged successfully",
      visit: dischargeResult.rows[0],
    });
    
  } catch (error) {
    console.error("Discharge patient error:", error);
    res.status(500).json({ 
      status: "failed",
      message: "Server error",
      error: error.message
    });
    
  }
}


export const patientFullData = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { patient_id } = req.params;

    if (!patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "Patient ID is required"
      });
    }

  
    await client.query('BEGIN');

   
    const patientQuery = `
      SELECT * FROM patients 
      WHERE patient_id = $1
    `;
    const patientResult = await client.query(patientQuery, [patient_id]);

    if (patientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: "failed",
        message: "Patient not found"
      });
    }

    const patient = patientResult.rows[0];

  
    const allergiesQuery = `
      SELECT * FROM allergies 
      WHERE patient_id = $1
      ORDER BY created_at DESC
    `;
    const allergies = await client.query(allergiesQuery, [patient_id]);

    const medicationsQuery = `
      SELECT * FROM medications 
      WHERE patient_id = $1
      ORDER BY medication_is_active DESC, created_at DESC
    `;
    const medications = await client.query(medicationsQuery, [patient_id]);

    const chronicConditionsQuery = `
      SELECT * FROM chronic_conditions 
      WHERE patient_id = $1
      ORDER BY is_active DESC, diagnosed_date DESC
    `;
    const chronicConditions = await client.query(chronicConditionsQuery, [patient_id]);

    const familyHistoryQuery = `
      SELECT * FROM family_history 
      WHERE patient_id = $1
      ORDER BY created_at DESC
    `;
    const familyHistory = await client.query(familyHistoryQuery, [patient_id]);

    const socialHistoryQuery = `
      SELECT * FROM social_history 
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const socialHistory = await client.query(socialHistoryQuery, [patient_id]);

    const visitsQuery = `
      SELECT 
        v.*,
        h.hospital_name,
        b.branch_name,
        hp.license_number as provider_license,
        u.first_name as provider_first_name,
        u.last_name as provider_last_name,
        hp.specialization as provider_specialization
      FROM visits v
      LEFT JOIN hospitals h ON v.hospital_id = h.hospital_id
      LEFT JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN healthcare_providers hp ON v.provider_id = hp.provider_id
      LEFT JOIN users u ON hp.user_id = u.user_id
      WHERE v.patient_id = $1
      ORDER BY v.visit_date DESC
    `;
    const visits = await client.query(visitsQuery, [patient_id]);

    const visitsWithDetails = await Promise.all(
      visits.rows.map(async (visit) => {
        const visitId = visit.visit_id;

        const vitalsQuery = `
          SELECT v.*, u.first_name, u.last_name 
          FROM vitals v
          LEFT JOIN healthcare_providers hp ON v.recorded_by = hp.provider_id
          LEFT JOIN users u ON hp.user_id = u.user_id
          WHERE v.visit_id = $1
          ORDER BY v.created_at DESC
        `;
        const vitals = await client.query(vitalsQuery, [visitId]);

        const diagnosesQuery = `
          SELECT * FROM diagnoses 
          WHERE visit_id = $1
          ORDER BY diagnosis_type, created_at
        `;
        const diagnoses = await client.query(diagnosesQuery, [visitId]);

        const treatmentsQuery = `
          SELECT * FROM treatments 
          WHERE visit_id = $1
          ORDER BY start_date DESC
        `;
        const treatments = await client.query(treatmentsQuery, [visitId]);

        const prescriptionsQuery = `
          SELECT * FROM visit_prescriptions 
          WHERE visit_id = $1
          ORDER BY is_active DESC, created_at DESC
        `;
        const prescriptions = await client.query(prescriptionsQuery, [visitId]);

        const labTestsQuery = `
          SELECT * FROM lab_tests 
          WHERE visit_id = $1
          ORDER BY created_at DESC
        `;
        const labTests = await client.query(labTestsQuery, [visitId]);

        const imagingQuery = `
          SELECT * FROM imaging_results 
          WHERE visit_id = $1
          ORDER BY created_at DESC
        `;
        const imaging = await client.query(imagingQuery, [visitId]);

        return {
          ...visit,
          vitals: vitals.rows,
          diagnoses: diagnoses.rows,
          treatments: treatments.rows,
          prescriptions: prescriptions.rows,
          lab_tests: labTests.rows,
          imaging_results: imaging.rows
        };
      })
    );

    
    
    await client.query('COMMIT');

    // Construct comprehensive response
    const fullPatientData = {
      demographics: patient,
      
      allergies: allergies.rows,
      medications: medications.rows,
      chronic_conditions: chronicConditions.rows,
      family_history: familyHistory.rows,
      social_history: socialHistory.rows[0] || null,
      visits: visitsWithDetails,
      
      summary: {
        total_visits: visits.rows.length,
        active_medications: medications.rows.filter(m => m.medication_is_active).length,
        active_chronic_conditions: chronicConditions.rows.filter(c => c.is_active).length,
        known_allergies: allergies.rows.length,
        last_visit_date: visits.rows[0]?.visit_date || null
      }
    };

    res.status(200).json({
      status: "success",
      message: "Patient data retrieved successfully",
      data: fullPatientData
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Get Patient Data Error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message
    });
  } finally {
    client.release();
  }
};