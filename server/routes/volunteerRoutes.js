
const buildVolunteerRouter = require("./volunteer");

module.exports = function (
  pool,
  authenticate,
  authorizeVolunteer,
  isValidTime,
  moment,
  connectedClients,
  WebSocket
) {
  return buildVolunteerRouter(
    pool,
    authenticate,
    authorizeVolunteer,
    isValidTime,
    moment,
    connectedClients,
    WebSocket
  );
};