/**
 * THE RAIL EXCHANGE™ — Verification Documents API
 * 
 * GET - Fetch saved verification documents
 * POST - Save verification step data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { Types } from 'mongoose';

interface UploadedDoc {
  url: string;
  name: string;
  uploadedAt: string;
}

interface VerificationDocuments {
  identity?: {
    fullName: string;
    document: UploadedDoc;
  };
  insurance?: {
    provider: string;
    expiry: string;
    document: UploadedDoc;
  };
  certifications?: UploadedDoc[];
  licenses?: UploadedDoc[];
  additional?: UploadedDoc[];
}

/**
 * GET /api/contractors/verification/documents
 * Get saved verification documents for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const profile = await ContractorProfile.findOne({
      userId: new Types.ObjectId(session.user.id),
    }).lean();

    if (!profile) {
      return NextResponse.json({});
    }

    // Extract verification documents from profile
    const verificationDocs: VerificationDocuments = {};

    // Check for identity document (stored as 'other' type with [identity] prefix)
    const identityDoc = profile.documents?.find((d: { type: string; name: string }) => 
      d.type === 'other' && d.name.startsWith('[identity]')
    );
    if (identityDoc) {
      verificationDocs.identity = {
        fullName: profile.businessName || '',
        document: {
          url: identityDoc.url,
          name: identityDoc.name.replace('[identity] ', ''),
          uploadedAt: identityDoc.uploadedAt?.toISOString() || new Date().toISOString(),
        },
      };
    }

    // Check for insurance document
    const insuranceDoc = profile.documents?.find((d: { type: string }) => d.type === 'insurance');
    if (insuranceDoc) {
      verificationDocs.insurance = {
        provider: '', // Provider not stored in current schema
        expiry: insuranceDoc.expirationDate?.toISOString().split('T')[0] || '',
        document: {
          url: insuranceDoc.url,
          name: insuranceDoc.name,
          uploadedAt: insuranceDoc.uploadedAt?.toISOString() || new Date().toISOString(),
        },
      };
    }

    // Get certifications
    const certDocs = profile.documents?.filter((d: { type: string }) => d.type === 'certification') || [];
    if (certDocs.length > 0) {
      verificationDocs.certifications = certDocs.map((d: { url: string; name: string; uploadedAt?: Date }) => ({
        url: d.url,
        name: d.name,
        uploadedAt: d.uploadedAt?.toISOString() || new Date().toISOString(),
      }));
    }

    // Get licenses
    const licenseDocs = profile.documents?.filter((d: { type: string }) => d.type === 'license') || [];
    if (licenseDocs.length > 0) {
      verificationDocs.licenses = licenseDocs.map((d: { url: string; name: string; uploadedAt?: Date }) => ({
        url: d.url,
        name: d.name,
        uploadedAt: d.uploadedAt?.toISOString() || new Date().toISOString(),
      }));
    }

    // Get additional documents (other type but NOT identity)
    const additionalDocs = profile.documents?.filter((d: { type: string; name: string }) => 
      d.type === 'other' && !d.name.startsWith('[identity]')
    ) || [];
    if (additionalDocs.length > 0) {
      verificationDocs.additional = additionalDocs.map((d: { url: string; name: string; uploadedAt?: Date }) => ({
        url: d.url,
        name: d.name,
        uploadedAt: d.uploadedAt?.toISOString() || new Date().toISOString(),
      }));
    }

    return NextResponse.json(verificationDocs);
  } catch (error) {
    console.error('Error fetching verification documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contractors/verification/documents
 * Save verification step data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { step, data } = body;

    if (!step) {
      return NextResponse.json({ error: 'Step is required' }, { status: 400 });
    }

    await connectDB();

    const userId = new Types.ObjectId(session.user.id);
    let profile = await ContractorProfile.findOne({ userId });

    // If no profile exists, create a basic one
    if (!profile) {
      profile = new ContractorProfile({
        userId,
        businessName: session.user.name || 'Unnamed Contractor',
        businessDescription: 'Contractor services',
        businessEmail: session.user.email || '',
        businessPhone: '',
        services: ['other'],
        regionsServed: ['Nationwide'],
        yearsInBusiness: 1,
        address: {
          city: 'Not specified',
          state: 'US',
          zipCode: '00000',
          country: 'USA',
        },
        documents: [],
        verificationStatus: 'pending',
      });
    }

    // Ensure documents array exists
    if (!profile.documents) {
      profile.documents = [];
    }

    // Update documents based on step
    switch (step) {
      case 'identity':
        // Remove existing identity doc (store as 'other' type with identity in name)
        profile.documents = profile.documents.filter((d: { type: string; name: string }) => 
          !(d.type === 'other' && d.name.startsWith('[identity]'))
        );
        if (data.document) {
          profile.documents.push({
            type: 'other' as const,
            name: `[identity] ${data.document.name}`,
            url: data.document.url,
            uploadedAt: new Date(data.document.uploadedAt),
          });
        }
        // Store fullName separately in verificationDocuments
        profile.verificationDocuments = profile.verificationDocuments || {};
        profile.verificationDocuments.submittedAt = new Date();
        break;

      case 'insurance':
        // Remove existing insurance doc
        profile.documents = profile.documents.filter((d: { type: string }) => d.type !== 'insurance');
        if (data.document) {
          profile.documents.push({
            type: 'insurance' as const,
            name: data.document.name,
            url: data.document.url,
            uploadedAt: new Date(data.document.uploadedAt),
            expirationDate: data.expiry ? new Date(data.expiry) : undefined,
          });
          // Store insurance certificate URL in verificationDocuments
          profile.verificationDocuments = profile.verificationDocuments || {};
          profile.verificationDocuments.insuranceCertificate = data.document.url;
        }
        break;

      case 'certifications':
        // Remove existing certification docs
        profile.documents = profile.documents.filter((d: { type: string }) => d.type !== 'certification');
        // Add new certifications
        if (Array.isArray(data)) {
          for (const cert of data) {
            profile.documents.push({
              type: 'certification' as const,
              name: cert.name,
              url: cert.url,
              uploadedAt: new Date(cert.uploadedAt),
            });
          }
        }
        break;

      case 'licenses':
        // Remove existing license docs
        profile.documents = profile.documents.filter((d: { type: string }) => d.type !== 'license');
        // Add new licenses
        if (Array.isArray(data)) {
          for (const license of data) {
            profile.documents.push({
              type: 'license' as const,
              name: license.name,
              url: license.url,
              uploadedAt: new Date(license.uploadedAt),
            });
          }
          // Store first business license URL in verificationDocuments
          if (data.length > 0) {
            profile.verificationDocuments = profile.verificationDocuments || {};
            profile.verificationDocuments.businessLicense = data[0].url;
          }
        }
        break;

      case 'additional':
        // Remove existing other docs (except identity which is prefixed)
        profile.documents = profile.documents.filter((d: { type: string; name: string }) => 
          d.type !== 'other' || d.name.startsWith('[identity]')
        );
        // Add new additional docs
        if (Array.isArray(data)) {
          for (const doc of data) {
            profile.documents.push({
              type: 'other' as const,
              name: doc.name,
              url: doc.url,
              uploadedAt: new Date(doc.uploadedAt),
            });
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    // Mark as pending verification if documents added
    if (profile.verificationStatus === 'none' && profile.documents.length > 0) {
      profile.verificationStatus = 'pending';
    }

    profile.updatedAt = new Date();
    await profile.save({ validateBeforeSave: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving verification documents:', error);
    return NextResponse.json(
      { error: 'Failed to save documents' },
      { status: 500 }
    );
  }
}
