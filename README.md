getting started:
cd gymbro
npm install
docker-compose up -d          # start Postgres
cp .env.example .env.local    # fill in AUTH_SECRET + SMTP creds
npm run db:push               # apply schema
npm run db:seed               # seed exercises
npm run dev