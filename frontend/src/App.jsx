import { useEffect, useState } from "react";
import StatusCard from "./components/StatusCard";
import {
  checkApiHealth,
  completePickupRequest,
  completeDistributionRequest,
  createOffering,
  getAvailableOfferings,
  getDistributableOfferings,
  getPendingDistributionRequests,
  getPendingPickupRequests,
  requestDistribution,
  requestPickup,
} from "./services/api";
import "./styles.css";

function App() {
  const [connected, setConnected] = useState(false);
  const [offerings, setOfferings] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [distributionRequests, setDistributionRequests] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      checkApiHealth(),
      getAvailableOfferings(),
      getDistributableOfferings(),
      getPendingPickupRequests(),
      getPendingDistributionRequests(),
    ])
      .then(([, availableOfferings, availableDistributions, pendingRequests, pendingDistributionRequests]) => {
        setConnected(true);
        setOfferings(availableOfferings);
        setDistributions(availableDistributions);
        setPickupRequests(pendingRequests);
        setDistributionRequests(pendingDistributionRequests);
      })
      .catch(() => setConnected(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Publication en cours...");
    try {
      const availableUntil = new Date(event.target.availableUntil.value);
      if (Number.isNaN(availableUntil.getTime())) {
        throw new Error("Choisissez une date limite valide");
      }

      await createOffering({
        hotelId: Number(event.target.hotelId.value),
        productName: event.target.productName.value,
        quantity: Number(event.target.quantity.value),
        unit: event.target.unit.value,
        availableUntil: availableUntil.toISOString().slice(0, 19).replace("T", " "),
        description: event.target.description.value,
      });
      const availableOfferings = await getAvailableOfferings();
      setOfferings(availableOfferings);
      event.target.reset();
      setMessage("Denrée publiée. Elle est visible par les associations.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRequest(offering) {
    const associationId = Number(window.prompt("Identifiant de votre association"));
    if (!Number.isInteger(associationId)) return;
    try {
      await requestPickup({ offeringId: offering.id, associationId });
      setOfferings((current) => current.filter((item) => item.id !== offering.id));
      const pendingRequests = await getPendingPickupRequests();
      setPickupRequests(pendingRequests);
      setMessage("Demande envoyée à l'hôtel.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCompletePickup(requestId) {
    try {
      await completePickupRequest(requestId);
      setPickupRequests((current) => current.filter((request) => request.id !== requestId));
      const availableDistributions = await getDistributableOfferings();
      setDistributions(availableDistributions);
      setMessage("Demande validée par l'hôtel. La denrée est proposée aux particuliers.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDistributionRequest(offeringId) {
    const individualName = window.prompt("Votre nom");
    const contact = window.prompt("Votre email ou téléphone");
    if (!individualName || !contact) return;
    try {
      await requestDistribution({ offeringId, individualName, contact });
      setDistributions((current) => current.filter((offering) => offering.id !== offeringId));
      const pendingRequests = await getPendingDistributionRequests();
      setDistributionRequests(pendingRequests);
      setMessage("Votre demande de distribution a été envoyée à l'association.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCompleteDistribution(requestId) {
    if (!window.confirm("Confirmer que le particulier a bien récupéré cette denrée ?")) return;
    try {
      await completeDistributionRequest(requestId);
      setDistributionRequests((current) => current.filter((request) => request.id !== requestId));
      setMessage("Retrait confirmé. Merci d'avoir évité le gaspillage alimentaire.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="app-shell">
      <div className="hero">
        <p className="eyebrow">Anti-gaspillage alimentaire</p>
        <h1>Ensemble, donnons une seconde vie aux invendus.</h1>
        <p className="intro">
          Une plateforme qui connecte hôtels, associations et particuliers.
        </p>
        <StatusCard connected={connected} />
        <section className="feature-grid">
          <form className="status-card" onSubmit={handleSubmit}>
            <p className="eyebrow">Hôtel</p>
            <h2>Signaler des denrées</h2>
            <input name="hotelId" type="number" placeholder="Identifiant hôtel" required />
            <input name="productName" placeholder="Ex. plats préparés" required />
            <input name="quantity" type="number" min="0.01" step="0.01" placeholder="Quantité" required />
            <input name="unit" placeholder="Unité (kg, portions...)" required />
            <input name="availableUntil" type="datetime-local" required />
            <textarea name="description" placeholder="Précisions (facultatif)" />
            <button type="submit">Publier la disponibilité</button>
            {message && <p>{message}</p>}
          </form>
          <section className="status-card">
            <p className="eyebrow">Association</p>
            <h2>Denrées disponibles</h2>
            {offerings.length === 0 ? <p>Aucune denrée disponible pour le moment.</p> : offerings.map((offering) => (
              <article key={offering.id}>
                <h3>{offering.productName}</h3>
                <p>{offering.quantity} {offering.unit} · {offering.hotelName}</p>
                <button type="button" onClick={() => handleRequest(offering)}>Demander la récupération</button>
              </article>
            ))}
          </section>
          <section className="status-card">
            <p className="eyebrow">Association</p>
            <h2>Retraits à valider</h2>
            <p>Validez ici la remise de la denrée au particulier.</p>
            {distributionRequests.length === 0 ? <p>Aucun retrait en attente.</p> : distributionRequests.map((request) => (
              <article key={request.id}>
                <h3>{request.productName}</h3>
                <p>{request.quantity} {request.unit} · Association : {request.associationName}</p>
                <p><strong>Particulier :</strong> {request.individualName}</p>
                <p><strong>Contact :</strong> {request.contact}</p>
                <p className="request-reference">Retrait #{request.id}</p>
                <button type="button" onClick={() => handleCompleteDistribution(request.id)}>
                  Valider la remise au particulier
                </button>
              </article>
            ))}
          </section>
          <section className="status-card">
            <p className="eyebrow">Hôtel</p>
            <h2>Demandes de récupération à valider</h2>
            <p>Validez les demandes envoyées par les associations pour vos denrées.</p>
            {pickupRequests.length === 0 ? <p>Aucune demande en attente.</p> : pickupRequests.map((request) => (
              <article key={request.id}>
                <h3>{request.productName}</h3>
                <p>{request.quantity} {request.unit} · Hôtel : {request.hotelName}</p>
                <p><strong>Association :</strong> {request.associationName}</p>
                <p className="request-reference">Demande #{request.id}</p>
                <button type="button" onClick={() => handleCompletePickup(request.id)}>
                  Valider la demande de récupération
                </button>
              </article>
            ))}
          </section>
          <section className="status-card">
            <p className="eyebrow">Particulier</p>
            <h2>Distributions proposées</h2>
            {distributions.length === 0 ? <p>Aucune distribution disponible pour le moment.</p> : distributions.map((offering) => (
              <article key={offering.id}>
                <h3>{offering.productName}</h3>
                <p>{offering.quantity} {offering.unit} · {offering.associationName}</p>
                <button type="button" onClick={() => handleDistributionRequest(offering.id)}>
                  Demander cette denrée
                </button>
              </article>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

export default App;
