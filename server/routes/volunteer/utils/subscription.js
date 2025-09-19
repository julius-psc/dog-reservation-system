// routes/volunteer/utils/subscription.js
function computeVolunteerSubscriptionStatus(moment, row) {
  const now = moment();
  const expiryDate = row.subscription_expiry_date
    ? moment(row.subscription_expiry_date)
    : null;

  const isActive =
    !!row.subscription_paid && !!expiryDate && expiryDate.isAfter(now);

  return {
    paid: isActive,
    expiryDate, // moment or null
    needsPayment: !isActive,
    nextDueDate: expiryDate, // informational
    canUnlockCard: isActive, // unlock only when valid
    hideSubscriptionUI: false, // no hidden/deferral UI anymore
    reason: isActive ? "active_subscription" : "payment_required",
  };
}

module.exports = { computeVolunteerSubscriptionStatus };
