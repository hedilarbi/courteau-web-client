import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import ConnexionPage from "../page";
import { sendSmsVerification } from "@/services/Verify";

// Seuls le serveur, le routeur et Cloudflare sont remplacés. Le faux widget garde son
// callback pour que le test décide quand la vérification Cloudflare se termine.
jest.mock("@/services/Verify", () => ({ sendSmsVerification: jest.fn() }));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

const mockTurnstile = { onToken: null, onError: null };
jest.mock("@/components/TurnstileWidget", () =>
  function MockTurnstileWidget({ onToken, onError }) {
    mockTurnstile.onToken = onToken;
    mockTurnstile.onError = onError;
    return null;
  },
);

const typePhone = (value) => {
  const input = document.querySelector("input");
  fireEvent.change(input, { target: { value } });
};
const submitButton = () => screen.getByRole("button", { name: /Se connecter|Vérification de sécurité/ });

beforeEach(() => {
  jest.clearAllMocks();
  sendSmsVerification.mockResolvedValue({ success: true });
});

// Régression : un clic avant la fin de la vérification affichait « Vérification de sécurité en
// cours » et le client devait recliquer.
test("un clic avant la fin de la vérification attend le jeton puis envoie le code, sans recliquer", async () => {
  render(<ConnexionPage />);
  typePhone("514 555-1234");

  fireEvent.click(submitButton());
  expect(await screen.findByRole("button", { name: "Vérification de sécurité…" })).toBeDisabled();
  expect(sendSmsVerification).not.toHaveBeenCalled();

  act(() => mockTurnstile.onToken("jeton-cloudflare"));

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/otp?phoneNumber=%2B15145551234"));
  expect(sendSmsVerification).toHaveBeenCalledTimes(1);
  expect(sendSmsVerification).toHaveBeenCalledWith("+15145551234", "jeton-cloudflare");
  expect(screen.queryByText(/Vérification de sécurité en cours/)).not.toBeInTheDocument();
});

test("vérification déjà terminée : le code part au premier clic", async () => {
  render(<ConnexionPage />);
  act(() => mockTurnstile.onToken("jeton-cloudflare"));
  typePhone("5145551234");

  fireEvent.click(submitButton());

  await waitFor(() => expect(mockPush).toHaveBeenCalled());
  expect(sendSmsVerification).toHaveBeenCalledWith("+15145551234", "jeton-cloudflare");
});

test("échec de la vérification Cloudflare : message clair, aucun code envoyé", async () => {
  render(<ConnexionPage />);
  typePhone("5145551234");

  fireEvent.click(submitButton());
  act(() => mockTurnstile.onError());

  expect(await screen.findByText(/Vérification de sécurité impossible/)).toBeInTheDocument();
  expect(sendSmsVerification).not.toHaveBeenCalled();
  expect(submitButton()).toBeEnabled();
});

// Régression : un numéro vide appelait setNativeProps (React Native) et affichait une erreur générique.
test("numéro vide : message dédié, sans attendre Cloudflare", async () => {
  render(<ConnexionPage />);

  fireEvent.click(submitButton());

  expect(await screen.findByText("Entrez votre numéro de téléphone.")).toBeInTheDocument();
  expect(sendSmsVerification).not.toHaveBeenCalled();
});

test("refus du serveur : son message s'affiche et le client reste sur la page", async () => {
  sendSmsVerification.mockResolvedValueOnce({ success: false, message: "Trop de demandes." });
  render(<ConnexionPage />);
  act(() => mockTurnstile.onToken("jeton-cloudflare"));
  typePhone("5145551234");

  fireEvent.click(submitButton());

  expect(await screen.findByText("Trop de demandes.")).toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();
});
