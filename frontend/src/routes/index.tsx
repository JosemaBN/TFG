import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import HomePage from "../pages/HomePage";
import ProductListPage from "../pages/products/ProductListPage";
import ProductNewPage from "../pages/products/ProductNewPage";
import ProductDetailPage from "../pages/products/ProductDetailPage";
import EventListPage from "../pages/events/EventListPage";
import EventNewPage from "../pages/events/EventNewPage";
import EventDetailPage from "../pages/events/EventDetailPage";
import MovementFormPage from "../pages/movements/MovementFormPage";
import PlanillaPage from "../pages/planilla/PlanillaPage";
export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: "materials", element: <ProductListPage /> },
            { path: "materials/nuevo", element: <ProductNewPage /> },
            { path: "materials/:id", element: <ProductDetailPage /> },
            { path: "events", element: <EventListPage /> },
            { path: "events/nuevo", element: <EventNewPage /> },
            { path: "event/:id", element: <EventDetailPage /> },
            { path: "movimientos/nuevo", element: <MovementFormPage /> },
            { path: "plantilla", element: <PlanillaPage /> },
        ],
    },
]);
