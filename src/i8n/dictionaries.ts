import type { Locale } from "./config";

export type Dictionary = {
  welcome: {
    title: string;
    subtitle: string;
    startAssessment: string;
    audioGuidance: string;
  };

  voiceTouch: {
    title: string;
    description: string;
    instruction: string;
  };

  language: {
    label: string;
  };

  auth: {
    brand: string;
    clinicalIntake: string;

    email: {
      title: string;
      subtitle: string;
      label: string;
      placeholder: string;
      continue: string;
      sendingOtp: string;
      otpInfo: string;
    };

    otp: {
      title: string;
      subtitle: string;
      verify: string;
      verifying: string;
      didntReceive: string;
      resend: string;
      resendIn: string;
      changeNumber: string;
    };

    errors: {
      invalidEmail: string;
      unableToSend: string;
      somethingWentWrong: string;
      invalidOtpLength: string;
      invalidOrExpiredOtp: string;
      unableToVerify: string;
    };

    security: string;
  };
  
  assessment: {
    stepOf: string;
    subtitle: string;
    continue: string;

    voice: {
      label: string;
      listening: string;
      tapToSpeak: string;
      transcript: string;
      chooseAnswer: string;
    };

    questions: {
      defaultQuestion: string;
      options: {
        chestPain: string;
        fever: string;
        headache: string;
        none: string;
      };
    };

    preliminaryNotice: string;
  };

  patientDocuments: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    scanDocument: string;
    scanDocumentHint: string;
    uploadFile: string;
    uploadFileHint: string;
    documents: string;
    statusProcessed: string;
    statusProcessing: string;
    continue: string;
    qrTitle: string;
    qrHint: string;
    docNames: {
      prescription: string;
      labReport: string;
      dischargeSummary: string;
    };
  };

  confirmation: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    mainProblem: string;
    medicalConditions: string;
    medicines: string;
    documents: string;
    documentsProcessed: string; // use "{count}" as placeholder, e.g. "{count} documents processed"
    edit: string;
    confirmAndFinish: string;
  };

  doctorDashboard: {
    brand: string;
    subtitle: string; // "OPD Dashboard"
    doctorLabel: string;
    settingsLabel: string;
    queueTitle: string;
    patientLabel: string; // "Patient #{id}"
    alertLabel: string;
    alertTitle: string;
    tabs: {
      summary: string;
      timeline: string;
      documents: string;
      fullHistory: string;
    };
    fields: {
      chiefComplaint: string;
      historyOfPresentIllness: string;
      pastHistory: string;
      medications: string;
      investigations: string;
    };
    editSummary: string;
    confirm: string;
  };
};

type PartialDictionary = Partial<Dictionary>;

const english: Dictionary = {
  welcome: {
    title: "MediKiosk",
    subtitle: "Collect your symptoms and prepare for a smooth clinical intake.",
    startAssessment: "Start assessment",
    audioGuidance: "Audio guidance",
  },
  voiceTouch: {
    title: "Voice touch",
    description: "Speak naturally or use the quick options below.",
    instruction: "Tap the mic to describe how you feel.",
  },
  language: {
    label: "Language",
  },
  assessment: {
    stepOf: "Step {step} of {total}",
    subtitle: "You can speak naturally or choose an option below.",
    continue: "Continue",
    voice: {
      label: "Voice",
      listening: "Listening...",
      tapToSpeak: "Tap to speak",
      transcript: "I'm listening. Tell us what brings you here.",
      chooseAnswer: "Choose the option that best describes how you feel.",
    },
    preliminaryNotice:
      "Your answers help prepare a preliminary assessment for the clinical team.",
    questions: {
      defaultQuestion: "What brings you to the hospital today?",
      options: {
        chestPain: "Chest pain",
        fever: "Fever",
        headache: "Headache",
        none: "None of these",
      },
    },
  },
  auth: {
    brand: "MediKiosk",
    clinicalIntake: "Clinical Intake",
    email: {
      title: "Welcome to MediKiosk",
      subtitle: "Enter your email address to continue.",
      label: "Email address",
      placeholder: "Enter email address",
      continue: "Continue",
      sendingOtp: "Sending OTP...",
      otpInfo: "We'll send a one-time password to your email address.",
    },
    otp: {
      title: "Verify your email",
      subtitle: "Enter the 6-digit OTP sent to",
      verify: "Verify & Continue",
      verifying: "Verifying...",
      didntReceive: "Didn't receive the OTP?",
      resend: "Resend OTP",
      resendIn: "Resend in {seconds}s",
      changeNumber: "Change email",
    },
    errors: {
      invalidEmail: "Enter a valid email address.",
      unableToSend: "Unable to send OTP.",
      somethingWentWrong: "Something went wrong.",
      invalidOtpLength: "Enter the 6-digit OTP.",
      invalidOrExpiredOtp: "Invalid or expired OTP.",
      unableToVerify: "Unable to verify OTP. Please try again.",
    },
    security: "Your information is securely protected.",
  },
  patientDocuments: {
    breadcrumb: "Documents",
    title: "Upload Documents",
    subtitle: "Add your prescriptions, lab reports, or other medical records.",
    scanDocument: "Scan Document",
    scanDocumentHint: "Use the camera to scan a physical page",
    uploadFile: "Upload File",
    uploadFileHint: "Select a file from your device",
    documents: "Documents",
    statusProcessed: "Processed",
    statusProcessing: "Processing...",
    continue: "Continue",
    qrTitle: "Upload via Mobile",
    qrHint: "Scan this QR code with your phone to upload files directly",
    docNames: {
      prescription: "Prescription",
      labReport: "Lab Report",
      dischargeSummary: "Discharge Summary",
    },
  },
  confirmation: {
    breadcrumb: "Confirmation",
    title: "Review your details",
    subtitle: "Please verify the information below before finishing.",
    mainProblem: "Main Problem",
    medicalConditions: "Medical Conditions",
    medicines: "Medicines",
    documents: "Documents",
    documentsProcessed: "{count} documents processed",
    edit: "Edit",
    confirmAndFinish: "Confirm & Finish",
  },
  doctorDashboard: {
    brand: "MediKiosk",
    subtitle: "OPD Dashboard",
    doctorLabel: "Doctor",
    settingsLabel: "Settings",
    queueTitle: "Patient Queue",
    patientLabel: "Patient #{id}",
    alertLabel: "Alert",
    alertTitle: "Critical Alert",
    tabs: {
      summary: "Summary",
      timeline: "Timeline",
      documents: "Documents",
      fullHistory: "Full History",
    },
    fields: {
      chiefComplaint: "Chief Complaint",
      historyOfPresentIllness: "History of Present Illness",
      pastHistory: "Past History",
      medications: "Medications",
      investigations: "Investigations",
    },
    editSummary: "Edit Summary",
    confirm: "Confirm",
  },
};

