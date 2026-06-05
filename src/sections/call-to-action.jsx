import { ArrowRightIcon } from "lucide-react";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CallToAction() {
    const ref = useRef(null);
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.3"] });
    const y       = useTransform(scrollYProgress, [0, 1], [60, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
    const scale   = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

    return (
        <motion.div
            ref={ref}
            className="relative flex flex-col max-w-5xl mt-32 sm:mt-40 mx-4 sm:mx-auto items-center justify-center text-center px-6 sm:px-10 py-16 sm:py-20 rounded-2xl sm:rounded-3xl overflow-hidden will-change-transform"
            style={{ y, opacity, scale, border: "1px solid var(--border)", background: "var(--bg-card)", backdropFilter: "blur(16px)" }}
        >
            {/* Glows */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(232,93,26,0.08) 0%, transparent 60%)" }}/>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[90px]" style={{ background: "rgba(232,93,26,0.12)" }}/>
            </div>

            <motion.span
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "var(--accent)" }}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            >
                For Authorized Users Only
            </motion.span>

            <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold max-w-2xl leading-tight"
                style={{ color: "var(--text-primary)" }}
                initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.12, type: "spring", stiffness: 260, damping: 65 }}
            >
                Ready to take control of your internal inventory?
            </motion.h2>

            <motion.p
                className="mt-5 text-sm sm:text-base max-w-lg leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
                initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.18, type: "spring", stiffness: 240, damping: 65 }}
            >
                IIM gives your Admin and Staff teams a secure, role-based platform to manage products, scan QR codes, and track every stock movement — keeping your organization's inventory accurate and fully auditable.
            </motion.p>

            <motion.button
                onClick={() => navigate("/signup")}
                className="mt-9 inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full text-sm sm:text-base text-white shadow-lg transition-all active:scale-95 hover:brightness-110"
                style={{ background: "var(--accent)", boxShadow: "0 6px 20px rgba(232,93,26,0.35)" }}
                initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.24, type: "spring", stiffness: 260, damping: 65 }}
            >
                Get Started <ArrowRightIcon className="size-4"/>
            </motion.button>

            <motion.p
                className="mt-5 text-xs"
                style={{ color: "var(--text-muted)" }}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            >
                Secure login · Role-based access · Admin &amp; Staff modules
            </motion.p>
        </motion.div>
    );
}
