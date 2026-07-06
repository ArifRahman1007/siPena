import React from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'

const STEPS = [
  { label: 'Data Pribadi', icon: 'person' },
  { label: 'Orang Tua', icon: 'family_restroom' },
  { label: 'Berkas', icon: 'folder_open' },
  { label: 'Tinjau', icon: 'fact_check' },
]

function StepProgress({ current }) {
  return (
    <div className="mb-10">
      <div className="flex items-start justify-between relative">
        {/* Connector lines */}
        <div className="absolute top-4 left-0 right-0 flex px-[10%]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 h-0.5 mx-1 transition-all duration-500 ${
                i < current - 1
                  ? 'bg-primary'
                  : i === current - 1
                  ? 'bg-gradient-to-r from-primary to-outline-variant/40'
                  : 'bg-outline-variant/30'
              }`}
            />
          ))}
        </div>

        {STEPS.map((step, i) => {
          const status = i + 1 < current ? 'done' : i + 1 === current ? 'active' : 'upcoming'
          return (
            <div key={i} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === 'done'
                    ? 'bg-primary shadow-md shadow-primary/30'
                    : status === 'active'
                    ? 'bg-primary ring-4 ring-primary/20 shadow-lg shadow-primary/30'
                    : 'bg-surface-container-high border-2 border-outline-variant/40'
                }`}
              >
                {status === 'done' ? (
                  <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : (
                  <span className={`material-symbols-outlined text-base ${status === 'active' ? 'text-white' : 'text-outline'}`}>
                    {step.icon}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wide text-center leading-tight ${
                status === 'active' ? 'text-primary' : status === 'done' ? 'text-on-surface-variant' : 'text-outline'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-700"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-outline font-medium">
        <span>Langkah {current} dari {STEPS.length}</span>
        <span>{Math.round(((current - 1) / (STEPS.length - 1)) * 100)}% selesai</span>
      </div>
    </div>
  )
}

function InputField({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
        <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function PersonalData() {
  const navigate = useNavigate()
  const { formData, updateFormData } = useOutletContext()

  return (
    <>
      <main className="flex-grow pt-24 pb-28 px-4 md:px-6 max-w-2xl mx-auto w-full">
        <StepProgress current={1} />

        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0px_16px_48px_rgba(26,28,28,0.07)] border border-outline-variant/20 relative overflow-hidden">
          {/* Dekorasi pojok */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] pointer-events-none" />

          {/* Header card */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-outline-variant/20">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-on-surface leading-tight">Data Pribadi</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">Isi sesuai dokumen identitas resmi</p>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={(e) => { e.preventDefault(); navigate('/step2') }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">

              {/* Nama Lengkap */}
              <div className="md:col-span-2">
                <InputField label="Nama Lengkap Sesuai Identitas" icon="badge">
                  <input
                    required
                    value={formData?.personalData?.fullName || ''}
                    onChange={(e) => updateFormData('personalData', 'fullName', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all placeholder:text-outline/50"
                    placeholder="Nama sesuai KTP/NISN"
                    type="text"
                    autoComplete="name"
                  />
                </InputField>
              </div>

              {/* NIK/NISN */}
              <InputField label="NIK / NISN" icon="fingerprint">
                <input
                  required
                  value={formData?.personalData?.nisn || ''}
                  onChange={(e) => updateFormData('personalData', 'nisn', e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all placeholder:text-outline/50"
                  placeholder="16 digit nomor identitas"
                  type="text"
                  maxLength={16}
                />
              </InputField>

              {/* Tanggal Lahir */}
              <InputField label="Tanggal Lahir" icon="cake">
                <input
                  required
                  value={formData?.personalData?.dob || ''}
                  onChange={(e) => updateFormData('personalData', 'dob', e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                  type="date"
                />
              </InputField>

              {/* Jenis Kelamin */}
              <InputField label="Jenis Kelamin" icon="wc">
                <div className="relative">
                  <select
                    required
                    value={formData?.personalData?.gender || ''}
                    onChange={(e) => updateFormData('personalData', 'gender', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary appearance-none transition-all"
                  >
                    <option disabled value="">Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 w-10 rounded-r-xl pointer-events-none flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline text-lg">expand_more</span>
                  </div>
                </div>
              </InputField>

              {/* Nomor Telepon */}
              <InputField label="Nomor Telepon" icon="phone">
                <input
                  required
                  value={formData?.personalData?.phone || ''}
                  onChange={(e) => updateFormData('personalData', 'phone', e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all placeholder:text-outline/50"
                  placeholder="08xx xxxx xxxx"
                  type="tel"
                />
              </InputField>

              {/* Alamat */}
              <div className="md:col-span-2">
                <InputField label="Alamat Lengkap" icon="home_pin">
                  <textarea
                    required
                    value={formData?.personalData?.address || ''}
                    onChange={(e) => updateFormData('personalData', 'address', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all placeholder:text-outline/50 resize-none"
                    placeholder="Nama jalan, nomor rumah, RT/RW, Kecamatan, Kota..."
                    rows={3}
                  />
                </InputField>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-3 pt-4 border-t border-outline-variant/20">
              <button
                onClick={() => navigate(-1)}
                className="w-full md:w-auto px-6 py-2.5 text-primary font-semibold text-sm hover:bg-primary/5 rounded-xl transition-all flex items-center justify-center gap-2 border border-primary/20 hover:border-primary/40"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Kembali
              </button>
              <button
                className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-md shadow-primary/25 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                type="submit"
              >
                Lanjut
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-on-surface-variant">
            Butuh bantuan?{' '}
            <a className="text-primary font-semibold hover:underline" href="https://wa.me/6285624963293?text=Halo%20Admin%20PPDB%20SiPena%2C%20saya%20butuh%20bantuan%20terkait%20pendaftaran." target="_blank" rel="noreferrer">Hubungi Pusat Bantuan</a>
          </p>
        </div>
      </main>
    </>
  )
}