import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { db, auth } from '../../firebase/config'
import logoYppt from '../../assets/logo.jpg'

export default function Dashboard() {
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/6289987654310')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'recruitment')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.whatsappGroupLink) {
            setWhatsappLink(data.whatsappGroupLink)
          }
        }
      } catch (error) {
        console.error('Error fetching settings for WhatsApp link:', error)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    let unsubscribeApplication = null

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setApplication(null)
        setLoading(false)
        setNotFound(true)
        return
      }

      const q = query(
        collection(db, 'applications'),
        where('userId', '==', currentUser.uid)
      )

      unsubscribeApplication = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            setApplication(null)
            setNotFound(true)
            setLoading(false)
            return
          }

          const applications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))

          const sortedApplications = applications.sort((a, b) => {
            const dateA = a.updatedAt?.toDate?.() || a.submittedAt?.toDate?.() || new Date(0)
            const dateB = b.updatedAt?.toDate?.() || b.submittedAt?.toDate?.() || new Date(0)

            return dateB - dateA
          })

          const latestApplication = sortedApplications[0]

          setApplication(latestApplication)
          setNotFound(false)
          setLoading(false)

          localStorage.setItem('lastApplicationId', latestApplication.id)

          if (latestApplication.registrationNumber) {
            localStorage.setItem(
              'lastRegistrationNumber',
              latestApplication.registrationNumber
            )
          }
        },
        (error) => {
          console.error('Gagal mengambil status pendaftaran:', error)
          setApplication(null)
          setNotFound(true)
          setLoading(false)
        }
      )
    })

    return () => {
      unsubscribeAuth()

      if (unsubscribeApplication) {
        unsubscribeApplication()
      }
    }
  }, [])

  const personalData = application?.personalData || {}
  const documents = application?.documents || {}

  const fullName =
    personalData.fullName ||
    personalData.name ||
    personalData.nama ||
    'Calon Peserta'

  const status = application?.status || 'Menunggu Verifikasi'
  const notes = application?.notes || ''
  const isFinalAccepted = application?.isFinalAccepted === true
  const finalStatus = application?.finalStatus || ''

  const displayStatus = isFinalAccepted
    ? 'Diterima dan Tervalidasi'
    : status

  let registrationNumber =
    application?.registrationNumber ||
    localStorage.getItem('lastRegistrationNumber') ||
    'Belum tersedia'

  if (registrationNumber && registrationNumber.startsWith('RH-')) {
    registrationNumber = registrationNumber.replace('RH-', 'SPN-')
  }

  const qrPayload = application?.id
    ? `SIPENA:${application.id}`
    : ''

  const updatedDate = useMemo(() => {
    const timestamp = application?.updatedAt || application?.submittedAt

    if (!timestamp?.toDate) return '-'

    return timestamp.toDate().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }, [application])

  const finalAcceptedDate = useMemo(() => {
    const timestamp = application?.finalAcceptedAt || application?.scannedAt

    if (!timestamp?.toDate) return '-'

    return timestamp.toDate().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }, [application])

  const getStatusContent = () => {
    if (isFinalAccepted) {
      return {
        label: 'Diterima dan Tervalidasi',
        message: 'Selamat, pendaftaran kamu sudah diterima dan tervalidasi.',
        description: 'QR kamu sudah berhasil divalidasi oleh pihak sekolah. Status penerimaan kamu sudah terkonfirmasi.',
        pillClass: 'bg-emerald-500/10 text-emerald-600',
        icon: 'verified',
        progressWidth: '100%',
        qrLocked: false
      }
    }

    if (status === 'Diterima') {
      return {
        label: 'Diterima, Menunggu Validasi QR',
        message: 'Selamat, pendaftaran kamu sudah diterima.',
        description: 'Tunjukkan QR kepada pihak sekolah agar status kamu berubah menjadi Diterima dan Tervalidasi.',
        pillClass: 'bg-yellow-500/10 text-yellow-700',
        icon: 'qr_code_scanner',
        progressWidth: '75%',
        qrLocked: false
      }
    }

    if (status === 'Perlu Revisi') {
      return {
        label: 'Perlu Revisi',
        message: 'Ada data yang perlu kamu perbaiki.',
        description: 'Cek kembali data dan dokumen yang sudah dikirim sebelum mengajukan ulang.',
        pillClass: 'bg-orange-500/10 text-orange-600',
        icon: 'assignment_return',
        progressWidth: '50%',
        qrLocked: true
      }
    }

    if (status === 'Ditolak') {
      return {
        label: 'Ditolak',
        message: 'Pendaftaran kamu belum dapat diterima.',
        description: 'Silakan hubungi admin untuk mengetahui alasan penolakan.',
        pillClass: 'bg-red-500/10 text-red-600',
        icon: 'cancel',
        progressWidth: '50%',
        qrLocked: true
      }
    }

    return {
      label: 'Menunggu Verifikasi',
      message: 'Pendaftaran kamu sedang ditinjau.',
      description: 'Tim admin sedang memeriksa data dan dokumen yang kamu kirim.',
      pillClass: 'bg-primary/10 text-primary',
      icon: 'pending',
      progressWidth: '33%',
      qrLocked: true
    }
  }

  const statusContent = getStatusContent()

  const handleDownloadQR = () => {
    const qrCanvas = document.getElementById('hidden-qr-canvas-src')
    if (!qrCanvas) {
      alert('QR Code tidak ditemukan.')
      return
    }
    const qrDataUrl = qrCanvas.toDataURL('image/png')

    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 900
    const ctx = canvas.getContext('2d')

    // 1. Background (Light-themed Card)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Soft light gray to white vertical gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#f8fafc') // Slate 50
    gradient.addColorStop(1, '#ffffff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw card border (A clean, elegant border)
    ctx.strokeStyle = '#e2e8f0' // Slate 200
    ctx.lineWidth = 12
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12)

    // A thin inner border line
    ctx.strokeStyle = '#cbd5e1' // Slate 300
    ctx.lineWidth = 1.5
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    // Subtle background watermark circle
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.02)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(canvas.width, 0, 300, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, canvas.height, 400, 0, Math.PI * 2)
    ctx.stroke()

    // 2. Load Logo and Draw Header
    const logoImg = new Image()
    logoImg.src = logoYppt

    const drawCardElements = () => {
      // Circle frame for logo
      ctx.save()
      ctx.beginPath()
      ctx.arc(300, 115, 42, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      try {
        ctx.drawImage(logoImg, 258, 73, 84, 84)
      } catch (e) {
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(258, 73, 84, 84)
      }
      ctx.restore()

      // Border for logo
      ctx.strokeStyle = '#3b82f6' // Theme accent blue
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(300, 115, 42, 0, Math.PI * 2)
      ctx.stroke()

      // Branding Text (Charcoal)
      ctx.fillStyle = '#0f172a' // Slate 900
      ctx.textAlign = 'center'
      
      // "SiPena"
      ctx.font = 'bold 36px Inter, system-ui, sans-serif'
      ctx.fillText('SiPena', 300, 200)

      // Subtitles
      ctx.font = '600 15px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#475569' // Slate 600
      ctx.fillText('Penerimaan Peserta Didik Baru', 300, 230)
      
      ctx.font = 'bold 13px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#3b82f6' // Blue 500
      ctx.fillText('SMK YPPT GARUT', 300, 252)

      // Separator line
      ctx.strokeStyle = '#e2e8f0' // Slate 200
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(80, 280)
      ctx.lineTo(520, 280)
      ctx.stroke()

      // 3. QR Code Container (White card with slate-200 border and subtle shadow)
      ctx.shadowColor = 'rgba(15, 23, 42, 0.05)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4
      
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(140, 310, 320, 320, 16)
      } else {
        ctx.rect(140, 310, 320, 320)
      }
      ctx.fill()

      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(140, 310, 320, 320, 16)
        ctx.stroke()
      } else {
        ctx.strokeRect(140, 310, 320, 320)
      }

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw QR Code
      const qrImg = new Image()
      qrImg.src = qrDataUrl
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 165, 335, 270, 270)

        // If verified, draw a small verification stamp/badge
        if (isFinalAccepted) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.95)' // emerald-500
          ctx.beginPath()
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(220, 595, 160, 30, 15)
          } else {
            ctx.rect(220, 595, 160, 30)
          }
          ctx.fill()
          
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 11px Inter, system-ui, sans-serif'
          ctx.fillText('TERVALIDASI', 300, 614)
        }

        // 4. Student Metadata (Charcoal text)
        ctx.fillStyle = '#0f172a' // Slate 900
        ctx.font = 'bold 24px Inter, system-ui, sans-serif'
        ctx.fillText(fullName, 300, 700)

        ctx.font = 'bold 11px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#64748b' // Slate 500
        ctx.fillText('NO. REGISTRASI', 300, 735)

        // Draw light capsule for registration number
        ctx.fillStyle = '#f1f5f9' // Slate 100
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(180, 752, 240, 38, 8)
        } else {
          ctx.rect(180, 752, 240, 38)
        }
        ctx.fill()

        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 20px Courier New, monospace'
        ctx.fillText(registrationNumber, 300, 778)

        // 5. Card Footer Info
        ctx.font = '500 11px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#94a3b8' // Slate 400
        ctx.fillText('Tunjukkan kartu ini kepada panitia saat verifikasi fisik', 300, 840)

        // Download Action
        const downloadLink = document.createElement('a')
        downloadLink.download = `SIPENA_QR_${fullName.replace(/\s+/g, '_')}.png`
        downloadLink.href = canvas.toDataURL('image/png')
        downloadLink.click()
      }
    }

    logoImg.onload = drawCardElements
    logoImg.onerror = drawCardElements
  }

  const handleDownloadSKD = () => {
    const qrCanvas = document.getElementById('hidden-qr-canvas-src')
    if (!qrCanvas) {
      alert('QR Code tidak ditemukan.')
      return
    }
    const qrDataUrl = qrCanvas.toDataURL('image/png')

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Surat Keterangan Diterima - ${fullName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              line-height: 1.6;
              font-size: 14px;
            }
            .container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .logo-cell {
              width: 90px;
              vertical-align: middle;
            }
            .logo-img {
              width: 85px;
              height: 85px;
            }
            .kop-cell {
              text-align: center;
              vertical-align: middle;
              padding-left: 15px;
            }
            .kop-yayas {
              font-weight: 700;
              font-size: 15px;
              margin: 0 0 2px 0;
              letter-spacing: 0.5px;
            }
            .kop-school {
              font-weight: 800;
              font-size: 23px;
              color: #1e3a8a;
              margin: 0 0 4px 0;
            }
            .kop-akred {
              font-weight: 700;
              font-size: 10px;
              color: #10b981;
              margin: 0 0 4px 0;
              letter-spacing: 1px;
            }
            .kop-address {
              font-size: 10.5px;
              color: #475569;
              margin: 0;
            }
            .double-line {
              border-top: 3px solid #000;
              border-bottom: 1px solid #000;
              height: 3px;
              margin-bottom: 35px;
            }
            .title {
              text-align: center;
              font-weight: 800;
              font-size: 18px;
              text-decoration: underline;
              margin: 0 0 4px 0;
            }
            .doc-num {
              text-align: center;
              font-weight: 500;
              font-size: 12.5px;
              margin: 0 0 35px 0;
            }
            .statement {
              margin-bottom: 25px;
            }
            .student-table {
              width: 85%;
              margin: 0 auto 35px auto;
              border-collapse: collapse;
            }
            .student-table td {
              padding: 8px 10px;
              vertical-align: top;
            }
            .label-col {
              font-weight: 700;
              color: #334155;
              width: 35%;
            }
            .colon-col {
              width: 3%;
              text-align: center;
            }
            .val-col {
              font-weight: 500;
            }
            .badge-container {
              text-align: center;
              margin-bottom: 40px;
            }
            .badge {
              display: inline-block;
              background-color: #10b981;
              color: #ffffff;
              font-weight: 800;
              font-size: 22px;
              padding: 10px 45px;
              border-radius: 8px;
              letter-spacing: 2px;
            }
            .footer-info {
              margin-bottom: 50px;
            }
            .footer-table {
              width: 100%;
              margin-top: 60px;
            }
            .qr-sec {
              width: 45%;
              text-align: left;
              vertical-align: top;
            }
            .qr-box {
              border: 1px solid #cbd5e1;
              padding: 4px;
              width: 105px;
              height: 105px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .qr-img {
              width: 105px;
              height: 105px;
            }
            .qr-text {
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              margin: 0 0 2px 0;
            }
            .qr-subtext {
              font-size: 8px;
              color: #94a3b8;
              margin: 0;
            }
            .sign-sec {
              width: 55%;
              text-align: left;
              vertical-align: top;
              padding-left: 80px;
              position: relative;
            }
            .sign-date {
              margin-bottom: 5px;
            }
            .sign-role {
              margin-bottom: 65px;
            }
            .sign-img-placeholder {
              position: absolute;
              left: 100px;
              top: 35px;
              width: 130px;
              height: 60px;
              z-index: 10;
            }
            .stamp-placeholder {
              position: absolute;
              left: 65px;
              top: 25px;
              width: 85px;
              height: 85px;
              z-index: 5;
              opacity: 0.65;
            }
            .sign-name {
              font-weight: 800;
              font-size: 14px;
              margin: 0 0 2px 0;
            }
            .sign-nip {
              font-size: 12px;
              color: #334155;
              margin: 0;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                background: #fff;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <table class="header-table">
              <tr>
                <td class="logo-cell">
                  <img class="logo-img" src="${window.location.origin}${logoYppt}" alt="Logo YPPT" />
                </td>
                <td class="kop-cell">
                  <h3 class="kop-yayas">YAYASAN PENDIDIKAN DAN TEKNOLOGI PRIANGAN TIMUR</h3>
                  <h1 class="kop-school">SMK YPPT GARUT</h1>
                  <h4 class="kop-akred">TERAKREDITASI "A" (SANGAT BAIK)</h4>
                  <p class="kop-address">Program Keahlian: Teknik Otomotif • Teknik Jaringan & Komputer • Desain Komunikasi Visual</p>
                  <p class="kop-address">Jl. Nusa Indah No. 33, Tarogong Kidul, Garut, Jawa Barat 44151</p>
                </td>
              </tr>
            </table>

            <div class="double-line"></div>

            <h2 class="title">SURAT KETERANGAN DITERIMA (SKD)</h2>
            <p class="doc-num">Nomor: 421.5/102-SMK.YPPT/PPDB/${new Date().getFullYear()}</p>

            <p class="statement">Kepala Sekolah Menengah Kejuruan YPPT Garut menerangkan bahwa:</p>

            <table class="student-table">
              <tr>
                <td class="label-col">Nama Lengkap</td>
                <td class="colon-col">:</td>
                <td class="val-col"><strong>${fullName}</strong></td>
              </tr>
              <tr>
                <td class="label-col">Nomor Registrasi</td>
                <td class="colon-col">:</td>
                <td class="val-col"><code style="font-size: 15px; font-weight: 700;">${registrationNumber}</code></td>
              </tr>
              <tr>
                <td class="label-col">Nomor Induk Siswa Nasional (NISN)</td>
                <td class="colon-col">:</td>
                <td class="val-col">${personalData.nisn || '-'}</td>
              </tr>
              <tr>
                <td class="label-col">Tempat, Tanggal Lahir</td>
                <td class="colon-col">:</td>
                <td class="val-col">${personalData.dob || '-'}</td>
              </tr>
              <tr>
                <td class="label-col">Nomor Handphone</td>
                <td class="colon-col">:</td>
                <td class="val-col">${personalData.phone || '-'}</td>
              </tr>
            </table>

            <div class="badge-container">
              <span class="badge">D I T E R I M A</span>
            </div>

            <p style="text-align: center; font-size: 14px; margin-bottom: 25px;">
              Sebagai siswa baru di SMK YPPT Garut untuk Tahun Pelajaran 2026/2027.
            </p>
            
            <p class="footer-info">Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

            <table class="footer-table">
              <tr>
                <td class="qr-sec">
                  <div class="qr-box">
                    <img class="qr-img" src="${qrDataUrl}" alt="Verification QR" />
                  </div>
                  <p class="qr-text">VALIDASI RESMI DIGITAL</p>
                  <p class="qr-subtext">Scan QR di atas untuk verifikasi keaslian berkas</p>
                </td>
                <td class="sign-sec">
                  <svg class="sign-img-placeholder" viewBox="0 0 130 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 40 C 30 25, 40 50, 60 25 C 80 15, 90 45, 110 30" stroke="#2563eb" stroke-width="3" stroke-linecap="round" />
                  </svg>
                  <svg class="stamp-placeholder" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="38" stroke="rgba(79, 70, 229, 0.45)" stroke-width="2.5" />
                    <circle cx="40" cy="40" r="33" stroke="rgba(79, 70, 229, 0.45)" stroke-width="1" />
                    <text x="40" y="38" fill="rgba(79, 70, 229, 0.45)" font-size="8" font-family="Arial" font-weight="bold" text-anchor="middle">SMK YPPT</text>
                    <text x="40" y="50" fill="rgba(79, 70, 229, 0.45)" font-size="8" font-family="Arial" font-weight="bold" text-anchor="middle">GARUT</text>
                  </svg>
                  
                  <p class="sign-date">Garut, ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p class="sign-role">Kepala SMK YPPT Garut,</p>
                  <h4 class="sign-name">Drs. H. Rivan, M.Pd.</h4>
                  <p class="sign-nip">NIP. 197103142000031002</p>
                </td>
              </tr>
            </table>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }



  const stepClass = (active) => {
    return active
      ? 'w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20'
      : 'w-10 h-10 rounded-full bg-surface-container-high text-outline flex items-center justify-center'
  }

  if (loading) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <div className="bg-surface-container-lowest p-10 rounded-[1.5rem] text-center shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">
            progress_activity
          </span>
          <p className="text-on-surface-variant font-medium">
            Memuat status pendaftaran...
          </p>
        </div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <div className="bg-surface-container-lowest p-10 rounded-[1.5rem] text-center shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">
              folder_open
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-on-surface mb-3">
            Belum ada data pendaftaran
          </h1>

          <p className="text-on-surface-variant max-w-md mx-auto mb-8">
            Dashboard ini akan menampilkan status setelah kamu mengirim formulir pendaftaran.
          </p>

          <Link
            to="/step1"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            Mulai Pendaftaran
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <section className="mb-12">
          <h1 className="text-2xl md:text-xl font-extrabold tracking-tight text-on-surface mb-2">
            Selamat Datang, {fullName}.
          </h1>

          <p className="text-on-surface-variant text-lg">
            Cek status dan dokumen pendaftaran kamu di sini.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] shadow-[0px_12px_32px_rgba(26,28,28,0.06)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-4 ${statusContent.pillClass}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {statusContent.icon}
                    </span>
                    {statusContent.label}
                  </div>

                  <h2 className="text-2xl font-bold text-on-surface mb-1">
                    {statusContent.message}
                  </h2>

                  <p className="text-on-surface-variant font-medium">
                    No. Registrasi:{' '}
                    <span className="text-on-surface font-mono">
                      {registrationNumber}
                    </span>
                  </p>

                  <p className="text-on-surface-variant text-sm mt-4">
                    Terakhir diperbarui: {updatedDate}
                  </p>

                  {isFinalAccepted && (
                    <p className="text-emerald-600 text-sm mt-2 font-bold">
                      Tervalidasi pada: {finalAcceptedDate}
                    </p>
                  )}

                  <p className="text-on-surface-variant text-sm mt-2 max-w-xl">
                    {statusContent.description}
                  </p>

                  {status === 'Diterima' && !isFinalAccepted && (
                    <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-700">
                          info
                        </span>

                        <div>
                          <h3 className="font-bold text-yellow-800">
                            Diterima, tetapi belum tervalidasi
                          </h3>

                          <p className="text-sm text-yellow-700 mt-1">
                            Kamu sudah diterima oleh admin. Tunjukkan QR kepada pihak sekolah untuk validasi akhir.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isFinalAccepted && (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-emerald-600">
                          verified
                        </span>

                        <div>
                          <h3 className="font-bold text-emerald-700">
                            Diterima dan Tervalidasi
                          </h3>

                          <p className="text-sm text-emerald-700 mt-1">
                            QR kamu sudah berhasil discan oleh pihak sekolah. Status penerimaan kamu sudah terkonfirmasi.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div
                      className={`w-72 h-72 rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-dashed border-outline-variant/30 ${
                        statusContent.qrLocked
                          ? 'bg-surface-container-high grayscale opacity-40'
                          : 'bg-white text-green-600 shadow-[0px_12px_32px_rgba(26,28,28,0.08)]'
                      }`}
                    >
                      {statusContent.qrLocked ? (
                        <>
                          <span className="material-symbols-outlined text-4xl mb-2 text-outline">
                            lock
                          </span>
                          <p className="text-[10px] text-center font-bold uppercase tracking-tighter text-outline">
                            QR belum tersedia
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="bg-white p-3 rounded-xl relative">
                            <QRCodeSVG
                              value={qrPayload}
                              size={180}
                              bgColor="#ffffff"
                              fgColor="#1a1c1c"
                              level="M"
                              className="rounded-lg"
                            />

                            {isFinalAccepted && (
                              <div className="absolute inset-3 rounded-xl bg-emerald-600/80 flex flex-col items-center justify-center text-white text-center">
                                <span className="material-symbols-outlined text-5xl mb-2">
                                  verified
                                </span>
                                <p className="text-xs font-extrabold uppercase tracking-wide px-3">
                                  Sudah Tervalidasi
                                </p>
                              </div>
                            )}
                          </div>

                          <p className="text-[10px] text-center font-bold uppercase tracking-tighter mt-2 text-on-surface-variant">
                            {isFinalAccepted ? 'QR sudah divalidasi' : 'QR aktif'}
                          </p>
                        </>
                      )}
                    </div>

                    {statusContent.qrLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed">
                        <p className="text-xs font-bold text-primary text-center px-4">
                          Verifikasi diperlukan untuk akses QR
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Download Button */}
                  {!statusContent.qrLocked && (
                    <button
                      onClick={handleDownloadQR}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container font-bold py-3 px-5 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      Unduh Kartu QR
                    </button>
                  )}

                  {/* Hidden Canvas for QR Data URL Generation */}
                  {!statusContent.qrLocked && (
                    <div className="hidden">
                      <QRCodeCanvas
                        id="hidden-qr-canvas-src"
                        value={qrPayload}
                        size={512}
                        bgColor="#ffffff"
                        fgColor="#1a1c1c"
                        level="H"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12">
                <p className="text-sm font-bold text-on-surface mb-6 uppercase tracking-widest">
                  Progress Pendaftaran
                </p>

                <div className="relative flex justify-between items-start">
                  <div className="absolute top-5 left-0 w-full h-0.5 bg-surface-container-high z-0"></div>

                  <div
                    className="absolute top-5 left-0 h-0.5 bg-primary z-10 transition-all duration-1000"
                    style={{ width: statusContent.progressWidth }}
                  ></div>

                  <div className="relative z-20 flex flex-col items-center text-center w-1/4">
                    <div className={stepClass(true)}>
                      <span className="material-symbols-outlined text-xl">
                        check
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-on-surface">
                      Pendaftaran
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-medium uppercase">
                      Selesai
                    </p>
                  </div>

                  <div className="relative z-20 flex flex-col items-center text-center w-1/4">
                    <div className={stepClass(status !== 'Menunggu Verifikasi')}>
                      <span className="material-symbols-outlined text-xl">
                        verified_user
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-sm ${
                        status !== 'Menunggu Verifikasi'
                          ? 'font-bold text-primary'
                          : 'font-medium text-on-surface-variant'
                      }`}
                    >
                      Verifikasi
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase">
                      {status === 'Menunggu Verifikasi' ? 'Diproses' : 'Selesai'}
                    </p>
                  </div>

                  <div className="relative z-20 flex flex-col items-center text-center w-1/4">
                    <div className={stepClass(status === 'Diterima' || isFinalAccepted)}>
                      <span className="material-symbols-outlined text-xl">
                        school
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-sm ${
                        status === 'Diterima' || isFinalAccepted
                          ? 'font-bold text-primary'
                          : 'font-medium text-on-surface-variant'
                      }`}
                    >
                      Diterima
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase">
                      {status === 'Diterima' || isFinalAccepted ? 'Selesai' : 'Menunggu'}
                    </p>
                  </div>

                  <div className="relative z-20 flex flex-col items-center text-center w-1/4">
                    <div className={stepClass(isFinalAccepted)}>
                      <span className="material-symbols-outlined text-xl">
                        qr_code_scanner
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-sm ${
                        isFinalAccepted
                          ? 'font-bold text-primary'
                          : status === 'Diterima'
                            ? 'font-bold text-yellow-700'
                            : 'font-medium text-on-surface-variant'
                      }`}
                    >
                      Validasi QR
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase">
                      {isFinalAccepted
                        ? 'Tervalidasi'
                        : status === 'Diterima'
                          ? 'Menunggu'
                          : 'Terkunci'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(status === 'Diterima' || isFinalAccepted) && (
              <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[1.5rem] shadow-[0px_12px_32px_rgba(26,28,28,0.06)] border border-emerald-500/30 space-y-6">
                <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
                  <span className="material-symbols-outlined text-3xl text-emerald-600 bg-emerald-100 p-2 rounded-xl">
                    campaign
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-on-surface">
                      Langkah Selanjutnya &amp; Daftar Ulang
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Silakan ikuti instruksi berikut untuk menyelesaikan proses pendaftaran siswa baru.
                    </p>
                  </div>
                </div>

                <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                      1
                    </div>
                    <div>
                      <h4 className="font-extrabold text-on-surface text-base">
                        Unduh Surat Keterangan Diterima (SKD)
                      </h4>
                      <p className="text-sm text-on-surface-variant mt-1 mb-3">
                        Surat ini adalah bukti sah bahwa Anda telah diterima di SMK YPPT Garut. Unduh dan cetak surat ini untuk dibawa saat daftar ulang fisik.
                      </p>
                      <button
                        onClick={handleDownloadSKD}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Unduh Surat Kelulusan (SKD)
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                      2
                    </div>
                    <div>
                      <h4 className="font-extrabold text-on-surface text-base">
                        Gabung Grup WhatsApp Koordinasi
                      </h4>
                      <p className="text-sm text-on-surface-variant mt-1 mb-3">
                        Segera bergabung dengan grup WhatsApp resmi PPDB SMK YPPT Garut untuk koordinasi jadwal MPLS, seragam, dan pembagian kelas.
                      </p>
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">group</span>
                        Gabung Grup WhatsApp Resmi
                      </a>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                      isFinalAccepted ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
                    }`}>
                      {isFinalAccepted ? '✓' : '3'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-on-surface text-base flex items-center gap-2">
                        <span>Verifikasi Berkas Fisik &amp; Ukur Seragam</span>
                        {isFinalAccepted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                            Selesai
                          </span>
                        )}
                      </h4>
                      {isFinalAccepted ? (
                        <p className="text-sm text-on-surface-variant mt-1">
                          Tahap verifikasi fisik dan scan QR pendaftaran telah berhasil dilakukan oleh pihak sekolah pada <strong>{finalAcceptedDate || updatedDate}</strong>.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-on-surface-variant mt-1">
                            Datang ke kampus SMK YPPT Garut pada tanggal <strong>15 - 20 Juni 2026</strong> (Pukul 08.00 - 14.00 WIB) dengan membawa:
                          </p>
                          <ul className="list-disc list-inside text-xs text-on-surface-variant mt-2 space-y-1.5 ml-2">
                            <li>Cetak Surat Keterangan Diterima (SKD)</li>
                            <li>Kartu Registrasi / QR Code Pendaftaran (Digital/Cetak)</li>
                          </ul>
                          <p className="text-[11px] text-emerald-600 mt-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                            * Catatan: Berkas lainnya seperti Rapor, KK, Ijazah, dll. tidak perlu dibawa karena sudah diunggah dan diverifikasi secara online di sistem.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                      4
                    </div>
                    <div>
                      <h4 className="font-extrabold text-on-surface text-base">
                        Pembayaran &amp; Administrasi Akhir
                      </h4>
                      <p className="text-sm text-on-surface-variant mt-1">
                        Lakukan penyelesaian administrasi daftar ulang di loket pembayaran sekolah pada hari yang sama saat pengukuran seragam.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {notes && (
              <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] shadow-[0px_12px_32px_rgba(26,28,28,0.06)] border border-primary/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">chat</span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-on-surface mb-2">
                      Catatan Admin
                    </h3>

                    <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                      {notes}
                    </p>

                    {status === 'Perlu Revisi' && (
                      <Link
                        to="/step1"
                        onClick={() => localStorage.setItem('revisionMode', 'true')}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF6B35] text-white font-bold hover:brightness-110 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined">
                          edit_document
                        </span>
                        Perbaiki Data
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-surface-container-low p-6 rounded-[1.5rem]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-on-surface">
                  Dokumen Terunggah
                </h3>

                <Link
                  to="/step3"
                  className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Kelola / Revisi Dokumen
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(documents).length === 0 ? (
                  <div className="md:col-span-2 bg-surface-container-lowest border-2 border-dashed border-outline-variant p-6 rounded-xl text-center">
                    <p className="text-sm text-on-surface-variant">
                      Belum ada dokumen yang tercatat.
                    </p>
                  </div>
                ) : (
                  Object.entries(documents).map(([key, value]) => {
                    const docUrl = typeof value === 'string' ? value : value?.url || value?.secureUrl
                    return (
                      <div
                        key={key}
                        onClick={() => docUrl && window.open(docUrl, '_blank')}
                        title="Klik untuk membuka dokumen"
                        className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between hover:translate-x-1 transition-transform cursor-pointer group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined">
                              description
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-sm text-on-surface capitalize">
                              {key}
                            </p>

                            <p className="text-xs text-on-surface-variant">
                              {typeof value === 'string'
                                ? value
                                : value?.name || 'Dokumen tersedia'}
                            </p>
                          </div>
                        </div>

                        <span className="material-symbols-outlined text-outline group-hover:text-primary">
                          visibility
                        </span>
                      </div>
                    )
                  })
                )}

                <Link
                  to="/step3"
                  className="bg-surface-container-lowest border-2 border-dashed border-outline-variant p-4 rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined">add_circle</span>
                    <span>Tambah Dokumen</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-primary p-6 rounded-[1.5rem] text-on-primary relative overflow-hidden group">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>

              <h4 className="text-lg font-bold mb-2">Butuh Bantuan?</h4>

              <p className="text-on-primary-container text-sm mb-6 leading-relaxed">
                Hubungi admin jika kamu ingin memperbaiki data atau menanyakan hasil verifikasi.
              </p>

              <button
                onClick={() => window.open('mailto:admin@ypptgarut.sch.id?subject=Bantuan%20Pendaftaran', '_blank')}
                className="bg-white text-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:scale-95 transition-all"
              >
                Hubungi Support
              </button>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
              <h4 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-4">
                Ringkasan Data
              </h4>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-on-surface-variant font-bold uppercase">
                    Nama
                  </p>
                  <p className="text-sm font-bold text-on-surface">
                    {fullName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-on-surface-variant font-bold uppercase">
                    NISN
                  </p>
                  <p className="text-sm font-bold text-on-surface">
                    {personalData.nisn || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-on-surface-variant font-bold uppercase">
                    No. HP
                  </p>
                  <p className="text-sm font-bold text-on-surface">
                    {personalData.phone || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-on-surface-variant font-bold uppercase">
                    Status
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      isFinalAccepted ? 'text-emerald-600' : 'text-on-surface'
                    }`}
                  >
                    {displayStatus}
                  </p>
                </div>

                {isFinalAccepted && (
                  <div>
                    <p className="text-xs text-on-surface-variant font-bold uppercase">
                      Validasi QR
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      Sudah Tervalidasi
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-secondary-container/10 p-6 rounded-[1.5rem]">
              <div className="flex items-center space-x-3 mb-4">
                <span className="material-symbols-outlined text-secondary">
                  lightbulb
                </span>

                <h4 className="text-sm font-bold text-secondary uppercase tracking-widest">
                  Tips
                </h4>
              </div>

              <p className="text-sm text-on-secondary-container font-medium leading-relaxed">
                Setelah QR divalidasi oleh pihak sekolah, status kamu akan berubah menjadi Diterima dan Tervalidasi secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}