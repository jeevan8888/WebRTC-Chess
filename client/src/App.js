import "./App.css";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import { Toaster } from "react-hot-toast";
import NoMatch from "./pages/NoMatch";

function App() {
  return (
    <div className="App">
      <div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              theme: {
                primary: "#4aed88",
              },
            },
          }}
        ></Toaster>
      </div>
      <Routes>
        <Route path="/" exact element={<HomePage />}></Route>
        <Route path="/game/:gameId" element={<GamePage />}></Route>
        <Route path="*" element={<NoMatch />}></Route>
      </Routes>
    </div>
  );
}

export default App;

