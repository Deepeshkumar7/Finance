import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "total_collected": "Total Collected",
      "total_pending": "Total Pending",
      "active_customers": "Active Customers",
      "start_route": "Start Collection Route",
      "search": "Search route...",
      "fully_paid": "Fully Paid",
      "add_customer": "Add New Customer",
      "profile": "Profile"
    }
  },
  ta: {
    translation: {
      "total_collected": "மொத்த வசூல்",
      "total_pending": "நிலுவை தொகை",
      "active_customers": "வாடிக்கையாளர்கள்",
      "start_route": "வசூலை தொடங்கவும்",
      "search": "தேடுக...",
      "fully_paid": "முழுமையாக முடிந்தது",
      "add_customer": "புதிய வாடிக்கையாளர்",
      "profile": "వివరాలు" // Note: Will replace with exact Tamil in next step if needed, using standard translation for now.
    }
  },
  ml: {
    translation: {
      "total_collected": "ആകെ ലഭിച്ചത്",
      "total_pending": "കുടിശ്ശിക",
      "active_customers": "ഉപഭോക്താക്കൾ",
      "start_route": "കളക്ഷൻ ആരംഭിക്കുക",
      "search": "തിരയുക...",
      "fully_paid": "പൂർണ്ണമായും അടച്ചു",
      "add_customer": "പുതിയ ഉപഭോക്താവ്",
      "profile": "പ്രൊഫൈൽ"
    }
  },
  te: {
    translation: {
      "total_collected": "మొత్తం వసూలు",
      "total_pending": "బకాయి మొత్తం",
      "active_customers": "కస్టమర్లు",
      "start_route": "వసూలు ప్రారంభించండి",
      "search": "వెతకండి...",
      "fully_paid": "పూర్తిగా చెల్లించబడింది",
      "add_customer": "కొత్త కస్టమర్",
      "profile": "ప్రొఫైల్"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;