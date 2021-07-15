import { Pool } from 'pg';

export default new Pool({
  user: "postgres",
  password: "6402",
  host: "localhost",
  port: 3000,
  database: "dogimages"
})