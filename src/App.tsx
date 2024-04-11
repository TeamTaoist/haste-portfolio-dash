import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import "./App.css";
import Dashboard from "./dashboard/page";
import Transaction from "./transaction/page";
import Dispatch from "./dispatch/page";
import Layout from "./layout/layout";
import { Transfer } from "./transfer/page";
import { Toaster } from "./components/ui/toaster";

const App = () => {
  const routes = useRoutes([
    { path: "/", element: <Dashboard /> },
    { path: "/tx", element: <Transaction /> },
    { path: "/transfer", element: <Transfer /> },
    { path: "/dispatch", element: <Dispatch /> },
    // ...
  ]);
  return routes;
};

const AppWrapper = () => {
  return (
    <div className="h-[100%] flex flex-col">
      <Router>
        <Layout>
          <App />
        </Layout>
        <Toaster></Toaster>
      </Router>
    </div>
  );
};

export default AppWrapper;
