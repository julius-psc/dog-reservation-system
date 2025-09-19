// routes/volunteer/index.js
const express = require("express");
const router = express.Router();

// Helper to unwrap CJS/ESM or object-shaped exports to a function
function asFn(mod, name) {
  if (typeof mod === "function") return mod;
  if (mod && typeof mod.default === "function") return mod.default;

  if (mod && typeof mod === "object") {
    // common names first
    for (const key of ["register", "init", "setup", "mount", "create", "build"]) {
      if (typeof mod[key] === "function") return mod[key];
    }
    // otherwise first function prop
    for (const k of Object.keys(mod)) {
      if (typeof mod[k] === "function") return mod[k];
    }
  }
  throw new TypeError(`${name} is not a function export`);
}

// Per-route registrars (loaded via safe unwrap)
const registerVolunteerProfileRoutes = asFn(require("./profile"), "profile");
const registerVolunteerProfilePictureRoutes = asFn(
  require("./profilePicture"),
  "profilePicture"
);
const registerVolunteerInfoRoutes = asFn(require("./info"), "info");
const registerVolunteerAvailabilitiesRoutes = asFn(
  require("./availabilities"),
  "availabilities"
);
const registerVolunteerVillagesCoveredRoutes = asFn(
  require("./villagesCovered"),
  "villagesCovered"
);
const registerVolunteersListRoutes = asFn(
  require("./volunteersList"),
  "volunteersList"
);
const registerVolunteerReservationsRoutes = asFn(
  require("./volunteerReservations"),
  "volunteerReservations"
);
const registerReservationsUpdateRoutes = asFn(
  require("./reservationsUpdate"),
  "reservationsUpdate"
);
const registerVolunteerDocumentsRoutes = asFn(
  require("./documents"),
  "documents"
);
const registerVolunteerStatusRoutes = asFn(
  require("./volunteerStatus"),
  "volunteerStatus"
);
const registerVolunteerHolidayModeRoutes = asFn(
  require("./holidayMode"),
  "holidayMode"
);
const registerSubscriptionCheckoutRoutes = asFn(
  require("./subscriptionCheckout"),
  "subscriptionCheckout"
);
const registerSubscriptionStatusRoutes = asFn(
  require("./subscriptionStatus"),
  "subscriptionStatus"
);
const registerVolunteerDocumentsStatusRoutes = asFn(
  require("./documentsStatus"),
  "documentsStatus"
);
const registerSubscriptionConfirmRoutes = asFn(
  require("./subscriptionConfirm"),
  "subscriptionConfirm"
);
const registerSubscriptionSyncRoutes = asFn(
  require("./subscriptionSync"),
  "subscriptionSync"
);

module.exports = (
  pool,
  authenticate,
  authorizeVolunteer,
  isValidTime,
  moment,
  connectedClients,
  WebSocket
) => {
  const deps = {
    router,
    pool,
    authenticate,
    authorizeVolunteer,
    isValidTime,
    moment,
    connectedClients,
    WebSocket,
  };

  registerVolunteerProfileRoutes(deps);
  registerVolunteerProfilePictureRoutes(deps);
  registerVolunteerInfoRoutes(deps);
  registerVolunteerAvailabilitiesRoutes(deps);
  registerVolunteerVillagesCoveredRoutes(deps);
  registerVolunteersListRoutes(deps);
  registerVolunteerReservationsRoutes(deps);
  registerReservationsUpdateRoutes(deps);
  registerVolunteerDocumentsRoutes(deps);
  registerVolunteerStatusRoutes(deps);
  registerVolunteerHolidayModeRoutes(deps);
  registerSubscriptionCheckoutRoutes(deps);
  registerSubscriptionStatusRoutes(deps);
  registerVolunteerDocumentsStatusRoutes(deps);
  registerSubscriptionConfirmRoutes(deps);
  registerSubscriptionSyncRoutes(deps);

  return router;
};