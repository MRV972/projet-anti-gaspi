# Anti-gaspillage alimentaire

Application web qui met en relation des **hôtels**, des associations et des particuliers
pour éviter le gaspillage alimentaire.

## Stack technique

- Frontend : React 19, Vite et JavaScript
- Backend : Node.js, Express et MariaDB
- Communication : API REST JSON
- Environnement : Docker Compose

## Démarrage rapide

### Prérequis

1. Installer Docker Desktop.
2. Démarrer Docker Desktop et attendre que Docker Engine soit actif.
3. Ouvrir un terminal dans ce dossier.

Créer le fichier `.env` à partir de `.env.example` si nécessaire, puis lancer :

```powershell
docker compose up -d --build
```

Accès :

- Frontend : <http://localhost:5173>
- API : <http://localhost:5000/api/health>

Voir les logs :

```powershell
docker compose logs -f
```

Arrêter l'application sans supprimer les données :

```powershell
docker compose down
```

Pour réinitialiser complètement la base et rejouer `database/init.sql` :

```powershell
docker compose down -v
docker compose up -d --build
```

### Mettre à jour une base existante

Si les conteneurs ont déjà été lancés avant l'ajout des tables métier, MariaDB
ne rejoue pas automatiquement `database/init.sql`. Les tables `hotels`,
`associations`, `user_accounts`, `food_offerings` et `pickup_requests` n'existent
alors pas encore.

Pour appliquer le schéma sans supprimer les données existantes :

```powershell
Get-Content .\database\init.sql -Raw |
  docker compose exec -T database mariadb -uroot -p"$env:MARIADB_ROOT_PASSWORD" anti_gaspillage
```

Si la variable n'est pas chargée dans PowerShell, utilise le mot de passe
présent dans ton fichier `.env` :

```powershell
Get-Content .\database\init.sql -Raw |
  docker compose exec -T database mariadb -uroot -p"local-root-password" anti_gaspillage
```

Vérifier ensuite les tables :

```powershell
docker compose exec database mariadb -uroot -p"local-root-password" anti_gaspillage -e "SHOW TABLES;"
```

Cette procédure est à utiliser lorsque la base contient déjà des données.
`docker compose down -v` reste réservé à une réinitialisation complète.

## Comptes et espaces par profil

L'application propose trois espaces protégés par session :

- **Hôtel** : publier des denrées et confirmer les demandes de récupération ;
- **Association** : consulter les denrées, demander une récupération et confirmer
  la remise au particulier ;
- **Particulier** : consulter les distributions et demander une denrée.

Depuis l'écran de connexion, choisir **Créer un compte**. Un hôtel ou une
association doit fournir l'identifiant de son établissement dans la base. Un
particulier est lié à son nom et à son email. Les mots de passe sont hachés côté
backend et le jeton de session est conservé dans le navigateur pour restaurer la
connexion après rechargement.

## Fonctionnalité disponible : dons des hôtels

Le premier flux métier est disponible :

1. Un hôtel publie une denrée avec une quantité, une unité et une date limite.
2. Une association consulte les denrées encore disponibles.
3. Elle envoie une demande de récupération.
4. L'hôtel valide la demande de récupération de l'association.
5. La denrée passe à l'état `collected` et devient disponible pour une distribution.
6. Un particulier consulte les denrées récupérées et demande une distribution.
7. L'association valide ensuite la remise de la denrée au particulier.

### Données de test

Pour tester les profils, créer un hôtel et une association dans MariaDB :

```sql
INSERT INTO hotels (name) VALUES ('Hôtel des Lumières');
INSERT INTO associations (name) VALUES ('Association du Quartier');
```

Les identifiants générés sont à saisir dans le formulaire frontend. Le schéma
fournit également automatiquement une denrée d'exemple :

```text
Plateaux-repas végétariens · 12 portions · Hôtel des Lumières
```

Elle apparaît dans la liste des denrées disponibles.

Quatre autres exemples sont également ajoutés :

- 8 barquettes de salades fraîches ;
- 15 pains assortis ;
- 10 kg de fruits de saison ;
- 20 portions de desserts lactés.

Quatre denrées supplémentaires préfixées par `TEST -` sont disponibles pour
tester rapidement le parcours complet sans utiliser les autres données :

- 10 portions de lasagnes végétariennes ;
- 6 paniers de fruits ;
- 8 litres de soupes maison ;
- 14 sandwichs frais.

### API

#### Publier une denrée

`POST /api/offerings`

```json
{
  "hotelId": 1,
  "productName": "Plats préparés",
  "quantity": 20,
  "unit": "portions",
  "availableUntil": "2026-12-01T22:00:00",
  "description": "À récupérer dans la chambre froide"
}
```

#### Consulter les denrées disponibles

`GET /api/offerings`

#### Demander une récupération

`POST /api/pickup-requests`

```json
{
  "offeringId": 1,
  "associationId": 1,
  "message": "Nous pouvons passer à 19h."
}
```

#### Confirmer une récupération

`PATCH /api/pickup-requests/:requestId/complete`

Cette action rend la denrée visible dans les distributions proposées aux
particuliers.

#### Consulter les distributions

`GET /api/distributions/offerings`

#### Demander une distribution

`POST /api/distributions/requests`

```json
{
  "offeringId": 1,
  "individualName": "Camille Martin",
  "contact": "camille@example.com",
  "message": "Je peux venir demain."
}
```

#### Confirmer le retrait par le particulier

`PATCH /api/distributions/requests/:requestId/complete`

Cette action fait passer la demande du particulier de `pending` à `fulfilled`.
Le retrait est alors enregistré comme terminé.

Dans l'interface, l'association retrouve une fiche complète dans **Retraits à
valider** : produit, quantité, association, nom et contact du particulier.
Elle confirme ensuite la remise avec le bouton **Valider la remise au
particulier**.

Toutes les valeurs envoyées par l'API sont validées et les requêtes SQL utilisent
des paramètres préparés. Les contrôles d'identité et les rôles utilisateurs seront
ajoutés lors de la prochaine étape.

## Organisation du code

```text
frontend/src/
  components/   composants React réutilisables
  pages/         futures pages métier
  services/      appels à l'API
  hooks/         futurs hooks React
backend/src/
  config/        connexion MariaDB
  controllers/  logique des requêtes HTTP
  routes/       définition des routes REST
  middlewares/  gestion des erreurs
  models/       futurs modèles métier
  services/     futurs services métier
database/
  init.sql       schéma initial MariaDB
```

## Travail en équipe

- Créer une branche par fonctionnalité.
- Ne jamais committer `.env` ou de vrais mots de passe.
- Mettre à jour `database/init.sql` lorsqu'une table évolue.
- Tester le build frontend avec `npm run build` depuis `frontend/`.
- Vérifier la syntaxe backend avec `node --check` sur les fichiers modifiés.
