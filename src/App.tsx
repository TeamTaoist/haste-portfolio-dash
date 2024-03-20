import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import "./App.css";
import Dashboard from "./dashboard/page";
import Transaction from "./transaction/page";
import Layout from "./layout/layout";
import { Transfer } from "./transfer/page";
import { Toaster } from "./components/ui/toaster";

const App = () => {
  const routes = useRoutes([
    { path: "/", element: <Dashboard /> },
    { path: "/tx", element: <Transaction /> },
    { path: "/transfer", element: <Transfer /> },
    // ...
  ]);
  return routes;
};

const AppWrapper = () => {
  return (
    <Router>
      <Layout>
        <App />
      </Layout>
      <Toaster></Toaster>
    </Router>
  );
};

export default AppWrapper;
