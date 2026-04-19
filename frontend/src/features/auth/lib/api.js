import { login as apiLogin, register as apiRegister } from "../../../shared/api/axios";

/**
 * Perform login and return the response.
 * Stores token in localStorage via the shared api interceptor.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token: string, token_type: string}>}
 */
export async function login(email, password) {
  return apiLogin(email, password);
}

/**
 * Perform registration.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{id: number, email: string}>}
 */
export async function register(email, password) {
  return apiRegister(email, password);
}
