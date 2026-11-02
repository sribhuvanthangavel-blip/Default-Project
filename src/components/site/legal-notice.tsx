import { ShieldIcon } from '@/components/ui/icons';

/**
 * Shown on legal pages until a qualified adviser has reviewed the text. This is
 * deliberately visible: the policy is a working draft, not a legal opinion.
 */
export function LegalReviewNotice() {
  return (
    <div className="mb-10 flex gap-4 rounded-2xl border border-amber-700/25 bg-amber-100 p-5">
      <ShieldIcon className="mt-0.5 size-5 shrink-0 text-amber-700" />
      <div>
        <p className="text-sm font-semibold text-amber-700">
          Working draft — legal review required
        </p>
        <p className="mt-1 text-[0.82rem] leading-6 text-amber-700/80">
          This document describes how the website is actually built, but the clinic&apos;s legal
          entity details, retention period, jurisdiction and liability wording must be completed and
          reviewed by the clinic&apos;s legal adviser before launch. Items in square brackets are
          placeholders, not statements of fact.
        </p>
      </div>
    </div>
  );
}
