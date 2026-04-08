import { google } from "googleapis";
import { getGmailOAuthCredentials } from "./config.ts";

export function createGmailClient() {
  const { clientId, clientSecret, refreshToken } = getGmailOAuthCredentials();
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}
