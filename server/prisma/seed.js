import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  encryptText,
  generateTrackingId,
  sha256,
  hashIpAddress
} from '../src/utils/crypto.util.js';
import { auditService, GENESIS_HASH } from '../src/services/audit.service.js';
import { nlpService } from '../src/services/nlp.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BribeShield AI Database Seed...');

  auditService.setPrisma(prisma);

  // 1. Create Default Administrative Users
  const passwordHash = await bcrypt.hash('BribeShield@2026!', 12);

  const users = [
    {
      email: 'superadmin@bribeshield.org',
      fullName: 'Chief Vigilance Director',
      role: 'SUPER_ADMIN',
      department: 'Central Vigilance Directorate'
    },
    {
      email: 'admin@bribeshield.org',
      fullName: 'Operations Administrator',
      role: 'ADMIN',
      department: 'Integrity & Grievance Cell'
    },
    {
      email: 'investigator@bribeshield.org',
      fullName: 'Senior Inspector Sharma',
      role: 'INVESTIGATOR',
      department: 'Police & Law Enforcement'
    },
    {
      email: 'analyst@bribeshield.org',
      fullName: 'Dr. Anita Roy',
      role: 'ANALYST',
      department: 'Intelligence & Pattern Analytics'
    },
    {
      email: 'auditor@bribeshield.org',
      fullName: 'Independent Ombudsman Auditor',
      role: 'AUDITOR',
      department: 'Statutory Compliance & Audit'
    }
  ];

  const createdUsers = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        role: u.role,
        department: u.department
      }
    });
    createdUsers[u.role] = user;
    console.log(`👤 User created: ${u.email} [${u.role}]`);
  }

  // 2. Seed Genesis Audit Block if no audit logs exist
  const auditCount = await prisma.auditLog.count();
  if (auditCount === 0) {
    await auditService.logEvent({
      entityType: 'SYSTEM',
      entityId: '00000000-0000-0000-0000-000000000000',
      action: 'SYSTEM_GENESIS_INITIALIZATION',
      user: createdUsers.SUPER_ADMIN,
      details: {
        note: 'BribeShield AI Enterprise Genesis Block Established',
        standard: 'ISO-37001 Anti-Bribery Compliance'
      }
    });
    console.log('⛓️  Genesis audit block initialized.');
  }

  // 3. Seed Sample Realistic Complaints
  const sampleComplaintsData = [
    {
      dept: 'Police & Law Enforcement',
      category: 'False Case Threat & Extortion',
      city: 'Mumbai',
      state: 'Maharashtra',
      loc: 'Andheri Traffic Division',
      bribeAmount: 50000,
      accused: 'Sub-Inspector R. K. Patil (Badge #8492)',
      desc: 'Sub-Inspector Patil stopped my commercial delivery van near Andheri flyover without reasonable cause. He threatened to confiscate the vehicle and fabricate a narcotics FIR unless I paid Rs. 50,000 cash on the spot today before sunset. He refused to give any official receipt.',
      contactEmail: 'whistleblower.mumbai@proton.me'
    },
    {
      dept: 'Revenue & Land Records',
      category: 'Property Registry & Mutation Kickback',
      city: 'Bengaluru',
      state: 'Karnataka',
      loc: 'Sub-Registrar Office, Jayanagar',
      bribeAmount: 250000,
      accused: 'Head Clerk M. Venkatesh & Broker Anand',
      desc: 'Applied for land mutation for ancestral property 4 months ago. The file is deliberately stalled. Clerk Venkatesh communicated through broker Anand demanding a cut of Rs 2.5 Lakhs (2% of property valuation) to clear the file, warning that otherwise the NOC will be rejected.',
      contactEmail: 'citizen.karnataka@gmail.com'
    },
    {
      dept: 'Municipal Corporation & Building Permits',
      category: 'Occupancy Certificate Delay',
      city: 'Delhi',
      state: 'Delhi NCT',
      loc: 'MCD Civic Centre, Zone 4',
      bribeAmount: 120000,
      accused: 'Junior Engineer Verma',
      desc: 'JE Verma inspected our newly constructed clinic and found no building code violations. However, he refuses to issue the Occupancy Certificate and stated off-the-record that "approval fee" of Rs. 1,20,000 must be delivered to his personal assistant tomorrow.',
      contactEmail: null
    },
    {
      dept: 'Public Works Department (PWD)',
      category: 'Tender Kickbacks & Cartel Collusion',
      city: 'Hyderabad',
      state: 'Telangana',
      loc: 'PWD Division Secretariat',
      bribeAmount: 1500000,
      accused: 'Executive Engineer Suresh Reddy',
      desc: 'In the drainage repair tender for Ward 12, Executive Engineer Suresh Reddy demanded a 10% kickback amounting to Rs. 15 Lakhs from registered contractors. He threatened to disqualify any bidder who did not pay the advance before technical bid opening.',
      contactEmail: null
    }
  ];

  const existingComplaintsCount = await prisma.complaint.count();
  if (existingComplaintsCount === 0) {
    for (const item of sampleComplaintsData) {
      const trackingId = generateTrackingId();
      const nlpResult = nlpService.analyzeComplaint({
        description: item.desc,
        statedBribeAmount: item.bribeAmount,
        department: item.dept,
        category: item.category,
        evidenceCount: 1
      });

      const complaint = await prisma.complaint.create({
        data: {
          trackingId,
          trackingCodeHash: sha256(trackingId),
          status: nlpResult.riskLevel === 'CRITICAL' ? 'INVESTIGATING' : 'SUBMITTED',
          priority: nlpResult.riskLevel,
          department: item.dept,
          category: item.category,
          incidentDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000),
          incidentLocation: item.loc,
          city: item.city,
          state: item.state,
          encryptedDescription: encryptText(item.desc),
          encryptedBribeAmount: encryptText(String(item.bribeAmount)),
          bribeAmountNumeric: item.bribeAmount,
          encryptedAccused: encryptText(item.accused),
          encryptedContactInfo: item.contactEmail ? encryptText(JSON.stringify({ email: item.contactEmail })) : null,
          notificationChannel: item.contactEmail ? 'EMAIL' : 'NONE',
          isAnonymous: !item.contactEmail,
          riskScore: nlpResult.score,
          riskLevel: nlpResult.riskLevel,
          riskFactors: JSON.stringify(nlpResult.factors),
          nlpAnalysis: JSON.stringify(nlpResult.nlpInsights),
          ipHash: hashIpAddress('127.0.0.1')
        }
      });

      await prisma.timeline.create({
        data: {
          complaintId: complaint.id,
          newStatus: 'SUBMITTED',
          remarks: 'Anonymous grievance lodged with encrypted payload and AI risk assessment.',
          isPublic: true
        }
      });

      if (complaint.status === 'INVESTIGATING') {
        await prisma.timeline.create({
          data: {
            complaintId: complaint.id,
            oldStatus: 'SUBMITTED',
            newStatus: 'INVESTIGATING',
            remarks: 'Elevated priority: Assigned to Special Vigilance Unit for prompt verification.',
            updatedById: createdUsers.INVESTIGATOR.id,
            isPublic: true
          }
        });
      }

      await auditService.logEvent({
        entityType: 'COMPLAINT',
        entityId: complaint.id,
        action: 'COMPLAINT_SEED_INITIALIZED',
        user: createdUsers.SUPER_ADMIN,
        details: {
          trackingId: complaint.trackingId,
          riskLevel: complaint.riskLevel,
          riskScore: complaint.riskScore
        }
      });

      console.log(`📋 Seeded Complaint: ${complaint.trackingId} [${complaint.riskLevel} - Score: ${complaint.riskScore}]`);
    }
  }

  // 4. Seed Suspects Repository (cybercrime.gov.in inspired)
  const suspectsCount = await prisma.suspect.count();
  if (suspectsCount === 0) {
    const sampleSuspects = [
      { type: 'phone', value: '+91 98450 12345', department: 'Police & Traffic', city: 'Bengaluru', reportsCount: 4, riskLevel: 'Critical', notes: 'Demanding GPay/PayTM for vehicle release' },
      { type: 'upi', value: 'speedpass.rto@ybl', department: 'Transport (RTO)', city: 'Mumbai', reportsCount: 3, riskLevel: 'High', notes: 'Touted for driving license test exemption' },
      { type: 'officer', value: 'Inspector R. K. Patil', department: 'Police Traffic Division', city: 'Mumbai', reportsCount: 5, riskLevel: 'Critical', notes: 'Extortion near highway checkpost' },
      { type: 'upi', value: 'landrecord.noc@paytm', department: 'Revenue & Land Records', city: 'Hyderabad', reportsCount: 2, riskLevel: 'Medium', notes: 'Unregistered mutation fee demands' }
    ];
    for (const s of sampleSuspects) {
      await prisma.suspect.create({ data: s });
    }
    console.log('🕵️ Seeded Suspect Repository records.');
  }

  // 5. Seed Learning Corner Advisories
  const advisoriesCount = await prisma.advisory.count();
  if (advisoriesCount === 0) {
    const sampleAdvisories = [
      {
        title: 'Beware of Fake Digital FIR & Police Impersonation Scams',
        date: '2026-09-05',
        category: 'Urgent Warning',
        summary: 'Fraudsters impersonating Cyber Cell or Police Officers demanding instant digital payment under threat of immediate arrest or asset freezing.',
        action: 'Never pay cash or UPI to individual phone numbers claiming to be police. Verify official FIR numbers at state police portals.'
      },
      {
        title: 'Know Your Rights: Prevention of Corruption Act (Section 7)',
        date: '2026-09-01',
        category: 'Citizen Rights',
        summary: 'Demanding a bribe for performing a public duty is punishable by up to 7 years imprisonment. Citizens forced to pay bribes have statutory protection if reported promptly.',
        action: 'Log the incident anonymously on BribeShield AI or call the Anti-Corruption Ombudsman helpline 1064 immediately.'
      },
      {
        title: 'RTO & Vehicle Impound Receipt Guidelines',
        date: '2026-08-28',
        category: 'Public Service Advice',
        summary: 'Officers cannot collect cash fines without issuing an official computerized e-Challan with official QR code and system receipt.',
        action: 'Always demand official digital e-Challan receipt before paying any official traffic fine.'
      }
    ];
    for (const a of sampleAdvisories) {
      await prisma.advisory.create({ data: a });
    }
    console.log('📚 Seeded Learning Corner Advisories.');
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