const translations: Partial<Record<Locale, PartialDictionary>> = {
  en: english,

  hi: {
    auth: {
      brand: "MediKiosk",
      clinicalIntake: "चिकित्सीय जानकारी",
      email: {
        title: "MediKiosk में आपका स्वागत है",
        subtitle: "जारी रखने के लिए अपना ईमेल पता दर्ज करें।",
        label: "ईमेल पता",
        placeholder: "ईमेल पता दर्ज करें",
        continue: "जारी रखें",
        sendingOtp: "OTP भेजा जा रहा है...",
        otpInfo: "हम आपके ईमेल पते पर एक बार उपयोग होने वाला पासवर्ड भेजेंगे।",
      },
      otp: {
        title: "अपना ईमेल सत्यापित करें",
        subtitle: "भेजा गया 6 अंकों का OTP दर्ज करें",
        verify: "सत्यापित करें और जारी रखें",
        verifying: "सत्यापित किया जा रहा है...",
        didntReceive: "OTP प्राप्त नहीं हुआ?",
        resend: "OTP दोबारा भेजें",
        resendIn: "{seconds} सेकंड में दोबारा भेजें",
        changeNumber: "ईमेल बदलें",
      },
      errors: {
        invalidEmail: "एक मान्य ईमेल पता दर्ज करें।",
        unableToSend: "OTP भेजने में असमर्थ।",
        somethingWentWrong: "कुछ गलत हो गया।",
        invalidOtpLength: "6 अंकों का OTP दर्ज करें।",
        invalidOrExpiredOtp: "OTP अमान्य या समाप्त हो गया है।",
        unableToVerify: "OTP सत्यापित करने में असमर्थ। कृपया पुनः प्रयास करें।",
      },
      security: "आपकी जानकारी सुरक्षित रूप से संरक्षित है।",
    },
    language: {
      label: "भाषा",
    },
    assessment: {
      stepOf: "चरण {step} का {total}",
      subtitle: "आप प्राकृतिक रूप से बोल सकते हैं या नीचे एक विकल्प चुन सकते हैं।",
      continue: "जारी रखें",
      voice: {
        label: "आवाज़",
        listening: "सुन रहा है...",
        tapToSpeak: "बोलने के लिए टैप करें",
        transcript: "मैं सुन रहा हूँ। हमें बताएं कि आप यहाँ क्यों आए हैं।",
        chooseAnswer: "वह विकल्प चुनें जो आपकी भावना का सबसे अच्छा वर्णन करता है।",
      },
      questions: {
        defaultQuestion: "आज आप अस्पताल क्यों आए हैं?",
        options: {
          chestPain: "सीने में दर्द",
          fever: "बुखार",
          headache: "सिरदर्द",
          none: "इनमें से कोई नहीं",
        },
      },
      preliminaryNotice:
        "आपके उत्तर क्लिनिकल टीम के लिए एक प्रारंभिक मूल्यांकन तैयार करने में मदद करते हैं।",
    },
    patientDocuments: {
      breadcrumb: "दस्तावेज़",
      title: "दस्तावेज़ अपलोड करें",
      subtitle: "अपने नुस्खे, लैब रिपोर्ट, या अन्य मेडिकल रिकॉर्ड जोड़ें।",
      scanDocument: "दस्तावेज़ स्कैन करें",
      scanDocumentHint: "भौतिक पृष्ठ को स्कैन करने के लिए कैमरे का उपयोग करें",
      uploadFile: "फ़ाइल अपलोड करें",
      uploadFileHint: "अपने डिवाइस से एक फ़ाइल चुनें",
      documents: "दस्तावेज़",
      statusProcessed: "संसाधित",
      statusProcessing: "संसाधित किया जा रहा है...",
      continue: "जारी रखें",
      qrTitle: "मोबाइल के माध्यम से अपलोड करें",
      qrHint: "सीधे फ़ाइलें अपलोड करने के लिए अपने फोन से इस QR कोड को स्कैन करें",
      docNames: {
        prescription: "नुस्खा",
        labReport: "लैब रिपोर्ट",
        dischargeSummary: "डिस्चार्ज सारांश",
      },
    },
    confirmation: {
      breadcrumb: "पुष्टिकरण",
      title: "अपने विवरण की समीक्षा करें",
      subtitle: "कृपया समाप्त करने से पहले नीचे दी गई जानकारी सत्यापित करें।",
      mainProblem: "मुख्य समस्या",
      medicalConditions: "चिकित्सीय स्थितियां",
      medicines: "दवाएं",
      documents: "दस्तावेज़",
      documentsProcessed: "{count} दस्तावेज़ संसाधित",
      edit: "संपादित करें",
      confirmAndFinish: "पुष्टि करें और समाप्त करें",
    },
    doctorDashboard: {
      brand: "MediKiosk",
      subtitle: "OPD डैशबोर्ड",
      doctorLabel: "डॉक्टर",
      settingsLabel: "सेटिंग्स",
      queueTitle: "मरीजों की कतार",
      patientLabel: "मरीज #{id}",
      alertLabel: "चेतावनी",
      alertTitle: "गंभीर चेतावनी",
      tabs: {
        summary: "सारांश",
        timeline: "समयरेखा",
        documents: "दस्तावेज़",
        fullHistory: "पूरा इतिहास",
      },
      fields: {
        chiefComplaint: "मुख्य शिकायत",
        historyOfPresentIllness: "वर्तमान बीमारी का इतिहास",
        pastHistory: "पिछला इतिहास",
        medications: "दवाएं",
        investigations: "जांच",
      },
      editSummary: "सारांश संपादित करें",
      confirm: "पुष्टि करें",
    },
  },

  mr: {
    auth: {
      brand: "MediKiosk",
      clinicalIntake: "क्लिनिकल माहिती",
      email: {
        title: "MediKiosk मध्ये आपले स्वागत आहे",
        subtitle: "पुढे जाण्यासाठी आपला ईमेल पत्ता प्रविष्ट करा.",
        label: "ईमेल पत्ता",
        placeholder: "ईमेल पत्ता प्रविष्ट करा",
        continue: "पुढे जा",
        sendingOtp: "OTP पाठवत आहे...",
        otpInfo: "आम्ही आपल्या ईमेल पत्त्यावर एकदाच वापरता येणारा पासवर्ड पाठवू.",
      },
      otp: {
        title: "आपला ईमेल सत्यापित करा",
        subtitle: "पाठवलेला 6 अंकी OTP प्रविष्ट करा",
        verify: "सत्यापित करा आणि पुढे जा",
        verifying: "सत्यापन सुरू आहे...",
        didntReceive: "OTP मिळाला नाही?",
        resend: "OTP पुन्हा पाठवा",
        resendIn: "{seconds} सेकंदांनी पुन्हा पाठवा",
        changeNumber: "ईमेल बदला",
      },
      errors: {
        invalidEmail: "वैध ईमेल पत्ता प्रविष्ट करा.",
        unableToSend: "OTP पाठवता आला नाही.",
        somethingWentWrong: "काहीतरी चूक झाली.",
        invalidOtpLength: "6 अंकी OTP प्रविष्ट करा.",
        invalidOrExpiredOtp: "OTP अमान्य किंवा कालबाह्य झाला आहे.",
        unableToVerify: "OTP सत्यापित करता आला नाही. कृपया पुन्हा प्रयत्न करा.",
      },
      security: "आपली माहिती सुरक्षितपणे संरक्षित आहे.",
    },
    language: {
      label: "भाषा",
    },
    assessment: {
      stepOf: "पायरी {step} / {total}",
      subtitle: "तुम्ही नैसर्गिकपणे बोलू शकता किंवा खालील पर्याय निवडू शकता.",
      continue: "पुढे जा",
      voice: {
        label: "आवाज",
        listening: "ऐकत आहे...",
        tapToSpeak: "बोलायला टॅप करा",
        transcript: "मी ऐकत आहे. आम्हाला सांगा की तुम्ही आज इथे का आला.",
        chooseAnswer: "तुमच्या भावनेचे सर्वोत्तम वर्णन करणारा पर्याय निवडा.",
      },
      questions: {
        defaultQuestion: "आज तुम्ही रुग्णालयात का आला?",
        options: {
          chestPain: "छातीत दुखणे",
          fever: "ताप",
          headache: "डोके दुखणे",
          none: "यापैकी काही नाही",
        },
      },
      preliminaryNotice:
        "तुमचे उत्तर क्लिनिकल टीमसाठी एक प्राथमिक मूल्यांकन तयार करण्यास मदत करतात.",
    },
    patientDocuments: {
      breadcrumb: "कागदपत्रे",
      title: "कागदपत्रे अपलोड करा",
      subtitle: "तुमची प्रिस्क्रिप्शन, लॅब रिपोर्ट्स किंवा इतर वैद्यकीय नोंदी जोडा.",
      scanDocument: "कागदपत्र स्कॅन करा",
      scanDocumentHint: "प्रत्यक्ष पान स्कॅन करण्यासाठी कॅमेरा वापरा",
      uploadFile: "फाईल अपलोड करा",
      uploadFileHint: "तुमच्या डिव्हाइसवरून फाईल निवडा",
      documents: "कागदपत्रे",
      statusProcessed: "प्रक्रिया झाली",
      statusProcessing: "प्रक्रिया सुरू आहे...",
      continue: "पुढे जा",
      qrTitle: "मोबाईलद्वारे अपलोड करा",
      qrHint: "थेट फाईल्स अपलोड करण्यासाठी तुमच्या फोनवरून हा QR कोड स्कॅन करा",
      docNames: {
        prescription: "प्रिस्क्रिप्शन",
        labReport: "लॅब रिपोर्ट",
        dischargeSummary: "डिस्चार्ज सारांश",
      },
    },
    confirmation: {
      breadcrumb: "पुष्टीकरण",
      title: "तुमच्या तपशीलांचे पुनरावलोकन करा",
      subtitle: "कृपया पूर्ण करण्यापूर्वी खालील माहिती सत्यापित करा.",
      mainProblem: "मुख्य समस्या",
      medicalConditions: "वैद्यकीय स्थिती",
      medicines: "औषधे",
      documents: "कागदपत्रे",
      documentsProcessed: "{count} कागदपत्रांवर प्रक्रिया केली",
      edit: "संपादित करा",
      confirmAndFinish: "पुष्टी करा आणि पूर्ण करा",
    },
    doctorDashboard: {
      brand: "MediKiosk",
      subtitle: "OPD डॅशबोर्ड",
      doctorLabel: "डॉक्टर",
      settingsLabel: "सेटिंग्ज",
      queueTitle: "रुग्णांची रांग",
      patientLabel: "रुग्ण #{id}",
      alertLabel: "इशारा",
      alertTitle: "गंभीर इशारा",
      tabs: {
        summary: "सारांश",
        timeline: "वेळापत्रक",
        documents: "कागदपत्रे",
        fullHistory: "संपूर्ण इतिहास",
      },
      fields: {
        chiefComplaint: "मुख्य तक्रार",
        historyOfPresentIllness: "सध्याच्या आजाराचा इतिहास",
        pastHistory: "पूर्वीचा इतिहास",
        medications: "औषधे",
        investigations: "तपासणी",
      },
      editSummary: "सारांश संपादित करा",
      confirm: "पुष्टी करा",
    },
  },

  bn: {
    auth: {
      brand: "MediKiosk",
      clinicalIntake: "ক্লিনিক্যাল তথ্য",
      email: {
        title: "MediKiosk-এ স্বাগতম",
        subtitle: "চালিয়ে যেতে আপনার ইমেল ঠিকানা লিখুন।",
        label: "ইমেল ঠিকানা",
        placeholder: "ইমেল ঠিকানা লিখুন",
        continue: "চালিয়ে যান",
        sendingOtp: "OTP পাঠানো হচ্ছে...",
        otpInfo: "আমরা আপনার ইমেল ঠিকানায় একটি একবার ব্যবহারযোগ্য পাসওয়ার্ড পাঠাব।",
      },
      otp: {
        title: "আপনার ইমেল যাচাই করুন",
        subtitle: "পাঠানো ৬ সংখ্যার OTP লিখুন",
        verify: "যাচাই করুন ও চালিয়ে যান",
        verifying: "যাচাই করা হচ্ছে...",
        didntReceive: "OTP পাননি?",
        resend: "OTP আবার পাঠান",
        resendIn: "{seconds} সেকেন্ড পরে আবার পাঠান",
        changeNumber: "ইমেল পরিবর্তন করুন",
      },
      errors: {
        invalidEmail: "একটি বৈধ ইমেল ঠিকানা লিখুন।",
        unableToSend: "OTP পাঠানো যায়নি।",
        somethingWentWrong: "কিছু ভুল হয়েছে।",
        invalidOtpLength: "৬ সংখ্যার OTP লিখুন।",
        invalidOrExpiredOtp: "OTP অবৈধ বা মেয়াদ শেষ হয়ে গেছে।",
        unableToVerify: "OTP যাচাই করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      security: "আপনার তথ্য নিরাপদে সুরক্ষিত রাখা হয়েছে।",
    },
    language: {
      label: "ভাষা",
    },
    assessment: {
      stepOf: "ধাপ {step}/{total}",
      subtitle: "আপনি স্বাভাবিকভাবে কথা বলতে পারেন বা নিচের একটি বিকল্প বেছে নিতে পারেন।",
      continue: "চালিয়ে যান",
      voice: {
        label: "ভয়েস",
        listening: "শুনছি...",
        tapToSpeak: "কথা বলতে ট্যাপ করুন",
        transcript: "আমি শুনছি. আজ জেনে নিই আপনাকে এখানে কিসে নিয়ে এসেছে।",
        chooseAnswer: "আপনার অনুভূতি সবচেয়ে ভালো বর্ণনা করে এমন বিকল্পটি বেছে নিন।",
      },
      questions: {
        defaultQuestion: "আজ আপনাকে হাসপাতালে কী এনেছে?",
        options: {
          chestPain: "বুকে ব্যথা",
          fever: "জ্বর",
          headache: "মাথাব্যথা",
          none: "এগুলোর কোনোটিই নয়",
        },
      },
      preliminaryNotice:
        "আপনার উত্তর ক্লিনিকাল টিমের জন্য একটি প্রাথমিক মূল্যায়ন প্রস্তুত করতে সাহায্য করে।",
    },
    patientDocuments: {
      breadcrumb: "নথিপত্র",
      title: "নথিপত্র আপলোড করুন",
      subtitle: "আপনার প্রেসক্রিপশন, ল্যাব রিপোর্ট, বা অন্যান্য মেডিকেল রেকর্ড যোগ করুন।",
      scanDocument: "নথি স্ক্যান করুন",
      scanDocumentHint: "একটি কাগজের পৃষ্ঠা স্ক্যান করতে ক্যামেরা ব্যবহার করুন",
      uploadFile: "ফাইল আপলোড করুন",
      uploadFileHint: "আপনার ডিভাইস থেকে একটি ফাইল নির্বাচন করুন",
      documents: "নথিপত্র",
      statusProcessed: "প্রক্রিয়া সম্পন্ন",
      statusProcessing: "প্রক্রিয়া চলছে...",
      continue: "চালিয়ে যান",
      qrTitle: "মোবাইলের মাধ্যমে আপলোড করুন",
      qrHint: "সরাসরি ফাইল আপলোড করতে আপনার ফোন দিয়ে এই QR কোডটি স্ক্যান করুন",
      docNames: {
        prescription: "প্রেসক্রিপশন",
        labReport: "ল্যাব রিপোর্ট",
        dischargeSummary: "ডিসচার্জ সামারি",
      },
    },
    confirmation: {
      breadcrumb: "নিশ্চিতকরণ",
      title: "আপনার বিবরণ পর্যালোচনা করুন",
      subtitle: "শেষ করার আগে অনুগ্রহ করে নিচের তথ্যগুলো যাচাই করুন।",
      mainProblem: "প্রধান সমস্যা",
      medicalConditions: "চিকিৎসাগত অবস্থা",
      medicines: "ওষুধ",
      documents: "নথিপত্র",
      documentsProcessed: "{count}টি নথি প্রক্রিয়া করা হয়েছে",
      edit: "সম্পাদনা করুন",
      confirmAndFinish: "নিশ্চিত করুন এবং শেষ করুন",
    },
    doctorDashboard: {
      brand: "MediKiosk",
      subtitle: "OPD ড্যাশবোর্ড",
      doctorLabel: "ডাক্তার",
      settingsLabel: "সেটিংস",
      queueTitle: "রোগীর সারি",
      patientLabel: "রোগী #{id}",
      alertLabel: "সতর্কতা",
      alertTitle: "গুরুতর সতর্কতা",
      tabs: {
        summary: "সারসংক্ষেপ",
        timeline: "টাইমলাইন",
        documents: "নথিপত্র",
        fullHistory: "সম্পূর্ণ ইতিহাস",
      },
      fields: {
        chiefComplaint: "প্রধান অভিযোগ",
        historyOfPresentIllness: "বর্তমান রোগের ইতিহাস",
        pastHistory: "অতীতের ইতিহাস",
        medications: "ওষুধ",
        investigations: "তদন্ত",
      },
      editSummary: "সারসংক্ষেপ সম্পাদনা করুন",
      confirm: "নিশ্চিত করুন",
    },
  },

  ta: {
    auth: {
      brand: "MediKiosk",
      clinicalIntake: "மருத்துவ தகவல்",
      email: {
        title: "MediKiosk-க்கு வரவேற்கிறோம்",
        subtitle: "தொடர உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
        label: "மின்னஞ்சல் முகவரி",
        placeholder: "மின்னஞ்சல் முகவரியை உள்ளிடவும்",
        continue: "தொடரவும்",
        sendingOtp: "OTP அனுப்பப்படுகிறது...",
        otpInfo: "உங்கள் மின்னஞ்சல் முகவரிக்கு ஒரு முறை பயன்படுத்தக்கூடிய கடவுச்சொல்லை அனுப்புவோம்.",
      },
      otp: {
        title: "உங்கள் மின்னஞ்சலை சரிபார்க்கவும்",
        subtitle: "அனுப்பப்பட்ட 6 இலக்க OTP-ஐ உள்ளிடவும்",
        verify: "சரிபார்த்து தொடரவும்",
        verifying: "சரிபார்க்கப்படுகிறது...",
        didntReceive: "OTP கிடைக்கவில்லையா?",
        resend: "OTP-ஐ மீண்டும் அனுப்பவும்",
        resendIn: "{seconds} வினாடிகளில் மீண்டும் அனுப்பவும்",
        changeNumber: "மின்னஞ்சலை மாற்றவும்",
      },
      errors: {
        invalidEmail: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
        unableToSend: "OTP அனுப்ப முடியவில்லை.",
        somethingWentWrong: "ஏதோ தவறு ஏற்பட்டது.",
        invalidOtpLength: "6 இலக்க OTP-ஐ உள்ளிடவும்.",
        invalidOrExpiredOtp: "OTP தவறானது அல்லது காலாவதியாகிவிட்டது.",
        unableToVerify: "OTP-ஐ சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
      },
      security: "உங்கள் தகவல் பாதுகாப்பாகப் பாதுகாக்கப்படுகிறது.",
    },
    language: {
      label: "மொழி",
    },
    assessment: {
      stepOf: "படி {step}/{total}",
      subtitle: "நீங்கள் இயல்பாகப் பேசலாம் அல்லது கீழே ஒரு விருப்பத்தைத் தேர்வுசெய்யலாம்.",
      continue: "தொடரவும்",
      voice: {
        label: "குரல்",
        listening: "கேட்கிறேன்...",
        tapToSpeak: "பேச தட்டவும்",
        transcript: "நான் கேட்கிறேன். என்ன உங்களை இங்கு அழைத்து வந்தது என்று சொல்லுங்கள்.",
        chooseAnswer: "உங்கள் உணர்வை சிறப்பாக விவரிக்கும் விருப்பத்தைத் தேர்ந்தெடுக்கவும்.",
      },
      questions: {
        defaultQuestion: "இன்று என்ன உங்களை மருத்துவமனைக்கு அழைத்து வந்தது?",
        options: {
          chestPain: "மார்பில் வலி",
          fever: "காய்ச்சல்",
          headache: "தலைவலி",
          none: "இவை எதுவும் இல்லை",
        },
      },
      preliminaryNotice:
        "உங்கள் பதில்கள் மருத்துவக் குழுவுக்கு ஒரு ஆரம்ப மதிப்பீட்டைத் தயாரிக்க உதவுகின்றன.",
    },
    patientDocuments: {
      breadcrumb: "ஆவணங்கள்",
      title: "ஆவணங்களை பதிவேற்றவும்",
      subtitle: "உங்கள் மருந்துச் சீட்டுகள், ஆய்வக அறிக்கைகள் அல்லது பிற மருத்துவ பதிவுகளைச் சேர்க்கவும்.",
      scanDocument: "ஆவணத்தை ஸ்கேன் செய்யவும்",
      scanDocumentHint: "காகித பக்கத்தை ஸ்கேன் செய்ய கேமராவைப் பயன்படுத்தவும்",
      uploadFile: "கோப்பை பதிவேற்றவும்",
      uploadFileHint: "உங்கள் சாதனத்திலிருந்து ஒரு கோப்பைத் தேர்ந்தெடுக்கவும்",
      documents: "ஆவணங்கள்",
      statusProcessed: "செயலாக்கப்பட்டது",
      statusProcessing: "செயலாக்கப்படுகிறது...",
      continue: "தொடரவும்",
      qrTitle: "மொபைல் மூலம் பதிவேற்றவும்",
      qrHint: "கோப்புகளை நேரடியாகப் பதிவேற்ற, உங்கள் தொலைபேசியால் இந்த QR குறியீட்டை ஸ்கேன் செய்யவும்",
      docNames: {
        prescription: "மருந்துச் சீட்டு",
        labReport: "ஆய்வக அறிக்கை",
        dischargeSummary: "டிஸ்சார்ஜ் சுருக்கம்",
      },
    },
    confirmation: {
      breadcrumb: "உறுதிப்படுத்தல்",
      title: "உங்கள் விவரங்களைச் சரிபார்க்கவும்",
      subtitle: "முடிக்கும் முன் கீழேயுள்ள தகவலைச் சரிபார்க்கவும்.",
      mainProblem: "முக்கிய பிரச்சனை",
      medicalConditions: "மருத்துவ நிலைகள்",
      medicines: "மருந்துகள்",
      documents: "ஆவணங்கள்",
      documentsProcessed: "{count} ஆவணங்கள் செயலாக்கப்பட்டன",
      edit: "திருத்து",
      confirmAndFinish: "உறுதிப்படுத்தி முடிக்கவும்",
    },
    doctorDashboard: {
      brand: "MediKiosk",
      subtitle: "OPD டாஷ்போர்டு",
      doctorLabel: "மருத்துவர்",
      settingsLabel: "அமைப்புகள்",
      queueTitle: "நோயாளிகள் வரிசை",
      patientLabel: "நோயாளி #{id}",
      alertLabel: "எச்சரிக்கை",
      alertTitle: "முக்கிய எச்சரிக்கை",
      tabs: {
        summary: "சுருக்கம்",
        timeline: "காலவரிசை",
        documents: "ஆவணங்கள்",
        fullHistory: "முழு வரலாறு",
      },
      fields: {
        chiefComplaint: "முக்கிய குறை",
        historyOfPresentIllness: "தற்போதைய நோயின் வரலாறு",
        pastHistory: "கடந்த கால வரலாறு",
        medications: "மருந்துகள்",
        investigations: "பரிசோதனைகள்",
      },
      editSummary: "சுருக்கத்தைத் திருத்து",
      confirm: "உறுதிப்படுத்து",
    },
  },

  te: {
    auth: {
      brand: "MediKiosk",
      clinicalIntake: "క్లినికల్ సమాచారం",
      email: {
        title: "MediKiosk కు స్వాగతం",
        subtitle: "కొనసాగించడానికి మీ ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
        label: "ఇమెయిల్ చిరునామా",
        placeholder: "ఇమెయిల్ చిరునామాను నమోదు చేయండి",
        continue: "కొనసాగించండి",
        sendingOtp: "OTP పంపుతోంది...",
        otpInfo: "మీ ఇమెయిల్ చిరునామాకు ఒకసారి ఉపయోగించే పాస్‌వర్డ్‌ను పంపుతాము.",
      },
      otp: {
        title: "మీ ఇమెయిల్‌ను ధృవీకరించండి",
        subtitle: "పంపిన 6 అంకెల OTPని నమోదు చేయండి",
        verify: "ధృవీకరించి కొనసాగించండి",
        verifying: "ధృవీకరిస్తోంది...",
        didntReceive: "OTP అందలేదా?",
        resend: "OTPని మళ్లీ పంపండి",
        resendIn: "{seconds} సెకన్లలో మళ్లీ పంపండి",
        changeNumber: "ఇమెయిల్ మార్చండి",
      },
      errors: {
        invalidEmail: "చెల్లుబాటు అయ్యే ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
        unableToSend: "OTP పంపడం సాధ్యం కాలేదు.",
        somethingWentWrong: "ఏదో తప్పు జరిగింది.",
        invalidOtpLength: "6 అంకెల OTPని నమోదు చేయండి.",
        invalidOrExpiredOtp: "OTP చెల్లదు లేదా గడువు ముగిసింది.",
        unableToVerify: "OTPని ధృవీకరించడం సాధ్యం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
      },
      security: "మీ సమాచారం సురక్షితంగా రక్షించబడుతుంది.",
    },
    language: {
      label: "భాష",
    },
    assessment: {
      stepOf: "దశ {step}/{total}",
      subtitle: "మీరు సహజంగా మాట్లాడవచ్చు లేదా దిగువన ఒక ఎంపికను ఎంచుకోవచ్చు.",
      continue: "కొనసాగించండి",
      voice: {
        label: "వాయిస్",
        listening: "వింటున్నాను...",
        tapToSpeak: "మాట్లాడటానికి నొక్కండి",
        transcript: "నేను వింటున్నాను. మిమ్మల్ని ఇక్కడికి ఏమి తీసుకువచ్చిందో చెప్పండి.",
        chooseAnswer: "మీ అనుభూతిని ఉత్తమంగా వివరించే ఎంపికను ఎంచుకోండి.",
      },
      questions: {
        defaultQuestion: "ఈరోజు మిమ్మల్ని ఆసుపత్రికి ఏమి తీసుకువచ్చింది?",
        options: {
          chestPain: "ఛాతీ నొప్పి",
          fever: "జ్వరం",
          headache: "తలనొప్పి",
          none: "వీటిలో ఏదీ లేదు",
        },
      },
      preliminaryNotice:
        "మీ సమాధానాలు క్లినికల్ బృందం కోసం ఒక ప్రాథమిక మూల్యాంకనాన్ని సిద్ధం చేయడానికి సహాయపడతాయి.",
    },
    patientDocuments: {
      breadcrumb: "పత్రాలు",
      title: "పత్రాలను అప్‌లోడ్ చేయండి",
      subtitle: "మీ ప్రిస్క్రిప్షన్లు, ల్యాబ్ నివేదికలు లేదా ఇతర వైద్య రికార్డులను జోడించండి.",
      scanDocument: "పత్రాన్ని స్కాన్ చేయండి",
      scanDocumentHint: "కాగితం పేజీని స్కాన్ చేయడానికి కెమెరాను ఉపయోగించండి",
      uploadFile: "ఫైల్‌ను అప్‌లోడ్ చేయండి",
      uploadFileHint: "మీ పరికరం నుండి ఫైల్‌ను ఎంచుకోండి",
      documents: "పత్రాలు",
      statusProcessed: "ప్రోసెస్ చేయబడింది",
      statusProcessing: "ప్రోసెస్ చేయబడుతోంది...",
      continue: "కొనసాగించండి",
      qrTitle: "మొబైల్ ద్వారా అప్‌లోడ్ చేయండి",
      qrHint: "ఫైల్‌లను నేరుగా అప్‌లోడ్ చేయడానికి మీ ఫోన్‌తో ఈ QR కోడ్‌ను స్కాన్ చేయండి",
      docNames: {
        prescription: "ప్రిస్క్రిప్షన్",
        labReport: "ల్యాబ్ నివేదిక",
        dischargeSummary: "డిశ్చార్జ్ సారాంశం",
      },
    },
    confirmation: {
      breadcrumb: "ధృవీకరణ",
      title: "మీ వివరాలను సమీక్షించండి",
      subtitle: "ముగించడానికి ముందు దయచేసి దిగువ సమాచారాన్ని ధృవీకరించండి.",
      mainProblem: "ప్రధాన సమస్య",
      medicalConditions: "వైద్య పరిస్థితులు",
      medicines: "మందులు",
      documents: "పత్రాలు",
      documentsProcessed: "{count} పత్రాలు ప్రోసెస్ చేయబడ్డాయి",
      edit: "సవరించండి",
      confirmAndFinish: "ధృవీకరించి ముగించండి",
    },
    doctorDashboard: {
      brand: "MediKiosk",
      subtitle: "OPD డాష్‌బోర్డ్",
      doctorLabel: "డాక్టర్",
      settingsLabel: "సెట్టింగ్‌లు",
      queueTitle: "రోగుల క్యూ",
      patientLabel: "రోగి #{id}",
      alertLabel: "హెచ్చరిక",
      alertTitle: "క్లిష్టమైన హెచ్చరిక",
      tabs: {
        summary: "సారాంశం",
        timeline: "టైమ్‌లైన్",
        documents: "పత్రాలు",
        fullHistory: "పూర్తి చరిత్ర",
      },
      fields: {
        chiefComplaint: "ప్రధాన ఫిర్యాదు",
        historyOfPresentIllness: "ప్రస్తుత అనారోగ్య చరిత్ర",
        pastHistory: "గత చరిత్ర",
        medications: "మందులు",
        investigations: "దర్యాప్తులు",
      },
      editSummary: "సారాంశాన్ని సవరించండి",
      confirm: "నిర్ధారించండి",
    },
  },

  gu: {
    auth: {
      brand: "MediKiosk",
      clinicalIntake: "ક્લિનિકલ માહિતી",
      email: {
        title: "MediKiosk માં આપનું સ્વાગત છે",
        subtitle: "આગળ વધવા માટે તમારું ઇમેઇલ સરનામું દાખલ કરો.",
        label: "ઇમેઇલ સરનામું",
        placeholder: "ઇમેઇલ સરનામું દાખલ કરો",
        continue: "આગળ વધો",
        sendingOtp: "OTP મોકલવામાં આવી રહ્યો છે...",
        otpInfo: "અમે તમારા ઇમેઇલ સરનામાં પર એક વખત ઉપયોગ કરી શકાય તેવો પાસવર્ડ મોકલીશું.",
      },
      otp: {
        title: "તમારું ઇમેઇલ ચકાસો",
        subtitle: "મોકલવામાં આવેલ 6 અંકનો OTP દાખલ કરો",
        verify: "ચકાસો અને આગળ વધો",
        verifying: "ચકાસણી થઈ રહી છે...",
        didntReceive: "OTP મળ્યો નથી?",
        resend: "OTP ફરીથી મોકલો",
        resendIn: "{seconds} સેકન્ડમાં ફરીથી મોકલો",
        changeNumber: "ઇમેઇલ બદલો",
      },
      errors: {
        invalidEmail: "માન્ય ઇમેઇલ સરનામું દાખલ કરો.",
        unableToSend: "OTP મોકલી શકાયો નથી.",
        somethingWentWrong: "કંઈક ખોટું થયું.",
        invalidOtpLength: "6 અંકનો OTP દાખલ કરો.",
        invalidOrExpiredOtp: "OTP અમાન્ય છે અથવા તેની સમયસીમા સમાપ્ત થઈ ગઈ છે.",
        unableToVerify: "OTP ચકાસી શકાયો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
      },
      security: "તમારી માહિતી સુરક્ષિત રીતે સાચવવામાં આવે છે.",
    },
    language: {
      label: "ભાષા",
    },
    assessment: {
      stepOf: "પગલું {step}/{total}",
      subtitle: "તમે કુદરતી રીતે બોલી શકો છો અથવા નીચે એક વિકલ્પ પસંદ કરી શકો છો.",
      continue: "આગળ વધો",
      voice: {
        label: "અવાજ",
        listening: "સાંભળી રહ્યા છીએ...",
        tapToSpeak: "બોલવા માટે ટેપ કરો",
        transcript: "હું સાંભળી રહ્યો છું. તમને અહીં શું લાવ્યું તે અમને જણાવો.",
        chooseAnswer: "તમારી લાગણીનું શ્રેષ્ઠ વર્ણન કરતો વિકલ્પ પસંદ કરો.",
      },
      questions: {
        defaultQuestion: "આજે તમને હોસ્પિટલમાં શું લાવ્યું?",
        options: {
          chestPain: "છાતીમાં દુખાવો",
          fever: "તાવ",
          headache: "માથાનો દુખાવો",
          none: "આમાંથી કોઈ નહીં",
        },
      },
      preliminaryNotice:
        "તમારા જવાબો ક્લિનિકલ ટીમ માટે પ્રારંભિક મૂલ્યાંકન તૈયાર કરવામાં મદદ કરે છે.",
    },
    patientDocuments: {
      breadcrumb: "દસ્તાવેજો",
      title: "દસ્તાવેજો અપલોડ કરો",
      subtitle: "તમારા પ્રિસ્ક્રિપ્શન, લેબ રિપોર્ટ્સ અથવા અન્ય તબીબી રેકોર્ડ્સ ઉમેરો.",
      scanDocument: "દસ્તાવેજ સ્કેન કરો",
      scanDocumentHint: "ભૌતિક પૃષ્ઠને સ્કેન કરવા માટે કેમેરાનો ઉપયોગ કરો",
      uploadFile: "ફાઇલ અપલોડ કરો",
      uploadFileHint: "તમારા ઉપકરણમાંથી એક ફાઇલ પસંદ કરો",
      documents: "દસ્તાવેજો",
      statusProcessed: "પ્રક્રિયા થઈ ગઈ",
      statusProcessing: "પ્રક્રિયા થઈ રહી છે...",
      continue: "આગળ વધો",
      qrTitle: "મોબાઇલ દ્વારા અપલોડ કરો",
      qrHint: "ફાઇલો સીધી અપલોડ કરવા માટે તમારા ફોનથી આ QR કોડ સ્કેન કરો",
      docNames: {
        prescription: "પ્રિસ્ક્રિપ્શન",
        labReport: "લેબ રિપોર્ટ",
        dischargeSummary: "ડિસ્ચાર્જ સારાંશ",
      },
    },
    confirmation: {
      breadcrumb: "પુષ્ટિ",
      title: "તમારી વિગતોની સમીક્ષા કરો",
      subtitle: "કૃપા કરીને સમાપ્ત કરતા પહેલા નીચેની માહિતી ચકાસો.",
      mainProblem: "મુખ્ય સમસ્યા",
      medicalConditions: "તબીબી સ્થિતિઓ",
      medicines: "દવાઓ",
      documents: "દસ્તાવેજો",
      documentsProcessed: "{count} દસ્તાવેજો પર પ્રક્રિયા થઈ ગઈ",
      edit: "સંપાદિત કરો",
      confirmAndFinish: "પુષ્ટિ કરો અને સમાપ્ત કરો",
    },
    doctorDashboard: {
      brand: "MediKiosk",
      subtitle: "OPD ડેશબોર્ડ",
      doctorLabel: "ડૉક્ટર",
      settingsLabel: "સેટિંગ્સ",
      queueTitle: "દર્દીઓની કતાર",
      patientLabel: "દર્દી #{id}",
      alertLabel: "ચેતવણી",
      alertTitle: "ગંભીર ચેતવણી",
      tabs: {
        summary: "સારાંશ",
        timeline: "સમયરેખા",
        documents: "દસ્તાવેજો",
        fullHistory: "સંપૂર્ણ ઇતિહાસ",
      },
      fields: {
        chiefComplaint: "મુખ્ય ફરિયાદ",
        historyOfPresentIllness: "વર્તમાન બીમારીનો ઇતિહાસ",
        pastHistory: "ભૂતકાળનો ઇતિહાસ",
        medications: "દવાઓ",
        investigations: "તપાસ",
      },
      editSummary: "સારાંશ સંપાદિત કરો",
      confirm: "પુષ્ટિ કરો",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  const translation = translations[locale] ?? {};

  return {
    ...english,
    ...translation,
    welcome: {
      ...english.welcome,
      ...translation.welcome,
    },
    voiceTouch: {
      ...english.voiceTouch,
      ...translation.voiceTouch,
    },
    language: {
      ...english.language,
      ...translation.language,
    },
    auth: {
      ...english.auth,
      ...translation.auth,
      email: {
        ...english.auth.email,
        ...translation.auth?.email,
      },
      otp: {
        ...english.auth.otp,
        ...translation.auth?.otp,
      },
      errors: {
        ...english.auth.errors,
        ...translation.auth?.errors,
      },
    },
    assessment: {
      ...english.assessment,
      ...translation.assessment,
      voice: {
        ...english.assessment.voice,
        ...translation.assessment?.voice,
      },
      questions: {
        ...english.assessment.questions,
        ...translation.assessment?.questions,
        options: {
          ...english.assessment.questions.options,
          ...translation.assessment?.questions?.options,
        },
      },
    },
    patientDocuments: {
      ...english.patientDocuments,
      ...translation.patientDocuments,
      docNames: {
        ...english.patientDocuments.docNames,
        ...translation.patientDocuments?.docNames,
      },
    },
    confirmation: {
      ...english.confirmation,
      ...translation.confirmation,
    },
    doctorDashboard: {
      ...english.doctorDashboard,
      ...translation.doctorDashboard,
      tabs: {
        ...english.doctorDashboard.tabs,
        ...translation.doctorDashboard?.tabs,
      },
      fields: {
        ...english.doctorDashboard.fields,
        ...translation.doctorDashboard?.fields,
      },
    },
  };
}