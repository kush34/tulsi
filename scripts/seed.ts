import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const seedUsers = [
  {
    email: "admin@tulsi.dev",
    name: "System Admin",
    password: "Admin@12345",
    role: Role.ADMIN,
  },
  {
    email: "doctor@tulsi.dev",
    name: "Dr. Ayesha Khan",
    password: "Doctor@12345",
    role: Role.DOCTOR,
    doctor: {
      specialty: "Cardiology",
      licenseNumber: "PMC-1024",
      yearsOfExp: 12,
      bio: "Senior interventional cardiologist with 12 years of experience.",
      education: "MBBS, MD (Cardiology) - All India Institute of Medical Sciences",
      languages: "English,Hindi",
      consultationFee: 1200,
      address: "Mumbai, India",
      availableForConsultation: true,
    },
  },
  {
    email: "patient@tulsi.dev",
    name: "Rahul Verma",
    password: "Patient@12345",
    role: Role.PATIENT,
    patient: { dob: new Date("1992-05-14"), gender: "M", bloodType: "O+" },
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const seedUser of seedUsers) {
    const passwordHash = await hashPassword(seedUser.password);
    const data = {
      email: seedUser.email,
      name: seedUser.name,
      passwordHash,
      role: seedUser.role,
      isVerified: true,
      patient:
        seedUser.role === Role.PATIENT ? { create: seedUser.patient ?? {} } : undefined,
      doctor:
        seedUser.role === Role.DOCTOR ? { create: seedUser.doctor } : undefined,
    };

    await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        name: seedUser.name,
        passwordHash,
        isVerified: true,
      },
      create: data,
    });
  }

  const patient = await prisma.user.findUnique({ where: { email: "patient@tulsi.dev" } });
  if (patient) {
    await prisma.medicalProfile.upsert({
      where: { userId: patient.id },
      update: {},
      create: {
        userId: patient.id,
        allergies: [
          { name: "Penicillin", severity: "severe", reaction: "Rash", notes: "Developed as child" },
          { name: "Peanuts", severity: "moderate", reaction: "Hives" },
        ],
        conditions: [
          { name: "Hypertension", diagnosedAt: "2018", status: "ongoing", notes: "Controlled with medication" },
          { name: "Asthma", diagnosedAt: "2005", status: "active" },
        ],
        medications: [
          { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", startDate: "2018-03" },
          { name: "Salbutamol Inhaler", dosage: "100mcg", frequency: "As needed", startDate: "2005" },
        ],
        surgeries: [
          { name: "Appendectomy", date: "2012", hospital: "City Hospital", notes: "Laparoscopic" },
        ],
        familyHistory: [
          { condition: "Diabetes (Type 2)", relation: "Father" },
          { condition: "Heart disease", relation: "Maternal grandfather" },
        ],
        socialHistory: {
          smoking: "Non-smoker",
          alcohol: "Occasional",
          diet: "Balanced, low sodium",
          exercise: "3x/week",
          occupation: "Software engineer",
        },
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: "admin@tulsi.dev" } });
  if (admin) {
    await prisma.auditEvent.create({
      data: {
        userId: admin.id,
        event: "SEED.INITIALIZED",
        metadata: { createdUsers: seedUsers.map((u) => u.email) },
      },
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });