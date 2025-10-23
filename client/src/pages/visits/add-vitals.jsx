import React, { useState } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const VitalsSchema = z.object({
  visit_id: z.string().min(1, "Visit ID is required"),
  blood_pressure: z.string().min(1, "Blood pressure is required"),
  heart_rate: z.string().min(1, "Heart rate is required"),
  respiratory_rate: z.string().optional(),
  temperature: z.string().min(1, "Temperature is required"),
  oxygen_saturation: z.string().optional(),
  weight: z.string().optional(),
  weight_unit: z.string().optional(),
  height: z.string().optional(),
  height_unit: z.string().optional(),
  bmi: z.string().optional(),
});

const RecordVitals = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(VitalsSchema),
    mode: "onBlur",
    defaultValues: {
      weight_unit: "kg",
      height_unit: "cm"
    }
  });

  const weight = watch("weight");
  const height = watch("height");

  // Auto-calculate BMI
  React.useEffect(() => {
    if (weight && height) {
      const weightKg = parseFloat(weight);
      const heightCm = parseFloat(height);
      if (weightKg > 0 && heightCm > 0) {
        const heightM = heightCm / 100;
        const bmi = (weightKg / (heightM * heightM)).toFixed(2);
        document.getElementById("bmi").value = bmi;
      }
    }
  }, [weight, height]);

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const formattedData = {
        ...data,
        visit_id: parseInt(data.visit_id),
      };

      const { data: res } = await api.post("/visits/record-vitals", formattedData);

      toast.success(res.message || "Vitals recorded successfully!");
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-record-form">
      <h2>Record Patient Vitals</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-section">
          <h3>Visit Information</h3>
          
          <div className="form-group">
            <label>Visit ID *</label>
            <input type="number" {...register("visit_id")} />
            {errors.visit_id && (
              <div className="error-message">{errors.visit_id.message}</div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Vital Signs</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Blood Pressure * (mmHg)</label>
              <input {...register("blood_pressure")} placeholder="120/80" />
              {errors.blood_pressure && (
                <div className="error-message">{errors.blood_pressure.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Heart Rate * (bpm)</label>
              <input type="number" {...register("heart_rate")} placeholder="72" />
              {errors.heart_rate && (
                <div className="error-message">{errors.heart_rate.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Respiratory Rate (breaths/min)</label>
              <input type="number" {...register("respiratory_rate")} placeholder="16" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Temperature * (°C)</label>
              <input type="number" step="0.1" {...register("temperature")} placeholder="37.0" />
              {errors.temperature && (
                <div className="error-message">{errors.temperature.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Oxygen Saturation (%)</label>
              <input type="number" {...register("oxygen_saturation")} placeholder="98" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Body Measurements</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Weight</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" step="0.1" {...register("weight")} placeholder="70" style={{ flex: 1 }} />
                <select {...register("weight_unit")} style={{ width: '80px' }}>
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Height</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" step="0.1" {...register("height")} placeholder="175" style={{ flex: 1 }} />
                <select {...register("height_unit")} style={{ width: '80px' }}>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>BMI (Auto-calculated)</label>
              <input id="bmi" {...register("bmi")} readOnly placeholder="Calculated automatically" style={{ background: '#f3f4f6' }} />
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Recording..." : "Record Vitals"}
        </button>
      </form>
    </div>
  );
};

export default RecordVitals;