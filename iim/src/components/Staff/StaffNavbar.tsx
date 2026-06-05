import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useUserInfo } from "../../hooks/useUserInfo";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
export type ThemeName = "retro" | "light" | "dark" | "arctic" | "nature" | "ember" | "dracula" | "midnight" | "rose" | "slate";
export type PrimaryColor = string;
export type NavLayout = "sidenav" | "topnav" | "combo";
export type SidenavShape = "default" | "slim" | "stacked";
export type FontFamily = "Georgia, serif" | "'Merriweather', serif" | "'Courier New', monospace" | "system-ui, sans-serif" | "'Trebuchet MS', sans-serif" | "'Palatino', serif";
export type FontSize = "sm" | "md" | "lg";

interface ThemeCtx {
  theme: ThemeName; setTheme: (t: ThemeName) => void;
  primary: PrimaryColor; setPrimary: (c: PrimaryColor) => void;
  navLayout: NavLayout; setNavLayout: (n: NavLayout) => void;
  sidenavShape: SidenavShape; setSidenavShape: (s: SidenavShape) => void;
  fontFamily: FontFamily; setFontFamily: (f: FontFamily) => void;
  fontSize: FontSize; setFontSize: (s: FontSize) => void;
  language: string; setLanguage: (l: string) => void;
  sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void;
  sidebarCollapsed: boolean; setSidebarCollapsed: (v: boolean) => void;
  customizeOpen: boolean; setCustomizeOpen: (v: boolean) => void;
  tokens: Record<string, string>;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeCtx>({} as ThemeCtx);
export const useTheme = () => useContext(ThemeContext);

/* ══════════════════════════════════════════════════════════
   THEME TOKENS
══════════════════════════════════════════════════════════ */
const THEME_TOKENS: Record<ThemeName, Record<string, string>> = {
  retro:    { bg:"#f0ebe3", sidebar:"#e8e2d8", border:"#d4ccc0", text:"#2c2416", muted:"#9b8e7e", sub:"#7a6e60", card:"#e8e2d8", cardHover:"#ddd7cc", topbar:"#e8e2d8" },
  light:    { bg:"#f4f6fb", sidebar:"#ffffff", border:"#e2e8f0", text:"#0f172a", muted:"#94a3b8", sub:"#475569", card:"#ffffff", cardHover:"#f1f5f9", topbar:"#ffffff" },
  dark:     { bg:"#0f172a", sidebar:"#1e293b", border:"#334155", text:"#f1f5f9", muted:"#475569", sub:"#94a3b8", card:"#1e293b", cardHover:"#273549", topbar:"#1e293b" },
  arctic:   { bg:"#f0f9ff", sidebar:"#e0f2fe", border:"#bae6fd", text:"#0c4a6e", muted:"#7dd3fc", sub:"#0284c7", card:"#e0f2fe", cardHover:"#bae6fd", topbar:"#e0f2fe" },
  nature:   { bg:"#f0fdf4", sidebar:"#dcfce7", border:"#bbf7d0", text:"#14532d", muted:"#4ade80", sub:"#16a34a", card:"#dcfce7", cardHover:"#bbf7d0", topbar:"#dcfce7" },
  ember:    { bg:"#fff7ed", sidebar:"#ffedd5", border:"#fed7aa", text:"#431407", muted:"#fdba74", sub:"#c2410c", card:"#ffedd5", cardHover:"#fed7aa", topbar:"#ffedd5" },
  dracula:  { bg:"#282a36", sidebar:"#1e1f2b", border:"#44475a", text:"#f8f8f2", muted:"#6272a4", sub:"#a0accc", card:"#1e1f2b", cardHover:"#2d2f3f", topbar:"#1e1f2b" },
  midnight: { bg:"#0d0d1a", sidebar:"#13132a", border:"#1e1e3f", text:"#e2e0ff", muted:"#4a4a80", sub:"#9090c0", card:"#13132a", cardHover:"#1a1a35", topbar:"#13132a" },
  rose:     { bg:"#fff1f2", sidebar:"#ffe4e6", border:"#fecdd3", text:"#4c0519", muted:"#fda4af", sub:"#be123c", card:"#ffe4e6", cardHover:"#fecdd3", topbar:"#ffe4e6" },
  slate:    { bg:"#f8fafc", sidebar:"#f1f5f9", border:"#cbd5e1", text:"#1e293b", muted:"#94a3b8", sub:"#475569", card:"#ffffff", cardHover:"#f1f5f9", topbar:"#ffffff" },
};

const FONT_SIZES: Record<FontSize, string> = { sm:"12.5px", md:"13.5px", lg:"15px" };

/* ══════════════════════════════════════════════════════════
   LANGUAGES with translations
══════════════════════════════════════════════════════════ */
export const LANGUAGES = [
  { code:"en", label:"English",    native:"English",    flag:"🇬🇧", cdnCode:"gb", currency:"$"     },
  { code:"ms", label:"Malay",      native:"Bahasa",     flag:"🇲🇾", cdnCode:"my", currency:"RM"    },
  { code:"zh", label:"Chinese",    native:"官话",         flag:"🇨🇳", cdnCode:"cn", currency:"¥"     },
  { code:"ar", label:"Arabic",     native:"العربية",    flag:"🇸🇦", cdnCode:"sa", currency:"ريال"  },
  { code:"fr", label:"French",     native:"Française",  flag:"🇫🇷", cdnCode:"fr", currency:"€"     },
  { code:"de", label:"German",     native:"Deutsch",    flag:"🇩🇪", cdnCode:"de", currency:"€"     },
  { code:"ja", label:"Japanese",   native:"日本語",        flag:"🇯🇵", cdnCode:"jp", currency:"¥"     },
  { code:"ko", label:"Korean",     native:"한국어",        flag:"🇰🇷", cdnCode:"kr", currency:"₩"     },
  { code:"hi", label:"Hindi",      native:"हिन्दी",     flag:"🇮🇳", cdnCode:"in", currency:"₹"     },
  { code:"pt", label:"Portuguese", native:"Português",  flag:"🇧🇷", cdnCode:"br", currency:"R$"    },
  { code:"es", label:"Spanish",    native:"Español",    flag:"🇪🇸", cdnCode:"es", currency:"€"     },
  { code:"id", label:"Indonesian", native:"Indonesia",  flag:"🇮🇩", cdnCode:"id", currency:"Rp"    },
  { code:"th", label:"Thai",       native:"ภาษาไทย",     flag:"🇹🇭", cdnCode:"th", currency:"฿"     },
  { code:"vi", label:"Vietnamese", native:"Tiếng Việt", flag:"🇻🇳", cdnCode:"vn", currency:"₫"     },
  { code:"tr", label:"Turkish",    native:"Türkçe",     flag:"🇹🇷", cdnCode:"tr", currency:"₺"     },
  { code:"ru", label:"Russian",    native:"Русский",    flag:"🇷🇺", cdnCode:"ru", currency:"₽"     },
  { code:"ta", label:"Tamil",      native:"தமிழ்",       flag:"🇮🇳", cdnCode:"in", currency:"₹"     },
  { code:"bn", label:"Bengali",    native:"বাংলা",      flag:"🇧🇩", cdnCode:"bd", currency:"৳"     },
  { code:"nl", label:"Dutch",      native:"Nederlands", flag:"🇳🇱", cdnCode:"nl", currency:"€"     },
  { code:"it", label:"Italian",    native:"Italiano",   flag:"🇮🇹", cdnCode:"it", currency:"€"     },
];

// UI label translations per language
const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: { dashboard:"Dashboard", inventory:"Inventory", search:"Search...", logout:"Logout", notifications:"Notifications", customize:"Customize", language:"Language", profile:"Profile", staff:"Staff", staffMember:"Staff Member", admin:"Admin", administrator:"Administrator", viewItems:"View Items", addItems:"Add Items", manageItems:"Manage Items", itemDetails:"Item Details", generateQr:"Generate QR", scanQr:"Scan QR", scanQrCode:"Scan QR Code", manageCategories:"Manage Categories", stockInOut:"Stock In / Out", stockIn:"Stock In", stockOut:"Stock Out", stockHistory:"Stock History", inventoryReport:"Inventory Report", lowStockReport:"Low Stock Report", lowStock:"Low Stock", lowStockItems:"Low Stock Items", manageStaff:"Manage Staff", changePassword:"Change Password", settings:"Settings", reports:"Reports", users:"Users", stock:"Stock", categories:"Categories", qrCode:"QR Code", qrScan:"QR Scan" },
  ms: { dashboard:"Papan Pemuka", inventory:"Inventori", search:"Cari inventori, pesanan...", logout:"Log Keluar", notifications:"Pemberitahuan", customize:"Sesuaikan", language:"Bahasa", profile:"Profil", admin:"Admin", administrator:"Pentadbir", viewItems:"Lihat Item", addItems:"Tambah Item", manageItems:"Urus Item", generateQr:"Jana QR", scanQr:"Imbas QR", manageCategories:"Urus Kategori", stockInOut:"Stok Masuk / Keluar", stockHistory:"Sejarah Stok", inventoryReport:"Laporan Inventori", lowStockReport:"Laporan Stok Rendah", manageStaff:"Urus Kakitangan", changePassword:"Tukar Kata Laluan", settings:"Tetapan", reports:"Laporan", users:"Pengguna", stock:"Stok", categories:"Kategori", qrCode:"Kod QR" , staff:"Kakitangan", staffMember:"Ahli Kakitangan", itemDetails:"Butiran Item", scanQrCode:"Imbas Kod QR", stockIn:"Stok Masuk", stockOut:"Stok Keluar", lowStock:"Stok Rendah", lowStockItems:"Item Stok Rendah", qrScan:"Imbas QR"},
  zh: { dashboard:"控制台", inventory:"库存", search:"搜索库存、订单...", logout:"退出", notifications:"通知", customize:"自定义", language:"语言", profile:"个人资料", admin:"管理员", administrator:"系统管理员", viewItems:"查看物品", addItems:"添加物品", manageItems:"管理物品", generateQr:"生成QR", scanQr:"扫描QR", manageCategories:"管理分类", stockInOut:"库存进出", stockHistory:"库存历史", inventoryReport:"库存报告", lowStockReport:"低库存报告", manageStaff:"管理员工", changePassword:"修改密码", settings:"设置", reports:"报告", users:"用户", stock:"库存", categories:"分类", qrCode:"二维码" , staff:"员工", staffMember:"员工成员", itemDetails:"物品详情", scanQrCode:"扫描QR码", stockIn:"入库", stockOut:"出库", lowStock:"低库存", lowStockItems:"低库存物品", qrScan:"QR扫码"},
  ar: { dashboard:"لوحة القيادة", inventory:"المخزون", search:"بحث في المخزون...", logout:"تسجيل خروج", notifications:"إشعارات", customize:"تخصيص", language:"اللغة", profile:"الملف الشخصي", admin:"مدير", administrator:"مسؤول النظام", viewItems:"عرض العناصر", addItems:"إضافة عناصر", manageItems:"إدارة العناصر", generateQr:"إنشاء QR", scanQr:"مسح QR", manageCategories:"إدارة الفئات", stockInOut:"المخزون الداخل/الخارج", stockHistory:"تاريخ المخزون", inventoryReport:"تقرير المخزون", lowStockReport:"تقرير المخزون المنخفض", manageStaff:"إدارة الموظفين", changePassword:"تغيير كلمة المرور", settings:"الإعدادات", reports:"التقارير", users:"المستخدمون", stock:"المخزون", categories:"الفئات", qrCode:"رمز QR" , staff:"موظف", staffMember:"عضو الفريق", itemDetails:"تفاصيل العنصر", scanQrCode:"مسح رمز QR", stockIn:"مخزون داخل", stockOut:"مخزون خارج", lowStock:"مخزون منخفض", lowStockItems:"عناصر مخزون منخفض", qrScan:"مسح QR"},
  fr: { dashboard:"Tableau de bord", inventory:"Inventaire", search:"Rechercher inventaire...", logout:"Déconnexion", notifications:"Notifications", customize:"Personnaliser", language:"Langue", profile:"Profil", admin:"Admin", administrator:"Administrateur", viewItems:"Voir les articles", addItems:"Ajouter articles", manageItems:"Gérer articles", generateQr:"Générer QR", scanQr:"Scanner QR", manageCategories:"Gérer catégories", stockInOut:"Stock entrée/sortie", stockHistory:"Historique stock", inventoryReport:"Rapport inventaire", lowStockReport:"Rapport stock faible", manageStaff:"Gérer le personnel", changePassword:"Changer mot de passe", settings:"Paramètres", reports:"Rapports", users:"Utilisateurs", stock:"Stock", categories:"Catégories", qrCode:"Code QR" , staff:"Personnel", staffMember:"Membre du personnel", itemDetails:"Détails article", scanQrCode:"Scanner le QR Code", stockIn:"Entrée stock", stockOut:"Sortie stock", lowStock:"Stock bas", lowStockItems:"Articles stock bas", qrScan:"Scan QR"},
  de: { dashboard:"Übersicht", inventory:"Inventar", search:"Inventar suchen...", logout:"Abmelden", notifications:"Benachrichtigungen", customize:"Anpassen", language:"Sprache", profile:"Profil", admin:"Admin", administrator:"Administrator", viewItems:"Artikel anzeigen", addItems:"Artikel hinzufügen", manageItems:"Artikel verwalten", generateQr:"QR erstellen", scanQr:"QR scannen", manageCategories:"Kategorien verwalten", stockInOut:"Lager Ein/Aus", stockHistory:"Lagerhistorie", inventoryReport:"Inventarbericht", lowStockReport:"Niedrigbestandsbericht", manageStaff:"Personal verwalten", changePassword:"Passwort ändern", settings:"Einstellungen", reports:"Berichte", users:"Benutzer", stock:"Lager", categories:"Kategorien", qrCode:"QR-Code" , staff:"Personal", staffMember:"Mitarbeiter", itemDetails:"Artikeldetails", scanQrCode:"QR-Code scannen", stockIn:"Lager Eingang", stockOut:"Lager Ausgang", lowStock:"Niedriger Bestand", lowStockItems:"Artikel niedriger Bestand", qrScan:"QR-Scan"},
  ja: { dashboard:"ダッシュボード", inventory:"在庫", search:"在庫・注文を検索...", logout:"ログアウト", notifications:"通知", customize:"カスタマイズ", language:"言語", profile:"プロフィール", admin:"管理者", administrator:"システム管理者", viewItems:"商品一覧", addItems:"商品追加", manageItems:"商品管理", generateQr:"QR生成", scanQr:"QRスキャン", manageCategories:"カテゴリ管理", stockInOut:"入出庫", stockHistory:"在庫履歴", inventoryReport:"在庫レポート", lowStockReport:"低在庫レポート", manageStaff:"スタッフ管理", changePassword:"パスワード変更", settings:"設定", reports:"レポート", users:"ユーザー", stock:"在庫", categories:"カテゴリ", qrCode:"QRコード" , staff:"スタッフ", staffMember:"スタッフ", itemDetails:"商品詳細", scanQrCode:"QRコードをスキャン", stockIn:"入庫", stockOut:"出庫", lowStock:"在庫不足", lowStockItems:"在庫不足商品", qrScan:"QRスキャン"},
  ko: { dashboard:"대시보드", inventory:"재고", search:"재고, 주문 검색...", logout:"로그아웃", notifications:"알림", customize:"사용자화", language:"언어", profile:"프로필", admin:"관리자", administrator:"시스템 관리자", viewItems:"아이템 보기", addItems:"아이템 추가", manageItems:"아이템 관리", generateQr:"QR 생성", scanQr:"QR 스캔", manageCategories:"카테고리 관리", stockInOut:"재고 입출고", stockHistory:"재고 기록", inventoryReport:"재고 보고서", lowStockReport:"부족 재고 보고서", manageStaff:"직원 관리", changePassword:"비밀번호 변경", settings:"설정", reports:"보고서", users:"사용자", stock:"재고", categories:"카테고리", qrCode:"QR 코드" , staff:"직원", staffMember:"팀원", itemDetails:"아이템 상세", scanQrCode:"QR 코드 스캔", stockIn:"입고", stockOut:"출고", lowStock:"재고 부족", lowStockItems:"재고 부족 아이템", qrScan:"QR 스캔"},
  hi: { dashboard:"डैशबोर्ड", inventory:"सूची", search:"सूची, ऑर्डर खोजें...", logout:"लॉग आउट", notifications:"सूचनाएं", customize:"अनुकूलित करें", language:"भाषा", profile:"प्रोफ़ाइल", admin:"व्यवस्थापक", administrator:"सिस्टम व्यवस्थापक", viewItems:"आइटम देखें", addItems:"आइटम जोड़ें", manageItems:"आइटम प्रबंधित करें", generateQr:"QR बनाएं", scanQr:"QR स्कैन करें", manageCategories:"श्रेणियाँ प्रबंधित करें", stockInOut:"स्टॉक आवक/जावक", stockHistory:"स्टॉक इतिहास", inventoryReport:"सूची रिपोर्ट", lowStockReport:"कम स्टॉक रिपोर्ट", manageStaff:"स्टाफ प्रबंधित करें", changePassword:"पासवर्ड बदलें", settings:"सेटिंग्स", reports:"रिपोर्ट", users:"उपयोगकर्ता", stock:"स्टॉक", categories:"श्रेणियाँ", qrCode:"QR कोड" , staff:"स्टाफ", staffMember:"स्टाफ सदस्य", itemDetails:"आइटम विवरण", scanQrCode:"QR कोड स्कैन करें", stockIn:"स्टॉक इन", stockOut:"स्टॉक आउट", lowStock:"कम स्टॉक", lowStockItems:"कम स्टॉक आइटम", qrScan:"QR स्कैन"},
  pt: { dashboard:"Painel", inventory:"Inventário", search:"Pesquisar inventário...", logout:"Sair", notifications:"Notificações", customize:"Personalizar", language:"Idioma", profile:"Perfil", admin:"Admin", administrator:"Administrador", viewItems:"Ver itens", addItems:"Adicionar itens", manageItems:"Gerenciar itens", generateQr:"Gerar QR", scanQr:"Escanear QR", manageCategories:"Gerenciar categorias", stockInOut:"Estoque entrada/saída", stockHistory:"Histórico de estoque", inventoryReport:"Relatório de inventário", lowStockReport:"Relatório de estoque baixo", manageStaff:"Gerenciar equipe", changePassword:"Alterar senha", settings:"Configurações", reports:"Relatórios", users:"Usuários", stock:"Estoque", categories:"Categorias", qrCode:"Código QR" , staff:"Funcionário", staffMember:"Membro da equipe", itemDetails:"Detalhes do item", scanQrCode:"Escanear código QR", stockIn:"Entrada de estoque", stockOut:"Saída de estoque", lowStock:"Estoque baixo", lowStockItems:"Itens estoque baixo", qrScan:"Escaneamento QR"},
  es: { dashboard:"Panel", inventory:"Inventario", search:"Buscar inventario...", logout:"Cerrar sesión", notifications:"Notificaciones", customize:"Personalizar", language:"Idioma", profile:"Perfil", admin:"Admin", administrator:"Administrador", viewItems:"Ver artículos", addItems:"Agregar artículos", manageItems:"Gestionar artículos", generateQr:"Generar QR", scanQr:"Escanear QR", manageCategories:"Gestionar categorías", stockInOut:"Entrada/Salida de stock", stockHistory:"Historial de stock", inventoryReport:"Informe de inventario", lowStockReport:"Informe de stock bajo", manageStaff:"Gestionar personal", changePassword:"Cambiar contraseña", settings:"Configuración", reports:"Informes", users:"Usuarios", stock:"Stock", categories:"Categorías", qrCode:"Código QR" , staff:"Personal", staffMember:"Miembro del personal", itemDetails:"Detalles del artículo", scanQrCode:"Escanear código QR", stockIn:"Entrada de stock", stockOut:"Salida de stock", lowStock:"Stock bajo", lowStockItems:"Artículos stock bajo", qrScan:"Escaneo QR"},
  id: { dashboard:"Dasbor", inventory:"Inventaris", search:"Cari inventaris...", logout:"Keluar", notifications:"Notifikasi", customize:"Sesuaikan", language:"Bahasa", profile:"Profil", admin:"Admin", administrator:"Administrator", viewItems:"Lihat Barang", addItems:"Tambah Barang", manageItems:"Kelola Barang", generateQr:"Buat QR", scanQr:"Pindai QR", manageCategories:"Kelola Kategori", stockInOut:"Stok Masuk/Keluar", stockHistory:"Riwayat Stok", inventoryReport:"Laporan Inventaris", lowStockReport:"Laporan Stok Rendah", manageStaff:"Kelola Staf", changePassword:"Ganti Kata Sandi", settings:"Pengaturan", reports:"Laporan", users:"Pengguna", stock:"Stok", categories:"Kategori", qrCode:"Kode QR" , staff:"Staf", staffMember:"Anggota Staf", itemDetails:"Detail Barang", scanQrCode:"Pindai Kode QR", stockIn:"Stok Masuk", stockOut:"Stok Keluar", lowStock:"Stok Rendah", lowStockItems:"Barang Stok Rendah", qrScan:"Pindai QR"},
  th: { dashboard:"แดชบอร์ด", inventory:"คลังสินค้า", search:"ค้นหาสินค้า...", logout:"ออกจากระบบ", notifications:"การแจ้งเตือน", customize:"ปรับแต่ง", language:"ภาษา", profile:"โปรไฟล์", admin:"แอดมิน", administrator:"ผู้ดูแลระบบ", viewItems:"ดูสินค้า", addItems:"เพิ่มสินค้า", manageItems:"จัดการสินค้า", generateQr:"สร้าง QR", scanQr:"สแกน QR", manageCategories:"จัดการหมวดหมู่", stockInOut:"สต็อกเข้า/ออก", stockHistory:"ประวัติสต็อก", inventoryReport:"รายงานคลัง", lowStockReport:"รายงานสต็อกต่ำ", manageStaff:"จัดการพนักงาน", changePassword:"เปลี่ยนรหัสผ่าน", settings:"ตั้งค่า", reports:"รายงาน", users:"ผู้ใช้", stock:"สต็อก", categories:"หมวดหมู่", qrCode:"คิวอาร์โค้ด" , staff:"พนักงาน", staffMember:"สมาชิกทีม", itemDetails:"รายละเอียดสินค้า", scanQrCode:"สแกนคิวอาร์โค้ด", stockIn:"สต็อกเข้า", stockOut:"สต็อกออก", lowStock:"สต็อกต่ำ", lowStockItems:"สินค้าสต็อกต่ำ", qrScan:"สแกน QR"},
  vi: { dashboard:"Bảng điều khiển", inventory:"Hàng tồn kho", search:"Tìm kiếm hàng tồn...", logout:"Đăng xuất", notifications:"Thông báo", customize:"Tùy chỉnh", language:"Ngôn ngữ", profile:"Hồ sơ", admin:"Quản trị", administrator:"Quản trị viên", viewItems:"Xem hàng", addItems:"Thêm hàng", manageItems:"Quản lý hàng", generateQr:"Tạo QR", scanQr:"Quét QR", manageCategories:"Quản lý danh mục", stockInOut:"Nhập/Xuất kho", stockHistory:"Lịch sử kho", inventoryReport:"Báo cáo tồn kho", lowStockReport:"Báo cáo tồn kho thấp", manageStaff:"Quản lý nhân viên", changePassword:"Đổi mật khẩu", settings:"Cài đặt", reports:"Báo cáo", users:"Người dùng", stock:"Kho", categories:"Danh mục", qrCode:"Mã QR" , staff:"Nhân viên", staffMember:"Thành viên nhóm", itemDetails:"Chi tiết hàng", scanQrCode:"Quét mã QR", stockIn:"Nhập kho", stockOut:"Xuất kho", lowStock:"Tồn kho thấp", lowStockItems:"Hàng tồn kho thấp", qrScan:"Quét QR"},
  tr: { dashboard:"Gösterge Paneli", inventory:"Envanter", search:"Envanter ara...", logout:"Çıkış Yap", notifications:"Bildirimler", customize:"Özelleştir", language:"Dil", profile:"Profil", admin:"Yönetici", administrator:"Sistem Yöneticisi", viewItems:"Öğeleri Görüntüle", addItems:"Öğe Ekle", manageItems:"Öğeleri Yönet", generateQr:"QR Oluştur", scanQr:"QR Tara", manageCategories:"Kategorileri Yönet", stockInOut:"Stok Giriş/Çıkış", stockHistory:"Stok Geçmişi", inventoryReport:"Envanter Raporu", lowStockReport:"Düşük Stok Raporu", manageStaff:"Personel Yönet", changePassword:"Şifre Değiştir", settings:"Ayarlar", reports:"Raporlar", users:"Kullanıcılar", stock:"Stok", categories:"Kategoriler", qrCode:"QR Kodu" , staff:"Personel", staffMember:"Personel Üyesi", itemDetails:"Öğe Detayları", scanQrCode:"QR Kodunu Tara", stockIn:"Stok Girişi", stockOut:"Stok Çıkışı", lowStock:"Düşük Stok", lowStockItems:"Düşük Stoklu Ürünler", qrScan:"QR Tarama"},
  ru: { dashboard:"Панель управления", inventory:"Инвентарь", search:"Поиск инвентаря...", logout:"Выйти", notifications:"Уведомления", customize:"Настроить", language:"Язык", profile:"Профиль", admin:"Администратор", administrator:"Системный администратор", viewItems:"Просмотр товаров", addItems:"Добавить товары", manageItems:"Управление товарами", generateQr:"Создать QR", scanQr:"Сканировать QR", manageCategories:"Управление категориями", stockInOut:"Приход/Расход", stockHistory:"История склада", inventoryReport:"Отчёт по инвентарю", lowStockReport:"Отчёт о малом остатке", manageStaff:"Управление персоналом", changePassword:"Изменить пароль", settings:"Настройки", reports:"Отчёты", users:"Пользователи", stock:"Склад", categories:"Категории", qrCode:"QR-код" , staff:"Персонал", staffMember:"Сотрудник", itemDetails:"Детали товара", scanQrCode:"Сканировать QR-код", stockIn:"Приход", stockOut:"Расход", lowStock:"Малый остаток", lowStockItems:"Товары малый остаток", qrScan:"QR-сканирование"},
  ta: { dashboard:"டாஷ்போர்டு", inventory:"சரக்கு", search:"சரக்கு தேடு...", logout:"வெளியேறு", notifications:"அறிவிப்புகள்", customize:"தனிப்பயனாக்கு", language:"மொழி", profile:"சுயவிவரம்", admin:"நிர்வாகி", administrator:"கணினி நிர்வாகி", viewItems:"பொருட்களை காண்க", addItems:"பொருட்கள் சேர்", manageItems:"பொருட்கள் நிர்வகி", generateQr:"QR உருவாக்கு", scanQr:"QR ஸ்கேன்", manageCategories:"வகைகள் நிர்வகி", stockInOut:"சரக்கு உள்/வெளி", stockHistory:"சரக்கு வரலாறு", inventoryReport:"சரக்கு அறிக்கை", lowStockReport:"குறைந்த சரக்கு அறிக்கை", manageStaff:"ஊழியர்கள் நிர்வகி", changePassword:"கடவுச்சொல் மாற்று", settings:"அமைப்புகள்", reports:"அறிக்கைகள்", users:"பயனர்கள்", stock:"சரக்கு", categories:"வகைகள்", qrCode:"QR குறியீடு" , staff:"ஊழியர்", staffMember:"குழு உறுப்பினர்", itemDetails:"பொருள் விவரங்கள்", scanQrCode:"QR குறியீட்டை ஸ்கேன்", stockIn:"சரக்கு வரவு", stockOut:"சரக்கு செலவு", lowStock:"குறைந்த சரக்கு", lowStockItems:"குறைந்த சரக்கு பொருட்கள்", qrScan:"QR ஸ்கேன்"},
  bn: { dashboard:"ড্যাশবোর্ড", inventory:"তালিকা", search:"তালিকা খুঁজুন...", logout:"লগ আউট", notifications:"বিজ্ঞপ্তি", customize:"কাস্টমাইজ", language:"ভাষা", profile:"প্রোফাইল", admin:"প্রশাসক", administrator:"সিস্টেম প্রশাসক", viewItems:"আইটেম দেখুন", addItems:"আইটেম যোগ করুন", manageItems:"আইটেম পরিচালনা", generateQr:"QR তৈরি করুন", scanQr:"QR স্ক্যান", manageCategories:"বিভাগ পরিচালনা", stockInOut:"স্টক ইন/আউট", stockHistory:"স্টক ইতিহাস", inventoryReport:"তালিকা রিপোর্ট", lowStockReport:"কম স্টক রিপোর্ট", manageStaff:"কর্মীদের পরিচালনা", changePassword:"পাসওয়ার্ড পরিবর্তন", settings:"সেটিংস", reports:"রিপোর্ট", users:"ব্যবহারকারীরা", stock:"স্টক", categories:"বিভাগ", qrCode:"QR কোড" , staff:"কর্মী", staffMember:"দলের সদস্য", itemDetails:"আইটেম বিবরণ", scanQrCode:"QR কোড স্ক্যান করুন", stockIn:"স্টক ইন", stockOut:"স্টক আউট", lowStock:"কম স্টক", lowStockItems:"কম স্টক আইটেম", qrScan:"QR স্ক্যান"},
  nl: { dashboard:"Dashboard", inventory:"Inventaris", search:"Inventaris zoeken...", logout:"Uitloggen", notifications:"Meldingen", customize:"Aanpassen", language:"Taal", profile:"Profiel", admin:"Beheerder", administrator:"Systeembeheerder", viewItems:"Artikelen bekijken", addItems:"Artikelen toevoegen", manageItems:"Artikelen beheren", generateQr:"QR genereren", scanQr:"QR scannen", manageCategories:"Categorieën beheren", stockInOut:"Voorraad in/uit", stockHistory:"Voorraadgeschiedenis", inventoryReport:"Inventarisrapport", lowStockReport:"Laag voorraadrapport", manageStaff:"Personeel beheren", changePassword:"Wachtwoord wijzigen", settings:"Instellingen", reports:"Rapporten", users:"Gebruikers", stock:"Voorraad", categories:"Categorieën", qrCode:"QR-code" , staff:"Personeel", staffMember:"Teamlid", itemDetails:"Artikeldetails", scanQrCode:"QR-code scannen", stockIn:"Voorraad in", stockOut:"Voorraad uit", lowStock:"Lage voorraad", lowStockItems:"Artikelen lage voorraad", qrScan:"QR-scan"},
  it: { dashboard:"Dashboard", inventory:"Inventario", search:"Cerca inventario...", logout:"Esci", notifications:"Notifiche", customize:"Personalizza", language:"Lingua", profile:"Profilo", admin:"Amministratore", administrator:"Amministratore di sistema", viewItems:"Visualizza articoli", addItems:"Aggiungi articoli", manageItems:"Gestisci articoli", generateQr:"Genera QR", scanQr:"Scansiona QR", manageCategories:"Gestisci categorie", stockInOut:"Entrata/Uscita magazzino", stockHistory:"Storico magazzino", inventoryReport:"Report inventario", lowStockReport:"Report scorte basse", manageStaff:"Gestisci personale", changePassword:"Cambia password", settings:"Impostazioni", reports:"Report", users:"Utenti", stock:"Magazzino", categories:"Categorie", qrCode:"Codice QR" , staff:"Personale", staffMember:"Membro del team", itemDetails:"Dettagli articolo", scanQrCode:"Scansiona il codice QR", stockIn:"Entrata magazzino", stockOut:"Uscita magazzino", lowStock:"Scorte basse", lowStockItems:"Articoli scorte basse", qrScan:"Scansione QR"},
};

