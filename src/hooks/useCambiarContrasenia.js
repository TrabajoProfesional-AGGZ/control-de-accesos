import { useState } from 'react';
import { changePassword } from '../utils/authService';
import { validarFortalezaPassword } from '../utils/formValidators';

/** Maneja el formulario de cambio de contraseña; al terminar, cierra la sesión. */
export function useCambiarContrasenia(cerrarSesion) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errorFortaleza = validarFortalezaPassword(nueva);
    if (errorFortaleza) {
      setError(errorFortaleza);
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await changePassword(actual, nueva);
      await cerrarSesion(); // fuerza a reloguear con la contraseña nueva
    } catch {
      setError('Contraseña actual incorrecta o error al cambiar la contraseña');
      setLoading(false);
    }
  }

  return { actual, setActual, nueva, setNueva, confirmar, setConfirmar, error, loading, handleSubmit };
}
