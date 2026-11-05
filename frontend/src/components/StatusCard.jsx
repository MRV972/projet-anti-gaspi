function StatusCard({ connected }) {
  return (
    <section className="status-card" aria-live="polite">
      <p className="eyebrow">État de la plateforme</p>
      <h2>{connected ? "Les services sont opérationnels" : "Connexion en cours"}</h2>
      <p>
        {connected
          ? "L'architecture anti-gaspillage est prête pour les prochaines fonctionnalités."
          : "Vérification de la connexion avec le backend..."}
      </p>
    </section>
  );
}

export default StatusCard;