export const PRIMARY_COLORS = [
  { color:"#3b82f6", label:"Blue" },   { color:"#6366f1", label:"Indigo" },
  { color:"#8b5cf6", label:"Violet" }, { color:"#ec4899", label:"Pink" },
  { color:"#ef4444", label:"Red" },    { color:"#f97316", label:"Orange" },
  { color:"#f59e0b", label:"Amber" },  { color:"#10b981", label:"Emerald" },
  { color:"#14b8a6", label:"Teal" },   { color:"#06b6d4", label:"Cyan" },
  { color:"#4a7c6a", label:"Sage" },   { color:"#64748b", label:"Slate" },
];

const THEMES: { name: ThemeName; label: string; preview: [string, string, string] }[] = [
  { name:"light",    label:"Light",    preview:["#f4f6fb","#ffffff","#3b82f6"] },
  { name:"dark",     label:"Dark",     preview:["#0f172a","#1e293b","#3b82f6"] },
  { name:"retro",    label:"Retro",    preview:["#f0ebe3","#e8e2d8","#4a7c6a"] },
  { name:"arctic",   label:"Arctic",   preview:["#f0f9ff","#e0f2fe","#0ea5e9"] },
  { name:"nature",   label:"Nature",   preview:["#f0fdf4","#dcfce7","#22c55e"] },
  { name:"ember",    label:"Ember",    preview:["#fff7ed","#ffedd5","#f97316"] },
  { name:"dracula",  label:"Dracula",  preview:["#282a36","#1e1f2b","#bd93f9"] },
  { name:"midnight", label:"Midnight", preview:["#0d0d1a","#13132a","#6366f1"] },
  { name:"rose",     label:"Rose",     preview:["#fff1f2","#ffe4e6","#e11d48"] },
  { name:"slate",    label:"Slate",    preview:["#f8fafc","#f1f5f9","#64748b"] },
];

