import { Link } from "react-router-dom";

const LAST_UPDATED = "5 July 2026";

export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-primary font-bold hover:underline">
          ← Back to Skora RMS
        </Link>

        <div className="mt-6 mb-10">
          <h1 className="font-headline font-black text-3xl text-primary tracking-tight">
            Terms of Service
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-on-surface">
          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              1. Agreement to Terms
            </h2>
            <p className="text-sm leading-relaxed">
              These Terms of Service ("Terms") govern access to and use of Skora RMS
              ("Skora," "we," "us," or "our"), a school result management platform
              provided as a hosted, subscription-based service to schools in Nigeria
              ("Customer," "School," "you"). By creating an account, registering a
              school, or otherwise using Skora, you agree to be bound by these Terms.
              If you do not agree, do not use the Service. If you are accepting these
              Terms on behalf of a school, you represent that you have the authority
              to bind that school to these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              2. The Service
            </h2>
            <p className="text-sm leading-relaxed">
              Skora provides tools for schools to manage students, classes, subjects,
              teachers, scores, result computation, result-sheet generation, and
              related administrative functions, including a parent-facing portal for
              viewing results using scratch-card PIN access. Skora is a software
              tool. Skora does not set curricula, grading policy, or academic
              standards — these remain entirely the responsibility of the School. We
              may add, modify, or remove features at any time, and may modify these
              Terms from time to time; continued use of the Service after changes
              take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              3. Accounts and Roles
            </h2>
            <p className="text-sm leading-relaxed">
              Access to Skora is role-based (school administrator/principal,
              teacher, and, where applicable, parent/guardian via the parent
              portal). The School's administrator account holder is responsible for:
            </p>
            <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1 mt-2">
              <li>Maintaining the confidentiality of login credentials issued to staff;</li>
              <li>All activity that occurs under accounts created for the School, including actions taken by teachers or staff it invites;</li>
              <li>Ensuring that data entered (student records, scores, comments, psychometric ratings, etc.) is accurate and lawfully obtained;</li>
              <li>Obtaining any consents required under applicable law before entering personal data of students, parents, or staff into the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              4. Fees, Billing, and Scratch-Card Batches
            </h2>
            <p className="text-sm leading-relaxed">
              Skora is offered on a per-term subscription basis at published pricing
              tiers, plus optional pay-as-you-go scratch-card PIN batches that
              parents use to access results through the parent portal. When a School
              requests a scratch-card batch, the applicable amount is calculated and
              displayed before submission, and the batch is activated by Skora only
              after the corresponding payment has been received and confirmed
              through the payment channel specified in the app. Fees, once paid for
              an activated batch or subscription period, are non-refundable except
              where required by law or expressly stated otherwise by Skora in
              writing. Skora reserves the right to change pricing for future billing
              periods or future batches, with reasonable notice provided in-app or by
              email.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              5. Acceptable Use
            </h2>
            <p className="text-sm leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1 mt-2">
              <li>Use the Service to enter or process data you are not lawfully authorized to hold;</li>
              <li>Falsify results, scores, or academic records with intent to deceive third parties (e.g., examination bodies, employers, other schools);</li>
              <li>Attempt to gain unauthorized access to another school's data, another user's account, or the Service's underlying infrastructure;</li>
              <li>Reverse-engineer, scrape, resell, or white-label the Service without a separate written agreement with Skora;</li>
              <li>Use the Service in a manner that violates Nigerian law, including the Nigeria Data Protection Act 2023 and its regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              6. School Data and Ownership
            </h2>
            <p className="text-sm leading-relaxed">
              As between Skora and the School, the School retains ownership of the
              academic and personal data it enters into the Service ("School Data").
              Skora is granted a limited license to host, process, and display School
              Data solely to provide and improve the Service. On termination, the
              School may request export of its School Data within a reasonable
              period, after which Skora may delete it in accordance with our data
              retention practices described in the{" "}
              <Link to="/privacy" className="text-primary font-bold hover:underline">
                Privacy Policy
              </Link>
              . Deleting a school account through the in-app "Delete School Account"
              function is permanent and cannot be undone by Skora.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              7. Intellectual Property
            </h2>
            <p className="text-sm leading-relaxed">
              The Skora name, software, design, templates, and underlying code are
              the property of Skora and its developer and are protected by
              applicable intellectual property laws. Nothing in these Terms
              transfers ownership of the Service itself to the School; you receive
              only the limited right to use the Service as intended for your own
              school's internal administration.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              8. Disclaimers
            </h2>
            <p className="text-sm leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES
              OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT. Skora does not guarantee that the Service will be
              uninterrupted, error-free, or that computed results, grades, or
              generated documents will be free of error arising from data entered by
              the School. The School remains responsible for reviewing and verifying
              any result sheet before it is released to parents or students.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              9. Limitation of Liability
            </h2>
            <p className="text-sm leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKORA AND ITS DEVELOPER SHALL
              NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF DATA, REVENUE, OR GOODWILL, ARISING
              OUT OF OR RELATED TO USE OF THE SERVICE. IN NO EVENT SHALL SKORA'S
              TOTAL AGGREGATE LIABILITY TO A SCHOOL FOR ALL CLAIMS ARISING OUT OF OR
              RELATED TO THE SERVICE EXCEED THE FEES PAID BY THAT SCHOOL TO SKORA IN
              THE THREE (3) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              10. Indemnification
            </h2>
            <p className="text-sm leading-relaxed">
              The School agrees to indemnify and hold harmless Skora and its
              developer from any claims, damages, or expenses (including reasonable
              legal fees) arising from the School's data, the School's breach of
              these Terms, or the School's violation of applicable law, including
              data protection law, in its use of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              11. Suspension and Termination
            </h2>
            <p className="text-sm leading-relaxed">
              Skora may suspend or terminate access to the Service, with or without
              notice, if the School breaches these Terms, fails to pay applicable
              fees, or if such action is required to protect the security or
              integrity of the Service or other users' data. Either party may
              terminate for convenience; the School may do so by deleting its
              account through the in-app deletion flow, which permanently removes
              associated School Data.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              12. Governing Law
            </h2>
            <p className="text-sm leading-relaxed">
              These Terms are governed by the laws of the Federal Republic of
              Nigeria, without regard to conflict-of-law principles. Any dispute
              arising out of or relating to these Terms or the Service shall be
              subject to the exclusive jurisdiction of the courts of Nigeria.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg text-primary mb-2">
              13. Contact
            </h2>
            <p className="text-sm leading-relaxed">
              Questions about these Terms can be directed to the support contact
              provided within the Skora application or on the Skora website.
            </p>
          </section>

          <p className="text-xs text-on-surface-variant italic pt-4 border-t border-outline-variant/20">
            This document is a general template and does not constitute legal
            advice. You should have it reviewed by a qualified Nigerian lawyer
            before relying on it as your school-facing contract, particularly for
            payment, data protection, and liability terms.
          </p>
        </div>
      </div>
    </div>
  );
};
