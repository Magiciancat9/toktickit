import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchCategories } from "../api.js";
export function CategoryList() {
    const [state, setState] = useState("loading");
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchCategories()
            .then((data) => {
            setCategories(data);
            setState("success");
        })
            .catch(() => {
            setError("Unable to load categories. Please try again later.");
            setState("error");
        });
    }, []);
    if (state === "loading") {
        return (_jsx("p", { className: "text-muted", "data-testid": "categories-loading", children: "Loading categories..." }));
    }
    if (state === "error") {
        return (_jsx("div", { className: "alert alert-danger py-2", "data-testid": "categories-error", children: error }));
    }
    return (_jsxs("div", { "data-testid": "categories-list", children: [_jsx("h2", { className: "h6 fw-semibold mb-2", children: "Supported Request Categories" }), _jsx("ol", { children: categories.map((cat) => (_jsx("li", { children: cat.name }, cat.id))) })] }));
}
export default CategoryList;
