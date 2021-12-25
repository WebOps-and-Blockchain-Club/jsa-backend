# Backend for Job Aggregator Website

An API endpoints of Job Data and User Management for Job Aggregator Website

# Setup

1. Download the [PostgreSQL](https://www.postgresql.org/)
2. Create a Database
3. Add the `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT` value in `.env`
4. To install the packages, run `yarn install`
5. To start the server in development mode, run `yarn dev`
6. To start the server in production mode, run `yarn build` and `yarn start`

# Guide to use API

| URI | HTTP Method | Inputs | Description                 |
| --- | ----------- | ------ | --------------------------- |
| /   | GET         | null   | To ensure server is running |
