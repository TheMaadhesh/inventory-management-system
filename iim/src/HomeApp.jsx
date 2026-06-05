import { motion } from "framer-motion";
import LenisScroll from "./components/home/lenis-scroll";
import Navbar from "./components/home/navbar";
import Footer from "./components/home/footer";
import HeroSection from "./sections/hero-section";
import FaqSection from "./sections/faq-section";
import Features from "./sections/features";
import WorkflowSteps from "./sections/workflow-steps";
import Testimonials from "./sections/testimonials";
import ContactSection from "./sections/contact-section";
import { useTheme } from "./context/HomeThemeContext";

/* Helper — builds animate + transition props for each orb */
const orb = (duration, delay, keys) => ({
    animate: keys,
    transition: {
        duration,
        delay,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
    },
});

/* Dark-theme orb definitions */
const DARK_ORBS = [
    { style: { width: 700, height: 700, top: "8%",  left: "14%",  background: "#0D47A1", filter: "blur(145px)", opacity: 0.32 }, ...orb(24, 0,  { x: [0, 65, -25, 0], y: [0, -45, 55, 0], scale: [1, 1.14, 0.96, 1] }) },
    { style: { width: 540, height: 540, top: "-6%", left: "46%",  background: "#0288D1", filter: "blur(130px)", opacity: 0.18 }, ...orb(19, 3,  { y: [0, 75, 20, 0], scale: [1, 1.28, 1.04, 1] }) },
    { style: { width: 580, height: 580, top: "28%", right: "-6%", background: "#1565C0", filter: "blur(130px)", opacity: 0.24 }, ...orb(27, 6,  { x: [0, -72, -18, 0], y: [0, 62, -32, 0], scale: [1, 1.1, 0.9, 1] }) },
    { style: { width: 480, height: 480, bottom: "8%", left: "8%", background: "#4527A0", filter: "blur(155px)", opacity: 0.14 }, ...orb(32, 10, { x: [0, 82, 12, 0], y: [0, -52, 28, 0], scale: [1, 1.22, 1, 1] }) },
    { style: { width: 290, height: 290, top: "52%", right: "20%", background: "#6A1B9A", filter: "blur(105px)", opacity: 0.12 }, ...orb(15, 5,  { x: [0, -42, 28, 0], y: [0, 42, -22, 0], scale: [1, 1.45, 0.78, 1] }) },
    { style: { width: 360, height: 360, bottom: "22%", right: "38%", background: "#1A237E", filter: "blur(120px)", opacity: 0.10 }, ...orb(20, 13, { x: [0, 35, -20, 0], y: [0, -38, 50, 0], scale: [1, 1.18, 0.95, 1] }) },
];

/* Light-theme orb definitions */
const LIGHT_ORBS = [
    { style: { width: 750, height: 750, top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(255,165,90,0.62) 0%, transparent 68%)", filter: "blur(105px)" }, ...orb(23, 0,  { x: [0, 52, -18, 0], y: [0, 45, 65, 0], scale: [1, 1.13, 0.97, 1] }) },
    { style: { width: 620, height: 620, top: "-6%", right: "-8%",   background: "radial-gradient(circle, rgba(195,165,240,0.52) 0%, transparent 65%)", filter: "blur(115px)" }, ...orb(27, 4,  { x: [0, -62, 12, 0], y: [0, 52, 22, 0], scale: [1, 1.18, 0.93, 1] }) },
    { style: { width: 560, height: 560, top: "33%", left: "46%",    background: "radial-gradient(circle, rgba(255,205,175,0.56) 0%, transparent 70%)", filter: "blur(92px)" },  ...orb(19, 8,  { y: [0, -65, 42, 0], scale: [1, 1.24, 0.98, 1] }) },
    { style: { width: 520, height: 520, bottom: "-10%", right: "-6%",background: "radial-gradient(circle, rgba(175,198,255,0.46) 0%, transparent 66%)", filter: "blur(125px)" }, ...orb(25, 2,  { x: [0, -52, 18, 0], y: [0, -62, 12, 0], scale: [1, 1.16, 0.96, 1] }) },
    { style: { width: 420, height: 420, bottom: "4%", left: "4%",   background: "radial-gradient(circle, rgba(255,175,155,0.42) 0%, transparent 70%)", filter: "blur(135px)" }, ...orb(21, 12, { x: [0, 72, -8, 0], y: [0, -42, 32, 0], scale: [1, 1.3, 1, 1] }) },
    { style: { width: 300, height: 300, top: "55%", left: "28%",    background: "radial-gradient(circle, rgba(255,220,160,0.38) 0%, transparent 70%)", filter: "blur(90px)" },  ...orb(16, 7,  { x: [0, 30, -25, 0], y: [0, 38, -28, 0], scale: [1, 1.35, 0.88, 1] }) },
];

function AnimatedBackground({ isDark }) {
    const orbs = isDark ? DARK_ORBS : LIGHT_ORBS;
    return (
        <div className="fixed inset-0 overflow-hidden -z-20 pointer-events-none">
            {orbs.map(({ style, animate, transition }, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={style}
                    animate={animate}
                    transition={transition}
                />
            ))}
        </div>
    );
}

export default function App() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <>
            <LenisScroll />
            <Navbar />
            <AnimatedBackground isDark={isDark} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 overflow-x-hidden w-full">
                <HeroSection />
                <Features />
                <WorkflowSteps />
                <Testimonials />
                <FaqSection />
                <ContactSection />
            </main>
            <Footer />
        </>
    );
}
