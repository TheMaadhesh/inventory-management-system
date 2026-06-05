import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeftIcon, PackageIcon } from "lucide-react";

const PAGE_DATA = {
    "features": {
        title: "Features",
        category: "Product",
        icon: "📦",
        description: "Everything you need to control your inventory with confidence.",
        sections: [
            { heading: "Real-Time Stock Tracking", body: "Monitor inventory levels across every location the moment stock is added, moved, or sold. Eliminate guesswork with a live, accurate view of your entire operation." },
            { heading: "Smart Low-Stock Alerts", body: "Configure thresholds per SKU and receive instant alerts via email, SMS, or in-app notification before a stockout impacts your business." },
            { heading: "Automated Reordering", body: "Set reorder rules once and let IIM automatically generate purchase orders when stock hits critical levels." },
            { heading: "Barcode & QR Scanning", body: "Perform fast, accurate stock counts using any iOS or Android device with no dedicated hardware needed." },
            { heading: "Advanced Analytics", body: "Access detailed dashboards on stock velocity, turnover rates, and demand forecasts." },
            { heading: "Role-Based Access", body: "Define granular permissions for every team member to keep your data secure." },
        ],
    },
    "integrations": {
        title: "Integrations",
        category: "Product",
        icon: "🔌",
        description: "Connect IIM with your existing tools and workflows in minutes.",
        sections: [
            { heading: "E-commerce Platforms", body: "Sync inventory with Shopify, WooCommerce, Amazon, and 40+ other platforms in real time." },
            { heading: "ERP Systems", body: "Native connectors for SAP, Oracle, and Microsoft Dynamics with bi-directional sync." },
            { heading: "Accounting Software", body: "Automatic cost-of-goods updates in QuickBooks, Xero, and FreshBooks." },
            { heading: "Shipping & Logistics", body: "Integrate with FedEx, UPS, DHL, and Shipstation for automated fulfillment." },
            { heading: "REST API", body: "Full-featured REST API with webhooks, SDKs for Node.js, Python, and PHP." },
            { heading: "Zapier & Make", body: "No-code automation with thousands of apps via Zapier and Make connectors." },
        ],
    },
    "changelog": {
        title: "Changelog",
        category: "Product",
        icon: "📋",
        description: "What's new in IIM — release notes and version history.",
        sections: [
            { heading: "v3.2.0 — February 2026", body: "Scroll-linked animations, warm light theme, password strength meter, and improved mobile responsiveness across all pages." },
            { heading: "v3.1.0 — January 2026", body: "New goods receiving workflow with variance detection. Batch number and expiry date tracking now generally available." },
            { heading: "v3.0.0 — December 2025", body: "Complete UI redesign. Dark/light themes, framer-motion animations, Lenis smooth scroll." },
            { heading: "v2.8.0 — October 2025", body: "Multi-location stock transfer with real-time audit logs. Improved barcode scanner performance on low-end devices." },
            { heading: "v2.7.0 — August 2025", body: "Demand forecasting engine powered by historical sales data. 35% average reduction in overstock reported by beta users." },
            { heading: "v2.6.0 — June 2025", body: "Role-based access control with granular permission sets. SOC 2 Type II certification achieved." },
        ],
    },
    "about": {
        title: "About Us",
        category: "Company",
        icon: "🏢",
        description: "Building the future of inventory management for teams that move fast.",
        sections: [
            { heading: "Our Mission", body: "We believe every business deserves real-time visibility into their inventory. We built IIM to eliminate the costly guesswork that leads to stockouts, overstocking, and manual errors." },
            { heading: "Our Story", body: "Founded in 2021 by a team of logistics veterans and engineers who experienced firsthand the pain of managing inventory across multiple warehouses with spreadsheets." },
            { heading: "The Team", body: "We're a team of 60+ people spread across San Francisco, London, and Singapore — united by a passion for operational excellence and great software." },
            { heading: "Our Values", body: "Transparency, reliability, and relentless focus on user experience. We dog-food our own product in our warehouse every day." },
            { heading: "Investors", body: "Backed by Sequoia Capital, Y Combinator (W22), and strategic angels from the logistics industry." },
            { heading: "Press & Awards", body: "Named 'Best Inventory Software 2025' by G2, TechCrunch Disrupt finalist, and featured in Forbes 30 Under 30." },
        ],
    },
    "careers": {
        title: "Careers",
        category: "Company",
        icon: "💼",
        description: "Join us in building software that helps businesses run better.",
        sections: [
            { heading: "Why Work at IIM", body: "Competitive salaries, equity, full remote flexibility, generous PTO, and a team that genuinely cares about craft." },
            { heading: "Engineering", body: "Open roles: Senior Frontend Engineer (React/TypeScript), Backend Engineer (Node.js/PostgreSQL), DevOps Engineer (AWS/Kubernetes)." },
            { heading: "Product & Design", body: "Open roles: Product Manager, Senior UX Designer, UX Researcher." },
            { heading: "Sales & Growth", body: "Open roles: Account Executive (Enterprise), Sales Development Representative, Customer Success Manager." },
            { heading: "Operations", body: "Open roles: Head of Finance, People Operations Manager, Legal Counsel." },
            { heading: "How to Apply", body: "Send your CV and a short note about why you want to join to careers@iim.io. We respond to every application within 5 business days." },
        ],
    },
    "blog": {
        title: "Blog",
        category: "Company",
        icon: "✍️",
        description: "Insights, guides, and best practices for inventory management.",
        sections: [
            { heading: "Reducing Stockouts by 80%: A Case Study", body: "How RetailCo eliminated stockouts in their first month using IIM's smart threshold alerts and automated reordering." },
            { heading: "The True Cost of Manual Inventory Management", body: "We analysed 500 SME warehouses and found that manual processes cost an average of $47,000/year in wasted labour, errors, and emergency procurement." },
            { heading: "FIFO vs FEFO: Which Picking Method is Right for You?", body: "A practical guide to choosing between first-in-first-out and first-expiry-first-out for perishable goods management." },
            { heading: "Setting Up Barcode Scanning in Under an Hour", body: "Step-by-step walkthrough for getting your team scanning with any iOS or Android device — no dedicated hardware required." },
            { heading: "Understanding Inventory Turnover Rate", body: "What it is, how to calculate it, and what a healthy turnover ratio looks like for your industry." },
            { heading: "Multi-Location Inventory: Best Practices", body: "Managing stock across 3+ locations? Here's how to structure your zones, transfers, and replenishment rules for maximum efficiency." },
        ],
    },
    "press": {
        title: "Press",
        category: "Company",
        icon: "📰",
        description: "Media resources, press releases, and brand assets for IIM.",
        sections: [
            { heading: "Press Releases", body: "February 2026: IIM launches v3.2 with AI-powered demand forecasting. January 2026: IIM surpasses 50,000 business customers globally." },
            { heading: "Media Coverage", body: "TechCrunch: 'The inventory management startup taking on legacy ERP systems'. Forbes: 'IIM founder named to 30 Under 30 enterprise tech list'." },
            { heading: "Awards", body: "G2 Best Inventory Software 2024 & 2025. Capterra Top Performer. Product Hunt #1 Product of the Day." },
            { heading: "Brand Assets", body: "Download our logo pack, brand guidelines, and product screenshots at press.iim.io. All assets are cleared for editorial use." },
            { heading: "Media Contact", body: "For press enquiries, interview requests, and speaking opportunities contact press@iim.io. We aim to respond within 24 hours." },
            { heading: "Fact Sheet", body: "Founded: 2021. HQ: San Francisco. Team: 60+. Customers: 50,000+. SKUs tracked daily: 2M+. Funding: Series A, $18M." },
        ],
    },
    "help-center": {
        title: "Help Center",
        category: "Support",
        icon: "🛟",
        description: "Guides, tutorials, and answers to common questions about IIM.",
        sections: [
            { heading: "Getting Started", body: "New to IIM? Start with our Quick Setup guide to import your catalog, connect your warehouses, and invite your team in under an hour." },
            { heading: "Inventory Management", body: "Learn how to add items, perform stock counts, set reorder rules, and handle transfers between locations." },
            { heading: "Purchase Orders", body: "Step-by-step guides for creating manual and automated purchase orders, receiving goods, and handling variances." },
            { heading: "Reports & Analytics", body: "How to generate stock valuation reports, movement history, turnover analysis, and custom dashboards." },
            { heading: "Integrations", body: "Connection guides for Shopify, WooCommerce, Amazon, QuickBooks, and 40+ other platforms." },
            { heading: "Account & Billing", body: "Managing users, roles, permissions, subscription plans, invoices, and payment methods." },
        ],
    },
    "api-docs": {
        title: "API Docs",
        category: "Support",
        icon: "⚡",
        description: "Full reference documentation for the IIM REST API.",
        sections: [
            { heading: "Authentication", body: "IIM uses API keys for authentication. Generate keys in Settings → API. Include your key in the Authorization: Bearer header on every request." },
            { heading: "Base URL", body: "All API requests are made to https://api.iim.io/v1. The API returns JSON responses and uses standard HTTP status codes." },
            { heading: "Endpoints: Inventory", body: "GET /inventory — list all items. POST /inventory — create item. PUT /inventory/:id — update item. DELETE /inventory/:id — remove item." },
            { heading: "Endpoints: Warehouses", body: "GET /warehouses — list warehouses. POST /warehouses — create warehouse. GET /warehouses/:id/stock — stock levels for a location." },
            { heading: "Webhooks", body: "Subscribe to events like inventory.low_stock, purchase_order.created, and stock.updated via the Webhooks panel in Settings." },
            { heading: "SDKs", body: "Official SDKs available for Node.js (npm install @iim/sdk), Python (pip install iim-sdk), and PHP (composer require iim/sdk)." },
        ],
    },
    "system-status": {
        title: "System Status",
        category: "Support",
        icon: "🟢",
        description: "Live status and incident history for all IIM services.",
        sections: [
            { heading: "API — Operational", body: "All API endpoints responding normally. Average latency: 42ms. Uptime last 30 days: 99.97%." },
            { heading: "Dashboard — Operational", body: "Web and mobile dashboard loading normally. CDN performance: nominal. Last deployment: 3 hours ago." },
            { heading: "Webhooks — Operational", body: "Event delivery latency: <500ms. Queue depth: normal. Failed deliveries last 24h: 0." },
            { heading: "Integrations — Operational", body: "All third-party connectors syncing normally. Shopify, Amazon, and QuickBooks integrations: healthy." },
            { heading: "Scheduled Maintenance", body: "Next maintenance window: Sunday 2 March 2026, 02:00–04:00 UTC. Expected downtime: <10 minutes." },
            { heading: "Incident History", body: "Feb 8 2026: API latency spike (resolved in 18 min). Jan 14 2026: Webhook delivery delay (resolved in 6 min). No incidents in December 2025." },
        ],
    },
    "privacy-policy": {
        title: "Privacy Policy",
        category: "Legal",
        icon: "🔒",
        description: "How IIM collects, uses, and protects your personal data.",
        sections: [
            { heading: "Data We Collect", body: "We collect account information (name, email, company), usage data (pages visited, features used), and inventory data you input into the platform." },
            { heading: "How We Use Your Data", body: "To provide and improve the IIM service, send transactional emails, provide customer support, and comply with legal obligations. We never sell your data." },
            { heading: "Data Storage", body: "All data is stored on AWS infrastructure in the EU (Frankfurt) and US (Virginia) regions. Data is encrypted at rest (AES-256) and in transit (TLS 1.3)." },
            { heading: "Your Rights", body: "Under GDPR and CCPA you have the right to access, correct, export, or delete your data at any time via Settings → Privacy, or by contacting privacy@iim.io." },
            { heading: "Cookies", body: "We use essential cookies for authentication and analytics cookies (opt-in) for product improvement. See our Cookie Policy for full details." },
            { heading: "Contact", body: "For privacy-related enquiries contact our Data Protection Officer at dpo@iim.io or write to IIM Inc., 535 Mission Street, San Francisco, CA 94105." },
        ],
    },
    "terms-of-service": {
        title: "Terms of Service",
        category: "Legal",
        icon: "📜",
        description: "The terms governing your use of the IIM platform.",
        sections: [
            { heading: "Acceptance", body: "By creating an IIM account you agree to these Terms. If you are using IIM on behalf of a business, you represent that you have authority to bind that business." },
            { heading: "Your Account", body: "You are responsible for maintaining the security of your account credentials. Notify us immediately at security@iim.io if you suspect unauthorised access." },
            { heading: "Acceptable Use", body: "You may not use IIM for unlawful purposes, to store illegal content, to attempt to gain unauthorised access to our systems, or to resell access without permission." },
            { heading: "Data Ownership", body: "You own all inventory data you input into IIM. We process it only to provide the service. On account termination, you may export all data within 30 days." },
            { heading: "Limitation of Liability", body: "IIM's liability is limited to the greater of $100 or the fees paid in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages." },
            { heading: "Governing Law", body: "These Terms are governed by the laws of California, USA. Disputes shall be resolved in the courts of San Francisco County, California." },
        ],
    },
    "security": {
        title: "Security",
        category: "Legal",
        icon: "🛡️",
        description: "How IIM keeps your inventory data safe and compliant.",
        sections: [
            { heading: "Encryption", body: "All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Database backups are encrypted and stored in geographically separate regions." },
            { heading: "Access Control", body: "Production systems are accessible only via VPN with hardware MFA. Access is logged and reviewed weekly. Principle of least privilege is enforced throughout." },
            { heading: "Compliance", body: "IIM is SOC 2 Type II certified, GDPR compliant, and follows ISO 27001 information security management principles." },
            { heading: "Penetration Testing", body: "We engage independent security firms for annual penetration tests and continuous vulnerability scanning. Our bug bounty programme is open at security.iim.io/bounty." },
            { heading: "Incident Response", body: "We maintain a 24/7 security incident response team. In the event of a breach affecting your data, we will notify you within 72 hours as required by GDPR." },
            { heading: "Report a Vulnerability", body: "Found a security issue? Please report it responsibly to security@iim.io. We investigate all reports within 5 business days and offer bounties for valid findings." },
        ],
    },
    "cookie-policy": {
        title: "Cookie Policy",
        category: "Legal",
        icon: "🍪",
        description: "What cookies IIM uses and how to control them.",
        sections: [
            { heading: "Essential Cookies", body: "Required for authentication (session tokens) and security (CSRF protection). Cannot be disabled as they are necessary for the service to function." },
            { heading: "Analytics Cookies", body: "We use Mixpanel to understand how users navigate the product. These cookies are opt-in and can be disabled in Settings → Privacy → Analytics." },
            { heading: "Preference Cookies", body: "Used to remember your theme (dark/light), language, and display settings. Stored for 12 months." },
            { heading: "Third-Party Cookies", body: "Our payment processor (Stripe) and support tool (Intercom) may set their own cookies. See their privacy policies for details." },
            { heading: "Managing Cookies", body: "You can clear or disable cookies in your browser settings. Note that disabling essential cookies will log you out of IIM." },
            { heading: "Updates", body: "We may update this policy when we add new cookies or third-party tools. We will notify you by email 30 days before material changes take effect." },
        ],
    },
};

