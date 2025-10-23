import React, { useState } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const ImagingResultSchema = z.object({
  visit_id: z.string().min(1, "Visit ID is required"),
  image_url: z.string().url("Must be a valid URL").min(1, "Image URL is required"),
  findings: z.string().optional(),
  reccomendations: z.string().optional(),
});

const RecordImagingResult = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ImagingResultSchema),
    mode: "onBlur"
  });

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const formattedData = {
        ...data,
        visit_id: parseInt(data.visit_id),
      };

      const { data: res } = await api.post("/visits/record-imaging-results", formattedData);

      toast.success(res.message || "Imaging result recorded successfully!");
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
      <h2>Record Imaging Result</h2>

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
          <h3>Imaging Details</h3>

          <div className="form-group">
            <label>Image URL *</label>
            <input type="url" {...register("image_url")} placeholder="https://..." />
            {errors.image_url && (
              <div className="error-message">{errors.image_url.message}</div>
            )}
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              Link to the imaging file (X-ray, CT, MRI, etc.)
            </small>
          </div>

          <div className="form-group">
            <label>Findings</label>
            <textarea {...register("findings")} rows="5" placeholder="Radiologist's findings and interpretation" />
          </div>

          <div className="form-group">
            <label>Recommendations</label>
            <textarea {...register("reccomendations")} rows="3" placeholder="Follow-up recommendations" />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Recording..." : "Record Imaging Result"}
        </button>
      </form>
    </div>
  );
};

export default RecordImagingResult;