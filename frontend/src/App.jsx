import { useEffect, useState } from "react";
import {
  completeDistributionRequest, completePickupRequest, createOffering,
  getAssociationStock, getAvailableOfferings, getDistributableOfferings, getPendingDistributionRequests,
  getPendingPickupRequests, getCurrentUser, getAdminEntities, createInvitation, createAdminEntity,
  getAdminAccounts, deleteAdminAccount, createPasswordResetKey, loginAccount, logoutAccount,
  registerAccount, resetAccountPassword,
  requestDistribution, requestPickup,
} from "./services/api";
import "./styles.css";

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("hotel");
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    const account = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (mode === "reset") {
        await resetAccountPassword(account);
        setMessage("Mot de passe réinitialisé. Vous pouvez vous connecter.");
        setMode("login");
      } else {
        const currentUser = mode === "login" ? await loginAccount(account) : await registerAccount({ ...account, role });
        onAuthenticated(currentUser);
      }
    } catch (error) { setMessage(error.message); }
  }
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">ANTI-GASPI / ESPACE SÉCURISÉ</p>
        <h1>Chaque surplus trouve son chemin.</h1>
        <p className="intro">Connectez-vous à l'espace qui correspond à votre rôle.</p>
        <div className="switcher">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Connexion</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Créer un compte</button>
          <button type="button" className={mode === "reset" ? "active" : ""} onClick={() => setMode("reset")}>Réinitialiser</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <>
              <label>Profil<select value={role} onChange={(event) => setRole(event.target.value)}><option value="hotel">Hôtel</option><option value="association">Association</option><option value="individual">Particulier</option></select></label>
              {role === "individual" && <label>Nom affiché<input name="displayName" required placeholder="Votre nom" /></label>}
              <label>Clé d'invitation<input name="invitationKey" required placeholder="Fournie par l'administrateur" /></label>
            </>
          )}
          {mode === "reset" && <label>Clé de réinitialisation<input name="resetKey" required placeholder="Fournie par l'administrateur" /></label>}
          <label>Email<input name="email" type="email" required placeholder="vous@exemple.fr" /></label>
          <label>Mot de passe<input name="password" type="password" minLength="8" required placeholder="8 caractères minimum" /></label>
          <button className="primary" type="submit">{mode === "login" ? "Ouvrir mon espace" : mode === "register" ? "Créer mon espace" : "Changer le mot de passe"}</button>
          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

function AdminScreen({ user, onLogout }) {
  const [role, setRole] = useState("association");
  const [entityId, setEntityId] = useState("");
  const [entities, setEntities] = useState({ hotels: [], associations: [] });
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [entityType, setEntityType] = useState("association");
  const [entityName, setEntityName] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [resetAccountEmail, setResetAccountEmail] = useState("");
  async function refreshAdmin() {
    const [entityResult, accountResult] = await Promise.all([getAdminEntities(), getAdminAccounts()]);
    setEntities(entityResult);
    setAccounts(accountResult);
  }
  useEffect(() => { refreshAdmin().catch((error) => setMessage(error.message)); }, []);
  async function submit(event) {
    event.preventDefault();
    try {
      const result = await createInvitation({ role, entityId: role === "individual" ? null : Number(entityId) });
      setKey(result.key);
      setMessage("Clé créée. Copiez-la et transmettez-la au titulaire du compte.");
    } catch (error) { setMessage(error.message); }
  }
  async function addEntity(event) {
    event.preventDefault();
    try {
      await createAdminEntity({ type: entityType, name: entityName });
      setEntityName("");
      await refreshAdmin();
      setMessage("Établissement créé.");
    } catch (error) { setMessage(error.message); }
  }
  async function removeAccount(accountId) {
    if (!window.confirm("Supprimer ce compte ?")) return;
    try { await deleteAdminAccount(accountId); await refreshAdmin(); setMessage("Compte supprimé."); } catch (error) { setMessage(error.message); }
  }
  async function issueResetKey(accountId) {
    try {
      const account = accounts.find((item) => item.id === accountId);
      const result = await createPasswordResetKey(accountId);
      setResetKey(result.key);
      setResetAccountEmail(account?.email || "");
      setMessage("Clé créée. Copiez-la et transmettez-la à l'utilisateur.");
    } catch (error) { setMessage(error.message); }
  }
  async function copyKey(value) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Clé copiée dans le presse-papiers.");
    } catch {
      setMessage("Copie automatique impossible. Sélectionnez la clé et copiez-la manuellement.");
    }
  }
  const options = role === "hotel" ? entities.hotels : entities.associations;
  return <main className="app-shell"><header className="topbar"><div><p className="eyebrow">ESPACE ADMINISTRATEUR</p><h1>Gérer les accès</h1></div><button className="logout" onClick={onLogout}>Se déconnecter</button></header><p className="welcome">Bonjour {user.displayName}. Gérez les établissements, comptes et clés.</p><section className="dashboard-grid"><form className="panel admin-form" onSubmit={addEntity}><h2>Ajouter un établissement</h2><label>Type<select value={entityType} onChange={(event) => setEntityType(event.target.value)}><option value="association">Association</option><option value="hotel">Hôtel</option></select></label><label>Nom<input value={entityName} onChange={(event) => setEntityName(event.target.value)} required placeholder="Nom de l'établissement" /></label><button className="primary" type="submit">Ajouter</button></form><form className="panel admin-form" onSubmit={submit}><h2>Créer une clé d'inscription</h2><label>Profil<select value={role} onChange={(event) => { setRole(event.target.value); setEntityId(""); }}><option value="hotel">Hôtel</option><option value="association">Association</option><option value="individual">Particulier</option></select></label>{role !== "individual" && <label>Établissement<select value={entityId} onChange={(event) => setEntityId(event.target.value)} required><option value="">Choisir...</option>{options.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select></label>}<button className="primary" type="submit">Créer la clé</button>{key && <div className="key-box"><label>Clé d'inscription</label><input value={key} readOnly onFocus={(event) => event.target.select()} /><button type="button" onClick={() => copyKey(key)}>Copier la clé</button></div>}</form><section className="panel"><h2>Comptes</h2>{accounts.map((account) => <article key={account.id}><h3>{account.displayName}</h3><p>{account.email} · {account.role}</p>{account.role !== "admin" && <><button type="button" onClick={() => issueResetKey(account.id)}>Générer une clé de réinitialisation</button><button type="button" onClick={() => removeAccount(account.id)}>Supprimer le compte</button></>}</article>)}</section>{resetKey && <section className="panel key-box"><h2>Clé de réinitialisation</h2><p className="muted">Compte : {resetAccountEmail}</p><input value={resetKey} readOnly onFocus={(event) => event.target.select()} /><button type="button" onClick={() => copyKey(resetKey)}>Copier la clé</button></section>}{message && <p className="notice">{message}</p>}</section></main>;
}

