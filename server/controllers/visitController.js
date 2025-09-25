import {pool} from '../libs/database.js';

export const registerVisit = async (req, res)=>{
    try{
        const {visit_number,visit_type,patient_id,provider_id,hospital_id,priority_level,referring_provider_name,referring_provider_hospital,reason_for_visit,admission_status,discharge_date,notes} = req.body;
        if(!visit_number || !visit_type || !patient_id || !provider_id || !hospital_id){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Please fill all required fields"
                }
            )
        }

        const visitExist = await pool.query('SELECT * FROM patient_visits WHERE visit_number= $1 AND patient_id = $2' , [visit_number,patient_id]);

        if( visitExist.rows.length>0){
            return res.status(400).json(
                {
                    status: "failed",
                    message: "Visit with given visit number already exists"
                }
            )
        }
        const newVisit = await pool.query( `INSERT INTO visits 
            (visit_number,visit_type,patient_id,provider_id,hospital_id,priority_level,referring_provider_name,referring_provider_hospital,reason_for_visit,admission_status,discharge_date,notes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) 
            RETURNING visit_id`,
            [
                visit_number,visit_type,patient_id,provider_id,hospital_id,priority_level,referring_provider_name??null,referring_provider_hospital??null,reason_for_visit,admission_status??null,discharge_date?? null,notes??null
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
        const newTreatment = await pool.query( `INSERT INTO treatments
            (visit_id,treatment_name,treatment_type,procedure_code,treatment_description,start_date,end_date,outcome,complications,follow_up_required,treatment_notes)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
                visit_id,treatment_name,treatment_type||NULL,procedure_code||NULL,treatment_description||NULL,start_date||NULL,end_date||NULL,outcome||'Ongoing',complications||NULL,follow_up_required||false,treatment_notes||NULL
            ]
        )
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
        const newPrescription = await pool.query( `INSERT INTO visit_prescriptions
            (visit_id, medication_name, dosage, frequency, start_date, end_date, refills_allowed,instructions, is_active)    
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
                visit_id, medication_name, dosage??null, frequency??NULL, start_date??NULL, end_date??NULL, refills_allowed??0,instructions??NULL, is_active??true
            ]   
        )
        res.status(201).json(
            {

                status: "success",
                message: "Prescription during visit recorded successfully",
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
                message: "Lab test ordered successfully",
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

