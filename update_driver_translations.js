const fs = require('fs');
const path = require('path');

const localesDir = 'b:/All codes/React Native/Work Projects/Aviance Fleet Management system/Aviance-FleetDriver/src/i18n/locales';

const translations = {
  en: {
    "d_dash_greeting": "Good Morning, Driver!",
    "d_dash_curr_vehicle": "Current Vehicle",
    "d_dash_no_vehicle": "No Vehicle Assigned",
    "d_dash_assigned": "Assigned",
    "d_dash_none": "None",
    "d_dash_plate": "Plate: ",
    "d_dash_fuel": "Fuel: ",
    "d_dash_quick_actions": "Quick Actions",
    "d_dash_action_start": "Start Trip",
    "d_dash_action_issue": "Report Issue",
    "d_dash_action_fuel": "Log Fuel",
    "d_dash_action_inspect": "Inspection",
    "d_dash_today_schedule": "Today's Schedule",
    "d_dash_no_schedules": "No schedules created.",
    "d_dash_anytime": "Anytime",
    "d_dash_today_assignments": "Today's Assignments"
  },
  tw: {
    "d_dash_greeting": "Maakye, Kwanhwɛfoɔ!",
    "d_dash_curr_vehicle": "Lorry a Woka Seesei",
    "d_dash_no_vehicle": "Wɔmmaa Wo Lorry",
    "d_dash_assigned": "Wɔama Wo",
    "d_dash_none": "Hwee Nni Hɔ",
    "d_dash_plate": "Nnɔmba: ",
    "d_dash_fuel": "Pɛtro: ",
    "d_dash_quick_actions": "Nneɛma a Wɔyɛ Ntɛm",
    "d_dash_action_start": "Firi Akwantuo Ase",
    "d_dash_action_issue": "Bɔ Mfomsoɔ Dawuro",
    "d_dash_action_fuel": "Twerɛ Pɛtro",
    "d_dash_action_inspect": "Lorry Hwɛmɔ",
    "d_dash_today_schedule": "Ɛnnɛ Nhyehyɛeɛ",
    "d_dash_no_schedules": "Nhyehyɛeɛ biara nni hɔ.",
    "d_dash_anytime": "Bere Biara",
    "d_dash_today_assignments": "Ɛnnɛ Nnwuma"
  },
  ar: {
    "d_dash_greeting": "صباح الخير أيها السائق!",
    "d_dash_curr_vehicle": "المركبة الحالية",
    "d_dash_no_vehicle": "لا توجد مركبة مخصصة",
    "d_dash_assigned": "مخصص",
    "d_dash_none": "لا شيء",
    "d_dash_plate": "اللوحة: ",
    "d_dash_fuel": "الوقود: ",
    "d_dash_quick_actions": "إجراءات سريعة",
    "d_dash_action_start": "بدء الرحلة",
    "d_dash_action_issue": "الإبلاغ عن مشكلة",
    "d_dash_action_fuel": "سجل الوقود",
    "d_dash_action_inspect": "تفتيش",
    "d_dash_today_schedule": "جدول اليوم",
    "d_dash_no_schedules": "لا توجد جداول.",
    "d_dash_anytime": "في أي وقت",
    "d_dash_today_assignments": "مهام اليوم"
  },
  fr: {
    "d_dash_greeting": "Bonjour, Conducteur!",
    "d_dash_curr_vehicle": "Véhicule Actuel",
    "d_dash_no_vehicle": "Aucun Véhicule Assigné",
    "d_dash_assigned": "Assigné",
    "d_dash_none": "Aucun",
    "d_dash_plate": "Plaque: ",
    "d_dash_fuel": "Carburant: ",
    "d_dash_quick_actions": "Actions Rapides",
    "d_dash_action_start": "Commencer Trajet",
    "d_dash_action_issue": "Signaler Problème",
    "d_dash_action_fuel": "Noter Carburant",
    "d_dash_action_inspect": "Inspection",
    "d_dash_today_schedule": "Programme du Jour",
    "d_dash_no_schedules": "Aucun programme créé.",
    "d_dash_anytime": "À tout moment",
    "d_dash_today_assignments": "Missions du Jour"
  },
  es: {
    "d_dash_greeting": "¡Buenos días, Conductor!",
    "d_dash_curr_vehicle": "Vehículo Actual",
    "d_dash_no_vehicle": "Ningún Vehículo Asignado",
    "d_dash_assigned": "Asignado",
    "d_dash_none": "Ninguno",
    "d_dash_plate": "Placa: ",
    "d_dash_fuel": "Combustible: ",
    "d_dash_quick_actions": "Acciones Rápidas",
    "d_dash_action_start": "Iniciar Viaje",
    "d_dash_action_issue": "Reportar Problema",
    "d_dash_action_fuel": "Registrar Combustible",
    "d_dash_action_inspect": "Inspección",
    "d_dash_today_schedule": "Horario de Hoy",
    "d_dash_no_schedules": "No hay horarios creados.",
    "d_dash_anytime": "Cualquier momento",
    "d_dash_today_assignments": "Asignaciones de Hoy"
  },
  ha: {
    "d_dash_greeting": "Ina kwana, Direba!",
    "d_dash_curr_vehicle": "Motar Yanzu",
    "d_dash_no_vehicle": "Ba a Bada Mota Ba",
    "d_dash_assigned": "An Bada",
    "d_dash_none": "Babu",
    "d_dash_plate": "Farantin: ",
    "d_dash_fuel": "Mai: ",
    "d_dash_quick_actions": "Ayyuka Masu Sauri",
    "d_dash_action_start": "Fara Tafiya",
    "d_dash_action_issue": "Bada Rahoton Matsala",
    "d_dash_action_fuel": "Rubuta Mai",
    "d_dash_action_inspect": "Bincike",
    "d_dash_today_schedule": "Jadawalin Yau",
    "d_dash_no_schedules": "Babu jadawalin da aka ƙirƙira.",
    "d_dash_anytime": "Kowane lokaci",
    "d_dash_today_assignments": "Ayyukan Yau"
  },
  ga: {
    "d_dash_greeting": "Ojekoo, Tsɔɔlɔ!",
    "d_dash_curr_vehicle": "Lɔrry ni okwɛɔ amrɔ nɛɛ",
    "d_dash_no_vehicle": "Ahaaa bo Lɔrry",
    "d_dash_assigned": "Ahã bo",
    "d_dash_none": "Bɛ",
    "d_dash_plate": "Nɔmba: ",
    "d_dash_fuel": "Pɛtro: ",
    "d_dash_quick_actions": "Níi oyatsɔ",
    "d_dash_action_start": "Jee Gbɛfaa Shishi",
    "d_dash_action_issue": "Bɔ Mfomso Amaniɛ",
    "d_dash_action_fuel": "Ŋmaa Pɛtro",
    "d_dash_action_inspect": "Hwɛmɔ",
    "d_dash_today_schedule": "Ŋmɛnɛ Gbɛjianɔtoo",
    "d_dash_no_schedules": "Bɛ gbɛjianɔtoo ko.",
    "d_dash_anytime": "Be fɛɛ be",
    "d_dash_today_assignments": "Ŋmɛnɛ Nitsumɔi"
  }
};

const languages = ['en', 'tw', 'ar', 'fr', 'es', 'ha', 'ga'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const newLangKeys = translations[lang];
      if (newLangKeys) {
        Object.assign(data, newLangKeys);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${lang}.json`);
      }
    } catch (e) {
      console.error(`Failed to process ${lang}.json:`, e);
    }
  }
});
