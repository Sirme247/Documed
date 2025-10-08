import {pool} from '../libs/database.js';
import { logAudit } from "../libs/auditLogger.js";

const safe = (val) => (val !== undefined ? val : null);


export const registerPatient = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

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

    const user_id = req.user.user_id; // from JWT middleware
    const ip_address = req.ip;
    const endpoint = req.originalUrl;
    const request_method = req.method;
    const branch_id = req.user.branch_id || null;

    if (!first_name || !last_name || !country_of_residence || !date_of_birth || !gender ||
        !email || !primary_number || !patient_mrn) {
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
        first_name, middle_name, last_name, country_of_birth,
        country_of_residence, national_id, date_of_birth, gender,
        marital_status, blood_type, occupation, address_line,
        email, primary_number, secondary_number, emergency_contact1_name,
        emergency_contact1_number, emergency_contact1_relationship, emergency_contact2_name,
        emergency_contact2_number, emergency_contact2_relationship, primary_insurance_provider,
        primary_insurance_policy_number, secondary_insurance_provider,
        secondary_insurance_policy_number, ethnicity, preffered_language, religion
      ]
    );

    const patient_id = newPatient.rows[0].patient_id;

    const identifier = await client.query(
      `INSERT INTO patient_identifiers (patient_id, hospital_id, patient_mrn)
       VALUES ($1,$2,$3) RETURNING *`,
      [patient_id, hospital_id, patient_mrn]
    );

    await logAudit(client, {
      user_id,
      patient_id,
      table_name: "patients",
      action_type: "INSERT",
      old_values: null,
      new_values: newPatient.rows[0],
      ip_address,
      event_type: "Create",
      branch_id,
      hospital_id,
      request_method,
      endpoint
    });
    if (allergen) {
      const allergy = await client.query(
        `INSERT INTO allergies (patient_id, allergen, reaction, allergy_severity, verified)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [patient_id, allergen, reaction, allergy_severity || 'Not Specified', verified || false]
      );

      await logAudit(client, {
        user_id,
        patient_id,
        table_name: "allergies",
        action_type: "INSERT",
        new_values: allergy.rows[0],
        ip_address,
        event_type: "Create",
        branch_id,
        hospital_id,
        request_method,
        endpoint
      });
    }
    if (medication_name) {
      const med = await client.query(
        `INSERT INTO medications (
            patient_id, medication_name, dosage, frequency, start_date, end_date,
            medication_is_active, hospital_where_prescribed, medication_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          patient_id, medication_name, dosage ?? null, frequency ?? null,
          start_date ?? null, end_date ?? null, medication_is_active || true,
          hospital_where_prescribed ?? null, medication_notes ?? null
        ]
      );

      await logAudit(client, {
        user_id,
        patient_id,
        table_name: "medications",
        action_type: "INSERT",
        new_values: med.rows[0],
        ip_address,
        event_type: "Create",
        branch_id,
        hospital_id,
        request_method,
        endpoint
      });
    }
    if (condition_name) {
      const condition = await client.query(
        `INSERT INTO chronic_conditions (
            patient_id, icd_codes_version, icd_code, condition_name, diagnosed_date,
            current_status, condition_severity, management_plan, condition_notes, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          patient_id, icd_codes_version ?? null, icd_code ?? null, condition_name ?? null,
          diagnosed_date ?? null, current_status ?? null, condition_severity || 'Not Specified',
          management_plan ?? null, condition_notes ?? null, is_active || true
        ]
      );

      await logAudit(client, {
        user_id,
        patient_id,
        table_name: "chronic_conditions",
        action_type: "INSERT",
        new_values: condition.rows[0],
        ip_address,
        event_type: "Create",
        branch_id,
        hospital_id,
        request_method,
        endpoint
      });
    }

    if (relative_condition_name) {
      const fam = await client.query(
        `INSERT INTO family_history (
            patient_id, relative_name, relationship, relative_patient_id, 
            relative_condition_name, age_of_onset, family_history_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [patient_id, relative_name, relationship ?? null, relative_patient_id ?? null,
         relative_condition_name ?? null, age_of_onset ?? null, family_history_notes ?? null]
      );

      await logAudit(client, {
        user_id,
        patient_id,
        table_name: "family_history",
        action_type: "INSERT",
        new_values: fam.rows[0],
        ip_address,
        event_type: "Create",
        branch_id,
        hospital_id,
        request_method,
        endpoint
      });
    }

    if (smoking_status || alcohol_use || drug_use || physical_activity || diet_description || living_situation) {
      const social = await client.query(
        `INSERT INTO social_history (
            patient_id, smoking_status, alcohol_use, drug_use, physical_activity,
            diet_description, living_situation, support_system)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          patient_id, smoking_status ?? null, alcohol_use ?? null, drug_use ?? null,
          physical_activity ?? null, diet_description ?? null, living_situation ?? null, support_system ?? null
        ]
      );

      await logAudit(client, {
        user_id,
        patient_id,
        table_name: "social_history",
        action_type: "INSERT",
        new_values: social.rows[0],
        ip_address,
        event_type: "Create",
        branch_id,
        hospital_id,
        request_method,
        endpoint
      });
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
        dosage ?? null,
        frequency ?? null,
        start_date ?? null,
        end_date ?? null,
        medication_is_active ?? true,
        hospital_where_prescribed ?? null,
        medication_notes ?? null
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
        icd_codes_version ?? null,
        icd_code ?? null,
        condition_name,
        diagnosed_date ?? null,
        current_status,
        condition_severity ?? "Not Specified",
        management_plan ?? null,
        condition_notes ?? null,
        is_active ?? true
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
        relationship ?? null,
        relative_patient_id ?? null,
        relative_condition_name,
        age_of_onset ?? null,
        family_history_notes ?? null
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
        smoking_status ?? null,
        alcohol_use ?? null,
        drug_use ?? null,
        physical_activity ?? null,
        diet_description ?? null,
        living_situation ?? null,
        support_system ?? null
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
      new_values: updatedPatient,
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
