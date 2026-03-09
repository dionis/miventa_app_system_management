# MiVenta SaaS Platform

## Database Setup
This project uses a custom PostgreSQL database schema for the SaaS management platform. Since a custom authentication strategy with JWT is used throughout the application, the local `profiles` table stores user logins instead of relying on external authentication providers or Supabase standard `auth.users`.

### Initializing the Database
You must run the complete `database/schema.sql` script in your PostgreSQL database (e.g. from the Supabase SQL Editor or your chosen database client) **before** running the applications. 
If you only run the INSERT statements without applying the table definitions, you might see errors like `column "email" of relation "profiles" does not exist`.

### Seed Users (Development & Testing)
The `schema.sql` file includes default users (seeds) at the end of the file so you can log in immediately after setting up the database. 

**Admin Account:**
- **Email:** `admin@miempresa.com`
- **Password:** `admin123`
- **Role:** `admin`

**Customer Account:**
- **Email:** `cliente@ejemplo.com`
- **Password:** `admin123`
- **Role:** `customer`
