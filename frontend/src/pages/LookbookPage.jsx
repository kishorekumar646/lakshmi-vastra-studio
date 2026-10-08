import { useEffect } from "react";
import Lookbook from "../components/luxury/Lookbook";

export default function LookbookPage() {
  useEffect(() => {
    document.title = "Lookbook — Lakshmi Vastra Studio";
  }, []);

  return <Lookbook />;
}