const CATEGORY_COLORS = {
    Product: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
    Company: { bg: "rgba(16,185,129,0.1)", text: "#10b981", border: "rgba(16,185,129,0.25)" },
    Support: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
    Legal:   { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6", border: "rgba(139,92,246,0.25)" },
};

export default function InfoPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const page = PAGE_DATA[slug];
    const catColor = page ? CATEGORY_COLORS[page.category] : CATEGORY_COLORS.Product;

    return (
        <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
            {/* Mesh background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:0}}>
                <div className="absolute -top-32 -left-20 w-[500px] h-[500px] rounded-full"
                    style={{ background:"radial-gradient(circle, var(--orb1, rgba(59,130,246,0.18)) 0%, transparent 70%)", opacity:0.8 }}/>
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full"
                    style={{ background:"radial-gradient(circle, var(--orb2, rgba(99,102,241,0.15)) 0%, transparent 65%)", opacity:0.7 }}/>
                <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] rounded-full"
                    style={{ background:"radial-gradient(circle, var(--orb3, rgba(139,92,246,0.12)) 0%, transparent 68%)", opacity:0.6 }}/>
            </div>

            {/* Back button only — no navbar */}
            <div className="relative z-10 flex items-center px-4 sm:px-8 lg:px-12 pt-6 pb-2">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                    <ArrowLeftIcon className="size-4"/>
                    Back
                </button>
            </div>

            {/* Content — proper page-filling layout */}
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
                {page ? (
                    <>
                        <motion.div initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{type:"spring",stiffness:220,damping:60}}>
                            {/* Category badge */}
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
                                style={{ background:catColor.bg, color:catColor.text, border:`1px solid ${catColor.border}` }}>
                                {page.category}
                            </span>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{color:"var(--text-primary)"}}>
                                <span className="mr-3">{page.icon}</span>{page.title}
                            </h1>
                            <p className="text-base sm:text-lg leading-relaxed mb-12" style={{color:"var(--text-secondary)"}}>{page.description}</p>
                        </motion.div>

                        {/* Sections — 2-col grid on md+ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {page.sections.map((s, i) => (
                                <motion.div key={i}
                                    className="rounded-2xl p-6 sm:p-7"
                                    style={{ background:"transparent", border:"1px solid var(--border)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", boxShadow:"var(--shadow-card)" }}
                                    initial={{opacity:0,y:24}}
                                    whileInView={{opacity:1,y:0}}
                                    viewport={{once:true, margin:"-30px"}}
                                    transition={{delay:i*0.04, type:"spring", stiffness:220, damping:55}}>
                                    <h3 className="text-base font-semibold mb-2" style={{color:"var(--text-primary)"}}>{s.heading}</h3>
                                    <p className="text-sm leading-relaxed" style={{color:"var(--text-secondary)"}}>{s.body}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div className="mt-12 text-center"
                            initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.2}}>
                            <button onClick={() => navigate("/")}
                                className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full text-sm text-white hover:brightness-110 transition-all active:scale-95"
                                style={{ background:"var(--accent)" }}>
                                <ArrowLeftIcon className="size-4"/>
                                Back to Home
                            </button>
                        </motion.div>
                    </>
                ) : (
                    <motion.div className="text-center py-24" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}>
                        <p className="text-6xl mb-6">🔍</p>
                        <h1 className="text-3xl font-bold mb-3" style={{color:"var(--text-primary)"}}>Page Not Found</h1>
                        <p className="mb-8" style={{color:"var(--text-secondary)"}}>This page doesn't exist yet.</p>
                        <button onClick={() => navigate("/")}
                            className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full text-sm text-white hover:brightness-110 transition-all"
                            style={{ background:"var(--accent)" }}>
                            <ArrowLeftIcon className="size-4"/> Go Home
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