/* ══════════════════════════════════════════════════════════
   THEME PROVIDER — injects CSS vars for scrollbar
══════════════════════════════════════════════════════════ */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const get = (k: string, fb: string) => localStorage.getItem(k) || fb;
  const [theme,          setThemeRaw]         = useState<ThemeName>(get("iim_staff_theme","light") as ThemeName);
  const [primary,        setPrimaryRaw]       = useState(get("iim_staff_primary","#3b82f6"));
  const [navLayout,      setNavLayoutRaw]     = useState<NavLayout>(get("iim_staff_nav","topnav") as NavLayout);
  const [sidenavShape,   setSidenavShapeRaw]  = useState<SidenavShape>(get("iim_staff_shape","default") as SidenavShape);
  const [fontFamily,     setFontFamilyRaw]    = useState<FontFamily>(get("iim_staff_font","system-ui, sans-serif") as FontFamily);
  const [fontSize,       setFontSizeRaw]      = useState<FontSize>(get("iim_staff_size","md") as FontSize);
  const [language,       setLanguageRaw]      = useState(get("iim_staff_lang","en"));
  const [sidebarOpen,    setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedRaw] = useState(localStorage.getItem("iim_staff_collapsed") === "true");
  const [customizeOpen,  setCustomizeOpen]    = useState(false);

  const p = (k: string, v: string) => localStorage.setItem(k, v);
  const setTheme        = (t: ThemeName)    => { setThemeRaw(t);        p("iim_staff_theme", t); };
  const setPrimary      = (c: string)       => { setPrimaryRaw(c);      p("iim_staff_primary", c); };
  const setNavLayout    = (n: NavLayout)    => { setNavLayoutRaw(n);    p("iim_staff_nav", n); };
  const setSidenavShape = (s: SidenavShape) => { setSidenavShapeRaw(s); p("iim_staff_shape", s); };
  const setFontFamily   = (f: FontFamily)   => { setFontFamilyRaw(f);   p("iim_staff_font", f); };
  const setFontSize     = (s: FontSize)     => { setFontSizeRaw(s);     p("iim_staff_size", s); };
  const setLanguage     = (l: string)       => { setLanguageRaw(l);     p("iim_staff_lang", l); };
  const setSidebarCollapsed = (v: boolean)  => { setSidebarCollapsedRaw(v); p("iim_staff_collapsed", String(v)); };

  const tokens = THEME_TOKENS[theme];

  // Inject CSS variables on <html> — scrollbar, font size, card radius
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--scroll-primary", primary);
    root.style.setProperty("--scroll-bg", tokens.border);
    root.style.setProperty("--scroll-hover", primary + "cc");
  }, [primary, tokens.border]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = FONT_SIZES[fontSize];
    root.style.setProperty("--base-font-size", FONT_SIZES[fontSize]);
  }, [fontSize]);

  // Restore card-radius from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("iim_staff_radius") || "12px";
    document.documentElement.style.setProperty("--card-radius", saved);
  }, []);

  const translate = useCallback((key: string) => {
    return UI_TRANSLATIONS[language]?.[key] || UI_TRANSLATIONS["en"][key] || key;
  }, [language]);

  // Build currency converter from language
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const currentCurrencySymbol = (currentLang as typeof currentLang & { currency?: string }).currency || "$";
  // CURRENCY_RATES is defined below LanguageDropdown — reference via inline lookup
  const RATES: Record<string, { rate: number; code: string }> = {
    "$":    { rate: 1,       code: "USD" },
    "RM":   { rate: 4.70,   code: "MYR" },
    "¥":    { rate: 149.5,  code: "JPY" },
    "ريال": { rate: 3.75,   code: "SAR" },
    "€":    { rate: 0.92,   code: "EUR" },
    "₩":    { rate: 1330,   code: "KRW" },
    "₹":    { rate: 83.5,   code: "INR" },
    "R$":   { rate: 4.97,   code: "BRL" },
    "Rp":   { rate: 15600,  code: "IDR" },
    "฿":    { rate: 35.2,   code: "THB" },
    "₫":    { rate: 24400,  code: "VND" },
    "₺":    { rate: 32.1,   code: "TRY" },
    "₽":    { rate: 92.5,   code: "RUB" },
    "৳":    { rate: 110,    code: "BDT" },
  };
  const rateEntry = RATES[currentCurrencySymbol] || { rate: 1, code: "USD" };
  const convertCurrency = useCallback((usdAmount: number): string => {
    const converted = usdAmount * rateEntry.rate;
    if (converted >= 1_000_000) return `${currentCurrencySymbol}${(converted / 1_000_000).toFixed(1)}M`;
    if (converted >= 1_000)     return `${currentCurrencySymbol}${(converted / 1_000).toFixed(1)}K`;
    return `${currentCurrencySymbol}${Math.round(converted).toLocaleString()}`;
  }, [currentCurrencySymbol, rateEntry.rate]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, primary, setPrimary, navLayout, setNavLayout, sidenavShape, setSidenavShape, fontFamily, setFontFamily, fontSize, setFontSize, language, setLanguage, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, customizeOpen, setCustomizeOpen, tokens, t: translate }}>
      <CurrencyContext.Provider value={{ currency: currentCurrencySymbol, convert: convertCurrency }}>
        <div style={{ fontFamily, background: tokens.bg, minHeight:"100vh", transition:"background 0.3s, color 0.3s", color: tokens.text }}>
          {children}
        </div>
      </CurrencyContext.Provider>
    </ThemeContext.Provider>
  );
};

