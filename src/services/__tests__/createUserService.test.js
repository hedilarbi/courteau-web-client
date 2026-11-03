import axios from "axios";

import { createUserService } from "@/services/UserServices";

jest.mock("axios", () => ({ post: jest.fn(), defaults: {} }));
// Action serveur Next (cookies) : sans objet pour /users/create, qui n'est pas authentifiée.
jest.mock("@/app/actions", () => ({ getToken: jest.fn() }));

const PHONE = "+15145551234";
const PROOF = "phone-verification-proof";

beforeEach(() => jest.clearAllMocks());

test("transmet le numéro et la preuve SMS, et renvoie la session", async () => {
  const session = { token: "session-token", user: { _id: "u1" } };
  axios.post.mockResolvedValueOnce({ status: 200, data: session });

  const result = await createUserService(PHONE, PROOF);

  expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/users\/create$/), {
    phone_number: PHONE,
    phoneVerificationToken: PROOF,
  });
  expect(result).toEqual({ status: true, message: "user data", data: session });
});

test("un refus du serveur renvoie son code et son message", async () => {
  const message = "Ce code a déjà été utilisé. Demandez un nouveau code.";
  axios.post.mockRejectedValueOnce({
    message: "Request failed with status code 401",
    response: { status: 401, data: { success: false, error: "PHONE_VERIFICATION_USED", message } },
  });

  const result = await createUserService(PHONE, PROOF);

  expect(result).toEqual({ status: false, error: "PHONE_VERIFICATION_USED", message });
});

test("sans réponse du serveur, l'erreur est NETWORK_ERROR sans message technique", async () => {
  axios.post.mockRejectedValueOnce(new Error("timeout of 15000ms exceeded"));

  const result = await createUserService(PHONE, PROOF);

  expect(result).toEqual({ status: false, error: "NETWORK_ERROR", message: null });
});
