import React, { useState } from "react";
import "./auth.css"; 
import documedLogo from "../../assets/documedLogo.png";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import useStore from "../../store";

const PasswordChangeSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, "Password must include at least one letter and one number"),
  confirm_password: z.string().min(1, "Please confirm your password")
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

const PasswordChange = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useStore(state => state);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(PasswordChangeSchema),
    mode: "onBlur"
  });

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);
      const { data: res } = await api.put("/users/change-password", data);

      toast.success("Password changed successfully! Please sign in again.");
      
     
      setTimeout(() => {
        useStore.getState().signOut();
        navigate("/signin");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      <main className="form-side">
        <a href="#" title="Logo" className="logoImage">
          <img
            src={documedLogo}
            alt="Documed Logo"
            className="logo"
          />
        </a>

        <form className="my-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-welcome-row">
            <h1>Change Your Password</h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              Please enter your current password and choose a new one
            </p>
          </div>

          <div className="text-field">
            <label htmlFor="current_password">Current Password</label>
            <input
              id="current_password"
              type="password"
              placeholder="Enter current password"
              {...register("current_password")}
            />
            {errors.current_password && (
              <div className="error-message">{errors.current_password.message}</div>
            )}
          </div>

          <div className="text-field">
            <label htmlFor="new_password">New Password</label>
            <input
              id="new_password"
              type="password"
              placeholder="Enter new password"
              {...register("new_password")}
            />
            {errors.new_password && (
              <div className="error-message">{errors.new_password.message}</div>
            )}
          </div>

          <div className="text-field">
            <label htmlFor="confirm_password">Confirm New Password</label>
            <input
              id="confirm_password"
              type="password"
              placeholder="Confirm new password"
              {...register("confirm_password")}
            />
            {errors.confirm_password && (
              <div className="error-message">{errors.confirm_password.message}</div>
            )}
          </div>

          <button className="my-form__button" type="submit" disabled={loading}>
            {loading ? "Changing Password..." : "Change Password"}
          </button>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel and go back
            </button>
          </div>
        </form>
      </main>

      <aside className="info-side">
        <div className="blockquote-wrapper">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#000000ff', marginBottom: '16px' }}>Security First</h2>
            <p style={{ color: '#000000ff', lineHeight: '1.6' }}>
              Keep your account secure by using a strong password with a combination of letters, numbers, and special characters.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PasswordChange;