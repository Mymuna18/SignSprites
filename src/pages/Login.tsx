import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/game-menu");
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#EBD8C3", // Solid cream color from the menu background
        padding: "20px",
      }}
    >
      <div
        className="ghibli-card"
        style={{
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          backgroundColor: "#7D5A44", // Darker brown from the central sign box
          padding: "40px",
          borderRadius: "8px",
          border: "4px solid #5C4033", // Deepest brown border
          boxShadow: "0 10px 0px rgba(92, 64, 51, 0.2)", // Flat pixel-style shadow
        }}
      >
        <h2
          className="ghibli-title"
          style={{
            fontSize: "2.5rem",
            marginBottom: "8px",
            color: "#F4E7D3", // Off-white text from the "SIGN SPRITES" title
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Login
        </h2>
        <p
          className="ghibli-subtitle"
          style={{
            marginBottom: "32px",
            fontSize: "1rem",
            color: "#EBD8C3", // Lighter cream subtitle
            opacity: 0.9,
          }}
        >
          ... INTRODUCING ...
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "12px",
              backgroundColor: "#EBD8C3",
              border: "3px solid #5C4033",
              color: "#5C4033",
              fontWeight: "bold",
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "12px",
              backgroundColor: "#EBD8C3",
              border: "3px solid #5C4033",
              color: "#5C4033",
              fontWeight: "bold",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#F4E7D3", // Light cream button
              color: "#5C4033", // Brown text
              border: "3px solid #5C4033",
              fontSize: "1.2rem",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : "ENTER"}
          </button>
        </form>

        {error && (
          <p
            style={{ color: "#FF9E9E", marginTop: "10px", fontSize: "0.8rem" }}
          >
            {error}
          </p>
        )}

        <p
          style={{
            marginTop: "24px",
            fontSize: "0.9rem",
            color: "#F4E7D3",
          }}
        >
          NEW ADVENTURER?{" "}
          <Link
            to="/signup"
            style={{
              color: "#FFD700", // Gold star color for emphasis
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            SIGN UP
          </Link>
        </p>
      </div>
    </div>
  );
}
