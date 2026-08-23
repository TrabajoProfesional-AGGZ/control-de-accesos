import {
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

/** Login por Firebase con email + contraseña. */
export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
}

/** Envía el mail de restablecimiento de contraseña de Firebase. */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/** Cierra la sesión de Firebase del usuario actual. */
export async function logout() {
  await signOut(auth);
}

/** Reautentica con la contraseña actual y actualiza a la nueva. */
export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
