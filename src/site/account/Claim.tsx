import { claimPurchase, type Claimable } from '@/app/account/claim'

/* Straight back from checkout, signed in with a different email than the one that paid: say where Pro went,
   and offer to move it here, so nobody buys it a second time. */
export function Claim({ payment, claim }: { payment: string; claim: Claimable }) {
  return (
    <section aria-labelledby="claim-title" className="mx-auto max-w-[1040px] pt-10 sm:pt-14">
      <form action={claimPurchase} className="flex flex-col gap-4 rounded-[20px] bg-surface p-5 shadow-[var(--card-edge)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <input type="hidden" name="payment" value={payment} />
        <div className="min-w-0">
          <h2 id="claim-title" className="text-[17px] font-medium tracking-[-0.015em] text-ink">
            Your Pro went to {claim.paid}
          </h2>
          <p className="mt-1 max-w-[560px] text-[14px] leading-[1.55] text-ink-3">You paid with that address and signed in with this one. Move Pro to this account and your keys will work here.</p>
        </div>
        <button type="submit" className="ring-focus flex h-11 shrink-0 items-center justify-center rounded-[11px] bg-ink px-5 text-[14px] font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]">
          Move Pro here
        </button>
      </form>
    </section>
  )
}
