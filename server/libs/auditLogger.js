import {pool} from '../libs/database.js';

export async function logAudit({
  user_id,
  patient_id = null,
  table_name,
  action_type,
  old_values = null,
  new_values = null,
  ip_address = null,
  event_type,
  branch_id = null,
  hospital_id = null,
  request_method = null,
  endpoint = null
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, patient_id, table_name, action_type, old_values, new_values,
        ip_address, event_type, branch_id, hospital_id, request_method, endpoint
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        user_id,
        patient_id,
        table_name,
        action_type,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address,
        event_type,
        branch_id,
        hospital_id,
        request_method,
        endpoint
      ]
    );
  } catch (err) {
    console.error("Audit Log Error:", err.message);
  }
}
