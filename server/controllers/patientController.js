import {pool} from '../libs/database.js';

const safe = (val) => (val !== undefined ? val : null);

export const registerPatient = async (req,res) =>{

    const client = await pool.connect();
    try{

        await client.query('BEGIN');
        const {
            //patient table fields
            first_name,middle_name,last_name,country_of_birth,
        country_of_residence,national_id,date_of_birth,gender,
        marital_status,blood_type,occupation,address_line,
        email,primary_number,secondary_number,emergency_contact1_name,
        emergency_contact1_number,emergency_contact1_relationship,emergency_contact2_name,
        emergency_contact2_number,emergency_contact2_relationship,primary_insurance_provider,
        primary_insurance_policy_number,secondary_insurance_provider,
        secondary_insurance_policy_number,ethnicity,preffered_language,religion,
        
            //patient_identifiers table fields
        hospital_id,patient_mrn,
        // allergies
        allergen, reaction, allergy_severity, verified,
        // medications
        medication_name, dosage, frequency, start_date, end_date, medication_is_active,
        hospital_where_prescribed, medication_notes,

        //chronic conditions
        icd_codes_version, icd_code, condition_name,diagnosed_date, current_status,condition_severity,
        management_plan, condition_notes, is_active,
        // family history
        relationship,relative_name ,relative_patient_id, relative_condition_name, age_of_onset,family_history_notes,
        // social history
        smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system, 




    
    
    
    } = req.body;

        if(!first_name || !last_name || !country_of_residence || !date_of_birth || !gender ||
           !email || !primary_number || !patient_mrn
        ){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
       }
         
        // let patientExist;
        // if(national_id){
        //     patientExist = await pool.query('SELECT * FROM patients WHERE email= $1 OR national_id = $2' , [email,national_id]);
        // } else if(!national_id && email){
        //     patientExist = await pool.query('SELECT * FROM patients WHERE email= $1' , [email]);
        // }else if(!email && national_id){
        //     patientExist = await pool.query('SELECT * FROM patients WHERE national_id = $1' , [national_id]);
        // }else if(!email && !national_id){
        //     patientExist = await pool.query('');
        // }
        const patientExist = await client.query(
            `SELECT * FROM patients WHERE
            (email = $1 AND email IS NOT NULL) OR
            (national_id = $2 AND national_id IS NOT NULL) OR
            (first_name = $3 AND last_name = $4 AND date_of_birth = $5 AND gender = $6)` , 
            [email, national_id, first_name, last_name, date_of_birth, gender]
        );
        
        
                      
        if(patientExist.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Patient with given email or national ID already exists"
                }
            )
        }
        const newPatient = await client.query( `INSERT INTO patients 
            (first_name,middle_name,last_name,country_of_birth,
            country_of_residence,national_id,date_of_birth,gender,
            marital_status,blood_type,occupation,address_line,
            email,primary_number,secondary_number,emergency_contact1_name,
            emergency_contact1_number,emergency_contact1_relationship,emergency_contact2_name,
            emergency_contact2_number,emergency_contact2_relationship,primary_insurance_provider,
            primary_insurance_policy_number,secondary_insurance_provider,
            secondary_insurance_policy_number,ethnicity,preffered_language,religion)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
            $20,$21,$22,$23,$24,$25,$26,$27,$28) 
            RETURNING patient_id`,
            [
            first_name,middle_name,last_name,country_of_birth,
            country_of_residence,national_id,date_of_birth,gender,
            marital_status,blood_type,occupation,address_line,
            email,primary_number,secondary_number,emergency_contact1_name,
            emergency_contact1_number,emergency_contact1_relationship,emergency_contact2_name,
            emergency_contact2_number,emergency_contact2_relationship,primary_insurance_provider,
            primary_insurance_policy_number,secondary_insurance_provider,
            secondary_insurance_policy_number,ethnicity,preffered_language,religion
            ])

        const patient_id = newPatient.rows[0].patient_id;

        const newPatientIdentifier = await client.query( `INSERT INTO patient_identifiers
            (patient_id, hospital_id, patient_mrn)
            VALUES ($1,$2,$3) RETURNING *`,
            [
                patient_id, hospital_id, patient_mrn
            ]
        )

        const identifier_id = newPatientIdentifier.rows[0];

        if(allergen){
             const newAllergy = await client.query( `INSERT INTO allergies
            (patient_id, allergen, reaction, allergy_severity, verified)
            VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [
                patient_id, allergen, reaction, allergy_severity||'Not Specified', verified||false
            ]
        )
        }

        if(medication_name){
             const newMedication = await client.query( `INSERT INTO medications
            (patient_id, medication_name, dosage, frequency, start_date, end_date,medication_is_active, 
                hospital_where_prescribed, medication_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [
                patient_id, medication_name, dosage??null, frequency??null, start_date??null, end_date ?? null, medication_is_active||true,
                hospital_where_prescribed??null, medication_notes??null
            ]
        )
        }
        
        if(condition_name){
            const newChronicCondition = await client.query( `INSERT INTO chronic_conditions
            (patient_id, icd_codes_version, icd_code, condition_name,diagnosed_date, current_status,condition_severity,
                management_plan, condition_notes, is_active)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [
                patient_id, icd_codes_version??null, icd_code??null, condition_name??null,diagnosed_date??null, current_status??null,condition_severity||'Not Specified',
                management_plan??null, condition_notes??null, is_active||true
            ]
        )
        }

        if(relative_condition_name){
            const newFamilyHistory = await client.query( `INSERT INTO family_history
            (patient_id,relative_name, relationship, relative_patient_id, relative_condition_name, age_of_onset,family_history_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,    
            [
                patient_id,relative_name, relationship??null, relative_patient_id??null, relative_condition_name??null, age_of_onset??null,family_history_notes??null
            ]
        )
        }

        if(smoking_status||alcohol_use||drug_use||physical_activity||diet_description||living_situation){
            const newSocialHistory = await client.query( `INSERT INTO social_history
            (patient_id, smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [
                patient_id, smoking_status??null, alcohol_use??null, drug_use??null, physical_activity??null, diet_description??null, living_situation??null, support_system??null
            ]
        )

        }

        await client.query('COMMIT');
        res.status(201).json(
                {
                    status: "success",
                    message: "Patient registered successfully",
                    patient: newPatient.rows[0]
                }
           
            )
        

            
    } catch(error){
        await client.query('ROLLBACK');
        console.log(error);
        res.status(500).json({message: "Server error"});
    } finally{
        client.release();
    }
}



export const addAllergies = async (req,res)=>{
    try {
        
        const {patient_id,allergen,reaction,allergy_severity,verified} = req.body;

        if(!allergen|| !reaction){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }

        const allergyExists = await pool.query('SELECT * FROM allergies WHERE allergen = $1 AND patient_id=$2',[allergen,patient_id]);

        if(allergyExists.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "The allergy is already recorded",
                    duplicates: allergyExists.rows 
                }
            )
        }

        const addNewAllergy = await pool.query( `INSERT INTO allergies
            (patient_id, allergen, reaction, allergy_severity, verified)
            VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [
                patient_id, allergen, reaction, allergy_severity??'Not Specified', verified??false
            ]

        )
        const allergyData = addNewAllergy.rows[0]

        res.status(201).json(
            {
                status: "success",
                message: "Allergy recorded successfully",
                allergyData
            }
        )

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}



export const addMedication = async (req,res)=>{
    try{
        const {patient_id,medication_name,dosage,frequency,start_date,end_date,medication_is_active,hospital_where_prescribed,medication_notes} = req.body;

        if(!medication_name){
             return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                    
                }
            )
        }

        const medicationAlreadyPrescribed = await pool.query('SELECT * FROM medications WHERE medication_name = $1 AND start_date = $2 AND hospital_where_prescribed = $3 AND patient_id = $4',[medication_name,start_date,hospital_where_prescribed,patient_id])
        if(medicationAlreadyPrescribed.rows.length>0){
        //     return res.status(400).json({
        //     status: "failed",
        //     message: "Medication already recorded",
        //     duplicates: medicationAlreadyPrescribed.rows
        // });
        }
        const addNewMedication = await pool.query( `INSERT INTO medications
            (patient_id, medication_name, dosage, frequency, start_date, end_date,medication_is_active, 
                hospital_where_prescribed, medication_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [
                patient_id, medication_name, dosage??null, frequency??null, start_date??null, end_date ?? null, medication_is_active||true,
                hospital_where_prescribed??null, medication_notes??null
            ]
        )
        res.status(201).json(
            {
                status: "success",
                message: "Medication recorded successfully",
            }
        )
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const addChronicConditions = async (req,res)=>{
    try{
        const {patient_id,icd_codes_version, icd_code, condition_name,diagnosed_date, current_status,condition_severity,
        management_plan, condition_notes, is_active,last_reviewed} = req.body;

        if(!condition_name||!current_status){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }


        const conditionExists = await pool.query('SELECT * FROM chronic_conditions WHERE condition_name = $1 AND patient_id = $2',[condition_name,patient_id])
        if(conditionExists.rows.length>0){
             return res.status(400).json(
                {
                    status: "failed",
                    message: "The chronic condition is already recorded",
                    duplicates: conditionExists.rows 
                }
            )
        }

        const addNewChronicCondition = await pool.query( `INSERT INTO chronic_conditions
            (patient_id, icd_codes_version, icd_code, condition_name,diagnosed_date, current_status,condition_severity,
                management_plan, condition_notes, is_active)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [
                patient_id, icd_codes_version??null, icd_code??null, condition_name??null,diagnosed_date??null, current_status??null,condition_severity||'Not Specified',
                management_plan??null, condition_notes??null, is_active||true
            ]
        )
        res.status(201).json(
            {
                status:"success",
                message:"Condition Recorded successfully"
            }
        )

    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const addFamilyHistory = async (req,res)=>{
    try{
        const {patient_id,relative_name,relationship,relative_patient_id,relative_condition_name,age_of_onset,family_history_notes} = req.body;

        if(!relative_condition_name){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }

        const FamilyHistoryExists = await pool.query('SELECT * FROM family_history WHERE relative_name = $1 AND relative_condition_name = $2 AND relationship = $3 and patient_id = $4',[relative_name,relative_condition_name,relationship,patient_id]);

        if (FamilyHistoryExists.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "The family medical history is already recorded",
                    duplicates: FamilyHistoryExists.rows 
                }
            )
        }
        const addNewFamilyHistory = await pool.query( `INSERT INTO family_history
            (patient_id,relative_name, relationship, relative_patient_id, relative_condition_name, age_of_onset,family_history_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,    
            [
                patient_id,relative_name, relationship??null, relative_patient_id??null, relative_condition_name??null, age_of_onset??null,family_history_notes??null
            ]
        )
         res.status(201).json({
            status: "success",
            message: "Family history recorded successfully"
        });

        

    }catch(error){
         console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const addSocialHistory = async (req,res)=>{
    try{

        const {patient_id, smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system} = req.body;

        if(!smoking_status && !alcohol_use && !drug_use && !physical_activity && !living_situation && !support_system){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        } 

        const addNewSocialHistory = await pool.query( `INSERT INTO social_history
            (patient_id, smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [
                patient_id, smoking_status??null, alcohol_use??null, drug_use??null, physical_activity??null, diet_description??null, living_situation??null, support_system??null
            ]
        )
         res.status(201).json({
            status: "success",
            message: "Social history recorded successfully"
        });



    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
}

export const updatePatient = async (req, res) => {


    try{
    const { patient_id } = req.body;



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


  if(!patient_id){
    return res.status(400).json(
      {
          status: "failed",
          message: "Patient_id not identified"
      }
    )
  }

        const patientExist = await pool.query(
            `SELECT * FROM patients WHERE patient_id = $1`,
            [patient_id]
        );              
        if (patientExist.rows.length === 0) {
            return res.status(400).json({
            status: "failed",
            message: "Patient does not exist"
        });
        }




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
        safe(patient_id)
        

      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "failed", message: "Patient not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Patient updated successfully",
      patient: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
};

export const updateSocialHistory = async (req, res) => {
  try {
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
      return res.status(400).json({
        status: "failed",
        message: "patient_id is required",
      });
    }

    const updateQuery = await pool.query(`
      UPDATE social_history
      SET 
        smoking_status = COALESCE($1, smoking_status),
        alcohol_use = COALESCE($2, alcohol_use),
        drug_use = COALESCE($3, drug_use),
        physical_activity = COALESCE($4, physical_activity),
        diet_description = COALESCE($5, diet_description),
        living_situation = COALESCE($6, living_situation),
        support_system = COALESCE($7, support_system),
        updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = $8
      RETURNING *;
    `, [
      safe(smoking_status),
      safe(alcohol_use),
      safe(drug_use),
      safe(physical_activity),
      safe(diet_description),
      safe(living_situation) ,
      safe(support_system),
      patient_id,
    ]);

    const result = updateQuery.rows[0];
    if (updateQuery.rows.length === 0) {
       return res.status(404).json({ status: "failed", message: "Social history not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Social history updated successfully",
      social_history: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAllergy = async (req, res) => {
  try {
    const { allergy_id, patient_id, allergen, reaction, allergy_severity, verified } = req.body;

    if (!allergy_id || !patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "allergy_id and patient_id are required",
      });
    }

    

    const result = await pool.query(
      `UPDATE allergies
       SET allergen = COALESCE($1, allergen),
           reaction = COALESCE($2, reaction),
           allergy_severity = COALESCE($3, allergy_severity),
           verified = COALESCE($4, verified),
           updated_at = CURRENT_TIMESTAMP
       WHERE allergy_id = $5 AND patient_id = $6
       RETURNING *`,
      [safe(allergen), 
        safe(reaction), 
        safe(allergy_severity), 
        safe(verified), 
        allergy_id, patient_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "failed", message: "Allergy not found" });
    }

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
    const { medication_id, patient_id, medication_name, dosage, frequency, start_date, end_date, medication_is_active, hospital_where_prescribed, medication_notes } = req.body;

    if (!medication_id || !patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "medication_id and patient_id are required",
      });
    }

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
      [safe(medication_name), 
        safe(dosage), safe(frequency), safe(start_date), safe(end_date), 
        safe(medication_is_active), 
        safe(hospital_where_prescribed), 
        safe(medication_notes),
        medication_id, patient_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "failed", message: "Medication not found" });
    }

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
    const { condition_id, patient_id, icd_codes_version, icd_code, condition_name, diagnosed_date, current_status, condition_severity, management_plan, condition_notes, is_active, last_reviewed } = req.body;

    if (!condition_id || !patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "condition_id and patient_id are required",
      });
    }

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
      [safe(icd_codes_version), 
        safe(icd_code), 
        safe(condition_name),
        safe(diagnosed_date),
        safe(current_status), 
        safe(condition_severity), 
        safe(management_plan),
        safe(condition_notes), 
        safe(is_active), 
        safe(last_reviewed), 
        condition_id, patient_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "failed", message: "Chronic condition not found" });
    }

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
    const { family_history_id, patient_id, relative_name, relationship, relative_patient_id, relative_condition_name, age_of_onset, family_history_notes } = req.body;

    if (!family_history_id || !patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "family_history_id and patient_id are required",
      });
    }

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
      [relative_name ?? null, relationship ?? null, relative_patient_id ?? null, relative_condition_name ?? null, age_of_onset ?? null, family_history_notes ?? null, family_history_id, patient_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "failed", message: "Family history not found" });
    }

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

    // 🧩 Fetch main patient details
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

    // 🧩 Fetch related records from other tables
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

    // 🧩 Merge all results
    const fullProfile = {
      patient_info: patientResult.rows[0],
      identifiers: identifiersResult.rows,
      allergies: allergiesResult.rows,
      medications: medicationsResult.rows,
      chronic_conditions: chronicConditionsResult.rows,
      family_history: familyHistoryResult.rows,
      social_history: socialHistoryResult.rows,
    };

    // ✅ Respond
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
