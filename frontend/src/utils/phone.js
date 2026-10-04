/** Strip to digits only, max 10 */
export const stripPhone = (val) => val.replace(/\D/g, "").slice(0, 10);

/** Format 10 digits as "+91 XXXXX XXXXX" for display */
export const formatPhone = (val) => {
  if (!val) return "";
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  const d = digits.slice(0, 10);
  if (d.length <= 5) return `+91 ${d}`;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
};

/** Returns error string or "" if valid (10 digits or empty when optional) */
export const phoneError = (val, required = false) => {
  const digits = val.replace(/\D/g, "");
  if (!digits) return required ? "Phone number is required" : "";
  if (digits.length !== 10) return "Phone must be exactly 10 digits";
  return "";
};
