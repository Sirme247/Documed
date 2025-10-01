import {pool} from '../libs/database.js';


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
            !marital_status || !email || !primary_number
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
        const patientExist = await pool.query(
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
        const newPatient = await pool.query( `INSERT INTO patients 
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

        const newPatientIdentifier = await pool.query( `INSERT INTO patient_identifiers
            (patient_id, hospital_id, patient_mrn)
            VALUES ($1,$2,$3) RETURNING identifier_id`,
            [
                patient_id, hospital_id, patient_mrn
            ]
        )

        const identifier_id = newPatientIdentifier.rows[0].identifier_id;

        if(allergen){
             const newAllergy = await pool.query( `INSERT INTO allergies
            (patient_id, allergen, reaction, allergy_severity, verified)
            VALUES ($1,$2,$3,$4,$5)`,
            [
                patient_id, allergen, reaction, allergy_severity||'Not Specified', verified||false
            ]
        )
        }

        if(medication_name){
             const newMedication = await pool.query( `INSERT INTO medications
            (patient_id, medication_name, dosage, frequency, start_date, end_date,medication_is_active, 
                hospital_where_prescribed, medication_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
                patient_id, medication_name, dosage??null, frequency??null, start_date??null, end_date ?? null, medication_is_active||true,
                hospital_where_prescribed??null, medication_notes??null
            ]
        )
        }
        
        if(condition_name){
            const newChronicCondition = await pool.query( `INSERT INTO chronic_conditions
            (patient_id, icd_codes_version, icd_code, condition_name,diagnosed_date, current_status,condition_severity,
                management_plan, condition_notes, is_active)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
                patient_id, icd_codes_version??null, icd_code??null, condition_name??null,diagnosed_date??null, current_status??null,condition_severity||'Not Specified',
                management_plan??null, condition_notes??null, is_active||true
            ]
        )
        }

        if(relative_condition_name){
            const newFamilyHistory = await pool.query( `INSERT INTO family_history
            (patient_id,relative_name, relationship, relative_patient_id, relative_condition_name, age_of_onset,family_history_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7)`,    
            [
                patient_id,relative_name, relationship??null, relative_patient_id??null, relative_condition_name??null, age_of_onset??null,family_history_notes??null
            ]
        )
        }

        if(smoking_status||alcohol_use||drug_use||physical_activity||diet_description||living_situation){
            const newSocialHistory = await pool.query( `INSERT INTO social_history
            (patient_id, smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
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
            VALUES ($1,$2,$3,$4,$5)`,
            [
                patient_id, allergen, reaction, allergy_severity??'Not Specified', verified??false
            ]
        )

        res.status(201).json(
            {
                status: "success",
                message: "Allergy recorded successfully",
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

        }
        const addNewMedication = await pool.query( `INSERT INTO medications
            (patient_id, medication_name, dosage, frequency, start_date, end_date,medication_is_active, 
                hospital_where_prescribed, medication_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
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
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
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
            VALUES ($1,$2,$3,$4,$5,$6,$7)`,    
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

        const {patient_id,occupation, smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system} = req.body;

        if(!smoking_status && !alcohol_use && !drug_use && !physical_activity && !diet_description && !occupation && !living_situation && !support_system){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        } 

        const addNewSocialHistory = await pool.query( `INSERT INTO social_history
            (patient_id, smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
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