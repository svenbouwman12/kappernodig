# Admin Panel Setup Guide

## Database Setup

### 1. Run Database Migrations

Voer eerst de database migraties uit:

```sql
-- Voer deze SQL uit in je Supabase SQL Editor:

-- Migratie 0026: Reviews tabel
-- (De SQL uit supabase/migrations/0026_create_reviews_table.sql)

-- Migratie 0027: Ontbrekende kolommen toevoegen
-- (De SQL uit supabase/migrations/0027_add_missing_review_columns.sql)

-- Migratie 0029: Admin setup
-- (De SQL uit supabase/migrations/0029_setup_admin_users.sql)
```

### 2. Admin Account Aanmaken

#### Optie A: Via Supabase Auth UI (Aanbevolen)

1. **Ga naar je Supabase Dashboard**
2. **Klik op "Authentication" > "Users"**
3. **Klik op "Add user"**
4. **Vul in:**
   - Email: `admin@kappernodig.nl`
   - Password: `admin123` (of een veilig wachtwoord)
5. **Klik "Create user"**
6. **Kopieer de User ID** uit de user details
7. **Ga naar SQL Editor en voer uit:**

```sql
SELECT create_admin_profile('USER_ID_HIER', 'admin@kappernodig.nl', 'Admin');
```

#### Optie B: Bestaande User Promoten

Als je al een user hebt, kun je die promoten naar admin:

```sql
SELECT promote_to_admin('bestaande@email.com');
```

### 3. Test Admin Login

1. **Ga naar `/admin/login`**
2. **Login met je admin credentials**
3. **Je zou nu toegang moeten hebben tot het admin panel**

## Admin Panel Features

### Dashboard
- Overzicht van alle statistieken
- Recente activiteit
- Alerts voor reviews in behandeling

### Kappers Beheer
- Bekijk alle kappersaccounts
- Bewerk kapper gegevens
- Verwijder kappers
- Bekijk kapperszaken per kapper

### Klanten Beheer
- Bekijk alle klantaccounts
- Bekijk boekingsgeschiedenis
- Bekijk review geschiedenis
- Bewerk klant gegevens

### Kapperszaken Beheer
- Bekijk alle kapperszaken
- Bewerk kapperszaak gegevens
- Bekijk diensten en reviews
- Verwijder kapperszaken

### Boekingen Beheer
- Bekijk alle afspraken
- Filter op datum/status
- Markeer afspraken als voltooid
- Annuleer afspraken

### Diensten Beheer
- Bekijk alle diensten
- Bewerk dienst gegevens
- Verwijder diensten
- Bekijk per kapperszaak

### Reviews Beheer
- Bekijk alle reviews
- Filter op status (in behandeling, goedgekeurd, spam)
- Goedkeuren/afwijzen van reviews
- Spam detectie scores bekijken

## Troubleshooting

### Kan niet inloggen als admin?
1. Controleer of de user `role: 'admin'` heeft in de profiles tabel
2. Controleer of de user actief is (`is_active: true`)
3. Controleer of de user bestaat in auth.users

### Geen data zichtbaar?
1. Controleer of de RLS policies correct zijn ingesteld
2. Controleer of je admin permissions hebt op alle tabellen
3. Controleer of er data in de tabellen staat

### Reviews niet zichtbaar?
1. Controleer of reviews `is_published: true` en `is_approved: true` hebben
2. Controleer de spam scores
3. Gebruik de review filters in het admin panel

## Veiligheid

- Wijzig het standaard admin wachtwoord
- Gebruik sterke wachtwoorden
- Beperk admin toegang tot vertrouwde IP-adressen (optioneel)
- Monitor admin activiteit regelmatig

## Support

Voor vragen of problemen, controleer:
1. Browser console voor errors
2. Supabase logs voor database errors
3. Network tab voor API call failures
