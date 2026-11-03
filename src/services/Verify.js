// Envoi et vérification des codes SMS par le serveur lecourteau (qui seul parle à Twilio).
// Appel direct depuis le navigateur : le serveur doit voir l'IP du client pour ses limites.
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const NETWORK_ERROR = {
  success: false,
  error: "NETWORK_ERROR",
  message: "Une erreur s'est produite. Veuillez réessayer.",
};

const post = async (path, body, headers = {}) => {
  try {
    const response = await fetch(`${API_URL}/auth/otp/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    return json && typeof json.success === "boolean" ? json : NETWORK_ERROR;
  } catch (error) {
    return NETWORK_ERROR;
  }
};

// Renvoie { success, error, message, retryAfterSeconds }.
const sendSmsVerification = (phoneNumber, turnstileToken) =>
  post(
    "start",
    { phone: phoneNumber },
    { "X-Turnstile-Token": turnstileToken || "" }
  );

// Renvoie { success, error, message, phoneVerificationToken } ; success seulement si Twilio a
// validé le code. phoneVerificationToken est à transmettre à /users/create.
const checkVerification = (phoneNumber, code) =>
  post("check", { phone: phoneNumber, code });

module.exports = {
  sendSmsVerification,
  checkVerification,
};
