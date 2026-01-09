// =============================================================================
// OAUTH ROUTES INDEX
// =============================================================================

import { Hono } from "hono";
import { gmailOAuth } from "./gmail";
import { outlookOAuth } from "./outlook";

const oauthRoutes = new Hono();

// Mount provider-specific OAuth routes
oauthRoutes.route("/gmail", gmailOAuth);
oauthRoutes.route("/outlook", outlookOAuth);

export { oauthRoutes };