/* ══════════════════════════════════════════════════════════
   ICON
══════════════════════════════════════════════════════════ */
const Icon = ({ d, size = 20, style }: { d: string | string[]; size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((pp, i) => <path key={i} d={pp} />) : <path d={d} />}
  </svg>
);

/* ══════════════════════════════════════════════════════════
   LANGUAGE SELECTOR — Shows flag + native name, embedded in topbar
   (replaces the separate customize icon next to language)
══════════════════════════════════════════════════════════ */
/* ── Flag image helper ── */
const FlagIcon = ({ lang, size = 24, circle = false }: { lang: typeof LANGUAGES[0]; size?: number; circle?: boolean }) => {
  const iso = lang.cdnCode || lang.code;
  return (
    <span
      className={`fi fi-${iso}${circle ? " fis" : ""}`}
      style={{
        width: size,
        height: circle ? size : Math.round(size * 0.67),
        borderRadius: circle ? "50%" : 4,
        display: "inline-block",
        flexShrink: 0,
        fontSize: size,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      title={lang.label}
    />
  );
};

/* ── Currency conversion rates (base: USD) ── */
const CURRENCY_RATES: Record<string, { rate: number; name: string; code: string }> = {
  "$":    { rate: 1,       name: "US Dollar",      code: "USD" },
  "RM":   { rate: 4.70,   name: "Malaysian Ringgit", code: "MYR" },
  "¥":    { rate: 149.5,  name: "Japanese Yen",    code: "JPY" },
  "ريال": { rate: 3.75,   name: "Saudi Riyal",     code: "SAR" },
  "€":    { rate: 0.92,   name: "Euro",            code: "EUR" },
  "₩":    { rate: 1330,   name: "Korean Won",      code: "KRW" },
  "₹":    { rate: 83.5,   name: "Indian Rupee",    code: "INR" },
  "R$":   { rate: 4.97,   name: "Brazilian Real",  code: "BRL" },
  "Rp":   { rate: 15600,  name: "Indonesian Rupiah", code: "IDR" },
  "฿":    { rate: 35.2,   name: "Thai Baht",       code: "THB" },
  "₫":    { rate: 24400,  name: "Vietnamese Dong", code: "VND" },
  "₺":    { rate: 32.1,   name: "Turkish Lira",    code: "TRY" },
  "₽":    { rate: 92.5,   name: "Russian Ruble",   code: "RUB" },
  "৳":    { rate: 110,    name: "Bangladeshi Taka", code: "BDT" },
};

/* ── Currency context for app-wide currency conversion ── */
export const CurrencyContext = React.createContext<{ currency: string; convert: (usd: number) => string }>({
  currency: "$", convert: (v) => `$${v.toLocaleString()}`,
});
export const useCurrency = () => React.useContext(CurrencyContext);

export const LanguageDropdown = () => {
  const { language, setLanguage, tokens, primary } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const currentCurrency = (current as typeof current & { currency?: string }).currency || "$";
  const rateInfo = CURRENCY_RATES[currentCurrency];

  const filtered = search.trim()
    ? LANGUAGES.filter(l =>
        l.label.toLowerCase().includes(search.toLowerCase()) ||
        l.native.toLowerCase().includes(search.toLowerCase()) ||
        (CURRENCY_RATES[(l as typeof l & { currency?: string }).currency || "$"]?.code || "").toLowerCase().includes(search.toLowerCase())
      )
    : LANGUAGES;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger button ── */}
      <button
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm transition-all"
        style={{
          background: open ? `${primary}18` : tokens.cardHover,
          color: tokens.text,
          border: `1.5px solid ${open ? primary : tokens.border}`,
        }}
        title="Language & Currency"
      >
        <FlagIcon lang={current} size={18} />
        <span className="text-xs font-semibold hidden sm:block" style={{ minWidth: 24, color: tokens.text }}>{current.native}</span>
        <span className="text-[10px] font-bold hidden md:block px-1.5 py-0.5 rounded-md" style={{ background:`${primary}18`, color:primary }}>{rateInfo?.code || currentCurrency}</span>
        <Icon d="M6 9l6 6 6-6" size={11} style={{ color: tokens.muted }} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => { setOpen(false); setSearch(""); }} />
          <div
            className="fixed sm:absolute rounded-2xl shadow-2xl z-[100] overflow-hidden"
            style={{
              width: "min(280px, calc(100vw - 16px))",
              right: 8,
              top: 56,
              ...(typeof window !== "undefined" && window.innerWidth >= 640 ? { position: "absolute" as const, top: undefined, right: 0 } : {}),
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div className="px-4 pt-3.5 pb-2.5" style={{ borderBottom:`1px solid ${tokens.border}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: tokens.muted }}>Language & Currency</p>
              {/* Current currency info card */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background:`${primary}10`, border:`1px solid ${primary}25` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background:`${primary}20`, color:primary }}>
                  {currentCurrency}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color:tokens.text }}>{rateInfo?.name || "Currency"}</p>
                  <p className="text-[10px]" style={{ color:tokens.muted }}>1 USD = {rateInfo ? rateInfo.rate.toLocaleString() : "1"} {rateInfo?.code}</p>
                </div>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${primary}20`, color:primary }}>{rateInfo?.code}</span>
              </div>
              {/* Search */}
              <div className="relative mt-2.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:tokens.muted, pointerEvents:"none" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search language or currency…"
                  autoFocus
                  className="w-full rounded-xl text-xs outline-none py-2"
                  style={{
                    paddingLeft: 30,
                    paddingRight: 10,
                    background: tokens.cardHover,
                    color: tokens.text,
                    border: `1px solid ${tokens.border}`,
                  }}
                />
              </div>
            </div>

            {/* Language list — uses themed scrollbar via CSS vars */}
            <div className="overflow-y-auto" style={{ maxHeight: 260, scrollbarWidth:"thin", scrollbarColor:`${primary} ${tokens.border}` }}>
              {filtered.map(lang => {
                const isActive = language === lang.code;
                const langCurrency = (lang as typeof lang & { currency?: string }).currency || "$";
                const langRate = CURRENCY_RATES[langCurrency];
                return (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setOpen(false); setSearch(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                    style={{
                      background: isActive ? `${primary}12` : "transparent",
                      borderLeft: `3px solid ${isActive ? primary : "transparent"}`,
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = tokens.cardHover; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: 28, height: 28, border: `2px solid ${isActive ? primary : tokens.border}` }}>
                      <FlagIcon lang={lang} size={28} circle />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: isActive ? primary : tokens.text }}>{lang.native}</p>
                      <p className="text-[10px]" style={{ color: tokens.muted }}>{lang.label}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold" style={{ color: isActive ? primary : tokens.text }}>{langCurrency}</p>
                      <p className="text-[10px]" style={{ color: tokens.muted }}>{langRate?.code || ""}</p>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-6 text-center text-sm" style={{ color:tokens.muted }}>No results found</div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop:`1px solid ${tokens.border}` }}>
              <span className="text-xs" style={{ color:tokens.muted }}>{LANGUAGES.length} languages</span>
              <button
                onClick={() => { setOpen(false); setSearch(""); }}
                className="text-xs px-2.5 py-1 rounded-lg transition-all font-medium"
                style={{ color:tokens.sub, background:tokens.cardHover, border:`1px solid ${tokens.border}` }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   CUSTOMIZE PANEL (dropdown — mirrors LanguageDropdown layout)
══════════════════════════════════════════════════════════ */
const CustomizePanel = () => {
  const { theme, setTheme, primary, setPrimary, sidenavShape: _sn, setSidenavShape: _ssn, fontFamily, setFontFamily, fontSize, setFontSize, customizeOpen, setCustomizeOpen, tokens, t } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [customColor, setCustomColor] = useState(primary);
  const [cardRadius, setCardRadius] = useState<string>(() => localStorage.getItem("iim_staff_radius") || "12px");

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setCustomizeOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [setCustomizeOpen]);

  const applyRadius = (val: string) => {
    document.documentElement.style.setProperty("--card-radius", val);
    localStorage.setItem("iim_staff_radius", val);
    setCardRadius(val);
  };

  const reset = () => {
    setTheme("light"); setPrimary("#3b82f6"); setCustomColor("#3b82f6");
    setFontFamily("system-ui, sans-serif"); setFontSize("md");
    applyRadius("12px");
  };

  const Section = ({ title, icon, children }: { title: string; icon: string | string[]; children: React.ReactNode }) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2.5" style={{ borderBottom: `1px solid ${tokens.border}`, paddingBottom: 6 }}>
        <Icon d={icon} size={12} style={{ color: primary }} />
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tokens.muted }}>{title}</p>
      </div>
      {children}
    </div>
  );

  if (!customizeOpen) return null;

  return (
    <div ref={ref} className="relative" style={{ position: "static" }}>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 z-[90] sm:hidden" onClick={() => setCustomizeOpen(false)} />

      {/* Dropdown panel — mirrors LanguageDropdown positioning */}
      <div
        className="fixed sm:absolute rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col"
        style={{
          width: "min(300px, calc(100vw - 16px))",
          right: 8,
          top: 56,
          maxHeight: "calc(100vh - 72px)",
          ...(typeof window !== "undefined" && window.innerWidth >= 640
            ? { position: "absolute" as const, top: undefined, right: 0 }
            : {}),
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.muted }}>{t("customize")}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={reset} className="text-[10px] px-2 py-1 rounded-lg font-semibold" style={{ background: tokens.cardHover, color: tokens.sub }}>↺ Reset</button>
              <button onClick={() => setCustomizeOpen(false)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: tokens.cardHover, color: tokens.muted }}>
                <Icon d="M18 6 6 18M6 6l12 12" size={12} />
              </button>
            </div>
          </div>
          {/* Active theme badge */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: `${primary}10`, border: `1px solid ${primary}25` }}>
            <div className="flex rounded-md overflow-hidden flex-shrink-0 shadow-sm" style={{ width: 28, height: 20 }}>
              {(() => { const t2 = THEMES.find(t => t.name === theme) || THEMES[0]; return (<><div style={{ width:"40%", background:t2.preview[0] }}/><div style={{ width:"40%", background:t2.preview[1] }}/><div style={{ width:"20%", background:t2.preview[2] }}/></>); })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: tokens.text }}>{THEMES.find(t => t.name === theme)?.label || theme} Theme</p>
              <p className="text-[10px]" style={{ color: tokens.muted }}>Primary: {primary.toUpperCase()}</p>
            </div>
            <div className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" style={{ background: primary }} />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 420, scrollbarWidth: "thin", scrollbarColor: `${primary} ${tokens.border}` }}>

          {/* Theme */}
          <Section title="Theme" icon="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3z">
            <div className="grid grid-cols-2 gap-1.5">
              {THEMES.map(t2 => (
                <button key={t2.name} onClick={() => setTheme(t2.name)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: theme===t2.name?`${primary}15`:tokens.cardHover, border:`1.5px solid ${theme===t2.name?primary:"transparent"}`, color: theme===t2.name?primary:tokens.text }}>
                  <div className="flex rounded-md overflow-hidden flex-shrink-0 shadow-sm" style={{ width:22, height:15 }}>
                    <div style={{ width:"40%", background:t2.preview[0] }}/>
                    <div style={{ width:"40%", background:t2.preview[1] }}/>
                    <div style={{ width:"20%", background:t2.preview[2] }}/>
                  </div>
                  <span className="flex-1 text-left truncate">{t2.label}</span>
                  {theme===t2.name && <span style={{ color:primary }}>✓</span>}
                </button>
              ))}
            </div>
          </Section>

          {/* Primary Color */}
          <Section title="Primary Color" icon="M7 21a4 4 0 0 1-4-4V5h4l2 2h4l2-2h4v12a4 4 0 0 1-4 4H7z">
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {PRIMARY_COLORS.map(({ color, label }) => (
                <button key={color} onClick={() => { setPrimary(color); setCustomColor(color); }} title={label}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{ background:color, boxShadow: primary===color?`0 0 0 2px ${tokens.bg}, 0 0 0 4px ${color}`:"none", transform: primary===color?"scale(1.15)":"scale(1)" }}>
                  {primary===color && <span className="text-white text-[10px] font-black">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background:tokens.cardHover, border:`1px solid ${tokens.border}` }}>
              <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setPrimary(e.target.value); }} className="w-7 h-7 rounded-lg cursor-pointer" style={{ border:"none", background:"none" }} />
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate" style={{ color:tokens.text }}>Custom</p><p className="text-[10px]" style={{ color:tokens.muted }}>{customColor.toUpperCase()}</p></div>
              <div className="w-5 h-5 rounded-full shadow-sm" style={{ background:customColor }} />
            </div>
          </Section>

          {/* Font Family */}
          <Section title="Font Family" icon="M4 7V4h16v3M9 20h6M12 4v16">
            <div className="flex flex-col gap-1">
              {([["Georgia, serif","Georgia"],["'Merriweather', serif","Merriweather"],["'Palatino', serif","Palatino"],["system-ui, sans-serif","System UI"],["'Trebuchet MS', sans-serif","Trebuchet MS"],["'Courier New', monospace","Courier New"]] as [FontFamily,string][]).map(([ff, label]) => (
                <button key={ff} onClick={() => setFontFamily(ff)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                  style={{ background: fontFamily===ff?`${primary}15`:tokens.cardHover, border:`1.5px solid ${fontFamily===ff?primary:"transparent"}`, color: fontFamily===ff?primary:tokens.text, fontFamily:ff }}>
                  <span className="text-xs font-medium">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] opacity-40">Aa</span>
                    {fontFamily===ff && <span className="font-bold text-xs" style={{ color:primary }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* Font Size */}
          <Section title="Font Size" icon="M3 17l3-3 4 4 5-6 6 5">
            <div className="grid grid-cols-3 gap-1.5">
              {([["sm","Small",11],["md","Medium",14],["lg","Large",18]] as [FontSize,string,number][]).map(([key, label, sz]) => (
                <button key={key} onClick={() => setFontSize(key)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                  style={{ background: fontSize===key?`${primary}15`:tokens.cardHover, border:`1.5px solid ${fontSize===key?primary:"transparent"}`, color: fontSize===key?primary:tokens.sub }}>
                  <span style={{ fontSize:sz, fontWeight:"bold", lineHeight:1.2, color:fontSize===key?primary:tokens.muted }}>Aa</span>
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Card Roundness */}
          <Section title="Card Roundness" icon="M4 4h16a8 8 0 0 1 0 16H4a8 8 0 0 1 0-16z">
            <div className="grid grid-cols-3 gap-1.5">
              {([["4px","Sharp","0"],["12px","Medium","12"],["24px","Round","24"]] as [string,string,string][]).map(([val, label, rx]) => {
                const active = cardRadius === val;
                return (
                  <button key={val} onClick={() => applyRadius(val)}
                    className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-all"
                    style={{ background: active?`${primary}15`:tokens.cardHover, border:`1.5px solid ${active?primary:"transparent"}`, color: active?primary:tokens.sub }}>
                    <div className="w-8 h-5 border-2" style={{ borderRadius: rx+"px", borderColor: active?primary:tokens.muted }} />
                    <span className="text-[10px] font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0" style={{ borderTop: `1px solid ${tokens.border}` }}>
          <span className="text-[10px]" style={{ color: tokens.muted }}>Saved automatically ✓</span>
          <button onClick={() => setCustomizeOpen(false)} className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all" style={{ color: tokens.sub, background: tokens.cardHover, border: `1px solid ${tokens.border}` }}>Close</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   NAV ITEMS (translated)
══════════════════════════════════════════════════════════ */
const useNavItems = () => {
  const { t } = useTheme();
  return [
    { to:"/staff", label:t("dashboard"), icon:["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"] },
    { to:"#qr", label:t("qrScan"), icon:["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M17 14h.01M14 14h.01M20 14h.01M14 17h.01M17 17h3M14 20h3M20 17v3"],
      children:[{ to:"/staff/QRcode/Scan", label:t("scanQrCode") }] },
    { to:"#inventory", label:t("inventory"), icon:"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      children:[{ to:"/staff/inventory/view", label:t("viewItems") },{ to:"/staff/inventory/details", label:t("itemDetails") }] },
    { to:"#stock", label:t("stock"), icon:"M22 12h-4l-3 9L9 3l-3 9H2",
      children:[{ to:"/staff/stock/in", label:t("stockIn") },{ to:"/staff/stock/out", label:t("stockOut") },{ to:"/staff/stock/history", label:t("stockHistory") }] },
    { to:"#lowstock", label:t("lowStock"), icon:"M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
      children:[{ to:"/staff/lowstock/items", label:t("lowStockItems") }] },
    { to:"#settings", label:t("settings"), icon:["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
      children:[{ to:"/staff/settings/password", label:t("changePassword") },{ to:"/staff/settings/profile", label:t("profile") }] },
  ];
};

/* ══════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════ */
const Sidebar = ({ mobile = false }: { mobile?: boolean }) => {
  const { tokens, primary, sidenavShape, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, t } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserInfo();
  const NAV_ITEMS = useNavItems();
  const [openMenu, setOpenMenu] = useState<string | null>(() => {
    for (const item of NAV_ITEMS) { if (item.children?.some(c => location.pathname.startsWith(c.to))) return item.label; }
    return null;
  });
  const [hovered, setHovered] = useState(false);
  const slim = !mobile && (sidenavShape === "slim" || (sidebarCollapsed && !hovered));
  const stacked = sidenavShape === "stacked" && !slim;
  const sideWidth = slim ? 60 : stacked ? 200 : 248;
  const handleNavClick = useCallback(() => { if (mobile) setSidebarOpen(false); }, [mobile, setSidebarOpen]);

  return (
    <aside className="flex flex-col h-full flex-shrink-0"
      style={{ width:sideWidth, background:tokens.sidebar, borderRight:`1px solid ${tokens.border}`, transition:"width 0.25s cubic-bezier(0.4,0,0.2,1)", overflow:"hidden" }}
      onMouseEnter={() => sidebarCollapsed && !mobile && setHovered(true)}
      onMouseLeave={() => sidebarCollapsed && !mobile && setHovered(false)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-3.5 h-14 flex-shrink-0" style={{ borderBottom:`1px solid ${tokens.border}` }}>
        {/* Brand card — styled like image reference */}
        {!slim ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2 py-1.5 rounded-xl" style={{ background:`${primary}12`, border:`1px solid ${primary}22` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background:`${primary}20` }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight truncate" style={{ color:tokens.text }}>IIM-Staff</p>
              <p className="text-xs leading-tight mt-0.5 truncate" style={{ color:tokens.muted }}>Inventory System</p>
            </div>
            {!mobile && (
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:tokens.cardHover, color:tokens.muted }}>
                <Icon d={sidebarCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background:`${primary}20` }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
          </div>
        )}
      </div>
      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden iim-scrollhide">
        {NAV_ITEMS.map(item => {
          const isGroup = !!item.children;
          const isOpen = openMenu === item.label;
          const isChildActive = item.children?.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + "/"));
          if (slim && isGroup) return (
            <div key={item.label} className="relative group mx-2 mb-0.5">
              <button className="flex items-center justify-center w-full h-10 rounded-xl transition-all" title={item.label}
                style={{ color:isChildActive?primary:tokens.sub, background:isChildActive?`${primary}15`:"transparent" }}>
                <Icon d={item.icon as string} size={17} />
              </button>
              <div className="absolute left-full top-0 hidden group-hover:flex flex-col min-w-44 rounded-2xl shadow-2xl z-[200] overflow-hidden" style={{ background:tokens.sidebar, border:`1px solid ${tokens.border}`, marginLeft:6 }}>
                <div className="px-3.5 py-2.5 text-xs font-bold uppercase" style={{ color:tokens.muted, borderBottom:`1px solid ${tokens.border}` }}>{item.label}</div>
                {item.children!.map(ch => (
                  <NavLink key={ch.to} to={ch.to} onClick={handleNavClick} className="block px-3.5 py-2.5 text-sm font-medium transition-all"
                    style={({ isActive }) => ({ color:isActive?primary:tokens.sub, background:isActive?`${primary}12`:"transparent" })}
                    onMouseEnter={e=>(e.currentTarget.style.background=tokens.cardHover)}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>{ch.label}</NavLink>
                ))}
              </div>
            </div>
          );
          if (slim && !isGroup) return (
            <div key={item.to} className="mx-2 mb-0.5 relative group">
              <NavLink to={item.to} end onClick={handleNavClick} title={item.label}
                className="flex items-center justify-center w-full h-10 rounded-xl transition-all"
                style={({ isActive }) => ({ background:isActive?`${primary}15`:"transparent", color:isActive?primary:tokens.sub })}>
                <Icon d={item.icon as string} size={17} />
              </NavLink>
              <div className="absolute left-full top-1/2 -translate-y-1/2 hidden group-hover:block ml-2 z-[200]">
                <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg" style={{ background:tokens.text, color:tokens.sidebar }}>{item.label}</div>
              </div>
            </div>
          );
          if (!isGroup) return (
            <NavLink key={item.to} to={item.to} end onClick={handleNavClick}
              className="flex items-center gap-3 px-3.5 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all mb-0.5"
              style={({ isActive }) => ({ background:isActive?`${primary}15`:"transparent", color:isActive?primary:tokens.sub })}
              onMouseEnter={e=>{ if(!e.currentTarget.style.background.includes(primary)) e.currentTarget.style.background=tokens.cardHover; }}
              onMouseLeave={e=>{ if(!location.pathname.endsWith(item.to)) e.currentTarget.style.background="transparent"; }}>
              <Icon d={item.icon as string} size={16} style={{ flexShrink:0 }} />
              <span className="flex-1 truncate">{item.label}</span>
            </NavLink>
          );
          return (
            <div key={item.label} className="mb-0.5">
              <button onClick={() => setOpenMenu(isOpen ? null : item.label)}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium transition-all rounded-xl"
                style={{ color:(isOpen||isChildActive)?primary:tokens.sub, background:(isOpen||isChildActive)?`${primary}12`:"transparent" }}
                onMouseEnter={e=>{ if(!isOpen&&!isChildActive) e.currentTarget.style.background=tokens.cardHover; }}
                onMouseLeave={e=>{ if(!isOpen&&!isChildActive) e.currentTarget.style.background="transparent"; }}>
                <Icon d={item.icon as string | string[]} size={16} style={{ flexShrink:0 }} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                <Icon d="M6 9l6 6 6-6" size={13} style={{ transition:"transform 0.2s", transform:isOpen?"rotate(180deg)":"none", flexShrink:0 }} />
              </button>
              <div style={{ maxHeight:isOpen?400:0, overflow:"hidden", transition:"max-height 0.25s ease" }}>
                {stacked ? (
                  <div className="flex flex-wrap gap-1 px-3.5 py-2">
                    {item.children!.map(ch => (
                      <NavLink key={ch.to} to={ch.to} onClick={handleNavClick}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={({ isActive }) => ({ background:isActive?primary:tokens.cardHover, color:isActive?"#fff":tokens.sub })}>{ch.label}</NavLink>
                    ))}
                  </div>
                ) : (
                  <div className="ml-8 my-1 space-y-0.5" style={{ borderLeft:`2px solid ${tokens.border}`, paddingLeft:8 }}>
                    {item.children!.map(ch => (
                      <NavLink key={ch.to} to={ch.to} onClick={() => { handleNavClick(); navigate(ch.to); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={({ isActive }) => ({ color:isActive?primary:tokens.sub, background:isActive?`${primary}15`:"transparent" })}
                        onMouseEnter={e=>{ if(!location.pathname.startsWith(ch.to)) e.currentTarget.style.background=tokens.cardHover; }}
                        onMouseLeave={e=>{ if(!location.pathname.startsWith(ch.to)) e.currentTarget.style.background="transparent"; }}>
                        {ch.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </nav>
      {!slim && (
        <div className="p-3 flex-shrink-0" style={{ borderTop:`1px solid ${tokens.border}` }}>
          {/* Admin profile mini-card */}
          <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl mb-1"
            style={{ background:`${primary}10`, border:`1px solid ${primary}20` }}>
            <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden"
              style={{ background:`linear-gradient(145deg, ${primary}ee, ${primary}99)` }}>
              {user.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">{user.initials}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color:tokens.text }}>{user.fullName || "Staff"}</p>
              <p className="text-[10px] truncate" style={{ color:tokens.muted }}>{user.role || "Staff Member"}</p>
            </div>
            <NavLink to="/staff/settings/profile" title="View Profile">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" style={{ color:primary }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </NavLink>
          </div>
          <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("token_pending"); window.location.href = "/staff/login"; }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium w-full text-left"
            style={{ color:"#ef4444" }}
            onMouseEnter={e=>(e.currentTarget.style.background="#fef2f2")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={16} />{t("logout")}
          </button>
        </div>
      )}
    </aside>
  );
};

/* ══════════════════════════════════════════════════════════
   TOPBAR — unified single bar: brand | nav items | right controls
   Desktop (lg+): nav items visible inline between brand and controls
   Mobile/tablet: nav items hidden; hamburger opens slide-in sidenav
══════════════════════════════════════════════════════════ */
const Topbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { tokens, primary, setCustomizeOpen, customizeOpen, sidebarOpen, t } = useTheme();
  const NAV_ITEMS = useNavItems();
  const [openMenu, setOpenMenu]   = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef  = useRef<HTMLDivElement>(null);
  const navRef      = useRef<HTMLDivElement>(null);
  const navigate    = useNavigate();
  const location    = useLocation();
  const user        = useUserInfo();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (navRef.current    && !navRef.current.contains(e.target as Node))    setOpenMenu(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close nav dropdown on route change
  useEffect(() => { setOpenMenu(null); }, [location.pathname]);

  return (
    <header
      className="flex items-center px-3 sm:px-4 h-14 flex-shrink-0 gap-2"
      style={{ background: tokens.topbar, borderBottom: `1px solid ${tokens.border}`, position: "relative", zIndex: 100 }}
    >
      {/* ── Hamburger — mobile/tablet only ── */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl flex-shrink-0"
        style={{ background: tokens.cardHover, color: tokens.sub }}
      >
        <Icon d={sidebarOpen ? "M18 6 6 18M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"} size={18} />
      </button>

      {/* ── Brand ── */}
      <NavLink to="/" className="flex items-center gap-2 flex-shrink-0 no-underline">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl" style={{ background: `${primary}12`, border: `1px solid ${primary}22` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: `${primary}20` }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-bold text-sm leading-tight whitespace-nowrap" style={{ color: tokens.text }}>IIM-Staff</p>
            <p className="text-[10px] leading-tight whitespace-nowrap" style={{ color: tokens.muted }}>Inventory System</p>
          </div>
        </div>
      </NavLink>

      {/* ── Vertical divider (desktop only) ── */}
      <div className="hidden lg:block w-px h-6 flex-shrink-0 mx-1" style={{ background: tokens.border }} />

      {/* ── Inline Nav Items — desktop only ── */}
      <nav
        ref={navRef}
        className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", overflow: "visible" }}
      >
        {NAV_ITEMS.map(item => {
          const isChildActive = item.children?.some(
            c => location.pathname === c.to || location.pathname.startsWith(c.to + "/")
          );
          const isOpen = openMenu === item.label;

          return (
            <div key={item.label} className="relative flex-shrink-0">
              {!item.children ? (
                <NavLink
                  to={item.to}
                  end
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                  style={({ isActive }) => ({
                    color:      isActive ? primary : tokens.sub,
                    background: isActive ? `${primary}15` : "transparent",
                  })}
                >
                  <Icon d={item.icon as string} size={14} />
                  {item.label}
                </NavLink>
              ) : (
                <button
                  onClick={() => setOpenMenu(isOpen ? null : item.label)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                  style={{
                    color:      isOpen || isChildActive ? primary : tokens.sub,
                    background: isOpen || isChildActive ? `${primary}15` : "transparent",
                  }}
                >
                  <Icon d={item.icon as string} size={14} />
                  {item.label}
                  <Icon
                    d="M6 9l6 6 6-6"
                    size={11}
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                  />
                </button>
              )}

              {/* Dropdown */}
              {item.children && isOpen && (
                <div
                  className="absolute top-full left-0 mt-1.5 min-w-44 rounded-2xl shadow-2xl z-[150] overflow-hidden"
                  style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
                >
                  {item.children.map(ch => (
                    <NavLink
                      key={ch.to}
                      to={ch.to}
                      onClick={() => { setOpenMenu(null); navigate(ch.to); }}
                      className="flex items-center px-4 py-2.5 text-sm font-medium transition-all"
                      style={({ isActive }) => ({
                        color:      isActive ? primary : tokens.sub,
                        background: isActive ? `${primary}12` : "transparent",
                      })}
                      onMouseEnter={e => { if (location.pathname !== ch.to) e.currentTarget.style.background = tokens.cardHover; }}
                      onMouseLeave={e => { if (location.pathname !== ch.to) e.currentTarget.style.background = "transparent"; }}
                    >
                      {ch.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-auto lg:ml-0">
        {/* Language */}
        <LanguageDropdown />

        {/* Customize */}
        <div className="relative">
          <button
            onClick={() => setCustomizeOpen(!customizeOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm transition-all"
            style={{
              background: customizeOpen ? `${primary}18` : tokens.cardHover,
              color:      tokens.text,
              border:     `1.5px solid ${customizeOpen ? primary : tokens.border}`,
            }}
            title={t("customize")}
          >
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${primary}20` }}>
              <Icon d={["M12 20h9", "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"]} size={12} style={{ color: primary }} />
            </div>
            <span className="text-xs font-semibold hidden sm:block" style={{ color: tokens.text }}>{t("customize")}</span>
            <Icon d="M6 9l6 6 6-6" size={11} style={{ color: tokens.muted }} />
          </button>
          <CustomizePanel />
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative ml-0.5">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-xl"
            style={{ background: profileOpen ? tokens.cardHover : "transparent" }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex-shrink-0 overflow-hidden shadow-sm"
              style={{ background:`${primary}25`, border:`1.5px solid ${primary}30` }}>
              {user.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-xl"/>
                : <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{color:primary}}>{user.initials}</div>
              }
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold leading-tight" style={{ color: tokens.text }}>{user.fullName || t("staff")}</p>
              <p className="text-xs leading-tight"           style={{ color: tokens.muted }}>{user.role || t("staffMember")}</p>
            </div>
            <Icon d="M6 9l6 6 6-6" size={11} style={{ color: tokens.muted }} />
          </button>

          {profileOpen && (
            <div
              className="absolute rounded-2xl shadow-2xl z-[200] overflow-hidden"
              style={{
                width:      "min(220px, calc(100vw - 16px))",
                right:      0,
                top:        "calc(100% + 6px)",
                background: tokens.card,
                border:     `1px solid ${tokens.border}`,
              }}
            >
              {/* Profile header */}
              <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
                    style={{ background:`${primary}20`, border:`1.5px solid ${primary}30` }}>
                    {user.avatar
                      ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-xl"/>
                      : <div className="w-full h-full flex items-center justify-center text-base font-bold" style={{color:primary}}>{user.initials}</div>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: tokens.text }}>{user.fullName || "Staff"}</p>
                    <p className="text-xs"           style={{ color: tokens.muted }}>{user.email || "staff@iim.com"}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate("/staff/settings/profile"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
                  style={{ color: tokens.text }}
                  onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={14} style={{ color: tokens.muted }} />
                  {t("profile")}
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate("/staff/settings/password"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
                  style={{ color: tokens.text }}
                  onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={14} style={{ color: tokens.muted }} />
                  {t("changePassword")}
                </button>
              </div>

              <div style={{ height: 1, background: tokens.border }} />

              <div className="py-1">
                <button
                  onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("token_pending"); window.location.href = "/staff/login"; }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium w-full text-left"
                  style={{ color: "#ef4444" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={14} />
                  {t("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/* ══════════════════════════════════════════════════════════
   BREADCRUMB — Home > CurrentPage (Image 1)
══════════════════════════════════════════════════════════ */
export const Breadcrumb = ({ page }: { page: string; parent?: string }) => {
  const { tokens } = useTheme();
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="font-bold text-base" style={{ color: tokens.text }}>{page}</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   FILTER BUTTON — outline funnel icon + FILTER text (Image 3)
══════════════════════════════════════════════════════════ */
export const FilterButton = ({ onClick, active = false }: { onClick?: () => void; active?: boolean }) => {
  const { tokens, primary } = useTheme();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-all"
      style={{
        background: active ? `${primary}12` : tokens.card,
        color: active ? primary : tokens.sub,
        border: `1.5px solid ${active ? primary : tokens.border}`,
        letterSpacing: "0.08em",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = primary;
        (e.currentTarget as HTMLButtonElement).style.color = primary;
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = tokens.border;
          (e.currentTarget as HTMLButtonElement).style.color = tokens.sub;
        }
      }}
    >
      {/* Funnel / Filter icon */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      Filter
    </button>
  );
};

/* ══════════════════════════════════════════════════════════
   ADMIN LAYOUT
══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   RESPONSIVE FOOTER
══════════════════════════════════════════════════════════ */
const AppFooter = () => {
  const { tokens, primary } = useTheme();
  const year = new Date().getFullYear();
  return (
    <footer
      className="flex-shrink-0 w-full"
      style={{
        background: tokens.sidebar,
        borderTop: `1px solid ${tokens.border}`,
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 sm:px-6 py-2.5"
        style={{ minHeight: 40 }}
      >
        {/* Left — copyright */}
        <p className="text-xs leading-snug" style={{ color: tokens.muted }}>
          © {year}{" "}
          <span className="font-semibold" style={{ color: tokens.sub }}>
            Internal Inventory Management
          </span>
          <span className="hidden xs:inline">. All rights reserved.</span>
        </p>

        {/* Right — live dot + status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Animated live pulse */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: primary }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: primary }}
            />
          </span>
          <span className="text-xs font-medium hidden sm:block" style={{ color: tokens.muted }}>
            System Online
          </span>
          {/* Divider — only on wider screens */}
          <span
            className="hidden sm:block w-px h-3 mx-1"
            style={{ background: tokens.border }}
          />
          <span
            className="text-xs font-semibold hidden md:block px-2 py-0.5 rounded-md"
            style={{ background: `${primary}18`, color: primary }}
          >
            IIM-Staff
          </span>
        </div>
      </div>
    </footer>
  );
};



const StaffLayout = ({ children }: { children: React.ReactNode }) => {
  const { sidebarOpen, setSidebarOpen, tokens } = useTheme();

  // Layout rules:
  // - Desktop (lg+):      Nav items embedded inline in the single Topbar row.
  // - Mobile/Tablet (<lg): Hamburger in Topbar opens a slide-in sidenav overlay.
  return (
    <div className="flex flex-col h-screen" style={{ maxWidth: "100vw", overflow: "hidden", overflowX: "hidden" }}>
      {/* Single unified header: brand | nav | language | customize | profile */}
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Mobile/tablet: slide-in sidenav overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden shadow-2xl"><Sidebar mobile /></div>
          </>
        )}

        {/* Main content + footer */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ background: tokens.bg }}>
          <div className="flex-1 overflow-y-auto iim-scrollhide">
            {children}
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
