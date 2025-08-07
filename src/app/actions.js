"use server";

import { cookies } from "next/headers";

export async function create(data) {
  const cookieStore = await cookies();
  cookieStore.set("token", data);
}

export async function getToken() {
  return cookies().get("token");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}
