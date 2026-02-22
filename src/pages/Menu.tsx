import { Link } from "react-router-dom";

import backgroundImg from "../assets/StartingMenu.png";
import loginBtnImg from "../assets/loginButton.png";
import loginBtnHoverImg from "../assets/loginButtonHover.png";
import signupBtnImg from "../assets/signupButton.png";
import signupBtnHoverImg from "../assets/signupButtonHover.png";

export default function Menu() {
  return (
    <div
      className="page-container"
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Buttons container scaled up to fill the designated area */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          right: "15%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
          width: "420px", // Increased width for larger presence
        }}
      >
        {/* SIGNUP BUTTON */}
        <Link to="/signup" style={{ width: "100%", textDecoration: "none" }}>
          <button
            style={{
              background: `url(${signupBtnImg}) no-repeat center center`,
              backgroundSize: "contain",
              width: "100%",
              height: "110px", // Increased height significantly
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `url(${signupBtnHoverImg}) no-repeat center center`;
              e.currentTarget.style.backgroundSize = "contain";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `url(${signupBtnImg}) no-repeat center center`;
              e.currentTarget.style.backgroundSize = "contain";
            }}
          />
        </Link>

        {/* LOGIN BUTTON */}
        <Link to="/login" style={{ width: "100%", textDecoration: "none" }}>
          <button
            style={{
              background: `url(${loginBtnImg}) no-repeat center center`,
              backgroundSize: "contain",
              width: "100%",
              height: "110px", // Increased height significantly
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `url(${loginBtnHoverImg}) no-repeat center center`;
              e.currentTarget.style.backgroundSize = "contain";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `url(${loginBtnImg}) no-repeat center center`;
              e.currentTarget.style.backgroundSize = "contain";
            }}
          />
        </Link>
      </div>
    </div>
  );
}
