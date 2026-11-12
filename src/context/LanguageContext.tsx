import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'en' | 'hi' | 'mr' | 'gu' | 'hinglish';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  shortLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', shortLabel: 'हिन्दी' },
  { code: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish (दुकान)', shortLabel: 'HING' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', shortLabel: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', shortLabel: 'ગુજ' }
];

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Navbar
    nav_dashboard: 'Dashboard',
    nav_pos: 'POS Billing',
    nav_inventory: 'Inventory',
    nav_dues: 'Customer Dues',
    nav_invoices: 'Invoices',
    nav_settings: 'Settings',
    nav_3d_login: '3D Sign-In',
    nav_language: 'Language',

    // Dashboard
    dash_command_center: 'Retail Store & POS Command Center',
    dash_new_bill: 'New Bill (POS)',
    dash_3d_signin: '3D Store Sign-In',
    dash_todays_sales: "Today's Sales",
    dash_orders_today: 'Orders Today',
    dash_customer_dues: 'Customer Dues',
    dash_gross_margin: 'Gross Margin',
    dash_low_stock: 'Low Stock',
    dash_top_selling: 'Top Selling Items',
    dash_recent_invoices: 'Recent Invoices',
    dash_all_listed_products: 'All Listed Store Products',
    dash_listed_subtitle: 'Live product catalog with studio photos, barcodes, and stock levels',
    dash_manage_inventory: 'Manage Inventory & Barcodes',
    dash_open_pos: 'Open POS Billing',

    // POS Billing
    pos_change_shop_upi: 'Change Shop / UPI ID',
    pos_search_placeholder: 'Search product or scan barcode... (Press Enter to add)',
    pos_current_bill: 'Current Bill',
    pos_clear_cart: 'Clear Cart',
    pos_customer_name: 'Customer Name (Optional)',
    pos_customer_phone: 'Mobile (e.g. 9876543210)',
    pos_send_whatsapp: 'Send bill to WhatsApp',
    pos_print_invoice: 'Print invoice',
    pos_subtotal: 'Subtotal',
    pos_discount: 'Discount (₹)',
    pos_total_payable: 'Total Payable',
    pos_pay_generate: 'Pay & Generate Invoice',

    // Sign-In / LockScreen
    auth_subtitle: 'Retail Inventory & POS System',
    auth_email_tab: 'Email & Pass',
    auth_pin_tab: 'Terminal PIN',
    auth_email_label: 'Email Address',
    auth_password_label: 'Password',
    auth_signin_btn: 'Sign In to Store',
    auth_authenticating: 'Authenticating...',
    auth_enter_pin: 'Enter 4-digit Store Owner PIN',
    auth_store_backdrops: 'Store Backdrops:',
    auth_listed_items: 'Listed Items (15):'
  },
  hi: {
    // Navbar
    nav_dashboard: 'डैशबोर्ड',
    nav_pos: 'बिलिंग (POS)',
    nav_inventory: 'स्टॉक व बारकोड',
    nav_dues: 'ग्राहक उधार (खाता)',
    nav_invoices: 'पुराने बिल',
    nav_settings: 'दुकान सेटिंग्स',
    nav_3d_login: '3D लॉगिन',
    nav_language: 'भाषा',

    // Dashboard
    dash_command_center: 'रिटेल स्टोर और पीओएस कमांड सेंटर',
    dash_new_bill: 'नया बिल बनाएं (POS)',
    dash_3d_signin: '3D स्टोर लॉगिन',
    dash_todays_sales: 'आज की कुल बिक्री',
    dash_orders_today: 'आज के कुल बिल',
    dash_customer_dues: 'ग्राहकों पर बकाया (उधार)',
    dash_gross_margin: 'कुल मुनाफा (लाभ)',
    dash_low_stock: 'कम स्टॉक आइटम',
    dash_top_selling: 'सबसे ज्यादा बिकने वाले सामान',
    dash_recent_invoices: 'हाल ही के बिल',
    dash_all_listed_products: 'दुकान के सभी सूचीबद्ध सामान',
    dash_listed_subtitle: 'फोटो, बारकोड और लाइव स्टॉक के साथ सभी सामानों की सूची',
    dash_manage_inventory: 'स्टॉक व बारकोड बदलें',
    dash_open_pos: 'बिलिंग शुरू करें',

    // POS Billing
    pos_change_shop_upi: 'दुकान नाम / UPI बदलें',
    pos_search_placeholder: 'सामान खोजें या बारकोड स्कैन करें... (Enter दबाएं)',
    pos_current_bill: 'वर्तमान बिल',
    pos_clear_cart: 'खाली करें',
    pos_customer_name: 'ग्राहक का नाम',
    pos_customer_phone: 'मोबाइल नंबर (WhatsApp)',
    pos_send_whatsapp: 'WhatsApp पर बिल भेजें',
    pos_print_invoice: 'बिल प्रिंट करें',
    pos_subtotal: 'उप-योग (Subtotal)',
    pos_discount: 'छूट / डिस्काउंट (₹)',
    pos_total_payable: 'कुल देय राशि',
    pos_pay_generate: 'पेमेंट लें व बिल बनाएं',

    // Sign-In / LockScreen
    auth_subtitle: 'रिटेल इन्वेंटरी और पीओएस बिलिंग सिस्टम',
    auth_email_tab: 'ईमेल व पासवर्ड',
    auth_pin_tab: 'टर्मिनल पिन (PIN)',
    auth_email_label: 'ईमेल पता',
    auth_password_label: 'पासवर्ड',
    auth_signin_btn: 'स्टोर में लॉगिन करें',
    auth_authenticating: 'लॉगिन हो रहा है...',
    auth_enter_pin: '4-अंकों का स्टोर पिन दर्ज करें',
    auth_store_backdrops: 'स्टोर बैकग्राउंड:',
    auth_listed_items: 'सूचीबद्ध सामान (15):'
  },
  hinglish: {
    // Navbar
    nav_dashboard: 'Dashboard (हिसाब)',
    nav_pos: 'New Bill (पर्ची)',
    nav_inventory: 'Stock & Barcode',
    nav_dues: 'Khata / Udhar',
    nav_invoices: 'All Bills',
    nav_settings: 'Dukaan Settings',
    nav_3d_login: '3D Lock',
    nav_language: 'Bhasha',

    // Dashboard
    dash_command_center: 'Apni Dukaan & POS Command Center',
    dash_new_bill: 'Naya Bill Banayein (POS)',
    dash_3d_signin: '3D Store View',
    dash_todays_sales: 'Aaj Ki Bikri (Sales)',
    dash_orders_today: 'Aaj Ke Bills',
    dash_customer_dues: 'Total Udhar (Khata)',
    dash_gross_margin: 'Aaj Ka Munafa',
    dash_low_stock: 'Kam Stock Alert',
    dash_top_selling: 'Top Bikne Wala Samaan',
    dash_recent_invoices: 'Abhi Ke Taaza Bills',
    dash_all_listed_products: 'Dukaan Ka Saara Listed Samaan',
    dash_listed_subtitle: 'Sabhi items ki photo, barcode aur stock dekhein',
    dash_manage_inventory: 'Stock & Barcode Badlein',
    dash_open_pos: 'POS Billing Kholein',

    // POS Billing
    pos_change_shop_upi: 'Shop Naam / UPI Badlein',
    pos_search_placeholder: 'Samaan search karein ya Barcode scan karein...',
    pos_current_bill: 'Chalu Bill (Cart)',
    pos_clear_cart: 'Cart Hatao',
    pos_customer_name: 'Customer Ka Naam',
    pos_customer_phone: 'WhatsApp Mobile No.',
    pos_send_whatsapp: 'WhatsApp par Bill bhejein',
    pos_print_invoice: 'Receipt Print karein',
    pos_subtotal: 'Total Samaan',
    pos_discount: 'Chhoot / Discount (₹)',
    pos_total_payable: 'Kul Dena Hai (Total)',
    pos_pay_generate: 'Payment Lein & Bill Banayein',

    // Sign-In / LockScreen
    auth_subtitle: 'Smart Dukaan Inventory & POS System',
    auth_email_tab: 'Email & Pass',
    auth_pin_tab: 'Quick PIN',
    auth_email_label: 'Email ID',
    auth_password_label: 'Password',
    auth_signin_btn: 'Dukaan Kholें (Sign In)',
    auth_authenticating: 'Khul raha hai...',
    auth_enter_pin: '4-Digit Dukaan PIN Daalein',
    auth_store_backdrops: 'Store Photo:',
    auth_listed_items: 'Samaan Photos (15):'
  },
  mr: {
    // Navbar
    nav_dashboard: 'डॅशबोर्ड',
    nav_pos: 'पीओएस बिलिंग',
    nav_inventory: 'माल आणि बारकोड',
    nav_dues: 'ग्राहक उधारी (खाते)',
    nav_invoices: 'सर्व बिले',
    nav_settings: 'दुकान सेटिंग्ज',
    nav_3d_login: '3D लॉगिन',
    nav_language: 'भाषा',

    // Dashboard
    dash_command_center: 'रिटेल स्टोअर आणि पीओएस कमांड सेंटर',
    dash_new_bill: 'नवीन बिल करा (POS)',
    dash_3d_signin: '3D स्टोअर लॉगिन',
    dash_todays_sales: 'आजची एकूण विक्री',
    dash_orders_today: 'आजची एकूण बिले',
    dash_customer_dues: 'ग्राहक उधारी (येणे बाकी)',
    dash_gross_margin: 'एकूण नफा',
    dash_low_stock: 'कमी स्टॉक असलेले साहित्य',
    dash_top_selling: 'सर्वात जास्त विकल्या जाणाऱ्या वस्तू',
    dash_recent_invoices: 'अलीकडील बिले',
    dash_all_listed_products: 'दुकानातील सर्व उपलब्ध वस्तू',
    dash_listed_subtitle: 'फोटो, बारकोड आणि सध्याच्या स्टॉकसह सर्व वस्तूंची यादी',
    dash_manage_inventory: 'स्टॉक व बारकोड बदला',
    dash_open_pos: 'बिलिंग सुरू करा',

    // POS Billing
    pos_change_shop_upi: 'दुकान नाव / UPI बदला',
    pos_search_placeholder: 'वस्तू शोधा किंवा बारकोड स्कॅन करा...',
    pos_current_bill: 'चालू बिल',
    pos_clear_cart: 'सर्व काढा',
    pos_customer_name: 'ग्राहकाचे नाव',
    pos_customer_phone: 'मोबाईल नंबर (WhatsApp)',
    pos_send_whatsapp: 'WhatsApp वर बिल पाठवा',
    pos_print_invoice: 'बिल प्रिंट करा',
    pos_subtotal: 'उप-एकूण',
    pos_discount: 'सवलत / सूट (₹)',
    pos_total_payable: 'एकूण देय रक्कम',
    pos_pay_generate: 'पेमेंट घ्या आणि बिल तयार करा',

    // Sign-In / LockScreen
    auth_subtitle: 'रिटेल इन्व्हेंटरी आणि पीओएस बिलिंग सिस्टम',
    auth_email_tab: 'ईमेल व पासवर्ड',
    auth_pin_tab: 'पिन कोड (PIN)',
    auth_email_label: 'ईमेल आयडी',
    auth_password_label: 'पासवर्ड',
    auth_signin_btn: 'दुकानात प्रवेश करा',
    auth_authenticating: 'प्रवेश करत आहे...',
    auth_enter_pin: '४-अंकी स्टोअर पिन टाका',
    auth_store_backdrops: 'स्टोअर बॅकग्राउंड:',
    auth_listed_items: 'उपलब्ध वस्तू (15):'
  },
  gu: {
    // Navbar
    nav_dashboard: 'ડેશબોર્ડ',
    nav_pos: 'બિલિંગ (POS)',
    nav_inventory: 'સ્ટોક અને બારકોડ',
    nav_dues: 'ગ્રાહક ઉધાર (ખાતું)',
    nav_invoices: 'બધા બિલ',
    nav_settings: 'દુકાન સેટિંગ્સ',
    nav_3d_login: '3D લોગિન',
    nav_language: 'ભાષા',

    // Dashboard
    dash_command_center: 'રિટેલ સ્ટોર અને POS કમાન્ડ સેન્ટર',
    dash_new_bill: 'નવું બિલ બનાવો (POS)',
    dash_3d_signin: '3D સ્ટોર લોગિન',
    dash_todays_sales: 'આજનું કુલ વેચાણ',
    dash_orders_today: 'આજના કુલ બિલ',
    dash_customer_dues: 'ગ્રાહક બાકી ઉધાર',
    dash_gross_margin: 'આજનો નફો',
    dash_low_stock: 'ઓછો સ્ટોક',
    dash_top_selling: 'સૌથી વધુ વેચાતી વસ્તુઓ',
    dash_recent_invoices: 'તાજેતરના બિલ',
    dash_all_listed_products: 'દુકાનની તમામ લિસ્ટેડ વસ્તુઓ',
    dash_listed_subtitle: 'ફોટો, બારકોડ અને લાઈવ સ્ટોક સાથે તમામ વસ્તુઓની યાદી',
    dash_manage_inventory: 'સ્ટોક અને બારકોડ બદલો',
    dash_open_pos: 'બિલિંગ શરૂ કરો',

    // POS Billing
    pos_change_shop_upi: 'દુકાનનું નામ / UPI બદલો',
    pos_search_placeholder: 'વસ્તુ શોધો અથવા બારકોડ સ્કેન કરો...',
    pos_current_bill: 'હાલનું બિલ',
    pos_clear_cart: 'કાર્ટ ખાલી કરો',
    pos_customer_name: 'ગ્રાહકનું નામ',
    pos_customer_phone: 'મોબાઇલ નંબર (WhatsApp)',
    pos_send_whatsapp: 'WhatsApp પર બિલ મોકલો',
    pos_print_invoice: 'બિલ પ્રિન્ટ કરો',
    pos_subtotal: 'પેટા કુલ',
    pos_discount: 'ડિસ્કાઉન્ટ (₹)',
    pos_total_payable: 'કુલ ચૂકવવાપાત્ર રકમ',
    pos_pay_generate: 'પેમેન્ટ લો અને બિલ બનાવો',

    // Sign-In / LockScreen
    auth_subtitle: 'રિટેલ ઇન્વેન્ટરી અને POS બિલિંગ સિસ્ટમ',
    auth_email_tab: 'ઈમેલ અને પાસવર્ડ',
    auth_pin_tab: 'ટર્મિનલ પિન (PIN)',
    auth_email_label: 'ઈમેલ એડ્રેસ',
    auth_password_label: 'પાસવર્ડ',
    auth_signin_btn: 'સ્ટોરમાં સાઇન ઇન કરો',
    auth_authenticating: 'લોગિન થઈ રહ્યું છે...',
    auth_enter_pin: '4-અંકનો સ્ટોર પિન નાખો',
    auth_store_backdrops: 'સ્ટોર બેકગ્રાઉન્ડ:',
    auth_listed_items: 'લિસ્ટેડ વસ્તુઓ (15):'
  }
};

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('pos_language') as AppLanguage | null;
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('pos_language', language);
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
