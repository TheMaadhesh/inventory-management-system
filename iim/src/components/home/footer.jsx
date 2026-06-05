import { LinkedinIcon, TwitterIcon, GithubIcon, YoutubeIcon, PackageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/HomeThemeContext";

const IIMLogo = () => {
    const { theme } = useTheme();
    const isLight = theme === "light";
    return (
        <div className="flex items-center gap-2.5">
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    background: isLight
                        ? "linear-gradient(135deg, #e85d1a 0%, #f97316 100%)"
                        : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    boxShadow: isLight
                        ? "0 4px 10px rgba(232,93,26,0.30)"
                        : "0 4px 10px rgba(37,99,235,0.30)",
                }}
            >
                <PackageIcon className="size-5 text-white" strokeWidth={1.8}/>
            </div>
            <div className="leading-tight">
                <p className="text-sm font-extrabold tracking-wide" style={{color:"var(--text-primary)"}}>IIM</p>
                <p className="text-[10px] font-medium leading-none" style={{color:"var(--text-muted)"}}>Internal Inventory Management</p>
            </div>
        </div>
    );
};

// Route map: #! anchors → actual page routes
const routeMap = {
    "Features":       "/info/features",
    "How It Works":   "#how-it-works",
    "Integrations":   "/info/integrations",
    "Changelog":      "/info/changelog",
    "About Us":       "/info/about",
    "Careers":        "/info/careers",
    "Blog":           "/info/blog",
    "Press":          "/info/press",
    "Help Center":    "/info/help-center",
    "Contact Us":     "#contact",
    "API Docs":       "/info/api-docs",
    "System Status":  "/info/system-status",
    "Privacy Policy": "/info/privacy-policy",
    "Terms of Service":"/info/terms-of-service",
    "Security":       "/info/security",
    "Cookie Policy":  "/info/cookie-policy",
};

const footerLinks = [
    { heading:"Product", links:["Features","How It Works","Integrations","Changelog"] },
    { heading:"Company", links:["About Us","Careers","Blog","Press"] },
    { heading:"Support", links:["Help Center","Contact Us","API Docs","System Status"] },
    { heading:"Legal",   links:["Privacy Policy","Terms of Service","Security","Cookie Policy"] },
];

export default function Footer() {
    const navigate = useNavigate();

    const handleLink = (e, name) => {
        e.preventDefault();
        const route = routeMap[name];
        if (!route) return;
        if (route.startsWith("#")) {
            if (route === "#home") { window.scrollTo({top:0,behavior:"smooth"}); return; }
            const el = document.querySelector(route);
            if (el) window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-72,behavior:"smooth"});
        } else {
            navigate(route);
        }
    };

    return (
        <motion.footer className="w-full border-t mt-20"
            style={{background:"var(--bg-surface)", borderColor:"var(--border)"}}
            initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{duration:0.5}}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14">
                {/* Top grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
                    {/* Brand col */}
                    <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col gap-4">
                        <a href="/" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});}}>
                            <IIMLogo/>
                        </a>
                        <p className="text-xs leading-relaxed max-w-[220px]" style={{color:"var(--text-muted)"}}>
                            The intelligent internal inventory management platform built for organizations.
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                            {[LinkedinIcon,TwitterIcon,GithubIcon,YoutubeIcon].map((Icon,i)=>(
                                <a key={i} href="#" className="transition-colors duration-200" style={{color:"var(--text-muted)"}}
                                    onMouseEnter={e=>e.currentTarget.style.color="var(--text-primary)"}
                                    onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>
                                    <Icon className="size-4"/>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {footerLinks.map((col,i)=>(
                        <div key={i} className="flex flex-col gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-widest" style={{color:"var(--text-primary)"}}>{col.heading}</p>
                            {col.links.map((name,j)=>(
                                <a key={j} href={routeMap[name] || "#"}
                                    onClick={e=>handleLink(e,name)}
                                    className="text-sm transition-colors duration-200 hover:translate-x-0.5 inline-block"
                                    style={{color:"var(--text-secondary)"}}
                                    onMouseEnter={e=>e.currentTarget.style.color="var(--text-primary)"}
                                    onMouseLeave={e=>e.currentTarget.style.color="var(--text-secondary)"}>
                                    {name}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Bottom bar — no "All systems operational" */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-12 pt-6 border-t" style={{borderColor:"var(--border)"}}>
                    <p className="text-xs text-center sm:text-left" style={{color:"var(--text-muted)"}}>
                        © {new Date().getFullYear()} Internal Inventory Management System. 
                    </p>
                    <p className="text-xs" style={{color:"var(--text-muted)"}}>
                        All rights reserved.
                    </p>
                </div>
            </div>
        </motion.footer>
    );
}
