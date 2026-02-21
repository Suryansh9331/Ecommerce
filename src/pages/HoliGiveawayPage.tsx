import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gift, Clock, Trophy, CheckCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RegisteredUser = { id?: number; name: string; phone: string; registeredAt: string };

const HoliGiveawayPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/holi-giveaway/registrations`);
        if (res.ok) {
          const data = await res.json();
          setRegisteredUsers(data.map((r: { id?: number; name: string; phone: string; registeredAt: string }) => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            registeredAt: r.registeredAt,
          })));
        }
      } catch {
        // keep empty list on error
      } finally {
        setListLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!form.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/holi-giveaway/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.message || 'Registration failed. Please try again.');
        return;
      }
      setSubmitted(true);
      if (data.registration) {
        setRegisteredUsers(prev => [{
          id: data.registration.id,
          name: data.registration.name,
          phone: data.registration.phone,
          registeredAt: data.registration.registeredAt,
        }, ...prev]);
      } else {
        // Refetch list if backend didn't return registration
        const listRes = await fetch(`${API_BASE_URL}/api/holi-giveaway/registrations`);
        if (listRes.ok) {
          const list = await listRes.json();
          setRegisteredUsers(list.map((r: RegisteredUser) => ({ id: r.id, name: r.name, phone: r.phone, registeredAt: r.registeredAt })));
        }
      }
      setTimeout(() => {
        setForm({ name: '', phone: '' });
        setSubmitted(false);
      }, 2500);
    } catch {
      setSubmitError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      icon: <Gift className="w-7 h-7" />,
      number: '01',
      title: 'Register for Free',
      desc: 'Fill in your name and phone number on the form. No cost, no strings — just pure Holi joy!',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      dot: 'bg-pink-400',
    },
    {
      icon: <Clock className="w-7 h-7" />,
      number: '02',
      title: 'Wait for the Holi Event',
      desc: 'Keep an eye on your phone. We will announce winners during our grand Holi celebration!',
      color: 'from-purple-500 to-violet-500',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      dot: 'bg-purple-400',
    },
    {
      icon: <Trophy className="w-7 h-7" />,
      number: '03',
      title: 'Get Your Prize',
      desc: 'Winners receive a call and can claim their amazing Holi gift. Spread colours, spread joy!',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      dot: 'bg-amber-400',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap" rel="stylesheet" />

      {/* Hero */}
      <section className="relative w-full">
        <img
          src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1771595131/e4f204f2-61b7-4709-805d-683306af16ea.png"
          alt="Holi Giveaway Desktop"
          className="hidden md:block w-full h-auto object-cover object-center"
        />
        <img
          src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1771599094/1f673ee8-e135-4307-9b82-217d1173bd84.png"
          alt="Holi Giveaway Mobile"
          className="block md:hidden w-full h-auto object-cover object-center"
        />
      </section>

      {/* Mobile-only video after hero */}
      <section className="block md:hidden w-full">
        <video
          src="https://res.cloudinary.com/ddnb10zkq/video/upload/v1771594006/PixVerse_V5.6_Image_Text_360P_make_the_jackpor_mnd5ax.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto object-cover"
        />
      </section>

      {/* ── Registration + Steps Section ── */}
      <section
        className="relative py-16 px-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #fdf2f8 40%, #f5f3ff 100%)',
        }}
      >
        {/* Decorative colour blobs */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #f97316, #ec4899)' }} />
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #22c55e, #eab308)' }} />

        <div className="relative max-w-6xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-widest text-pink-500 mb-2">Holi Special Giveaway</p>
            <h2
              className="text-4xl md:text-5xl font-extrabold leading-tight"
              style={{ fontFamily: "'Baloo 2', cursive", background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Join & Win This Holi!
            </h2>
          </div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* LEFT — Steps */}
            <div className="flex flex-col gap-6">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`relative flex items-start gap-5 p-5 rounded-2xl border ${step.bg} ${step.border} shadow-sm`}
                >
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className={`absolute left-[2.85rem] top-[4.5rem] w-0.5 h-8 ${step.dot} opacity-40`} />
                  )}

                  {/* Number + Icon bubble */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex flex-col items-center justify-center shadow-md`}
                  >
                    {step.icon}
                  </div>

                  <div>
                    <span className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                      Step {step.number}
                    </span>
                    <h3 className="text-lg font-extrabold text-gray-900 mt-0.5 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT — Registration Form */}
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #ffffff, #fdf4ff)',
                border: '2px solid rgba(236, 72, 153, 0.2)',
              }}
            >
              {/* Top coloured bar */}
              <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7, #3b82f6, #22c55e)' }} />

              <div className="p-8 md:p-10">
                {!submitted ? (
                  <>
                    <div className="mb-7 text-center">
                      <h3
                        className="text-2xl font-extrabold"
                        style={{ fontFamily: "'Baloo 2', cursive", background: 'linear-gradient(90deg, #ec4899, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                      >
                        Register Now — It's Free!
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Enter your details to participate in the giveaway.</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                          Your Name <span className="text-pink-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-gray-900 text-sm font-semibold outline-none transition-all duration-200 placeholder:font-normal placeholder:text-gray-400
                            ${errors.name
                              ? 'border-red-400 bg-red-50 focus:border-red-500'
                              : 'border-gray-200 bg-white focus:border-pink-400 focus:shadow-[0_0_0_3px_rgba(236,72,153,0.12)]'
                            }`}
                        />
                        {errors.name && (
                          <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1">
                            <span>⚠</span> {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                          Phone Number <span className="text-pink-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 select-none">+91</span>
                          <input
                            type="tel"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            value={form.phone}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setForm({ ...form, phone: val });
                            }}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-gray-900 text-sm font-semibold outline-none transition-all duration-200 placeholder:font-normal placeholder:text-gray-400
                              ${errors.phone
                                ? 'border-red-400 bg-red-50 focus:border-red-500'
                                : 'border-gray-200 bg-white focus:border-pink-400 focus:shadow-[0_0_0_3px_rgba(236,72,153,0.12)]'
                              }`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1">
                            <span>⚠</span> {errors.phone}
                          </p>
                        )}
                        {!errors.phone && form.phone.length > 0 && form.phone.length < 10 && (
                          <p className="mt-1.5 text-xs text-gray-400 font-medium">{10 - form.phone.length} more digit{10 - form.phone.length !== 1 ? 's' : ''} needed</p>
                        )}
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-xl text-white font-extrabold text-base tracking-wide shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{
                          background: loading
                            ? '#c084fc'
                            : 'linear-gradient(90deg, #f97316, #ec4899, #a855f7)',
                          boxShadow: '0 4px 20px rgba(236,72,153,0.35)',
                        }}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Registering…
                          </>
                        ) : (
                          <>Register for Free</>
                        )}
                      </button>

                      {submitError && (
                        <p className="text-center text-sm text-red-500 font-medium mt-1">{submitError}</p>
                      )}
                      <p className="text-center text-xs text-gray-400 mt-1">
                        By registering, you agree to be contacted about this giveaway.
                      </p>
                    </form>
                  </>
                ) : (
                  /* Success state */
                  <div className="text-center py-6">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h3
                      className="text-2xl font-extrabold mb-2"
                      style={{ fontFamily: "'Baloo 2', cursive", background: 'linear-gradient(90deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      You're Registered!
                    </h3>
                    <p className="text-gray-600 text-sm mb-1">
                      <span className="font-bold text-gray-800">{form.name}</span>, we've got your number.
                    </p>
                    <p className="text-gray-500 text-sm">We'll call <span className="font-bold text-gray-700">+91 {form.phone}</span> if you win. Stay tuned and Happy Holi!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Win exciting prizes / CTA strip */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-8 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
              Win exciting prizes
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
            <img src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1771592707/0efa788b-e458-4c38-a820-164109abcb26.png" alt="Prize 1" className="w-full object-contain md:mt-12" />
            <img src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1771592634/69cd5b43-64b9-481c-8e16-2cf237ce86dc.png" alt="Prize 2" className="w-full object-contain" />
            <img src="https://res.cloudinary.com/ddnb10zkq/image/upload/v1771592589/5ce43c09-1a0a-4f21-8640-c0183ffbd8d1.png" alt="Prize 3" className="w-full object-contain md:mt-12" />
          </div>
          {/* Registered Users List */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-gray-800">
                Registered Participants
                <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-600">
                  {registeredUsers.length}
                </span>
              </h3>
            </div>

            {listLoading ? (
              <div className="text-center py-10 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="font-semibold">Loading participants…</p>
              </div>
            ) : registeredUsers.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                <p className="font-semibold">No registrations yet.</p>
                <p className="text-sm mt-1">Be the first to register above!</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7)' }}>
                      <th className="text-left text-white font-bold px-5 py-3">#</th>
                      <th className="text-left text-white font-bold px-5 py-3">Name</th>
                      <th className="text-left text-white font-bold px-5 py-3">Phone</th>
                      <th className="text-left text-white font-bold px-5 py-3">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.map((user, i) => (
                      <tr
                        key={user.id ?? i}
                        className={`border-t border-gray-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-pink-50`}
                      >
                        <td className="px-5 py-3.5 font-bold text-gray-400">{i + 1}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-800">{user.name}</td>
                        <td className="px-5 py-3.5 text-gray-600">+91 {user.phone}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{user.registeredAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold">
              Continue shopping
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoliGiveawayPage;