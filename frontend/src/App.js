import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimpleTest from "./components/SimpleTest";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SimpleTest />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;