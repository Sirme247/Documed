import React, { useState } from "react";
import "./auth.css"; 
import documedLogo from "../../assets/documedLogo.png";
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from "zod";
import useStore from "../../store";
import {useForm} from "react-hook-form"
import { useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js"
import { setAuthToken } from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const SignInSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
});

const SignIn = () => {
  const {user} = useStore(state => state)
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: zodResolver(SignInSchema),
    mode: "onBlur"
  });

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { setCredentials } = useStore.getState();

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);
      const { data: res } = await api.post("/auth/sign-in", data);

      const { token, user, hospitals } = res;

      // Check if doctor has multiple hospitals and needs to select
      if (user.role_id === 3 && hospitals && hospitals.length > 1) {
        // Store temporary data for hospital selection
        sessionStorage.setItem("pendingAuth", JSON.stringify({ 
          token, 
          user, 
          hospitals 
        }));
        
        // Redirect to hospital selection page
        navigate("/select-hospital");
        return;
      }

      // Normal login flow (single hospital or non-doctor)
      setAuthToken(token);
      useStore.getState().setCredentials({ token, ...user });
      localStorage.setItem("user", JSON.stringify({ token, ...user }));

      navigate("/"); 
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
            <h1>Welcome to DocuMed</h1>
            <p>Sign in to access your dashboard</p>
          </div>

          <div className="text-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="doctor@hospital.com"
              {...register("email")}
            />
            {errors.email && (
              <div className="error-message">{errors.email.message}</div>
            )}
          </div>

          <div className="text-field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              {...register("username")}
            />
            {errors.username && (
              <div className="error-message">{errors.username.message}</div>
            )}
          </div>

          <div className="text-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password && (
              <div className="error-message">{errors.password.message}</div>
            )}
          </div>

          <button 
            className="my-form__button" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </main>

      <aside className="info-side">
        <div className="blockquote-wrapper">
          <blockquote>
            "DocuMed has transformed how we manage patient records and streamlined 
            our hospital operations significantly."
          </blockquote>
          <div className="author">
            <span className="author-name">- Agha Khan Chief of Surgery</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SignIn;