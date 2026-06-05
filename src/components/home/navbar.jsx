import { MenuIcon, XIcon, SunIcon, MoonIcon, PackageIcon, ArrowRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/HomeThemeContext';

const IIMLogo = ({ onClick, isLight }) => (
    <a href="#home" onClick={onClick} className="flex items-center gap-2.5 shrink-0">
        <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
                background: isLight
                    ? 'linear-gradient(135deg, #e85d1a 0%, #f97316 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: isLight
                    ? '0 4px 10px rgba(232,93,26,0.30)'
                    : '0 4px 10px rgba(37,99,235,0.30)',
            }}>
            <PackageIcon className="size-5 text-white" strokeWidth={1.8}/>
        </div>
        <div className="leading-tight hidden sm:block">
            <p className="text-sm font-extrabold tracking-wide" style={{color:"var(--text-primary)"}}>IIM</p>
            <p className="text-[10px] font-medium leading-none" style={{color:"var(--text-muted)"}}>Internal Inventory Management</p>
        </div>
    </a>
);

export default function Navbar() {
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();
    const isLight = theme === 'light';

    const navBorder = useTransform(scrollY, [0, 80], ["rgba(0,0,0,0)", "var(--border)"]);
    const navShadow = useTransform(scrollY, [0, 80], ["0 0 0 rgba(0,0,0,0)", "0 4px 24px rgba(0,0,0,0.08)"]);

    useEffect(() => {
        return scrollY.on("change", v => setScrolled(v > 10));
    }, [scrollY]);

    const links = [
        { name: 'Home',         href: '#home' },
        { name: 'Features',     href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Testimonials', href: '#testimonials' },
        { name: 'FAQ',          href: '#faq' },
        { name: 'Contact',      href: '#contact' },
    ];

    const scrollTo = (e, href) => {
        e?.preventDefault();
        setIsOpen(false);
        if (href === '#home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        const el = document.querySelector(href);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
    };

    useEffect(() => {
        const onScroll = () => {
            const ids = links.map(l => l.href.replace('#', ''));
            for (let i = ids.length - 1; i >= 0; i--) {
                const el = document.getElementById(ids[i]);
                if (el && el.getBoundingClientRect().top <= 120) { setActiveSection(ids[i]); break; }
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <motion.nav
                className="sticky top-0 z-50 w-full transition-all duration-300"
                style={{
                    backgroundColor: "transparent",
                    borderBottom: "1px solid",
                    borderColor: navBorder,
                    boxShadow: navShadow,
                    backdropFilter: scrolled ? "blur(20px) saturate(1.6)" : "blur(0px)",
                    WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.6)" : "blur(0px)",
                }}
                initial={{ y: -70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 70 }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3.5">
                    <IIMLogo onClick={(e) => scrollTo(e, '#home')} isLight={isLight} />

                    {/* Desktop nav links */}
                    <div className="hidden lg:flex items-center gap-7">
                        {links.map((link) => {
                            const id = link.href.replace('#', '');
                            const isActive = activeSection === id;
                            return (
                                <a key={link.name} href={link.href} onClick={(e) => scrollTo(e, link.href)}
                                    className="text-sm font-medium transition-colors duration-200"
                                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                                    onMouseEnter={e => { if (!isActive) e.target.style.color = 'var(--text-primary)'; }}
                                    onMouseLeave={e => { if (!isActive) e.target.style.color = 'var(--text-secondary)'; }}
                                >
                                    {link.name}
                                </a>
                            );
                        })}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2.5">
                        {/* Theme toggle */}
                        <button onClick={toggle} title="Toggle theme"
                            className="p-2 rounded-lg transition-colors"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                            {theme === 'dark' ? <SunIcon className="size-4"/> : <MoonIcon className="size-4"/>}
                        </button>

                        {/* Desktop: Get Started */}
                        <button
                            onClick={() => navigate('/get-started')}
                            className="hidden lg:inline-flex items-center gap-1.5 active:scale-95 transition-all text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:brightness-110 shadow-md"
                            style={{
                                background: isLight
                                    ? "linear-gradient(135deg, #e85d1a 0%, #f97316 100%)"
                                    : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                boxShadow: isLight
                                    ? "0 4px 12px rgba(232,93,26,0.35)"
                                    : "0 4px 12px rgba(37,99,235,0.35)",
                            }}>
                            Get Started <ArrowRightIcon className="size-3.5"/>
                        </button>

                        {/* Mobile hamburger */}
                        <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 rounded-lg transition"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                            <MenuIcon className="size-5" style={{ color: "var(--text-secondary)" }}/>
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile overlay */}
            <div onClick={() => setIsOpen(false)}
                className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            />

            {/* Mobile drawer */}
            <div className={`fixed top-0 right-0 bottom-0 z-50 w-72 max-w-full lg:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                    <IIMLogo onClick={(e) => { scrollTo(e, '#home'); setIsOpen(false); }} isLight={isLight}/>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <XIcon className="size-5" style={{ color: "var(--text-secondary)" }}/>
                    </button>
                </div>

                <nav className="flex flex-col gap-1 px-3 pt-4 flex-1 overflow-y-auto">
                    {links.map((link) => {
                        const id = link.href.replace('#', '');
                        const isActive = activeSection === id;
                        return (
                            <a key={link.name} href={link.href} onClick={(e) => scrollTo(e, link.href)}
                                className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                                style={{
                                    background: isActive ? "var(--glow)" : "transparent",
                                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                                }}>
                                {link.name}
                            </a>
                        );
                    })}
                </nav>

                <div className="px-4 pb-8 pt-4 flex flex-col gap-3 border-t" style={{ borderColor: "var(--border)" }}>
                    {/* Mobile: theme toggle */}
                    <button onClick={toggle}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                        {theme === 'dark'
                            ? <><SunIcon className="size-4"/>Light Mode</>
                            : <><MoonIcon className="size-4"/>Dark Mode</>}
                    </button>
                    {/* Mobile: Get Started */}
                    <button
                        onClick={() => { setIsOpen(false); navigate('/get-started'); }}
                        className="flex items-center justify-center gap-2 w-full text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{
                            background: isLight
                                ? "linear-gradient(135deg, #e85d1a 0%, #f97316 100%)"
                                : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            boxShadow: isLight
                                ? "0 4px 12px rgba(232,93,26,0.35)"
                                : "0 4px 12px rgba(37,99,235,0.35)",
                        }}>
                        Get Started <ArrowRightIcon className="size-4"/>
                    </button>
                </div>
            </div>
        </>
    );
}
