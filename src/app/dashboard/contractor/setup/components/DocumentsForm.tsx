/**
 * THE RAIL EXCHANGE™ — Contractor Setup: Documents Form
 * 
 * Step 4: Insurance, licensing, and documentation upload.
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/forms';

interface DocumentsFormProps {
  formData: {
    insuranceProvider: string;
    insurancePolicyNumber: string;
    insuranceExpiration: string;
    licenseNumber: string;
    licenseState: string;
    documents: {
      type: string;
      name: string;
      url: string;
    }[];
  };
  onUpdate: (updates: Partial<DocumentsFormProps['formData']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DOCUMENT_TYPES = [
  { id: 'insurance', label: 'Certificate of Insurance (COI)', required: true },
  { id: 'w9', label: 'W-9 Form', required: true },
  { id: 'license', label: 'Business License', required: false },
  { id: 'fra-cert', label: 'FRA Certification', required: false },
  { id: 'safety-cert', label: 'Safety Certification', required: false },
  { id: 'bond', label: 'Surety Bond', required: false },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const DocumentsForm: React.FC<DocumentsFormProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploading(documentType);
    
    try {
      // Get presigned URL with all required fields (JSON, not FormData)
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          folder: 'contractors',
          subfolder: 'documents',
          fileType: 'document',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to get upload URL');
      }

      // Upload to S3
      const uploadRes = await fetch(result.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      const url = result.data.fileUrl;
      
      const updatedDocs = formData.documents.filter((d) => d.type !== documentType);
      updatedDocs.push({
        type: documentType,
        name: file.name,
        url,
      });
      
      onUpdate({ documents: updatedDocs });
    } catch (error) {
      console.error('Upload error:', error);
      setErrors((prev) => ({ ...prev, [documentType]: error instanceof Error ? error.message : 'Upload failed. Please try again.' }));
    } finally {
      setUploading(null);
    }
  };

  const removeDocument = (documentType: string) => {
    const updatedDocs = formData.documents.filter((d) => d.type !== documentType);
    onUpdate({ documents: updatedDocs });
  };

  const getUploadedDocument = (type: string) => {
    return formData.documents.find((d) => d.type === type);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.insuranceProvider.trim()) {
      newErrors.insuranceProvider = 'Insurance provider is required';
    }
    if (!formData.insuranceExpiration) {
      newErrors.insuranceExpiration = 'Expiration date is required';
    }

    // Check for required documents
    const insuranceDoc = getUploadedDocument('insurance');
    const w9Doc = getUploadedDocument('w9');

    if (!insuranceDoc) {
      newErrors.insurance = 'Certificate of Insurance is required';
    }
    if (!w9Doc) {
      newErrors.w9 = 'W-9 Form is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-navy-900">Documentation</h3>
        <p className="text-sm text-text-secondary">
          Upload required documents to verify your business. This information is kept secure and confidential.
        </p>
      </div>

      {/* Insurance Information */}
      <div className="p-4 bg-surface-secondary rounded-lg space-y-4">
        <h4 className="font-medium text-navy-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Insurance Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Insurance Provider"
            value={formData.insuranceProvider}
            onChange={(e) => onUpdate({ insuranceProvider: e.target.value })}
            error={errors.insuranceProvider}
            placeholder="e.g., Liberty Mutual"
            required
          />
          <InputField
            label="Policy Number"
            value={formData.insurancePolicyNumber}
            onChange={(e) => onUpdate({ insurancePolicyNumber: e.target.value })}
            placeholder="e.g., POL-123456789"
          />
        </div>
        
        <InputField
          label="Expiration Date"
          type="date"
          value={formData.insuranceExpiration}
          onChange={(e) => onUpdate({ insuranceExpiration: e.target.value })}
          error={errors.insuranceExpiration}
          required
        />
      </div>

      {/* License Information */}
      <div className="p-4 bg-surface-secondary rounded-lg space-y-4">
        <h4 className="font-medium text-navy-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          Contractor License
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="License Number"
            value={formData.licenseNumber}
            onChange={(e) => onUpdate({ licenseNumber: e.target.value })}
            placeholder="e.g., CONTR-12345"
            hint="Optional — if applicable in your state"
          />
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              License State
            </label>
            <select
              value={formData.licenseState}
              onChange={(e) => onUpdate({ licenseState: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border-default bg-surface-primary text-sm focus:outline-none focus:ring-2 focus:ring-rail-orange focus:border-transparent"
            >
              <option value="">Select State</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="space-y-4">
        <h4 className="font-medium text-navy-900">Upload Documents</h4>
        <p className="text-xs text-text-secondary">
          Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB.
        </p>

        <div className="space-y-3">
          {DOCUMENT_TYPES.map((docType) => {
            const uploadedDoc = getUploadedDocument(docType.id);
            const isUploading = uploading === docType.id;
            const hasError = errors[docType.id];

            return (
              <div
                key={docType.id}
                className={`p-4 rounded-lg border ${
                  uploadedDoc
                    ? 'border-status-success/30 bg-status-success/5'
                    : hasError
                    ? 'border-status-error/30 bg-status-error/5'
                    : 'border-border-default'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {uploadedDoc ? (
                      <svg className="w-5 h-5 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <div>
                      <span className="text-sm font-medium text-navy-900">
                        {docType.label}
                        {docType.required && <span className="text-status-error ml-1">*</span>}
                      </span>
                      {uploadedDoc && (
                        <p className="text-xs text-status-success">{uploadedDoc.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadedDoc && (
                      <button
                        type="button"
                        onClick={() => removeDocument(docType.id)}
                        className="text-xs text-status-error hover:text-status-error/80"
                      >
                        Remove
                      </button>
                    )}
                    <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isUploading
                        ? 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
                        : uploadedDoc
                        ? 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                        : 'bg-rail-orange text-white hover:bg-rail-orange-dark'
                    }`}>
                      {isUploading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {uploadedDoc ? 'Replace' : 'Upload'}
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.id, file);
                        }}
                        disabled={isUploading}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
                {hasError && (
                  <p className="text-xs text-status-error mt-2">{hasError}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button type="submit" className="bg-rail-orange hover:bg-rail-orange-dark">
          Continue
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </form>
  );
};

export { DocumentsForm };
