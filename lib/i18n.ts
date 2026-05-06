import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.home': 'Home',
      'nav.punchcard': 'Punch Card',
      'nav.travellog': 'Travel Log',
      'nav.enforcement': 'Enforcement Data',
      'nav.admin': 'Super Admin',
      'nav.logout': 'Logout',
      
      // Auth
      'auth.title': 'Welcome to PulseGrid',
      'auth.subtitle': 'Smart Data-Driven Ecosystem',
      'auth.vision': 'Building a real-time data-driven smart ecosystem',
      'auth.mission': 'Empowering communities and businesses to make fast data-driven decisions',
      'auth.login': 'Login with Google',
      'auth.adminLogin': 'Super Admin Login',
      'auth.username': 'Username',
      'auth.password': 'Password',
      
      // Dashboard
      'dashboard.welcome': 'Welcome',
      'dashboard.version': 'Version',
      'dashboard.announcements': 'Announcements',
      
      // Punch Card
      'punchcard.title': 'Time Card',
      'punchcard.name': 'NAME',
      'punchcard.department': 'DEPT./DIV.',
      'punchcard.section': 'SECTION',
      'punchcard.month': 'MONTH',
      'punchcard.date': 'DATE',
      'punchcard.in': 'IN',
      'punchcard.out': 'OUT',
      'punchcard.remarks': 'REMARKS',
      'punchcard.signature': 'SIGNATURE',
      'punchcard.saturday': 'Saturday',
      'punchcard.sunday': 'Sunday',
      'punchcard.save': 'Save',
      'punchcard.export': 'Export',
      'punchcard.print': 'Print',
      
      // Travel Log
      'travel.title': 'Travel Log',
      'travel.date': 'DATE',
      'travel.time': 'TIME',
      'travel.departure': 'DEPARTURE TIME',
      'travel.return': 'RETURN TIME',
      'travel.driver': 'DRIVER',
      'travel.purpose': 'PURPOSE',
      'travel.approver': 'APPROVER',
      'travel.user': 'USER',
      'travel.odoEnd': 'ODO END',
      'travel.distance': 'DISTANCE',
      'travel.cost': 'COST & RECEIPT',
      'travel.liter': 'LITER',
      'travel.notes': 'NOTES',
      'travel.addNew': 'Add New Entry',
      
      // Enforcement
      'enforcement.title': 'Enforcement Data',
      'enforcement.addNew': 'Add New Case',
      
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.print': 'Print',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
    }
  },
  ms: {
    translation: {
      // Navigation
      'nav.home': 'Utama',
      'nav.punchcard': 'Kad Mencatat Waktu',
      'nav.travellog': 'Log Perjalanan',
      'nav.enforcement': 'Data Penguatkuasa',
      'nav.admin': 'Super Admin',
      'nav.logout': 'Log Keluar',
      
      // Auth
      'auth.title': 'Selamat Datang ke PulseGrid',
      'auth.subtitle': 'Ekosistem Pintar Berasaskan Data',
      'auth.vision': 'Membina ekosistem pintar berasaskan data masa nyata',
      'auth.mission': 'Memberi kuasa kepada komuniti dan perniagaan untuk membuat keputusan pantas berasaskan data',
      'auth.login': 'Log Masuk dengan Google',
      'auth.adminLogin': 'Log Masuk Super Admin',
      'auth.username': 'Nama Pengguna',
      'auth.password': 'Kata Laluan',
      
      // Dashboard
      'dashboard.welcome': 'Selamat Datang',
      'dashboard.version': 'Versi',
      'dashboard.announcements': 'Pengumuman',
      
      // Punch Card
      'punchcard.title': 'Kad Mencatat Waktu',
      'punchcard.name': 'NAMA',
      'punchcard.department': 'KEM./JAB.',
      'punchcard.section': 'BAHAGIAN/SEKSYEN',
      'punchcard.month': 'BULAN',
      'punchcard.date': 'TARIKH',
      'punchcard.in': 'MASUK',
      'punchcard.out': 'KELUAR',
      'punchcard.remarks': 'KENYATAAN',
      'punchcard.signature': 'T/T',
      'punchcard.saturday': 'Sabtu',
      'punchcard.sunday': 'Ahad',
      'punchcard.save': 'Simpan',
      'punchcard.export': 'Eksport',
      'punchcard.print': 'Cetak',
      
      // Travel Log
      'travel.title': 'Log Perjalanan',
      'travel.date': 'TARIKH',
      'travel.time': 'MASA',
      'travel.departure': 'MASA PERGI',
      'travel.return': 'MASA BALIK',
      'travel.driver': 'PEMANDU',
      'travel.purpose': 'TUJUAN',
      'travel.approver': 'PELULUS',
      'travel.user': 'PENGGUNA',
      'travel.odoEnd': 'ODO AKHIR',
      'travel.distance': 'JARAK',
      'travel.cost': 'KOS & RESIT',
      'travel.liter': 'LITER',
      'travel.notes': 'NOTA',
      'travel.addNew': 'Tambah Entri Baharu',
      
      // Enforcement
      'enforcement.title': 'Data Penguatkuasa',
      'enforcement.addNew': 'Tambah Kes Baharu',
      
      // Common
      'common.save': 'Simpan',
      'common.cancel': 'Batal',
      'common.delete': 'Padam',
      'common.edit': 'Edit',
      'common.add': 'Tambah',
      'common.search': 'Cari',
      'common.filter': 'Tapis',
      'common.export': 'Eksport',
      'common.print': 'Cetak',
      'common.loading': 'Memuatkan...',
      'common.error': 'Ralat',
      'common.success': 'Berjaya',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ms',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
