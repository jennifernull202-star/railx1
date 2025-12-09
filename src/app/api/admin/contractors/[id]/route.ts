import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import Notification from '@/models/Notification';
import { sendEmail } from '@/lib/email';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const contractor = await ContractorProfile.findById(id)
      .populate('userId', 'name email role status')
      .lean();

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    return NextResponse.json({ contractor });
  } catch (error) {
    console.error('Admin contractor fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contractor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    const contractor = await ContractorProfile.findById(id).populate('userId', 'name email');
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Get contractor fields safely
    const businessName = contractor.get('businessName') as string;
    const populatedUser = contractor.get('userId') as unknown as Record<string, unknown> | null;
    const userId = {
      _id: populatedUser?._id as string,
      email: populatedUser?.email as string,
    };

    let notificationType: string;
    let notificationTitle: string;
    let notificationMessage: string;
    let emailSubject: string;
    let emailBody: string;

    switch (action) {
      case 'verify':
        contractor.set('verificationStatus', 'verified');
        contractor.set('verifiedAt', new Date());
        notificationType = 'contractor_verified';
        notificationTitle = 'Contractor Profile Verified';
        notificationMessage = `Congratulations! Your contractor profile for ${businessName} has been verified. You now have access to all contractor features.`;
        emailSubject = 'Your Contractor Profile Has Been Verified - Rail Exchange';
        emailBody = `
          <h2>Congratulations!</h2>
          <p>Your contractor profile for <strong>${businessName}</strong> has been verified.</p>
          <p>You now have access to all contractor features on Rail Exchange, including:</p>
          <ul>
            <li>Premium visibility in contractor directory</li>
            <li>Ability to respond to service requests</li>
            <li>Verified badge on your profile</li>
          </ul>
          <p>Thank you for being a part of Rail Exchange!</p>
        `;
        break;

      case 'reject':
        contractor.set('verificationStatus', 'rejected');
        const rejectionReason = reason || 'Does not meet verification requirements';
        notificationType = 'contractor_rejected';
        notificationTitle = 'Contractor Verification Update';
        notificationMessage = `Your contractor profile verification was not approved. Reason: ${rejectionReason}. Please update your profile and resubmit for verification.`;
        emailSubject = 'Contractor Profile Verification Update - Rail Exchange';
        emailBody = `
          <h2>Verification Update</h2>
          <p>We were unable to verify your contractor profile for <strong>${businessName}</strong> at this time.</p>
          <p><strong>Reason:</strong> ${rejectionReason}</p>
          <p>Please update your profile information and documentation, then resubmit for verification.</p>
          <p>If you believe this was in error, please contact our support team.</p>
        `;
        break;

      case 'suspend':
        contractor.set('verificationStatus', 'pending');
        contractor.set('isActive', false);
        notificationType = 'contractor_suspended';
        notificationTitle = 'Contractor Profile Suspended';
        notificationMessage = `Your contractor profile for ${businessName} has been suspended. Please contact support for more information.`;
        emailSubject = 'Contractor Profile Suspended - Rail Exchange';
        emailBody = `
          <h2>Profile Suspended</h2>
          <p>Your contractor profile for <strong>${businessName}</strong> has been suspended.</p>
          <p>Please contact our support team for more information about this suspension.</p>
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await contractor.save();

    // Create notification
    await Notification.create({
      userId: userId._id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      relatedTo: {
        model: 'ContractorProfile',
        id: contractor._id,
      },
    });

    // Send email
    if (userId.email) {
      try {
        await sendEmail(userId.email, {
          subject: emailSubject,
          html: emailBody,
          text: emailBody.replace(/<[^>]*>/g, ''),
        });
      } catch (err) {
        console.error('Failed to send contractor email:', err);
      }
    }

    return NextResponse.json({
      success: true,
      contractor: {
        _id: contractor._id,
        businessName: contractor.get('businessName'),
        verificationStatus: contractor.get('verificationStatus'),
      },
    });
  } catch (error) {
    console.error('Admin contractor update error:', error);
    return NextResponse.json(
      { error: 'Failed to update contractor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const contractor = await ContractorProfile.findByIdAndDelete(id);
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin contractor delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contractor' },
      { status: 500 }
    );
  }
}
