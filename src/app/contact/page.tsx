'use client';

import React, { useState } from 'react';

interface FormData {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  category: string;
  message: string;
}

interface FormErrors {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  category?: string;
  message?: string;
}

const categories = [
  { value: '', label: 'Select a category' },
  { value: 'support', label: 'Support' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'marketplace', label: 'Marketplace Question' },
  { value: 'contractor', label: 'Contractor Inquiry' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    category: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setFormData({
          name: '',
          companyName: '',
          email: '',
          phone: '',
          category: '',
          message: '',
        });
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setServerError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setServerError('Unable to send message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact The Rail Exchange™
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Get in touch with our team for support, questions, or partnership inquiries.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          {isSuccess && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-1">
                    Message Sent Successfully
                  </h3>
                  <p className="text-green-700">
                    Your message has been sent. Our team will follow up shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-1">
                    Error Sending Message
                  </h3>
                  <p className="text-red-700">{serverError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Two Column Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 text-base rounded-xl border-2 transition-all duration-200 outline-none
                      ${errors.name 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                        : 'border-slate-200 bg-slate-50/50 focus:border-rail-orange focus:ring-4 focus:ring-orange-100 hover:border-slate-300'
                      }`}
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Company Name Field */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-5 py-4 text-base rounded-xl border-2 border-slate-200 bg-slate-50/50 
                      transition-all duration-200 outline-none
                      focus:border-rail-orange focus:ring-4 focus:ring-orange-100 hover:border-slate-300"
                    placeholder="Your company"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 text-base rounded-xl border-2 transition-all duration-200 outline-none
                      ${errors.email 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                        : 'border-slate-200 bg-slate-50/50 focus:border-rail-orange focus:ring-4 focus:ring-orange-100 hover:border-slate-300'
                      }`}
                    placeholder="you@company.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-5 py-4 text-base rounded-xl border-2 border-slate-200 bg-slate-50/50 
                      transition-all duration-200 outline-none
                      focus:border-rail-orange focus:ring-4 focus:ring-orange-100 hover:border-slate-300"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Category Field - Full Width */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 text-base rounded-xl border-2 transition-all duration-200 outline-none appearance-none
                    bg-no-repeat bg-right cursor-pointer
                    ${errors.category 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                      : 'border-slate-200 bg-slate-50/50 focus:border-rail-orange focus:ring-4 focus:ring-orange-100 hover:border-slate-300'
                    }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundSize: '24px',
                    backgroundPosition: 'right 16px center',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Message Field - Full Width */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full px-5 py-4 text-base rounded-xl border-2 transition-all duration-200 outline-none resize-none
                    ${errors.message 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                      : 'border-slate-200 bg-slate-50/50 focus:border-rail-orange focus:ring-4 focus:ring-orange-100 hover:border-slate-300'
                    }`}
                  placeholder="How can we help you?"
                />
                {errors.message && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.message}
                  </p>
                )}
                <p className="mt-2 text-sm text-slate-400">
                  {formData.message.length}/5000 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-10 py-4 bg-[#FF6A1A] hover:bg-[#e55d15] text-white font-semibold 
                    text-lg rounded-xl shadow-lg shadow-orange-200 transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-4 focus:ring-orange-200
                    transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Additional Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#FF6A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Support</h3>
              <p className="text-slate-600 text-sm">
                Need help with your account or listings? Our support team is here to assist.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Partnerships</h3>
              <p className="text-slate-600 text-sm">
                Interested in partnering with The Rail Exchange? Let&apos;s talk.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Contractors</h3>
              <p className="text-slate-600 text-sm">
                Questions about verification or contractor services? Reach out today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
