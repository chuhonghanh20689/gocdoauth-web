import fs from "node:fs/promises";
import path from "node:path";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  "scripts",
  "google-credentials.json"
);

const TOKEN_PATH = path.join(
  process.cwd(),
  "scripts",
  "google-token.json"
);

function getOAuthClientConfig(raw: any) {
  const config = raw.installed ?? raw.web ?? raw;
  if (!config.client_id || !config.client_secret) {
    throw new Error(
      "google-credentials.json không có client_id/client_secret hợp lệ."
    );
  }
  return config;
}

async function readToken() {
  try {
    const text = await fs.readFile(TOKEN_PATH, "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function saveToken(credentials: any, clientConfig: any) {
  const old = (await readToken()) ?? {};
  const merged = {
    type: "authorized_user",
    client_id: clientConfig.client_id,
    client_secret: clientConfig.client_secret,
    ...old,
    ...credentials,
    // Preserve refresh_token because Google often omits it on refresh.
    refresh_token: credentials.refresh_token ?? old.refresh_token,
    scope: credentials.scope ?? old.scope ?? SCOPES.join(" "),
    token_type: credentials.token_type ?? old.token_type ?? "Bearer",
  };

  await fs.writeFile(TOKEN_PATH, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

export async function getGoogleClients() {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Thiếu GOOGLE_API_KEY trong .env.local. Hãy thêm API key vừa tạo trong Google Cloud."
    );
  }

  const raw = JSON.parse(await fs.readFile(CREDENTIALS_PATH, "utf8"));
  const clientConfig = getOAuthClientConfig(raw);
  const saved = await readToken();

  let auth: any;

  if (saved?.refresh_token) {
    console.log("✓ Tìm thấy google-token.json — dùng refresh token đã lưu.");

    auth = new google.auth.OAuth2(
      clientConfig.client_id,
      clientConfig.client_secret,
      clientConfig.redirect_uris?.[0]
    );

    auth.setCredentials({
      access_token: saved.access_token,
      refresh_token: saved.refresh_token,
      scope: saved.scope,
      token_type: saved.token_type ?? "Bearer",
      expiry_date: saved.expiry_date,
    });
  } else {
    console.log("→ Chưa có google-token.json — mở Google OAuth lần đầu...");

    auth = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });

    await saveToken(auth.credentials, clientConfig);
  }

  // Make the OAuth project explicit as the quota/consumer project.
  // This is important for APIs that reject requests as "unregistered callers"
  // when the consumer project is not established automatically.
  if (clientConfig.project_id) {
    auth.quotaProjectId = clientConfig.project_id;
  }

  // Force google-auth-library to obtain/refresh an access token now.
  // If this fails, the problem is OAuth/token configuration, not Sheets data.
  const access = await auth.getAccessToken();
  if (!access.token) {
    throw new Error(
      "Google OAuth không tạo được access_token. Hãy xóa scripts/google-token.json và đăng nhập lại."
    );
  }

  // Save the current access token/expiry after refresh.
  await saveToken(auth.credentials, clientConfig);

  console.log("✓ Google OAuth OK — access_token đã sẵn sàng.");
  console.log(
    `✓ Scope: ${auth.credentials.scope ?? SCOPES.join(" ")}`
  );

  return {
    sheets: google.sheets({ version: "v4", auth, key: apiKey }),
    drive: google.drive({ version: "v3", auth, key: apiKey }),
  };
}
