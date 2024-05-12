import { Route, Routes, Navigate } from "react-router-dom";
import Home from "../pages/home.tsx";
import Transaction from "../pages/transaction.tsx";
import Send from "../pages/send.tsx";

function RouterLink() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Home />} />
                <Route path="/transaction" element={<Transaction />} />
                <Route path="/send" element={<Send />} />


            </Routes>
        </>
    );
}

export default RouterLink;
