import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function TrustedCompanies() {
    const logos = ['/assets/company-logo-1.svg','/assets/company-logo-2.svg','/assets/company-logo-3.svg','/assets/company-logo-4.svg','/assets/company-logo-5.svg'];
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "end 0.4"] });
    const y       = useTransform(scrollYProgress, [0, 1], [40, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

    return (
        <motion.section ref={ref} className="mt-16 py-10 border-y" style={{ borderColor: "var(--border)", y, opacity }}>
            <p className="text-center text-xs sm:text-sm mb-8 uppercase tracking-widest font-medium" style={{ color: "var(--text-muted)" }}>
                Built with industry-standard technologies
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
                {logos.map((logo, i) => (
                    <motion.img key={i} src={logo} alt="partner logo"
                        className="h-6 sm:h-7 w-auto transition-all duration-300"
                        style={{ opacity: 0.45 }}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 0.45, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 55 }}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => e.target.style.opacity = 0.45}
                    />
                ))}
            </div>
        </motion.section>
    );
}