function List({ title, items, empty, render, action, actionLabel }) {
  return <section className="panel"><p className="eyebrow">TABLEAU DE BORD</p><h2>{title}</h2>{items.length === 0 ? <p className="muted">{empty}</p> : items.map((item) => <article key={item.id}>{render(item)}{action && <button onClick={() => action(item)}>{actionLabel}</button>}</article>)}</section>;
}

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ offerings: [], distributions: [], pickups: [], requests: [], stock: [] });
  const [message, setMessage] = useState("");
  useEffect(() => { if (localStorage.getItem("anti-gaspi-token")) getCurrentUser().then(setUser).catch(() => localStorage.removeItem("anti-gaspi-token")); }, []);
  async function refresh() {
    const result = { ...data };
    if (user.role === "hotel") result.pickups = await getPendingPickupRequests();
    if (user.role === "association") { result.offerings = await getAvailableOfferings(); result.requests = await getPendingDistributionRequests(); result.stock = await getAssociationStock(); }
    if (user.role === "individual") result.distributions = await getDistributableOfferings();
    setData(result);
  }
  useEffect(() => { if (user) refresh().catch((error) => setMessage(error.message)); }, [user]);
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  if (user.role === "admin") return <AdminScreen user={user} onLogout={() => logoutAccount().then(() => setUser(null))} />;
  async function action(callback, success) { try { await callback(); await refresh(); setMessage(success); } catch (error) { setMessage(error.message); } }
  async function publish(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const availableUntil = new Date(form.availableUntil.value);
    await action(() => createOffering({ productName: form.productName.value, quantity: Number(form.quantity.value), unit: form.unit.value, availableUntil: availableUntil.toISOString().slice(0, 19).replace("T", " "), description: form.description.value }), "Denrée publiée.");
    form.reset();
  }
  const title = user.role === "hotel" ? "Le comptoir des surplus" : user.role === "association" ? "La collecte solidaire" : "Les distributions près de vous";
  return <main className="app-shell"><header className="topbar"><div><p className="eyebrow">ESPACE {user.role.toUpperCase()}</p><h1>{title}</h1></div><button className="logout" onClick={() => logoutAccount().then(() => setUser(null))}>Se déconnecter</button></header><p className="welcome">Bonjour {user.displayName}. Voici votre activité du jour.</p>{message && <p className="notice">{message}</p>}<section className="dashboard-grid">{user.role === "hotel" && <><form className="panel accent-lime" onSubmit={publish}><p className="eyebrow">NOUVELLE ANNONCE</p><h2>Signaler des invendus</h2><input name="productName" required placeholder="Nom du produit" /><input name="quantity" type="number" min="0.01" step="0.01" required placeholder="Quantité" /><input name="unit" required placeholder="Unité : portions, kg..." /><input name="availableUntil" type="datetime-local" required /><textarea name="description" placeholder="Consignes de retrait (facultatif)" /><button className="primary" type="submit">Publier la disponibilité</button></form><List title="Demandes à valider" items={data.pickups} empty="Aucune demande en attente." action={(item) => action(() => completePickupRequest(item.id), "Récupération confirmée.")} actionLabel="Confirmer la récupération" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.associationName}</p></>} /></>}{user.role === "association" && <><List title="Mon stock" items={data.stock} empty="Aucune denrée en stock." render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · Don de {item.hotelName}</p></>} /><List title="Denrées disponibles" items={data.offerings} empty="Aucune denrée disponible." action={(item) => action(() => requestPickup({ offeringId: item.id }), "Demande envoyée à l'hôtel.")} actionLabel="Demander la récupération" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.hotelName}</p></>} /><List title="Retraits à valider" items={data.requests} empty="Aucun retrait en attente." action={(item) => action(() => completeDistributionRequest(item.id), "Remise confirmée.")} actionLabel="Valider la remise" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.individualName}</p><p>{item.contact}</p></>} /></>}{user.role === "individual" && <List title="Distributions proposées" items={data.distributions} empty="Aucune distribution disponible." action={(item) => action(() => requestDistribution({ offeringId: item.id, contact: user.email }), "Demande envoyée à l'association.")} actionLabel="Demander cette denrée" render={(item) => <><h3>{item.productName}</h3><p>{item.quantity} {item.unit} · {item.associationName}</p></>} />}</section></main>;
}

export default App;