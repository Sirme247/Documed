import { pool } from '../libs/database.js';
import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const PatientAISummary = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({
        status: "failed",
        message: "Patient ID is required"
      });
    }

    await client.query('BEGIN');

    // Fetch patient data
    const patientQuery = `SELECT * FROM patients WHERE patient_id = $1`;
    const patientResult = await client.query(patientQuery, [patient_id]);

    if (patientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: "failed",
        message: "Patient not found"
      });
    }

    const patient = patientResult.rows[0];

  
    const allergiesQuery = `SELECT * FROM allergies WHERE patient_id = $1 ORDER BY allergy_severity DESC, created_at DESC`;
    const allergies = await client.query(allergiesQuery, [patient_id]);

    const chronicQuery = `SELECT * FROM chronic_conditions WHERE patient_id = $1 ORDER BY is_active DESC, diagnosed_date DESC`;
    const chronicConditions = await client.query(chronicQuery, [patient_id]);

    const medicationsQuery = `SELECT * FROM medications WHERE patient_id = $1 ORDER BY medication_is_active DESC, created_at DESC`;
    const medications = await client.query(medicationsQuery, [patient_id]);

    const familyQuery = `SELECT * FROM family_history WHERE patient_id = $1`;
    const familyHistory = await client.query(familyQuery, [patient_id]);

    // Fetch ALL visits from the past year 
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const visitsQuery = `
      SELECT 
        v.*,
        json_agg(DISTINCT jsonb_build_object(
          'diagnosis_name', d.diagnosis_name,
          'icd_code', d.icd_code,
          'diagnosis_type', d.diagnosis_type,
          'severity', d.severity,
          'is_chronic', d.is_chronic,
          'description', d.diagnosis_description
        )) FILTER (WHERE d.diagnosis_id IS NOT NULL) as diagnoses,
        
        json_agg(DISTINCT jsonb_build_object(
          'treatment_name', t.treatment_name,
          'treatment_type', t.treatment_type,
          'description', t.treatment_description,
          'outcome', t.outcome,
          'complications', t.complications,
          'follow_up_required', t.follow_up_required,
          'notes', t.treatment_notes
        )) FILTER (WHERE t.treatment_id IS NOT NULL) as treatments,
        
        json_agg(DISTINCT jsonb_build_object(
          'medication_name', vp.medication_name,
          'dosage', vp.dosage,
          'frequency', vp.frequency,
          'instructions', vp.instructions,
          'is_active', vp.is_active
        )) FILTER (WHERE vp.prescription_id IS NOT NULL) as prescriptions,
        
        json_agg(DISTINCT jsonb_build_object(
          'test_name', lt.test_name,
          'findings', lt.findings,
          'recommendations', lt.recommendations,
          'priority', lt.priority
        )) FILTER (WHERE lt.lab_test_id IS NOT NULL) as lab_tests,
        
        json_agg(DISTINCT jsonb_build_object(
          'findings', ir.findings,
          'recommendations', ir.recommendations
        )) FILTER (WHERE ir.imaging_result_id IS NOT NULL) as imaging_results,
        
        json_agg(DISTINCT jsonb_build_object(
          'blood_pressure', vt.blood_pressure,
          'heart_rate', vt.heart_rate,
          'temperature', vt.temperature,
          'oxygen_saturation', vt.oxygen_saturation,
          'weight', vt.weight,
          'bmi', vt.bmi
        )) FILTER (WHERE vt.vital_id IS NOT NULL) as vitals
        
      FROM visits v
      LEFT JOIN diagnoses d ON v.visit_id = d.visit_id
      LEFT JOIN treatments t ON v.visit_id = t.visit_id
      LEFT JOIN visit_prescriptions vp ON v.visit_id = vp.visit_id
      LEFT JOIN lab_tests lt ON v.visit_id = lt.visit_id
      LEFT JOIN imaging_results ir ON v.visit_id = ir.visit_id
      LEFT JOIN vitals vt ON v.visit_id = vt.visit_id
      WHERE v.patient_id = $1 
        AND v.visit_date >= $2
      GROUP BY v.visit_id
      ORDER BY v.visit_date DESC
    `;
    
    const visits = await client.query(visitsQuery, [patient_id, oneYearAgo]);

    await client.query('COMMIT');

    // Calculate age
    const calculateAge = (dob) => {
      if (!dob) return "N/A";
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const age = calculateAge(patient.date_of_birth);

    // Build critical alerts 
    const criticalAlerts = allergies.rows
      .filter(a => a.allergy_severity === 'Severe' || a.allergy_severity === 'Moderate')
      .map(a => ({
        severity: a.allergy_severity.toLowerCase(),
        text: `${a.allergy_severity} ${a.allergen} allergy (${a.reaction})`
      }));

    // Prepare structured data for AI prompt
    const patientContext = {
      demographics: {
        name: `${patient.first_name} ${patient.last_name}`,
        age: age,
        gender: patient.gender,
        occupation: patient.occupation,
        dateOfBirth: patient.date_of_birth
      },
      allergies: allergies.rows.map(a => ({
        allergen: a.allergen,
        reaction: a.reaction,
        severity: a.allergy_severity
      })),
      chronicConditions: chronicConditions.rows.map(c => ({
        name: c.condition_name,
        icdCode: c.icd_code,
        diagnosedDate: c.diagnosed_date,
        status: c.current_status,
        severity: c.condition_severity,
        managementPlan: c.management_plan,
        notes: c.condition_notes,
        isActive: c.is_active
      })),
      medications: medications.rows.map(m => ({
        name: m.medication_name,
        dosage: m.dosage,
        frequency: m.frequency,
        startDate: m.start_date,
        endDate: m.end_date,
        isActive: m.medication_is_active,
        notes: m.medication_notes
      })),
      familyHistory: familyHistory.rows.map(fh => ({
        relativeName: fh.relative_name,
        relationship: fh.relationship,
        condition: fh.relative_condition_name,
        ageOfOnset: fh.age_of_onset,
        notes: fh.family_history_notes
      })),
      visitsLastYear: visits.rows.map(v => ({
        visitDate: v.visit_date,
        visitType: v.visit_type,
        visitNumber: v.visit_number,
        reasonForVisit: v.reason_for_visit,
        priorityLevel: v.priority_level,
        referringProvider: v.referring_provider_name,
        referringHospital: v.referring_provider_hospital,
        admissionStatus: v.admission_status,
        dischargeDate: v.discharge_date,
        diagnoses: v.diagnoses,
        treatments: v.treatments,
        prescriptions: v.prescriptions,
        labTests: v.lab_tests,
        imagingResults: v.imaging_results,
        vitals: v.vitals,
        notes: v.notes
      }))
    };

    // Create AI prompt for year-long summary
    const prompt = `You are a medical AI assistant creating a comprehensive clinical summary for healthcare providers. This summary will help a doctor quickly understand a patient's medical journey over the past year before their current visit.

PATIENT DATA:
${JSON.stringify(patientContext, null, 2)}

Generate a JSON response with the following structure:
{
  "overview": "A comprehensive 3-4 sentence paragraph about the patient's demographics, primary chronic conditions, current health status, and overall management approach. Include occupation if relevant.",
  
  "clinicalHistory": "A detailed narrative paragraph (4-6 sentences) summarizing the patient's visits over the past year. Focus on: significant diagnoses, progression or resolution of conditions, any hospitalizations, emergency visits, recurring symptoms, treatment responses, and important trends. Identify patterns (e.g., frequent visits for same issue, gradual improvement/decline, new diagnoses). ONLY include visits that are clinically significant - routine check-ups with no findings can be briefly mentioned in aggregate. If there are multiple visits, show the progression chronologically.",
  
  "significantFindings": "A paragraph (3-5 sentences) highlighting key clinical findings from the past year that are relevant for current care: abnormal lab results (trends over time), imaging findings that require monitoring, vital sign concerns, complications from treatments, or any red flags. If nothing significant, return null.",
  
  "currentPlan": "A paragraph (4-5 sentences) describing current medications with dosages and purposes, active treatment plans, any ongoing therapies, and pending follow-up care from previous visits. Include medication compliance issues if noted. Mention if follow-ups were missed or recommendations not completed.",
  
  "riskFactors": "A paragraph (3-4 sentences) discussing family history, lifestyle/occupational risk factors, how chronic conditions are being managed (controlled vs active), and any concerning trends from the past year's visits that increase risk."
}

CRITICAL INSTRUCTIONS FOR CLINICAL HISTORY:
1. **Prioritize significance over completeness** - Don't list every visit, focus on what matters clinically
2. **Show progression** - "Initial presentation in March with X, followed by Y in June, now showing Z"
3. **Identify patterns** - "Three visits for chest pain over 6 months" or "Progressive improvement following treatment change"
4. **Highlight concerns** - Missed appointments, non-compliance, worsening conditions, new symptoms
5. **Be concise but complete** - One page maximum for entire summary
6. **Skip routine visits** - "Several routine follow-ups with stable vitals" is enough for non-significant visits
7. **Focus on actionable information** - What does the current doctor need to know RIGHT NOW?

IMPORTANT GUIDELINES:
1. Write in a professional, clinical tone suitable for healthcare providers
2. Use natural, flowing paragraphs - NOT bullet points or lists  
3. Include specific dates, dosages, and medical codes where relevant for significant events
4. Connect related information across visits (e.g., "Hypertension diagnosed in March, improved by June with medication adherence")
5. Each paragraph should read naturally and be clinically useful
6. If no visits in past year or no significant findings, return null for that field
7. Use proper medical terminology but keep it clear and concise
8. Always include the patient's first name when starting paragraphs
9. Return ONLY valid JSON, no additional text or explanation
10. Keep the ENTIRE summary to one page length - be concise but thorough

Generate the clinical summary now:`;

    // Call the AI
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant creating comprehensive clinical summaries for healthcare providers. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 4096
    });

    const aiText = result.choices[0].message.content;
    
    let aiSummaryContent;
    try {
      aiSummaryContent = JSON.parse(aiText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiText);
      throw new Error("AI generated invalid JSON response");
    }

    // Construct the final AI summary response
    const aiSummary = {
      patient: {
        name: `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}`,
        age: age,
        gender: patient.gender || 'Not specified',
        id: patient.national_id || 'N/A'
      },
      criticalAlerts: criticalAlerts,
      overview: aiSummaryContent.overview,
      clinicalHistory: aiSummaryContent.clinicalHistory,
      significantFindings: aiSummaryContent.significantFindings,
      currentPlan: aiSummaryContent.currentPlan,
      riskFactors: aiSummaryContent.riskFactors,
      metadata: {
        total_allergies: allergies.rows.length,
        active_medications: medications.rows.filter(m => m.medication_is_active).length,
        chronic_conditions: chronicConditions.rows.filter(c => c.is_active).length,
        visits_last_year: visits.rows.length,
        summary_period: '12 months',
        generated_at: new Date().toISOString(),
        ai_model: "llama-3.3-70b-versatile"
      }
    };

    res.status(200).json({
      status: "success",
      message: "AI Summary generated successfully",
      data: aiSummary
    });
    console.log(`Tokens used: ${result.usage.total_tokens}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("AI Summary Error:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error while generating AI summary",
      error: error.message
    });
  } finally {
    client.release();
  }
};