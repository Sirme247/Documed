import React, { useState, useEffect } from "react";
import "./auth.css";
import documedLogo from "../../assets/documedLogo.png";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const PasswordResetSchema = z.object({
  new_password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, "Password must include at least one letter and one number"),
  confirm_password: z.string().min(1, "Please confirm your password")
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

const UserPasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(PasswordResetSchema),
    mode: "onBlur"
  });

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error("Invalid or missing reset token");
        setValidatingToken(false);
        return;
      }

      try {
        await api.get(`/auth/validate-reset-token?token=${token}`);
        setTokenValid(true);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Invalid or expired reset link");
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const { data: res } = await api.post("/auth/reset-password", {
        token: token,
        new_password: data.new_password
      });

      toast.success(res.message || "Password reset successfully!");
      
      setTimeout(() => {
        navigate("/sign-in");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="form-wrapper">
        <main className="form-side">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Validating reset link...</h2>
          </div>
        </main>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="form-wrapper">
        <main className="form-side">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Invalid or Expired Link</h2>
            <p>This password reset link is invalid or has expired.</p>
            <button 
              onClick={() => navigate("/sign-in")}
              style={{ marginTop: '20px', padding: '10px 20px' }}
            >
              Go to Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <main className="form-side">
        <a href="#" title="Logo" className="logoImage">
          <img src={documedLogo} alt="Documed Logo" className="logo" />
        </a>

        <form className="my-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-welcome-row">
            <h1>Reset Your Password</h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              Please enter your new password
            </p>
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
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </main>

      <aside className="info-side">
        <div className="blockquote-wrapper">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Secure Reset</h2>
            <p style={{ color: '#ddd', lineHeight: '1.6' }}>
              Choose a strong password with a combination of letters and numbers. 
              This link will expire after use.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default UserPasswordReset;