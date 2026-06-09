  * A rollup application holds user funds and relies on a consensus contract to confirm its state.
  * Normally everything runs smoothly, but we need a safety net for when consensus can't be trusted.
  * As the app processes inputs, validators submit claims to the consensus, which records the latest agreed upon state.
  * This finalized state is the source of truth.
  * But what if a validator turns malicious?
  * It can submit a false claim about the app's state, trying to trick the system into accepting a fake result.
  * Claims aren't accepted instantly. They wait through a staging period.
  * This delay exists for one reason, to give a trusted guardian time to react.
  * The guardian is monitoring. It spots the malicious claim while the staging timer is still running and must act before that timer runs out.
  * The guardian forecloses the application.
  * Think of it as pulling an emergency break.
  * Only the guardian is allowed to do this.
  * This flips the app into a permanent foreclosed state.
  * There's no undo. Once foreclosed, it stays foreclosed forever.
  * Foreclosure freezes the consensus for this app.
  * The malicious claim can never be accepted.
  * Now the app's state is locked at the last trustworthy snapshot.
  * Now recovery begins. Anyone, not just the guardian, can submit the roots of the account ledger.
  * So the app knows everyone's balances.
  * The app checks this ledger against the frozen finalized state from consensus.
  * It must match exactly, proving the balances are the real agreed upon ones.
  * The verified ledger is locked in once and only once.
  * This anchor protects withdrawals even if consensus is later tampered with.
  * Now a user steps up to claim their funds.
  * They submit their account details along with the proof that they belong in that locked ledger.
  * The app verifies the proof against the locked ledger.
  * This confirms the user's balance is genuine and hasn't been faked.
  * The app asks a builder to translate the balance into a concrete payout instruction: who gets paid and how much.
  * The app executes that voucher through a trusted transfer helper, running it as if the app itself is making the transfer.
  * And the tokens move.
  * The user's funds leave the application and arrive safely in their own wallet, recovered without trusting the broken consensus.
  * The app marks that account as withdrawn, so no one can claim the same funds twice.
  * Each account gets exactly one payout.
  * That's the escape hatch.
  * If consensus is compromised, the Guardian freezes the app and every user can independently prove and reclaim their funds.
  * Safety doesn't depend on trust. It depends on math.
