import './WelcomeCard.css';

/** Banner de bienvenida de la home: fecha, saludo y legajo del empleado. */
export function WelcomeCard({ empleado }) {
  const fechaFormateada = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="welcome-card">
      <div className="welcome-card-texture" aria-hidden="true" />
      <div className="welcome-card-top">
        <p className="welcome-card-fecha">{fechaFormateada}</p>
      </div>
      <h1 className="welcome-card-saludo">Bienvenido, {empleado.nombre} {empleado.apellido}</h1>
      <p className="welcome-card-membresia">Legajo {empleado.legajo}</p>
    </section>
  );
}
