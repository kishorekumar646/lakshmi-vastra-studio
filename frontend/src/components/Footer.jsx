import { Link } from "react-router-dom";
import { Phone, MapPin } from "lucide-react";
import { PHONE_NUMBER, WHATSAPP_NUMBER } from "../api";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.grid}>
        <div>
          <h3 style={styles.brand}>Lakshmi Vastra Studio</h3>
          <p style={styles.tagline}>Celebrating the beauty of Indian ethnic wear with tradition and elegance.</p>
        </div>

        <div>
          <h4 style={styles.heading}>Quick Links</h4>
          <ul style={styles.list}>
            <li><Link to="/" style={styles.link}>Home</Link></li>
            <li><Link to="/catalog" style={styles.link}>Collection</Link></li>
            <li><Link to="/contact" style={styles.link}>Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={styles.heading}>Contact</h4>
          <ul style={styles.list}>
            <li style={styles.contactItem}><Phone size={14} /><a href={`tel:${PHONE_NUMBER}`} style={styles.link}>{PHONE_NUMBER}</a></li>
            <li style={styles.contactItem}><MapPin size={14} /><span>Your City, India</span></li>
          </ul>
          <div style={styles.social}>
            <a href="#" style={styles.socialIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" style={styles.socialIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={styles.socialIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.523 5.854L.057 23.893c-.072.303.197.571.499.499l6.086-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.724.899.916-3.635-.234-.373A9.818 9.818 0 1112 21.818z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div style={styles.bottom}>
        <p>© {new Date().getFullYear()} Lakshmi Vastra Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}

const styles = {
  footer: { background: "#2C1810", color: "#E8D5C4", marginTop: "auto" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", padding: "3rem 1.5rem 2rem" },
  brand: { fontFamily: "'Playfair Display', serif", color: "#C9A84C", fontSize: "1.2rem", marginBottom: "0.75rem" },
  tagline: { fontSize: "0.875rem", lineHeight: 1.6, color: "#B0927E" },
  heading: { color: "#C9A84C", marginBottom: "1rem", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  list: { listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" },
  link: { color: "#E8D5C4", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" },
  contactItem: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" },
  social: { display: "flex", gap: "1rem", marginTop: "1rem" },
  socialIcon: { color: "#C9A84C", transition: "color 0.2s" },
  bottom: { borderTop: "1px solid #4A2C1C", textAlign: "center", padding: "1rem 1.5rem", fontSize: "0.85rem", color: "#B0927E" },
};
