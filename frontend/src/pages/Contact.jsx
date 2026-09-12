import { useState } from "react";
import { submitInquiry, WHATSAPP_NUMBER, PHONE_NUMBER } from "../api";
import toast from "react-hot-toast";
import { Phone, MessageCircle, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await submitInquiry(form);
      toast.success("Your inquiry has been sent! We'll contact you shortly.");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("Failed to send inquiry. Please try WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "3rem 0 5rem" }}>
      <div className="container">
        <div style={styles.header}>
          <h1 className="section-title">Get in Touch</h1>
          <div className="section-divider" />
          <p style={styles.subtitle}>We'd love to hear from you. Reach out for inquiries, custom orders, or just to say hello.</p>
        </div>

        <div style={styles.grid}>
          {/* Contact Info */}
          <div style={styles.infoBox}>
            <h2 style={styles.infoTitle}>Contact Information</h2>
            <div style={styles.infoItems}>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}><Phone size={20} /></div>
                <div>
                  <p style={styles.infoLabel}>Phone</p>
                  <a href={`tel:${PHONE_NUMBER}`} style={styles.infoValue}>{PHONE_NUMBER}</a>
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}><MessageCircle size={20} /></div>
                <div>
                  <p style={styles.infoLabel}>WhatsApp</p>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={styles.infoValue}>Chat with us</a>
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}><MapPin size={20} /></div>
                <div>
                  <p style={styles.infoLabel}>Store Address</p>
                  <p style={styles.infoValue}>Your Store Address, City, State</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}><Clock size={20} /></div>
                <div>
                  <p style={styles.infoLabel}>Hours</p>
                  <p style={styles.infoValue}>Mon–Sat: 10am – 8pm</p>
                  <p style={styles.infoValue}>Sunday: 11am – 6pm</p>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%27d%20like%20to%20know%20more%20about%20your%20saree%20collection.`}
              target="_blank"
              rel="noreferrer"
              style={styles.waBtn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.523 5.854L.057 23.893c-.072.303.197.571.499.499l6.086-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.724.899.916-3.635-.234-.373A9.818 9.818 0 1112 21.818z"/>
              </svg>
              Message us on WhatsApp
            </a>
          </div>

          {/* Inquiry Form */}
          <div style={styles.formBox}>
            <h2 style={styles.formTitle}>Send an Inquiry</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
              </div>
              <div style={styles.field}>
                <label>Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Your WhatsApp / mobile number" required />
              </div>
              <div style={styles.field}>
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com (optional)" />
              </div>
              <div style={styles.field}>
                <label>Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us what you're looking for..." rows={5} required />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Sending..." : "Send Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { textAlign: "center", marginBottom: "3rem" },
  subtitle: { color: "#6B5744", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "3rem", alignItems: "start" },
  infoBox: { background: "linear-gradient(135deg, #8B1A1A, #2C1810)", borderRadius: 12, padding: "2.5rem", color: "#fff" },
  infoTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "#C9A84C", marginBottom: "2rem" },
  infoItems: { display: "flex", flexDirection: "column", gap: "1.75rem", marginBottom: "2.5rem" },
  infoItem: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  infoIcon: { background: "rgba(201,168,76,0.2)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C", flexShrink: 0 },
  infoLabel: { fontSize: "0.75rem", color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" },
  infoValue: { color: "#E8D5C4", fontSize: "0.95rem", textDecoration: "none" },
  waBtn: { display: "flex", alignItems: "center", gap: "0.75rem", background: "#25D366", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" },
  formBox: { background: "#fff", borderRadius: 12, padding: "2.5rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "#8B1A1A", marginBottom: "2rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.4rem" },
};
