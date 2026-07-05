import { Link } from "react-router-dom";

const LAST_UPDATED = "5 July 2026";

export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-primary font-bold hover:underline">
          ← Back to Skora RMS
        </Link>

        <div className="mt-6 mb-10">
          <h1 className="font-headline font-black text-3xl text-primary tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-on-surface">
          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              1. Overview
            </h2>
            <p className="text-sm leading-relaxed">
              This Privacy Policy explains how Skora RMS ("Skora," "we," "us")
              collects, uses, stores, and protects personal data in connection with
              the school result management platform, including data belonging to
              schools, school administrators, teachers, students, and parents or
              guardians who use the parent portal. Skora is designed for use by
              schools in Nigeria and this Policy is written with reference to the
              Nigeria Data Protection Act 2023 ("NDPA") and its implementing
              regulations.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              2. Roles Under Data Protection Law
            </h2>
            <p className="text-sm leading-relaxed">
              For data about students, parents, and staff that a School enters into
              Skora, the <strong>School acts as the Data Controller</strong> — it
              decides what data to collect and why. <strong>Skora acts as a Data
              Processor</strong>, processing that data only on the School's
              instructions and only to provide the Service (hosting, computing
              results, generating result sheets, enabling parent access, etc.). For
              data Skora collects directly to operate its own business — such as
              school administrator account/login details and billing information —
              Skora acts as the Data Controller.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              3. What Data We Collect
            </h2>
            <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
              <li><strong>School account data:</strong> school name, address, state/LGA, contact details, motto, logo, principal name, and template preference.</li>
              <li><strong>Staff/user data:</strong> names, email addresses, roles, and login credentials for administrators and teachers.</li>
              <li><strong>Student data:</strong> names, admission numbers, class, gender, scores, grades, remarks, psychometric ratings, teacher and principal comments, and (where uploaded) passport photographs.</li>
              <li><strong>Parent/guardian data:</strong> to the extent entered by the School, and scratch-card PIN usage data when accessing the parent portal.</li>
              <li><strong>Billing data:</strong> records of scratch-card batch requests, quantities, amounts, and payment confirmation status.</li>
              <li><strong>Technical data:</strong> log data such as IP address, device/browser type, and timestamps, collected automatically to secure and operate the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              4. How We Use Data
            </h2>
            <p className="text-sm leading-relaxed">We use the data described above to:</p>
            <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1 mt-2">
              <li>Provide the core Service — storing records, computing results, and generating result sheets and cards;</li>
              <li>Operate the parent portal, including validating scratch-card PINs against the correct student and term;</li>
              <li>Authenticate users and enforce role-based access control;</li>
              <li>Process scratch-card batch requests and reconcile payments;</li>
              <li>Maintain the security, integrity, and availability of the Service;</li>
              <li>Communicate service-related notices (e.g., batch activation, password resets);</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              We do not sell personal data, and we do not use student data for
              advertising.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              5. Legal Basis for Processing
            </h2>
            <p className="text-sm leading-relaxed">
              Where Skora processes personal data as a Processor on behalf of a
              School, the School is responsible for establishing a valid legal
              basis (e.g., performance of a contract with parents, legitimate
              interest in academic administration, or consent, as applicable under
              the NDPA) before entering data into Skora. Where Skora processes data
              as a Controller (e.g., administrator account and billing data), our
              basis is performance of our contract with the School and our
              legitimate interest in operating and securing the Service.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              6. Data Storage and Security
            </h2>
            <p className="text-sm leading-relaxed">
              Data is stored on secured infrastructure with access controls limiting
              who can view or modify it. Scratch-card PINs are stored in a form that
              allows the School to download them once as printable cards; the
              underlying plaintext PIN values are cleared from our systems once the
              School confirms the cards have been downloaded, reducing the window in
              which they exist in plaintext. Passwords are stored using industry
              standard hashing. While we take reasonable technical and
              organizational measures to protect data, no system can be guaranteed
              100% secure, and the School is responsible for safeguarding staff login
              credentials.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              7. Data Retention
            </h2>
            <p className="text-sm leading-relaxed">
              We retain School Data for as long as the school account remains
              active, so that historical results remain accessible across academic
              terms and years. If a School uses the in-app "Delete School Account"
              function, all associated data — teachers, classes, students, results,
              and scores — is permanently deleted from active systems; this action
              cannot be undone by Skora. Residual copies may persist briefly in
              routine backups before being purged in the normal backup rotation
              cycle.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              8. Sharing of Data
            </h2>
            <p className="text-sm leading-relaxed">
              We do not share personal data with third parties except: (a) with
              infrastructure and hosting providers who process data strictly on our
              instructions to operate the Service; (b) where required to comply
              with a legal obligation, court order, or lawful request from a
              competent authority; or (c) with the School's own designated users
              (administrators, teachers) as part of normal role-based access within
              the Service.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              9. Your Rights
            </h2>
            <p className="text-sm leading-relaxed">
              Subject to applicable law, individuals whose data is processed through
              Skora may have rights to access, correct, or request deletion of their
              personal data, and to object to certain processing. Because Schools
              act as Data Controllers for student and parent data, such requests
              should generally be directed to the relevant School in the first
              instance; Skora will support the School in fulfilling verified
              requests relating to data hosted on its platform.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              10. Children's Data
            </h2>
            <p className="text-sm leading-relaxed">
              Skora processes data belonging to students who may be minors, entered
              and managed by their School. Schools are responsible for ensuring they
              have appropriate authority under the NDPA and any applicable
              parental-consent requirements before entering a minor's personal data
              into the Service.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              11. Changes to This Policy
            </h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or legal requirements. Material changes will
              be indicated by updating the "Last updated" date above.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              12. Contact
            </h2>
            <p className="text-sm leading-relaxed">
              Questions about this Privacy Policy, or requests relating to personal
              data, can be directed to the support contact provided within the
              Skora application or on the Skora website. See also our{" "}
              <Link to="/terms" className="text-primary font-bold hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <p className="text-xs text-on-surface-variant italic pt-4 border-t border-outline-variant/20">
            This document is a general template and does not constitute legal
            advice. You should have it reviewed by a qualified Nigerian lawyer
            familiar with the Nigeria Data Protection Act 2023 before relying on it
            as your live privacy policy, particularly around retention periods and
            processor/controller obligations.
          </p>
        </div>
      </div>
    </div>
  );
};
