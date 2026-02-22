import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
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
        backgroundColor: "#EBD8C3", // Cream background matching the menu
        padding: "20px",
      }}
    >
      <div
        className="ghibli-card"
        style={{
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          backgroundColor: "#7D5A44", // Brown central box color
          padding: "40px",
          borderRadius: "8px",
          border: "4px solid #5C4033", // Deep brown border
          boxShadow: "0 10px 0px rgba(92, 64, 51, 0.2)",
        }}
      >
        <h2
          className="ghibli-title"
          style={{
            fontSize: "2.2rem",
            marginBottom: "8px",
            color: "#F4E7D3", // Off-white text
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          SIGN UP
        </h2>
        <p
          className="ghibli-subtitle"
          style={{
            marginBottom: "32px",
            fontSize: "0.95rem",
            color: "#EBD8C3",
            opacity: 0.9,
          }}
        >
          ... BEGIN YOUR JOURNEY ...
        </p>

        <form
          onSubmit={handleSignup}
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
          <input
            type="password"
            placeholder="CONFIRM PASSWORD"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              backgroundColor: "#F4E7D3",
              color: "#5C4033",
              border: "3px solid #5C4033",
              fontSize: "1.2rem",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : "CREATE"}
          </button>
        </form>

        {error && (
          <p
            style={{ color: "#FF9E9E", marginTop: "10px", fontSize: "0.85rem" }}
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
          ALREADY JOINED?{" "}
          <Link
            to="/login"
            style={{
              color: "#FFD700", // Gold star color
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            LOGIN
          </Link>
        </p>
      </div>
    </div>
  );
}
