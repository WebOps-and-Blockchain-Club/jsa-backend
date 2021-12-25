# Backend for Job Aggregator Website

An API endpoints of Job Data and User Management for Job Aggregator Website

# Setup

1. Download the [PostgreSQL](https://www.postgresql.org/) or Run `docker-compose up -d` to run database via docker
2. Create a Database (This step is not necessary if your are using docker)
3. Add the `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT` value in `.env` (If your using docker, value for these would be `localhost`, `admin`, `jsa`, `secret`, `5432`)
4. To install the packages, run `yarn install`
5. To start the server in development mode, run `yarn dev`
6. To start the server in production mode, run `yarn build` and `yarn start`

# Guide to use API

| URI | HTTP Method | Inputs | Description                 |
| --- | ----------- | ------ | --------------------------- |
| /   | GET         | null   | To ensure server is running |
