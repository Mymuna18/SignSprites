import { Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import GameMenu from "./pages/GameMenu";
import Game from "./pages/Game";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/game-menu" element={<GameMenu />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  );
}
