/**
 * THE RAIL EXCHANGE™ — Verification Steps Flow
 * 
 * Multi-step document upload flow for contractor verification.
 * This is the PAID flow where documents ARE required.
 * 
 * Steps:
 * 1. Identity - Driver License or Passport
 * 2. Insurance - General Liability Insurance
 * 3. Certifications - FRA Safety, RWP, etc.
 * 4. Licenses - Business/Contractor licenses
 * 5. Additional Documents - Optional supporting docs
 * 6. Review & Submit
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Shield,
  User,
  FileText,
  Award,
  Building2,
  FolderOpen,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { id: 'identity', title: 'Identity', icon: User, description: 'Verify your identity' },
  { id: 'insurance', title: 'Insurance', icon: Shield, description: 'General liability insurance' },
  { id: 'certifications', title: 'Certifications', icon: Award, description: 'Safety certifications' },
  { id: 'licenses', title: 'Licenses', icon: Building2, description: 'Business licenses' },
  { id: 'additional', title: 'Other Docs', icon: FolderOpen, description: 'Optional documents' },
  { id: 'review', title: 'Review', icon: CheckCircle, description: 'Review & submit' },
];

interface UploadedDoc {
  url: string;
  name: string;
  uploadedAt: string;
}

interface FormData {
  // Identity
  identityDoc: UploadedDoc | null;
  fullName: string;
  // Insurance
  insuranceDoc: UploadedDoc | null;
  insuranceProvider: string;
  insuranceExpiry: string;
  // Certifications
  certifications: UploadedDoc[];
  // Licenses
  licenses: UploadedDoc[];
  // Additional
  additionalDocs: UploadedDoc[];
}

export default function VerificationStartPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [hasContractorProfile, setHasContractorProfile] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    identityDoc: null,
    fullName: '',
    insuranceDoc: null,
    insuranceProvider: '',
    insuranceExpiry: '',
    certifications: [],
    licenses: [],
    additionalDocs: [],
  });

  // Check if user has contractor profile
  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch('/api/contractors/verification/status');
        if (res.ok) {
          const data = await res.json();
          setHasContractorProfile(data.hasContractorProfile);
          
          // Pre-fill name from session
          if (session?.user?.name) {
            setFormData(prev => ({ ...prev, fullName: session.user.name || '' }));
          }
        }
      } catch (err) {
        console.error('Failed to check profile:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      checkProfile();
    } else if (sessionStatus !== 'loading') {
      setLoading(false);
    }
  }, [session, sessionStatus]);

  // Redirect if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/dashboard/contractor/verify/start');
    return null;
  }

  // Handle file upload
  const handleUpload = async (
    file: File,
    type: 'identity' | 'insurance' | 'certification' | 'license' | 'additional'
  ) => {
    setUploading(true);
    setError('');

    try {
      // Get presigned URL - SECURE PATH for verification documents
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          folder: 'contractors',
          subfolder: 'verification',
          fileType: 'document',
        }),
      });

      const presignData = await presignRes.json();
      if (!presignData.success) {
        throw new Error(presignData.error || 'Failed to get upload URL');
      }

      // Upload to S3
      await fetch(presignData.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      const uploadedDoc: UploadedDoc = {
        url: presignData.data.fileUrl,
        name: file.name,
        uploadedAt: new Date().toISOString(),
      };

      // Update form data based on type
      switch (type) {
        case 'identity':
          setFormData(prev => ({ ...prev, identityDoc: uploadedDoc }));
          break;
        case 'insurance':
          setFormData(prev => ({ ...prev, insuranceDoc: uploadedDoc }));
          break;
        case 'certification':
          setFormData(prev => ({
            ...prev,
            certifications: [...prev.certifications, uploadedDoc],
          }));
          break;
        case 'license':
          setFormData(prev => ({
            ...prev,
            licenses: [...prev.licenses, uploadedDoc],
          }));
          break;
        case 'additional':
          setFormData(prev => ({
            ...prev,
            additionalDocs: [...prev.additionalDocs, uploadedDoc],
          }));
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded doc
  const removeDoc = (type: string, index?: number) => {
    switch (type) {
      case 'identity':
        setFormData(prev => ({ ...prev, identityDoc: null }));
        break;
      case 'insurance':
        setFormData(prev => ({ ...prev, insuranceDoc: null }));
        break;
      case 'certification':
        setFormData(prev => ({
          ...prev,
          certifications: prev.certifications.filter((_, i) => i !== index),
        }));
        break;
      case 'license':
        setFormData(prev => ({
          ...prev,
          licenses: prev.licenses.filter((_, i) => i !== index),
        }));
        break;
      case 'additional':
        setFormData(prev => ({
          ...prev,
          additionalDocs: prev.additionalDocs.filter((_, i) => i !== index),
        }));
        break;
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    setError('');
    
    switch (currentStep) {
      case 0: // Identity
        if (!formData.identityDoc) {
          setError('Please upload an identity document');
          return false;
        }
        if (!formData.fullName.trim()) {
          setError('Please enter your full name');
          return false;
        }
        return true;
      case 1: // Insurance
        if (!formData.insuranceDoc) {
          setError('Please upload your insurance certificate');
          return false;
        }
        return true;
      case 2: // Certifications (optional)
        return true;
      case 3: // Licenses (optional)
        return true;
      case 4: // Additional (optional)
        return true;
      case 5: // Review
        return true;
      default:
        return true;
    }
  };

  // Go to next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  // Go to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Submit verification
  const handleSubmit = async () => {
    if (!formData.identityDoc || !formData.insuranceDoc) {
      setError('Identity and insurance documents are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contractors/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityDoc: formData.identityDoc,
          fullName: formData.fullName,
          insuranceDoc: formData.insuranceDoc,
          insuranceProvider: formData.insuranceProvider,
          insuranceExpiry: formData.insuranceExpiry,
          certifications: formData.certifications,
          licenses: formData.licenses,
          additionalDocs: formData.additionalDocs,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      // Redirect based on result
      if (data.verificationStatus === 'ai_approved') {
        router.push('/dashboard/contractor/verify/payment');
      } else {
        router.push('/dashboard/contractor/verify');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Require contractor profile first
  if (!hasContractorProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy-900 mb-2">Profile Required</h2>
        <p className="text-slate-500 mb-6">
          Please create your free contractor profile before starting verification.
        </p>
        <button
          onClick={() => router.push('/dashboard/contractor/profile')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Create Contractor Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex flex-col items-center ${
                    index < STEPS.length - 1 ? 'flex-1' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium hidden sm:block ${
                      isActive ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      index < currentStep ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-navy-900 mb-2">
          {STEPS[currentStep].title}
        </h2>
        <p className="text-slate-500 mb-6">{STEPS[currentStep].description}</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Identity */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="As shown on your ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">
                Identity Document <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-3">
                Upload a driver&apos;s license or passport
              </p>
              
              {formData.identityDoc ? (
                <UploadedDocCard
                  doc={formData.identityDoc}
                  onRemove={() => removeDoc('identity')}
                />
              ) : (
                <FileUploadZone
                  onUpload={(file) => handleUpload(file, 'identity')}
                  uploading={uploading}
                  accept="image/*,.pdf"
                />
              )}
            </div>
          </div>
        )}

        {/* Step 2: Insurance */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">
                Insurance Certificate <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-3">
                General Liability Insurance certificate (COI)
              </p>
              
              {formData.insuranceDoc ? (
                <UploadedDocCard
                  doc={formData.insuranceDoc}
                  onRemove={() => removeDoc('insurance')}
                />
              ) : (
                <FileUploadZone
                  onUpload={(file) => handleUpload(file, 'insurance')}
                  uploading={uploading}
                  accept="image/*,.pdf"
                />
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  Insurance Provider <span className="text-slate-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g., State Farm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  Expiration Date <span className="text-slate-400 text-xs">(optional)</span>
                </label>
                <input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Certifications */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">
              Upload FRA Safety, RWP, or other safety certifications (optional but recommended)
            </p>
            
            {formData.certifications.length > 0 && (
              <div className="space-y-3">
                {formData.certifications.map((doc, index) => (
                  <UploadedDocCard
                    key={index}
                    doc={doc}
                    onRemove={() => removeDoc('certification', index)}
                  />
                ))}
              </div>
            )}
            
            <FileUploadZone
              onUpload={(file) => handleUpload(file, 'certification')}
              uploading={uploading}
              accept="image/*,.pdf"
              label="Add Certification"
            />
          </div>
        )}

        {/* Step 4: Licenses */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">
              Upload state business license or contractor license (optional)
            </p>
            
            {formData.licenses.length > 0 && (
              <div className="space-y-3">
                {formData.licenses.map((doc, index) => (
                  <UploadedDocCard
                    key={index}
                    doc={doc}
                    onRemove={() => removeDoc('license', index)}
                  />
                ))}
              </div>
            )}
            
            <FileUploadZone
              onUpload={(file) => handleUpload(file, 'license')}
              uploading={uploading}
              accept="image/*,.pdf"
              label="Add License"
            />
          </div>
        )}

        {/* Step 5: Additional Documents */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">
              Upload safety manuals, project portfolios, or other supporting documents (optional)
            </p>
            
            {formData.additionalDocs.length > 0 && (
              <div className="space-y-3">
                {formData.additionalDocs.map((doc, index) => (
                  <UploadedDocCard
                    key={index}
                    doc={doc}
                    onRemove={() => removeDoc('additional', index)}
                  />
                ))}
              </div>
            )}
            
            <FileUploadZone
              onUpload={(file) => handleUpload(file, 'additional')}
              uploading={uploading}
              accept="image/*,.pdf"
              label="Add Document"
            />
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <ReviewSection title="Identity" required>
              {formData.identityDoc ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{formData.fullName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 text-sm">{formData.identityDoc.name}</span>
                </div>
              ) : (
                <span className="text-red-500">Missing</span>
              )}
            </ReviewSection>

            <ReviewSection title="Insurance" required>
              {formData.insuranceDoc ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-500 text-sm">{formData.insuranceDoc.name}</span>
                </div>
              ) : (
                <span className="text-red-500">Missing</span>
              )}
            </ReviewSection>

            <ReviewSection title="Certifications">
              {formData.certifications.length > 0 ? (
                <ul className="space-y-1">
                  {formData.certifications.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {doc.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-400">None uploaded</span>
              )}
            </ReviewSection>

            <ReviewSection title="Licenses">
              {formData.licenses.length > 0 ? (
                <ul className="space-y-1">
                  {formData.licenses.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {doc.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-400">None uploaded</span>
              )}
            </ReviewSection>

            <ReviewSection title="Additional Documents">
              {formData.additionalDocs.length > 0 ? (
                <ul className="space-y-1">
                  {formData.additionalDocs.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {doc.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-400">None uploaded</span>
              )}
            </ReviewSection>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                By submitting, you agree that the documents are authentic and represent your business.
                Our AI will review your submission, followed by human admin approval.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-navy-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.identityDoc || !formData.insuranceDoc}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Verification
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Components
function FileUploadZone({
  onUpload,
  uploading,
  accept,
  label = 'Upload File',
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
  accept: string;
  label?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
      {uploading ? (
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      ) : (
        <>
          <Upload className="w-8 h-8 text-slate-400 mb-2" />
          <span className="text-sm font-medium text-slate-600">{label}</span>
          <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</span>
        </>
      )}
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={uploading}
      />
    </label>
  );
}

function UploadedDocCard({
  doc,
  onRemove,
}: {
  doc: UploadedDoc;
  onRemove: () => void;
}) {
  const isImage = doc.url.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      {isImage ? (
        <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0">
          <Image src={doc.url} alt={doc.name} fill className="object-cover" />
        </div>
      ) : (
        <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-navy-900 truncate">{doc.name}</p>
        <p className="text-xs text-slate-500">
          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function ReviewSection({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <h3 className="text-sm font-medium text-navy-900 mb-2">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </h3>
      {children}
    </div>
  );
}
