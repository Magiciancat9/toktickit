import { useEffect, useState } from "react";
import { fetchCategories, Category } from "../api.js";

type ListState = "loading" | "success" | "error";

export function CategoryList() {
  const [state, setState] = useState<ListState>("loading");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    return (
      <p className="text-muted" data-testid="categories-loading">
        Loading categories...
      </p>
    );
  }

  if (state === "error") {
    return (
      <div
        className="alert alert-danger py-2"
        data-testid="categories-error"
      >
        {error}
      </div>
    );
  }

  return (
    <div data-testid="categories-list">
      <h2 className="h6 fw-semibold mb-2">Supported Request Categories</h2>
      <ol>
        {categories.map((cat) => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ol>
    </div>
  );
}

export default CategoryList;
