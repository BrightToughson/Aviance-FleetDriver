const fs = require('fs');
const path = require('path');

const localesDir = 'b:/All codes/React Native/Work Projects/Aviance Fleet Management system/Aviance-FleetDriver/src/i18n/locales';

const translations = {
  en: {
    "d_rem_upcoming": "Upcoming Reminders",
    "d_rem_add": "Add Reminder",
    "d_rem_all_list": "All Reminders",
    "d_rem_empty": "No reminders found.",
    "d_rem_edit": "Edit Reminder",
    "d_rem_new_title": "New Reminder",
    "d_rem_lbl_task": "Reminder Task *",
    "d_rem_update_btn": "Update Reminder",

    "d_search_ph": "Search tasks, vehicles, issues...",
    "d_search_recent": "Recent Searches",
    "d_search_clear": "Clear",
    "d_search_no_recent": "No recent searches",
    "d_search_results": "Search Results",
    "d_search_no_results": "No results found for",

    "d_veh_title": "Vehicle Details",
    "d_veh_active": "Active",
    "d_veh_unassigned": "Unassigned",
    "d_veh_current": "Current Active Vehicle",
    "d_veh_no_assigned": "No Vehicle Assigned",
    "d_veh_specs": "Specifications & Status",
    "d_veh_make": "Make & Model",
    "d_veh_plate": "License Plate",
    "d_veh_vin": "VIN",
    "d_veh_odo": "Odometer",
    "d_veh_fuel_level": "Fuel Level",
    "d_veh_last_service": "Last Service",
    "d_veh_recent_issues": "Recent Issues"
  },
  tw: {
    "d_rem_upcoming": "Nkaebɔ a Ɛreba",
    "d_rem_add": "Fa Nkaebɔ Ka Ho",
    "d_rem_all_list": "Nkaebɔ Nyinaa",
    "d_rem_empty": "Nkaebɔ biara nni hɔ.",
    "d_rem_edit": "Siesie Nkaebɔ",
    "d_rem_new_title": "Nkaebɔ Foforɔ",
    "d_rem_lbl_task": "Nkaebɔ Adwuma *",
    "d_rem_update_btn": "Yɛ Nsesa Wɔ Nkaebɔ",

    "d_search_ph": "Hwehwɛ adwuma, afiri, nsɛm...",
    "d_search_recent": "Nea Wahwehwɛ Foforɔ",
    "d_search_clear": "Pepa",
    "d_search_no_recent": "Wahwehwɛ biara foforɔ nni hɔ",
    "d_search_results": "Nea Aba Wɔ Hwehwɛ Mu",
    "d_search_no_results": "Hwee amma mma",

    "d_veh_title": "Afiri no ho Nsɛm",
    "d_veh_active": "Ɛreyɛ Adwuma",
    "d_veh_unassigned": "Wɔmfa mmaa obiara",
    "d_veh_current": "Afiri a Wode Reyɛ Adwuma Seesei",
    "d_veh_no_assigned": "Wɔmfa Afiri Biara Mmaa Obiara",
    "d_veh_specs": "Ne Su & Tebea",
    "d_veh_make": "Nea Yɛɛe & Model",
    "d_veh_plate": "Laisɛns Plate",
    "d_veh_vin": "VIN",
    "d_veh_odo": "Odometer",
    "d_veh_fuel_level": "Pɛtro Dodoɔ",
    "d_veh_last_service": "Da a Wɔsiesiee Foforɔ",
    "d_veh_recent_issues": "Nsɛm a Asisi Foforɔ"
  },
  ar: {
    "d_rem_upcoming": "التذكيرات القادمة",
    "d_rem_add": "إضافة تذكير",
    "d_rem_all_list": "كل التذكيرات",
    "d_rem_empty": "لم يتم العثور على تذكيرات.",
    "d_rem_edit": "تعديل التذكير",
    "d_rem_new_title": "تذكير جديد",
    "d_rem_lbl_task": "مهمة التذكير *",
    "d_rem_update_btn": "تحديث التذكير",

    "d_search_ph": "ابحث عن المهام والمركبات والمشكلات...",
    "d_search_recent": "عمليات البحث الأخيرة",
    "d_search_clear": "مسح",
    "d_search_no_recent": "لا توجد عمليات بحث أخيرة",
    "d_search_results": "نتائج البحث",
    "d_search_no_results": "لم يتم العثور على نتائج لـ",

    "d_veh_title": "تفاصيل المركبة",
    "d_veh_active": "نشط",
    "d_veh_unassigned": "غير معين",
    "d_veh_current": "المركبة النشطة الحالية",
    "d_veh_no_assigned": "لم يتم تعيين مركبة",
    "d_veh_specs": "المواصفات والحالة",
    "d_veh_make": "النوع والموديل",
    "d_veh_plate": "لوحة الترخيص",
    "d_veh_vin": "رقم الشاسيه",
    "d_veh_odo": "عداد المسافات",
    "d_veh_fuel_level": "مستوى الوقود",
    "d_veh_last_service": "آخر صيانة",
    "d_veh_recent_issues": "المشكلات الأخيرة"
  },
  fr: {
    "d_rem_upcoming": "Rappels à Venir",
    "d_rem_add": "Ajouter Rappel",
    "d_rem_all_list": "Tous les Rappels",
    "d_rem_empty": "Aucun rappel trouvé.",
    "d_rem_edit": "Modifier le Rappel",
    "d_rem_new_title": "Nouveau Rappel",
    "d_rem_lbl_task": "Tâche du Rappel *",
    "d_rem_update_btn": "Mettre à Jour Rappel",

    "d_search_ph": "Rechercher tâches, véhicules, problèmes...",
    "d_search_recent": "Recherches Récentes",
    "d_search_clear": "Effacer",
    "d_search_no_recent": "Aucune recherche récente",
    "d_search_results": "Résultats de Recherche",
    "d_search_no_results": "Aucun résultat trouvé pour",

    "d_veh_title": "Détails du Véhicule",
    "d_veh_active": "Actif",
    "d_veh_unassigned": "Non Assigné",
    "d_veh_current": "Véhicule Actif Actuel",
    "d_veh_no_assigned": "Aucun Véhicule Assigné",
    "d_veh_specs": "Spécifications & Statut",
    "d_veh_make": "Marque & Modèle",
    "d_veh_plate": "Plaque d'Immatriculation",
    "d_veh_vin": "VIN",
    "d_veh_odo": "Odomètre",
    "d_veh_fuel_level": "Niveau de Carburant",
    "d_veh_last_service": "Dernier Entretien",
    "d_veh_recent_issues": "Problèmes Récents"
  },
  es: {
    "d_rem_upcoming": "Próximos Recordatorios",
    "d_rem_add": "Añadir Recordatorio",
    "d_rem_all_list": "Todos los Recordatorios",
    "d_rem_empty": "No se encontraron recordatorios.",
    "d_rem_edit": "Editar Recordatorio",
    "d_rem_new_title": "Nuevo Recordatorio",
    "d_rem_lbl_task": "Tarea de Recordatorio *",
    "d_rem_update_btn": "Actualizar Recordatorio",

    "d_search_ph": "Buscar tareas, vehículos, problemas...",
    "d_search_recent": "Búsquedas Recientes",
    "d_search_clear": "Borrar",
    "d_search_no_recent": "No hay búsquedas recientes",
    "d_search_results": "Resultados de Búsqueda",
    "d_search_no_results": "No se encontraron resultados para",

    "d_veh_title": "Detalles del Vehículo",
    "d_veh_active": "Activo",
    "d_veh_unassigned": "No Asignado",
    "d_veh_current": "Vehículo Activo Actual",
    "d_veh_no_assigned": "Ningún Vehículo Asignado",
    "d_veh_specs": "Especificaciones y Estado",
    "d_veh_make": "Marca y Modelo",
    "d_veh_plate": "Matrícula",
    "d_veh_vin": "VIN",
    "d_veh_odo": "Odómetro",
    "d_veh_fuel_level": "Nivel de Combustible",
    "d_veh_last_service": "Último Servicio",
    "d_veh_recent_issues": "Problemas Recientes"
  },
  ha: {
    "d_rem_upcoming": "Tunatarwa masu zuwa",
    "d_rem_add": "Saka Tunatarwa",
    "d_rem_all_list": "Dukkan Tunatarwa",
    "d_rem_empty": "Babu tunatarwa.",
    "d_rem_edit": "Gyara Tunatarwa",
    "d_rem_new_title": "Sabon Tunatarwa",
    "d_rem_lbl_task": "Aikin Tunatarwa *",
    "d_rem_update_btn": "Sabunta Tunatarwa",

    "d_search_ph": "Nemo ayyuka, ababen hawa, matsaloli...",
    "d_search_recent": "Bincike na Kusa",
    "d_search_clear": "Goge",
    "d_search_no_recent": "Babu bincike na kusa",
    "d_search_results": "Sakamakon Bincike",
    "d_search_no_results": "Babu sakamako don",

    "d_veh_title": "Bayanan Abin Hawa",
    "d_veh_active": "Mai aiki",
    "d_veh_unassigned": "Babu wanda aka baiwa",
    "d_veh_current": "Abin hawa na yanzu",
    "d_veh_no_assigned": "Babu Abin Hawa Da Aka Bada",
    "d_veh_specs": "Bayanai & Yanayi",
    "d_veh_make": "Kera & Tsari",
    "d_veh_plate": "Lambar Mota",
    "d_veh_vin": "VIN",
    "d_veh_odo": "Odometer",
    "d_veh_fuel_level": "Matsayin Man Fetur",
    "d_veh_last_service": "Kulawa ta karshe",
    "d_veh_recent_issues": "Matsalolin Kusa"
  },
  ga: {
    "d_rem_upcoming": "Nkaemɔ Ni Baaba",
    "d_rem_add": "Kɛ Nkaemɔ Afata He",
    "d_rem_all_list": "Nkaemɔ Fɛɛ",
    "d_rem_empty": "Anáaa nkaemɔ ko.",
    "d_rem_edit": "Saamɔ Nkaemɔ",
    "d_rem_new_title": "Nkaemɔ Kroko",
    "d_rem_lbl_task": "Nkaemɔ Nitsumɔ *",
    "d_rem_update_btn": "Saamɔ Nkaemɔ",

    "d_search_ph": "Tao nitsumɔi, tsɔji, saji amli...",
    "d_search_recent": "Nibi Amlitaomɔ Ni Tsɔ Hiɛ",
    "d_search_clear": "Tsumɔ",
    "d_search_no_recent": "Nibi amlitaomɔ ni tsɔ hiɛ bɛ hɔ",
    "d_search_results": "Amlitaomɔ Nyaa Nibi",
    "d_search_no_results": "Anáaa nɔ ko aha",

    "d_veh_title": "Tsɔne Lɛ He Nsɛm",
    "d_veh_active": "Miiya Nɔ",
    "d_veh_unassigned": "Akɛhaaa",
    "d_veh_current": "Tsɔne Ni Tsuɔ Nii Amrɔ Nɛɛ",
    "d_veh_no_assigned": "Akɛ Tsɔne Ko Haaa",
    "d_veh_specs": "Esu & Shidaamɔ",
    "d_veh_make": "Bɔ Ni Afee Lɛ & Nɔkwɛmɔ Nɔ",
    "d_veh_plate": "Laisɛns Pleti",
    "d_veh_vin": "VIN",
    "d_veh_odo": "Odometer",
    "d_veh_fuel_level": "Pɛtro Shidaamɔ",
    "d_veh_last_service": "Nitsumɔ Naagbee",
    "d_veh_recent_issues": "Saji Ni Eba Nyɛsɛɛ Nɛɛ"
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
