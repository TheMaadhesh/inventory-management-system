import SectionTitle from "../components/home/section-title";
import { motion } from "framer-motion";
import { useState } from "react";
import axios from "axios";
import {
  MailIcon,
  MapPinIcon,
  SendIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";
import { useTheme } from "../context/HomeThemeContext";

const contactInfo = [
  {
    icon: MailIcon,
    label: "Email Us",
    value: "support@iim-system.io",
    href: "mailto:support@iim-system.io",
    color: "text-blue-400",
    bg: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: MapPinIcon,
    label: "Headquarters",
    value: "No. 12, Anna Salai, Chennai, Tamil Nadu 600002",
    href: "https://maps.google.com/?q=Anna+Salai+Chennai+Tamil+Nadu",
    color: "text-rose-400",
    bg: "from-rose-500/20 to-rose-600/5",
  },
];

export default function ContactSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
    to: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const MAX_MSG = 250;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "message" && value.length > MAX_MSG) return;
    setForm({ ...form, [name]: value });
  };

  // API CALL HERE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("http://localhost:8080/mail/send/mail", form);

      setSubmitted(true);

      setForm({
        name: "",
        email: "",
        company: "",
        message: "",
        to: "",
      });

    } catch (error) {
      console.error("Mail send error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition border";

  const inputStyle = {
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    borderColor: "var(--border)",
  };

  return (
    <section id="contact" className="mt-28 sm:mt-32 scroll-mt-20 pb-20 sm:pb-28">
      <SectionTitle
        title="Get in Touch"
        description="Have a question or need help with the IIM system? Our team is ready to assist you."
      />

      <div className="mt-12 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Whether you're ready to start a trial, want a personalised walkthrough, or simply have a question — we'd love to hear from you.
          </p>

          <div className="flex flex-col gap-3">
            {contactInfo.map((info, i) => (
              <motion.a
                key={i}
                href={info.href}
                target={info.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border hover:-translate-y-0.5 transition-transform duration-200"
                style={{
                  borderColor: "var(--border)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className={`p-2.5 rounded-lg border ${info.color}`}>
                  <info.icon className="size-5" />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider"
                     style={{ color: "var(--text-muted)" }}>
                    {info.label}
                  </p>

                  <p className="text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>
                    {info.value}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>

        </div>

        {/* RIGHT SIDE FORM */}
        <motion.div
          className="lg:col-span-3 p-6 sm:p-8 rounded-2xl border"
          style={{
            borderColor: "var(--border)",
            backdropFilter: "blur(10px)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center min-h-[320px] gap-5">

              <CheckCircleIcon className="size-14 text-green-400" />

              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Message Sent!
              </h3>

              <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
                Thank you for reaching out. A member of our team will be in touch within one business day.
              </p>

              <button
                onClick={() => setSubmitted(false)}
                className="btn glass text-sm px-6 py-2.5 mt-2"
              >
                Send Another Message
              </button>

            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold mb-6" style={{ color: "var(--text-primary)" }}>
                Send Us a Message
              </h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                  className={inputCls}
                  style={inputStyle}
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Work Email"
                  required
                  className={inputCls}
                  style={inputStyle}
                />

                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className={inputCls}
                  style={inputStyle}
                />

                <textarea
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your inventory challenges..."
                  maxLength={MAX_MSG}
                  required
                  className={inputCls}
                  style={inputStyle}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full text-white font-semibold py-3.5 rounded-xl"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg,#3b82f6,#2563eb)"
                      : "linear-gradient(135deg,#e85d1a,#f97316)",
                  }}
                >
                  {loading ? "Sending..." : (
                    <>
                      <SendIcon className="size-4" />
                      Send Message
                    </>
                  )}
                </button>

              </form>
            </>
          )}
        </motion.div>

      </div>
    </section>
  );
}