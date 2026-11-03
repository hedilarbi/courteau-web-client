import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import OtpContent from "@/components/OtpContent";
import { checkVerification, sendSmsVerification } from "@/services/Verify";
import { createUserService } from "@/services/UserServices";
import { create } from "@/app/actions";

// Seuls le serveur (services, action de session), le routeur, Turnstile et la saisie OTP
// tierce sont remplacés : la logique du composant est exécutée telle quelle.
jest.mock("@/services/Verify", () => ({
  checkVerification: jest.fn(),
  sendSmsVerification: jest.fn(),
}));
jest.mock("@/services/UserServices", () => ({ createUserService: jest.fn() }));
jest.mock("@/app/actions", () => ({ create: jest.fn() }));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));

const mockCreateUser = jest.fn();
jest.mock("@/context/UserContext", () => ({ useUser: () => ({ createUser: mockCreateUser }) }));

jest.mock("@/components/TurnstileWidget", () => {
  const { useEffect } = jest.requireActual("react");
  return function MockTurnstileWidget({ onToken, resetKey }) {
    useEffect(() => onToken(`turnstile-${resetKey}`), [onToken, resetKey]);
    return null;
  };
});

jest.mock("react-otp-input", () =>
  function MockOtpInput({ value, onChange }) {
    return (
      <input aria-label="Code de vérification" value={value} onChange={(e) => onChange(e.target.value)} />
    );
  },
);

const PHONE = "+15145551234";
const PROOF = "phone-verification-proof";
const SESSION = {
  status: true,
  data: { token: "session-token", user: { is_profile_setup: true } },
};
const NETWORK_FAILURE = { status: false, error: "NETWORK_ERROR", message: null };
const LOGIN_FAILED = "Connexion impossible pour le moment. Réessayez.";
const INVALID_CODE = "Le code de vérification est invalide. Veuillez réessayer.";

const typeCode = (code) =>
  fireEvent.change(screen.getByLabelText("Code de vérification"), { target: { value: code } });
const verifyButton = () => screen.getByRole("button", { name: /Vérifi/ });
const pressVerify = async () => {
  fireEvent.click(verifyButton());
  await waitFor(() => expect(verifyButton()).toHaveTextContent("Vérifier"));
};

beforeEach(() => {
  jest.clearAllMocks();
  checkVerification.mockResolvedValue({ success: true, phoneVerificationToken: PROOF });
  createUserService.mockResolvedValue(SESSION);
});

test("le bouton Vérifier reste désactivé tant que le code n'a pas 6 chiffres", () => {
  render(<OtpContent phoneNumber={PHONE} />);
  typeCode("12345");

  expect(verifyButton()).toBeDisabled();
  fireEvent.click(verifyButton());
  expect(checkVerification).not.toHaveBeenCalled();

  typeCode("123456");
  expect(verifyButton()).toBeEnabled();
});

test("un code valide ouvre la session avec la preuve SMS et redirige", async () => {
  render(<OtpContent phoneNumber={PHONE} />);
  typeCode("123456");
  await pressVerify();

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  expect(checkVerification).toHaveBeenCalledWith(PHONE, "123456");
  expect(createUserService).toHaveBeenCalledWith(PHONE, PROOF);
  expect(create).toHaveBeenCalledWith("session-token");
  expect(mockCreateUser).toHaveBeenCalledWith(SESSION.data.user);
});

test("un nouveau compte est envoyé vers la complétion du profil", async () => {
  createUserService.mockResolvedValueOnce({
    status: true,
    data: { token: "session-token", user: { is_profile_setup: false } },
  });
  render(<OtpContent phoneNumber={PHONE} />);
  typeCode("123456");
  await pressVerify();

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/completer-profil"));
});

test("un code incorrect affiche l'erreur, qui disparaît au nouvel essai", async () => {
  checkVerification.mockResolvedValueOnce({ success: false, error: "OTP_INVALID", message: "Code invalide." });
  render(<OtpContent phoneNumber={PHONE} />);
  typeCode("000000");
  await pressVerify();

  expect(screen.getByText(INVALID_CODE)).toBeInTheDocument();
  expect(createUserService).not.toHaveBeenCalled();

  typeCode("123456");
  await pressVerify();
  await waitFor(() => expect(mockPush).toHaveBeenCalled());
  expect(screen.queryByText(INVALID_CODE)).not.toBeInTheDocument();
});

test("régression : après un échec réseau, le nouvel essai réutilise la preuve sans revérifier le code", async () => {
  createUserService.mockResolvedValueOnce(NETWORK_FAILURE);
  render(<OtpContent phoneNumber={PHONE} />);
  typeCode("123456");
  await pressVerify();

  expect(screen.getByText(LOGIN_FAILED)).toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();

  await pressVerify();
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  expect(checkVerification).toHaveBeenCalledTimes(1);
  expect(createUserService).toHaveBeenNthCalledWith(2, PHONE, PROOF);
  expect(screen.queryByText(LOGIN_FAILED)).not.toBeInTheDocument();
});

test("une preuve refusée par le serveur affiche son message et le code est revérifié au nouvel essai", async () => {
  const usedMessage = "Ce code a déjà été utilisé. Demandez un nouveau code.";
  createUserService.mockResolvedValueOnce({ status: false, error: "PHONE_VERIFICATION_USED", message: usedMessage });
  render(<OtpContent phoneNumber={PHONE} />);
  typeCode("123456");
  await pressVerify();

  expect(screen.getByText(usedMessage)).toBeInTheDocument();

  await pressVerify();
  expect(checkVerification).toHaveBeenCalledTimes(2);
});

test("une erreur de vérification autre qu'un code incorrect affiche le message du serveur", async () => {
  const tooManyAttempts = "Trop de tentatives. Demandez un nouveau code.";
  checkVerification.mockResolvedValueOnce({ success: false, error: "TOO_MANY_ATTEMPTS", message: tooManyAttempts });
  render(<OtpContent phoneNumber={PHONE} />);
  typeCode("123456");
  await pressVerify();

  expect(screen.getByText(tooManyAttempts)).toBeInTheDocument();
  expect(createUserService).not.toHaveBeenCalled();
});

test("le renvoi du code passe le jeton Turnstile et affiche le résultat", async () => {
  sendSmsVerification.mockResolvedValueOnce({ success: true });
  render(<OtpContent phoneNumber={PHONE} />);
  fireEvent.click(screen.getByRole("button", { name: "Renvoyer le code" }));

  expect(await screen.findByText("Le code a été renvoyé avec succès.")).toBeInTheDocument();
  expect(sendSmsVerification).toHaveBeenCalledWith(PHONE, "turnstile-0");
});

test("un renvoi refusé affiche le message du serveur", async () => {
  sendSmsVerification.mockResolvedValueOnce({ success: false, message: "Trop de demandes." });
  render(<OtpContent phoneNumber={PHONE} />);
  fireEvent.click(screen.getByRole("button", { name: "Renvoyer le code" }));

  expect(await screen.findByText("Trop de demandes.")).toBeInTheDocument();
});
