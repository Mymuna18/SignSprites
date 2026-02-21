import { Link } from "react-router-dom";

export default function Menu() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>SignSprites Game</h1>
      <Link to="/signup">
        <button style={{ padding: "10px 20px", margin: "5px" }}>Sign Up</button>
      </Link>
      <Link to="/login">
        <button style={{ padding: "10px 20px", margin: "5px" }}>Login</button>
      </Link>
    </div>
  );
}