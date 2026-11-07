import { useEffect, useState } from "react";
import {
  completeDistributionRequest, completePickupRequest, createOffering,
  getAvailableOfferings, getDistributableOfferings, getPendingDistributionRequests,
  getPendingPickupRequests, getCurrentUser, loginAccount, logoutAccount, registerAccount,
  requestDistribution, requestPickup,
} from "./services/api";
import "./styles.css";

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("hotel");
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const account = Object.fromEntries(form.entries());
    account.entityId = account.entityId ? Number(account.entityId) : undefined;
    try {
      const currentUser = mode === "login" ? await loginAccount(account) : await registerAccount({ ...account, role });
      onAuthenticated(currentUser);
    } catch (error) { setMessage(error.message); }
  }
  return <main className="auth-shell"><section className="auth-panel"><p className="eyebrow">ANTI-GASPI / ESPACE SÉCURISÉ</p><h1>Chaque surplus trouve son chemin.</h1><p className="intro">Connectez-vous à l'espace qui correspond à votre rôle.</p><div className="switcher"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Connexion</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Créer un compte</button></div><form onSubmit={submit} className="auth-form">{mode === "register" && <><label>Profil<select value={role} onChange={(event) => setRole(event.target.value)}><option value="hotel">Hôtel</option><option value="association">Association</option><option value="individual">Particulier</option></select></label><label>Nom affiché<input name="displayName" required placeholder="Votre nom ou établissement" /></label>{role !== "individual" && <label>Identifiant métier<input name="entityId" type="number" required placeholder="ID fourni par l'administrateur" /></label>}</>}<label>Email<input name="email" type="email" required placeholder="vous@exemple.fr" /></label><label>Mot de passe<input name="password" type="password" minLength="8" required placeholder="8 caractères minimum" /></label><button className="primary" type="submit">{mode === "login" ? "Ouvrir mon espace" : "Créer mon espace"}</button>{message && <p className="form-message">{message}</p>}</form></section></main>;
}

function List({ title, items, empty, render, action, actionLabel }) {
  return <section className="panel"><p className="eyebrow">TABLEAU DE BORD</p><h2>{title}</h2>{items.length === 0 ? <p className="muted">{empty}</p> : items.map((item) => <article key={item.id}>{render(item)}<button onClick={() => action(item)}>{actionLabel}</button></article>)}</section>;
}

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ offerings: [], distributions: [], pickups: [], requests: [] });
  const [message, setMessage] = useState("");
  useEffect(() => { if (localStorage.getItem("anti-gaspi-token")) getCurrentUser().then(setUser).catch(() => localStorage.removeItem("anti-gaspi-token")); }, []);
  async function refresh() {
    const result = { ...data };
    if (user.role === "hotel") result.pickups = await getPendingPickupRequests();
    if (user.role === "association") { result.offerings = await getAvailableOfferings(); result.requests = await getPendingDistributionRequests(); }
    if (user.role === "individual") result.distributions = await getDistributableOfferings();
    setData(result);
  }
  useEffect(() => { if (user) refresh().catch((error) => setMessage(error.message)); }, [user]);
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  async function action(callback, success) { try { await callback(); await refresh(); setMessage(success); } catch (error) { setMessage(error.message); } }
  async function publish(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const availableUntil = new Date(form.availableUntil.value);
    await action(() => createOffering({ productName: form.productName.value, quantity: Number(form.quantity.value), unit: form.unit.value, availableUntil: availableUntil.toISOString().slice(0, 19).replace("T", " "), description: form.description.value }), "Denrée publiée.");
    form.reset();
  }
  const title = user.role === "hotel" ? "Le comptoir des surplus" : user.role === "association" ? "La collecte solidaire" : "Les distributions près de vous";
  return <main className="app-shell"><header className="topbar"><div><p className="eyebrow">ESPACE {user.role.toUpperCase()}</p><h1>{title}</h1></div><button className="logout" onClick={() => logoutAccount().then(() => setUser(null))}>Se déconnecter</button></header><p className="welcome">Bonjour {user.displayName}. Voici votre activité du jour.</p>{message && <p className="notice">{message}</p>}<section className="dashboard-grid">{user.role === "hotel" && <><form className="panel accent-lime" onSubmit={publish}><p className="eyebrow">NOUVELLE ANNONCE</p><h2>Signaler des invendus</h2><input name="productName" required placeholder="Nom du produit" /><input name="quantity" type="number" min="0.01" step="0.01" required placeholder="Quantité" /><input name="unit" required placeholder="Unité : portions, kg..." /><input name="availableUntil" type="datetime-local" required /><textarea name="description" placeholder="Consignes de retrait (facultatif)" /><button className="primary" type="submit">Publier la disponibilité</button></form><List title="Demandes à valider" items={data.pickups} empty="Aucune demande en attente." action={(item) => action(() => completePickupRequest(item.id), "Récupération confirmée.")} actionLabel="Confirmer la récupération" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.associationName}</p></>} /></>}{user.role === "association" && <><List title="Denrées disponibles" items={data.offerings} empty="Aucune denrée disponible." action={(item) => action(() => requestPickup({ offeringId: item.id }), "Demande envoyée à l'hôtel.")} actionLabel="Demander la récupération" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.hotelName}</p></>} /><List title="Retraits à valider" items={data.requests} empty="Aucun retrait en attente." action={(item) => action(() => completeDistributionRequest(item.id), "Remise confirmée.")} actionLabel="Valider la remise" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.individualName}</p><p>{item.contact}</p></>} /></>}{user.role === "individual" && <List title="Distributions proposées" items={data.distributions} empty="Aucune distribution disponible." action={(item) => action(() => requestDistribution({ offeringId: item.id, contact: user.email }), "Demande envoyée à l'association.")} actionLabel="Demander cette denrée" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.associationName}</p></>} />}</section></main>;
}

export default App;